import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { AnalysisError } from '@/components/ui/AnalysisError';
import { PageLoading } from '@/components/ui/Spinner';
import { exportJSON, exportBuilderPDF } from '@/services/exportService';
import { finalResumeToDraft } from '@/services/resumeDraftService';
import { track } from '@/services/tracker';

export function FinalResumePage() {
  const { finalResume, analysisStatus, userInput, resumeLibrary } = useAppStore();
  const status = analysisStatus[7];

  const [copied, setCopied] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // 从简历原文提取个人信息行（姓名/联系方式）
  const firstLine = userInput.resumeContent.trim().split('\n')[0] || '';
  const hasPersonalInfo = firstLine.includes('@') || firstLine.includes('手机') || firstLine.includes('电话');
  const personalInfoLine = hasPersonalInfo ? firstLine : '';

  // 复制全部文本
  const handleCopy = useCallback(async () => {
    if (!finalResume) return;
    try {
      const text = finalResume.sections
        .map((s) => `${s.title}\n${s.content}`)
        .join('\n\n');
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = finalResume.raw || '';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [finalResume]);

  // 导出占位
  const handleExport = useCallback(() => {
    setExportOpen(true);
  }, []);

  const handleExportJSON = useCallback(() => {
    if (!finalResume) return;
    exportJSON(finalResume);
    track('export_json', { source: 'final' });
    setExportOpen(false);
  }, [finalResume]);

  const handleExportPDF = useCallback(async () => {
    if (!finalResume) return;
    setExportingPdf(true);
    try {
      const draft = finalResumeToDraft(finalResume, resumeLibrary, personalInfoLine);
      await exportBuilderPDF(draft);
      track('export_pdf', { source: 'final', template: 'classic' });
      setExportOpen(false);
    } finally {
      setExportingPdf(false);
    }
  }, [finalResume, resumeLibrary, personalInfoLine]);

  const handleOpenBuilder = useCallback(() => {
    if (!finalResume) return;
    const store = useAppStore.getState();
    const draft = finalResumeToDraft(finalResume, store.resumeLibrary, personalInfoLine);
    store.importBuilderDraft(draft);
    store.setResumeLibraryTab('build');
    store.setCurrentStep(-1);
  }, [finalResume, personalInfoLine]);

  if (status === 'loading') {
    return <PageLoading text="AI 正在生成最终简历..." />;
  }

  if (status === 'error') {
    return <AnalysisError step={7} />;
  }

  if (!finalResume || !finalResume.sections || finalResume.sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-neutral-500 animate-fade-in">
        <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm">暂无简历数据</p>
        <p className="text-xs mt-1">请先在输入页面提交分析</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Personal info bar */}
      {personalInfoLine && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700 shadow-sm px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-neutral-700 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-600 dark:text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
          <span className="text-sm text-slate-700 dark:text-neutral-200">{personalInfoLine}</span>
        </div>
      )}

      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-primary-500 rounded-full" />
          最终简历
        </h3>
        <div className="flex items-center gap-3">
          {/* 复制成功提示 */}
          {copied && (
            <span className="text-xs text-emerald-600 dark:text-emerald-300 animate-fade-in flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              已复制到剪贴板
            </span>
          )}
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            复制到剪贴板
          </Button>
          <Button variant="outline" size="sm" onClick={handleOpenBuilder}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
            </svg>
            模板排版
          </Button>
          <Button size="sm" onClick={handleExport}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            导出
          </Button>
        </div>
      </div>

      {/* 简历章节 */}
      {finalResume.sections.map((section, idx) => (
        <Card key={idx} padding="lg" className="animate-fade-in" style={{ animationDelay: `${idx * 80}ms` }}>
          <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-primary-500 rounded-full" />
            {section.title}
          </h3>
          <div className="text-sm text-slate-700 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap">
            {section.content}
          </div>
        </Card>
      ))}

      {/* 导出 Dialog */}
      <Dialog open={exportOpen} onClose={() => setExportOpen(false)} title="导出简历">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-neutral-300">
            选择导出格式，下载后可投递或备份。
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleExportJSON}
              className="flex flex-col items-center gap-2 rounded-xl border-2 border-slate-200 dark:border-neutral-700 hover:border-primary-500 bg-white dark:bg-neutral-800 p-4 text-left transition-all"
            >
              <span className="text-sm font-medium text-slate-800 dark:text-neutral-200">JSON 文件</span>
              <span className="text-xs text-slate-500 dark:text-neutral-400">结构化数据，可导入备份</span>
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={exportingPdf}
              className="flex flex-col items-center gap-2 rounded-xl border-2 border-slate-200 dark:border-neutral-700 hover:border-primary-500 bg-white dark:bg-neutral-800 p-4 text-left transition-all disabled:opacity-50"
            >
              <span className="text-sm font-medium text-slate-800 dark:text-neutral-200">
                {exportingPdf ? '生成中...' : 'PDF 文件'}
              </span>
              <span className="text-xs text-slate-500 dark:text-neutral-400">classic 模板排版 A4 简历</span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setExportOpen(false);
              useAppStore.getState().setCurrentStep(-3);
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-neutral-700 hover:border-primary-400 hover:text-primary-600 bg-white dark:bg-neutral-800 p-3 text-sm text-slate-600 dark:text-neutral-300 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.688c0-.547.305-1.051.793-1.306l7.5-3.938a1.5 1.5 0 011.414 0l7.5 3.938c.488.255.793.759.793 1.306v6.626a1.5 1.5 0 01-.793 1.306l-7.5 3.938a1.5 1.5 0 01-1.414 0L3.793 16.62A1.5 1.5 0 013 15.314V8.688ZM3 8.25l9 4.5m0 0l9-4.5m-9 4.5V21" />
            </svg>
            去投递跟踪站
          </button>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              取消
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
