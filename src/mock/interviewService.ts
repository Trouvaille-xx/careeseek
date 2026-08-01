import type { JDAnalysis, ResumeDiagnosis, InterviewMessage, InterviewReport } from '@/types';

let questionIndex = 0;

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

const questionTemplates = [
  '请简要介绍一下你自己，以及为什么你觉得自己适合这个岗位？',
  '你过去的工作经历中，最有成就感的一个项目是什么？你在其中扮演了什么角色？',
  '你对我们这个岗位的 JD 怎么理解？你觉得你最匹配的地方是什么？',
  '你过去有没有和算法团队合作的经验？合作中遇到过什么挑战？',
  '你如何理解大模型在产品中的应用？有没有实际的项目经验？',
  '在你过去的项目中，有没有通过数据分析驱动产品决策的例子？可以详细说说吗？',
  '如果让你设计一个 AI 产品功能，你会从哪些方面入手？',
  '你在跨团队协作中，有没有遇到过资源冲突的情况？你是怎么解决的？',
  '你提到负责过 ERP 系统的产品设计，这个过程中你最大的收获是什么？',
  '你对 ToB SaaS 产品有什么理解？和我们分享一下你的看法。',
  '在你过去的经历中，有没有从 0 到 1 的产品经验？具体是怎么做的？',
  '你怎么看待 AI 产品经理和传统产品经理的区别？',
  '你简历中提到的某个项目，可以再详细描述一下你在其中的具体贡献吗？',
  '如果我们录用你，你觉得自己在前三个月最需要学习和适应的是什么？',
  '你有没有了解过我们的产品？你觉得可以怎么改进？',
  '你平时怎么关注和学习 AI 领域的最新技术？',
  '你期望的工作环境是什么样的？你更倾向于什么样的团队协作方式？',
  '如果让你为一个 AI 客服产品设计一个核心功能，你会怎么设计？',
  '你遇到过一个很难沟通的团队成员吗？你是怎么处理的？',
  '你未来的职业规划是什么？为什么选择 AI 方向？',
];

const followUpTemplates = [
  '能再具体一点吗？当时你是怎么做的决策？',
  '这个过程中有没有遇到什么阻力？你是怎么应对的？',
  '如果让你重新做一次，你会有什么不同的做法？',
  '你提到的这个数据，背后的分析逻辑是什么？',
  '当时团队有多少人？你具体负责哪一部分？',
];

const tipTemplates: Record<string, string[]> = {
  '自我介绍': ['可以从教育背景、工作经历、核心能力、为什么适合这个岗位四个层次展开。突出与 JD 最匹配的点。'],
  '项目经验': ['建议用 STAR 法则描述：背景、任务、行动、结果。重点突出你的个人贡献和量化成果。'],
  'JD理解': ['先总结 JD 的核心要求，再结合自身经历说明匹配度，最后表达对这个岗位的理解和热情。'],
  '团队协作': ['准备一个具体的冲突案例，用"背景-行动-结果"的结构说明你的沟通能力和解决问题能力。'],
  '产品思维': ['展示你的结构化思考能力：用户需求 → 方案设计 → 数据验证 → 迭代优化。'],
  'AI理解': ['结合你对大模型、RAG、Agent 等技术概念的理解，说明如何将技术转化为产品价值。'],
  '职业规划': ['说明你为什么选择 AI 方向，你的学习计划，以及你希望在新岗位上获得什么成长。'],
};

function generateTip(question: string): string {
  for (const [key, tips] of Object.entries(tipTemplates)) {
    if (question.includes(key)) return pick(tips);
  }
  return '结合自身经历，用具体案例支撑你的观点，尽量用量化结果说明问题。';
}

function generateScore(userAnswer: string): { score: number; comment: string } {
  const length = userAnswer.length;
  let score = 60;
  if (length > 100) score += 10;
  if (length > 200) score += 10;
  if (length > 400) score += 10;
  if (/数|量|率|提升|降低|增长|占比/.test(userAnswer)) score += 5;
  if (/因为|所以|为了|通过|基于|根据/.test(userAnswer)) score += 5;
  if (/我认为|我觉得|在我看来|我的理解/.test(userAnswer)) score += 5;
  score = Math.min(score, 98);

  let comment = '';
  if (score >= 85) comment = '回答结构清晰，有具体案例支撑，表达专业。';
  else if (score >= 70) comment = '回答基本完整，建议增加更多量化和具体细节。';
  else comment = '回答较简短，建议用 STAR 法则展开，补充更多背景和结果。';

  return { score, comment };
}

export function generateInterviewPersona(jdAnalysis: JDAnalysis | null, diagnosis: ResumeDiagnosis | null): string {
  const role = jdAnalysis?.responsibilities?.[0] ?? '产品';
  return `你好，我是本次面试的面试官。我主要负责${role}相关岗位的招聘。今天面试的目的是为了更好地了解你的专业能力和岗位匹配度。我们开始吧。`;
}

export function generateInterviewQuestion(round: number, answeredCount: number): string {
  questionIndex = answeredCount;
  const idx = questionIndex % questionTemplates.length;
  if (answeredCount >= questionTemplates.length - 2 && Math.random() > 0.5) {
    return pick(followUpTemplates);
  }
  return questionTemplates[idx];
}

export function generateLearningResponse(userAnswer: string): { tip: string; score: number; comment: string } {
  const { score, comment } = generateScore(userAnswer);
  const tip = generateTip(questionTemplates[questionIndex % questionTemplates.length]);
  return { tip, score, comment };
}

export function generateInterviewReport(messages: InterviewMessage[], mode: string): InterviewReport {
  const userMsgs = messages.filter((m) => m.role === 'user');
  const roundScores = userMsgs.map((m, i) => {
    const { score, comment } = generateScore(m.content);
    return { round: i + 1, score, comment };
  });

  const overallScore = Math.round(roundScores.reduce((a, b) => a + b.score, 0) / roundScores.length);

  return {
    overallScore,
    roundScores,
    strengths: [
      '对产品经理的核心职责有清晰的理解',
      '能够结合自身经历回答问题',
      '表达逻辑基本清晰',
      '对 AI 领域有持续的关注和学习',
    ],
    improvements: [
      '建议在回答中增加更多量化的成果数据',
      '可以更深入地展示对 AI 技术原理的理解',
      '建议用 STAR 法则结构化描述项目经验',
      '可以提前准备一些与目标岗位相关的作品或案例',
    ],
    summary: `本次${mode === 'real' ? '真实面试' : '学习模式面试'}共进行了${userMsgs.length}轮问答。整体表现${overallScore >= 75 ? '良好' : overallScore >= 60 ? '中等' : '有待提高'}。${overallScore >= 75 ? '你的专业基础和表达能力较好，建议在技术深度和量化成果方面进一步强化。' : '建议多准备一些具体的项目案例，加强对 JD 中关键要求的针对性准备。'}`,
  };
}
