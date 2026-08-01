import type {
  FollowUpQuestion,
  JDAnalysis,
  MatchingRow,
  OptimizationItem,
  OptimizationStyle,
  ResumeDiagnosis,
  UserInput,
} from '../../types';

let optimizationId = 0;

function nextOptId(): string {
  optimizationId += 1;
  return `opt-${optimizationId}`;
}

export function resetCounter(): void {
  optimizationId = 0;
}

const STYLE_PROFILES: Record<
  OptimizationStyle,
  { label: string; tone: string; focus: string }
> = {
  default: {
    label: '均衡优化',
    tone: '专业、平衡',
    focus: '全面优化，兼顾各个维度',
  },
  concise: {
    label: '简洁版',
    tone: '精简、有力',
    focus: '突出核心亮点，去除冗余表达',
  },
  'less-exaggerated': {
    label: '克制版',
    tone: '保守、可信',
    focus: '降低夸张表述，增强说服力',
  },
  'ai-product': {
    label: 'AI产品方向',
    tone: '前瞻、创新',
    focus: '强化AI产品能力关联',
  },
  'tob-saas': {
    label: 'B端SaaS方向',
    tone: '专业、深度',
    focus: '突出B端业务深度与SaaS产品思维',
  },
};

function buildDefaultItems(): OptimizationItem[] {
  return [
    {
      id: nextOptId(),
      section: '职业摘要',
      original: '（简历中缺少职业摘要模块）',
      optimized: '拥有5年B端产品经验的产品经理，深耕ERP、WMS及企业报表领域，具备从0到1搭建产品的能力。'
        + '熟悉产品全生命周期管理，擅长需求分析、数据驱动决策和跨团队协作。'
        + '现希望转型AI产品经理，已系统学习大模型（LLM）、RAG、Agent等技术知识，致力于将AI技术应用于企业级产品创新。',
      reason: '新增职业摘要模块，明确职业定位和转型方向，让招聘方第一时间了解候选人的核心竞争力和职业目标。',
      riskNote: '转型动机需要在面试中进一步阐述，确保有足够的学习积累支撑。',
    },
    {
      id: nextOptId(),
      section: '核心能力',
      original: '（简历中缺少核心能力专区）',
      optimized: '• AI产品规划：理解LLM/RAG/Agent技术原理，能够结合业务场景设计AI原生应用产品方案\n'
        + '• B端产品深耕：5年ERP/WMS企业级产品经验，深入理解企业业务流程与管理痛点\n'
        + '• 数据驱动决策：熟练使用SQL、Python进行数据分析，曾搭建产品数据指标体系驱动迭代优化\n'
        + '• 全流程项目管理：具备从需求调研、PRD输出到上线跟踪的全链路产品管理能力\n'
        + '• 跨团队协作：擅长协调算法、工程、设计等多方资源，推动产品高效落地',
      reason: '新增核心能力专区，将AI能力放在首位突出转型方向，同时展现B端业务深度这一差异化优势。',
      riskNote: 'AI相关能力需要有实际学习或实践支撑，面试中可能会被深入追问。',
    },
    {
      id: nextOptId(),
      section: '工作经历 - ABC科技有限公司',
      original: '负责公司ERP系统的产品规划和迭代，包括采购管理、库存管理、财务管理等模块',
      optimized: '主导ERP系统采购管理与库存管理两大核心模块的产品规划与迭代，覆盖6个业务部门300+内部用户。'
        + '通过业务流程重构和自动化配置，将采购审批周期从平均5天缩短至2天，采购订单处理效率提升60%。'
        + '设计库存预警机制，将库存积压率降低25%，年均为企业减少约200万元的库存占用成本。',
      reason: '补充了用户规模、效率提升百分比和成本节约数据，使描述从"做了什么"升级为"带来了什么价值"。',
    },
    {
      id: nextOptId(),
      section: '工作经历 - ABC科技有限公司',
      original: '对接业务部门需求，输出PRD文档并跟进开发进度',
      optimized: '建立系统化需求管理流程，通过用户访谈、问卷调研和数据分析三种方式采集需求，'
        + '运用Kano模型进行需求优先级排序。累计输出PRD文档50+份，需求交付率达85%，'
        + '核心需求实现周期从平均4周缩短至2.5周。',
      reason: '展示方法论和量化成果，体现专业产品管理能力。',
    },
    {
      id: nextOptId(),
      section: '项目经历 - WMS仓储管理系统',
      original: '参与仓储管理系统的从0到1建设，设计入库、出库、盘点等核心业务流程，对接硬件设备实现条码扫描功能',
      optimized: '作为核心产品经理全程主导WMS仓储管理系统从0到1建设，负责需求调研、业务流程设计到上线交付全流程。'
        + '设计入库、出库、盘点、移库四大核心业务流程，支撑日均2000+订单处理和500+SKU库存管理。'
        + '主导条码扫描方案选型，协调3家硬件供应商完成兼容性测试，解决扫描枪数据交互延迟问题，'
        + '上线后扫码识别率达99.5%，出入库效率较人工操作提升40%，年均为仓库节约1200人时。',
      reason: '采用STAR法则完整呈现项目背景、个人角色、关键行动和量化成果，突出从0到1的经验和解决问题能力。',
    },
    {
      id: nextOptId(),
      section: '工作经历 - XYZ信息技术公司',
      original: '负责企业报表平台的产品设计，包括数据看板、报表配置、权限管理等模块',
      optimized: '负责企业级报表平台产品规划与设计，一期覆盖财务、运营、销售三大部门40+报表需求。'
        + '设计可视化数据看板和自定义报表配置功能，将管理层决策数据获取时间从平均3天缩短至实时查看。'
        + '搭建基于角色的权限管理体系，满足不同层级用户的数据安全需求。'
        + '平台上线后月活用户超过200人，报告生成效率提升90%，成为公司日常经营分析的核心工具。',
      reason: '补充了覆盖范围、时间节约、用户活跃度等量化指标，体现产品的影响力和实际价值。',
    },
    {
      id: nextOptId(),
      section: '技能工具',
      original: '产品工具：Axure、Figma、Xmind、Visio、ProcessOn\n数据分析：SQL、Excel、Tableau\n项目管理：JIRA、Trello、Confluence',
      optimized: '产品设计：Axure RP、Figma、Xmind、ProcessOn、Visio\n'
        + '数据分析：SQL（熟练）、Python（Pandas/NumPy）、Tableau、Excel（高级）\n'
        + '项目管理：JIRA、Confluence、Trello、Notion\n'
        + 'AI技术认知：LLM（GPT/Claude）、RAG架构、Agent框架（LangChain/LlamaIndex基础）、Prompt Engineering\n'
        + '语言能力：英语CET-6，能够阅读英文技术文档',
      reason: '补充AI技术相关关键词，提升与目标岗位的匹配度。同时细化技能熟练度描述，增强可信度。',
      riskNote: 'AI技能需要确保真实具备，面试官可能会考察对LangChain等工具的实际了解程度。',
    },
    {
      id: nextOptId(),
      section: '求职意向',
      original: '求职意向：产品经理',
      optimized: '求职意向：AI产品经理 / 高级产品经理\n'
        + '目标行业：AI/人工智能、企业服务/SaaS\n'
        + '期望发挥B端产品经验与AI技术学习成果，打造具有行业影响力的AI原生应用',
      reason: '明确求职方向为AI产品经理，让招聘方一目了然地看到候选人的目标定位。',
    },
  ];
}

function adaptItemsByStyle(
  items: OptimizationItem[],
  style: OptimizationStyle
): OptimizationItem[] {
  const profile = STYLE_PROFILES[style];
  if (style === 'default') return items;

  return items.map((item) => {
    const adapted = { ...item, id: nextOptId(), reason: `${item.reason}（${profile.label}风格：${profile.tone}）` };

    if (style === 'concise') {
      adapted.optimized = conciseVersion(adapted.optimized);
    } else if (style === 'less-exaggerated') {
      adapted.optimized = lessExaggeratedVersion(adapted.optimized);
      adapted.riskNote = adapted.riskNote
        ? `${adapted.riskNote}（建议面试前核实所有数据来源）`
        : '建议面试前核实所有数据来源';
    } else if (style === 'ai-product') {
      adapted.optimized = aiProductVersion(adapted.optimized);
    } else if (style === 'tob-saas') {
      adapted.optimized = tobSaaSVersion(adapted.optimized);
    }

    adapted.reason = `${adapted.reason}\n【${profile.label}优化说明】${profile.focus}`;
    return adapted;
  });
}

function conciseVersion(text: string): string {
  const replacements: [RegExp, string][] = [
    [/通过[\s\S]*?(?=[，。]|$)/g, ''],
    [/累计/g, '共'],
    [/覆盖了/g, '覆盖'],
    [/经过[\s\S]*?(?=[，。]|$)/g, ''],
    [/有效地/g, ''],
  ];
  let result = text;
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement as string);
  }
  if (result.length > 60) {
    const sentences = result.split(/[。；]/);
    if (sentences.length > 2) {
      result = sentences.slice(0, 2).join('。') + '。';
    }
  }
  return result;
}

function lessExaggeratedVersion(text: string): string {
  const reductions: [RegExp, string | ((m: string) => string)][] = [
    [/提升\d+%/g, (m: string) => {
      const num = parseInt(m.replace(/[^0-9]/g, ''), 10);
      return `提升约${Math.round(num * 0.6)}%-${num}%`;
    }],
    [/缩短至/g, '缩短约'],
    [/减少约/g, '减少'],
    [/年均为/g, '预计年'],
    [/成为[\s\S]*?(?=[。]|$)/g, ''],
  ];
  let result = text;
  for (const [pattern, replacement] of reductions) {
    result = result.replace(pattern, replacement as any);
  }
  return result;
}

function aiProductVersion(text: string): string {
  const aiInjections: [RegExp, string][] = [
    [/ERP系统/g, 'ERP系统（具备AI智能化升级空间）'],
    [/采购审批/g, '智能采购审批'],
    [/库存预警/g, 'AI驱动库存预测预警'],
    [/产品规划/g, 'AI产品规划'],
    [/报表平台/g, '智能报表分析平台'],
    [/数据看板/g, 'AI数据看板'],
    [/决策数据/g, '智能化决策数据'],
  ];
  let result = text;
  for (const [pattern, replacement] of aiInjections) {
    result = result.replace(pattern, replacement as string);
  }
  result += '\n（本段突出AI技术融合能力，体现将传统B端产品与AI技术结合的思维）';
  return result;
}

function tobSaaSVersion(text: string): string {
  const tobInjections: [RegExp, string][] = [
    [/系统/g, 'SaaS平台'],
    [/用户/g, '企业客户'],
    [/仓库/g, '企业仓储'],
    [/业务部门/g, '企业客户'],
  ];
  let result = text;
  for (const [pattern, replacement] of tobInjections) {
    result = result.replace(pattern, replacement as string);
  }
  result = result.replace(/内部用户/g, '企业终端用户');
  result += '\n（本段突出B端SaaS产品思维，强调对企业客户需求的理解和商业化能力）';
  return result;
}

export function generateOptimization(
  input: UserInput,
  jdAnalysis: JDAnalysis,
  diagnosis: ResumeDiagnosis,
  matchingRows: MatchingRow[],
  followUpQuestions: FollowUpQuestion[],
  style: OptimizationStyle
): OptimizationItem[] {
  const baseItems = buildDefaultItems();
  return adaptItemsByStyle(baseItems, style);
}

export function regenerateOptimization(
  items: OptimizationItem[],
  style: OptimizationStyle
): OptimizationItem[] {
  const profile = STYLE_PROFILES[style];
  return items.map((item, index) => {
    const baseText = items[index % items.length]?.optimized || item.optimized;
    const adapted: OptimizationItem = {
      id: nextOptId(),
      section: item.section,
      original: item.original,
      optimized: '',
      reason: `【${profile.label}风格重新生成】${profile.focus}`,
    };

    const baseForStyle = style === 'ai-product'
      ? aiProductVersion(baseText)
      : style === 'tob-saas'
        ? tobSaaSVersion(baseText)
        : style === 'concise'
          ? conciseVersion(baseText)
          : style === 'less-exaggerated'
            ? lessExaggeratedVersion(baseText)
            : baseText;

    adapted.optimized = baseForStyle;
    adapted.riskNote = item.riskNote;
    return adapted;
  });
}
