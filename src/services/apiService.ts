import { useAppStore } from '@/stores/useAppStore';
import { getProxyBase } from '@/stores/useAppStore';
import { stripThinkTags } from '@/utils/text';

const API_TIMEOUT_MS = 90000;
const MAX_ATTEMPTS = 2;

/** 配额超限错误（402）——全局升级引导用 */
export class QuotaExceededError extends Error {
  quota: { used: number; limit: number; plan: string };
  constructor(message: string, quota: { used: number; limit: number; plan: string }) {
    super(message);
    this.name = 'QuotaExceededError';
    this.quota = quota;
  }
}

function isRetryableError(e: unknown, status?: number): boolean {
  if (status !== undefined) return status >= 500;
  if (e instanceof DOMException && e.name === 'AbortError') return true;
  return e instanceof TypeError; // 网络错误 (Failed to fetch)
}

/**
 * 决定请求目标与鉴权方式（依据设置页的 AI 模式）：
 * - points 模式（云端积分）：登录 → 走托管代理（getProxyBase()/chat/completions，Bearer 会话 token），按积分计费
 * - byok 模式（自备 Key）：
 *   - 已登录 → 走代理透传 key（X-User-Api-Key 头），仅记账不计费，便于统计面板
 *   - 未登录 → 直连上游（不走代理，无任何统计/配额）
 */
function resolveEndpoint(): { url: string; headers: Record<string, string>; model: string } {
  const { auth, apiSettings } = useAppStore.getState();
  const hasKey = Boolean(apiSettings.apiKey?.trim());
  // 已登录但未配置 API Key → 自动走云端积分模式（无需手动切换）
  if (apiSettings.aiMode === 'points' || (auth.token && !hasKey)) {
    if (!auth.token) {
      throw new Error('请先登录以使用云端积分（设置 → AI 设置 → 切换为积分模式）');
    }
    return {
      url: `${getProxyBase()}/chat/completions`,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${auth.token}` },
      model: 'MiniMax-M3',
    };
  }
  if (!apiSettings.apiKey) {
    throw new Error('请先在设置中配置 API Key，或切换到云端积分模式（登录即可）');
  }
  const baseUrl = apiSettings.baseUrl.replace(/\/+$/, '');
  // 已登录 BYOK → 经代理透传 key（仅记账不计费）
  if (auth.token) {
    return {
      url: `${getProxyBase()}/chat/completions`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`,
        'X-User-Api-Key': apiSettings.apiKey,
        'X-User-Base-Url': baseUrl,
      },
      model: apiSettings.model || 'gpt-4o',
    };
  }
  // 未登录 BYOK → 直连上游（无任何统计/配额）
  return {
    url: `${baseUrl}/chat/completions`,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiSettings.apiKey}` },
    model: apiSettings.model || 'gpt-4o',
  };
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = API_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function chatCompletion(
  messages: { role: string; content: string }[],
  extra: { temperature?: number; max_tokens?: number; stream?: boolean } = {}
): Promise<Response> {
  const { url, headers, model } = resolveEndpoint();

  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature: extra.temperature ?? 0.3,
      max_tokens: extra.max_tokens ?? 4096,
      ...(extra.stream ? { stream: true } : {}),
    }),
  });

  if (res.status === 402) {
    const data = await res.json().catch(() => ({}));
    const quota = (data as { quota?: { used: number; limit: number; plan: string } }).quota ?? { used: 0, limit: 0, plan: 'free' };
    useAppStore.getState().setQuotaError(quota);
    throw new QuotaExceededError(
      (data as { error?: string }).error || '本月额度已用完，请升级套餐',
      quota
    );
  }

  // 登录态下，调用成功后异步刷新配额（让 UI 实时反映最新积分），
  // 800ms 节流，避免多次并发请求时反复打 /me。
  const state = useAppStore.getState();
  if (state.auth.token && res.ok) {
    const now = Date.now();
    if (now - lastQuotaRefreshMs > 800) {
      lastQuotaRefreshMs = now;
      void state.refreshAuth().catch(() => { /* 静默：配额刷新失败不影响主流程 */ });
    }
  }

  return res;
}

let lastQuotaRefreshMs = 0;

export async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await chatCompletion(messages);
      if (!res.ok) {
        const err = await res.text().catch(() => res.statusText);
        const error = new Error(`API 错误 (${res.status}): ${err.slice(0, 200)}`);
        if (isRetryableError(error, res.status) && attempt < MAX_ATTEMPTS) {
          continue;
        }
        throw error;
      }
      const data = await res.json();
      return stripThink(data.choices?.[0]?.message?.content || '');
    } catch (e) {
      if (isRetryableError(e as Error) && attempt < MAX_ATTEMPTS) {
        continue;
      }
      throw e;
    }
  }
  throw new Error('请求失败');
}

/**
 * 剥掉响应首尾的 markdown 代码块围栏，保留内容中的围栏。
 * 支持 ```json、```、```javascript 等围栏形式。
 */
export function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```[a-zA-Z0-9-]*\s*\n?([\s\S]*?)\n?```$/);
  if (fenceMatch) return fenceMatch[1].trim();
  return trimmed;
}

/**
 * 剥掉 <think>...</think> 思维链块（含代码围栏变体 ```think ... ```）。
 * 即便请求里设了 thinking.disabled，MiniMax 等模型仍可能泄漏思维链文本到 content，
 * 这里在所有文本返回前统一剥掉，保证 UI / JSON 解析不被干扰。
 */
export function stripThink(text: string): string {
  if (!text) return '';
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/```(?:think|reasoning|reason)\s*\n?[\s\S]*?\n?```/gi, '')
    .replace(/<think>[\s\S]*$/gi, '')
    .trim();
}

export function extractJSON(text: string): string {
  // 先剥掉思维链标签（<think>...</think> / ```think ... ```），它们不属于 JSON
  const cleaned = stripCodeFences(stripThinkTags(text));
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {
    // 优先取最后一个 { 到文本末尾（JSON 通常在结尾，避免误取前置 think 内容里的花括号）
    const tailMatch = cleaned.match(/\{[\s\S]*\}$/);
    if (tailMatch) return tailMatch[0];
    const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) return match[0];
    throw new Error(`无法解析 LLM 响应为 JSON: ${cleaned.slice(0, 200)}`);
  }
}

export async function callLLMWithJSON<T>(systemPrompt: string, userPrompt: string): Promise<T> {
  const messages = [
    {
      role: 'system',
      content: `${systemPrompt}\n\n你必须以纯 JSON 格式输出，不要包含 markdown 代码块标记或额外说明。直接输出 JSON 对象。`,
    },
    { role: 'user', content: userPrompt },
  ];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await chatCompletion(messages);
      if (!res.ok) {
        const err = await res.text().catch(() => res.statusText);
        const error = new Error(`API 错误 (${res.status}): ${err.slice(0, 200)}`);
        if (isRetryableError(error, res.status) && attempt < MAX_ATTEMPTS) {
          continue;
        }
        throw error;
      }
      const data = await res.json();
      const content: string = data.choices?.[0]?.message?.content || '';
      try {
        return JSON.parse(extractJSON(content)) as T;
      } catch {
        if (attempt < MAX_ATTEMPTS) continue;
        throw new Error(`无法解析 LLM 响应为 JSON: ${content.slice(0, 200)}`);
      }
    } catch (e) {
      if (isRetryableError(e as Error) && attempt < MAX_ATTEMPTS) {
        continue;
      }
      throw e;
    }
  }
  throw new Error('请求失败');
}

/**
 * 流式调用：把 SSE delta 文本逐段传给 onChunk。返回完整拼接文本。
 * 仅对网络错误/5xx 做一次重试；解析失败抛错由调用方处理。
 */
export async function callLLMStream(
  systemPrompt: string,
  userPrompt: string,
  onChunk: (delta: string) => void
): Promise<string> {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await chatCompletion(messages, { stream: true });
      if (!res.ok) {
        const err = await res.text().catch(() => res.statusText);
        const error = new Error(`API 错误 (${res.status}): ${err.slice(0, 200)}`);
        if (isRetryableError(error, res.status) && attempt < MAX_ATTEMPTS) {
          continue;
        }
        throw error;
      }
      if (!res.body) throw new Error('当前 API 不支持流式响应');

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]') continue;
          try {
            const json = JSON.parse(payload);
            const delta: string = json.choices?.[0]?.delta?.content ?? '';
            if (delta) {
              full += delta;
              onChunk(delta);
            }
          } catch {
            // 忽略无法解析的 SSE 行
          }
        }
      }
      return full;
    } catch (e) {
      if (isRetryableError(e as Error) && attempt < MAX_ATTEMPTS) {
        continue;
      }
      throw e;
    }
  }
  throw new Error('请求失败');
}

export interface InterviewUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  /** 仅积分模式下计算：floor((prompt+completion)/100)，至少 1；BYOK 时为 0（不计费） */
  costPoints: number;
  /** 是否为 BYOK 透传（不计费但仍记录） */
  isByok: boolean;
}

export async function callLLMForInterview(
  systemPrompt: string,
  messageHistory: { role: 'system' | 'user' | 'assistant'; content: string }[]
): Promise<{ response: string; usage: InterviewUsage | null }> {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...messageHistory,
  ];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await chatCompletion(messages, { temperature: 0.5, max_tokens: 1024 });
      if (!res.ok) {
        const err = await res.text().catch(() => res.statusText);
        const error = new Error(`API 错误 (${res.status}): ${err.slice(0, 200)}`);
        if (isRetryableError(error, res.status) && attempt < MAX_ATTEMPTS) {
          continue;
        }
        throw error;
      }
      const data = await res.json();
      const response = stripThink(data.choices?.[0]?.message?.content || '');
      const usage = parseUsageForInterview(data.usage);
      return { response, usage };
    } catch (e) {
      if (isRetryableError(e as Error) && attempt < MAX_ATTEMPTS) {
        continue;
      }
      throw e;
    }
  }
  throw new Error('请求失败');
}

/** 从 OpenAI 兼容 usage 计算成本（与服务器 plans.ts 规则一致：1 积分 = 100 token，BYOK 不计费） */
function parseUsageForInterview(raw: unknown): InterviewUsage | null {
  if (!raw || typeof raw !== 'object') return null;
  const u = raw as Record<string, unknown>;
  const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);
  const prompt_tokens = num(u.prompt_tokens);
  const completion_tokens = num(u.completion_tokens);
  const total_tokens = num(u.total_tokens) || prompt_tokens + completion_tokens;
  const isByok = !useAppStore.getState().auth.token
    ? false
    : Boolean(useAppStore.getState().apiSettings.apiKey?.trim());
  const costPoints = isByok ? 0 : (total_tokens > 0 ? Math.max(1, Math.floor(total_tokens / 100)) : 0);
  return { prompt_tokens, completion_tokens, total_tokens, costPoints, isByok };
}
