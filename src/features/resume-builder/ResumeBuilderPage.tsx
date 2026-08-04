import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { exportBuilderJSON, exportBuilderPDF, exportBuilderDOCX } from '@/services/exportService';
import type { AccentColor, BuilderSectionKey, BuilderTemplate, EducationEntry, WorkExperienceEntry, ProjectEntry, CoreSkillEntry, PersonalStrengthEntry, CustomModuleEntry, ResumeBuilderDraft } from '@/types';

const SECTION_META: Record<BuilderSectionKey, { title: string; hint: string }> = {
  education: { title: '教育经历', hint: '学校、专业、学历与时间' },
  workExperience: { title: '工作经历', hint: '公司、职位与职责成就' },
  projects: { title: '项目经历', hint: '项目、角色与成果' },
  coreSkills: { title: '专业技能', hint: '技能分类与内容' },
  personalStrengths: { title: '个人优势', hint: '核心亮点与软素质' },
  custom: { title: '自定义模块', hint: '证书、获奖、语言能力等' },
};

const TEMPLATE_META: { key: BuilderTemplate; label: string; desc: string }[] = [
  { key: 'classic', label: '经典单栏', desc: 'ATS 友好，保险百搭' },
  { key: 'sidebar', label: '侧栏双栏', desc: '深色侧栏放联系方式与技能' },
  { key: 'header', label: '顶部横幅', desc: '顶部色块展示姓名与意向' },
  { key: 'minimal', label: '极简留白', desc: '大留白，细线分隔' },
];

const ACCENT_META: { key: AccentColor; label: string; hex: string }[] = [
  { key: 'slate', label: '石墨黑', hex: '#0f172a' },
  { key: 'blue', label: '深蓝', hex: '#1e40af' },
  { key: 'green', label: '墨绿', hex: '#065f46' },
  { key: 'red', label: '深红', hex: '#991b1b' },
  { key: 'violet', label: '紫罗兰', hex: '#5b21b6' },
];

const ACCENT_HEX: Record<AccentColor, string> = Object.fromEntries(ACCENT_META.map((a) => [a.key, a.hex])) as Record<AccentColor, string>;

type BuilderEntry = EducationEntry | WorkExperienceEntry | ProjectEntry | CoreSkillEntry | PersonalStrengthEntry;

function genId() { return crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`; }

// ============ 简历列表页 ============

export function BuilderListView() {
  const { builderDrafts, createBuilderDraft, loadBuilderDraft, deleteBuilderDraft, duplicateBuilderDraft, renameBuilderDraft } = useAppStore();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleRename = (id: string) => {
    const name = renameValue.trim();
    if (name) renameBuilderDraft(id, name);
    setRenamingId(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100">简历制作</h3>
          <p className="text-xs text-slate-400 mt-0.5">可创建多份简历草稿，选择一份进入编辑排版</p>
        </div>
        <Button size="sm" onClick={createBuilderDraft}>
          <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          新建简历
        </Button>
      </div>

      {builderDrafts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-neutral-600 bg-white/60 dark:bg-neutral-800/40 text-center py-20">
          <p className="text-sm text-slate-500 dark:text-neutral-400">还没有简历草稿</p>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1 mb-4">点击「新建简历」从简历库生成第一份，或从 AI 分析结果同步</p>
          <Button size="sm" onClick={createBuilderDraft}>新建简历</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {builderDrafts.map((d) => (
            <div
              key={d.id}
              className="group relative rounded-xl border border-slate-200 bg-white hover:border-primary-300 hover:shadow-md transition-all cursor-pointer dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-primary-600"
              onClick={() => loadBuilderDraft(d.id)}
            >
              {/* Mini preview strip */}
              <div className="h-24 rounded-t-xl px-5 py-4" style={{ backgroundColor: ACCENT_HEX[d.accentColor] }}>
                <div className="text-white">
                  <p className="text-base font-bold truncate" style={{ opacity: 0.95 }}>{d.basicInfo.name || d.name}</p>
                  <p className="text-[10px] mt-1 truncate" style={{ opacity: 0.7 }}>
                    {[d.basicInfo.jobIntent, d.basicInfo.city].filter(Boolean).join(' · ') || TEMPLATE_META.find((t) => t.key === d.template)?.label}
                  </p>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  {renamingId === d.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(d.id);
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      onBlur={() => handleRename(d.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full text-sm font-medium bg-transparent border-b border-primary-300 text-slate-900 focus:outline-none dark:text-neutral-100 dark:border-primary-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900 truncate dark:text-neutral-100">{d.name}</p>
                  )}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
                    <IconBtn title="重命名" onClick={() => { setRenamingId(d.id); setRenameValue(d.name); }}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                    </IconBtn>
                    <IconBtn title="复制" onClick={() => duplicateBuilderDraft(d.id)}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>
                    </IconBtn>
                    <IconBtn title="删除" danger onClick={() => {
                      if (window.confirm(`删除简历「${d.name}」？`)) deleteBuilderDraft(d.id);
                    }}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </IconBtn>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-slate-400 dark:text-neutral-500">
                    {TEMPLATE_META.find((t) => t.key === d.template)?.label} · {ACCENT_META.find((a) => a.key === d.accentColor)?.label}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-neutral-500">
                    {new Date(d.updatedAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IconBtn({ title, onClick, danger, children }: { title: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-colors ${danger ? 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30' : 'text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-neutral-700'}`}
    >
      {children}
    </button>
  );
}

// ============ 编辑页 ============

export function ResumeBuilderView() {
  const store = useAppStore();
  const { resumeBuilder } = store;
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [entryDialog, setEntryDialog] = useState<{ section: BuilderSectionKey; moduleId?: string; entry: BuilderEntry | CustomModuleEntry | null } | null>(null);
  const [pickDialog, setPickDialog] = useState(false);
  const [dragSection, setDragSection] = useState<BuilderSectionKey | null>(null);
  const [overSection, setOverSection] = useState<BuilderSectionKey | null>(null);

  useEffect(() => {
    if (!useAppStore.getState().resumeBuilder) {
      useAppStore.getState().exitBuilder();
    }
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  if (!resumeBuilder) return null;

  const handleSectionDrop = (target: BuilderSectionKey) => {
    if (!dragSection || dragSection === target) return;
    const order = resumeBuilder.sectionOrder;
    const from = order.indexOf(dragSection);
    const to = order.indexOf(target);
    if (from < 0 || to < 0) return;
    store.moveBuilderSection(from, to);
    setDragSection(null);
    setOverSection(null);
  };

  const handleExport = async (kind: 'pdf' | 'json' | 'docx') => {
    if (kind === 'json') {
      exportBuilderJSON(resumeBuilder);
      return;
    }
    if (kind === 'docx') {
      setExportingPdf(true);
      try {
        await exportBuilderDOCX(resumeBuilder);
      } catch (e) {
        console.error('导出 Word 失败:', e);
      } finally {
        setExportingPdf(false);
      }
      return;
    }
    setExportingPdf(true);
    try {
      await exportBuilderPDF(resumeBuilder);
    } catch (e) {
      console.error('导出 PDF 失败:', e);
    } finally {
      setExportingPdf(false);
    }
  };

  const selectCls = 'rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200';

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="sm" onClick={() => store.exitBuilder()}>
            <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            返回列表
          </Button>
          <span className="text-sm font-medium text-slate-700 truncate dark:text-neutral-300">{resumeBuilder.name}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-neutral-500">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8v8a3 3 0 01-3 3h-4l-4 3v-3H6a3 3 0 01-3-3V8a3 3 0 013-3h12a3 3 0 013 3z" />
            </svg>
            已保存 <span className="tabular-nums text-slate-500 dark:text-neutral-400">{new Date(resumeBuilder.updatedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
          </span>
          <select
            value={resumeBuilder.template}
            onChange={(e) => store.setBuilderTemplate(e.target.value as BuilderTemplate)}
            className={selectCls}
            title="排版模板"
          >
            {TEMPLATE_META.map((t) => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
          <select
            value={resumeBuilder.accentColor}
            onChange={(e) => store.setBuilderAccentColor(e.target.value as AccentColor)}
            className={selectCls}
            title="主题色"
          >
            {ACCENT_META.map((a) => (
              <option key={a.key} value={a.key}>{a.label}</option>
            ))}
          </select>
          <select
            value={resumeBuilder.fontSize}
            onChange={(e) => store.setBuilderFontSize(e.target.value as 'small' | 'medium' | 'large')}
            className={selectCls}
            title="字号"
          >
            <option value="small">字号 小</option>
            <option value="medium">字号 中</option>
            <option value="large">字号 大</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => setPickDialog(true)}>从简历库添加</Button>
          <Button variant="ghost" size="sm" onClick={() => {
            if (window.confirm('清空当前制作内容，重新从简历库生成？')) store.resetResumeBuilder();
          }}>重新生成</Button>
          <div className="relative" ref={exportMenuRef}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setExportMenuOpen((v) => !v)}
              disabled={exportingPdf}
              className={exportingPdf ? 'opacity-60' : ''}
              title="导出"
            >
              {exportingPdf ? '生成中…' : '导出'}
              <svg className={`w-3.5 h-3.5 transition-transform ${exportMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
            {exportMenuOpen && !exportingPdf && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-fade-in dark:bg-neutral-800 dark:border-neutral-700 dark:shadow-black/40">
                <button
                  onClick={() => { handleExport('pdf'); setExportMenuOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors dark:text-neutral-200 dark:hover:bg-neutral-700/60"
                >
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  导出 PDF
                </button>
                <button
                  onClick={() => { handleExport('docx'); setExportMenuOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors dark:text-neutral-200 dark:hover:bg-neutral-700/60"
                >
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  导出 Word
                </button>
                <button
                  onClick={() => { handleExport('json'); setExportMenuOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors dark:text-neutral-200 dark:hover:bg-neutral-700/60"
                >
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                  </svg>
                  导出 JSON
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Editor */}
        <div className="space-y-5">
          <BasicInfoCard />

          {resumeBuilder.sectionOrder.map((key, idx) => {
            const meta = SECTION_META[key];
            const items = key === 'custom' ? resumeBuilder.customSections : resumeBuilder[key];
            const visible = resumeBuilder.visibleSections[key];
            const isDragging = dragSection === key;
            const isOver = overSection === key && dragSection !== key;
            return (
              <div
                key={key}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'move';
                  setDragSection(key);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (overSection !== key) setOverSection(key);
                }}
                onDragLeave={() => {
                  if (overSection === key) setOverSection(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleSectionDrop(key);
                }}
                onDragEnd={() => {
                  setDragSection(null);
                  setOverSection(null);
                }}
                className={`relative transition-all ${isDragging ? 'opacity-40' : ''}`}
              >
                {isOver && <div className="absolute -inset-y-1.5 inset-x-0 z-10 border-2 border-dashed border-primary-400 rounded-xl pointer-events-none" />}
                <Card padding="lg">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-300 cursor-grab hover:text-primary-500 transition-colors dark:text-neutral-600" title="拖拽调整模块顺序">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm9 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM9 12a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm9 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM9 19a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm9 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                        </svg>
                      </span>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">{meta.title}</h3>
                      <span className="text-[10px] text-slate-400 hidden sm:inline">{meta.hint}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => store.moveBuilderSection(idx, idx - 1)}
                        disabled={idx === 0}
                        className="p-1 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-neutral-700"
                        title="上移"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                      </button>
                      <button
                        onClick={() => store.moveBuilderSection(idx, idx + 1)}
                        disabled={idx === resumeBuilder.sectionOrder.length - 1}
                        className="p-1 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-neutral-700"
                        title="下移"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      <button
                        onClick={() => store.toggleBuilderSection(key)}
                        className={`px-2 py-1 text-[10px] rounded-full border transition-colors ${
                          visible
                            ? 'text-primary-600 bg-primary-50 border-primary-200 dark:text-primary-400 dark:bg-neutral-700 dark:border-neutral-600'
                            : 'text-slate-400 border-slate-200 dark:text-neutral-500 dark:border-neutral-600'
                        }`}
                        title={visible ? '在简历中显示' : '已在简历中隐藏'}
                      >
                        {visible ? '显示中' : '已隐藏'}
                      </button>
                    </div>
                  </div>

                  {key === 'custom' ? (
                    <div className="space-y-3 mt-3">
                      {resumeBuilder.customSections.length === 0 && (
                        <p className="text-xs text-slate-400 py-3 text-center">暂无自定义模块，点击下方按钮添加</p>
                      )}
                      {resumeBuilder.customSections.map((mod) => (
                        <div key={mod.id} className="rounded-xl border border-slate-200 dark:border-neutral-600 p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              value={mod.title}
                              onChange={(e) => store.renameCustomSection(mod.id, e.target.value)}
                              placeholder="模块标题"
                              className={'flex-1 min-w-0 px-2 py-1 text-xs rounded-md border border-transparent hover:border-slate-200 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-transparent dark:text-neutral-200 dark:hover:border-neutral-600'}
                            />
                            <button
                              onClick={() => setEntryDialog({ section: 'custom', moduleId: mod.id, entry: null })}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors dark:hover:bg-neutral-700"
                              title="添加条目"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                            </button>
                            <button
                              onClick={() => { if (window.confirm(`删除模块「${mod.title}」？`)) store.deleteCustomSection(mod.id); }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors dark:hover:bg-red-900/30"
                              title="删除模块"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                          {mod.entries.length === 0 ? (
                            <p className="text-[10px] text-slate-400 py-1 text-center">暂无条目</p>
                          ) : (
                            <div className="space-y-1.5">
                              {mod.entries.map((entry) => (
                                <div key={entry.id} className="flex items-center justify-between gap-2 p-2 rounded-lg border border-slate-100 hover:border-slate-300 transition-colors dark:border-neutral-700 dark:hover:border-neutral-500">
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium text-slate-800 truncate dark:text-neutral-200">{entry.title || '(未填标题)'}</p>
                                    {entry.detail && <p className="text-[10px] text-slate-400 truncate">{entry.detail}</p>}
                                    {entry.description && <p className="text-[10px] text-slate-400 truncate mt-0.5">{entry.description}</p>}
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onClick={() => setEntryDialog({ section: 'custom', moduleId: mod.id, entry: { ...entry } })}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors dark:hover:bg-neutral-700"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                                    </button>
                                    <button
                                      onClick={() => store.deleteCustomSectionEntry(mod.id, entry.id)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors dark:hover:bg-red-900/30"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : items.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">暂无内容，点击下方按钮添加</p>
                  ) : (
                    <div className="space-y-2 mt-3">
                      {(items as unknown as BuilderEntry[]).map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors dark:border-neutral-600 dark:hover:border-neutral-500">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-800 truncate dark:text-neutral-200">{entrySummary(key, entry)}</p>
                            {entryMeta(key, entry) && <p className="text-[10px] text-slate-400 truncate mt-0.5">{entryMeta(key, entry)}</p>}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button

                              onClick={() => setEntryDialog({ section: key, entry: { ...entry } })}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors dark:hover:bg-neutral-700"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                            </button>
                            <button
                              onClick={() => store.deleteBuilderEntry(key, entry.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors dark:hover:bg-red-900/30"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {key === 'custom' ? (
                    <button
                      onClick={() => {
                        const lib = useAppStore.getState().resumeLibrary.customModules;
                        const existing = new Set(resumeBuilder.customSections.map((m) => m.id));
                        const toAdd = lib.filter((m) => !existing.has(m.id));
                        if (toAdd.length === 0) {
                          window.alert('简历库暂无可用自定义模块');
                          return;
                        }
                        toAdd.forEach((m) => store.addCustomSection({ id: m.id, title: m.title, entries: m.entries.map((e) => ({ ...e })) }));
                      }}
                      className="w-full mt-3 py-2 text-xs text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg border border-dashed border-slate-200 hover:border-primary-300 transition-colors dark:text-neutral-400 dark:hover:bg-neutral-700/50 dark:border-neutral-600"
                    >
                      + 从简历库添加模块
                    </button>
                  ) : (
                    <button
                      onClick={() => setEntryDialog({ section: key, entry: null })}
                      className="w-full mt-3 py-2 text-xs text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg border border-dashed border-slate-200 hover:border-primary-300 transition-colors dark:text-neutral-400 dark:hover:bg-neutral-700/50 dark:border-neutral-600"
                    >
                      + 添加{meta.title}
                    </button>
                  )}
                </Card>
              </div>
            );
          })}
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500 dark:text-neutral-400">实时预览 · A4</span>
            <span className="text-[10px] text-slate-400">
              {TEMPLATE_META.find((t) => t.key === resumeBuilder.template)?.label} · {ACCENT_META.find((a) => a.key === resumeBuilder.accentColor)?.label}
            </span>
          </div>
          <ResumePreview draft={resumeBuilder} />
        </div>
      </div>

      {/* Entry form dialog */}
      {entryDialog && (
        <EntryFormDialog
          section={entryDialog.section}
          entry={entryDialog.entry}
          onClose={() => setEntryDialog(null)}
          onSubmit={(entry) => {
            if (entryDialog.section === 'custom' && entryDialog.moduleId) {
              if (entryDialog.entry && entryDialog.entry !== null) {
                store.updateCustomSectionEntry(entryDialog.moduleId, entryDialog.entry.id, entry as CustomModuleEntry);
              } else {
                store.addCustomSectionEntry(entryDialog.moduleId, entry as CustomModuleEntry);
              }
            } else if (entryDialog.entry) {
              store.updateBuilderEntry(entryDialog.section as 'education' | 'workExperience' | 'projects' | 'coreSkills' | 'personalStrengths', entryDialog.entry.id, entry as BuilderEntry);
            } else {
              store.addBuilderEntry(entryDialog.section as 'education' | 'workExperience' | 'projects' | 'coreSkills' | 'personalStrengths', entry as BuilderEntry);
            }
            setEntryDialog(null);
          }}
        />
      )}

      {/* Pick from library dialog */}
      {pickDialog && <PickFromLibraryDialog onClose={() => setPickDialog(false)} />}
    </div>
  );
}

// ============ Basic info ============

function BasicInfoCard() {
  const { resumeBuilder, updateBuilderBasicInfo } = useAppStore();
  if (!resumeBuilder) return null;
  const b = resumeBuilder.basicInfo;
  const fields: { key: keyof typeof b; label: string; placeholder?: string; full?: boolean }[] = [
    { key: 'name', label: '姓名' },
    { key: 'jobIntent', label: '求职意向' },
    { key: 'phone', label: '电话' },
    { key: 'email', label: '邮箱' },
    { key: 'city', label: '所在地' },
    { key: 'website', label: '个人网站/GitHub' },
    { key: 'summary', label: '个人简介', full: true },
  ];
  return (
    <Card padding="lg">
      <h3 className="text-sm font-semibold text-slate-900 mb-1 dark:text-neutral-100">个人信息</h3>
      <p className="text-[10px] text-slate-400 mb-3">填写后显示在简历顶部</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.map((f) => (
          <div key={f.key} className={f.full ? 'col-span-2' : ''}>
            <label className="block text-xs font-medium text-slate-600 mb-1 dark:text-neutral-400">{f.label}</label>
            {f.key === 'summary' ? (
              <textarea
                value={b.summary}
                onChange={(e) => updateBuilderBasicInfo({ summary: e.target.value })}
                rows={2}
                placeholder="一段话概括你的核心优势"
                className={inputCls + ' resize-none'}
              />
            ) : (
              <input
                value={b[f.key]}
                onChange={(e) => updateBuilderBasicInfo({ [f.key]: e.target.value })}
                placeholder={f.placeholder ?? ''}
                className={inputCls}
              />
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ============ Entry helpers ============

function entrySummary(section: BuilderSectionKey, entry: BuilderEntry): string {
  switch (section) {
    case 'education': return (entry as EducationEntry).school || '(未填学校)';
    case 'workExperience': return (entry as WorkExperienceEntry).company || (entry as WorkExperienceEntry).position || '(未填公司)';
    case 'projects': return (entry as ProjectEntry).name || '(未填项目名)';
    case 'coreSkills': return (entry as CoreSkillEntry).category || (entry as CoreSkillEntry).skills || '(未填)';
    case 'personalStrengths': return (entry as PersonalStrengthEntry).content || '(未填)';
    case 'custom': return (entry as { title?: string }).title || '(未填标题)';
  }
}

function entryMeta(section: BuilderSectionKey, entry: BuilderEntry): string {
  switch (section) {
    case 'education': {
      const e = entry as EducationEntry;
      return [e.major, e.degree, [e.startDate, e.endDate].filter(Boolean).join(' - ')].filter(Boolean).join(' · ');
    }
    case 'workExperience': {
      const w = entry as WorkExperienceEntry;
      return [w.position, [w.startDate, w.endDate].filter(Boolean).join(' - ')].filter(Boolean).join(' · ');
    }
    case 'projects': {
      const p = entry as ProjectEntry;
      return [p.role, [p.startDate, p.endDate].filter(Boolean).join(' - ')].filter(Boolean).join(' · ');
    }
    case 'coreSkills': return (entry as CoreSkillEntry).skills;
    case 'personalStrengths': return '';
    case 'custom': return (entry as { detail?: string }).detail ?? '';
  }
}

// ============ Entry form dialog ============

const DATE_FIELDS: { key: 'startDate' | 'endDate'; label: string }[] = [
  { key: 'startDate', label: '开始时间' },
  { key: 'endDate', label: '结束时间' },
];

function EntryFormDialog({ section, entry, onClose, onSubmit }: {
  section: BuilderSectionKey;
  entry: BuilderEntry | CustomModuleEntry | null;
  onClose: () => void;
  onSubmit: (entry: BuilderEntry | CustomModuleEntry) => void;
}) {
  const [form, setForm] = useState<Record<string, unknown>>(() => {
    if (!entry) return {};
    return { ...(entry as unknown as Record<string, unknown>) };
  });
  const meta = SECTION_META[section];
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const str = (k: string): string => {
    const v = form[k];
    return typeof v === 'string' ? v : '';
  };

  const fields: { key: string; label: string; textarea?: boolean }[] = [];
  if (section === 'education') {
    fields.push({ key: 'school', label: '学校' }, { key: 'major', label: '专业' }, { key: 'degree', label: '学历' });
  } else if (section === 'workExperience') {
    fields.push({ key: 'company', label: '公司' }, { key: 'position', label: '职位' });
  } else if (section === 'projects') {
    fields.push({ key: 'name', label: '项目名称' }, { key: 'role', label: '担任角色' });
  } else if (section === 'coreSkills') {
    fields.push({ key: 'category', label: '分类（如：前端）' }, { key: 'skills', label: '技能内容', textarea: true });
  } else if (section === 'custom') {
    fields.push({ key: 'title', label: '标题' }, { key: 'description', label: '描述', textarea: true });
  } else {
    fields.push({ key: 'content', label: '优势内容', textarea: true });
  }
  const descLabel = section === 'education' ? '在校表现与荣誉' : section === 'workExperience' ? '工作职责与成果' : section === 'projects' ? '项目职责与成果' : null;

  const valid = (() => {
    const required = section === 'personalStrengths' ? 'content' : section === 'coreSkills' ? 'skills' : section === 'custom' ? 'title' : section === 'education' ? 'school' : section === 'workExperience' ? 'company' : 'name';
    return str(required).trim().length > 0;
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md mx-4 max-h-[85vh] flex flex-col animate-slide-up dark:bg-neutral-800 dark:border-neutral-700">
        <div className="flex items-center justify-between px-6 pt-6 pb-0 shrink-0">
          <h2 className="text-base font-semibold text-slate-900 dark:text-neutral-100">{entry ? '编辑' : '添加'}{meta.title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors dark:hover:bg-neutral-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 space-y-3 overflow-y-auto flex-1">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-slate-600 mb-1 dark:text-neutral-400">{f.label}</label>
              {f.textarea ? (
                <textarea value={str(f.key)} onChange={(e) => set(f.key, e.target.value)} rows={3} className={inputCls + ' resize-none'} />
              ) : (
                <input value={str(f.key)} onChange={(e) => set(f.key, e.target.value)} className={inputCls} />
              )}
            </div>
          ))}
          {(section === 'education' || section === 'workExperience' || section === 'projects') && (
            <div className="grid grid-cols-2 gap-3">
              {DATE_FIELDS.map((d) => (
                <div key={d.key}>
                  <label className="block text-xs font-medium text-slate-600 mb-1 dark:text-neutral-400">{d.label}</label>
                  <input type="month" value={str(d.key)} onChange={(e) => set(d.key, e.target.value)} className={inputCls} />
                </div>
              ))}
            </div>
          )}
          {descLabel ? (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1 dark:text-neutral-400">{descLabel}</label>
              <textarea value={str('description')} onChange={(e) => set('description', e.target.value)} rows={4} placeholder="直接填写描述，无需拆分列表；支持多行，用「- 」开头仅作视觉分隔" className={inputCls + ' resize-none'} />
            </div>
          ) : null}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 pb-6 shrink-0">
          <Button variant="ghost" size="md" onClick={onClose}>取消</Button>
          <Button
            size="md"
            disabled={!valid}
            onClick={() => onSubmit({
              ...(entry ?? { id: genId(), status: 'draft' as const }),
              ...form,
            } as BuilderEntry | CustomModuleEntry)}
          >
            保存
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============ Pick from library ============

function PickFromLibraryDialog({ onClose }: { onClose: () => void }) {
  const { resumeBuilder, resumeLibrary, addBuilderEntry, addCustomSection } = useAppStore();
  if (!resumeBuilder) return null;

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const allSections: { key: BuilderSectionKey; items: BuilderEntry[] }[] = [
    { key: 'education', items: resumeLibrary.education },
    { key: 'workExperience', items: resumeLibrary.workExperience },
    { key: 'projects', items: resumeLibrary.projects },
    { key: 'coreSkills', items: resumeLibrary.coreSkills },
    { key: 'personalStrengths', items: resumeLibrary.personalStrengths },
  ];

  const existingEntries = new Set(Object.values(resumeBuilder).flatMap((v) => Array.isArray(v) ? v.map((e: BuilderEntry) => e.id) : []));
  const existingModules = new Set(resumeBuilder.customSections.map((m) => m.id));
  const available = allSections
    .map((s) => ({ ...s, items: s.items.filter((i) => !existingEntries.has(i.id)) }))
    .filter((s) => s.items.length > 0);
  const availableModules = resumeLibrary.customModules.filter((m) => !existingModules.has(m.id));
  const checkedCount = Object.values(checked).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg mx-4 max-h-[80vh] flex flex-col animate-slide-up dark:bg-neutral-800 dark:border-neutral-700">
        <div className="flex items-center justify-between px-6 pt-6 pb-0 shrink-0">
          <h2 className="text-base font-semibold text-slate-900 dark:text-neutral-100">从简历库添加</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors dark:hover:bg-neutral-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <p className="text-xs text-slate-500 dark:text-neutral-400">勾选简历库中的条目加入当前简历（已在简历中的条目不重复显示）。</p>
          {available.length === 0 && availableModules.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">简历库中暂无可用条目</p>
          ) : (
            <>
            {available.map((s) => (
              <div key={s.key}>
                <h4 className="text-xs font-semibold text-slate-700 mb-2 dark:text-neutral-300">{SECTION_META[s.key].title}</h4>
                <div className="space-y-1.5">
                  {s.items.map((item) => (
                    <label key={item.id} className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer dark:border-neutral-600 dark:hover:border-neutral-500">
                      <input
                        type="checkbox"
                        checked={!!checked[item.id]}
                        onChange={(e) => setChecked((c) => ({ ...c, [item.id]: e.target.checked }))}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500/30"
                      />
                      <span className="text-xs text-slate-700 leading-relaxed line-clamp-2 dark:text-neutral-300">
                        {entrySummary(s.key, item)}
                        {entryMeta(s.key, item) ? ` — ${entryMeta(s.key, item)}` : ''}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
              {availableModules.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 mb-2 dark:text-neutral-300">自定义模块</h4>
                  <div className="space-y-1.5">
                    {availableModules.map((mod) => (
                      <label key={mod.id} className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer dark:border-neutral-600 dark:hover:border-neutral-500">
                        <input
                          type="checkbox"
                          checked={!!checked[`mod:${mod.id}`]}
                          onChange={(e) => setChecked((c) => ({ ...c, [`mod:${mod.id}`]: e.target.checked }))}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500/30"
                        />
                        <span className="text-xs text-slate-700 leading-relaxed line-clamp-2 dark:text-neutral-300">
                          {mod.title}（{mod.entries.length} 条）
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 pb-6 shrink-0">
          <Button variant="ghost" size="md" onClick={onClose}>取消</Button>
          <Button
            size="md"
            disabled={checkedCount === 0}
            onClick={() => {
              available.forEach((s) => {
                s.items.forEach((item) => {
                  if (checked[item.id]) addBuilderEntry(s.key, { ...item });
                });
              });
              availableModules.forEach((mod) => {
                if (checked[`mod:${mod.id}`]) addCustomSection({ id: mod.id, title: mod.title, entries: mod.entries.map((e) => ({ ...e })) });
              });
              onClose();
            }}
          >
            添加所选（{checkedCount}）
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============ Preview (multi-template) ============

const A4_W = 420;
const A4_H = 594;
const SHEET_PAD = 36;
// 页内可放置"原子"的预算：A4 高减去上下页边距
const PAGE_BUDGET = A4_H - SHEET_PAD * 2;

/**
 * 用真实测量把超长正文切成若干"恰好填满一页"的分片。
 * 隐藏探针与正文同字体/同宽/同换行，对前缀子串二分找"高度 <= cap"的最大长度，
 * 精确落在真实折行边界。返回 [{end,h}]，h 为该分片正文的实际高度。
 */
type BodySlice = { end: number; h: number };

function makeProbe(): HTMLSpanElement {
  const s = document.createElement('span');
  s.style.cssText =
    'position:absolute;left:-99999px;top:0;visibility:hidden;white-space:pre-wrap;display:block;';
  document.body.appendChild(s);
  return s;
}

function splitEntryBody(
  body: string,
  contentW: number,
  baseSize: number,
  lineHeight: number,
  budget: number,
  headH: number,
): BodySlice[] {
  const probe = makeProbe();
  probe.style.width = `${contentW}px`;
  probe.style.fontSize = `${baseSize}px`;
  probe.style.lineHeight = `${lineHeight}px`;
  const bounds = (text: string, cap: number) => {
    let lo = 0, hi = text.length, best = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      probe.textContent = text.slice(0, mid);
      if (probe.offsetHeight <= cap) { best = mid; lo = mid + 1; } else hi = mid - 1;
    }
    return best;
  };
  const slices: BodySlice[] = [];
  let start = 0;
  let cap = budget - headH;
  while (start < body.length) {
    const remaining = body.slice(start);
    probe.textContent = remaining;
    const totalH = probe.offsetHeight;
    const len = totalH <= cap ? remaining.length : Math.max(1, bounds(remaining, cap));
    probe.textContent = remaining.slice(0, len);
    slices.push({ end: start + len, h: probe.offsetHeight });
    start += len;
    cap = budget;
  }
  document.body.removeChild(probe);
  return slices;
}

// 一个分页原子：标题(标题下面至少留一条目) / 条目。head 也在其中。
type Atom = { kind: 'head' | 'title' | 'entry'; el: React.ReactElement; data?: { section: BuilderSectionKey; item: BuilderEntry; baseSize: string } };

function buildVisibleOrder(draft: ResumeBuilderDraft): BuilderSectionKey[] {
  return draft.sectionOrder.filter(
    (k) => draft.visibleSections[k] && (k === 'custom' ? draft.customSections.length > 0 : (draft[k] as unknown[]).length > 0),
  );
}

/**
 * 把模板展开为一串可分页原子（head + 标题 + 条目），
 * 这样长章节可以在"条目之间"跨页，而不是整段搬走。
 */
function buildAtoms(draft: ResumeBuilderDraft): Atom[] {
  const accent = ACCENT_HEX[draft.accentColor] ?? ACCENT_HEX.slate;
  const baseSize = draft.fontSize === 'small' ? '10px' : draft.fontSize === 'large' ? '12px' : '11px';
  const titleSize = draft.fontSize === 'small' ? '12px' : draft.fontSize === 'large' ? '15px' : '13px';
  const nameSize = draft.fontSize === 'small' ? '20px' : draft.fontSize === 'large' ? '26px' : '23px';
  const visibleOrder = buildVisibleOrder(draft);
  const ctx: PreviewCtx = { draft, accent, baseSize, titleSize, nameSize, visibleOrder };

  if (draft.template === 'sidebar') {
    return [{ kind: 'head', el: <SidebarPreview key="sb" {...ctx} /> }];
  }

  const atoms: Atom[] = [];
  const head = draft.template === 'header'
    ? <HeaderHead key="head" {...ctx} />
    : draft.template === 'minimal'
      ? <MinimalHead key="head" {...ctx} />
      : <ClassicHead key="head" {...ctx} />;
  atoms.push({ el: head, kind: 'head' });

  for (const section of visibleOrder) {
    if (section === 'custom') {
      for (const mod of draft.customSections) {
        atoms.push({ kind: 'title', el: <SectionTitle key={`t-${mod.id}`} section="custom" accent={accent} titleSize={titleSize} title={mod.title} /> });
        for (const item of mod.entries) {
          atoms.push({ kind: 'entry', el: <EntryRow key={item.id} section="custom" item={item as unknown as BuilderEntry} baseSize={baseSize} />, data: { section: 'custom', item: item as unknown as BuilderEntry, baseSize } });
        }
      }
      continue;
    }
    atoms.push({ kind: 'title', el: <SectionTitle key={`t-${section}`} section={section} accent={accent} titleSize={titleSize} /> });
    for (const item of (draft[section] as BuilderEntry[])) {
      atoms.push({ kind: 'entry', el: <EntryRow key={item.id} section={section} item={item} baseSize={baseSize} />, data: { section, item, baseSize } });
    }
  }
  return atoms;
}

/**
 * 离屏渲染所有原子，测每个原子的真实"前进距离"(含底部间隙)，
 * 再按页高贪心装箱。标题与其后至少一个条目同页，避免标题孤立在页底。
 */
function PaginatedResume({ atoms }: { atoms: Atom[] }) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [sheets, setSheets] = useState<React.ReactElement[][]>([]);

  useLayoutEffect(() => {
    const host = measureRef.current;
    if (!host) return;
    const nodes = Array.from(host.children) as HTMLElement[];
    const positions = nodes.map((n) => n.offsetTop);
    // 前进间隔 = 下一个原子顶 - 本原子顶（含 margin）。最后一项用手动量。
    const advances = nodes.map((n, i) =>
      i < nodes.length - 1 ? Math.max(0, positions[i + 1] - positions[i]) : n.offsetHeight,
    );

    // 内容区宽 = 纸张宽 - 两侧留白（与 .sheet padding 一致）
    const innerW = A4_W - SHEET_PAD * 2;
    const baseSxMap: Record<string, number> = { small: 10, default: 11, large: 12 };

    // 线性"块"序列：普通原子带上测量高度；超长条目精确展开为多个分片
    type Blk = { el: React.ReactElement; h: number; kind: 'head' | 'title' | 'entry' };
    const seq: Blk[] = [];

    for (let i = 0; i < atoms.length; i++) {
      const atom = atoms[i];
      const h = advances[i] ?? 0;
      const isOver = atom.kind === 'entry' && h > PAGE_BUDGET && atom.data && atom.data.item;
      if (!isOver) {
        seq.push({ el: atom.el, h, kind: atom.kind });
        continue;
      }
      const { section, item, baseSize } = atom.data!;
      const { left, right, body } = previewLines(section, item);
      const baseSx = baseSxMap[baseSize] ?? 11;
      if (!body) { seq.push({ el: atom.el, h, kind: 'entry' }); continue; }
      // 抬头高度：条目总高 - 正文占高
      const p = nodes[i].querySelector('p');
      const headH = p ? Math.max(8, nodes[i].offsetHeight - p.offsetHeight) : 24;
      const slices = splitEntryBody(body, innerW, baseSx, baseSx * 1.625, PAGE_BUDGET, Math.min(headH, PAGE_BUDGET - 8));
      slices.forEach((s, k) => {
        const start = k === 0 ? 0 : slices[k - 1].end;
        const piece = body.slice(start, s.end);
        const isLast = s.end >= body.length;
        seq.push({
          el: (
            <div key={`${item.id}-sp-${k}`} className="mb-3">
              {k === 0 && (
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-slate-800" style={{ fontSize: baseSize }}>{left}</span>
                  {right && <span className="text-slate-500 shrink-0" style={{ fontSize: baseSize }}>{right}</span>}
                </div>
              )}
              <p className="text-slate-600 whitespace-pre-wrap leading-relaxed mt-0.5" style={{ fontSize: baseSize }}>{piece}</p>
              {!isLast && <p className="text-[10px] text-slate-300 mt-1">（未完·续下页）</p>}
            </div>
          ),
          h: (k === 0 ? headH : 0) + s.h + (!isLast ? 16 : 0),
          kind: 'entry',
        });
      });
    }

    const packed: React.ReactElement[][] = [];
    let cur: React.ReactElement[] = [];
    let curH = 0;
    const push = () => { if (cur.length) { packed.push(cur); cur = []; curH = 0; } };

    for (let i = 0; i < seq.length; i++) {
      const blk = seq[i];
      const h = blk.h || 0;
      const over = curH + h > PAGE_BUDGET;
      if (!cur.length && over) { cur.push(blk.el); curH = h; continue; }
      if (over && cur.length) push();
      // 标题不要孤悬页底：标题后至少跟一个条目（否则标题单独挪下页）
      if (blk.kind === 'title' && cur.length === 0 && i + 1 < seq.length) {
        const next = seq[i + 1];
        const nh = next.h || 0;
        cur.push(blk.el); curH = h;
        if (curH + nh <= PAGE_BUDGET) { cur.push(next.el); curH += nh; i++; continue; }
        // 标题 + 其条目无法同页 → 整组挪下一页
        push();
        cur.push(blk.el); curH = h;
        cur.push(next.el); curH += nh; i++;
        continue;
      }
      cur.push(blk.el);
      curH += h;
    }
    push();
    setSheets(packed);
  }, [atoms]);

  return (
    <>
      <div ref={measureRef} aria-hidden style={{ position: 'absolute', left: -99999, top: 0, width: A4_W, padding: SHEET_PAD, boxSizing: 'border-box', pointerEvents: 'none' }}>
        {atoms.map((a, i) => <div key={i} className="atom-w">{a.el}</div>)}
      </div>
      <div className="flex flex-col items-center gap-6" style={{ fontFamily: 'inherit' }}>
        {sheets.map((sheet, i) => (
          <div key={i} className="relative bg-white rounded-lg shadow-md flex-none" style={{ width: A4_W, minHeight: A4_H, padding: SHEET_PAD, boxSizing: 'border-box' }}>
            {sheet}
            <div className="absolute inset-x-0 bottom-2 text-center text-[9px] text-slate-300 dark:text-neutral-500 select-none" style={{ pointerEvents: 'none' }}>
              第 {i + 1} / {sheets.length} 页 · A4
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function ResumePreview({ draft }: { draft: ResumeBuilderDraft }) {
  const atoms = useMemo<Atom[]>(() => buildAtoms(draft), [draft]);

  return (
    <div className="bg-slate-100 rounded-xl p-4 sm:p-6 dark:bg-neutral-800/80">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[11px] text-slate-400 dark:text-neutral-500">A4 预览 · 上下滚动查看分页稿，长章节会跨页排布</span>
      </div>
      <div className="overflow-y-auto scrollbar-thin py-1 max-h-[80vh] rounded-lg">
        <PaginatedResume atoms={atoms} />
      </div>
    </div>
  );
}

/** 经典单栏的头部块：姓名、联系行、简介 */
function ClassicHead({ draft, accent, baseSize, nameSize }: PreviewCtx) {
  const b = draft.basicInfo;
  const contactParts = [b.jobIntent, b.phone, b.email, b.city, b.website].filter(Boolean);
  return (
    <div className="preview-break-avoid">
      {b.name && <h1 className="font-bold tracking-wide mb-1" style={{ fontSize: nameSize, color: accent }}>{b.name}</h1>}
      {contactParts.length > 0 && (
        <div className="text-slate-500 mb-2 leading-relaxed" style={{ fontSize: baseSize }}>
          {contactParts.join('  |  ')}
        </div>
      )}
      {b.summary && <p className="text-slate-600 mb-3 leading-relaxed" style={{ fontSize: baseSize }}>{b.summary}</p>}
    </div>
  );
}

/** 侧栏双栏：左深色栏（联系方式/技能/教育），右单栏（简介/工作/项目/优势） */
function SidebarPreview({ draft, accent, baseSize, titleSize, nameSize, visibleOrder }: PreviewCtx) {
  const b = draft.basicInfo;
  const sidebarSections: BuilderSectionKey[] = ['education', 'coreSkills'];
  const rightSections = visibleOrder.filter((k) => !sidebarSections.includes(k));
  const contactParts = [b.phone, b.email, b.city, b.website].filter(Boolean);

  return (
    <div className="flex min-h-full preview-break-avoid bg-white preview-page-slice">
      {/* Left dark sidebar */}
      <div className="w-[34%] shrink-0 p-4 text-white" style={{ backgroundColor: accent }}>
        {b.name && <p className="font-bold leading-tight" style={{ fontSize: nameSize }}>{b.name}</p>}
        {b.jobIntent && <p className="mt-1" style={{ fontSize: baseSize, opacity: 0.85 }}>{b.jobIntent}</p>}
        {contactParts.length > 0 && (
          <div className="mt-4 space-y-1" style={{ fontSize: baseSize, opacity: 0.9 }}>
            {contactParts.map((p) => <p key={p} className="break-all leading-snug">{p}</p>)}
          </div>
        )}
        {draft.basicInfo.summary && (
          <div className="mt-4">
            <p className="mb-1" style={{ fontSize: baseSize, opacity: 0.65, letterSpacing: '0.08em' }}>个人简介</p>
            <p className="leading-relaxed" style={{ fontSize: baseSize, opacity: 0.92 }}>{draft.basicInfo.summary}</p>
          </div>
        )}
        {visibleOrder.filter((k) => sidebarSections.includes(k)).map((key) => (
          <div key={key} className="mt-4">
            <p className="mb-1.5" style={{ fontSize: baseSize, opacity: 0.65, letterSpacing: '0.08em' }}>{SECTION_META[key].title}</p>
            <div className="space-y-1.5">
              {((draft as unknown as Record<string, unknown[]>)[key] as BuilderEntry[]).map((item) => {
                if (key === 'coreSkills') {
                  const s = item as CoreSkillEntry;
                  return <p key={item.id} style={{ fontSize: baseSize, opacity: 0.92 }}>{s.category ? `${s.category}：${s.skills}` : s.skills}</p>;
                }
                const e = item as EducationEntry;
                return (
                  <div key={item.id}>
                    <p style={{ fontSize: baseSize, opacity: 0.95 }}>{[e.school, e.major, e.degree].filter(Boolean).join(' · ')}</p>
                    {[e.startDate, e.endDate].filter(Boolean).length > 0 && (
                      <p style={{ fontSize: '9px', opacity: 0.65 }}>{[e.startDate, e.endDate].filter(Boolean).join(' - ')}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {/* Right content */}
      <div className="flex-1 p-4">
        {rightSections.map((key) => (
          <SectionBody key={key} section={key} draft={draft} accent={accent} baseSize={baseSize} titleSize={titleSize} />
        ))}
      </div>
    </div>
  );
}

/** 顶部横幅模板的头部块：深色横幅（姓名+意向+联系） */
function HeaderHead({ draft, accent, baseSize, nameSize }: PreviewCtx) {
const b = draft.basicInfo;
  const contactParts = [b.phone, b.email, b.city, b.website].filter(Boolean);
  return (
    <div className="preview-break-avoid">
      <div className="px-6 py-5 text-white mb-4" style={{ backgroundColor: accent }}>
        <h1 className="font-bold tracking-wide" style={{ fontSize: nameSize }}>{b.name || b.jobIntent || '姓名'}</h1>
        {b.jobIntent && <p className="mt-0.5" style={{ fontSize: baseSize, opacity: 0.85 }}>{b.jobIntent}</p>}
        {contactParts.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5" style={{ fontSize: baseSize, opacity: 0.85 }}>
            {contactParts.map((p) => <span key={p}>{p}</span>)}
          </div>
        )}
      </div>
      {b.summary && <p className="text-slate-600 mb-3 leading-relaxed" style={{ fontSize: baseSize }}>{b.summary}</p>}
    </div>
  );
}

/** 极简留白头部块 */
function MinimalHead({ draft, accent, baseSize, nameSize }: PreviewCtx) {
  const b = draft.basicInfo;
  const contactParts = [b.jobIntent, b.phone, b.email, b.city, b.website].filter(Boolean);
  return (
    <div className="preview-break-avoid">
      {b.name && <h1 className="font-light tracking-[0.2em] mb-2" style={{ fontSize: nameSize, color: accent }}>{b.name}</h1>}
      {contactParts.length > 0 && (
        <div className="text-slate-500 mb-4 leading-relaxed" style={{ fontSize: baseSize }}>
          {contactParts.join('   ·   ')}
        </div>
      )}
      {b.summary && <p className="text-slate-600 mb-5 leading-loose" style={{ fontSize: baseSize }}>{b.summary}</p>}
    </div>
  );
}



interface PreviewCtx {
  draft: ResumeBuilderDraft;
  accent: string;
  baseSize: string;
  titleSize: string;
  nameSize: string;
  visibleOrder: BuilderSectionKey[];
}

function SectionBlock({ section, accent, baseSize, titleSize, children, title }: { section: BuilderSectionKey; accent: string; baseSize: string; titleSize: string; children: React.ReactNode; title?: string }) {
  return (
    <div className="mb-4 preview-break-avoid">
      <h2 className="font-bold mb-1.5 pb-1" style={{ fontSize: titleSize, color: accent, borderBottom: `1.5px solid ${accent}` }}>
        {title ?? SECTION_META[section].title}
      </h2>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function SectionBody({ section, draft, accent, baseSize, titleSize }: { section: BuilderSectionKey; draft: ResumeBuilderDraft; accent: string; baseSize: string; titleSize: string }) {
  if (section === 'custom') {
    return (
      <>
        {draft.customSections.map((mod) => (
          <SectionBlock key={mod.id} section="custom" accent={accent} baseSize={baseSize} titleSize={titleSize} title={mod.title}>
            {mod.entries.map((item) => <EntryRow key={item.id} section="custom" item={item as unknown as BuilderEntry} baseSize={baseSize} />)}
          </SectionBlock>
        ))}
      </>
    );
  }
  return (
    <SectionBlock section={section} accent={accent} baseSize={baseSize} titleSize={titleSize}>
      {(draft[section] as BuilderEntry[]).map((item) => <EntryRow key={item.id} section={section} item={item} baseSize={baseSize} />)}
    </SectionBlock>
  );
}

function EntryRow({ section, item, baseSize }: { section: BuilderSectionKey; item: BuilderEntry; baseSize: string }) {
  const { left, right, body } = previewLines(section, item);
  return (
    <div className="mb-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-semibold text-slate-800" style={{ fontSize: baseSize }}>{left}</span>
        {right && <span className="text-slate-500 shrink-0" style={{ fontSize: baseSize }}>{right}</span>}
      </div>
      {body && <p className="text-slate-600 whitespace-pre-wrap leading-relaxed mt-0.5" style={{ fontSize: baseSize }}>{body}</p>}
    </div>
  );
}

/** 分节标题原子：经典样式（下划线）由模板决定，这里给标题自身加下间距。 */
function SectionTitle({ section, accent, titleSize, title }: { section: BuilderSectionKey; accent: string; titleSize: string; title?: string }) {
  const text = title ?? SECTION_META[section].title;
return (
    <div className="mb-2">
      <h2 className="font-bold pb-1" style={{ fontSize: titleSize, color: accent, borderBottom: `1.5px solid ${accent}` }}>
        {text}
      </h2>
    </div>
  );
}

function previewLines(key: BuilderSectionKey, item: BuilderEntry): { left: string; right: string; body: string } {
  switch (key) {
    case 'education': {
      const e = item as EducationEntry;
      return {
        left: [e.school, e.major, e.degree].filter(Boolean).join(' | '),
        right: [e.startDate, e.endDate].filter(Boolean).join(' - '),
        body: e.description,
      };
    }
    case 'workExperience': {
      const w = item as WorkExperienceEntry;
      return {
        left: [w.company, w.position].filter(Boolean).join(' | '),
        right: [w.startDate, w.endDate].filter(Boolean).join(' - '),
        body: w.description,
      };
    }
    case 'projects': {
      const p = item as ProjectEntry;
      return {
        left: [p.name, p.role].filter(Boolean).join(' | '),
        right: [p.startDate, p.endDate].filter(Boolean).join(' - '),
        body: p.description,
      };
    }
    case 'coreSkills': {
      const s = item as CoreSkillEntry;
      return { left: s.category ? `${s.category}：${s.skills}` : s.skills, right: '', body: '' };
    }
    case 'personalStrengths': {
      const p = item as PersonalStrengthEntry;
      return { left: p.content, right: '', body: '' };
    }
    case 'custom': {
      const c = item as { title?: string; detail?: string; description?: string };
      return { left: c.title ?? '', right: c.detail ?? '', body: c.description ?? '' };
    }
  }
}

const inputCls = 'w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500';
