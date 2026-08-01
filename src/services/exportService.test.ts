import { describe, it, expect } from 'vitest';
import { buildExportJSON, buildExportText, buildBuilderJSON, needsPageBreak } from '@/services/exportService';
import type { FinalResume, ResumeBuilderDraft } from '@/types';

const sampleResume: FinalResume = {
  sections: [
    { title: '教育经历', content: 'XX 大学 计算机科学 本科' },
    { title: '工作经历', content: '某公司 前端工程师\n- 负责 XX 系统' },
  ],
  raw: '教育经历\nXX 大学 计算机科学 本科\n\n工作经历\n某公司 前端工程师',
};

const sampleDraft: ResumeBuilderDraft = {
  id: 'd1',
  name: '测试简历',
  updatedAt: 1700000000000,
  basicInfo: { name: '张三', phone: '13800000000', email: 'a@b.com', city: '上海', jobIntent: '前端工程师', website: '', summary: '' },
  sectionOrder: ['education', 'workExperience', 'coreSkills'],
  visibleSections: { education: true, workExperience: true, projects: true, coreSkills: false, personalStrengths: true },
  template: 'classic',
  accentColor: 'slate',
  fontSize: 'medium',
  education: [{ id: 'e1', school: 'XX 大学', major: '计算机科学', degree: '本科', startDate: '2019', endDate: '2023', description: '', status: 'approved' }],
  workExperience: [],
  projects: [],
  coreSkills: [{ id: 's1', category: '前端', skills: 'React / TS', status: 'approved' }],
  personalStrengths: [],
};

describe('buildExportJSON', () => {
  it('包含 sections 与导出时间', () => {
    const json = buildExportJSON(sampleResume);
    const parsed = JSON.parse(json);
    expect(parsed.sections).toHaveLength(2);
    expect(parsed.sections[0].title).toBe('教育经历');
    expect(typeof parsed.exportedAt).toBe('string');
  });

  it('输出可解析且格式合法', () => {
    const json = buildExportJSON(sampleResume);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

describe('buildExportText', () => {
  it('按标题+内容拼接', () => {
    expect(buildExportText(sampleResume)).toBe(
      '教育经历\nXX 大学 计算机科学 本科\n\n工作经历\n某公司 前端工程师\n- 负责 XX 系统'
    );
  });

  it('空 sections 输出空字符串', () => {
    expect(buildExportText({ sections: [], raw: '' })).toBe('');
  });
});

describe('buildBuilderJSON', () => {
  it('包含 basicInfo 与按 sectionOrder 排序的可见 sections', () => {
    const json = buildBuilderJSON(sampleDraft);
    const parsed = JSON.parse(json);
    expect(parsed.basicInfo.name).toBe('张三');
    expect(parsed.sections.map((s: { title: string }) => s.title)).toEqual(['教育经历', '工作经历']);
  });

  it('隐藏或空的 section 不输出', () => {
    const json = buildBuilderJSON(sampleDraft);
    const parsed = JSON.parse(json);
    expect(parsed.sections.some((s: { title: string }) => s.title === '专业技能')).toBe(false);
  });
});

describe('PDF 分页（内容超出单页自动分页）', () => {
  it('needsPageBreak 纯逻辑：剩余空间不足时翻页', () => {
    const pageH = 297; const margin = 14;
    // 页顶：剩余充足，不翻页
    expect(needsPageBreak(14, 10, pageH, margin)).toBe(false);
    // 页底：空间不足，翻页
    expect(needsPageBreak(290, 10, pageH, margin)).toBe(true);
    // 正好边界：y+needed === pageHeight-margin 不翻页（> 才翻）
    expect(needsPageBreak(283 - 10, 10, pageH, margin)).toBe(false);
    expect(needsPageBreak(283 - 10 + 0.01, 10, pageH, margin)).toBe(true);
  });

  it('模拟多条目渲染：内容累计超过一页时产生分页', () => {
    const pageH = 297; const margin = 14;
    let y = margin;
    let pages = 1;
    const ensure = (needed: number) => {
      if (needsPageBreak(y, needed, pageH, margin)) { pages++; y = margin; }
    };
    // 60 行正文，每行 11mm（模拟大量职责条目）
    for (let i = 0; i < 60; i++) { ensure(11); y += 11; }
    expect(pages).toBeGreaterThan(1);
  });
});
