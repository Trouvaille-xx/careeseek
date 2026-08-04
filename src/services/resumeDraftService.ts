import type {
  FinalResume,
  ResumeLibrary,
  ResumeBuilderDraft,
  EducationEntry,
  WorkExperienceEntry,
  ProjectEntry,
  CoreSkillEntry,
  BuilderSectionKey,
} from '@/types';

function genId() { return Math.random().toString(36).slice(2, 10); }

function findSection(resume: FinalResume, keyword: string): string | null {
  const s = resume.sections.find((x) => x.title.includes(keyword));
  return s ? s.content : null;
}

/** 把最终简历（AI 生成的 sections）转换成简历制作器草稿（默认 classic 模板） */
export function finalResumeToDraft(
  resume: FinalResume,
  library: ResumeLibrary,
  personalInfoLine?: string
): ResumeBuilderDraft {
  // 解析基本信息：优先简历库，其次从简历原文首行提取
  const basic = library.basicInfo
    ? { ...library.basicInfo }
    : { name: '', phone: '', email: '', city: '', jobIntent: '', website: '', summary: '' };
  if (!library.basicInfo && personalInfoLine) {
    basic.name = personalInfoLine.split(/[\s|,，/]+/)[0] ?? '';
    const email = personalInfoLine.match(/[\w.+-]+@[\w-]+\.[\w.]+/)?.[0] ?? '';
    const phone = personalInfoLine.match(/1[3-9]\d{9}/)?.[0] ?? '';
    if (email) basic.email = email;
    if (phone) basic.phone = phone;
  }

  // 教育
  const education: EducationEntry[] = [];
  const eduContent = findSection(resume, '教育');
  if (eduContent) {
    eduContent.split('\n').filter(Boolean).forEach((line) => {
      if (line.length > 10) {
        education.push({
          id: genId(), school: line.split(' ')[0] ?? '', major: '', degree: '',
          startDate: '', endDate: '', description: line, status: 'approved',
        });
      }
    });
  }

  // 工作经历
  const workExperience: WorkExperienceEntry[] = [];
  const workContent = findSection(resume, '工作');
  if (workContent) {
    workContent.split(/\n(?=\S)/).filter(Boolean).forEach((block) => {
      if (block.trim().length <= 10) return;
      const lines = block.split('\n');
      const parts = (lines[0] ?? '').split('|');
      workExperience.push({
        id: genId(), company: parts[0]?.trim() ?? '', position: parts[1]?.trim() ?? '',
        startDate: '', endDate: '',
        description: lines.map((l) => l.trim()).filter(Boolean).join('\n'),
        status: 'approved',
      });
    });
  }

  // 项目经历
  const projects: ProjectEntry[] = [];
  const projContent = findSection(resume, '项目');
  if (projContent) {
    projContent.split(/\n(?=\S)/).filter(Boolean).forEach((block) => {
      if (block.trim().length <= 10) return;
      projects.push({
        id: genId(), name: block.split('\n')[0]?.slice(0, 30) ?? '', role: '',
        startDate: '', endDate: '', description: block.trim(), status: 'approved',
      });
    });
  }

  // 技能
  const coreSkills: CoreSkillEntry[] = [];
  const skillContent = findSection(resume, '技能') ?? findSection(resume, '能力');
  if (skillContent) {
    skillContent.split('\n').filter(Boolean).forEach((line) => {
      if (line.trim().length > 5) {
        coreSkills.push({
          id: genId(),
          category: line.split(/[：:]/)[0]?.trim() || '技能',
          skills: line.trim(), status: 'approved',
        });
      }
    });
  }

  const sectionOrder: BuilderSectionKey[] = ['education', 'workExperience', 'projects', 'coreSkills', 'personalStrengths'];
  const customSections = library.customModules.map((m) => ({ id: m.id, title: m.title, entries: m.entries.map((e) => ({ ...e })) }));
  if (customSections.length > 0) sectionOrder.push('custom');

  return {
    id: `draft-${genId()}`,
    name: 'AI 优化简历',
    updatedAt: Date.now(),
    basicInfo: basic,
    sectionOrder,
    visibleSections: {
      education: education.length > 0,
      workExperience: workExperience.length > 0,
      projects: projects.length > 0,
      coreSkills: coreSkills.length > 0,
      personalStrengths: false,
      custom: customSections.length > 0,
    },
    template: 'classic',
    accentColor: 'slate',
    fontSize: 'medium',
    education,
    workExperience,
    projects,
    coreSkills,
    personalStrengths: [],
    customSections,
  };
}
