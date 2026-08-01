// ============ User Input ============
export interface UserInput {
  targetRole: string;
  industry: string;
  companyType: string;
  careerStage: string;
  highlightSkills: string;
  jdContent: string;
  resumeContent: string;
  supplementInfo: string;
}

// ============ JD Analysis ============
export interface TopAbility {
  name: string;
  description: string;
}

export interface JDAnalysis {
  responsibilities: string[];
  hardRequirements: string[];
  hiddenRequirements: string[];
  keywords: string[];
  idealCandidate: string;
  topAbilities: TopAbility[];
}

// ============ Resume Diagnosis ============
export interface DimensionScore {
  name: string;
  score: number;
  reason: string;
}

export interface ResumeDiagnosis {
  overallScore: number;
  dimensionScores: DimensionScore[];
  priorityFixes: string[];
}

// ============ Matching Analysis ============
export type EvidenceStrength = 'high' | 'medium' | 'low' | 'none';

export interface MatchingRow {
  id: string;
  requirement: string;
  evidenceStrength: EvidenceStrength;
  needsSupplement: boolean;
  suggestion: string;
}

// ============ Follow-up Questions ============
export interface FollowUpQuestion {
  id: string;
  round: number;
  question: string;
  direction: string;
  userAnswer: string;
  optimizedBullet: string;
  isExpanded: boolean;
}

// ============ Resume Optimization ============
export interface OptimizationItem {
  id: string;
  section: string;
  original: string;
  optimized: string;
  reason: string;
  riskNote?: string;
}

export type OptimizationStyle = 'default' | 'concise' | 'less-exaggerated' | 'ai-product' | 'tob-saas';

// ============ Final Resume ============
export interface ResumeSection {
  title: string;
  content: string;
}

export interface FinalResume {
  sections: ResumeSection[];
  raw: string;
}

// ============ Interview Prep ============
export interface InterviewQuestion {
  question: string;
  detail: string;
}

export interface InterviewPrep {
  possibleQuestions: InterviewQuestion[];
  evidenceToPrepare: string[];
  exaggerationRisks: string[];
  dataToSupplement: string[];
  selfIntroduction: string;
}

// ============ Step Status ============
export type StepStatus = 'locked' | 'available' | 'loading' | 'completed';
export type AnalysisStatus = 'idle' | 'loading' | 'done';

export interface StepInfo {
  id: number;
  key: string;
  label: string;
}

export const STEPS: StepInfo[] = [
  { id: 1, key: 'input', label: '输入材料' },
  { id: 2, key: 'jd-parser', label: 'JD 解析' },
  { id: 3, key: 'diagnosis', label: '简历诊断' },
  { id: 4, key: 'matching', label: '匹配分析' },
  { id: 5, key: 'experience', label: '经历追问' },
  { id: 6, key: 'optimization', label: '简历优化' },
  { id: 7, key: 'final-resume', label: '最终简历' },
  { id: 8, key: 'interview', label: '面试准备' },
];

// ============ App State ============
export interface AppState {
  currentStep: number;
  userInput: UserInput;
  analysisStatus: Record<number, AnalysisStatus>;
  jdAnalysis: JDAnalysis | null;
  diagnosis: ResumeDiagnosis | null;
  matchingRows: MatchingRow[];
  followUpQuestions: FollowUpQuestion[];
  followUpRound: number;
  optimizationItems: OptimizationItem[];
  optimizationStyle: OptimizationStyle;
  finalResume: FinalResume | null;
  interviewPrep: InterviewPrep | null;
  isAnalyzing: boolean;
}

// ============ API Settings ============
export interface ApiSettings {
  baseUrl: string;
  apiKey: string;
  model: string;
}

// ============ File Upload ============
export type FileType = 'pdf' | 'docx' | 'md' | 'image' | 'text';

export interface UploadedFile {
  id: string;
  name: string;
  type: FileType;
  content: string;
  size: number;
  isImage: boolean;
}

// ============ Resume Library ============
export interface EducationEntry {
  id: string;
  school: string;
  major: string;
  degree: string;
  startDate: string;
  endDate: string;
  description: string;
  status: 'draft' | 'approved';
}

export interface WorkExperienceEntry {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  status: 'draft' | 'approved';
}

export interface ProjectEntry {
  id: string;
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  status: 'draft' | 'approved';
}

export interface CoreSkillEntry {
  id: string;
  category: string;
  skills: string;
  status: 'draft' | 'approved';
}

export interface BasicInfoEntry {
  name: string;
  phone: string;
  email: string;
  city: string;
  jobIntent: string;
  website: string;
  summary: string;
}

export interface PersonalStrengthEntry {
  id: string;
  content: string;
  status: 'draft' | 'approved';
}

export interface ResumeLibrary {
  basicInfo: BasicInfoEntry | null;
  education: EducationEntry[];
  workExperience: WorkExperienceEntry[];
  projects: ProjectEntry[];
  coreSkills: CoreSkillEntry[];
  personalStrengths: PersonalStrengthEntry[];
}

// ============ Analysis History ============
export interface AnalysisHistoryEntry {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  completed: boolean;
  currentStep: number;
  userInput: UserInput;
  analysisStatus: Record<number, AnalysisStatus>;
  jdAnalysis: JDAnalysis | null;
  diagnosis: ResumeDiagnosis | null;
  matchingRows: MatchingRow[];
  followUpQuestions: FollowUpQuestion[];
  optimizationItems: OptimizationItem[];
  finalResume: FinalResume | null;
  interviewPrep: InterviewPrep | null;
}

// ============ Mock Interview ============
export interface InterviewMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  tip?: string;
  score?: number;
  round: number;
}

export interface RoundScore {
  round: number;
  score: number;
  comment: string;
}

export interface InterviewReport {
  overallScore: number;
  roundScores: RoundScore[];
  strengths: string[];
  improvements: string[];
  summary: string;
}

export interface InterviewSession {
  id: string;
  mode: 'real' | 'learning';
  interviewerPersona: string;
  messages: InterviewMessage[];
  completed: boolean;
  report?: InterviewReport;
  createdAt: number;
}
