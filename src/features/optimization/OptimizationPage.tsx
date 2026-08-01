import { useState, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
    analysisStatus,
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(false);

  const status = analysisStatus[6];

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

  if (optimizationItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 animate-fade-in">
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
          <span className="text-sm font-medium text-slate-600 mr-1">优化风格：</span>
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
            <div className="flex items-center gap-2 ml-2 text-xs text-slate-400">
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
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-primary-500 rounded-full" />
              {item.section}
            </h3>

            {/* 修改前后对比 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* 修改前 */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span className="text-xs font-medium text-slate-500">修改前</span>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-wrap">{item.original}</p>
              </div>

              {/* 修改后 */}
              <div className="p-3 rounded-lg bg-primary-50 border border-primary-200">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                  <span className="text-xs font-medium text-primary-600">修改后</span>
                </div>
                <p className="text-sm text-primary-900 leading-relaxed whitespace-pre-wrap">{item.optimized}</p>
              </div>
            </div>

            {/* 修改理由 */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 mb-1">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-medium text-slate-500">修改理由</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{item.reason}</p>
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
