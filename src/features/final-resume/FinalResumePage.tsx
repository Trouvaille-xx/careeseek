import { useState, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { AnalysisError } from '@/components/ui/AnalysisError';
import { PageLoading } from '@/components/ui/Spinner';
import { ResumePreview } from '@/features/resume-builder/ResumeBuilderPage';
import { exportJSON, exportBuilderPDF, exportBuilderDOCX } from '@/services/exportService';
import { finalResumeToDraft } from '@/services/resumeDraftService';
import { analysisService } from '@/services/analysisService';
import { track } from '@/services/tracker';
import type { FinalResume } from '@/types';

/** 求职信 / 双语简历生成状态 */
type ExtraGenState = { type: 'cover' | 'bilingual'; loading: boolean; error: string; result: string } | null;

/** 把 finalResume 渲染为纯文本（供求职信/翻译提示词使用） */
function resumeToText(resume: FinalResume): string {
  return resume.sections.map((s) => `${s.title}\n${s.content}`).join('\n\n');
}

export function FinalResumePage() {
  const { finalResume, analysisStatus, userInput, resumeLibrary } = useAppStore();
  const status = analysisStatus[7];

  const [copied, setCopied] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [extraGen, setExtraGen] = useState<ExtraGenState>(null);
  const [extraCopied, setExtraCopied] = useState(false);

  // 从简历原文提取个人信息行（姓名/联系方式）
  const firstLine = userInput.resumeContent.trim().split('\n')[0] || '';
  const hasPersonalInfo = firstLine.includes('@') || firstLine.includes('手机') || firstLine.includes('电话');
  const personalInfoLine = hasPersonalInfo ? firstLine : '';

  const draft = finalResume
    ? finalResumeToDraft(finalResume, resumeLibrary, personalInfoLine)
    : null;

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

  const handleExportJSON = useCallback(() => {
    if (!finalResume) return;
    exportJSON(finalResume);
    track('export_json', { source: 'final' });
    setExportOpen(false);
    setExportError(null);
  }, [finalResume]);

  const handleExportPDF = useCallback(async () => {
    if (!finalResume) return;
    setExportingPdf(true);
    setExportError(null);
    try {
      const d = finalResumeToDraft(finalResume, resumeLibrary, personalInfoLine);
      await exportBuilderPDF(d);
      track('export_pdf', { source: 'final', template: 'classic' });
      setExportOpen(false);
    } catch (e) {
      setExportError((e as Error).message || 'PDF 导出失败，请重试');
    } finally {
      setExportingPdf(false);
    }
  }, [finalResume, resumeLibrary, personalInfoLine]);

  const handleExportWORD = useCallback(async () => {
    if (!finalResume) return;
    setExportingPdf(true);
    setExportError(null);
    try {
      const d = finalResumeToDraft(finalResume, resumeLibrary, personalInfoLine);
      await exportBuilderDOCX(d);
      track('export_docx', { source: 'final', template: 'classic' });
      setExportOpen(false);
    } catch (e) {
      setExportError((e as Error).message || 'Word 导出失败，请重试');
    } finally {
      setExportingPdf(false);
    }
  }, [finalResume, resumeLibrary, personalInfoLine]);

  const handleOpenBuilder = useCallback(() => {
    if (!finalResume) return;
    const store = useAppStore.getState();
    const d = finalResumeToDraft(finalResume, store.resumeLibrary, personalInfoLine);
    store.importBuilderDraft(d);
    store.setResumeLibraryTab('build');
    store.setCurrentStep(-1);
  }, [finalResume, personalInfoLine]);

  // 生成求职信 / 双语简历
  const handleExtraGen = useCallback(async (type: 'cover' | 'bilingual') => {
    if (!finalResume) return;
    setExtraGen({ type, loading: true, error: '', result: '' });
    setExtraCopied(false);
    try {
      const resumeText = resumeToText(finalResume);
      const result = type === 'cover'
        ? await analysisService.generateCoverLetter(userInput.jdContent, resumeText)
        : await analysisService.generateBilingualResume(resumeText);
      setExtraGen({ type, loading: false, error: '', result });
      track(type === 'cover' ? 'cover_letter_generated' : 'bilingual_generated', {});
    } catch (e) {
      setExtraGen({ type, loading: false, error: (e as Error).message || '生成失败，请重试', result: '' });
    }
  }, [finalResume, userInput.jdContent]);

  const handleExtraCopy = useCallback(async () => {
    if (!extraGen?.result) return;
    try {
      await navigator.clipboard.writeText(extraGen.result);
      setExtraCopied(true);
      setTimeout(() => setExtraCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = extraGen.result;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setExtraCopied(true);
      setTimeout(() => setExtraCopied(false), 2000);
    }
  }, [extraGen]);

  const handleExtraDownload = useCallback(() => {
    if (!extraGen?.result) return;
    const filename = extraGen.type === 'cover' ? 'careeseek-cover-letter.txt' : 'careeseek-resume-en.txt';
    const blob = new Blob([extraGen.result], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    track(extraGen.type === 'cover' ? 'cover_letter_downloaded' : 'bilingual_downloaded', {});
  }, [extraGen]);

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
      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-primary-500 rounded-full" />
          最终简历
          <span className="text-xs text-slate-400 dark:text-neutral-500 font-normal">A4 预览 · 导出 PDF/JSON</span>
        </h3>
        <div className="flex items-center gap-3">
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
          <Button
            variant="outline" size="sm"
            onClick={() => void handleExtraGen('cover')}
            disabled={extraGen?.loading}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            求职信
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={() => void handleExtraGen('bilingual')}
            disabled={extraGen?.loading}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
            </svg>
            双语简历
          </Button>
          <Button size="sm" onClick={() => { setExportOpen(true); setExportError(null); }}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            导出
          </Button>
        </div>
      </div>

      {/* A4 可视化预览 */}
      {draft && <ResumePreview draft={draft} />}

      {/* 导出 Dialog */}
      <Dialog open={exportOpen} onClose={() => setExportOpen(false)} title="导出简历">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-neutral-300">
            选择导出格式，下载后可投递或备份。
          </p>
          {exportError && (
            <div className="text-xs px-3 py-2 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {exportError}
            </div>
          )}
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
            <button
              type="button"
              onClick={handleExportWORD}
              disabled={exportingPdf}
              className="flex flex-col items-center gap-2 rounded-xl border-2 border-slate-200 dark:border-neutral-700 hover:border-primary-500 bg-white dark:bg-neutral-800 p-4 text-left transition-all disabled:opacity-50"
            >
              <span className="text-sm font-medium text-slate-800 dark:text-neutral-200">
                {exportingPdf ? '生成中...' : 'Word 文件'}
              </span>
              <span className="text-xs text-slate-500 dark:text-neutral-400">.docx 格式，可继续编辑</span>
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

      {/* 求职信 / 双语简历生成结果 Dialog */}
      <Dialog
        open={extraGen !== null}
        onClose={() => setExtraGen(null)}
        title={extraGen?.type === 'cover' ? '求职信' : '双语简历（英文版）'}
      >
        <div className="space-y-4">
          {extraGen?.loading ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-neutral-500">
              <span className="inline-block w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-3" />
              <p className="text-sm">{extraGen.type === 'cover' ? 'AI 正在生成求职信...' : 'AI 正在翻译为英文简历...'}</p>
            </div>
          ) : extraGen?.error ? (
            <div className="text-xs px-3 py-2 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {extraGen.error}
            </div>
          ) : extraGen?.result ? (
            <>
              <div className="max-h-96 overflow-y-auto rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 p-4">
                <p className="text-sm text-slate-700 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">
                  {extraGen.result}
                </p>
              </div>
              <div className="flex items-center gap-2 justify-end">
                {extraCopied && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-300 animate-fade-in flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    已复制
                  </span>
                )}
                <Button variant="outline" size="sm" onClick={() => void handleExtraCopy()}>
                  复制文本
                </Button>
                <Button size="sm" onClick={handleExtraDownload}>
                  下载 .txt
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </Dialog>
    </div>
  );
}
