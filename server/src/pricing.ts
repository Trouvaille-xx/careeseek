/**
 * 模型单价表（元/百万 token）。
 * 依据 2026-07 DeepSeek V4 官方峰谷价：高峰时段（9-12 / 14-18 北京时间）价格翻倍。
 * 记账按最高峰全价计算（保守，保毛利）。
 */
export interface ModelPrice {
  /** 缓存命中输入 元/百万 token */
  hit: number;
  /** 缓存未命中输入 元/百万 token */
  miss: number;
  /** 输出 元/百万 token */
  out: number;
  /** 是否适用峰谷翻倍（2026-07 起 DeepSeek V4 生效） */
  peakDouble: boolean;
}

export const MODEL_PRICING: Record<string, ModelPrice> = {
  'deepseek-v4-flash': { hit: 0.02, miss: 1.0, out: 2.0, peakDouble: true },
  'deepseek-v4-pro': { hit: 0.025, miss: 3.0, out: 6.0, peakDouble: true },
  'gpt-4o': { hit: 2.5, miss: 2.5, out: 10.0, peakDouble: false },
  'gpt-4o-mini': { hit: 0.15, miss: 0.15, out: 0.6, peakDouble: false },
};

/** 未知模型按最贵的保守定价，避免漏记账 */
const FALLBACK_PRICE: ModelPrice = { hit: 10, miss: 10, out: 20, peakDouble: false };

/** 北京时间 9:00-12:00 / 14:00-18:00 为高峰 */
export function isPeakHour(ts: number): boolean {
  const d = new Date(ts);
  const h = d.getUTCHours() + 8; // UTC+8
  const hour = ((h % 24) + 24) % 24;
  return (hour >= 9 && hour < 12) || (hour >= 14 && hour < 18);
}

export interface CostInput {
  model: string;
  promptCacheHitTokens: number;
  promptCacheMissTokens: number;
  completionTokens: number;
}

/** 计算成本（分）。成本 = 输入(命中/未命中) + 输出，高峰 ×2。 */
export function computeCost(input: CostInput, now = Date.now()): number {
  const p = MODEL_PRICING[input.model] ?? FALLBACK_PRICE;
  const multiplier = p.peakDouble && isPeakHour(now) ? 2 : 1;
  const yuan =
    (input.promptCacheHitTokens * p.hit +
      input.promptCacheMissTokens * p.miss +
      input.completionTokens * p.out) /
    1_000_000;
  return Math.ceil(yuan * multiplier * 100); // 分，向上取整
}
