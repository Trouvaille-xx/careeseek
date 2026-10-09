import { describe, it, expect } from 'vitest';
import { findInterruptedSteps, pickResumeStep, mergePersistedState, useAppStore } from '@/stores/useAppStore';

const 有输入 = { jdContent: 'JD 原文', resumeContent: '简历内容' };
const 无输入 = { jdContent: '', resumeContent: '' };

describe('pickResumeStep（刷新后要不要自动续跑这一步）', () => {
  it('当前正停在被中断的那一步 → 续跑', () => {
    expect(
      pickResumeStep({
        interruptedSteps: [3],
        currentStep: 3,
        analysisStatus: { 3: 'idle' } as never,
        ...有输入,
      })
    ).toBe(3);
  });

  it('第 2 步被中断也能续跑（原先没有任何恢复路径）', () => {
    expect(
      pickResumeStep({
        interruptedSteps: [2],
        currentStep: 2,
        analysisStatus: { 2: 'idle' } as never,
        ...有输入,
      })
    ).toBe(2);
  });

  it('用户已回到首页/输入页 → 不偷偷发起付费请求', () => {
    expect(
      pickResumeStep({ interruptedSteps: [6], currentStep: 0, analysisStatus: { 6: 'idle' } as never, ...有输入 })
    ).toBeNull();
  });

  it('被中断的是别的步骤（当前停在第 5 步）→ 不越权重跑', () => {
    expect(
      pickResumeStep({ interruptedSteps: [3], currentStep: 5, analysisStatus: { 5: 'idle' } as never, ...有输入 })
    ).toBeNull();
  });

  it('该步此前已失败（error）→ 不续跑，避免刷新即重试的死循环', () => {
    expect(
      pickResumeStep({
        interruptedSteps: [6],
        currentStep: 6,
        analysisStatus: { 6: 'error' } as never,
        ...有输入,
      })
    ).toBeNull();
  });

  it('输入已被清空 → 不续跑（否则会拿空输入去请求）', () => {
    expect(
      pickResumeStep({ interruptedSteps: [2], currentStep: 2, analysisStatus: { 2: 'idle' } as never, ...无输入 })
    ).toBeNull();
  });
});

describe('findInterruptedSteps（刷新续跑：找出被刷新掐断的那一步）', () => {
  it('识别停在 loading 的步骤', () => {
    expect(
      findInterruptedSteps({ analysisStatus: { 2: 'done', 3: 'loading', 4: 'idle' } })
    ).toEqual([3]);
  });

  it('done / error / idle 都不算被中断（避免刷新后无限重跑失败步骤）', () => {
    expect(
      findInterruptedSteps({ analysisStatus: { 2: 'done', 3: 'error', 4: 'idle', 5: 'done' } })
    ).toEqual([]);
  });

  it('空快照与越界步骤安全返回', () => {
    expect(findInterruptedSteps(undefined)).toEqual([]);
    expect(findInterruptedSteps({})).toEqual([]);
    expect(
      findInterruptedSteps({ analysisStatus: { 0: 'loading', 9: 'loading', 6: 'loading' } })
    ).toEqual([6]);
  });
});

describe('mergePersistedState（刷新恢复：v2 工作区快照必须原样还原）', () => {
  const current = () => useAppStore.getState();

  it('v2 快照里的简历库 / 历史分析 / 输入不能被清空（回归：曾按 v1 解析导致刷新即丢数据）', () => {
    const persisted = {
      currentWorkspace: 'default',
      workspaceList: ['default'],
      workspaceData: {
        default: {
          userInput: { jdContent: 'JD 原文', resumeContent: '简历内容' },
          resumeLibrary: {
            basicInfo: { name: '张三', phone: '', email: '', city: '', jobIntent: '', website: '', summary: '' },
            education: [{ id: 'e1', school: 'X 大学' }],
            workExperience: [],
            projects: [],
            coreSkills: [],
            personalStrengths: [],
            customModules: [],
          },
          analysisHistory: [{ id: 'h1', title: '某岗位分析' }],
        },
      },
    };

    const merged = mergePersistedState(persisted, current());

    expect(merged.resumeLibrary.basicInfo?.name).toBe('张三');
    expect(merged.resumeLibrary.education).toHaveLength(1);
    expect(merged.analysisHistory).toHaveLength(1);
    expect(merged.userInput.jdContent).toBe('JD 原文');
    expect(merged.workspaceList).toEqual(['default']);
  });

  it('按 currentWorkspace 取对应分区的数据', () => {
    const persisted = {
      currentWorkspace: 'B',
      workspaceList: ['default', 'B'],
      workspaceData: {
        default: { userInput: { jdContent: 'A', resumeContent: '' } },
        B: { userInput: { jdContent: 'B-JD', resumeContent: '' } },
      },
    };

    expect(mergePersistedState(persisted, current()).userInput.jdContent).toBe('B-JD');
  });

  it('currentWorkspace 不在列表里时回退到 default', () => {
    const persisted = {
      currentWorkspace: 'ghost',
      workspaceList: ['default'],
      workspaceData: {
        default: { userInput: { jdContent: '兜底', resumeContent: '' } },
      },
    };

    const merged = mergePersistedState(persisted, current());
    expect(merged.currentWorkspace).toBe('default');
    expect(merged.userInput.jdContent).toBe('兜底');
  });

  it('v1 扁平旧格式仍能迁移进 default 工作区', () => {
    const persisted = {
      userInput: { jdContent: 'legacy', resumeContent: '' },
      resumeLibrary: { education: [{ id: 'e-old', school: '老大学' }] },
    };

    const merged = mergePersistedState(persisted, current());
    expect(merged.userInput.jdContent).toBe('legacy');
    expect(merged.resumeLibrary.education).toHaveLength(1);
    expect(merged.currentWorkspace).toBe('default');
    expect(merged.workspaceList).toEqual(['default']);
  });

  it('空快照安全返回当前状态', () => {
    const cur = current();
    expect(mergePersistedState(undefined, cur)).toBe(cur);
  });
});
