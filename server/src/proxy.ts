import type Database from 'better-sqlite3';
import { computeCost } from './pricing.js';

const UPSTREAM_BASE_URL = process.env.UPSTREAM_BASE_URL ?? 'https://api.deepseek.com/v1';
const UPSTREAM_API_KEY = process.env.UPSTREAM_API_KEY ?? '';
const PROXY_TIMEOUT_MS = Number(process.env.PROXY_TIMEOUT_MS ?? 95000);

export class ProxyError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface UsageRecord {
  promptTokens: number;
  completionTokens: number;
  promptCacheHitTokens: number;
  promptCacheMissTokens: number;
}

/** 从 OpenAI 兼容响应中提取 usage（容错：字段可能缺失） */
function parseUsage(usage: unknown): UsageRecord {
  const u = (usage ?? {}) as Record<string, unknown>;
  const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);
  const promptTokens = num(u.prompt_tokens);
  const completionTokens = num(u.completion_tokens);
  const hit = num(u.prompt_cache_hit_tokens);
  // cache miss = 总输入 - 命中（缺失时按全部未命中算）
  const miss = promptTokens - hit;
  return { promptTokens, completionTokens, promptCacheHitTokens: hit, promptCacheMissTokens: Math.max(0, miss) };
}

/**
 * 转发一次 LLM 调用并记账。
 * - 非流式：返回 JSON 响应（含 usage），写 llm_usage
 * - 流式：SSE 逐段透传，结束后按响应 usage 写 llm_usage
 * 请求体不落盘。
 */
export async function proxyChat(
  db: Database.Database,
  userId: string,
  body: unknown,
  onStreamChunk?: (chunk: string) => Promise<void> | void
): Promise<{ status: number; body: string; stream: boolean }> {
  const started = Date.now();
  const upstreamUrl = `${UPSTREAM_BASE_URL}/chat/completions`;

  const res = await fetch(upstreamUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${UPSTREAM_API_KEY}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new ProxyError(res.status, `上游错误 ${res.status}: ${errText.slice(0, 200)}`);
  }

  const model = ((body as Record<string, unknown>)?.model ?? 'unknown') as string;

  // 流式：读全文（SSE 事件体），结束时解析 usage
  if (res.headers.get('content-type')?.includes('text/event-stream')) {
    const full = await res.text();
    const usage = parseUsage(extractStreamUsage(full));
    recordUsage(db, userId, model, usage, started);
    return { status: 200, body: full, stream: true };
  }

  const text = await res.text();
  let usage: UsageRecord = { promptTokens: 0, completionTokens: 0, promptCacheHitTokens: 0, promptCacheMissTokens: 0 };
  try {
    const json = JSON.parse(text) as Record<string, unknown>;
    usage = parseUsage(json.usage);
  } catch {
    // 响应非 JSON（异常情况），不记账但正常透传
  }
  recordUsage(db, userId, model, usage, started);
  return { status: 200, body: text, stream: false };
}

/** 从 SSE 文本中找最后一个 data: {...usage...} 事件 */
function extractStreamUsage(ssText: string): unknown {
  const lines = ssText.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line.startsWith('data:')) continue;
    const payload = line.slice(5).trim();
    if (payload === '[DONE]') continue;
    try {
      const obj = JSON.parse(payload) as Record<string, unknown>;
      if (obj.usage) return obj.usage;
    } catch {
      // 跳过非 JSON 行
    }
  }
  return null;
}

function recordUsage(
  db: Database.Database,
  userId: string,
  model: string,
  u: UsageRecord,
  started: number
): void {
  const costCent = computeCost({
    model,
    promptCacheHitTokens: u.promptCacheHitTokens,
    promptCacheMissTokens: u.promptCacheMissTokens,
    completionTokens: u.completionTokens,
  });
  db.prepare(
    `INSERT INTO llm_usage
      (user_id, model, prompt_tokens, completion_tokens, prompt_cache_hit_tokens, prompt_cache_miss_tokens, cost_cent, latency_ms, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    userId, model, u.promptTokens, u.completionTokens,
    u.promptCacheHitTokens, u.promptCacheMissTokens, costCent,
    Date.now() - started, Date.now()
  );
}
