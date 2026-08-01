import type { UserInput, JDAnalysis, ResumeDiagnosis, MatchingRow, FollowUpQuestion, OptimizationItem, FinalResume, InterviewPrep } from '@/types';

export const EXAMPLE_USER_INPUT: UserInput = {
  targetRole: 'AI产品经理',
  industry: 'AI/人工智能',
  companyType: '互联网大厂或AI创业公司',
  careerStage: '3-5年经验转方向',
  highlightSkills: 'AI产品能力、业务理解能力、数据分析能力、项目推进能力',
  jdContent: `岗位职责：
1. 负责AI产品的需求分析、产品规划与功能设计，输出高质量PRD文档
2. 深入理解大模型（LLM）技术能力边界，结合业务场景设计AI原生应用
3. 跟踪行业趋势与竞品动态，制定产品迭代路线图
4. 协同算法、工程、设计团队推动产品落地，把控项目进度与交付质量
5. 建立产品数据指标体系，通过数据分析驱动产品优化决策
6. 参与客户沟通与需求调研，持续收集反馈并转化为产品改进方案

任职要求：
1. 本科及以上学历，计算机、人工智能或相关专业优先
2. 3年以上互联网产品经理经验，有AI/NLP相关产品经验者优先
3. 熟悉产品设计全流程，熟练使用Axure、Figma、Xmind等工具
4. 具备良好的数据分析能力，熟练使用SQL，了解Python基本用法
5. 对LLM、RAG、Agent等技术概念有基本认知，能理解技术原理并与算法团队有效沟通
6. 具备优秀的学习能力和逻辑思维，自驱力强，结果导向

加分项：
- 有B端/SaaS产品经验
- 有从0到1产品经验
- 有技术背景或计算机相关学历`,
  resumeContent: `张三 | 手机：138****5678 | 邮箱：zhangsan@email.com

求职意向：产品经理

工作经历

**ABC科技有限公司 | 产品经理 | 2021.06 - 至今**
- 负责公司ERP系统的产品规划和迭代，包括采购管理、库存管理、财务管理等模块
- 对接业务部门需求，输出PRD文档并跟进开发进度
- 协调设计、开发、测试团队完成产品上线
- 参与WMS仓储管理系统的需求分析和功能设计
- 配合客户成功团队解决产品使用中的问题

**XYZ信息技术公司 | 助理产品经理 | 2019.03 - 2021.05**
- 负责企业报表平台的产品设计，包括数据看板、报表配置、权限管理等模块
- 进行竞品分析，撰写市场调研报告
- 协助高级产品经理完成产品需求文档的撰写
- 参与用户访谈，整理用户反馈并形成改进方案
- 跟踪产品上线后的数据表现，输出数据分析报告

项目经历

**ERP系统升级改造项目**
- 参与企业资源计划系统的整体升级改造，负责采购和库存模块的产品设计
- 优化采购流程，提升采购效率
- 设计库存预警机制，降低库存积压风险

**WMS仓储管理系统建设项目**
- 参与仓储管理系统的从0到1建设
- 设计入库、出库、盘点等核心业务流程
- 对接硬件设备，实现条码扫描功能

**企业报表平台搭建项目**
- 参与企业级报表平台的产品规划与设计
- 设计可视化数据看板，满足管理层决策需求
- 实现报表自定义配置功能

教育背景
2015.09 - 2019.06 某大学 计算机科学与技术 本科

技能
- 产品工具：Axure、Figma、Xmind、Visio、ProcessOn
- 数据分析：SQL、Excel、Tableau
- 项目管理：JIRA、Trello、Confluence
- 语言：英语CET-6`,
  supplementInfo: `常用工具：Axure RP、Figma、Xmind、ProcessOn、JIRA、Confluence、SQL、Tableau
了解技术：Python基础、RESTful API基础概念、数据库基础
行业经验：ERP、WMS、企业报表、SaaS产品
个人特点：逻辑清晰、善于沟通、学习能力强、自驱力好`,
};

export function getExampleInput(): UserInput {
  return { ...EXAMPLE_USER_INPUT };
}

export const SAMPLE_USER_INPUT: UserInput = {
  targetRole: 'AI 产品经理（高级）',
  industry: '人工智能 / SaaS',
  companyType: '互联网大厂 / 独角兽',
  careerStage: '3-5 年经验',
  highlightSkills: 'AI 产品规划, 跨部门协作, 数据分析, 用户增长, 项目管理',
  jdContent: `岗位职责：
1. 负责 AI 产品的需求分析、产品规划与迭代管理
2. 深入理解大模型技术能力，设计创新性 AI 产品功能
3. 协调算法、工程、设计等多团队完成产品交付
4. 制定产品数据指标体系，通过数据驱动产品优化
5. 跟踪行业趋势与竞品动态，输出产品策略报告

任职要求：
1. 统招本科及以上学历，计算机、人工智能相关专业优先
2. 3 年以上互联网产品经理经验，有 AI 产品经验者优先
3. 具备优秀的产品设计能力，熟练使用 Figma、Axure 等工具
4. 具备良好的数据分析能力，熟悉 SQL、Python 优先
5. 具备较强的主人翁意识和自驱力，善于跨团队沟通协作

加分项：
- 有大模型产品落地经验
- 有 ToB SaaS 产品经验
- 有技术背景，理解机器学习基本原理`,
  resumeContent: `个人简介
5 年互联网产品经理经验，其中 2 年专注 AI 产品方向。曾在某独角兽公司负责 AI 客服产品的迭代优化，实现用户留存提升 25%。擅长产品规划、需求分析与跨团队协作。

工作经历
某科技公司 | 产品经理 | 2021.06 - 至今
- 负责 AI 客服机器人产品线，管理产品需求池与版本规划
- 设计智能对话流程，优化意图识别准确率从 82% 提升至 93%
- 搭建产品数据分析看板，驱动产品迭代决策
- 协调算法、后端、前端团队完成 12 个版本迭代

某互联网公司 | 助理产品经理 | 2019.03 - 2021.05
- 负责 B 端后台产品设计，完成 20+ 功能模块交付
- 深入客户一线调研，输出需求文档 50+ 份
- 参与数据平台搭建，设计用户行为分析功能

教育背景
某某大学 | 计算机科学与技术 | 本科 | 2015 - 2019

项目经验
AI 智能客服项目
- 作为核心产品负责人，推动 AI 客服产品从 0 到 1 落地
- 设计多轮对话交互逻辑，提升用户问题解决率 30%
- 引入大模型能力提升对话理解效果

技能
- 产品设计：Figma, Axure, XMind, ProcessOn
- 数据分析：SQL, Excel, Tableau
- AI 相关：Prompt Engineering, 模型效果评估, RAG 应用设计
- 其他：Scrum, JIRA, Confluence`,
  supplementInfo: '',
};

export const SAMPLE_JD_ANALYSIS: JDAnalysis = {
  responsibilities: [
    '负责 AI 产品的需求分析、产品规划与全生命周期迭代管理',
    '深度结合大模型技术能力，设计具有市场竞争力的创新 AI 产品功能',
    '作为核心协调者，推动算法、工程、设计等多团队高效协作完成产品交付',
    '建立并优化产品数据指标体系，通过数据驱动产品持续改进',
    '持续跟踪 AI 行业趋势与竞品动态，输出高质量产品策略报告',
  ],
  hardRequirements: [
    '统招本科及以上学历，计算机/AI 相关专业优先',
    '3 年以上互联网产品经理经验',
    '熟练使用 Figma、Axure 等产品设计工具',
    '具备数据分析能力，熟悉 SQL 或 Python',
    '有 AI 产品经验者优先',
  ],
  hiddenRequirements: [
    '具备大模型产品实际落地经验',
    '有 ToB SaaS 产品经验',
    '理解机器学习基本原理的技术背景',
    '较强的主人翁意识和自驱力',
    '优秀的跨团队沟通协作能力',
  ],
  keywords: [
    'AI 产品', '大模型', '数据分析', '产品规划', '跨团队协作',
    '需求分析', '竞品分析', '数据驱动', 'SaaS', '产品策略',
    'Figma', 'Axure', 'SQL', 'Python', '机器学习',
  ],
  idealCandidate: '理想的候选人应具备 3-5 年互联网产品经验，其中至少 2 年专注于 AI 产品方向。候选人需要理解大模型技术原理与应用场景，具备将技术能力转化为产品功能的产品设计能力。同时，需要有较强的数据分析思维和跨团队协作能力，能够在快速变化的 AI 领域推动产品持续创新。有 ToB SaaS 产品经验者会是加分项，具备技术背景（理解机器学习基础）的候选人将更具优势。',
  topAbilities: [
    { name: 'AI 产品规划能力', description: '能够基于大模型技术特性进行产品功能规划，设计创新的 AI 产品体验' },
    { name: '数据分析能力', description: '具备搭建数据指标体系、通过数据驱动产品优化的能力，熟悉 SQL 等分析工具' },
    { name: '跨团队协作能力', description: '能够有效协调算法、工程、设计等多团队资源，推动产品从概念到交付的全流程' },
    { name: '产品设计能力', description: '熟练使用 Figma、Axure 等设计工具，具备优秀的交互设计与原型制作能力' },
    { name: '行业洞察力', description: '持续跟踪 AI 行业趋势与竞品动态，能够输出有深度的产品策略分析' },
  ],
};

export const SAMPLE_DIAGNOSIS: ResumeDiagnosis = {
  overallScore: 68,
  dimensionScores: [
    { name: 'JD 匹配度', score: 72, reason: 'AI 产品经验与目标岗位高度相关，但 ToB SaaS 经验展示不足' },
    { name: '成果量化', score: 65, reason: '部分成果有数据支撑，但缺少业务价值层面的量化指标' },
    { name: '技能匹配', score: 78, reason: '技能覆盖较全面，但大模型相关技能描述不够具体' },
    { name: '经验相关性', score: 70, reason: 'AI 产品经验丰富，但缺少大模型产品落地的具体案例' },
    { name: '表达质量', score: 60, reason: '语言描述偏平实，缺少结果导向的亮点表述' },
    { name: '结构清晰度', score: 75, reason: '整体结构合理，但项目经历不够突出' },
    { name: '关键词覆盖', score: 68, reason: '覆盖了部分 JD 关键词，但遗漏了 SaaS、产品策略等关键术语' },
    { name: '竞争力', score: 62, reason: '在 AI 领域有一定竞争力，但需要更好地突出差异化优势' },
    { name: '完整度', score: 70, reason: '基本信息完整，但项目描述可以更丰富' },
    { name: '针对性强', score: 60, reason: '简历针对性一般，需要更多根据 JD 定制化调整' },
  ],
  priorityFixes: [
    '增加大模型产品落地经验的具体描述，突出对 LLM 技术的理解与应用',
    '强化成果量化表达，补充更多业务价值层面的数据指标（如 ROI、转化率等）',
    '补充 ToB SaaS 产品经验，如果没有直接经验，需提炼相关 B 端产品能力',
    '优化关键词覆盖，在简历中自然融入 SaaS、产品策略、数据驱动等 JD 关键词',
    '调整项目描述结构，采用 STAR 法则增强说服力和结果导向',
  ],
};

export const SAMPLE_MATCHING_ROWS: MatchingRow[] = [
  { id: 'm1', requirement: 'AI 产品经验', evidenceStrength: 'high', needsSupplement: false, suggestion: '现有 AI 客服产品经验完全匹配，建议增加大模型相关的具体技术细节' },
  { id: 'm2', requirement: '大模型产品落地经验', evidenceStrength: 'low', needsSupplement: true, suggestion: '虽有 AI 产品经验，但未明确提及大模型项目。建议补充相关项目经历或学习实践' },
  { id: 'm3', requirement: '数据分析能力（SQL/Python）', evidenceStrength: 'medium', needsSupplement: false, suggestion: '已列出 SQL 技能，但缺少具体应用案例。建议补充数据分析驱动决策的例子' },
  { id: 'm4', requirement: 'ToB SaaS 产品经验', evidenceStrength: 'none', needsSupplement: true, suggestion: '简历中未体现 ToB SaaS 经验。如有 B 端后台经验，建议强调产品化能力和客户导向思维' },
  { id: 'm5', requirement: '跨团队协作能力', evidenceStrength: 'high', needsSupplement: false, suggestion: '协调多团队版本迭代的经历充分体现了协作能力，建议保留' },
  { id: 'm6', requirement: '产品设计工具（Figma/Axure）', evidenceStrength: 'high', needsSupplement: false, suggestion: '技能清单中已覆盖，但可在项目描述中提及具体使用场景' },
  { id: 'm7', requirement: '技术背景（机器学习基础）', evidenceStrength: 'medium', needsSupplement: false, suggestion: '计算机专业背景符合要求，建议补充对 ML/DL 基本原理的理解程度' },
  { id: 'm8', requirement: '主人翁意识与自驱力', evidenceStrength: 'medium', needsSupplement: false, suggestion: '从 0 到 1 的经验体现了自驱力，建议用具体事例佐证' },
];

export const SAMPLE_FOLLOW_UP_QUESTIONS_ROUND1: FollowUpQuestion[] = [
  {
    id: 'q1', round: 1, question: '你提到优化意图识别准确率从 82% 提升至 93%，请具体说明你在这个过程中的贡献是什么？采用了哪些方法？',
    direction: '量化成果', userAnswer: '', optimizedBullet: '', isExpanded: false,
  },
  {
    id: 'q2', round: 1, question: '在 AI 客服机器人项目中，你是如何设计多轮对话交互逻辑的？遇到了哪些挑战？',
    direction: '技术深度', userAnswer: '', optimizedBullet: '', isExpanded: false,
  },
  {
    id: 'q3', round: 1, question: '请描述你从 0 到 1 推动 AI 客服产品落地的完整过程，包括需求调研、方案设计到上线交付。',
    direction: '项目经验', userAnswer: '', optimizedBullet: '', isExpanded: false,
  },
  {
    id: 'q4', round: 1, question: '你搭建的产品数据分析看板包含哪些核心指标？这些指标如何帮助团队做产品决策？',
    direction: '数据能力', userAnswer: '', optimizedBullet: '', isExpanded: false,
  },
  {
    id: 'q5', round: 1, question: '协调算法、后端、前端团队完成版本迭代的过程中，你是如何管理不同团队的需求和预期的？',
    direction: '协作沟通', userAnswer: '', optimizedBullet: '', isExpanded: false,
  },
  {
    id: 'q6', round: 1, question: '你提到引入大模型能力提升对话理解效果，请具体说明你是如何评估和选择大模型的？',
    direction: '技术判断', userAnswer: '', optimizedBullet: '', isExpanded: false,
  },
];

export const SAMPLE_FOLLOW_UP_QUESTIONS_ROUND2: FollowUpQuestion[] = [
  {
    id: 'q7', round: 2, question: '基于你提到的数据驱动方法，能否分享一个通过数据分析发现产品问题并改进的具体案例？',
    direction: '深度追问', userAnswer: '', optimizedBullet: '', isExpanded: false,
  },
  {
    id: 'q8', round: 2, question: '在跨团队协作中，有没有遇到需求冲突或资源紧张的情况？你是如何解决和权衡的？',
    direction: '行为面试', userAnswer: '', optimizedBullet: '', isExpanded: false,
  },
  {
    id: 'q9', round: 2, question: '你对 AI 产品经理这个角色的理解是什么？你认为 AI 产品经理与传统产品经理最大的区别在哪里？',
    direction: '认知深度', userAnswer: '', optimizedBullet: '', isExpanded: false,
  },
];

export const SAMPLE_OPTIMIZATION_ITEMS: OptimizationItem[] = [
  {
    id: 'o1', section: '个人简介',
    original: '5 年互联网产品经理经验，其中 2 年专注 AI 产品方向。曾在某独角兽公司负责 AI 客服产品的迭代优化，实现用户留存提升 25%。擅长产品规划、需求分析与跨团队协作。',
    optimized: '5 年互联网产品经理经验（含 2 年 AI 产品方向），具备 AI 客服产品从 0 到 1 的完整落地经验。通过数据驱动的产品优化策略，推动用户留存率提升 25%。核心能力覆盖产品规划、需求分析、跨团队协作及大模型技术应用。',
    reason: '将平铺直叙的表述改为结果导向，突出从 0 到 1 的落地能力和数据驱动的思维方式，同时补充大模型技术应用以贴合 JD 要求。',
    riskNote: '确认 AI 客服产品确实是从 0 到 1 落地，避免面试时被追问细节。',
  },
  {
    id: 'o2', section: '工作经历 - AI 客服机器人',
    original: '负责 AI 客服机器人产品线，管理产品需求池与版本规划。设计智能对话流程，优化意图识别准确率从 82% 提升至 93%。搭建产品数据分析看板，驱动产品迭代决策。协调算法、后端、前端团队完成 12 个版本迭代。',
    optimized: '主导 AI 客服机器人产品线，统筹产品规划与版本管理，12 个月内完成 12 个版本迭代交付。\n- 设计并优化智能对话流程，通过引入大模型意图识别方案，将准确率从 82% 提升至 93%，显著改善用户体验\n- 从 0 搭建产品数据指标体系，涵盖用户留存、问题解决率、满意度等核心维度，驱动产品迭代决策\n- 协调算法、后端、前端等多职能团队，建立高效的跨团队协作机制，确保产品按期高质量交付',
    reason: '采用 STAR 法则重构描述，增加量化时间维度，补充技术细节以体现大模型能力，拆分要点增强可读性。',
    riskNote: '',
  },
  {
    id: 'o3', section: '工作经历 - 助理产品经理',
    original: '负责 B 端后台产品设计，完成 20+ 功能模块交付。深入客户一线调研，输出需求文档 50+ 份。参与数据平台搭建，设计用户行为分析功能。',
    optimized: '负责 B 端后台产品设计与交付，累计完成 20+ 功能模块从需求分析到上线全流程。\n- 深入 30+ 家客户一线调研，输出高质量需求文档 50+ 份，精准把握客户痛点\n- 参与企业级数据平台搭建，主导用户行为分析模块设计，支撑客户运营决策',
    reason: '补充调研客户数量等量化细节，强化 B 端产品经验与 JD 中的 ToB SaaS 偏好呼应。',
    riskNote: '',
  },
  {
    id: 'o4', section: '项目经验 - AI 智能客服',
    original: '作为核心产品负责人，推动 AI 客服产品从 0 到 1 落地。设计多轮对话交互逻辑，提升用户问题解决率 30%。引入大模型能力提升对话理解效果。',
    optimized: 'AI 智能客服产品（核心产品负责人）\n- 从 0 到 1 主导 AI 智能客服产品规划与落地，覆盖需求调研、方案设计、研发推进、上线运营全流程\n- 设计基于大模型的多轮对话交互逻辑，用户问题一次性解决率提升 30%，显著降低人工转接率\n- 主导大模型技术选型与效果评估，引入 LLM 能力优化对话理解与意图识别，提升复杂场景处理能力',
    reason: '作为独立项目突出展示，详细描述从 0 到 1 的全过程，补充大模型技术选型细节，增强竞争力展示。',
    riskNote: '确保对 LLM 技术选型和评估过程有充分了解，面试中可能被深入追问。',
  },
];

export const SAMPLE_FINAL_RESUME: FinalResume = {
  sections: [
    {
      title: '个人简介',
      content: '5 年互联网产品经理经验（含 2 年 AI 产品方向），具备 AI 客服产品从 0 到 1 的完整落地经验。通过数据驱动的产品优化策略，推动用户留存率提升 25%。核心能力覆盖产品规划、需求分析、跨团队协作及大模型技术应用。',
    },
    {
      title: '工作经历',
      content: '某科技公司 | 产品经理 | 2021.06 - 至今\n\n主导 AI 客服机器人产品线，统筹产品规划与版本管理，12 个月内完成 12 个版本迭代交付。\n- 设计并优化智能对话流程，通过引入大模型意图识别方案，将准确率从 82% 提升至 93%，显著改善用户体验\n- 从 0 搭建产品数据指标体系，涵盖用户留存、问题解决率、满意度等核心维度，驱动产品迭代决策\n- 协调算法、后端、前端等多职能团队，建立高效的跨团队协作机制，确保产品按期高质量交付\n\n某互联网公司 | 助理产品经理 | 2019.03 - 2021.05\n\n负责 B 端后台产品设计与交付，累计完成 20+ 功能模块从需求分析到上线全流程。\n- 深入 30+ 家客户一线调研，输出高质量需求文档 50+ 份，精准把握客户痛点\n- 参与企业级数据平台搭建，主导用户行为分析模块设计，支撑客户运营决策',
    },
    {
      title: '教育背景',
      content: '某某大学 | 计算机科学与技术 | 本科 | 2015 - 2019',
    },
    {
      title: '项目经验',
      content: 'AI 智能客服产品（核心产品负责人）\n\n从 0 到 1 主导 AI 智能客服产品规划与落地，覆盖需求调研、方案设计、研发推进、上线运营全流程。\n- 设计基于大模型的多轮对话交互逻辑，用户问题一次性解决率提升 30%，显著降低人工转接率\n- 主导大模型技术选型与效果评估，引入 LLM 能力优化对话理解与意图识别，提升复杂场景处理能力',
    },
    {
      title: '技能',
      content: '产品设计：Figma, Axure, XMind, ProcessOn\n数据分析：SQL, Excel, Tableau (搭建数据看板)\nAI 相关：Prompt Engineering, 大模型效果评估, RAG 应用设计\n其他：Scrum, JIRA, Confluence',
    },
  ],
  raw: '个人简介\n5 年互联网产品经理经验（含 2 年 AI 产品方向），具备 AI 客服产品从 0 到 1 的完整落地经验。通过数据驱动的产品优化策略，推动用户留存率提升 25%。核心能力覆盖产品规划、需求分析、跨团队协作及大模型技术应用。',
};

export const SAMPLE_INTERVIEW_PREP: InterviewPrep = {
  possibleQuestions: [
    { question: '请详细介绍一下你在 AI 客服产品中引入大模型能力的完整过程', detail: '面试官想了解你对大模型技术的理解深度和实际应用经验。建议从需求识别、技术调研、模型选型、POC 验证、上线评估五个阶段展开，重点说明你在这个过程中的思考与决策逻辑。' },
    { question: '你是如何衡量 AI 客服产品的核心指标的？', detail: '建议从问题解决率、用户满意度、人工转接率、首次响应时间等核心指标展开，说明每个指标的设定依据、衡量方法以及基于数据的产品优化案例。' },
    { question: '在多团队协作中，遇到算法团队排期冲突时你如何应对？', detail: '面试官关注你的跨团队沟通和冲突解决能力。建议用 STAR 法则描述具体场景，展示你的优先级判断、沟通策略和问题解决能力。' },
    { question: '你认为 AI 产品经理与传统产品经理最大的区别是什么？', detail: '可以从技术理解深度、不确定性管理、快速迭代能力、模型评估方法等角度展开。建议结合自身经验说明，展示你对 AI 产品经理角色的深度思考。' },
    { question: '如果让你设计一个新的 AI 产品功能，你会如何开始？', detail: '展示你的产品设计方法论：用户需求调研->技术可行性评估->MVP 定义->原型设计->效果评估。重点说明如何在不确定中快速验证和迭代。' },
    { question: '你如何评估大模型在具体业务场景中的效果？', detail: '可以从自动化评估指标（BLEU、ROUGE 等）、人工评估维度（准确性、相关性、安全性）、业务指标（转化率、满意度）等多层面展开，说明综合评估体系的搭建方法。' },
    { question: '描述一次你通过数据发现产品问题并推动改进的经历', detail: '用具体案例展示你的数据驱动思维。建议包含：发现数据异常->分析根因->制定方案->实施改进->验证效果 的完整链条。' },
    { question: '你对 RAG 技术在产品中的应用有什么理解？', detail: '展示你对前沿技术的关注和理解。可以从 RAG 的基本原理、在客服场景中的应用价值、面临的挑战（检索质量、上下文窗口等）以及优化方案等角度展开。' },
    { question: '在 AI 产品中，你是如何处理 bad case 的？', detail: '面试官关注你的问题闭环能力。建议说明：bad case 的发现机制->根因分析->短期修复->长期优化->回归验证 的完整流程。' },
    { question: '你对未来 AI 产品的发展趋势怎么看？', detail: '展示你的行业洞察力和思考深度。建议从 Agent、多模态、垂直行业应用等方向展开，结合自身经验说明你的准备和规划。' },
  ],
  evidenceToPrepare: [
    '准备 2-3 个通过数据驱动产品优化的具体案例，包含完整的数据变化链路',
    '准备大模型技术选型的技术调研笔记或评估报告样例',
    '准备从 0 到 1 的产品路线图（Roadmap）示例，展示产品规划能力',
    '准备跨团队协作中解决冲突的具体案例，体现沟通与推动能力',
    '准备个人作品集，包含产品原型、PRD 样例、数据分析看板截图',
  ],
  exaggerationRisks: [
    '简历中"从 0 到 1"的表述可能被面试官深入追问，需准备完整的过程细节',
    '"大模型能力"的具体参与程度需明确，避免被质疑只是简单调用 API',
    '数据"提升 25%/30%"的计算口径需要能清晰解释，准备好分母和分子定义',
    '"协调多团队"的描述可能被追问具体职责和团队规模',
    '技术能力的描述需与实际面试表现一致，避免技术问题答不上来',
  ],
  dataToSupplement: [
    '补充所负责产品的用户规模数据（DAU/MAU）',
    '准备产品上线后的业务效果数据（如 ROI、成本节约等）',
    '准备竞品分析报告样例，展示行业洞察能力',
    '补充团队规模和协作模式的说明',
    '准备技术能力证明（如 SQL 代码样例、数据分析报告等）',
  ],
  selfIntroduction: '面试官您好，我有 5 年互联网产品经理经验，其中 2 年专注于 AI 产品方向。我曾在某独角兽公司主导 AI 客服机器人产品线，从 0 到 1 推动产品落地，通过引入大模型技术优化对话理解，将意图识别准确率提升至 93%，用户问题解决率提升 30%。我擅长数据驱动的产品思维，搭建了完整的产品数据指标体系支撑迭代决策。同时，我具备良好的跨团队协作能力，协调算法、工程、设计等多团队完成产品交付。我对 AI 技术有持续的热情，日常关注大模型进展，希望能将技术能力转化为优秀的产品体验。',
};
