import { useEffect, useState } from 'react';
import {
  ApiError, getFunnel, getOverview, getTrend,
  type FunnelData, type Overview, type TrendPoint,
} from '../api';

interface Props {
  onUnauthorized: () => void;
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function fmtCny(n: number): string {
  return `¥${n.toFixed(2)}`;
}

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-xl font-semibold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export function DashboardView({ onUnauthorized }: Props) {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [days, setDays] = useState(7);
  const [error, setError] = useState('');

  useEffect(() => {
    getOverview()
      .then(setOverview)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) return onUnauthorized();
        setError(e instanceof Error ? e.message : '加载失败');
      });
  }, [onUnauthorized]);

  useEffect(() => {
    getTrend(days)
      .then((d) => setTrend(d.series))
      .catch((e) => e instanceof ApiError && e.status === 401 && onUnauthorized());
  }, [days, onUnauthorized]);

  useEffect(() => {
    getFunnel(30)
      .then(setFunnel)
      .catch((e) => e instanceof ApiError && e.status === 401 && onUnauthorized());
  }, [onUnauthorized]);

  if (error) return <p className="text-red-500 text-sm">{error}</p>;
  if (!overview) return <p className="text-slate-400 text-sm">加载中...</p>;

  const maxReq = Math.max(...trend.map((t) => t.requests), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card label="总用户数" value={fmtNum(overview.total_users)} sub={`今日新增 ${overview.new_users_today}`} />
        <Card label="付费用户" value={fmtNum(overview.paid_users)} sub={`近 7 天活跃 ${overview.active_users_7d}`} />
        <Card label="累计收入" value={fmtCny(overview.revenue_cny)} />
        <Card label="本月消耗积分" value={fmtNum(overview.points_consumed_month)} />
        <Card label="今日 LLM 请求" value={fmtNum(overview.llm_today.requests)} sub={`token ${fmtNum(overview.llm_today.tokens)}`} />
        <Card label="今日 LLM 成本" value={fmtCny(overview.llm_today.cost_cny)} />
        <Card label="累计 LLM 请求" value={fmtNum(overview.llm_total.requests)} sub={`token ${fmtNum(overview.llm_total.tokens)}`} />
        <Card label="累计 LLM 成本" value={fmtCny(overview.llm_total.cost_cny)} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-slate-900">近 {days} 天趋势</h2>
          <div className="flex gap-1">
            {[7, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-2.5 py-1 rounded-md text-xs ${
                  days === d ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {d} 天
              </button>
            ))}
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
              <th className="py-2">日期</th>
              <th className="py-2">DAU</th>
              <th className="py-2">新增用户</th>
              <th className="py-2">LLM 请求</th>
              <th className="py-2">token</th>
              <th className="py-2">成本</th>
            </tr>
          </thead>
          <tbody>
            {trend.slice().reverse().map((t) => (
              <tr key={t.day} className="border-b border-slate-50 last:border-0">
                <td className="py-2 text-slate-500 whitespace-nowrap">{t.day}</td>
                <td className="py-2">{t.dau}</td>
                <td className="py-2">{t.new_users}</td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-10">{t.requests}</span>
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full"
                        style={{ width: `${(t.requests / maxReq) * 100}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-2 text-slate-500">{fmtNum(t.tokens)}</td>
                <td className="py-2 text-slate-500">{fmtCny(t.cost_cny)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="font-medium text-slate-900 mb-3">事件漏斗（近 30 天）</h2>
          <table className="w-full text-sm">
            <tbody>
              {funnel?.byName.slice(0, 15).map((e) => (
                <tr key={e.name} className="border-b border-slate-50 last:border-0">
                  <td className="py-1.5 text-slate-500">{e.name}</td>
                  <td className="py-1.5 text-right font-medium">{e.c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="font-medium text-slate-900 mb-3">分析步骤完成数（近 30 天）</h2>
          <table className="w-full text-sm">
            <tbody>
              {funnel?.analysisStepCompleted.map((s) => (
                <tr key={s.step} className="border-b border-slate-50 last:border-0">
                  <td className="py-1.5 text-slate-500">步骤 {s.step}</td>
                  <td className="py-1.5 text-right font-medium">{s.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
