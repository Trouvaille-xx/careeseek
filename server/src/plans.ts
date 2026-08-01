import type Database from 'better-sqlite3';

/**
 * 积分制配额。
 * 1 积分 = POINT_RATE 个 token（积分 = token / POINT_RATE，向下取整）。
 * 一次完整分析 ≈ 10 万 token ≈ 1000 积分。
 */
export const POINT_RATE = 100;

/** 套餐定义（静态配置）。pointLimit 为月配额（积分）。 */
export interface Plan {
  id: 'free' | 'pro' | 'power';
  name: string;
  /** 价格，单位：分（人民币） */
  priceCny: number;
  pointLimit: number;
}

export const PLANS: Record<Plan['id'], Plan> = {
  free: { id: 'free', name: '免费版', priceCny: 0, pointLimit: 1000 },
  pro: { id: 'pro', name: 'Pro', priceCny: 1900, pointLimit: 30000 },
  power: { id: 'power', name: 'Power', priceCny: 4900, pointLimit: 100000 },
};

export const PLAN_IDS = Object.keys(PLANS) as Plan['id'][];

/** 当月（自然月）已用 token 数 */
export function monthTokensUsed(db: Database.Database, userId: string, now = Date.now()): number {
  const d = new Date(now);
  const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(prompt_tokens + completion_tokens), 0) AS used
       FROM llm_usage WHERE user_id = ? AND created_at >= ?`
    )
    .get(userId, start) as { used: number };
  return row.used;
}

/** token → 积分（向下取整，至少 1 积分） */
export function tokensToPoints(tokens: number): number {
  return Math.max(1, Math.floor(tokens / POINT_RATE));
}

/** 配额校验：返回 { ok, used, limit }（积分单位） */
export function checkQuota(db: Database.Database, userId: string, planId: Plan['id'], now = Date.now()): { ok: boolean; used: number; limit: number } {
  const plan = PLANS[planId] ?? PLANS.free;
  const usedTokens = monthTokensUsed(db, userId, now);
  const used = tokensToPoints(usedTokens);
  return { ok: used < plan.pointLimit, used, limit: plan.pointLimit };
}
