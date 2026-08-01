import React from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { THEME_OPTIONS } from '@/utils/theme';

interface SidebarProps {
  onNewAnalysis: () => void;
}

export function Sidebar({ onNewAnalysis }: SidebarProps) {
  const { currentStep, themeMode, setThemeMode, auth, plans, setCurrentStep } = useAppStore();
  const planName = plans.find((p) => p.id === auth.user?.plan)?.name;

  return (
    <nav className="w-52 border-r border-slate-200 bg-white flex flex-col shrink-0 dark:border-neutral-800 dark:bg-neutral-950">
        {/* Menu items */}
        <div className="flex flex-col gap-0.5 p-3">
          <MenuItem
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            label="简历分析"
            active={currentStep >= 0}
            onClick={() => setCurrentStep(0)}
          />
          <MenuItem
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
            label="简历库"
            active={currentStep === -1}
            onClick={() => setCurrentStep(-1)}
          />
          <MenuItem
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.688c0-.547.305-1.051.793-1.306l7.5-3.938a1.5 1.5 0 011.414 0l7.5 3.938c.488.255.793.759.793 1.306v6.626a1.5 1.5 0 01-.793 1.306l-7.5 3.938a1.5 1.5 0 01-1.414 0L3.793 16.62A1.5 1.5 0 013 15.314V8.688ZM3 8.25l9 4.5m0 0l9-4.5m-9 4.5V21" />
              </svg>
            }
            label="投递跟踪"
            active={currentStep === -3}
            onClick={() => setCurrentStep(-3)}
          />
          <MenuItem
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="模拟面试"
            active={currentStep === -2}
            onClick={() => setCurrentStep(-2)}
          />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Account / user area */}
        <div className="p-3 border-t border-slate-100 dark:border-neutral-700">
          {auth.user ? (
            <div className="px-3 py-2">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-neutral-700 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">
                    {auth.user.email[0]?.toUpperCase() ?? '?'}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-700 dark:text-neutral-200 truncate">{auth.user.email}</p>
                  <p className="text-[10px] text-slate-400 dark:text-neutral-500">{planName ?? '免费版'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <button
                  onClick={() => setCurrentStep(-4)}
                  className="flex-1 text-[11px] px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-neutral-700/60 text-slate-600 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-600 transition-colors"
                >
                  账户
                </button>
                <button
                  onClick={() => { void useAppStore.getState().logout(); }}
                  className="flex-1 text-[11px] px-2 py-1.5 rounded-lg text-slate-500 dark:text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                >
                  退出
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCurrentStep(-5)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-neutral-400 dark:hover:bg-neutral-700/60 dark:hover:text-neutral-200 transition-all"
            >
              <span className="shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </span>
              <span className="text-sm font-medium flex-1 text-left">登录</span>
            </button>
          )}
        </div>

        {/* Settings */}
        <div className="p-3 border-t border-slate-100 dark:border-neutral-700 flex flex-col gap-2">
          <div className="px-3 flex items-center justify-between">
            <span className="text-xs text-slate-400 dark:text-neutral-500">主题</span>
          </div>
          <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5 dark:bg-neutral-700/60">
            {THEME_OPTIONS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setThemeMode(t.value)}
                className={`flex-1 px-1 py-1.5 rounded-md text-xs transition-colors ${
                  themeMode === t.value
                    ? 'bg-white text-slate-900 font-medium shadow-sm dark:bg-neutral-600 dark:text-neutral-100'
                    : 'text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <MenuItem
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            label="设置"
            active={currentStep === -4}
            onClick={() => useAppStore.getState().setCurrentStep(-4)}
          />
        </div>
      </nav>
  );
}

function MenuItem({
  icon,
  label,
  active,
  disabled,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  disabled?: boolean;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-150 ${
        active
          ? 'bg-primary-50 text-primary-600 font-medium dark:bg-neutral-700 dark:text-neutral-100'
          : disabled
          ? 'text-slate-300 cursor-not-allowed dark:text-neutral-600'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-neutral-400 dark:hover:bg-neutral-700/60 dark:hover:text-neutral-200'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="text-sm font-medium truncate flex-1 text-left">{label}</span>
      {badge && <span className="text-[10px] text-slate-300 ml-auto shrink-0">{badge}</span>}
    </button>
  );
}
