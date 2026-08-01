import type { FinalResume } from '@/types';

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
    if (y + needed > pageHeight - margin) {
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
