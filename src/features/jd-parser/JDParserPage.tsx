import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageLoading } from '@/components/ui/Spinner';

export function JDParserPage() {
  const { jdAnalysis, analysisStatus } = useAppStore();
  const status = analysisStatus[2];

  if (status === 'loading') {
    return <PageLoading text="AI 正在解析 JD 内容..." />;
  }

  if (!jdAnalysis) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 animate-fade-in">
        <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm">暂无 JD 分析数据</p>
        <p className="text-xs mt-1">请先在输入页面提交分析</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 岗位核心职责 */}
      <Card padding="lg">
        <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-primary-500 rounded-full" />
          岗位核心职责
        </h3>
        <ul className="space-y-3">
          {jdAnalysis.responsibilities.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
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
          <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-primary-500 rounded-full" />
            硬性要求
          </h4>
          <ul className="space-y-2">
            {jdAnalysis.hardRequirements.map((req, idx) => (
              <li key={idx} className="text-sm text-slate-800 flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                {req}
              </li>
            ))}
          </ul>
        </Card>
        <Card padding="lg">
          <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-purple-500 rounded-full" />
            隐性要求
          </h4>
          <ul className="space-y-2">
            {jdAnalysis.hiddenRequirements.map((req, idx) => (
              <li key={idx} className="text-sm text-slate-800 flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                {req}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* 高频关键词 */}
      <Card padding="lg">
        <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
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
        <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-primary-500 rounded-full" />
          理想候选人画像
        </h3>
        <p className="text-sm text-slate-700 leading-relaxed">{jdAnalysis.idealCandidate}</p>
      </Card>

      {/* 核心能力表 */}
      <Card padding="lg">
        <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-primary-500 rounded-full" />
          核心能力（TOP 5）
        </h3>
        <div className="space-y-4">
          {jdAnalysis.topAbilities.map((ability, idx) => (
            <div key={idx} className="flex items-start gap-4 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0">
                {idx + 1}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">{ability.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{ability.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
