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

/**
 * CJK 字体（无需联网、无乱码）：
 * - 本地静态 TTF（TrueType 轮廓，jsPDF 可嵌入），内置在 public/fonts/
 * - 必须同时注册 normal + bold，否则 setFont(name,'bold') 会回退到 Times（无中文 → 乱码）
 * - CDN 仅在本地字体缺失时兜底
 */
const CJK_FONT_NAME = 'NotoSansSC';

interface CJKFontSource {
  url: string;
  family: string;
  style: 'normal' | 'bold';
  vfsName: string;
}

const CJK_FONT_LOCAL = [
  { url: '/fonts/NotoSansSC-Regular.ttf', style: 'normal' },
  { url: '/fonts/NotoSansSC-Bold.ttf', style: 'bold' },
] as const;
/**
 * CDN 兜底：刻意不含可变字体版本——jsPDF 只支持静态 TrueType（glyf），
 * 可变字体（含 fvar/gvar）无法嵌入，会静默产出中文乱码 PDF。
 * 故宁可让本地缺失时抛出明确错误，也不回退到无法嵌入的变量字体。
 */
const CJK_FONT_CDN: { url: string; style: 'normal' | 'bold' }[] = [];
/** 字体下载超时（毫秒） */
const FONT_TIMEOUT_MS = 20000;

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

/** 带超时的 fetch（AbortController） */
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 加载 CJK 字体供 jsPDF 嵌入。
 * - 优先本地静态 TTF（public/fonts/，TrueType 轮廓，jsPDF 可嵌入且无乱码）
 * - 若本地缺失再从 CDN 回退（本地为开发期完整字体包，生产构建后同域可及）
 * - normal + bold 必须同时注册，否则 setFont(name,'bold') 回退 Times → 中文乱码
 * - 全部失败时抛出明确错误（避免输出中文乱码 PDF）
 * - 按会话缓存；多次导出只加载一次
 */
async function ensureCJKFont(doc: CJKFontDoc): Promise<boolean> {
  if (cjkFontLoaded) return true;
  if (cjkFontLoading) return cjkFontLoading;

  cjkFontLoading = (async () => {
    const sources: CJKFontSource[] = [
      ...CJK_FONT_LOCAL.map((f) => ({ ...f, vfsName: `${CJK_FONT_NAME}-${f.style}`, family: CJK_FONT_NAME })),
      ...CJK_FONT_CDN.map((f) => ({ ...f, vfsName: `${CJK_FONT_NAME}-${f.style}`, family: CJK_FONT_NAME })),
    ];

    // 未注册的样式集合；每个样式（normal/bold）至少要成功一次
    const toLoad = new Set<string>(['normal', 'bold']);

    for (const src of sources) {
      if (toLoad.size === 0) break;
      if (!toLoad.has(src.style)) continue;
      try {
        const res = await fetchWithTimeout(src.url, FONT_TIMEOUT_MS);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buffer = await res.arrayBuffer();
        doc.addFileToVFS(src.vfsName, arrayBufferToBase64(buffer));
        doc.addFont(src.vfsName, src.family, src.style);
        toLoad.delete(src.style);
      } catch (e) {
        console.warn(`[export] CJK 字体加载失败（${src.style}: ${src.url}）:`, e);
      }
    }

    if (toLoad.size > 0) {
      throw new Error(
        `PDF 中文渲染所需的 CJK 字体加载失败（${Array.from(toLoad).join(', ')}）。` +
        '本地字体应位于 public/fonts/，若缺失请重新部署，或改用 JSON 导出。'
      );
    }

    cjkFontLoaded = true;
    return true;
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
  custom: '自定义模块',
};

export function buildBuilderJSON(draft: ResumeBuilderDraft): string {
  const visible = draft.sectionOrder.filter((k) => draft.visibleSections[k]);
  const sections = visible
    .filter((k) => k !== 'custom')
    .map((k) => ({
      title: SECTION_TITLES[k],
      items: draft[k],
    }));
  const customSections = visible.includes('custom') && draft.visibleSections.custom
    ? draft.customSections.map((m) => ({ title: m.title, items: m.entries }))
    : [];
  return JSON.stringify({
    title: 'CareeSeek 简历制作',
    exportedAt: new Date().toISOString(),
    template: draft.template,
    accentColor: draft.accentColor,
    fontSize: draft.fontSize,
    basicInfo: draft.basicInfo,
    sections,
    customSections,
  }, null, 2);
}

export function exportBuilderJSON(draft: ResumeBuilderDraft): void {
  downloadBlob(
    new Blob([buildBuilderJSON(draft)], { type: 'application/json;charset=utf-8' }),
    'careeseek-builder-resume.json'
  );
}

function builderEntryLines(kind: BuilderSectionKey, item: unknown): { left: string; right: string; body: string } {
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
        body: w.description,
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
    case 'custom': {
      const c = item as ResumeBuilderDraft['customSections'][number]['entries'][number];
      return { left: c.title, right: c.detail, body: c.description };
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

    if (key === 'custom') {
      for (const mod of draft.customSections) {
        ensureSpace(sz.header + 8);
        writeText(mod.title, margin, sz.header, 'bold', accent);
        y += 3.5;
        doc.setDrawColor(accent[0], accent[1], accent[2]);
        doc.setLineWidth(0.6);
        doc.line(margin, y, pageWidth - margin, y);
        y += 4;
        for (const item of mod.entries) {
          const { left, right, body } = builderEntryLines('custom', item);
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
      continue;
    }

    const items = draft[key];
    if (items.length === 0) continue;

    // 标题需要留出"标题 + 至少一条目首行"的空间，避免标题孤行在页底
    ensureSpace(sz.header + 8);
    writeText(SECTION_TITLES[key], margin, sz.header, 'bold', accent);
    y += 3.5;
    doc.setDrawColor(accent[0], accent[1], accent[2]);
    doc.setLineWidth(0.6);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;

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

// ============ Reserve Builder export (Word .docx) ============

const ACCENT_HEX: Record<AccentColor, string> = {
  slate: '111827',
  blue: '1E40AF',
  green: '065F46',
  red: '991B1B',
  violet: '5B21B6',
};

let docxModule: typeof import('docx') | null = null;

async function getDocx(): Promise<typeof import('docx')> {
  if (!docxModule) {
    docxModule = await import('docx');
  }
  return docxModule;
}

export async function exportBuilderDOCX(draft: ResumeBuilderDraft): Promise<void> {
  const { Document, Packer, Paragraph, TextRun, TabStopType, AlignmentType } = await getDocx();
  const accent = ACCENT_HEX[draft.accentColor] ?? ACCENT_HEX.slate;
  const contentWidthTwips = 8300;

  const children: import('docx').Paragraph[] = [];

  const info = draft.basicInfo;

  // 标题：姓名（accent 色）
  if (info.name) {
    children.push(
      new Paragraph({
        heading: undefined,
        spacing: { after: 120 },
        children: [
          new TextRun({ text: info.name, bold: true, size: 48, color: accent, font: { eastAsia: '微软雅黑', ascii: 'Microsoft YaHei' } }),
        ],
      })
    );
  }

  // 联系方式一行
  const contactParts = [info.jobIntent, info.phone, info.email, info.city, info.website].filter(Boolean);
  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: contactParts.join('  |  '),
            size: 18,
            color: '5A5A5A',
            font: { eastAsia: '微软雅黑', ascii: 'Microsoft YaHei' },
          }),
        ],
      })
    );
  }

  // 分段：非 custom 的 sectionOrder 段 + custom 模块
  const addSectionHeader = (title: string) => {
    children.push(
      new Paragraph({
        spacing: { before: 120, after: 80 },
        border: {
          bottom: { style: 'single', size: 12, color: accent },
        },
        children: [
          new TextRun({
            text: title,
            bold: true,
            size: 28,
            color: accent,
            font: { eastAsia: '微软雅黑', ascii: 'Microsoft YaHei' },
          }),
        ],
      })
    );
  };

  const addEntry = (left: string, right: string, body: string) => {
    // 条目头：标题左、日期右（用一个右对齐制表位推到最后）
    if (left || right) {
      children.push(
        new Paragraph({
          spacing: { before: 40, after: 40 },
          tabStops: right
            ? [{ type: TabStopType.RIGHT, position: contentWidthTwips }]
            : undefined,
          children: [
            ...(left
              ? [new TextRun({
                  text: left,
                  bold: true,
                  size: 22,
                  color: '303030',
                  font: { eastAsia: '微软雅黑', ascii: 'Microsoft YaHei' },
                })]
              : []),
            ...(right
              ? [
                  new TextRun({ text: '\t' }),
                  new TextRun({
                    text: right,
                    size: 20,
                    color: '5A5A5A',
                    font: { eastAsia: '微软雅黑', ascii: 'Microsoft YaHei' },
                  }),
                ]
              : []),
          ],
        })
      );
    }
    if (body) {
      children.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: body,
              size: 20,
              color: '3C3C3C',
              font: { eastAsia: '微软雅黑', ascii: 'Microsoft YaHei' },
            }),
          ],
        })
      );
    }
  };

  const visible = draft.sectionOrder.filter((k) => draft.visibleSections[k]);

  for (const key of visible) {
    if (key === 'custom') {
      for (const mod of draft.customSections) {
        addSectionHeader(mod.title);
        for (const entry of mod.entries) {
          const { left, right, body } = builderEntryLines('custom', entry);
          addEntry(left, right, body);
        }
      }
      continue;
    }

    const items = draft[key];
    if (items.length === 0) continue;
    addSectionHeader(SECTION_TITLES[key]);
    for (const item of items) {
      const { left, right, body } = builderEntryLines(key, item);
      if (!left && !body) continue;
      addEntry(left, right, body);
    }
  }

  const doc = new Document({
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, 'careeseek-builder-resume.docx');
}
