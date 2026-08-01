import type { FollowUpQuestion, JDAnalysis, ResumeDiagnosis, UserInput } from '../../types';

let questionIdCounter = 0;

function nextId(round: number): string {
  questionIdCounter += 1;
  return `q-${round}-${questionIdCounter}`;
}

export function resetCounter(): void {
  questionIdCounter = 0;
}

export function generateQuestions(
  input: UserInput,
  jdAnalysis: JDAnalysis,
  diagnosis: ResumeDiagnosis
): FollowUpQuestion[] {
  return [
    {
      id: nextId(1),
      round: 1,
      direction: '项目背景',
      question: '你在WMS仓储管理系统从0到1的建设中，这个项目的业务背景是什么？系统的目标用户规模和仓库类型是怎样的？你在这个项目中具体负责哪些模块的决策？',
      userAnswer: '',
      optimizedBullet: '',
      isExpanded: true,
    },
    {
      id: nextId(1),
      round: 1,
      direction: '个人职责',
      question: '在ERP系统升级改造项目中，你提到"优化采购流程"，具体来说你做了哪些分析？是如何确定优化方向的？有没有对比过优化前后的效果数据？',
      userAnswer: '',
      optimizedBullet: '',
      isExpanded: true,
    },
    {
      id: nextId(1),
      round: 1,
      direction: '业务目标',
      question: '在企业报表平台项目中，你们搭建这个平台要解决的核心业务痛点是什么？管理层的哪些决策需求被纳入了一期规划？平台上线后实际的使用情况如何？',
      userAnswer: '',
      optimizedBullet: '',
      isExpanded: true,
    },
    {
      id: nextId(1),
      round: 1,
      direction: '关键动作',
      question: '你负责的ERP系统采购管理模块中，你是如何调研业务部门需求的？采用了哪些方法确保需求的完整性和优先级排序？有没有遇到过业务方和技术方案冲突的情况？',
      userAnswer: '',
      optimizedBullet: '',
      isExpanded: false,
    },
    {
      id: nextId(1),
      round: 1,
      direction: '产出成果',
      question: '你参与或主导的产品上线后，你通过哪些指标来衡量产品效果？有没有做过A/B测试或者用户行为分析？能否举一个通过数据发现产品问题并推动改进的例子？',
      userAnswer: '',
      optimizedBullet: '',
      isExpanded: false,
    },
    {
      id: nextId(1),
      round: 1,
      direction: '数据指标',
      question: '你提到"跟踪产品上线后的数据表现"，具体跟踪了哪些核心指标？数据来源是哪里？你是如何判断产品改版是否成功的？有没有沉淀出可复用的分析框架？',
      userAnswer: '',
      optimizedBullet: '',
      isExpanded: false,
    },
    {
      id: nextId(1),
      round: 1,
      direction: '用户规模',
      question: '你负责的ERP系统支持了多少内部用户？涉及多少个业务部门？系统每天的活跃用户数和请求量大概在什么水平？这些数据对后续优化有什么指导意义？',
      userAnswer: '',
      optimizedBullet: '',
      isExpanded: false,
    },
    {
      id: nextId(1),
      round: 1,
      direction: '难点解决方案',
      question: '在WMS仓储管理系统的条码扫描功能对接中，遇到了哪些硬件兼容性或业务流程上的难点？你是如何协调硬件供应商和内部开发团队解决问题的？',
      userAnswer: '',
      optimizedBullet: '',
      isExpanded: false,
    },
  ];
}

export function generateFollowUp(
  previousQuestions: FollowUpQuestion[]
): FollowUpQuestion[] {
  const answered = previousQuestions.filter((q) => q.userAnswer.trim().length > 0);
  if (answered.length === 0) {
    return [];
  }

  const followUps: FollowUpQuestion[] = [];

  for (const q of answered) {
    if (followUps.length >= 3) break;

    if (q.direction === '项目背景') {
      followUps.push({
        id: nextId(2),
        round: 2,
        direction: '项目细节追问',
        question: '你提到WMS项目从0到1建设，请问整个项目的团队规模是多少人？从立项到上线花了多长时间？你作为产品经理在技术选型和方案决策中扮演了什么角色？',
        userAnswer: '',
        optimizedBullet: '',
        isExpanded: true,
      });
    } else if (q.direction === '个人职责') {
      followUps.push({
        id: nextId(2),
        round: 2,
        direction: '效果验证追问',
        question: '关于你负责的采购流程优化，请具体说明优化前和优化后采购周期从多少天缩短到多少天？这个改进是分几个阶段完成的？业务方的满意度如何？',
        userAnswer: '',
        optimizedBullet: '',
        isExpanded: true,
      });
    } else if (q.direction === '业务目标') {
      followUps.push({
        id: nextId(2),
        round: 2,
        direction: '数据验证追问',
        question: '报表平台上线后，管理层的使用率如何？是否有具体的数据来说明这个平台对决策效率的提升？比如报告生成时间从之前的手动汇总X天缩短到平台自动生成X分钟？',
        userAnswer: '',
        optimizedBullet: '',
        isExpanded: true,
      });
    } else if (q.direction === '产出成果') {
      followUps.push({
        id: nextId(2),
        round: 2,
        direction: '成果量化追问',
        question: '你提到的数据驱动产品改进案例中，改版前后核心指标变化了多少？这个成果是你在团队中独立推动的还是团队协作的成果？你有没有将这些分析方法和结论沉淀为团队文档？',
        userAnswer: '',
        optimizedBullet: '',
        isExpanded: true,
      });
    }
  }

  if (followUps.length === 0) {
    followUps.push({
      id: nextId(2),
      round: 2,
      direction: '深度追问',
      question: '你提到正在关注AI产品方向，能否具体说说你对目前大模型在B端应用场景的观察？有没有尝试用过ChatGPT、Claude或其他AI工具来辅助你的产品工作？有哪些具体的使用体会？',
      userAnswer: '',
      optimizedBullet: '',
      isExpanded: true,
    });
  }

  return followUps;
}

export function generateOptimizedBullet(question: FollowUpQuestion): string {
  const bullets: Record<string, string> = {
    '项目背景': '主导WMS仓储管理系统从0到1建设，覆盖入库、出库、盘点等核心业务流程，系统上线后支撑日均2000+订单处理和500+SKU库存管理，对接条码扫描硬件实现出入库效率提升40%',
    '个人职责': '主导ERP采购管理模块全流程优化，通过业务流程重构和自动化规则配置，将采购审批周期从平均5天缩短至2天，采购订单处理效率提升60%，年均为企业节省约80人天的管理成本',
    '业务目标': '负责企业报表平台从需求调研到上线的全周期产品管理，一期覆盖财务、运营、销售三大核心部门40+报表需求，上线后管理层决策数据获取时间从平均3天缩短至实时查看，平台月活跃用户超过200人',
    '关键动作': '通过用户访谈、问卷调查和数据分析三结合方法系统化采集需求，建立需求价值-优先级评估矩阵，成功推动20+核心需求落地，需求交付率达85%',
    '产出成果': '建立产品上线后数据追踪机制，通过A/B测试验证功能效果，其中一个典型优化使模块用户满意度从72%提升至91%，相关分析方法已沉淀为团队标准流程文档',
    '数据指标': '构建了涵盖用户活跃度、功能使用率、任务完成时长、错误率等维度的产品数据指标体系，通过SQL从数据库提取数据并用Tableau进行可视化，定期输出产品健康度报告驱动迭代决策',
    '用户规模': '负责的ERP系统覆盖公司6个业务部门约300+内部用户，系统日均PV约8000+，核心模块月活率超过85%，基于用户行为数据识别出20+产品优化机会点',
    '难点解决方案': '在WMS条码扫描功能中主导解决了扫描枪兼容性问题和批量扫描性能瓶颈，通过协调3家硬件供应商进行对比测试并优化数据交互方案，最终实现扫码识别率从85%提升至99.5%',
  };

  const key = bullets[question.direction];
  if (key) return key;

  if (question.direction.includes('追问')) {
    return '结合用户提供的具体数据进行深度量化优化，突出个人贡献比例、时间周期和可验证的业务价值，确保每个数据点都有清晰的衡量标准和可信来源';
  }

  return '根据用户补充信息，进一步细化项目描述中的量化指标和个人角色定位，突出与AI产品经理岗位的关联性和可迁移能力';
}
