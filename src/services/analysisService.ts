import type {
  JDAnalysis, ResumeDiagnosis, MatchingRow, FollowUpQuestion,
  OptimizationItem, OptimizationStyle, FinalResume, InterviewPrep,
  InterviewMessage,
} from '@/types';
import { callLLMWithJSON, callLLM, callLLMForInterview, callLLMStream, extractJSON } from './apiService';
import {
  JD_PARSE_SYSTEM, buildJDPrompt,
  DIAGNOSIS_SYSTEM, buildDiagnosisPrompt,
  MATCHING_SYSTEM, buildMatchingPrompt,
  QUESTIONS_SYSTEM, buildQuestionsPrompt,
  buildFollowUpPrompt,
  buildBulletPrompt,
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
      JD_PARSE_SYSTEM, buildJDPrompt(input.jdContent)
    ));
  },

  /**
   * JD 解析的流式版本：SSE 逐字输出，结束时提取 JSON。
   * onChunk 用于前端逐字渲染。
   */
  async analyzeJDStream(input: UserInput, onChunk: (delta: string) => void): Promise<JDAnalysis> {
    const text = await fetchWithTimeout(() => callLLMStream(
      JD_PARSE_SYSTEM, buildJDPrompt(input.jdContent), onChunk
    ));
    return JSON.parse(extractJSON(text)) as JDAnalysis;
  },

  async diagnoseResume(input: UserInput, jdAnalysis: JDAnalysis): Promise<ResumeDiagnosis> {
    return fetchWithTimeout(() => callLLMWithJSON<ResumeDiagnosis>(
      DIAGNOSIS_SYSTEM, buildDiagnosisPrompt(input.jdContent, input.resumeContent, JSON.stringify(jdAnalysis))
    ));
  },

  async analyzeMatching(input: UserInput, jdAnalysis: JDAnalysis, diagnosis: ResumeDiagnosis): Promise<MatchingRow[]> {
    return fetchWithTimeout(() => callLLMWithJSON<MatchingRow[]>(
      MATCHING_SYSTEM, buildMatchingPrompt(input.jdContent, input.resumeContent, JSON.stringify(jdAnalysis), JSON.stringify(diagnosis))
    ));
  },

  async generateQuestions(input: UserInput, jdAnalysis: JDAnalysis, diagnosis: ResumeDiagnosis, matchingRows: MatchingRow[]): Promise<FollowUpQuestion[]> {
    return fetchWithTimeout(() => callLLMWithJSON<FollowUpQuestion[]>(
      QUESTIONS_SYSTEM, buildQuestionsPrompt(input.jdContent, input.resumeContent, JSON.stringify(matchingRows))
    ));
  },

  async generateFollowUp(input: UserInput, existingQuestions: FollowUpQuestion[]): Promise<FollowUpQuestion[]> {
    const qa = existingQuestions.map((q) => `Q: ${q.question}\nA: ${q.userAnswer}`).join('\n\n');
    return fetchWithTimeout(() => callLLMWithJSON<FollowUpQuestion[]>(
      QUESTIONS_SYSTEM, buildFollowUpPrompt(input.jdContent, input.resumeContent, qa)
    ));
  },

  async generateBullet(question: FollowUpQuestion): Promise<string> {
    return fetchWithTimeout(() => callLLM(
      '你是一名简历优化专家，负责根据追问回答生成优化后的简历表达。', buildBulletPrompt(question.question, question.userAnswer)
    ));
  },

  async optimizeResume(
    input: UserInput, jdAnalysis: JDAnalysis, diagnosis: ResumeDiagnosis,
    matchingRows: MatchingRow[], followUpQuestions: FollowUpQuestion[],
    style: OptimizationStyle
  ): Promise<OptimizationItem[]> {
    return fetchWithTimeout(() => callLLMWithJSON<OptimizationItem[]>(
      OPTIMIZE_SYSTEM, buildOptimizationPrompt(
        input.jdContent, input.resumeContent, JSON.stringify(jdAnalysis),
        JSON.stringify(diagnosis), JSON.stringify(matchingRows),
        JSON.stringify(followUpQuestions), style
      )
    ));
  },

  async generateFinalResume(input: UserInput, optimizationItems: OptimizationItem[]): Promise<FinalResume> {
    return fetchWithTimeout(() => callLLMWithJSON<FinalResume>(
      FINAL_RESUME_SYSTEM, buildFinalResumePrompt(input.jdContent, input.resumeContent, JSON.stringify(optimizationItems))
    ));
  },

  async generateInterviewPrep(input: UserInput, jdAnalysis: JDAnalysis, diagnosis: ResumeDiagnosis): Promise<InterviewPrep> {
    return fetchWithTimeout(() => callLLMWithJSON<InterviewPrep>(
      INTERVIEW_PREP_SYSTEM, buildInterviewPrepPrompt(input.jdContent, input.resumeContent, JSON.stringify(diagnosis))
    ));
  },

  // ====== Mock Interview ======
  async startInterview(input: UserInput, jdAnalysis: JDAnalysis, diagnosis: ResumeDiagnosis, mode: string): Promise<{ persona: string; firstQuestion: string }> {
    const systemPrompt = buildInterviewSystemPrompt(input.jdContent, input.resumeContent, JSON.stringify(jdAnalysis), JSON.stringify(diagnosis), mode);
    const response = await fetchWithTimeout(() => callLLM(systemPrompt, '请先做自我介绍并开始面试。输出格式：自我介绍 + 第一个面试问题。'));
    const parts = response.split(/\n(?=\d+[.、])/);
    const firstQuestion = parts[parts.length - 1] || response;
    const persona = parts.length > 1 ? parts.slice(0, -1).join('\n') : '你好，我是本次面试的面试官。让我们开始吧。';
    return { persona, firstQuestion };
  },

  async continueInterview(
    input: UserInput, jdAnalysis: JDAnalysis, diagnosis: ResumeDiagnosis,
    messages: InterviewMessage[], mode: string
  ): Promise<{ response: string; tip?: string; score?: number }> {
    const systemPrompt = buildInterviewSystemPrompt(input.jdContent, input.resumeContent, JSON.stringify(jdAnalysis), JSON.stringify(diagnosis), mode);
    const history = messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const text = await fetchWithTimeout(() => callLLMForInterview(systemPrompt, history));

    if (mode === 'learning') {
      const tipMatch = text.match(/\[TIP\]([\s\S]*?)(?=\[SCORE\]|$)/);
      const scoreMatch = text.match(/\[SCORE\]\s*(\d+)/);
      const cleanText = text.replace(/\[TIP\].*(\[SCORE\].*)?$/s, '').trim();
      return {
        response: cleanText,
        tip: tipMatch?.[1]?.trim(),
        score: scoreMatch ? parseInt(scoreMatch[1]) : undefined,
      };
    }

    return { response: text };
  },
};
