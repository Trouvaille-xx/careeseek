import type { FinalResume, ResumeBuilderDraft, BuilderSectionKey, AccentColor } from '@/types';

interface CJKFontDoc {
  addFileToVFS: (name: string, data: string) => void;
  addFont: (
    postScriptName: string,
    id: string,
    fontStyle: string,
    fontWeight?: string | number,
    encoding?: 'StandardEncoding' | 'MacRomanEncoding' | 'Identity-H' | 'WinAnsiEncoding',
    isStandardFont?: boolean
  ) => string;
}

const CJK_FONT_URL = 'https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf';
const CJK_FONT_NAME = 'NotoSansCJKsc';
const CJK_FONT_STYLE = 'normal';

let cjkFontLoaded = false;
let cjkFontLoading: Promise<boolean> | null = null;
let jsPdfModule: typeof import('jspdf') | null = null;

async function getJsPDF(): Promise<typeof import('jspdf')> {
  if (!jsPdfModule) {
    jsPdfModule = await import('jspdf');
  }
  return jsPdfModule;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * 加载 Noto Sans CJK SC 字体供 jsPDF 嵌入，失败时降级为 helvetica 并告警。
 * 字体按会话缓存；多次导出只加载一次。
 */
async function ensureCJKFont(doc: CJKFontDoc): Promise<boolean> {
  if (cjkFontLoaded) return true;
  if (cjkFontLoading) return cjkFontLoading;

  cjkFontLoading = (async () => {
    try {
      const res = await fetch(CJK_FONT_URL);
      if (!res.ok) throw new Error(`字体下载失败 (${res.status})`);
      const buffer = await res.arrayBuffer();
      doc.addFileToVFS(CJK_FONT_NAME, arrayBufferToBase64(buffer));
      doc.addFont(CJK_FONT_NAME, CJK_FONT_NAME, CJK_FONT_STYLE);
      cjkFontLoaded = true;
      return true;
    } catch (e) {
      console.warn('[export] CJK 字体加载失败，PDF 中文可能无法渲染:', e);
      return false;
    }
  })();

  return cjkFontLoading;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function buildExportJSON(resume: FinalResume): string {
  const payload = {
    title: 'CareeSeek 最终简历',
    exportedAt: new Date().toISOString(),
    sections: resume.sections,
  };
  return JSON.stringify(payload, null, 2);
}

export function buildExportText(resume: FinalResume): string {
  return resume.sections.map((s) => `${s.title}\n${s.content}`).join('\n\n');
}

export function exportJSON(resume: FinalResume): void {
  downloadBlob(
    new Blob([buildExportJSON(resume)], { type: 'application/json;charset=utf-8' }),
    'careeseek-resume.json'
  );
}

export async function exportPDF(resume: FinalResume): Promise<void> {
  const { jsPDF } = await getJsPDF();
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const hasCJK = await ensureCJKFont(doc);
  const fontName = hasCJK ? CJK_FONT_NAME : 'helvetica';

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxWidth = pageWidth - margin * 2;
  let y = 15;

  const ensureSpace = (needed: number) => {
    if (needsPageBreak(y, needed, pageHeight, margin)) {
      doc.addPage();
      y = margin;
    }
  };

  resume.sections.forEach((section, idx) => {
    const lines = doc.splitTextToSize(section.title, maxWidth);
    ensureSpace(8);
    doc.setFont(fontName, 'bold');
    doc.setFontSize(13);
    doc.text(lines, margin, y);
    y += 7;
    if (idx < resume.sections.length - 1) {
      doc.setDrawColor(180);
      doc.line(margin, y, pageWidth - margin, y);
      y += 3;
    }

    doc.setFont(fontName, 'normal');
    doc.setFontSize(10);
    const contentLines = doc.splitTextToSize(section.content, maxWidth);
    const lineHeight = 5;
    let first = true;
    for (const line of contentLines) {
      ensureSpace(lineHeight);
      if (first) { y += 2; first = false; }
      doc.text(line, margin, y);
      y += lineHeight;
    }
    y += 6;
  });

  doc.save('careeseek-resume.pdf');
}

// ============ Resume Builder export (结构化排版) ============

const SECTION_TITLES: Record<BuilderSectionKey, string> = {
  education: '教育经历',
  workExperience: '工作经历',
  projects: '项目经历',
  coreSkills: '专业技能',
  personalStrengths: '个人优势',
};

export function buildBuilderJSON(draft: ResumeBuilderDraft): string {
  const visible = draft.sectionOrder.filter((k) => draft.visibleSections[k]);
  const sections = visible.map((k) => ({
    title: SECTION_TITLES[k],
    items: draft[k],
  }));
  return JSON.stringify({
    title: 'CareeSeek 简历制作',
    exportedAt: new Date().toISOString(),
    template: draft.template,
    accentColor: draft.accentColor,
    fontSize: draft.fontSize,
    basicInfo: draft.basicInfo,
    sections,
  }, null, 2);
}

export function exportBuilderJSON(draft: ResumeBuilderDraft): void {
  downloadBlob(
    new Blob([buildBuilderJSON(draft)], { type: 'application/json;charset=utf-8' }),
    'careeseek-builder-resume.json'
  );
}

function builderEntryLines(kind: BuilderSectionKey, item: ResumeBuilderDraft[BuilderSectionKey][number]): { left: string; right: string; body: string } {
  switch (kind) {
    case 'education': {
      const e = item as ResumeBuilderDraft['education'][number];
      return {
        left: [e.school, e.major, e.degree].filter(Boolean).join(' | '),
        right: e.startDate && e.endDate ? `${e.startDate} - ${e.endDate}` : (e.startDate || e.endDate || ''),
        body: e.description,
      };
    }
    case 'workExperience': {
      const w = item as ResumeBuilderDraft['workExperience'][number];
      return {
        left: [w.company, w.position].filter(Boolean).join(' | '),
        right: w.startDate && w.endDate ? `${w.startDate} - ${w.endDate}` : (w.startDate || w.endDate || ''),
        body: (w.responsibilities ?? []).join('\n'),
      };
    }
    case 'projects': {
      const p = item as ResumeBuilderDraft['projects'][number];
      return {
        left: [p.name, p.role].filter(Boolean).join(' | '),
        right: p.startDate && p.endDate ? `${p.startDate} - ${p.endDate}` : (p.startDate || p.endDate || ''),
        body: p.description,
      };
    }
    case 'coreSkills': {
      const s = item as ResumeBuilderDraft['coreSkills'][number];
      return { left: s.category ? `${s.category}：${s.skills}` : s.skills, right: '', body: '' };
    }
    case 'personalStrengths': {
      const p = item as ResumeBuilderDraft['personalStrengths'][number];
      return { left: p.content, right: '', body: '' };
    }
  }
}

/** 主题色 → RGB（与预览一致） */
const ACCENT_RGB: Record<AccentColor, [number, number, number]> = {
  slate: [17, 24, 39],
  blue: [30, 64, 175],
  green: [6, 95, 70],
  red: [153, 27, 27],
  violet: [91, 33, 182],
};

/**
 * 分页判断：当前 y 位置加上所需空间后是否超出页面可用区域。
 * 抽成纯函数便于单测。
 */
export function needsPageBreak(y: number, needed: number, pageHeight: number, margin: number): boolean {
  return y + needed > pageHeight - margin;
}

export async function exportBuilderPDF(draft: ResumeBuilderDraft): Promise<void> {
  const { jsPDF } = await getJsPDF();
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const hasCJK = await ensureCJKFont(doc);
  const fontName = hasCJK ? CJK_FONT_NAME : 'helvetica';
  const accent: [number, number, number] = ACCENT_RGB[draft.accentColor] ?? ACCENT_RGB.slate;

  const sizeMap = {
    small: { header: 18, name: 19, entry: 9.5, body: 9 },
    medium: { header: 20, name: 21, entry: 10, body: 9.5 },
    large: { header: 21, name: 22, entry: 10.5, body: 10 },
  } as const;
  const sz = sizeMap[draft.fontSize];

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (needsPageBreak(y, needed, pageHeight, margin)) {
      doc.addPage();
      y = margin;
    }
  };

  const writeText = (text: string, x: number, size: number, style: 'normal' | 'bold', color?: [number, number, number], align?: 'right') => {
    doc.setFont(fontName, style);
    doc.setFontSize(size);
    if (color) doc.setTextColor(color[0], color[1], color[2]);
    doc.text(text, x, y, align ? { align } : undefined);
  };

  // Header: name + contact line
  const info = draft.basicInfo;
  if (info.name) {
    writeText(info.name, margin, sz.name, 'bold', accent);
    y += 8;
  }
  const contactParts = [info.jobIntent, info.phone, info.email, info.city, info.website].filter(Boolean);
  if (contactParts.length > 0) {
    const contactLine = doc.splitTextToSize(contactParts.join('  |  '), maxWidth);
    writeText(contactLine[0], margin, 9, 'normal', [90, 90, 90]);
    y += contactLine.length > 1 ? 8 * contactLine.length : 5;
  }
  y += 3;

  // Sections
  for (const key of draft.sectionOrder) {
    if (!draft.visibleSections[key]) continue;
    const items = draft[key];
    if (items.length === 0) continue;

    // 标题需要留出"标题 + 至少一条目首行"的空间，避免标题孤行在页底
    ensureSpace(18);
    doc.setDrawColor(accent[0], accent[1], accent[2]);
    doc.setLineWidth(0.6);
    doc.line(margin, y - 1.5, pageWidth - margin, y - 1.5);
    writeText(SECTION_TITLES[key], margin, sz.header, 'bold', accent);
    y += 6;

    for (const item of items) {
      const { left, right, body } = builderEntryLines(key, item);
      if (!left && !body) continue;

      // 条目头也需要足够空间（条目头 + 至少一行正文）
      ensureSpace(body ? 14 : 8);
      if (left) {
        writeText(left, margin, sz.entry, 'bold', [30, 30, 30]);
        if (right) {
          writeText(right, pageWidth - margin, sz.entry, 'normal', [90, 90, 90], 'right');
        }
        y += 5.5;
      }
      if (body) {
        const lines = doc.splitTextToSize(body, maxWidth);
        const lh = sz.body + 1.2;
        for (const line of lines) {
          ensureSpace(lh);
          writeText(line, margin, sz.body, 'normal', [60, 60, 60]);
          y += lh;
        }
      }
      y += 2;
    }
    y += 3;
  }

  doc.save('careeseek-builder-resume.pdf');
}
