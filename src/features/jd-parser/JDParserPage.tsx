import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { AnalysisError } from '@/components/ui/AnalysisError';

export function JDParserPage() {
  const { jdAnalysis, analysisStatus, jdStreamText, setCurrentStep } = useAppStore();
  const status = analysisStatus[2];

  if (status === 'loading') {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-3 text-sm text-primary-600 dark:text-primary-300">
          <Spinner className="h-4 w-4" />
          AI 正在解析 JD 内容...
        </div>
        {jdStreamText ? (
          <Card padding="lg">
            <pre className="text-xs text-slate-500 dark:text-neutral-400 whitespace-pre-wrap leading-relaxed font-sans">
              {jdStreamText}
              <span className="inline-block w-2 h-4 bg-primary-400 align-text-bottom animate-pulse" />
            </pre>
          </Card>
        ) : (
          <div className="flex flex-col items-center py-20 gap-4 animate-fade-in">
            <Spinner className="h-10 w-10" />
            <p className="text-sm text-slate-500 dark:text-neutral-400">正在连接 AI 服务并读取 JD 内容</p>
            <p className="text-xs text-slate-400 dark:text-neutral-500">首次请求可能需要 10-30 秒，请耐心等待</p>
          </div>
        )}
      </div>
    );
  }

  if (status === 'error') {
    return <AnalysisError step={2} />;
  }

  if (!jdAnalysis) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-neutral-500 animate-fade-in">
        <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm">暂无 JD 分析数据</p>
        <p className="text-xs mt-1">请先在输入页面提交分析</p>
        <button
          onClick={() => setCurrentStep(1)}
          className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-600 text-white text-xs font-medium hover:bg-primary-700 transition-colors"
        >
          去输入页提交分析
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 岗位核心职责 */}
      <Card padding="lg">
        <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-primary-500 rounded-full" />
          岗位核心职责
        </h3>
        <ul className="space-y-3">
          {jdAnalysis.responsibilities.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 dark:text-neutral-200">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-primary-50 dark:bg-neutral-700 text-primary-600 dark:text-primary-300 flex items-center justify-center shrink-0">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* 硬性要求与隐性要求 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card padding="lg">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-primary-500 rounded-full" />
            硬性要求
          </h4>
          <ul className="space-y-2">
            {jdAnalysis.hardRequirements.map((req, idx) => (
              <li key={idx} className="text-sm text-slate-800 dark:text-neutral-200 flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                {req}
              </li>
            ))}
          </ul>
        </Card>
        <Card padding="lg">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-purple-500 rounded-full" />
            隐性要求
          </h4>
          <ul className="space-y-2">
            {jdAnalysis.hiddenRequirements.map((req, idx) => (
              <li key={idx} className="text-sm text-slate-800 dark:text-neutral-200 flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                {req}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* 高频关键词 */}
      <Card padding="lg">
        <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-primary-500 rounded-full" />
          高频关键词
        </h3>
        <div className="flex flex-wrap gap-2">
          {jdAnalysis.keywords.map((kw, idx) => (
            <Badge key={idx} variant={idx < 5 ? 'green' : 'default'}>{kw}</Badge>
          ))}
        </div>
      </Card>

      {/* 理想候选人 */}
      <Card padding="lg">
        <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-primary-500 rounded-full" />
          理想候选人画像
        </h3>
        <p className="text-sm text-slate-700 dark:text-neutral-200 leading-relaxed">{jdAnalysis.idealCandidate}</p>
      </Card>

      {/* 核心能力表 */}
      <Card padding="lg">
        <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-primary-500 rounded-full" />
          核心能力（TOP 5）
        </h3>
        <div className="space-y-4">
          {jdAnalysis.topAbilities.map((ability, idx) => (
            <div key={idx} className="flex items-start gap-4 p-3 rounded-lg bg-slate-50 dark:bg-neutral-700/50 hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors">
              <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-neutral-700 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xs font-bold shrink-0">
                {idx + 1}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-neutral-100">{ability.name}</p>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">{ability.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
