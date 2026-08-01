import type { JDAnalysis, MatchingRow, UserInput } from '../../types';

export function generateMatching(input: UserInput, jdAnalysis: JDAnalysis): MatchingRow[] {
  return [
    {
      id: 'm-1',
      requirement: 'AI产品需求分析与规划能力',
      evidenceStrength: 'low',
      needsSupplement: true,
      suggestion: '当前简历未体现AI产品经验，建议补充AI相关课程学习、个人项目或对AI产品的深度分析案例，展示产品思维和技术理解力。',
    },
    {
      id: 'm-2',
      requirement: 'LLM/RAG/Agent等技术认知',
      evidenceStrength: 'none',
      needsSupplement: true,
      suggestion: '简历中完全没有提及大模型相关经验。建议自学AI/LLM基础知识，通过博客文章、产品分析报告或Side Project来证明技术理解力。',
    },
    {
      id: 'm-3',
      requirement: '产品设计全流程能力（Axure/Figma/Xmind）',
      evidenceStrength: 'medium',
      needsSupplement: false,
      suggestion: '简历提到了Axure和Figma的使用，但未说明在产品设计全流程中的具体应用场景。建议补充使用这些工具完成的具体设计成果。',
    },
    {
      id: 'm-4',
      requirement: '数据分析能力（SQL/Python）',
      evidenceStrength: 'medium',
      needsSupplement: false,
      suggestion: '技能部分列出了SQL和了解Python，但工作经历中未展示数据分析的实际应用案例。建议补充通过数据分析驱动产品决策的具体事例。',
    },
    {
      id: 'm-5',
      requirement: '跨团队协作与项目管理能力',
      evidenceStrength: 'high',
      needsSupplement: false,
      suggestion: '工作经历体现了与设计、开发、测试等团队的协作，但缺少项目管理方法论和具体成果。建议补充项目规模、时间周期和交付质量等信息。',
    },
    {
      id: 'm-6',
      requirement: '行业趋势跟踪与竞品分析能力',
      evidenceStrength: 'low',
      needsSupplement: true,
      suggestion: '简历仅提到"进行竞品分析"这一概括性描述，未展示分析深度和方法论。建议补充竞品分析的维度、框架和得出的关键结论。',
    },
    {
      id: 'm-7',
      requirement: 'B端/SaaS产品经验（加分项）',
      evidenceStrength: 'high',
      needsSupplement: false,
      suggestion: 'ERP、WMS、企业报表均为典型的B端产品，这是候选人的核心优势。建议突出B端产品的业务理解深度，并与AI产品经理角色建立关联。',
    },
    {
      id: 'm-8',
      requirement: '从0到1产品经验（加分项）',
      evidenceStrength: 'medium',
      needsSupplement: true,
      suggestion: 'WMS仓储管理系统项目有从0到1的经历，但描述过于简洁。建议补充从需求调研、方案设计到上线交付的全过程，突出个人主导能力和决策贡献。',
    },
    {
      id: 'm-9',
      requirement: '客户沟通与需求调研能力',
      evidenceStrength: 'medium',
      needsSupplement: false,
      suggestion: '简历提到对接业务部门需求和配合客户成功团队，但未体现主动的需求挖掘和客户沟通能力。建议补充典型的需求调研方法和面向客户的关键成果。',
    },
    {
      id: 'm-10',
      requirement: '数据指标体系搭建能力',
      evidenceStrength: 'low',
      needsSupplement: true,
      suggestion: '数据分析能力停留在使用工具层面，缺少从0搭建数据指标体系和通过数据驱动产品迭代的经验。建议学习并补充AI产品常见的数据指标框架。',
    },
  ];
}
