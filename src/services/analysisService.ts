import type {
  JDAnalysis, ResumeDiagnosis, MatchingRow, FollowUpQuestion,
  OptimizationItem, OptimizationStyle, FinalResume, InterviewPrep,
  InterviewMessage,
} from '@/types';
import { callLLMWithJSON, callLLM, callLLMForInterview, callLLMStream, extractJSON, type InterviewUsage } from './apiService';
import {
  JD_PARSE_SYSTEM, buildJDPrompt,
  DIAGNOSIS_SYSTEM, buildDiagnosisPrompt,
  MATCHING_SYSTEM, buildMatchingPrompt,
  QUESTIONS_SYSTEM, buildQuestionsPrompt,
  buildFollowUpPrompt,
  BULLET_SYSTEM, buildBulletPrompt,
  OPTIMIZE_SYSTEM, buildOptimizationPrompt,
  FINAL_RESUME_SYSTEM, buildFinalResumePrompt,
  INTERVIEW_PREP_SYSTEM, buildInterviewPrepPrompt,
  buildInterviewSystemPrompt, buildInterviewFollowUpPrompt,
} from './prompts';
import type { UserInput } from '@/types';

async function fetchWithTimeout<T>(fn: () => Promise<T>, timeoutMs = 90000): Promise<T> {
  const result = await Promise.race([
    fn(),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('请求超时，请检查 API 配置')), timeoutMs)),
  ]);
  return result;
}

export const analysisService = {
  async analyzeJD(input: UserInput): Promise<JDAnalysis> {
    return fetchWithTimeout(() => callLLMWithJSON<JDAnalysis>(
JD_PARSE_SYSTEM(), buildJDPrompt(input.jdContent)
    ));
  },

  /**
   * JD 解析的流式版本：SSE 逐字输出，结束时提取 JSON。
   * onChunk 用于前端逐字渲染。
   */
  async analyzeJDStream(input: UserInput, onChunk: (delta: string) => void): Promise<JDAnalysis> {
    const text = await fetchWithTimeout(() => callLLMStream(
      JD_PARSE_SYSTEM(), buildJDPrompt(input.jdContent), onChunk
    ));
    return JSON.parse(extractJSON(text)) as JDAnalysis;
  },

  async diagnoseResume(input: UserInput, jdAnalysis: JDAnalysis): Promise<ResumeDiagnosis> {
    return fetchWithTimeout(() => callLLMWithJSON<ResumeDiagnosis>(
      DIAGNOSIS_SYSTEM(), buildDiagnosisPrompt(input.jdContent, input.resumeContent, JSON.stringify(jdAnalysis))
    ));
  },

  async analyzeMatching(input: UserInput, jdAnalysis: JDAnalysis, diagnosis: ResumeDiagnosis): Promise<MatchingRow[]> {
    return fetchWithTimeout(() => callLLMWithJSON<MatchingRow[]>(
      MATCHING_SYSTEM(), buildMatchingPrompt(input.jdContent, input.resumeContent, JSON.stringify(jdAnalysis), JSON.stringify(diagnosis))
    ));
  },

  async generateQuestions(input: UserInput, jdAnalysis: JDAnalysis, diagnosis: ResumeDiagnosis, matchingRows: MatchingRow[]): Promise<FollowUpQuestion[]> {
    return fetchWithTimeout(() => callLLMWithJSON<FollowUpQuestion[]>(
      QUESTIONS_SYSTEM(), buildQuestionsPrompt(input.jdContent, input.resumeContent, JSON.stringify(matchingRows))
    ));
  },

  async generateFollowUp(input: UserInput, existingQuestions: FollowUpQuestion[]): Promise<FollowUpQuestion[]> {
    const qa = existingQuestions.map((q) => `Q: ${q.question}\nA: ${q.userAnswer}`).join('\n\n');
    return fetchWithTimeout(() => callLLMWithJSON<FollowUpQuestion[]>(
      QUESTIONS_SYSTEM(), buildFollowUpPrompt(input.jdContent, input.resumeContent, qa)
    ));
  },

  async generateBullet(question: FollowUpQuestion): Promise<string> {
    return fetchWithTimeout(() => callLLM(
      BULLET_SYSTEM(), buildBulletPrompt(question.question, question.userAnswer)
    ));
  },

  async optimizeResume(
    input: UserInput, jdAnalysis: JDAnalysis, diagnosis: ResumeDiagnosis,
    matchingRows: MatchingRow[], followUpQuestions: FollowUpQuestion[],
    style: OptimizationStyle
  ): Promise<OptimizationItem[]> {
    return fetchWithTimeout(() => callLLMWithJSON<OptimizationItem[]>(
      OPTIMIZE_SYSTEM(), buildOptimizationPrompt(
        input.jdContent, input.resumeContent, JSON.stringify(jdAnalysis),
        JSON.stringify(diagnosis), JSON.stringify(matchingRows),
        JSON.stringify(followUpQuestions), style
      )
    ));
  },

  async generateFinalResume(input: UserInput, optimizationItems: OptimizationItem[]): Promise<FinalResume> {
    return fetchWithTimeout(() => callLLMWithJSON<FinalResume>(
      FINAL_RESUME_SYSTEM(), buildFinalResumePrompt(input.jdContent, input.resumeContent, JSON.stringify(optimizationItems))
    ));
  },

  async generateInterviewPrep(input: UserInput, jdAnalysis: JDAnalysis, diagnosis: ResumeDiagnosis): Promise<InterviewPrep> {
    return fetchWithTimeout(() => callLLMWithJSON<InterviewPrep>(
      INTERVIEW_PREP_SYSTEM(), buildInterviewPrepPrompt(input.jdContent, input.resumeContent, JSON.stringify(diagnosis))
    ));
  },

  // ====== Mock Interview ======
  async startInterview(_input: UserInput, _jdAnalysis: JDAnalysis, _diagnosis: ResumeDiagnosis, _mode: string, persona?: string): Promise<{ persona: string; firstQuestion: string }> {
    // 开场白与第一问固定：先做候选人自我介绍（约定俗成），便于后续追问。
    // 不再让 LLM 即兴生成第一问，避免不可控。
    const opener = buildInterviewOpener(persona);
    const firstQuestion = '先请你做一个简短的自我介绍吧——说说你的背景、最近在做的项目，以及为什么对这个岗位感兴趣。控制在 1-2 分钟即可。';
    return { persona: opener, firstQuestion };
  },

  async continueInterview(
    input: UserInput, jdAnalysis: JDAnalysis, diagnosis: ResumeDiagnosis,
    messages: InterviewMessage[], mode: string, persona?: string
  ): Promise<{ response: string; tip?: string; score?: number; usage: InterviewUsage | null }> {
    const systemPrompt = buildInterviewSystemPrompt(input.jdContent, input.resumeContent, JSON.stringify(jdAnalysis), JSON.stringify(diagnosis), mode, persona);
    const history = messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const { response, usage } = await fetchWithTimeout(() => callLLMForInterview(systemPrompt, history));

    if (mode === 'learning') {
      const tipMatch = response.match(/\[TIP\]([\s\S]*?)(?=\[SCORE\]|$)/);
      const scoreMatch = response.match(/\[SCORE\]\s*(\d+)/);
      const cleanText = response.replace(/\[TIP\].*(\[SCORE\].*)?$/s, '').trim();
      return {
        response: cleanText,
        tip: tipMatch?.[1]?.trim(),
        score: scoreMatch ? parseInt(scoreMatch[1]) : undefined,
        usage,
      };
    }

    return { response, usage };
  },
};

/**
 * 从 INTERVIEW_PREP 预生成的 interviewerPersona 字符串中提取姓名/职位/风格。
 * 该字符串由 normalizeInterviewPrep 拼接成 "姓名: X\n职位: Y\n风格: Z\n关注点: A、B、C" 形式。
 * 解析不到时回退到通用文案。
 */
function extractPersonaField(text: string, key: string): string | null {
  const re = new RegExp(`${key}\\s*[:：]\\s*([^\\n]+)`);
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

function buildInterviewOpener(persona?: string): string {
  const fallback = '你好，我是本次面试的面试官。今天由我来和你聊聊这个岗位。';
  if (!persona || !persona.trim()) {
    return `${fallback} 在开始之前，先做个简单的自我介绍吧。`;
  }
  const name = extractPersonaField(persona, '姓名');
  const title = extractPersonaField(persona, '职位');
  const style = extractPersonaField(persona, '风格');
  const who = name ? `${name}${title ? `（${title}）` : ''}` : '本次面试的面试官';
  const tail = style ? `我的风格是${style}。` : '';
  return `你好，我是${who}。${tail}今天由我来和你聊聊这个岗位。在开始之前，先做个简单的自我介绍吧——说说你的背景、最近在做的项目，以及为什么对这个岗位感兴趣。控制在 1-2 分钟即可。`;
}
