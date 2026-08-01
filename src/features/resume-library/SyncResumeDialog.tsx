import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/Button';
import type { EducationEntry, WorkExperienceEntry, ProjectEntry, CoreSkillEntry, ResumeBuilderDraft } from '@/types';

function genId() { return Math.random().toString(36).slice(2, 10); }

export function SyncResumeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { finalResume, resumeLibrary, addEducation, addWorkExperience, addProject, addCoreSkill, userInput } = useAppStore();

  const [parsed, setParsed] = useState<{
    education: { content: string; checked: boolean }[];
    workExperience: { content: string; checked: boolean }[];
    projects: { content: string; checked: boolean }[];
    coreSkills: { content: string; checked: boolean }[];
  }>({ education: [], workExperience: [], projects: [], coreSkills: [] });

  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (!open || !finalResume) return;

    const sections = finalResume.sections;
    const edu: { content: string; checked: boolean }[] = [];
    const work: { content: string; checked: boolean }[] = [];
    const proj: { content: string; checked: boolean }[] = [];
    const skills: { content: string; checked: boolean }[] = [];

    // Parse education background
    const eduSection = sections.find((s) => s.title.includes('教育'));
    if (eduSection) {
      const lines = eduSection.content.split('\n').filter(Boolean);
      lines.forEach((line) => {
        if (line.length > 10) edu.push({ content: line, checked: true });
      });
    }
    if (edu.length === 0) edu.push({ content: resumeLibrary.education.map((e) => `${e.school} ${e.major} ${e.degree} ${e.startDate}-${e.endDate}`).join('\n') || '暂无教育背景数据', checked: true });

    // Parse work experience
    const workSection = sections.find((s) => s.title.includes('工作'));
    if (workSection) {
      const blocks = workSection.content.split(/\n(?=\S)/).filter(Boolean);
      blocks.forEach((block) => {
        if (block.trim().length > 10) work.push({ content: block.trim(), checked: true });
      });
    }
    if (work.length === 0) work.push({ content: '暂无工作经历数据', checked: true });

    // Parse projects
    const projSection = sections.find((s) => s.title.includes('项目'));
    if (projSection) {
      const blocks = projSection.content.split(/\n(?=\S)/).filter(Boolean);
      blocks.forEach((block) => {
        if (block.trim().length > 10) proj.push({ content: block.trim(), checked: true });
      });
    }
    if (proj.length === 0) proj.push({ content: '暂无项目经历数据', checked: true });

    // Parse skills
    const skillSection = sections.find((s) => s.title.includes('技能') || s.title.includes('能力'));
    if (skillSection) {
      const lines = skillSection.content.split('\n').filter(Boolean);
      lines.forEach((line) => {
        if (line.length > 5) skills.push({ content: line.trim(), checked: true });
      });
    }
    if (skills.length === 0) skills.push({ content: '暂无技能数据', checked: true });

    setParsed({ education: edu, workExperience: work, projects: proj, coreSkills: skills });
    setSynced(false);
  }, [open, finalResume]);

  const toggleCheck = (section: 'education' | 'workExperience' | 'projects' | 'coreSkills', idx: number) => {
    setParsed((prev) => {
      const items = [...prev[section]];
      items[idx] = { ...items[idx], checked: !items[idx].checked };
      return { ...prev, [section]: items };
    });
  };

  const handleSync = () => {
    // Add education
    parsed.education.forEach((item) => {
      if (!item.checked) return;
      const entry: EducationEntry = {
        id: genId(), school: item.content.split(' ')[0] || '', major: '', degree: '',
        startDate: '', endDate: '', description: item.content, status: 'draft',
      };
      addEducation(entry);
    });

    // Add work experience
    parsed.workExperience.forEach((item) => {
      if (!item.checked) return;
      const lines = item.content.split('\n');
      const firstLine = lines[0] || '';
      const parts = firstLine.split('|');
      const entry: WorkExperienceEntry = {
        id: genId(), company: parts[0]?.trim() || '', position: parts[1]?.trim() || '',
        startDate: '', endDate: '',
        responsibilities: lines.map((l) => l.replace(/^[-•·]\s*/, '').trim()).filter(Boolean),
        status: 'draft',
      };
      addWorkExperience(entry);
    });

    // Add projects
    parsed.projects.forEach((item) => {
      if (!item.checked) return;
      const entry: ProjectEntry = {
        id: genId(), name: item.content.split('\n')[0]?.slice(0, 30) || '', role: '',
        startDate: '', endDate: '', description: item.content, status: 'draft',
      };
      addProject(entry);
    });

    // Add skills
    parsed.coreSkills.forEach((item) => {
      if (!item.checked) return;
      const entry: CoreSkillEntry = {
        id: genId(), category: item.content.split('：')[0]?.split(':')[0]?.trim() || '技能',
        skills: item.content, status: 'draft',
      };
      addCoreSkill(entry);
    });

    setSynced(true);
  };

  const handleSyncToBuilder = () => {
    const store = useAppStore.getState();
    const blank = { name: '', phone: '', email: '', city: '', jobIntent: '', website: '', summary: '' };
    const draft: ResumeBuilderDraft = {
      id: `draft-${Math.random().toString(36).slice(2, 10)}`,
      name: 'AI 优化简历',
      updatedAt: Date.now(),
      basicInfo: store.resumeLibrary.basicInfo ? { ...store.resumeLibrary.basicInfo } : blank,
      sectionOrder: ['education', 'workExperience', 'projects', 'coreSkills', 'personalStrengths'],
      visibleSections: { education: true, workExperience: true, projects: true, coreSkills: true, personalStrengths: true },
      template: 'classic',
      accentColor: 'slate',
      fontSize: 'medium',
      education: parsed.education.filter((i) => i.checked).map((item) => ({
        id: genId(), school: item.content.split(' ')[0] || '', major: '', degree: '',
        startDate: '', endDate: '', description: item.content, status: 'approved',
      })),
      workExperience: parsed.workExperience.filter((i) => i.checked).map((item) => {
        const lines = item.content.split('\n');
        const parts = (lines[0] || '').split('|');
        return {
          id: genId(), company: parts[0]?.trim() || '', position: parts[1]?.trim() || '',
          startDate: '', endDate: '',
          responsibilities: lines.map((l) => l.replace(/^[-•·]\s*/, '').trim()).filter(Boolean),
          status: 'approved' as const,
        };
      }),
      projects: parsed.projects.filter((i) => i.checked).map((item) => ({
        id: genId(), name: item.content.split('\n')[0]?.slice(0, 30) || '', role: '',
        startDate: '', endDate: '', description: item.content, status: 'approved',
      })),
      coreSkills: parsed.coreSkills.filter((i) => i.checked).map((item) => ({
        id: genId(), category: item.content.split('：')[0]?.split(':')[0]?.trim() || '技能',
        skills: item.content, status: 'approved',
      })),
      personalStrengths: [],
    };
    store.importBuilderDraft(draft);
    store.setCurrentStep(-1);
    onClose();
  };

  if (!open) return null;

  const hasData = parsed.education.length > 0 || parsed.workExperience.length > 0 || parsed.projects.length > 0 || parsed.coreSkills.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg mx-4 max-h-[80vh] flex flex-col animate-slide-up dark:bg-neutral-800 dark:border-neutral-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-0 shrink-0">
          <h2 className="text-base font-semibold text-slate-900 dark:text-neutral-100">同步到简历库</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors dark:text-neutral-500 dark:hover:text-neutral-300 dark:hover:bg-neutral-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {synced ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3 dark:bg-emerald-900/40">
                <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-900 mb-1 dark:text-neutral-100">已同步到简历库</p>
              <p className="text-xs text-slate-500 dark:text-neutral-400">同步内容为草稿状态，请在简历库中审核确认</p>
              <Button className="mt-4" size="sm" onClick={onClose}>我知道了</Button>
            </div>
          ) : !hasData ? (
            <div className="text-center py-6 text-sm text-slate-400 dark:text-neutral-500">暂无可同步的简历数据</div>
          ) : (
            <>
              <p className="text-sm text-slate-600 dark:text-neutral-300">检测到优化后的简历内容，是否将以下数据同步到简历库？同步后将保存为草稿，可前往简历库审核编辑。</p>

              {/* Education */}
              {parsed.education.length > 0 && (
                <SectionPreview title="教育背景" count={parsed.education.length}>
                  {parsed.education.map((item, i) => (
                    <PreviewItem key={i} checked={item.checked} content={item.content} onToggle={() => toggleCheck('education', i)} />
                  ))}
                </SectionPreview>
              )}

              {/* Work */}
              {parsed.workExperience.length > 0 && (
                <SectionPreview title="工作经历" count={parsed.workExperience.length}>
                  {parsed.workExperience.map((item, i) => (
                    <PreviewItem key={i} checked={item.checked} content={item.content} onToggle={() => toggleCheck('workExperience', i)} />
                  ))}
                </SectionPreview>
              )}

              {/* Projects */}
              {parsed.projects.length > 0 && (
                <SectionPreview title="项目经历" count={parsed.projects.length}>
                  {parsed.projects.map((item, i) => (
                    <PreviewItem key={i} checked={item.checked} content={item.content} onToggle={() => toggleCheck('projects', i)} />
                  ))}
                </SectionPreview>
              )}

              {/* Skills */}
              {parsed.coreSkills.length > 0 && (
                <SectionPreview title="专业技能" count={parsed.coreSkills.length}>
                  {parsed.coreSkills.map((item, i) => (
                    <PreviewItem key={i} checked={item.checked} content={item.content} onToggle={() => toggleCheck('coreSkills', i)} />
                  ))}
                </SectionPreview>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!synced && hasData && (
          <div className="flex items-center justify-end gap-3 px-6 pb-6 shrink-0">
            <Button variant="ghost" size="md" onClick={onClose}>跳过</Button>
            <Button variant="outline" size="md" onClick={handleSyncToBuilder}>同步到简历制作</Button>
            <Button size="md" onClick={handleSync}>同步到简历库</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionPreview({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-slate-900 dark:text-neutral-100">{title}</h4>
        <span className="text-xs text-slate-400 dark:text-neutral-500">{count} 项</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function PreviewItem({ checked, content, onToggle }: { checked: boolean; content: string; onToggle: () => void }) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer dark:border-neutral-700 dark:hover:border-neutral-600">
      <input type="checkbox" checked={checked} onChange={onToggle} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500/30 dark:border-neutral-600" />
      <span className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap line-clamp-3 dark:text-neutral-300">{content}</span>
    </label>
  );
}
