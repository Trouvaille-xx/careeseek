import { describe, it, expect } from 'vitest';
import { buildExportJSON, buildExportText } from '@/services/exportService';
import type { FinalResume } from '@/types';

const sampleResume: FinalResume = {
  sections: [
    { title: '教育经历', content: 'XX 大学 计算机科学 本科' },
    { title: '工作经历', content: '某公司 前端工程师\n- 负责 XX 系统' },
  ],
  raw: '教育经历\nXX 大学 计算机科学 本科\n\n工作经历\n某公司 前端工程师',
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
