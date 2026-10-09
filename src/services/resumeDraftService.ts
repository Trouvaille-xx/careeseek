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

/**
 * 各模块的标题别名。
 * 原先只按「工作」匹配，模型把标题写成「实习经历」时整节会被丢掉；这里按别名逐个尝试。
 */
const SECTION_ALIASES = {
  education: ['教育', '学历', '学习经历'],
  work: ['工作', '实习', '任职', '职业经历'],
  projects: ['项目'],
  skills: ['技能', '能力', '专长'],
} as const;

function findSection(resume: FinalResume, key: keyof typeof SECTION_ALIASES): string | null {
  const aliases: readonly string[] = SECTION_ALIASES[key];
  const s = resume.sections.find((x) => aliases.some((a) => x.title.includes(a)));
  return s ? s.content : null;
}

/** 去掉行首的列表符号（-、•、* 等）与多余空白 */
function stripBullet(line: string): string {
  return line.replace(/^\s*[-•*·]\s*/, '').trim();
}

/** 是否是给用户的填写提示行（【待补充…】【待确认…】），而不是真正的简历内容 */
function isPlaceholder(line: string): boolean {
  return /^【/.test(stripBullet(line));
}

/** 从 "2019.09-2023.06" / "2020.01 – 至今" 这类文本里拆出入职/离职时间 */
function splitDates(text: string): { startDate: string; endDate: string } {
  const m = text.match(/(\d{4}[.\-/年]?\d{0,2})\s*[-–—~至]\s*(\d{4}[.\-/年]?\d{0,2}|至今|现在|今)/);
  if (!m) return { startDate: '', endDate: '' };
  return { startDate: m[1].trim(), endDate: m[2].trim() };
}

/** 判断一行是否像「新条目的首行」（公司/项目表头）：含分隔符、含年份，或本身很短 */
function looksLikeHeader(line: string): boolean {
  const t = line.trim();
  if (!t || /^\s*[-•*·]/.test(t)) return false;
  return /[｜|]/.test(t) || /\d{4}/.test(t) || t.length <= 20;
}

/**
 * 把一段经历拆成若干条目。
 * 旧实现用 `\n(?=\S)` 分块，而 `- ` 开头的列表项也是非空白字符 —— 结果每个 bullet 都会被拆成一条独立经历，
 * 表头行又同时进结构字段和正文。这里改为：只有「像表头的行」才开新条目，其余行（含列表项）归入正文。
 */
function groupEntries(content: string): { header: string; body: string[] }[] {
  const out: { header: string; body: string[] }[] = [];
  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (looksLikeHeader(line)) {
      out.push({ header: line, body: [] });
    } else if (out.length > 0) {
      out[out.length - 1].body.push(line);
    } else {
      out.push({ header: '', body: [line] });
    }
  }
  return out;
}

/**
 * 把「公司｜职位｜时间」这类首行拆成结构化字段。
 * 时间不再留在正文里，避免模板同时渲染结构化字段与正文时出现重复。
 */
function splitHeader(header: string): { left: string; right: string; startDate: string; endDate: string } {
  const parts = header.split(/[｜|]/).map((p) => p.trim()).filter(Boolean);
  const dateText = parts.find((p) => /\d{4}/.test(p)) ?? '';
  const rest = parts.filter((p) => p !== dateText);
  const { startDate, endDate } = splitDates(dateText);
  // 首行若形如「项目名（2023.04-2023.09）」，把括号里的时间挪到 right，名字保持干净
  let left = rest.join(' | ');
  if (dateText && !left) left = header.replace(/\s*[（(][^）)]*[）)]\s*$/, '').trim();
  return { left, right: [startDate, endDate].filter(Boolean).join(' - '), startDate, endDate };
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
  const eduContent = findSection(resume, 'education');
  if (eduContent) {
    for (const raw of eduContent.split('\n')) {
      const line = stripBullet(raw);
      if (!line) continue;
      // 【待补充…】是给用户的填写提示，不是一条学历：挂到上一条的备注里，避免被当成学校名重复渲染
      if (isPlaceholder(line)) {
        const prev = education[education.length - 1];
        if (prev) {
          prev.description = prev.description ? `${prev.description}\n${line}` : line;
        } else {
          education.push({
            id: genId(), school: line, major: '', degree: '',
            startDate: '', endDate: '', description: '', status: 'approved',
          });
        }
        continue;
      }
      if (line.length <= 4) continue;
      const parts = line.split(/[｜|]/).map((p) => p.trim()).filter(Boolean);
      const dateText = parts.find((p) => /\d{4}/.test(p)) ?? '';
      const rest = parts.filter((p) => p !== dateText);
      const { startDate, endDate } = splitDates(dateText);
      education.push({
        id: genId(),
        school: rest[0] ?? line,
        major: rest[1] ?? '',
        degree: rest[2] ?? '',
        startDate,
        endDate,
        // 学校/专业/学历/时间都由结构字段渲染，正文留空，避免整行重复出现
        description: '',
        status: 'approved',
      });
    }
  }

  // 工作经历
  const workExperience: WorkExperienceEntry[] = [];
  const workContent = findSection(resume, 'work');
  if (workContent) {
    for (const { header, body } of groupEntries(workContent)) {
      if (!header && body.join('').length <= 10) continue;
      const parts = header.split(/[｜|]/).map((p) => p.trim()).filter(Boolean);
      const dateText = parts.find((p) => /\d{4}/.test(p)) ?? '';
      const rest = parts.filter((p) => p !== dateText);
      const { startDate, endDate } = splitDates(dateText);
      workExperience.push({
        id: genId(),
        company: rest[0] ?? '',
        position: rest[1] ?? '',
        startDate,
        endDate,
        // 公司/职位/时间已由结构字段渲染，正文只保留后续条目，避免整行重复
        description: body.join('\n'),
        status: 'approved',
      });
    }
  }

  // 项目经历
  const projects: ProjectEntry[] = [];
  const projContent = findSection(resume, 'projects');
  if (projContent) {
    for (const { header, body } of groupEntries(projContent)) {
      if (!header && body.join('').length <= 10) continue;
      const h = splitHeader(header);
      projects.push({
        id: genId(),
        // 不再硬截 30 字（原先会把「…2023.04-2023.09）」截断，与正文形成半截重复）
        name: h.left || header,
        role: '',
        startDate: h.startDate,
        endDate: h.endDate,
        description: body.join('\n'),
        status: 'approved',
      });
    }
  }

  // 技能
  const coreSkills: CoreSkillEntry[] = [];
  const skillContent = findSection(resume, 'skills');
  if (skillContent) {
    skillContent.split('\n').forEach((raw) => {
      const line = stripBullet(raw);
      if (line.length <= 2) return;
      // 「数据分析：SQL、Python」拆成 分类 + 内容；模板渲染为「分类：内容」，若两边都存整行就会重复
      const idx = line.search(/[：:]/);
      const category = idx > 0 ? line.slice(0, idx).trim() : '';
      const skills = idx > 0 ? line.slice(idx + 1).trim() : line;
      if (!skills) return;
      coreSkills.push({ id: genId(), category, skills, status: 'approved' });
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
