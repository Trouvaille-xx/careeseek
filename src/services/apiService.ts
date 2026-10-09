import { useAppStore } from '@/stores/useAppStore';
import { getProxyBase } from '@/stores/useAppStore';
import { stripThinkTags } from '@/utils/text';

/**
 * 单次请求的网络超时。
 * 必须大于后端代理的上游超时（server/src/proxy.ts 的 PROXY_TIMEOUT_MS，默认 240s），
 * 否则额度放大后请求会在代理返回结果前先被前端自己掐断。
 */
const API_TIMEOUT_MS = 250000;
const MAX_ATTEMPTS = 2;
/**
 * 默认输出上限。长 JSON 步骤（第 6/7 步）要输出 6-8 条长文本对照，
 * 且推理 token（实测单次 2500+）也计入 completion —— 原来的 4096 必然被截断。
 * 实测生成速度约 200 token/秒，16384 约需 80 秒；模型侧上限为 384K，远未触顶。
 */
const DEFAULT_MAX_TOKENS = 16384;
/** 重试时的输出上限：首次被截断时放大再试一次 */
const RETRY_MAX_TOKENS = 32768;
/** 上游明确拒绝该 max_tokens 时的退守值（不同厂商对上限的判定不同） */
const FALLBACK_MAX_TOKENS = 16384;

/**
 * 判断上游是否因 max_tokens 过大而拒绝请求。
 * 各厂商措辞不一：max_tokens / maximum output / completion tokens / too large 等。
 */
function isMaxTokensRejection(status: number, body: string): boolean {
  if (status !== 400 && status !== 422) return false;
  return /max_?tokens?|max(imum)?\s*(output|completion)|too\s+large|output\s+limit|exceed/i.test(body);
}

/**
 * 云端积分（托管）模式的默认模型。
 * 必须与上游可用模型名、以及 server/src/pricing.ts 的 MODEL_PRICING 键保持一致：
 * 曾经硬编码为 MiniMax-M3，而部署上游（OpenCode Go）只提供 deepseek-*，
 * 导致托管模式每次请求都被上游拒绝（401 Model is not supported）。
 * 部署时可用 VITE_HOSTED_MODEL 覆盖。
 */
const HOSTED_MODEL =
  (import.meta.env.VITE_HOSTED_MODEL as string | undefined) || 'deepseek-v4-flash';

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
      model: HOSTED_MODEL,
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
      max_tokens: extra.max_tokens ?? DEFAULT_MAX_TOKENS,
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

/**
 * 从被截断的 JSON 数组中抢救出「已经写完整」的对象，丢弃最后那个不完整的。
 * 用于第 6/7 步这类长数组输出被输出上限截断的场景，避免整步失败。
 */
function salvageArrayObjects(text: string): string | null {
  const start = text.indexOf('[');
  if (start < 0) return null;
  const items: string[] = [];
  let depth = 0;
  let inString = false;
  let escaped = false;
  let itemStart = -1;
  for (let i = start + 1; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') {
      if (depth === 0) itemStart = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && itemStart >= 0) {
        items.push(text.slice(itemStart, i + 1));
        itemStart = -1;
      }
    }
  }
  if (items.length === 0) return null;
  return `[${items.join(',')}]`;
}

/**
 * 模型有时会把数组包一层对象（如 {"optimizationItems": [...]}），而调用方期待裸数组。
 * 仅当对象只有一个属性且该属性是数组时才拆包，避免误伤正常的多字段对象输出。
 */
export function unwrapSingleArrayProperty(value: unknown): unknown {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return value;
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 1 && Array.isArray(entries[0][1])) return entries[0][1];
  return value;
}

export function extractJSON(text: string): string {
  // 先剥掉思维链标签（<think>...</think> / ```think ... ```），它们不属于 JSON
  const cleaned = stripCodeFences(stripThinkTags(text));
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {
    // 顶层是数组（匹配表/追问/优化等步骤）→ 数组整体优先，避免被内部的 { } 误导
    const trimmed = cleaned.trim();
    if (trimmed.startsWith('[')) {
      const lastBracket = trimmed.lastIndexOf(']');
      if (lastBracket > 0) {
        const span = trimmed.slice(0, lastBracket + 1);
        try {
          JSON.parse(span);
          return span;
        } catch {
          /* 数组自身不完整，继续尝试抢救 */
        }
      }
      const salvaged = salvageArrayObjects(trimmed);
      if (salvaged) return salvaged;
    }
    // 优先取最后一个 { 到文本末尾（JSON 通常在结尾，避免误取前置 think 内容里的花括号）
    const tailMatch = cleaned.match(/\{[\s\S]*\}$/);
    if (tailMatch) {
      try {
        JSON.parse(tailMatch[0]);
        return tailMatch[0];
      } catch {
        /* 继续尝试更宽的匹配 */
      }
    }
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        JSON.parse(arrayMatch[0]);
        return arrayMatch[0];
      } catch {
        /* 继续 */
      }
    }
    const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      try {
        JSON.parse(match[0]);
        return match[0];
      } catch {
        /* 继续兜底 */
      }
    }
    // 最后兜底：文本里嵌着被截断的数组（含对象包裹数组的情况）→ 抢救已完整的元素
    const salvagedAny = salvageArrayObjects(cleaned);
    if (salvagedAny) return salvagedAny;
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

  // 上游若拒绝当前上限，用它退守到更保守的值（而不是整步失败）
  let maxTokensOverride: number | undefined;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const maxTokens =
      maxTokensOverride ?? (attempt === 1 ? DEFAULT_MAX_TOKENS : RETRY_MAX_TOKENS);
    try {
      // 首次用默认上限；重试时放大输出上限，规避长 JSON 步骤被截断
      const res = await chatCompletion(messages, { max_tokens: maxTokens });
      if (!res.ok) {
        const err = await res.text().catch(() => res.statusText);
        const error = new Error(`API 错误 (${res.status}): ${err.slice(0, 200)}`);
        if (isMaxTokensRejection(res.status, err) && maxTokens > FALLBACK_MAX_TOKENS) {
          console.warn(
            `[careeseek] 上游拒绝 max_tokens=${maxTokens}，退守 ${FALLBACK_MAX_TOKENS} 重试`
          );
          maxTokensOverride = FALLBACK_MAX_TOKENS;
          continue;
        }
        if (isRetryableError(error, res.status) && attempt < MAX_ATTEMPTS) {
          continue;
        }
        throw error;
      }
      const data = await res.json();
      const choice = data.choices?.[0];
      const content: string = choice?.message?.content || '';
      const finishReason: string | undefined = choice?.finish_reason;
      try {
        return unwrapSingleArrayProperty(JSON.parse(extractJSON(content))) as T;
      } catch {
        if (attempt < MAX_ATTEMPTS) {
          console.warn(
            `[careeseek] JSON 解析失败（finish_reason=${finishReason ?? '未知'}），提高输出上限后重试`
          );
          continue;
        }
        const hint = finishReason === 'length'
          ? '（模型输出被截断，已达到输出上限；请减少条目数量或缩短输入）'
          : '';
        throw new Error(`无法解析 LLM 响应为 JSON${hint}: ${content.slice(0, 200)}`);
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
