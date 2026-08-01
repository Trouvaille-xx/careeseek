import React from 'react';

export function TopNav() {
  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center px-6 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <span className="text-base font-semibold text-slate-900">CareeSeek</span>
        <span className="text-xs text-slate-400 hidden sm:inline">你的简历助手</span>
      </div>
    </header>
  );
}
