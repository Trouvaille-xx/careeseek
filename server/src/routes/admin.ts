import type { FastifyInstance } from 'fastify';
import type Database from 'better-sqlite3';
import { getAdminByToken } from '../auth.js';
import { monthTokensUsed, tokensToPoints, PLANS } from '../plans.js';

/**
 * 管理后台统计接口（仅管理员）。
 * - GET /v1/admin/stats/overview           → 总览数字
 * - GET /v1/admin/stats/trend?days=7|30    → 按天趋势（DAU/请求/token/成本/新增）
 * - GET /v1/admin/stats/funnel?days=30     → 事件漏斗（各步骤完成数/转化）
 * - GET /v1/admin/users?q=&plan=           → 用户列表（含当月积分用量）
 * - PATCH /v1/admin/users/:id              → 调整套餐/角色
 */
export function attachAdminRoutes(app: FastifyInstance): void {
  app.get('/v1/admin/stats/overview', async (req, reply) => {
    const admin = getAdminByToken(app.db, req);
    if (!admin) return reply.status(401).send({ error: '无权限' });

    const db = app.db;
    const now = Date.now();
    const todayStart = startOfDay(now);
    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const totalUsers = scalar(db, 'SELECT COUNT(*) AS c FROM users') as number;
    const newUsersToday = scalar(db, 'SELECT COUNT(*) AS c FROM users WHERE created_at >= ?', todayStart) as number;
    const paidUsers = scalar(db, "SELECT COUNT(*) AS c FROM users WHERE plan != 'free'") as number;

    const revenue = scalar(
      db,
      "SELECT COALESCE(SUM(amount_cny), 0) AS c FROM payments WHERE status = 'paid'"
    ) as number;

    const llmToday = db
      .prepare(
        `SELECT COUNT(*) AS requests, COALESCE(SUM(prompt_tokens + completion_tokens), 0) AS tokens,
                COALESCE(SUM(cost_cent), 0) AS cost_cent
         FROM llm_usage WHERE created_at >= ?`
      )
      .get(todayStart) as { requests: number; tokens: number; cost_cent: number };
    const llmTotal = db
      .prepare(
        `SELECT COUNT(*) AS requests, COALESCE(SUM(prompt_tokens + completion_tokens), 0) AS tokens,
                COALESCE(SUM(cost_cent), 0) AS cost_cent
         FROM llm_usage`
      )
      .get() as { requests: number; tokens: number; cost_cent: number };

    const pointsMonth = tokensToPoints(
      scalar(db, 'SELECT COALESCE(SUM(prompt_tokens + completion_tokens), 0) AS c FROM llm_usage WHERE created_at >= ? AND cost_cent > 0', monthStart.getTime()) as number
    );

    const activeUsers7d = scalar(
      db,
      'SELECT COUNT(DISTINCT user_id) AS c FROM events WHERE ts >= ?',
      now - 7 * 24 * 3600_000
    ) as number;

    return reply.send({
      total_users: totalUsers,
      new_users_today: newUsersToday,
      paid_users: paidUsers,
      active_users_7d: activeUsers7d,
      revenue_cny: revenue,
      llm_today: { requests: llmToday.requests, tokens: llmToday.tokens, cost_cny: llmToday.cost_cent / 100 },
      llm_total: { requests: llmTotal.requests, tokens: llmTotal.tokens, cost_cny: llmTotal.cost_cent / 100 },
      points_consumed_month: pointsMonth,
    });
  });

  app.get('/v1/admin/stats/trend', async (req, reply) => {
    const admin = getAdminByToken(app.db, req);
    if (!admin) return reply.status(401).send({ error: '无权限' });

    const q = req.query as { days?: string };
    const days = Math.min(Math.max(Number(q.days ?? 7) || 7, 1), 60);
    const db = app.db;
    const now = Date.now();

    const llmRows = db
      .prepare(
        `SELECT date(created_at / 1000, 'unixepoch', 'localtime') AS day,
                COUNT(*) AS requests,
                COALESCE(SUM(prompt_tokens + completion_tokens), 0) AS tokens,
                COALESCE(SUM(cost_cent), 0) AS cost_cent
         FROM llm_usage WHERE created_at >= ?
         GROUP BY day ORDER BY day`
      )
      .all(now - days * 24 * 3600_000) as { day: string; requests: number; tokens: number; cost_cent: number }[];

    const dauRows = db
      .prepare(
        `SELECT date(ts / 1000, 'unixepoch', 'localtime') AS day, COUNT(DISTINCT user_id) AS dau
         FROM events WHERE ts >= ?
         GROUP BY day ORDER BY day`
      )
      .all(now - days * 24 * 3600_000) as { day: string; dau: number }[];

    const newUserRows = db
      .prepare(
        `SELECT date(created_at / 1000, 'unixepoch', 'localtime') AS day, COUNT(*) AS new_users
         FROM users WHERE created_at >= ?
         GROUP BY day ORDER BY day`
      )
      .all(now - days * 24 * 3600_000) as { day: string; new_users: number }[];

    const llmMap = new Map(llmRows.map((r) => [r.day, r]));
    const dauMap = new Map(dauRows.map((r) => [r.day, r.dau]));
    const newUserMap = new Map(newUserRows.map((r) => [r.day, r.new_users]));

    const series: { day: string; dau: number; requests: number; tokens: number; cost_cny: number; new_users: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(startOfDay(now) - i * 24 * 3600_000);
      const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const l = llmMap.get(day);
      series.push({
        day,
        dau: dauMap.get(day) ?? 0,
        requests: l?.requests ?? 0,
        tokens: l?.tokens ?? 0,
        cost_cny: (l?.cost_cent ?? 0) / 100,
        new_users: newUserMap.get(day) ?? 0,
      });
    }

    return reply.send({ days, series });
  });

  app.get('/v1/admin/stats/funnel', async (req, reply) => {
    const admin = getAdminByToken(app.db, req);
    if (!admin) return reply.status(401).send({ error: '无权限' });

    const q = req.query as { days?: string };
    const days = Math.min(Math.max(Number(q.days ?? 30) || 30, 1), 90);
    const db = app.db;
    const since = Date.now() - days * 24 * 3600_000;

    // 按事件名统计（events.props_json 提取 step 等数字 prop 不作为主维度，只统计次数）
    const nameRows = db
      .prepare('SELECT name, COUNT(*) AS c FROM events WHERE ts >= ? GROUP BY name ORDER BY c DESC')
      .all(since) as { name: string; c: number }[];

    const stepRows = db
      .prepare(
        `SELECT json_extract(props_json, '$.step') AS step, COUNT(*) AS c
         FROM events WHERE ts >= ? AND name = 'analysis_step_completed'
         GROUP BY step ORDER BY step`
      )
      .all(since) as { step: number | null; c: number }[];

    return reply.send({
      days,
      byName: nameRows,
      analysisStepCompleted: stepRows.map((r) => ({ step: r.step ?? 0, count: r.c })),
    });
  });

  app.get('/v1/admin/users', async (req, reply) => {
    const admin = getAdminByToken(app.db, req);
    if (!admin) return reply.status(401).send({ error: '无权限' });

    const q = req.query as { q?: string; plan?: string; limit?: string; offset?: string };
    const limit = Math.min(Math.max(Number(q.limit ?? 50) || 50, 1), 200);
    const offset = Math.max(Number(q.offset ?? 0) || 0, 0);
    const db = app.db;

    const where: string[] = [];
    const params: unknown[] = [];
    if (q.q?.trim()) {
      where.push('lower(email) LIKE ?');
      params.push(`%${q.q.trim().toLowerCase()}%`);
    }
    if (q.plan && PLANS[q.plan as keyof typeof PLANS]) {
      where.push('plan = ?');
      params.push(q.plan);
    }
    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const users = db
      .prepare(
        `SELECT id, email, plan, plan_expires_at, role, created_at FROM users ${whereSql}
         ORDER BY created_at DESC LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset) as {
      id: string;
      email: string;
      plan: string;
      plan_expires_at: number | null;
      role: string;
      created_at: number;
    }[];

    const total = scalar(db, `SELECT COUNT(*) AS c FROM users ${whereSql}`, ...params) as number;

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const enriched = users.map((u) => {
      const usedTokens = monthTokensUsed(db, u.id);
      const lastSeen = db
        .prepare('SELECT MAX(ts) AS t FROM events WHERE user_id = ?')
        .get(u.id) as { t: number | null };
      return {
        ...u,
        points_used_month: usedTokens > 0 ? tokensToPoints(usedTokens) : 0,
        last_seen: lastSeen.t,
      };
    });

    return reply.send({ total, users: enriched });
  });

  app.patch('/v1/admin/users/:id', async (req, reply) => {
    const admin = getAdminByToken(app.db, req);
    if (!admin) return reply.status(401).send({ error: '无权限' });

    const id = (req.params as { id: string }).id;
    const body = (req.body ?? {}) as { plan?: string; role?: string };
    const db = app.db;

    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id) as { id: string } | undefined;
    if (!user) return reply.status(404).send({ error: '用户不存在' });

    const sets: string[] = [];
    const params: unknown[] = [];
    if (body.plan && PLANS[body.plan as keyof typeof PLANS]) {
      sets.push('plan = ?');
      params.push(body.plan);
    }
    if (body.role === 'admin' || body.role === 'user') {
      sets.push('role = ?');
      params.push(body.role);
    }
    if (sets.length === 0) return reply.status(400).send({ error: '没有可更新的字段' });

    db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...params, id);
    return reply.send({ ok: true });
  });
}

function scalar(db: Database.Database, sql: string, ...params: unknown[]): unknown {
  const row = db.prepare(sql).get(...params) as Record<string, unknown> | undefined;
  if (!row) return 0;
  const keys = Object.keys(row);
  return keys.length > 0 ? row[keys[0]] : 0;
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
