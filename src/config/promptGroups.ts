import type { PromptKey } from '@/services/prompts';

/**
 * 提示词的「功能分组」元数据（主应用设置页与管理后台共用）。
 *
 * 只含展示信息（分组名 / 每个 key 的中文标签），不含任何编辑器实现，
 * 因此可以同时被 settings（普通用户）与 admin（管理后台）安全引用，
 * 不会把管理后台的代码打进主包。
 *
 * 新增提示词时：在 services/prompts.ts 的 DEFAULTS 里加 key，并在此处归入某个分组。
 */
export interface PromptGroupKey {
  key: PromptKey;
  label: string;
}

export interface PromptGroup {
  id: string;
  label: string;
  keys: PromptGroupKey[];
}

export const PROMPT_GROUPS: PromptGroup[] = [
  {
    id: 'global', label: '全局设定',
    keys: [
      { key: 'role', label: '角色设定' },
      { key: 'json_req', label: 'JSON 输出要求' },
    ],
  },
  {
    id: 'jd', label: 'JD 解析',
    keys: [
      { key: 'jd_parse_system', label: '系统提示词' },
      { key: 'jd_prompt', label: '用户提示词' },
    ],
  },
  {
    id: 'diagnosis', label: '简历诊断',
    keys: [
      { key: 'diagnosis_system', label: '系统提示词' },
      { key: 'diagnosis_prompt', label: '用户提示词' },
    ],
  },
  {
    id: 'matching', label: '匹配分析',
    keys: [
      { key: 'matching_system', label: '系统提示词' },
      { key: 'matching_prompt', label: '用户提示词' },
    ],
  },
  {
    id: 'questions', label: '追问',
    keys: [
      { key: 'questions_system', label: '系统提示词' },
      { key: 'questions_prompt', label: '用户提示词' },
      { key: 'followup_prompt', label: '深层追问提示词' },
    ],
  },
  {
    id: 'bullet', label: '追问优化表达',
    keys: [
      { key: 'bullet_system', label: '系统提示词' },
      { key: 'bullet_prompt', label: '用户提示词' },
    ],
  },
  {
    id: 'optimize', label: '逐段优化',
    keys: [
      { key: 'optimize_system', label: '系统提示词' },
      { key: 'optimize_prompt', label: '用户提示词' },
    ],
  },
  {
    id: 'final', label: '最终简历',
    keys: [
      { key: 'final_resume_system', label: '系统提示词' },
      { key: 'final_resume_prompt', label: '用户提示词' },
    ],
  },
  {
    id: 'prep', label: '面试准备',
    keys: [
      { key: 'interview_prep_system', label: '系统提示词' },
      { key: 'interview_prep_prompt', label: '用户提示词' },
    ],
  },
  {
    id: 'interview', label: '模拟面试',
    keys: [
      { key: 'interview_system', label: '面试官系统提示词' },
      { key: 'interview_followup_prompt', label: '追问提示词' },
    ],
  },
  {
    id: 'cover-letter', label: '求职信',
    keys: [
      { key: 'cover_letter_system', label: '系统提示词' },
      { key: 'cover_letter_prompt', label: '用户提示词' },
    ],
  },
  {
    id: 'bilingual', label: '双语简历',
    keys: [
      { key: 'bilingual_system', label: '系统提示词' },
      { key: 'bilingual_prompt', label: '用户提示词' },
    ],
  },
  {
    id: 'review', label: '面试复盘',
    keys: [
      { key: 'review_system', label: '系统提示词' },
      { key: 'review_prompt', label: '用户提示词' },
    ],
  },
];
