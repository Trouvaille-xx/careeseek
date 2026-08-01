import { useState, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AnalysisError } from '@/components/ui/AnalysisError';
import { PageLoading } from '@/components/ui/Spinner';
import { analysisService } from '@/services/analysisService';
import type { OptimizationStyle } from '@/types';

const STYLE_OPTIONS: { key: OptimizationStyle; label: string }[] = [
  { key: 'default', label: '均衡优化' },
  { key: 'concise', label: '更简洁' },
  { key: 'less-exaggerated', label: '降低夸张' },
  { key: 'ai-product', label: '更偏AI产品' },
  { key: 'tob-saas', label: '更偏ToB SaaS' },
];

export function OptimizationPage() {
  const {
    userInput,
    jdAnalysis,
    diagnosis,
    matchingRows,
    followUpQuestions,
    optimizationItems,
    optimizationStyle,
    setOptimizationItems,
    setOptimizationStyle,
    updateOptimizationItem,
    analysisStatus,
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const status = analysisStatus[6];

  const startEdit = useCallback((item: typeof optimizationItems[0]) => {
    setEditingId(item.id);
    setEditText(item.optimized);
  }, []);

  const saveEdit = useCallback((item: typeof optimizationItems[0]) => {
    const text = editText.trim();
    if (text) {
      updateOptimizationItem(item.id, {
        optimized: text,
        aiOptimized: item.aiOptimized ?? item.optimized,
      });
    }
    setEditingId(null);
  }, [editText, updateOptimizationItem]);

  const restoreOriginal = useCallback((item: typeof optimizationItems[0]) => {
    updateOptimizationItem(item.id, {
      optimized: item.aiOptimized ?? item.optimized,
    });
    setEditingId(null);
  }, [updateOptimizationItem]);

  const handleStyleChange = useCallback(async (style: OptimizationStyle) => {
    if (style === optimizationStyle) return;
    setOptimizationStyle(style);
    setIsLoading(true);
    try {
      const items = await analysisService.optimizeResume(
        userInput, jdAnalysis!, diagnosis!, matchingRows, followUpQuestions, style
      );
      setOptimizationItems(items);
    } finally {
      setIsLoading(false);
    }
  }, [optimizationStyle, userInput, jdAnalysis, diagnosis, matchingRows, followUpQuestions, setOptimizationStyle, setOptimizationItems]);

  if (status === 'loading' && optimizationItems.length === 0) {
    return <PageLoading text="AI 正在优化简历..." />;
  }

  if (status === 'error') {
    return <AnalysisError step={6} />;
  }

  if (optimizationItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-neutral-500 animate-fade-in">
        <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm">暂无优化数据</p>
        <p className="text-xs mt-1">AI 分析耗时较长，请稍后重试或检查 API 配置</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 风格切换工具栏 */}
      <Card padding="md">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-600 dark:text-neutral-300 mr-1">优化风格：</span>
          {STYLE_OPTIONS.map((opt) => (
            <Button
              key={opt.key}
              variant={optimizationStyle === opt.key ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleStyleChange(opt.key)}
              disabled={isLoading}
            >
              {opt.label}
            </Button>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 ml-2 text-xs text-slate-400 dark:text-neutral-500">
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>重新生成中...</span>
            </div>
          )}
        </div>
      </Card>

      {/* 优化项列表 */}
      <div className="space-y-6">
        {optimizationItems.map((item, idx) => (
          <Card key={item.id} padding="lg" className="animate-fade-in" style={{ animationDelay: `${idx * 80}ms` }}>
            {/* 标题 */}
            <h3 className="text-sm font-semibold text-slate-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-primary-500 rounded-full" />
              {item.section}
            </h3>

            {/* 修改前后对比 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* 修改前 */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-neutral-700/50 border border-slate-200 dark:border-neutral-700">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">修改前</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-neutral-400 leading-relaxed whitespace-pre-wrap">{item.original}</p>
              </div>

              {/* 修改后 */}
              <div className="p-3 rounded-lg bg-primary-50 dark:bg-neutral-700 border border-primary-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    <span className="text-xs font-medium text-primary-600 dark:text-primary-300">修改后</span>
                    {item.aiOptimized !== undefined && item.aiOptimized !== item.optimized && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">已手动修改</span>
                    )}
                  </div>
                  {editingId !== item.id && (
                    <div className="flex items-center gap-1">
                      {item.aiOptimized !== undefined && item.aiOptimized !== item.optimized && (
                        <button
                          onClick={() => restoreOriginal(item)}
                          className="text-[11px] text-slate-400 hover:text-slate-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors"
                        >
                          恢复 AI 原文
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(item)}
                        className="inline-flex items-center gap-1 text-[11px] text-primary-600 hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-200 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                        编辑
                      </button>
                    </div>
                  )}
                </div>
                {editingId === item.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={5}
                      className="w-full rounded-lg border border-primary-300 bg-white px-3 py-2 text-sm text-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-500/40 dark:bg-neutral-800 dark:text-primary-200 dark:border-neutral-600"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>取消</Button>
                      <Button size="sm" onClick={() => saveEdit(item)}>保存</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-primary-900 leading-relaxed whitespace-pre-wrap dark:text-primary-300">{item.optimized}</p>
                )}
              </div>
            </div>

            {/* 修改理由 */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-neutral-700/50 border border-slate-200 dark:border-neutral-700">
              <div className="flex items-center gap-1.5 mb-1">
                <svg className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">修改理由</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">{item.reason}</p>
            </div>

            {/* 风险提示 */}
            {item.riskNote && (
              <div className="mt-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <svg className="w-3.5 h-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-medium text-orange-600">风险提示</span>
                </div>
                <p className="text-xs text-orange-600 leading-relaxed">{item.riskNote}</p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
