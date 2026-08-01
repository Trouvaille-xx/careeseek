import type {
  FinalResume,
  FollowUpQuestion,
  InterviewPrep,
  JDAnalysis,
  MatchingRow,
  OptimizationItem,
  OptimizationStyle,
  ResumeDiagnosis,
  UserInput,
} from '@/types';

import { getExampleInput } from './data';
import { generateJDAnalysis } from './generators/jdParser';
import { generateDiagnosis } from './generators/diagnosis';
import { generateMatching } from './generators/matching';
import {
  generateFollowUp as genFollowUp,
  generateOptimizedBullet,
  generateQuestions,
  resetCounter as resetQuestionCounter,
} from './generators/questions';
import {
  generateOptimization,
  regenerateOptimization,
  resetCounter as resetOptimizationCounter,
} from './generators/optimization';
import { generateFinalResume } from './generators/finalResume';
import { generateInterviewPrep } from './generators/interviewPrep';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(min = 1500, max = 4000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface OptimizeContext {
  jdAnalysis: JDAnalysis;
  diagnosis: ResumeDiagnosis;
  matchingRows: MatchingRow[];
  followUpQuestions: FollowUpQuestion[];
}

function ensureInput(input?: UserInput): UserInput {
  return input ?? getExampleInput();
}

function ensureJDAnalysis(input: UserInput, analysis?: JDAnalysis): JDAnalysis {
  return analysis ?? generateJDAnalysis(input);
}

function ensureDiagnosis(
  input: UserInput,
  jdAnalysis: JDAnalysis,
  diagnosis?: ResumeDiagnosis
): ResumeDiagnosis {
  return diagnosis ?? generateDiagnosis(input, jdAnalysis);
}

export const mockAiService = {
  async analyzeJD(input?: UserInput): Promise<JDAnalysis> {
    const userInput = ensureInput(input);
    const result = generateJDAnalysis(userInput);
    await delay(randomDelay(1800, 3500));
    return result;
  },

  async diagnoseResume(
    input?: UserInput,
    jdAnalysis?: JDAnalysis
  ): Promise<ResumeDiagnosis> {
    const userInput = ensureInput(input);
    const jd = ensureJDAnalysis(userInput, jdAnalysis);
    const result = generateDiagnosis(userInput, jd);
    await delay(randomDelay(2000, 4000));
    return result;
  },

  async analyzeMatching(
    input?: UserInput,
    jdAnalysis?: JDAnalysis
  ): Promise<MatchingRow[]> {
    const userInput = ensureInput(input);
    const jd = ensureJDAnalysis(userInput, jdAnalysis);
    const result = generateMatching(userInput, jd);
    await delay(randomDelay(1500, 3000));
    return result;
  },

  async generateQuestions(
    input?: UserInput,
    jdAnalysis?: JDAnalysis,
    diagnosis?: ResumeDiagnosis
  ): Promise<FollowUpQuestion[]> {
    resetQuestionCounter();
    const userInput = ensureInput(input);
    const jd = ensureJDAnalysis(userInput, jdAnalysis);
    const diag = ensureDiagnosis(userInput, jd, diagnosis);
    const result = generateQuestions(userInput, jd, diag);
    await delay(randomDelay(1500, 3000));
    return result;
  },

  async generateFollowUp(
    previousQuestions: FollowUpQuestion[]
  ): Promise<FollowUpQuestion[]> {
    const result = genFollowUp(previousQuestions);
    await delay(randomDelay(1500, 2500));
    return result;
  },

  async generateBullet(question: FollowUpQuestion): Promise<string> {
    await delay(randomDelay(1000, 2000));
    return generateOptimizedBullet(question);
  },

  async optimizeResume(
    input?: UserInput,
    context?: OptimizeContext,
    style?: OptimizationStyle
  ): Promise<OptimizationItem[]> {
    resetOptimizationCounter();
    const userInput = ensureInput(input);
    const jd = ensureJDAnalysis(userInput);
    const diag = ensureDiagnosis(userInput, jd);
    const rows = generateMatching(userInput, jd);
    const result = generateOptimization(
      userInput,
      jd,
      diag,
      rows,
      [],
      style ?? 'default'
    );
    await delay(randomDelay(2500, 4000));
    return result;
  },

  async regenerateOptimization(
    items: OptimizationItem[],
    style: OptimizationStyle
  ): Promise<OptimizationItem[]> {
    resetOptimizationCounter();
    const result = regenerateOptimization(items, style);
    await delay(randomDelay(2000, 3500));
    return result;
  },

  async generateFinalResume(
    input?: UserInput,
    items?: OptimizationItem[]
  ): Promise<FinalResume> {
    const userInput = ensureInput(input);
    const result = generateFinalResume(userInput, items ?? []);
    await delay(randomDelay(2000, 3500));
    return result;
  },

  async generateInterviewPrep(
    input?: UserInput,
    jdAnalysis?: JDAnalysis,
    diagnosis?: ResumeDiagnosis
  ): Promise<InterviewPrep> {
    const userInput = ensureInput(input);
    const jd = ensureJDAnalysis(userInput, jdAnalysis);
    const diag = ensureDiagnosis(userInput, jd, diagnosis);
    const result = generateInterviewPrep(userInput, jd, diag);
    await delay(randomDelay(2000, 3500));
    return result;
  },
};

export default mockAiService;
