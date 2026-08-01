import React, { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { THEME_OPTIONS } from '@/utils/theme';

interface SidebarProps {
  onNewAnalysis: () => void;
}

export function Sidebar({ onNewAnalysis }: SidebarProps) {
  const { currentStep, themeMode, setThemeMode, auth, plans, setCurrentStep } = useAppStore();
  const [accountOpen, setAccountOpen] = useState(false);
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

        {/* Bottom: account button + settings */}
        <div className="p-3 border-t border-slate-100 dark:border-neutral-700 space-y-2 relative">
          {/* 主题切换 */}
          <div className="px-3">
            <span className="text-[10px] text-slate-400 dark:text-neutral-500">主题</span>
            <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5 mt-1 dark:bg-neutral-700/60">
              {THEME_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setThemeMode(t.value)}
                  className={`flex-1 px-1 py-1 rounded-md text-[11px] transition-colors ${
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

          {/* 账户按钮（ChatGPT 风格：点击弹浮层） */}
          <button
            onClick={() => setAccountOpen((v) => !v)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
          >
            {auth.user ? (
              <>
                <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-neutral-700 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">
                    {auth.user.email[0]?.toUpperCase() ?? '?'}
                  </span>
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-xs font-medium text-slate-700 dark:text-neutral-200 truncate">{auth.user.email}</p>
                  <p className="text-[10px] text-slate-400 dark:text-neutral-500">{planName ?? '免费版'}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-neutral-700 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-slate-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-slate-500 dark:text-neutral-400 flex-1 text-left">登录</span>
              </>
            )}
          </button>

          {/* 账户浮层菜单 */}
          {accountOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setAccountOpen(false)} />
              <div className="absolute bottom-full left-3 right-3 z-40 mb-1 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 shadow-lg shadow-slate-900/10 animate-slide-up overflow-hidden">
                {auth.user ? (
                  <>
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-neutral-700">
                      <p className="text-xs font-medium text-slate-900 dark:text-neutral-100 truncate">{auth.user.email}</p>
                      <span className="inline-block mt-1 text-[10px] text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 px-1.5 py-0.5 rounded-full">
                        {planName} · {auth.quota?.used ?? 0}/{auth.quota?.limit ?? 0} 积分
                      </span>
                    </div>
                    <MenuRow
                      icon={
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      }
                      label="设置"
                      onClick={() => {
                        setAccountOpen(false);
                        setCurrentStep(-4);
                      }}
                    />
                    <MenuRow
                      icon={
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0110.5 3h6a2.25 2.25 0 012.25 2.25v13.5A2.25 2.25 0 0116.5 21h-6a2.25 2.25 0 01-2.25-2.25V15m-3 0l3-3m0 0l3 3m-3-3v12" />
                        </svg>
                      }
                      label="退出登录"
                      danger
                      onClick={() => {
                        setAccountOpen(false);
                        void useAppStore.getState().logout();
                      }}
                    />
                  </>
                ) : (
                  <>
                    <MenuRow
                      icon={
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                      }
                      label="登录 / 注册"
                      onClick={() => {
                        setAccountOpen(false);
                        setCurrentStep(-5);
                      }}
                    />
                    <MenuRow
                      icon={
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      }
                      label="设置"
                      onClick={() => {
                        setAccountOpen(false);
                        setCurrentStep(-4);
                      }}
                    />
                  </>
                )}
              </div>
            </>
          )}
        </div>      </nav>
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

/** 账户浮层菜单行 */
function MenuRow({ icon, label, danger, onClick }: { icon: React.ReactNode; label: string; danger?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
        danger
          ? 'text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
          : 'text-slate-600 hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-neutral-700/60'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
}
