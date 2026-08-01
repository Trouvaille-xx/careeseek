import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageLoading } from '@/components/ui/Spinner';

export function InterviewPage() {
  const { interviewPrep, analysisStatus } = useAppStore();
  const status = analysisStatus[8];

  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  const toggleQuestion = useCallback((idx: number) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  }, []);

  if (status === 'loading') {
    return <PageLoading text="AI 正在生成面试准备内容..." />;
  }

  if (!interviewPrep) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 animate-fade-in">
        <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <p className="text-sm">暂无面试准备数据</p>
        <p className="text-xs mt-1">请先在输入页面提交分析</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 可能追问 */}
      <Card padding="lg">
        <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-primary-500 rounded-full" />
          可能追问（{interviewPrep.possibleQuestions.length} 题）
          <span className="text-xs text-slate-400 font-normal">点击展开查看详情</span>
        </h3>
        <div className="space-y-2">
          {interviewPrep.possibleQuestions.map((item, idx) => (
            <div
              key={idx}
              className="border border-slate-200 rounded-lg overflow-hidden animate-fade-in"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* 问题标题 */}
              <button
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                onClick={() => toggleQuestion(idx)}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-slate-800 font-medium leading-relaxed">{item.question}</span>
                </div>
                <svg
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                    expandedQuestions.has(idx) ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {/* 详情 */}
              {expandedQuestions.has(idx) && (
                <div className="px-4 pb-3 pt-0 border-t border-slate-100">
                  <div className="flex items-start gap-3 mt-3">
                    <svg className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.detail}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* 需要准备的证据 */}
      <Card padding="lg">
        <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-emerald-500 rounded-full" />
          需要准备的证据
        </h3>
        <ul className="space-y-3">
          {interviewPrep.evidenceToPrepare.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: `${idx * 60}ms` }}>
              <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="text-sm text-slate-700">{item}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* 可能夸大的表达 */}
      <Card padding="lg">
        <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-orange-500 rounded-full" />
          可能夸大的表达 <span className="text-xs text-slate-400 font-normal">（面试风险点）</span>
        </h3>
        <div className="space-y-3">
          {interviewPrep.exaggerationRisks.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100 animate-fade-in"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <svg className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-slate-700">{item}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 建议补充的数据 */}
      <Card padding="lg">
        <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-primary-500 rounded-full" />
          建议补充的数据
        </h3>
        <ul className="space-y-3">
          {interviewPrep.dataToSupplement.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: `${idx * 60}ms` }}>
              <span className="mt-0.5 w-5 h-5 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </span>
              <span className="text-sm text-slate-700">{item}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* 自我介绍 */}
      <Card padding="lg">
        <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-purple-500 rounded-full" />
          自我介绍
        </h3>
        <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{interviewPrep.selfIntroduction}</p>
        </div>
      </Card>
    </div>
  );
}
