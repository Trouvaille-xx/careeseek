import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AnalysisError } from '@/components/ui/AnalysisError';
import { PageLoading } from '@/components/ui/Spinner';
import type { EvidenceStrength } from '@/types';

const strengthConfig: Record<EvidenceStrength, { label: string; variant: 'green' | 'yellow' | 'orange' | 'red' }> = {
  high: { label: '高', variant: 'green' },
  medium: { label: '中', variant: 'yellow' },
  low: { label: '低', variant: 'orange' },
  none: { label: '无', variant: 'red' },
};

export function MatchingPage() {
  const { matchingRows, analysisStatus } = useAppStore();
  const status = analysisStatus[4];

  if (status === 'loading') {
    return <PageLoading text="AI 正在进行匹配分析..." />;
  }

  if (status === 'error') {
    return <AnalysisError step={4} />;
  }

  if (!matchingRows || matchingRows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-neutral-500 animate-fade-in">
        <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm">暂无匹配分析数据</p>
        <p className="text-xs mt-1">请先在输入页面提交分析</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card padding="lg">
        <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100 mb-5 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-primary-500 rounded-full" />
          JD 匹配度分析
        </h3>

        {/* 桌面端表格 */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-neutral-700">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 dark:text-neutral-400 uppercase tracking-wider">JD 要求</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 dark:text-neutral-400 uppercase tracking-wider w-[100px]">证据强度</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 dark:text-neutral-400 uppercase tracking-wider w-[100px]">是否补充</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 dark:text-neutral-400 uppercase tracking-wider">优化建议</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matchingRows.map((row, idx) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors animate-fade-in" style={{ animationDelay: `${idx * 60}ms` }}>
                  <td className="py-3 px-4 text-slate-800 dark:text-neutral-200 font-medium">{row.requirement}</td>
                  <td className="py-3 px-4">
                    <Badge variant={strengthConfig[row.evidenceStrength].variant}>
                      {strengthConfig[row.evidenceStrength].label}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    {row.needsSupplement ? (
                      <span className="inline-flex items-center gap-1 text-xs text-orange-600">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        需要补充
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-300">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        已覆盖
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-neutral-400 text-xs max-w-[280px] leading-relaxed">{row.suggestion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 移动端卡片 */}
        <div className="md:hidden space-y-3">
          {matchingRows.map((row, idx) => (
            <div
              key={row.id}
              className="border border-slate-200 dark:border-neutral-700 rounded-lg p-4 space-y-3 animate-fade-in"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium text-slate-800 dark:text-neutral-200">{row.requirement}</span>
                <Badge variant={strengthConfig[row.evidenceStrength].variant}>
                  {strengthConfig[row.evidenceStrength].label}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {row.needsSupplement ? (
                  <span className="inline-flex items-center gap-1 text-xs text-orange-600">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    需要补充
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-300">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    已覆盖
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">{row.suggestion}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
