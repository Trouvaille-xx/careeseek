import type Database from 'better-sqlite3';
import type { FastifyRequest } from 'fastify';
import { computeCost } from './pricing.js';

const UPSTREAM_BASE_URL = process.env.UPSTREAM_BASE_URL ?? 'https://api.deepseek.com/v1';
const UPSTREAM_API_KEY = process.env.UPSTREAM_API_KEY ?? '';
/**
 * 上游请求超时。默认 240s：前端默认输出上限 16384 token、重试时 32768，
 * 按实测约 200 token/秒，32768 需约 160 秒，必须留出余量。
 * 注意必须小于前端 apiService 的 API_TIMEOUT_MS（250s），否则代理会先被前端掐断。
 */
const PROXY_TIMEOUT_MS = Number(process.env.PROXY_TIMEOUT_MS ?? 240000);
/** 额外上游请求头：JSON 格式，如 {"x-opencode-session":"uuid"}（OpenCode Go 网关需要） */
const UPSTREAM_EXTRA_HEADERS: Record<string, string> | undefined = (() => {
  const raw = process.env.UPSTREAM_EXTRA_HEADERS;
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'string') out[k] = v;
    }
    return Object.keys(out).length > 0 ? out : undefined;
  } catch {
    return undefined;
  }
})();

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

export interface ProxyOptions {
  /** 用户自备 API Key（BYOK 透传），未提供则用服务端 UPSTREAM_API_KEY */
  userApiKey?: string;
  /** 用户自备 Base URL（BYOK），未提供则用服务端 UPSTREAM_BASE_URL */
  userBaseUrl?: string;
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
 *
 * BYOK 模式：用户自备 Key 时用其 Key 上游调用，cost_cent 计为 0（用户自付上游费用）。
 */
export async function proxyChat(
  db: Database.Database,
  userId: string,
  body: unknown,
  options: ProxyOptions = {},
  onStreamChunk?: (chunk: string) => Promise<void> | void
): Promise<{ status: number; body: string; stream: boolean }> {
  const started = Date.now();
  const userApiKey = options.userApiKey?.trim() || '';
  const userBaseUrl = options.userBaseUrl?.trim().replace(/\/+$/, '') || '';
  const isByok = userApiKey.length > 0;

  const effectiveBaseUrl = userBaseUrl || UPSTREAM_BASE_URL;
  const effectiveKey = isByok ? userApiKey : UPSTREAM_API_KEY;
  const upstreamUrl = `${effectiveBaseUrl}/chat/completions`;

  // MiniMax 上游默认开启思考，强制关闭（与对话"非思考模式"约定一致）
  const upstreamBody = effectiveBaseUrl.includes('minimax.chat')
    ? { ...(body as Record<string, unknown>), thinking: { type: 'disabled' } }
    : body;

  if (!effectiveKey) {
    throw new ProxyError(401, '代理未配置 API Key，且请求未携带用户 Key');
  }

  const res = await fetch(upstreamUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${effectiveKey}`,
      // OpenCode Go 网关强制要求 x-opencode-session（会话路由身份），缺失报 400 MissingSessionID
      ...(UPSTREAM_EXTRA_HEADERS as Record<string, string> | undefined),
    },
    body: JSON.stringify(upstreamBody),
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
    recordUsage(db, userId, model, usage, started, isByok);
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
  recordUsage(db, userId, model, usage, started, isByok);
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
  started: number,
  isByok: boolean
): void {
  // BYOK 用户自付上游费用，代理侧不计费（仅记账用于统计面板）
  const costCent = isByok
    ? 0
    : computeCost({
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

/** 从 FastifyRequest 头里提取 BYOK 选项（大小写不敏感） */
export function readByokHeaders(req: FastifyRequest): ProxyOptions {
  const h = req.headers;
  const get = (k: string) => {
    const v = h[k.toLowerCase()];
    if (typeof v === 'string') return v;
    if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
    return undefined;
  };
  return {
    userApiKey: get('x-user-api-key'),
    userBaseUrl: get('x-user-base-url'),
  };
}
