import { describe, it, expect } from 'vitest';
import { finalResumeToDraft } from '@/services/resumeDraftService';
import type { FinalResume, ResumeLibrary } from '@/types';

const emptyLibrary: ResumeLibrary = {
  basicInfo: null,
  education: [],
  workExperience: [],
  projects: [],
  coreSkills: [],
  personalStrengths: [],
  customModules: [],
};

const resume = (sections: { title: string; content: string }[]): FinalResume => ({
  sections,
  raw: sections.map((s) => `${s.title}\n${s.content}`).join('\n\n'),
});

/** 复刻 classic 模板的渲染方式（ResumeBuilderPage.previewLines），用于断言“屏幕上会出现什么” */
const renderEdu = (e: { school: string; major: string; degree: string; startDate: string; endDate: string; description: string }) =>
  [
    [e.school, e.major, e.degree].filter(Boolean).join(' | '),
    [e.startDate, e.endDate].filter(Boolean).join(' - '),
    e.description,
  ]
    .filter(Boolean)
    .join('\n');

describe('finalResumeToDraft（终稿 → 简历制作草稿）', () => {
  it('教育：不再把整行同时写进 school 和 description（曾导致整行显示两次）', () => {
    const draft = finalResumeToDraft(
      resume([
        {
          title: '教育经历',
          content: '华中科技大学｜统计学｜统招本科【待确认】｜2019.09-2023.06【待确认】',
        },
      ]),
      emptyLibrary
    );

    expect(draft.education).toHaveLength(1);
    const e = draft.education[0];
    expect(e.school).toBe('华中科技大学');
    expect(e.major).toBe('统计学');
    expect(e.degree).toBe('统招本科【待确认】');
    expect(e.startDate).toBe('2019.09');
    expect(e.endDate).toBe('2023.06');

    // 学校名在渲染结果里只出现一次
    const text = renderEdu(e);
    expect(text.match(/华中科技大学/g)).toHaveLength(1);
    expect(text).toContain('2019.09 - 2023.06');
  });

  it('教育：【待补充】提示行挂到上一条备注，不再被当成第二条学历', () => {
    const draft = finalResumeToDraft(
      resume([
        {
          title: '教育经历',
          content: [
            '华中科技大学｜统计学｜统招本科｜2019.09-2023.06',
            '【待补充：是否统招、入学与毕业的具体月份，请按学信网信息核对后填写；JD 硬性要求统计学／数学／计算机相关专业统招本科及以上，本栏为筛选条件】',
          ].join('\n'),
        },
      ]),
      emptyLibrary
    );

    expect(draft.education).toHaveLength(1);
    expect(draft.education[0].description).toContain('【待补充');
    expect(draft.education[0].school).toBe('华中科技大学');
    // 不会再出现“按空格切一半”的半截行
    expect(renderEdu(draft.education[0])).not.toMatch(/填写；JD$/m);
  });

  it('项目：名字不再被硬截 30 字，正文不再重复项目名', () => {
    const draft = finalResumeToDraft(
      resume([
        {
          title: '项目经历',
          content: [
            '某内容平台用户增长分析（实习项目，2023.04-2023.09）',
            '- 用 SQL 拆解新用户首日行为路径，定位第 2 步流失',
          ].join('\n'),
        },
      ]),
      emptyLibrary
    );

    expect(draft.projects).toHaveLength(1);
    const p = draft.projects[0];
    expect(p.name).toBe('某内容平台用户增长分析');
    expect(p.startDate).toBe('2023.04');
    expect(p.endDate).toBe('2023.09');
    expect(p.description).not.toContain('某内容平台用户增长分析');
    expect(p.description).toContain('SQL');
  });

  it('技能：分类与内容分开存，渲染后不再出现「数据分析：数据分析：」', () => {
    const draft = finalResumeToDraft(
      resume([
        {
          title: '专业技能',
          content: '- 数据分析：SQL、Python（pandas）、Excel\n- 可视化：Tableau、Power BI',
        },
      ]),
      emptyLibrary
    );

    expect(draft.coreSkills).toHaveLength(2);
    expect(draft.coreSkills[0].category).toBe('数据分析');
    expect(draft.coreSkills[0].skills).toBe('SQL、Python（pandas）、Excel');

    // 复刻模板渲染：category ? `${category}：${skills}` : skills
    const rendered = draft.coreSkills.map((s) => (s.category ? `${s.category}：${s.skills}` : s.skills));
    expect(rendered[0]).toBe('数据分析：SQL、Python（pandas）、Excel');
    expect(rendered[0].match(/数据分析/g)).toHaveLength(1);
    expect(rendered[1].match(/可视化/g)).toHaveLength(1);
  });

  it('工作经历：公司/职位/时间进结构字段，正文只留条目', () => {
    const draft = finalResumeToDraft(
      resume([
        {
          title: '实习经历',
          content: ['某内容平台｜用户增长分析实习生｜2023.04-2023.09', '- 负责新用户漏斗分析', '- 输出周报'].join('\n'),
        },
      ]),
      emptyLibrary
    );

    expect(draft.workExperience).toHaveLength(1);
    const w = draft.workExperience[0];
    expect(w.company).toBe('某内容平台');
    expect(w.position).toBe('用户增长分析实习生');
    expect(w.startDate).toBe('2023.04');
    expect(w.endDate).toBe('2023.09');
    expect(w.description).toBe('- 负责新用户漏斗分析\n- 输出周报');
    expect(w.description).not.toContain('某内容平台');
  });

  it('工作经历：整块只有列表项（没有表头）时全部当正文，不丢内容', () => {
    const draft = finalResumeToDraft(
      resume([{ title: '工作经历', content: '- 负责数据看板搭建\n- 支持 A/B 实验取数' }]),
      emptyLibrary
    );

    expect(draft.workExperience).toHaveLength(1);
    expect(draft.workExperience[0].company).toBe('');
    expect(draft.workExperience[0].description).toContain('数据看板搭建');
    expect(draft.workExperience[0].description).toContain('A/B 实验取数');
  });
});
