import { useAppStore } from '@/stores/useAppStore';

const API_TIMEOUT_MS = 90000;
const MAX_ATTEMPTS = 2;

function isRetryableError(e: unknown, status?: number): boolean {
  if (status !== undefined) return status >= 500;
  if (e instanceof DOMException && e.name === 'AbortError') return true;
  return e instanceof TypeError; // 网络错误 (Failed to fetch)
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
  const { apiSettings } = useAppStore.getState();

  if (!apiSettings.apiKey) {
    throw new Error('请先在设置中配置 API Key');
  }

  const url = `${apiSettings.baseUrl.replace(/\/+$/, '')}/chat/completions`;

  return fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiSettings.apiKey}`,
    },
    body: JSON.stringify({
      model: apiSettings.model || 'gpt-4o',
      messages,
      temperature: extra.temperature ?? 0.3,
      max_tokens: extra.max_tokens ?? 4096,
      ...(extra.stream ? { stream: true } : {}),
    }),
  });
}

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
      return data.choices?.[0]?.message?.content || '';
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

export function extractJSON(text: string): string {
  const cleaned = stripCodeFences(text);
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {
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

export async function callLLMForInterview(
  systemPrompt: string,
  messageHistory: { role: 'system' | 'user' | 'assistant'; content: string }[]
): Promise<string> {
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
      return data.choices?.[0]?.message?.content || '';
    } catch (e) {
      if (isRetryableError(e as Error) && attempt < MAX_ATTEMPTS) {
        continue;
      }
      throw e;
    }
  }
  throw new Error('请求失败');
}
