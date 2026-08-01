import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ResponsibilitiesEditor } from '@/components/ui/ResponsibilitiesEditor';
import { exportBuilderJSON, exportBuilderPDF } from '@/services/exportService';
import type { AccentColor, BuilderSectionKey, BuilderTemplate, EducationEntry, WorkExperienceEntry, ProjectEntry, CoreSkillEntry, PersonalStrengthEntry, ResumeBuilderDraft } from '@/types';

const SECTION_META: Record<BuilderSectionKey, { title: string; hint: string }> = {
  education: { title: '教育经历', hint: '学校、专业、学历与时间' },
  workExperience: { title: '工作经历', hint: '公司、职位与职责成就' },
  projects: { title: '项目经历', hint: '项目、角色与成果' },
  coreSkills: { title: '专业技能', hint: '技能分类与内容' },
  personalStrengths: { title: '个人优势', hint: '核心亮点与软素质' },
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

function genId() { return Math.random().toString(36).slice(2, 10); }

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
  const [entryDialog, setEntryDialog] = useState<{ section: BuilderSectionKey; entry: BuilderEntry | null } | null>(null);
  const [pickDialog, setPickDialog] = useState(false);
  const [dragSection, setDragSection] = useState<BuilderSectionKey | null>(null);
  const [overSection, setOverSection] = useState<BuilderSectionKey | null>(null);

  useEffect(() => {
    if (!useAppStore.getState().resumeBuilder) {
      useAppStore.getState().exitBuilder();
    }
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

  const handleExport = async (kind: 'pdf' | 'json') => {
    if (kind === 'json') {
      exportBuilderJSON(resumeBuilder);
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
          <select
            value=""
            onChange={(e) => { if (e.target.value) handleExport(e.target.value as 'pdf' | 'json'); }}
            className={`${selectCls} ${exportingPdf ? 'opacity-60' : ''} font-medium text-primary-600 dark:text-primary-400`}
            disabled={exportingPdf}
            title="导出"
          >
            <option value="" disabled>{exportingPdf ? '生成中…' : '导出 ▼'}</option>
            <option value="pdf">导出 PDF</option>
            <option value="json">导出 JSON</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Editor */}
        <div className="space-y-5">
          <BasicInfoCard />

          {resumeBuilder.sectionOrder.map((key, idx) => {
            const meta = SECTION_META[key];
            const items = resumeBuilder[key];
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
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-300 cursor-grab hover:text-primary-500 transition-colors dark:text-neutral-600" title="拖拽调整模块顺序">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm9 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM9 12a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm9 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM9 19a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm9 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                        </svg>
                      </span>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">{meta.title}</h3>
                      <span className="text-[10px] text-slate-400">{meta.hint}</span>
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

                  {items.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">暂无内容，点击下方按钮添加</p>
                  ) : (
                    <div className="space-y-2 mt-3">
                      {items.map((entry) => (
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

                  <button
                    onClick={() => setEntryDialog({ section: key, entry: null })}
                    className="w-full mt-3 py-2 text-xs text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg border border-dashed border-slate-200 hover:border-primary-300 transition-colors dark:text-neutral-400 dark:hover:bg-neutral-700/50 dark:border-neutral-600"
                  >
                    + 添加{meta.title}
                  </button>
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
            if (entryDialog.entry) {
              store.updateBuilderEntry(entryDialog.section, entryDialog.entry.id, entry);
            } else {
              store.addBuilderEntry(entryDialog.section, entry);
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
      <div className="grid grid-cols-2 gap-3">
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
  }
}

// ============ Entry form dialog ============

const DATE_FIELDS: { key: 'startDate' | 'endDate'; label: string }[] = [
  { key: 'startDate', label: '开始时间' },
  { key: 'endDate', label: '结束时间' },
];

function EntryFormDialog({ section, entry, onClose, onSubmit }: {
  section: BuilderSectionKey;
  entry: BuilderEntry | null;
  onClose: () => void;
  onSubmit: (entry: BuilderEntry) => void;
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
  } else {
    fields.push({ key: 'content', label: '优势内容', textarea: true });
  }
  const descLabel = section === 'workExperience' ? null : section === 'projects' ? '项目职责与成果' : section === 'education' ? '在校表现与荣誉' : null;

  const valid = (() => {
    const required = section === 'personalStrengths' ? 'content' : section === 'coreSkills' ? 'skills' : section === 'education' ? 'school' : section === 'workExperience' ? 'company' : 'name';
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
          {section !== 'coreSkills' && section !== 'personalStrengths' && (
            <div className="grid grid-cols-2 gap-3">
              {DATE_FIELDS.map((d) => (
                <div key={d.key}>
                  <label className="block text-xs font-medium text-slate-600 mb-1 dark:text-neutral-400">{d.label}</label>
                  <input type="month" value={str(d.key)} onChange={(e) => set(d.key, e.target.value)} className={inputCls} />
                </div>
              ))}
            </div>
          )}
          {section === 'workExperience' ? (
            <ResponsibilitiesEditor
              items={Array.isArray(form.responsibilities) ? (form.responsibilities as string[]) : []}
              onChange={(items) => setForm((f) => ({ ...f, responsibilities: items }))}
            />
          ) : descLabel ? (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1 dark:text-neutral-400">{descLabel}</label>
              <textarea value={str('description')} onChange={(e) => set('description', e.target.value)} rows={4} placeholder="每行一条，用「- 」开头更清晰" className={inputCls + ' resize-none'} />
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
            } as BuilderEntry)}
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
  const { resumeBuilder, resumeLibrary, addBuilderEntry } = useAppStore();
  if (!resumeBuilder) return null;

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const allSections: { key: BuilderSectionKey; items: BuilderEntry[] }[] = [
    { key: 'education', items: resumeLibrary.education },
    { key: 'workExperience', items: resumeLibrary.workExperience },
    { key: 'projects', items: resumeLibrary.projects },
    { key: 'coreSkills', items: resumeLibrary.coreSkills },
    { key: 'personalStrengths', items: resumeLibrary.personalStrengths },
  ];

  const existingIds = new Set(Object.values(resumeBuilder).flatMap((v) => Array.isArray(v) ? v.map((e: BuilderEntry) => e.id) : []));
  const available = allSections
    .map((s) => ({ ...s, items: s.items.filter((i) => !existingIds.has(i.id)) }))
    .filter((s) => s.items.length > 0);
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
          {available.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">简历库中暂无可用条目</p>
          ) : (
            available.map((s) => (
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
            ))
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

function ResumePreview({ draft }: { draft: ResumeBuilderDraft }) {
  const accent = ACCENT_HEX[draft.accentColor] ?? ACCENT_HEX.slate;
  const baseSize = draft.fontSize === 'small' ? '10px' : draft.fontSize === 'large' ? '12px' : '11px';
  const titleSize = draft.fontSize === 'small' ? '12px' : draft.fontSize === 'large' ? '15px' : '13px';
  const nameSize = draft.fontSize === 'small' ? '20px' : draft.fontSize === 'large' ? '26px' : '23px';

  const visibleOrder = draft.sectionOrder.filter((k) => draft.visibleSections[k] && draft[k].length > 0);

  return (
    <div className="bg-slate-100 rounded-xl p-4 sm:p-6 dark:bg-neutral-800/80">
      <div className="bg-white shadow-lg rounded-sm aspect-[210/297] mx-auto max-w-[420px] overflow-hidden" style={{ fontFamily: 'inherit' }}>
        {draft.template === 'sidebar' ? (
          <SidebarPreview draft={draft} accent={accent} baseSize={baseSize} titleSize={titleSize} nameSize={nameSize} visibleOrder={visibleOrder} />
        ) : draft.template === 'header' ? (
          <HeaderPreview draft={draft} accent={accent} baseSize={baseSize} titleSize={titleSize} nameSize={nameSize} visibleOrder={visibleOrder} />
        ) : draft.template === 'minimal' ? (
          <MinimalPreview draft={draft} accent={accent} baseSize={baseSize} titleSize={titleSize} nameSize={nameSize} visibleOrder={visibleOrder} />
        ) : (
          <ClassicPreview draft={draft} accent={accent} baseSize={baseSize} titleSize={titleSize} nameSize={nameSize} visibleOrder={visibleOrder} />
        )}
      </div>
    </div>
  );
}

/** 经典单栏：姓名 + 联系行 + 单栏分节 */
function ClassicPreview({ draft, accent, baseSize, titleSize, nameSize, visibleOrder }: PreviewCtx) {
  const b = draft.basicInfo;
  const contactParts = [b.jobIntent, b.phone, b.email, b.city, b.website].filter(Boolean);
  return (
    <div className="p-6">
      {b.name && <h1 className="font-bold tracking-wide mb-1" style={{ fontSize: nameSize, color: accent }}>{b.name}</h1>}
      {contactParts.length > 0 && (
        <div className="text-slate-500 mb-2 leading-relaxed" style={{ fontSize: baseSize }}>
          {contactParts.join('  |  ')}
        </div>
      )}
      {b.summary && <p className="text-slate-600 mb-3 leading-relaxed" style={{ fontSize: baseSize }}>{b.summary}</p>}
      {visibleOrder.map((key) => (
        <SectionBlock key={key} section={key} accent={accent} baseSize={baseSize} titleSize={titleSize}>
          {(draft[key] as BuilderEntry[]).map((item) => <EntryRow key={item.id} section={key} item={item} baseSize={baseSize} />)}
        </SectionBlock>
      ))}
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
    <div className="flex min-h-full">
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
              {(draft[key] as BuilderEntry[]).map((item) => {
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
          <SectionBlock key={key} section={key} accent={accent} baseSize={baseSize} titleSize={titleSize}>
            {(draft[key] as BuilderEntry[]).map((item) => <EntryRow key={item.id} section={key} item={item} baseSize={baseSize} />)}
          </SectionBlock>
        ))}
      </div>
    </div>
  );
}

/** 顶部横幅：深色横幅姓名+意向，下方经典单栏 */
function HeaderPreview({ draft, accent, baseSize, titleSize, nameSize, visibleOrder }: PreviewCtx) {
  const b = draft.basicInfo;
  const contactParts = [b.phone, b.email, b.city, b.website].filter(Boolean);
  return (
    <div>
      <div className="px-6 py-5 text-white" style={{ backgroundColor: accent }}>
        <h1 className="font-bold tracking-wide" style={{ fontSize: nameSize }}>{b.name || b.jobIntent || '姓名'}</h1>
        {b.jobIntent && <p className="mt-0.5" style={{ fontSize: baseSize, opacity: 0.85 }}>{b.jobIntent}</p>}
        {contactParts.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5" style={{ fontSize: baseSize, opacity: 0.85 }}>
            {contactParts.map((p) => <span key={p}>{p}</span>)}
          </div>
        )}
      </div>
      <div className="p-6">
        {b.summary && <p className="text-slate-600 mb-3 leading-relaxed" style={{ fontSize: baseSize }}>{b.summary}</p>}
        {visibleOrder.map((key) => (
          <SectionBlock key={key} section={key} accent={accent} baseSize={baseSize} titleSize={titleSize}>
            {(draft[key] as BuilderEntry[]).map((item) => <EntryRow key={item.id} section={key} item={item} baseSize={baseSize} />)}
          </SectionBlock>
        ))}
      </div>
    </div>
  );
}

/** 极简留白：大间距、无下划线标题 */
function MinimalPreview({ draft, accent, baseSize, titleSize, nameSize, visibleOrder }: PreviewCtx) {
  const b = draft.basicInfo;
  const contactParts = [b.jobIntent, b.phone, b.email, b.city, b.website].filter(Boolean);
  return (
    <div className="p-8">
      {b.name && <h1 className="font-light tracking-[0.2em] mb-2" style={{ fontSize: nameSize, color: accent }}>{b.name}</h1>}
      {contactParts.length > 0 && (
        <div className="text-slate-500 mb-4 leading-relaxed" style={{ fontSize: baseSize }}>
          {contactParts.join('   ·   ')}
        </div>
      )}
      {b.summary && <p className="text-slate-600 mb-5 leading-loose" style={{ fontSize: baseSize }}>{b.summary}</p>}
      {visibleOrder.map((key) => (
        <div key={key} className="mb-5">
          <h2 className="font-normal tracking-[0.3em] mb-2.5" style={{ fontSize: titleSize, color: accent }}>{SECTION_META[key].title}</h2>
          <div className="space-y-3">
            {(draft[key] as BuilderEntry[]).map((item) => {
              const { left, right, body } = previewLines(key, item);
              return (
                <div key={item.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-slate-800" style={{ fontSize: baseSize, fontWeight: 500 }}>{left}</span>
                    {right && <span className="text-slate-400 shrink-0" style={{ fontSize: baseSize }}>{right}</span>}
                  </div>
                  {body && <p className="text-slate-500 whitespace-pre-wrap leading-loose mt-0.5" style={{ fontSize: baseSize }}>{body}</p>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
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

function SectionBlock({ section, accent, baseSize, titleSize, children }: { section: BuilderSectionKey; accent: string; baseSize: string; titleSize: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className="font-bold mb-1.5 pb-1" style={{ fontSize: titleSize, color: accent, borderBottom: `1.5px solid ${accent}` }}>
        {SECTION_META[section].title}
      </h2>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function EntryRow({ section, item, baseSize }: { section: BuilderSectionKey; item: BuilderEntry; baseSize: string }) {
  const { left, right, body } = previewLines(section, item);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-semibold text-slate-800" style={{ fontSize: baseSize }}>{left}</span>
        {right && <span className="text-slate-500 shrink-0" style={{ fontSize: baseSize }}>{right}</span>}
      </div>
      {body && <p className="text-slate-600 whitespace-pre-wrap leading-relaxed mt-0.5" style={{ fontSize: baseSize }}>{body}</p>}
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
        body: (w.responsibilities ?? []).join('\n'),
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
  }
}

const inputCls = 'w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500';
