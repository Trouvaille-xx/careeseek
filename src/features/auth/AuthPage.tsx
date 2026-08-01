import { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { track } from '@/services/tracker';

/** 左侧品牌展示面板（双栏布局用） */
function BrandPanel() {
  return (
    <div className="hidden md:flex w-1/2 relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-900 dark:from-primary-900 dark:via-primary-950 dark:to-neutral-950">
      {/* 装饰：模糊光斑 + 网格 */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary-400/20 blur-3xl" />
      <div className="absolute bottom-0 -left-24 w-80 h-80 rounded-full bg-indigo-400/20 blur-3xl" />
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />

      <div className="relative flex flex-col justify-between p-10 w-full">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-white">CareeSeek</span>
        </div>

        {/* 卖点 */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-white leading-snug">
            一份简历，
            <br />
            对标每一份 JD
          </h1>
          <ul className="space-y-3.5">
            {[
              { t: 'AI 深度解析岗位要求', d: 'JD 定向匹配度评分与逐条诊断' },
              { t: '逐条优化 + 手动可编辑', d: '每条改写附理由与风险提示' },
              { t: '模拟面试 + 投递跟踪', d: '从简历到 offer 全流程陪伴' },
            ].map((item) => (
              <li key={item.t} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center mt-0.5 shrink-0">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{item.t}</p>
                  <p className="text-xs text-white/60 mt-0.5">{item.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* 隐私承诺 */}
        <div className="flex items-center gap-2.5 text-white/70">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
          <span className="text-xs">简历数据仅存本地浏览器，绝不上传服务器</span>
        </div>
      </div>
    </div>
  );
}

export function AuthPage() {
  const { login, register, authLoading, authError, auth, plans, fetchPlans } = useAppStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (mode === 'register' && password !== confirm) {
      setError('两次输入的密码不一致');
      return;
    }
    if (password.length < 8) {
      setError('密码至少 8 位（建议字母+数字）');
      return;
    }
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
        track('app_open', { is_first: 'no' });
      } else {
        await register(email.trim(), password);
        track('app_open', { is_first: 'yes' });
      }
      void fetchPlans();
      // 登录成功后进入工作台
      useAppStore.getState().setCurrentStep(0);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  // 已登录状态显示
  if (auth.token && auth.user) {
    const planName = plans.find((p) => p.id === auth.user?.plan)?.name ?? '免费版';
    return (
      <div className="min-h-full flex animate-fade-in">
        <BrandPanel />
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-end px-8 h-14">
            <button
              onClick={() => useAppStore.getState().setCurrentStep(0)}
              className="px-3 py-1.5 rounded-lg text-sm text-slate-500 dark:text-neutral-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition-colors"
            >
              进入工作台 →
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center px-6 pb-16">
            <div className="w-full max-w-sm">
              <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-slate-200 dark:border-neutral-700 shadow-sm p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-neutral-100 mb-1">已登录</h2>
                <p className="text-sm text-slate-500 dark:text-neutral-400 mb-1">{auth.user.email}</p>
                <span className="inline-block text-xs text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 px-2.5 py-1 rounded-full mb-6">
                  当前套餐：{planName}
                </span>
                <div className="flex justify-center gap-3">
                  <Button variant="outline" size="md" onClick={() => useAppStore.getState().setCurrentStep(-4)}>
                    前往设置
                  </Button>
                  <Button variant="ghost" size="md" onClick={() => useAppStore.getState().logout()}>
                    退出登录
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex animate-fade-in">
      <BrandPanel />

      {/* 右侧：表单 */}
      <div className="flex-1 flex flex-col bg-white dark:bg-neutral-950">
        {/* 顶部：移动端 Logo + 返回 */}
        <div className="flex items-center justify-between px-8 h-14">
          <button
            onClick={() => useAppStore.getState().setCurrentStep(0)}
            className="flex items-center gap-2 md:hidden"
          >
            <div className="w-7 h-7 rounded-lg bg-primary-100 dark:bg-neutral-700 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-600 dark:text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-900 dark:text-neutral-100">CareeSeek</span>
          </button>
          <button
            onClick={() => useAppStore.getState().setCurrentStep(0)}
            className="px-3 py-1.5 rounded-lg text-sm text-slate-500 dark:text-neutral-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition-colors"
          >
            ← 返回首页
          </button>
        </div>

        {/* 表单居中 */}
        <div className="flex-1 flex items-center justify-center px-6 pb-16">
          <div className="w-full max-w-sm">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-neutral-100">
                {mode === 'login' ? '欢迎回来' : '创建账号'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-neutral-400 mt-2">
                {mode === 'login'
                  ? '登录后使用云端 AI 服务，无需自备 API Key'
                  : '注册即送 1000 积分（约 1 次完整分析），无需自备 API Key'}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-100 dark:bg-neutral-800 rounded-xl p-1 gap-1 mb-6">
              {(['login', 'register'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(null); }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                    mode === m
                      ? 'bg-white text-slate-900 font-medium shadow-sm dark:bg-neutral-700 dark:text-neutral-100'
                      : 'text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                  }`}
                >
                  {m === 'login' ? '登录' : '注册'}
                </button>
              ))}
            </div>

            {/* Form */}
            <div className="space-y-4">
              <Input
                label="邮箱"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300">密码</label>
                <div className="flex items-center gap-2">
                  <input
                    type={showKey ? 'text' : 'password'}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all duration-150 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                    placeholder="至少 8 位"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && void handleSubmit()}
                  />
                  <button
                    onClick={() => setShowKey((v) => !v)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 dark:hover:bg-neutral-800"
                    type="button"
                  >
                    {showKey ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.243L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <Input
                  label="确认密码"
                  type="password"
                  placeholder="再次输入密码"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              )}

              {(error || authError) && (
                <div className="text-xs px-3 py-2 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                  {error || authError}
                </div>
              )}

              <Button className="w-full" size="lg" loading={authLoading} onClick={handleSubmit}>
                {mode === 'login' ? '登录' : '注册并开始使用'}
              </Button>

              <p className="text-[11px] text-slate-400 dark:text-neutral-500 text-center leading-relaxed">
                登录仅用于云端 AI 服务配额与用量统计。你的简历数据始终保存在本地浏览器，不会上传到服务器。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
