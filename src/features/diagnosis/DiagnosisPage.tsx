import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Card } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { PageLoading } from '@/components/ui/Spinner';

function getScoreVariant(score: number): 'success' | 'warning' | 'danger' | 'default' {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  if (score >= 40) return 'danger';
  return 'default';
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-50 border-emerald-200';
  if (score >= 60) return 'bg-amber-50 border-amber-200';
  if (score >= 40) return 'bg-orange-50 border-orange-200';
  return 'bg-red-50 border-red-200';
}

export function DiagnosisPage() {
  const { diagnosis, analysisStatus } = useAppStore();
  const status = analysisStatus[3];

  if (status === 'loading') {
    return <PageLoading text="AI 正在诊断简历..." />;
  }

  if (!diagnosis) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 animate-fade-in">
        <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm">暂无诊断数据</p>
        <p className="text-xs mt-1">请先在输入页面提交分析</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 总体评分 */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-primary-500 rounded-full" />
            综合评分
          </h3>
          <div className={`px-4 py-2 rounded-xl border ${getScoreBg(diagnosis.overallScore)}`}>
            <span className={`text-2xl font-bold ${getScoreColor(diagnosis.overallScore)}`}>
              {diagnosis.overallScore}
            </span>
            <span className="text-xs text-slate-400 ml-1">/ 100</span>
          </div>
        </div>
        <Progress
          value={diagnosis.overallScore}
          size="lg"
          showLabel
          variant={getScoreVariant(diagnosis.overallScore)}
          className="mb-2"
        />
        <p className="text-xs text-slate-400 mt-1">
          {diagnosis.overallScore >= 80
            ? '整体表现优秀，简历与目标岗位匹配度较高'
            : diagnosis.overallScore >= 60
            ? '整体表现良好，仍有优化空间'
            : '需针对性优化，建议重点关注低分维度'}
        </p>
      </Card>

      {/* 各维度评分 */}
      <Card padding="lg">
        <h3 className="text-base font-semibold text-slate-900 mb-5 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-primary-500 rounded-full" />
          维度评分
        </h3>
        <div className="space-y-5">
          {diagnosis.dimensionScores.map((dim, idx) => (
            <div
              key={idx}
              className={`animate-fade-in`}
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">{dim.name}</span>
                  <span className={`text-xs font-semibold ${getScoreColor(dim.score)}`}>
                    {dim.score}
                  </span>
                </div>
                <Badge variant={dim.score >= 70 ? 'green' : dim.score >= 50 ? 'yellow' : 'orange'}>
                  {dim.score >= 80 ? '优秀' : dim.score >= 70 ? '良好' : dim.score >= 60 ? '一般' : dim.score >= 40 ? '待提升' : '急需改进'}
                </Badge>
              </div>
              <Progress
                value={dim.score}
                size="sm"
                variant={getScoreVariant(dim.score)}
              />
              <p className="text-xs text-slate-400 mt-1.5">{dim.reason}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* 优先修复项 */}
      <Card padding="lg">
        <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-primary-500 rounded-full" />
          优先修复建议
        </h3>
        <ul className="space-y-3">
          {diagnosis.priorityFixes.map((fix, idx) => (
            <li
              key={idx}
              className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100 animate-fade-in"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <span className="mt-0.5 w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold shrink-0">
                {idx + 1}
              </span>
              <span className="text-sm text-slate-700">{fix}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
