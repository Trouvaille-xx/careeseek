import React, { useRef, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PlansDialog } from '@/components/ui/PlansDialog';
import { THEME_OPTIONS } from '@/utils/theme';
import type { OptimizationStyle } from '@/types';

const STORAGE_KEY = 'careeseek-storage';

/** OpenAI 兼容接口的常见模型厂商（可自定义） */
const PRESET_PROVIDERS: { name: string; url: string }[] = [
  { name: 'OpenAI', url: 'https://api.openai.com/v1' },
  { name: 'DeepSeek', url: 'https://api.deepseek.com/v1' },
  { name: '通义千问（阿里云百炼）', url: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
  { name: '智谱 GLM', url: 'https://open.bigmodel.cn/api/paas/v4' },
  { name: 'Kimi（月之暗面）', url: 'https://api.moonshot.cn/v1' },
  { name: 'OpenRouter', url: 'https://openrouter.ai/api/v1' },
];

const STYLE_META: { key: OptimizationStyle; label: string; desc: string }[] = [
  { key: 'default', label: '标准', desc: '平衡的优化力度' },
  { key: 'concise', label: '简洁', desc: '精简表达，突出关键信息' },
  { key: 'less-exaggerated', label: '少夸张', desc: '避免过度包装，保留原意' },
  { key: 'ai-product', label: 'AI 产品向', desc: '侧重 AI 产品经历的表达' },
  { key: 'tob-saas', label: '企业服务向', desc: '侧重 B 端业务价值表达' },
];

type SettingsTab = 'account' | 'ai' | 'preferences' | 'data';

const TABS: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
  {
    key: 'account',
    label: '账户',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    key: 'ai',
    label: 'AI 设置',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
      </svg>
    ),
  },
  {
    key: 'preferences',
    label: '偏好',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
  },
  {
    key: 'data',
    label: '数据管理',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    ),
  },
];

export function SettingsPage() {
  const { apiSettings, setApiSettings, testApiConnection, optimizationStyle, setOptimizationStyle, themeMode, setThemeMode, auth, plans, settingsTab, setSettingsTab, currentWorkspace, workspaceData, userInput, analysisStatus, analysisHistory } = useAppStore();
  const tab = settingsTab as SettingsTab;
  const [local, setLocal] = useState({ ...apiSettings });
  const [customMode, setCustomMode] = useState(
    !PRESET_PROVIDERS.some((p) => p.url === apiSettings.baseUrl)
  );
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [showPlans, setShowPlans] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const planName = plans.find((p) => p.id === auth.user?.plan)?.name ?? '免费版';
  const usedPoints = auth.quota?.used ?? 0;
  const limitPoints = auth.quota?.limit ?? 0;
  const usedPct = limitPoints > 0 ? Math.min(100, Math.round((usedPoints / limitPoints) * 100)) : 0;

  const switchTab = (t: SettingsTab) => {
    setSettingsTab(t);
  };

  const isPresetUrl = !customMode && PRESET_PROVIDERS.some((p) => p.url === local.baseUrl);

  const handleSave = () => {
    setApiSettings(local);
    setFeedback({ kind: 'ok', text: '设置已保存' });
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testApiConnection(local);
    setTestResult(result);
    setTesting(false);
  };

  const handleBackup = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setFeedback({ kind: 'err', text: '没有可备份的数据' });
        return;
      }
      const blob = new Blob([raw], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `careeseek-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setFeedback({ kind: 'ok', text: '备份文件已下载' });
    } catch (e) {
      setFeedback({ kind: 'err', text: '备份失败: ' + (e as Error).message });
    }
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (typeof data !== 'object' || data === null) throw new Error('格式错误');
        const hasBusiness = 'workspaceData' in data || 'userInput' in data || 'currentWorkspace' in data;
        if (!hasBusiness) throw new Error('不是有效的 CareeSeek 备份文件');
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setFeedback({ kind: 'ok', text: '导入成功，正在刷新…' });
        setTimeout(() => window.location.reload(), 800);
      } catch (e) {
        setFeedback({ kind: 'err', text: '导入失败: ' + (e as Error).message });
      }
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    if (!window.confirm('确定清除全部数据？（所有工作区的简历库、投递记录、历史分析、面试记录都将删除，此操作不可恢复）')) return;
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  /**
   * 本地数据体检：数据只存在浏览器里，出问题时用户只能看到「首页空白」。
   * 这里把存储占用、每个工作区各自的分析进度摊开显示，避免只能靠控制台猜。
   */
  const storageDiag = (() => {
    const summarize = (biz: Record<string, unknown>) => {
      const statuses = (biz.analysisStatus ?? {}) as Record<string, string>;
      const input = (biz.userInput ?? {}) as Record<string, string>;
      return {
        doneSteps: [2, 3, 4, 5, 6, 7, 8].filter((n) => statuses[n] === 'done'),
        history: Array.isArray(biz.analysisHistory) ? biz.analysisHistory.length : 0,
        hasJD: Boolean((input.jdContent ?? '').trim()),
        hasResume: Boolean((input.resumeContent ?? '').trim()),
      };
    };
    let sizeKB = 0;
    try {
      sizeKB = Math.round((localStorage.getItem(STORAGE_KEY)?.length ?? 0) / 1024);
    } catch {
      /* 忽略 */
    }
    const rows = [
      {
        name: currentWorkspace,
        current: true,
        ...summarize({ userInput, analysisStatus, analysisHistory } as unknown as Record<string, unknown>),
      },
      ...Object.entries(workspaceData)
        .filter(([name]) => name !== currentWorkspace)
        .map(([name, biz]) => ({
          name,
          current: false,
          ...summarize((biz ?? {}) as Record<string, unknown>),
        })),
    ];
    return { sizeKB, rows };
  })();

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch lg:items-start">
      {/* Left: tab menu（移动端横向滚动，桌面竖排） */}
      <div className="w-full lg:w-52 shrink-0 lg:rounded-xl lg:border lg:border-slate-200 lg:bg-white lg:p-2 dark:border-neutral-700 dark:bg-neutral-800/60">
        <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 -mx-1 px-1 lg:mx-0 lg:px-0 scrollbar-thin">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => switchTab(t.key)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm whitespace-nowrap shrink-0 lg:w-full transition-colors ${
                tab === t.key
                  ? 'bg-primary-50 text-primary-700 font-medium dark:bg-neutral-700 dark:text-neutral-100'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-neutral-400 dark:hover:bg-neutral-700/60 dark:hover:text-neutral-200'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right detail */}
      <div className="flex-1 max-w-2xl">
        {feedback && (
          <div className={`mb-3 text-xs px-3 py-2 rounded-lg ${feedback.kind === 'ok' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
            {feedback.text}
          </div>
        )}
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-neutral-700 dark:bg-neutral-800/60">
          {tab === 'account' && (
            <section className="space-y-5">
              {auth.user ? (
                <>
                  {/* 用户信息 */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-neutral-700 flex items-center justify-center shrink-0">
                      <span className="text-xl font-semibold text-primary-700 dark:text-primary-300">
                        {auth.user.email[0]?.toUpperCase() ?? '?'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100 truncate">{auth.user.email}</h3>
                        <span className="text-[10px] text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-full shrink-0">{planName}</span>
                      </div>
                      <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">已登录 · 云端 AI 服务模式</p>
                    </div>
                  </div>

                  {/* 套餐与额度 */}
                  <div className="rounded-xl bg-slate-50 dark:bg-neutral-900/40 border border-slate-100 dark:border-neutral-800 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-neutral-100">{planName}套餐</p>
                        <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">
                          {auth.user.plan === 'free'
                            ? '免费额度：体验核心分析功能'
                            : '已解锁完整功能与充足额度'}
                        </p>
                      </div>
                      {auth.user.plan !== 'power' && (
                        <Button size="sm" onClick={() => setShowPlans(true)}>
                          {auth.user.plan === 'free' ? '升级套餐' : '套餐详情'}
                        </Button>
                      )}
                      {auth.user.plan === 'power' && (
                        <Button variant="outline" size="sm" onClick={() => setShowPlans(true)}>套餐详情</Button>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-neutral-400">
                      <div className="flex justify-between mb-1.5">
                        <span>本月已用积分</span>
                        <span className={usedPct >= 90 ? 'text-red-500' : 'text-slate-600 dark:text-neutral-300'}>
                          {usedPoints} / {limitPoints} 积分
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-neutral-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${usedPct >= 90 ? 'bg-red-400' : 'bg-primary-500'}`}
                          style={{ width: `${usedPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 隐私说明 */}
                  <div className="flex items-start gap-3 rounded-xl border border-slate-100 dark:border-neutral-800 p-4">
                    <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-300 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-neutral-100">数据隐私</p>
                      <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                        你的简历内容只保存在本机浏览器，不会上传到服务器。云端仅记录用量与匿名统计，不含任何简历内容。
                      </p>
                    </div>
                  </div>

                  {/* 退出 */}
                  <div className="pt-1 border-t border-slate-100 dark:border-neutral-800">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={async () => {
                        if (window.confirm('确定退出登录？退出后 AI 分析将使用自备 API Key 模式。')) {
                          await useAppStore.getState().logout();
                          useAppStore.getState().setCurrentStep(0);
                        }
                      }}
                    >
                      退出登录
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-neutral-700 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-slate-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-neutral-100 mb-1">未登录</p>
                  <p className="text-xs text-slate-400 dark:text-neutral-500 mb-5">登录后使用云端 AI 服务，无需自备 API Key</p>
                  <Button size="md" onClick={() => useAppStore.getState().setCurrentStep(-5)}>
                    登录 / 注册
                  </Button>
                </div>
              )}
            </section>
          )}

          {tab === 'ai' && (
            <section className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100">AI 设置</h3>
              <p className="text-xs text-slate-400 -mt-2">
                选择 AI 服务的接入方式，保存后生效
              </p>

              {/* 模式切换：BYOK / 积分 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setLocal({ ...local, aiMode: 'points' })}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    local.aiMode === 'points'
                      ? 'border-primary-400 bg-primary-50/60 dark:border-primary-600 dark:bg-primary-900/20'
                      : 'border-slate-200 hover:border-slate-300 dark:border-neutral-700 dark:hover:border-neutral-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-primary-600 dark:text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-slate-900 dark:text-neutral-100">云端积分</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
                    登录后按积分消耗，无需 API Key
                    {auth.user && <span className="block mt-1 text-primary-600 dark:text-primary-300">当前 {auth.quota?.used ?? 0} / {auth.quota?.limit ?? 0} 积分</span>}
                  </p>
                </button>
                <button
                  onClick={() => setLocal({ ...local, aiMode: 'byok' })}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    local.aiMode === 'byok'
                      ? 'border-primary-400 bg-primary-50/60 dark:border-primary-600 dark:bg-primary-900/20'
                      : 'border-slate-200 hover:border-slate-300 dark:border-neutral-700 dark:hover:border-neutral-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-primary-600 dark:text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                    </svg>
                    <span className="text-sm font-medium text-slate-900 dark:text-neutral-100">自备 API Key</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
                    使用你自己的 OpenAI 兼容 Key 直连，不限量
                  </p>
                </button>
              </div>

              {local.aiMode === 'points' && !auth.user && (
                <div className="text-xs px-3 py-2 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  积分模式需要先登录。注册即送 1000 积分（约 1 次完整分析）。
                  <button onClick={() => useAppStore.getState().setCurrentStep(-5)} className="underline ml-1">去登录</button>
                </div>
              )}

              {local.aiMode === 'byok' && (
              <>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300">API 厂商</label>
                <select
                  value={isPresetUrl ? local.baseUrl : '__custom__'}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setCustomMode(true);
                      return;
                    }
                    setCustomMode(false);
                    setLocal({ ...local, baseUrl: e.target.value });
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all duration-150 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100"
                >
                  {PRESET_PROVIDERS.map((p) => (
                    <option key={p.url} value={p.url}>{p.name}</option>
                  ))}
                  <option value="__custom__">自定义 Base URL…</option>
                </select>
                {isPresetUrl && (
                  <p className="text-[11px] text-slate-400 dark:text-neutral-500">Base URL：{local.baseUrl}</p>
                )}
                {!isPresetUrl && (
                  <input
                    autoFocus
                    placeholder="https://api.example.com/v1"
                    value={local.baseUrl}
                    onChange={(e) => {
                      const v = e.target.value;
                      setLocal({ ...local, baseUrl: v });
                      if (PRESET_PROVIDERS.some((p) => p.url === v)) setCustomMode(false);
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all duration-150 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300">API Key</label>
                <div className="flex items-center gap-2">
                  <input
                    type={showKey ? 'text' : 'password'}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all duration-150 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                    placeholder="sk-..."
                    value={local.apiKey}
                    onChange={(e) => setLocal({ ...local, apiKey: e.target.value })}
                  />
                  <button
                    onClick={() => setShowKey((v) => !v)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 dark:hover:bg-neutral-700"
                    title={showKey ? '隐藏' : '显示'}
                  >
                    {showKey ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
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

              <Input
                label="Model"
                placeholder="gpt-4o"
                value={local.model}
                onChange={(e) => setLocal({ ...local, model: e.target.value })}
              />

              <div className="pt-1">
                <Button variant="outline" size="sm" loading={testing} onClick={handleTest}>
                  测试连接
                </Button>
                {testResult && (
                  <div
                    className={`mt-2 text-xs px-3 py-2 rounded-lg ${
                      testResult.success
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    }`}
                  >
                    {testResult.message}
                  </div>
                )}
              </div>
              </>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-neutral-700 flex justify-end">
                <Button variant="primary" size="md" onClick={handleSave}>
                  保存
                </Button>
              </div>
            </section>
          )}

          {tab === 'preferences' && (
            <section className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100">偏好</h3>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300">外观主题</label>
                <p className="text-xs text-slate-400 -mt-1">跟随系统时，切换系统主题会自动生效</p>
                <div className="flex bg-slate-100 rounded-xl p-1 gap-1 dark:bg-neutral-700/60">
                  {THEME_OPTIONS.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setThemeMode(t.value)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                        themeMode === t.value
                          ? 'bg-white text-slate-900 font-medium shadow-sm dark:bg-neutral-600 dark:text-neutral-100'
                          : 'text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300">优化输出风格</label>
                <p className="text-xs text-slate-400 -mt-1">影响简历优化步骤（第 6 步）的改写风格</p>
                <div className="space-y-1.5">
                  {STYLE_META.map((s) => (
                    <label
                      key={s.key}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                        optimizationStyle === s.key
                          ? 'border-primary-300 bg-primary-50/60 dark:border-primary-700 dark:bg-neutral-700/50'
                          : 'border-slate-200 hover:border-slate-300 dark:border-neutral-600 dark:hover:border-neutral-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name="style"
                        checked={optimizationStyle === s.key}
                        onChange={() => setOptimizationStyle(s.key)}
                        className="h-4 w-4 rounded-full border-slate-300 text-primary-600 focus:ring-primary-500/30"
                      />
                      <span className="flex-1">
                        <span className="block text-sm text-slate-800 dark:text-neutral-200">{s.label}</span>
                        <span className="block text-xs text-slate-400">{s.desc}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </section>
          )}

          {tab === 'data' && (
            <section className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100">数据管理</h3>
              <p className="text-xs text-slate-400 -mt-1">
                备份包含全部工作区数据与 API 配置（含 Key），请妥善保管备份文件
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleBackup}>
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  备份数据
                </Button>
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  导入数据
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImport(f);
                    e.target.value = '';
                  }}
                />
                <Button variant="danger" size="sm" onClick={handleClear}>
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                   清除全部数据
                </Button>
              </div>

              {/* 本地数据体检 */}
              <div className="rounded-xl border border-slate-200 dark:border-neutral-700 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-neutral-200">本地数据体检</h4>
                  <span
                    className={
                      storageDiag.sizeKB > 4000
                        ? 'text-xs text-red-600 dark:text-red-300'
                        : 'text-xs text-slate-400'
                    }
                  >
                    已用 {storageDiag.sizeKB} KB（浏览器上限约 5000 KB）
                  </span>
                </div>
                <p className="text-xs text-slate-400 -mt-1">
                  分析内容只存在这台浏览器里。下面按工作区列出各自的分析进度，用于确认数据到底存在哪里。
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-400">
                        <th className="text-left font-medium py-1.5 pr-3">工作区</th>
                        <th className="text-left font-medium py-1.5 pr-3">已完成步骤</th>
                        <th className="text-left font-medium py-1.5 pr-3">历史</th>
                        <th className="text-left font-medium py-1.5">JD / 简历</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storageDiag.rows.map((r) => (
                        <tr key={r.name} className="border-t border-slate-100 dark:border-neutral-700/60">
                          <td className="py-1.5 pr-3 text-slate-700 dark:text-neutral-300">
                            {r.name}
                            {r.current && <span className="ml-1 text-[10px] text-primary-600">当前</span>}
                          </td>
                          <td className="py-1.5 pr-3 text-slate-600 dark:text-neutral-400">
                            {r.doneSteps.length > 0 ? `第 ${r.doneSteps.join('、')} 步` : '无'}
                          </td>
                          <td className="py-1.5 pr-3 text-slate-600 dark:text-neutral-400">{r.history} 条</td>
                          <td className="py-1.5 text-slate-600 dark:text-neutral-400">
                            {r.hasJD ? '有' : '无'} / {r.hasResume ? '有' : '无'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {storageDiag.rows.every((r) => r.doneSteps.length === 0) && (
                  <p className="text-xs text-amber-600 dark:text-amber-300">
                    所有工作区都没有已完成的分析结果：说明要么还没跑过分析，要么此前的写入没有落到本地存储。
                  </p>
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Plans dialog */}
      <PlansDialog open={showPlans} onClose={() => setShowPlans(false)} />
    </div>
  );
}
