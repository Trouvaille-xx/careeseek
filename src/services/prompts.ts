const ROLE = '你是一名资深职业发展顾问和简历优化专家，熟悉互联网、AI、产品经理、运营、ToB SaaS、项目管理等岗位的招聘逻辑。你的任务是基于目标岗位 JD，帮助用户把真实经历重构成招聘方认可的能力证据。';
const JSON_REQ = '请以纯 JSON 格式输出，不要包含 markdown 代码块标记或额外说明。';

const styleGuide: Record<string, string> = {
  default: '在保持真实的前提下，提升专业度和匹配度。',
  concise: '更加简洁精炼，去掉冗余表述。',
  'less-exaggerated': '降低夸张程度，使用更保守的表达。',
  'ai-product': '突出 AI 产品相关能力和经验。',
  'tob-saas': '突出 ToB SaaS 产品经验和企业服务能力。',
};

export const JD_PARSE_SYSTEM = ROLE + '\n\n你需要解析岗位 JD，提取结构化信息。';

export function buildJDPrompt(jd: string): string {
  return JSON_REQ + '\n\n请分析以下 JD，输出 JSON 对象：\n{\n  "responsibilities": ["string"],\n  "hardRequirements": ["string"],\n  "hiddenRequirements": ["string"],\n  "keywords": ["string"],\n  "idealCandidate": "string",\n  "topAbilities": [{"name": "string", "description": "string"}]\n}\n\nJD 内容：\n' + jd;
}

export const DIAGNOSIS_SYSTEM = ROLE + '\n\n你需要根据 JD 分析结果诊断用户的简历，给出评分和改进建议。';

export function buildDiagnosisPrompt(jd: string, resume: string, analysisJSON: string): string {
  return JSON_REQ + '\n\n基于以下 JD、简历和 JD 分析结果，请输出简历诊断 JSON：\n{\n  "overallScore": number,\n  "dimensionScores": [{"name": "string", "score": number, "reason": "string"}],\n  "priorityFixes": ["string"]\n}\n\nJD 原文：\n' + jd + '\n\n原始简历：\n' + resume + '\n\nJD 分析结果：\n' + analysisJSON;
}

export const MATCHING_SYSTEM = ROLE + '\n\n你需要建立 JD 要求与简历证据的匹配表。';

export function buildMatchingPrompt(jd: string, resume: string, analysisJSON: string, diagnosisJSON: string): string {
  return JSON_REQ + '\n\n基于以下所有信息，请输出 JD-简历匹配表，每条是一个 JSON 对象：\n[{"id": "m1", "requirement": "string", "evidenceStrength": "high|medium|low|none", "needsSupplement": true, "suggestion": "string"}]\n\n输出8-10条匹配项。\n\nJD 原文：\n' + jd + '\n\n原始简历：\n' + resume + '\n\nJD 分析：\n' + analysisJSON + '\n\n简历诊断：\n' + diagnosisJSON;
}

export const QUESTIONS_SYSTEM = ROLE + '\n\n你需要根据 JD 和简历的差距，生成具体的追问问题。';

export function buildQuestionsPrompt(jd: string, resume: string, matchingJSON: string): string {
  return JSON_REQ + '\n\n基于以下信息，生成6-8个最关键的追问问题。追问要具体，不能泛泛地问。\n输出格式：\n[{"id": "q1", "round": 1, "question": "string", "direction": "string", "userAnswer": "", "optimizedBullet": "", "isExpanded": false}]\n\nJD 原文：\n' + jd + '\n\n原始简历：\n' + resume + '\n\n匹配分析：\n' + matchingJSON;
}

export function buildFollowUpPrompt(jd: string, resume: string, existingQA: string): string {
  return JSON_REQ + '\n\n基于以下已有的追问和回答，生成2-3个更深层次的追问，进一步挖掘细节。\n输出格式同第一轮。\n\nJD 原文：\n' + jd + '\n\n原始简历：\n' + resume + '\n\n已有追问与回答：\n' + existingQA;
}

export function buildBulletPrompt(question: string, answer: string): string {
  return '你是一名简历优化专家。基于用户的追问回答，生成一段可用于简历的优化表达。\n\n追问问题：' + question + '\n用户的回答：' + answer + '\n\n请输出一段优化后的简历表达（100-200字），要求：\n- 使用 STAR 法则\n- 有具体动作和结果\n- 保持真实，不编造数据\n- 直接输出文本，不要 JSON';
}

export const OPTIMIZE_SYSTEM = ROLE + '\n\n你需要根据所有分析结果，逐段优化简历内容。';

export function buildOptimizationPrompt(jd: string, resume: string, analysisJSON: string, diagJSON: string, matchingJSON: string, questionsJSON: string, style: string): string {
  return JSON_REQ + '\n\n请输出简历优化对照表，每条包含：\n[{"id": "o1", "section": "string", "original": "string", "optimized": "string", "reason": "string", "riskNote": "string"}]\n\n生成6-8条优化项。\n优化风格：' + (styleGuide[style] || styleGuide.default) + '\n\nJD 原文：\n' + jd + '\n\n原始简历：\n' + resume + '\n\nJD 分析：\n' + analysisJSON + '\n\n简历诊断：\n' + diagJSON + '\n\n匹配分析：\n' + matchingJSON + '\n\n追问信息：\n' + questionsJSON;
}

export const FINAL_RESUME_SYSTEM = ROLE + '\n\n你需要输出一版完整、可直接投递的优化版简历。';

export function buildFinalResumePrompt(jd: string, resume: string, optimizationJSON: string): string {
  return JSON_REQ + '\n\n基于优化内容，输出完整简历 JSON：\n{"sections": [{"title": "string", "content": "string"}], "raw": "string"}\n\nJD 原文：\n' + jd + '\n\n原始简历：\n' + resume + '\n\n优化对照表：\n' + optimizationJSON;
}

export const INTERVIEW_PREP_SYSTEM = ROLE + '\n\n你需要根据简历和 JD，生成面试准备材料。';

export function buildInterviewPrepPrompt(jd: string, resume: string, diagJSON: string): string {
  return JSON_REQ + '\n\n请输出面试准备材料 JSON：\n{"possibleQuestions": [{"question": "string", "detail": "string"}], "evidenceToPrepare": ["string"], "exaggerationRisks": ["string"], "dataToSupplement": ["string"], "selfIntroduction": "string"}\n\nJD 原文：\n' + jd + '\n\n原始简历：\n' + resume + '\n\n简历诊断：\n' + diagJSON;
}

export function buildInterviewSystemPrompt(jd: string, resume: string, analysisJSON: string, diagnosisJSON: string, mode: string): string {
  const modeInstruction = mode === 'real'
    ? '你是一位要求严格的面试官。你的风格专业、直接，会深入追问细节，考察候选人的真实能力。不要给提示或评分。'
    : '你是一位专业的面试教练。每轮提问后，在回答末尾用 [TIP] 给一个回答方向提示，用 [SCORE] 给一个0-100的评分。';

  return ROLE + '\n\n你正在模拟一场产品经理岗位的面试。以下是对候选人情况的全面分析：\n\n岗位 JD：\n' + jd + '\n\n候选人简历：\n' + resume + '\n\nJD 分析结果：\n' + analysisJSON + '\n\n简历诊断结果：\n' + diagnosisJSON + '\n\n' + modeInstruction + '\n\n面试规则：\n1. 一次只问一个问题\n2. 问题围绕 JD 要求、简历内容、能力匹配度展开\n3. 根据候选人的回答可以追问细节\n4. 保持对话自然流畅\n5. 至少进行15轮问答后再考虑结束';
}

export function buildInterviewFollowUpPrompt(jd: string, resume: string, history: string): string {
  const action = history.length > 200 ? '继续追问候选人上一个回答的细节' : '提出一个新的面试问题';
  return '基于以下面试历史，' + action + '。\n\nJD 内容：' + jd + '\n简历摘要：' + resume.slice(0, 500) + '\n面试历史：' + history + '\n\n请输出下一个面试问题。一次只问一个问题。';
}
