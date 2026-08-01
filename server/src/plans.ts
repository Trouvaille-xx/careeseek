import type Database from 'better-sqlite3';

/** 套餐定义（静态配置）。token_limit 为月配额（所有 LLM 调用累计 token）。 */
export interface Plan {
  id: 'free' | 'pro' | 'power';
  name: string;
  /** 价格，单位：分（人民币） */
  priceCny: number;
  tokenLimit: number;
}

export const PLANS: Record<Plan['id'], Plan> = {
  free: { id: 'free', name: '免费版', priceCny: 0, tokenLimit: 100_000 },
  pro: { id: 'pro', name: 'Pro', priceCny: 1900, tokenLimit: 3_000_000 },
  power: { id: 'power', name: 'Power', priceCny: 4900, tokenLimit: 10_000_000 },
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

/** 配额校验：返回 { ok, used, limit } */
export function checkQuota(db: Database.Database, userId: string, planId: Plan['id'], now = Date.now()): { ok: boolean; used: number; limit: number } {
  const plan = PLANS[planId] ?? PLANS.free;
  const used = monthTokensUsed(db, userId, now);
  return { ok: used < plan.tokenLimit, used, limit: plan.tokenLimit };
}
