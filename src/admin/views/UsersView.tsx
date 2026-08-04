import { useCallback, useEffect, useState } from 'react';
import {
  ApiError, getUsers, patchUser, type AdminUser,
} from '../api';

interface Props {
  onUnauthorized: () => void;
}

const PLANS = ['free', 'pro', 'power'];

function fmtTime(ts: number | null): string {
  if (!ts) return '—';
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function UsersView({ onUnauthorized }: Props) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [plan, setPlan] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState('');

  const load = useCallback(async (query: string, planFilter: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await getUsers(query, planFilter);
      setUsers(data.users);
      setTotal(data.total);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return onUnauthorized();
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized]);

  useEffect(() => {
    void load(q, plan);
  }, [load, q, plan]);

  const changePlan = async (u: AdminUser, newPlan: string) => {
    setSavingId(u.id);
    try {
      await patchUser(u.id, { plan: newPlan });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, plan: newPlan } : x)));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return onUnauthorized();
      alert(e instanceof Error ? e.message : '更新失败');
    } finally {
      setSavingId('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索邮箱"
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
        >
          <option value="">全部套餐</option>
          {PLANS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <span className="text-sm text-slate-400 self-center">共 {total} 个用户</span>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {loading && !error && <p className="text-slate-400 text-sm">加载中...</p>}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
              <th className="px-4 py-2.5">邮箱</th>
              <th className="px-4 py-2.5">套餐</th>
              <th className="px-4 py-2.5">本月积分</th>
              <th className="px-4 py-2.5">角色</th>
              <th className="px-4 py-2.5">注册时间</th>
              <th className="px-4 py-2.5">最近活跃</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-2.5 text-slate-700">{u.email}</td>
                <td className="px-4 py-2.5">
                  <select
                    value={u.plan}
                    disabled={savingId === u.id}
                    onChange={(e) => void changePlan(u, e.target.value)}
                    className="px-2 py-1 border border-slate-200 rounded-md text-xs bg-white focus:outline-none"
                  >
                    {PLANS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2.5 text-slate-500">{u.points_used_month}</td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded-md text-xs ${u.role === 'admin' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-slate-500">{fmtTime(u.created_at)}</td>
                <td className="px-4 py-2.5 text-slate-500">{fmtTime(u.last_seen)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
