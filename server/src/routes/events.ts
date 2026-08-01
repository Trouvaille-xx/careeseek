import type { FastifyInstance } from 'fastify';
import { getUserByToken } from '../auth.js';

/**
 * 埋点事件白名单（仅枚举名 + 数字/枚举 props，禁 PII/自由文本）。
 * 服务端硬校验：未知事件名或 props 含非白名单字符串 → 400。
 */

/** 允许的数字 props key（每个事件可带） */
const NUMERIC_PROPS = new Set([
  'step', 'duration_ms', 'rounds', 'score', 'count', 'total_duration_ms', 'error_type', 'template',
]);

/** 允许的枚举字符串 props（值也必须在此集合内） */
const ENUM_PROPS: Record<string, Set<string>> = {
  mode: new Set(['real', 'learning']),
  source: new Set(['builder', 'final', 'finalResume']),
  status: new Set(['applied', 'interview', 'offer', 'rejected', 'pending', 'active']),
  from: new Set(['applied', 'interview', 'offer', 'rejected', 'pending', 'draft', 'active']),
  to: new Set(['applied', 'interview', 'offer', 'rejected', 'pending', 'draft', 'active']),
  reason: new Set(['quota', 'login']),
  plan: new Set(['free', 'pro', 'power']),
  is_first: new Set(['yes', 'no']),
  template: new Set(['classic', 'modern', 'compact']),
};

/** 事件名白名单 */
const EVENT_NAMES = new Set([
  'app_open', 'llm_error',
  'input_submit', 'analysis_step_started', 'analysis_step_completed', 'analysis_step_failed', 'analysis_completed',
  'interview_started', 'interview_completed', 'export_pdf', 'export_json', 'optimization_edited',
  'application_created', 'application_status_changed', 'resume_draft_saved',
  'paywall_shown', 'upgrade_click', 'checkout_started', 'plan_changed',
]);

interface RawEvent { name?: unknown; props?: unknown; ts?: unknown }

function validateEvent(e: RawEvent): { name: string; props: Record<string, number | string>; ts: number } | null {
  if (typeof e.name !== 'string' || !EVENT_NAMES.has(e.name)) return null;
  const props: Record<string, number | string> = {};
  const raw = (e.props ?? {}) as Record<string, unknown>;
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'number' && Number.isFinite(v) && NUMERIC_PROPS.has(k)) {
      props[k] = v;
    } else if (typeof v === 'string' && ENUM_PROPS[k]?.has(v)) {
      props[k] = v;
    } else {
      return null; // 未知 key 或非白名单值 → 整个事件拒绝
    }
  }
  const ts = typeof e.ts === 'number' ? Math.floor(e.ts) : Date.now();
  return { name: e.name, props, ts };
}

export function attachEventsRoutes(app: FastifyInstance): void {
  app.post('/v1/events', async (req, reply) => {
    const user = getUserByToken(app.db, req);
    if (!user) return reply.status(401).send({ error: '未登录' });

    const body = (req.body ?? {}) as { events?: unknown };
    if (!Array.isArray(body.events) || body.events.length === 0 || body.events.length > 100) {
      return reply.status(400).send({ error: 'events 必须是 1-100 条的数组' });
    }

    const sessionId = ((req.headers['x-session-id'] as string | undefined) ?? '').slice(0, 64);
    const stmt = app.db.prepare(
      'INSERT INTO events (user_id, session_id, name, props_json, ts) VALUES (?, ?, ?, ?, ?)'
    );
    const insertAll = app.db.transaction((valid: { name: string; props: Record<string, number | string>; ts: number }[]) => {
      for (const ev of valid) {
        stmt.run(user.id, sessionId, ev.name, JSON.stringify(ev.props), ev.ts);
      }
    });

    const valid: { name: string; props: Record<string, number | string>; ts: number }[] = [];
    for (const raw of body.events) {
      const v = validateEvent(raw as RawEvent);
      if (v) valid.push(v);
    }
    // 全部无效 → 400；部分有效 → 存入库有效部分（宽松处理）
    if (valid.length === 0) {
      return reply.status(400).send({ error: '事件内容不符合白名单要求' });
    }
    insertAll(valid);
    return reply.status(204).send();
  });
}
