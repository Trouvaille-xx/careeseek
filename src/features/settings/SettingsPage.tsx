import React, { useRef, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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

type SettingsTab = 'ai' | 'preferences' | 'data';

const TABS: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
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
  const { apiSettings, setApiSettings, testApiConnection, optimizationStyle, setOptimizationStyle, themeMode, setThemeMode } = useAppStore();
  const [tab, setTab] = useState<SettingsTab>('ai');
  const [local, setLocal] = useState({ ...apiSettings });
  const [customMode, setCustomMode] = useState(
    !PRESET_PROVIDERS.some((p) => p.url === apiSettings.baseUrl)
  );
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="flex gap-6 items-start">
      {/* Left menu */}
      <div className="w-52 shrink-0 rounded-xl border border-slate-200 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-800/60">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
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

      {/* Right detail */}
      <div className="flex-1 max-w-2xl">
        {feedback && (
          <div className={`mb-3 text-xs px-3 py-2 rounded-lg ${feedback.kind === 'ok' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
            {feedback.text}
          </div>
        )}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800/60">
          {tab === 'ai' && (
            <section className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100">AI 设置</h3>
              <p className="text-xs text-slate-400 -mt-2">
                用于所有 AI 分析的 API 配置（OpenAI 兼容接口），未配置 Key 时 AI 功能不可用
              </p>

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
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
