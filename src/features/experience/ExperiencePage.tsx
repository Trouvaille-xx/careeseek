import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Input';
import { PageLoading, SectionLoading } from '@/components/ui/Spinner';
import { AnalysisError } from '@/components/ui/AnalysisError';
import { analysisService } from '@/services/analysisService';
import { stripThinkTags } from '@/utils/text';

export function ExperiencePage() {
  const {
    userInput,
    followUpQuestions,
    analysisStatus,
    followUpRound,
    setFollowUpQuestions,
    updateFollowUpAnswer,
    updateFollowUpBullet,
    setFollowUpRound,
  } = useAppStore();

  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [isLoadingRound2, setIsLoadingRound2] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleReuse = useCallback((question: typeof followUpQuestions[0]) => {
    const text = stripThinkTags(question.optimizedBullet);
    if (!text) return;
    updateFollowUpAnswer(question.id, text);
    updateFollowUpBullet(question.id, '');
    setCopiedId(question.id);
    setTimeout(() => setCopiedId((id) => (id === question.id ? null : id)), 1500);
  }, [updateFollowUpAnswer, updateFollowUpBullet]);

  const status = analysisStatus[5];

  // 按 round 分组
  const round1Questions = useMemo(
    () => followUpQuestions.filter((q) => q.round === 1),
    [followUpQuestions]
  );
  const round2Questions = useMemo(
    () => followUpQuestions.filter((q) => q.round === 2),
    [followUpQuestions]
  );

  // 检查 round 1 是否全部完成优化
  const allRound1Optimized = useMemo(
    () => round1Questions.length > 0 && round1Questions.every((q) => q.optimizedBullet.trim().length > 0),
    [round1Questions]
  );

  // 当 round 1 全部优化完成时，自动触发 round 2
  useEffect(() => {
    if (allRound1Optimized && round2Questions.length === 0 && followUpRound === 1 && !isLoadingRound2) {
      setIsLoadingRound2(true);
      analysisService.generateFollowUp(userInput, round1Questions).then((newQuestions) => {
        setFollowUpQuestions([...useAppStore.getState().followUpQuestions, ...newQuestions]);
        setFollowUpRound(2);
        setIsLoadingRound2(false);
      });
    }
  }, [allRound1Optimized, round1Questions, round2Questions.length, followUpRound, isLoadingRound2, setFollowUpQuestions, setFollowUpRound]);

  const handleAnswerChange = useCallback(
    (id: string, value: string) => {
      updateFollowUpAnswer(id, value);
    },
    [updateFollowUpAnswer]
  );

  const handleGenerateBullet = useCallback(
    async (question: typeof followUpQuestions[0]) => {
      if (!question.userAnswer.trim() || generatingIds.has(question.id)) return;
      setGeneratingIds((prev) => new Set(prev).add(question.id));
      try {
        const bullet = await analysisService.generateBullet(question);
        updateFollowUpBullet(question.id, stripThinkTags(bullet));
      } finally {
        setGeneratingIds((prev) => {
          const next = new Set(prev);
          next.delete(question.id);
          return next;
        });
      }
    },
    [generatingIds, updateFollowUpBullet]
  );

  const toggleExpand = useCallback(
    (id: string) => {
      const q = followUpQuestions.find((q) => q.id === id);
      if (q) {
        setFollowUpQuestions(
          followUpQuestions.map((item) =>
            item.id === id ? { ...item, isExpanded: !item.isExpanded } : item
          )
        );
      }
    },
    [followUpQuestions, setFollowUpQuestions]
  );

  if (status === 'loading') {
    return <PageLoading text="AI 正在生成追问问题..." />;
  }

  if (status === 'error') {
    return <AnalysisError step={5} />;
  }

  if (followUpQuestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-neutral-500 animate-fade-in">
        <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <p className="text-sm">暂无追问数据</p>
        <p className="text-xs mt-1">请先在输入页面提交分析</p>
      </div>
    );
  }

  const renderQuestionCard = (question: typeof followUpQuestions[0], index: number) => (
    <Card
      key={question.id}
      padding="md"
      className={`animate-fade-in ${question.isExpanded ? 'ring-1 ring-primary-200' : ''}`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* 问题头部 */}
      <div
        className="flex items-start justify-between gap-3 cursor-pointer select-none"
        onClick={() => toggleExpand(question.id)}
      >
        <div className="flex items-start gap-3 min-w-0">
          <span className="mt-0.5 w-6 h-6 rounded-full bg-primary-50 dark:bg-neutral-700 text-primary-600 dark:text-primary-300 flex items-center justify-center text-xs font-bold shrink-0">
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 dark:text-neutral-200 leading-relaxed">{stripThinkTags(question.question)}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="amber">{question.direction}</Badge>
              <span className="text-xs text-slate-400 dark:text-neutral-500">第 {question.round} 轮</span>
              {question.optimizedBullet && (
                <Badge variant="green">已优化</Badge>
              )}
            </div>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 dark:text-neutral-500 mt-1 shrink-0 transition-transform duration-200 ${
            question.isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* 展开内容 */}
      {question.isExpanded && (
        <div className="mt-4 space-y-4 border-t border-slate-100 dark:border-neutral-700 pt-4">
          {/* 用户回答 */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-neutral-400 mb-1.5">你的回答</label>
            <Textarea
              placeholder="请在此输入你的回答..."
              rows={3}
              value={question.userAnswer}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            />
          </div>

          {/* 生成按钮 */}
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              disabled={!question.userAnswer.trim() || generatingIds.has(question.id)}
              loading={generatingIds.has(question.id)}
              onClick={() => handleGenerateBullet(question)}
            >
              生成优化表达
            </Button>
          </div>

          {/* 优化结果 */}
          {question.optimizedBullet && (
            <div className="p-3 rounded-lg bg-primary-50 dark:bg-neutral-700 border border-primary-100">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-primary-600 dark:text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="text-xs font-medium text-primary-700 dark:text-primary-300">优化后表达</span>
                </div>
                <button
                  onClick={() => handleReuse(question)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    copiedId === question.id
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-neutral-800 dark:text-primary-300 dark:hover:bg-neutral-700'
                  }`}
                >
                  {copiedId === question.id ? (
                    <>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      已采纳
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      一键复用
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm text-slate-700 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap">{stripThinkTags(question.optimizedBullet)}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 说明 */}
      <Card padding="md" className="bg-slate-50 dark:bg-neutral-700/50 border-slate-200 dark:border-neutral-700">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-slate-400 dark:text-neutral-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-slate-500 dark:text-neutral-400">针对你的简历，AI 生成了以下追问。请在每个问题中输入你的真实回答，然后点击"生成优化表达"获取润色后的版本。</p>
        </div>
      </Card>

      {/* Round 1 问题 */}
      {round1Questions.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-primary-500 rounded-full" />
            第一轮追问
            <span className="text-xs text-slate-400 dark:text-neutral-500 font-normal">（{round1Questions.filter(q => q.optimizedBullet).length}/{round1Questions.length} 已完成）</span>
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {round1Questions.map((q, idx) => renderQuestionCard(q, idx))}
          </div>
        </div>
      )}

      {/* Round 2 加载中 */}
      {isLoadingRound2 && (
        <SectionLoading text="正在生成第二轮追问..." />
      )}

      {/* Round 2 问题 */}
      {round2Questions.length > 0 && (
        <div className="mt-2">
          <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-primary-500 rounded-full" />
            第二轮追问
            <span className="text-xs text-slate-400 dark:text-neutral-500 font-normal">（进阶深入）</span>
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {round2Questions.map((q, idx) => renderQuestionCard(q, idx))}
          </div>
        </div>
      )}

      {/* 全部完成 */}
      {round2Questions.length > 0 && round2Questions.every((q) => q.optimizedBullet) && (
        <Card padding="md" className="bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-emerald-500 dark:text-emerald-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">所有追问已完成！你可以前往下一步查看简历优化结果。</p>
          </div>
        </Card>
      )}
    </div>
  );
}
