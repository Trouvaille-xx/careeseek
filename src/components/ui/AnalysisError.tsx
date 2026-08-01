import React from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/Button';

/** 分析步骤失败时的统一错误提示（重试 / 去设置） */
export function AnalysisError({ step }: { step: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-slate-900 dark:text-neutral-100 mb-1">分析失败</p>
      <p className="text-xs text-slate-500 dark:text-neutral-400 mb-6">请检查 API 配置（厂商、Key、模型）是否可用，或稍后重试</p>
      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm" onClick={() => useAppStore.getState().setAnalysisStatus(step, 'loading')}>
          重试
        </Button>
        <Button variant="outline" size="sm" onClick={() => useAppStore.getState().setCurrentStep(-4)}>
          去设置
        </Button>
      </div>
    </div>
  );
}
