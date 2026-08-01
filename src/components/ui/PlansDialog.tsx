import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/Button';
import { track } from '@/services/tracker';
import type { PlanId } from '@/types';

/** 套餐展示（含购买流程） */
export function PlansDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { plans, auth, fetchPlans, checkout, pollPayment } = useAppStore();
  const [payingPlan, setPayingPlan] = useState<PlanId | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<{ payment_id: string; pay_mode: string } | null>(null);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) void fetchPlans();
  }, [open, fetchPlans]);

  useEffect(() => {
    if (!paymentInfo || paid) return;
    const t = setInterval(async () => {
      try {
        const status = await pollPayment(paymentInfo.payment_id);
        if (status === 'paid') {
          setPaid(true);
          clearInterval(t);
          track('plan_changed', { plan: payingPlan ?? 'free' });
          setTimeout(onClose, 1500);
        } else if (status === 'expired' || status === 'closed') {
          setError('订单已过期，请重新下单');
          setPaymentInfo(null);
          setPayingPlan(null);
          clearInterval(t);
        }
      } catch (e) {
        setError((e as Error).message);
        clearInterval(t);
      }
    }, 3000);
    return () => clearInterval(t);
  }, [paymentInfo, paid, pollPayment, onClose, payingPlan]);

  if (!open) return null;

  const handleBuy = async (plan: PlanId) => {
    setError(null);
    if (!auth.token) {
      track('paywall_shown', { reason: 'login' });
      useAppStore.getState().setCurrentStep(-5);
      onClose();
      return;
    }
    try {
      track('upgrade_click', { plan });
      track('checkout_started', { plan });
      const info = await checkout(plan);
      setPayingPlan(plan);
      setPaymentInfo(info);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-slate-200 dark:border-neutral-700 w-full max-w-3xl mx-4 max-h-[88vh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between px-6 pt-6 pb-0 shrink-0">
          <h2 className="text-base font-semibold text-slate-900 dark:text-neutral-100">
            {paid ? '开通成功' : paymentInfo ? '扫码支付' : '选择套餐'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors dark:hover:bg-neutral-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {paid ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-emerald-600 dark:text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <p className="text-sm text-slate-600 dark:text-neutral-300">套餐已生效，额度已刷新</p>
            </div>
          ) : paymentInfo ? (
            <div className="text-center py-4">
              <p className="text-sm text-slate-600 dark:text-neutral-300 mb-4">
                {paymentInfo.pay_mode === 'mock'
                  ? '演示模式：点击下方按钮模拟支付完成'
                  : '请使用微信扫描二维码完成支付'}
              </p>
              <div className="w-48 h-48 mx-auto rounded-xl border-2 border-dashed border-slate-300 dark:border-neutral-600 flex items-center justify-center mb-4 bg-slate-50 dark:bg-neutral-900">
                <svg className="w-16 h-16 text-slate-300 dark:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5zM13.5 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" />
                </svg>
              </div>
              {paymentInfo.pay_mode === 'mock' && (
                <Button size="md" onClick={() => pollPayment(paymentInfo.payment_id).then((s) => { if (s === 'paid') { setPaid(true); track('plan_changed', { plan: payingPlan ?? 'free' }); setTimeout(onClose, 1200); } })}>
                  模拟支付完成
                </Button>
              )}
              <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-3">订单 15 分钟内有效，支付后自动刷新额度</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 text-xs px-3 py-2 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300">{error}</div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {plans.map((p) => {
                  const isCurrent = auth.user?.plan === p.id;
                  const isFree = p.id === 'free';
                  return (
                    <div
                      key={p.id}
                      className={`rounded-2xl border p-6 flex flex-col transition-all ${
                        isCurrent
                          ? 'border-primary-400 bg-primary-50/50 dark:border-primary-600 dark:bg-primary-900/20'
                          : 'border-slate-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-600'
                      }`}
                    >
                      <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100">{p.name}</h3>
                      <div className="mt-2 mb-4">
                        <span className="text-2xl font-bold text-slate-900 dark:text-neutral-100">
                          ¥{p.price_cny === 0 ? '0' : (p.price_cny / 100).toFixed(0)}
                        </span>
                        {p.price_cny > 0 && <span className="text-xs text-slate-400">/月</span>}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-neutral-400 mb-6 flex-1">
                        {isFree
                          ? '注册即用，体验核心功能'
                          : p.id === 'pro'
                          ? '求职季标准用量，多岗位并行分析'
                          : '重度用户，无限次迭代优化'}
                        <br />
                        <span className="text-slate-400">{(p.point_limit / 1000).toFixed(0)} 积分/月</span>
                      </p>
                      {isCurrent ? (
                        <Button variant="outline" size="md" disabled>当前套餐</Button>
                      ) : isFree ? (
                        <Button variant="ghost" size="md" onClick={() => useAppStore.getState().setCurrentStep(-5)}>去登录</Button>
                      ) : (
                        <Button size="md" loading={payingPlan === p.id} onClick={() => handleBuy(p.id)}>
                          {auth.token ? '立即开通' : '登录后开通'}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-4 text-center">
                简历数据始终保存在本地浏览器，套餐仅包含云端 AI 算力额度
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** 402 配额超限时的升级引导弹窗 */
export function UpgradeDialog({ quota, onClose }: { quota: { used: number; limit: number; plan: string } | null; onClose: () => void }) {
  const [openPlans, setOpenPlans] = useState(false);
  useEffect(() => {
    if (quota) track('paywall_shown', { reason: 'quota' });
  }, [quota]);
  if (!quota) return null;
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-slate-200 dark:border-neutral-700 w-full max-w-md mx-4 p-8 animate-slide-up">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-neutral-100 text-center mb-2">本月额度已用完</h3>
          <p className="text-sm text-slate-500 dark:text-neutral-400 text-center mb-2">
            当前套餐 {quota?.plan ?? '免费版'} 已用 {quota?.used ?? 0} / {quota?.limit ?? 0} 积分
          </p>
          <p className="text-xs text-slate-400 dark:text-neutral-500 text-center mb-6">升级套餐即可继续使用，或等下一自然月额度重置</p>
          <div className="flex justify-center gap-3">
            <Button variant="ghost" size="md" onClick={onClose}>知道了</Button>
            <Button size="md" onClick={() => setOpenPlans(true)}>升级套餐</Button>
          </div>
        </div>
      </div>
      <PlansDialog open={openPlans} onClose={() => setOpenPlans(false)} />
    </>
  );
}
