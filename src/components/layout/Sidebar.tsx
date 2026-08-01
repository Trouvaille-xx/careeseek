import React, { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { SettingsDialog } from './SettingsDialog';

interface SidebarProps {
  onNewAnalysis: () => void;
}

export function Sidebar({ onNewAnalysis }: SidebarProps) {
  const { currentStep } = useAppStore();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <nav className="w-64 border-r border-slate-200 bg-white flex flex-col shrink-0">
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
            onClick={() => useAppStore.getState().setCurrentStep(0)}
          />
          <MenuItem
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
            label="简历库"
            active={currentStep === -1}
            onClick={() => useAppStore.getState().setCurrentStep(-1)}
          />
          <MenuItem
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.688c0-.547.305-1.051.793-1.306l7.5-3.938a1.5 1.5 0 011.414 0l7.5 3.938c.488.255.793.759.793 1.306v6.626a1.5 1.5 0 01-.793 1.306l-7.5 3.938a1.5 1.5 0 01-1.414 0L3.793 16.62A1.5 1.5 0 013 15.314V8.688ZM3 8.25l9 4.5m0 0l9-4.5m-9 4.5V21" />
              </svg>
            }
            label="投递跟踪"
            active={currentStep === -3}
            onClick={() => useAppStore.getState().setCurrentStep(-3)}
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
            onClick={() => useAppStore.getState().setCurrentStep(-2)}
          />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Settings */}
        <div className="p-3 border-t border-slate-100">
          <MenuItem
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            label="设置"
            active={false}
            onClick={() => setSettingsOpen(true)}
          />
        </div>
      </nav>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
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
          ? 'bg-primary-50 text-primary-600 font-medium'
          : disabled
          ? 'text-slate-300 cursor-not-allowed'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="text-sm font-medium truncate flex-1 text-left">{label}</span>
      {badge && <span className="text-[10px] text-slate-300 ml-auto shrink-0">{badge}</span>}
    </button>
  );
}
