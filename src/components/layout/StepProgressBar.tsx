import React from 'react';
import { STEPS } from '@/types';

interface StepProgressBarProps {
  currentStep: number;
  stepStatuses: Record<number, 'locked' | 'available' | 'loading' | 'completed'>;
  onStepClick: (step: number) => void;
}

export function StepProgressBar({ currentStep, stepStatuses, onStepClick }: StepProgressBarProps) {
  return (
    <div className="flex items-center gap-0 px-8 py-4 border-b border-slate-100 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      {STEPS.map((step, index) => {
        const status = stepStatuses[step.id] || 'locked';
        const isActive = step.id === currentStep;
        const isClickable = status !== 'locked';
        const isLast = index === STEPS.length - 1;

        let circleContent: React.ReactNode;
        let circleStyle: string;
        let labelStyle: string;
        let lineStyle: string;

        if (status === 'completed') {
          circleContent = (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
          circleStyle = 'bg-primary-600 text-white border-primary-600';
          labelStyle = 'text-primary-600 font-medium';
          lineStyle = 'bg-primary-200';
        } else if (status === 'loading') {
          circleContent = (
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          );
          circleStyle = 'border-2 border-primary-500 border-t-transparent bg-white text-primary-500 animate-pulse dark:bg-neutral-800';
          labelStyle = 'text-primary-600';
          lineStyle = 'bg-slate-200 dark:bg-neutral-700';
        } else if (isActive) {
          circleContent = <span className="text-xs font-bold">{step.id}</span>;
          circleStyle = 'bg-primary-600 text-white border-primary-600';
          labelStyle = 'text-primary-600 font-medium';
          lineStyle = 'bg-slate-200 dark:bg-neutral-700';
        } else if (isClickable) {
          circleContent = <span className="text-xs font-medium text-slate-400">{step.id}</span>;
          circleStyle = 'bg-white text-slate-400 border-slate-300 dark:bg-neutral-800 dark:border-neutral-600';
          labelStyle = 'text-slate-500 dark:text-neutral-400';
          lineStyle = 'bg-slate-200 dark:bg-neutral-600';
        } else {
          circleContent = (
            <svg className="w-3 h-3 text-slate-300 dark:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          );
          circleStyle = 'bg-white text-slate-300 border-slate-200 dark:bg-neutral-800 dark:border-neutral-600';
          labelStyle = 'text-slate-300 dark:text-neutral-600';
          lineStyle = 'bg-slate-100 dark:bg-neutral-700';
        }

        return (
          <React.Fragment key={step.id}>
            <button
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              className={`flex flex-col items-center gap-1.5 min-w-0 ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0 ${circleStyle}`}>
                {circleContent}
              </div>
              <span className={`text-[10px] leading-tight text-center transition-colors duration-200 max-w-14 truncate ${labelStyle}`}>
                {step.label}
              </span>
              {status === 'loading' && (
                <span className="text-[8px] text-primary-400 animate-pulse">分析中...</span>
              )}
            </button>
            {!isLast && (
              <div className={`flex-1 h-px mx-1.5 mt-[-1.25rem] ${lineStyle}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
