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
  atsScore?: number;
  atsIssues?: string[];
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
  /** AI 生成的原始优化文本（用户手动编辑后用于"恢复 AI 原文"） */
  aiOptimized?: string;
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

// ============ Cover Letter & Bilingual Resume ============
/** AI 生成的求职信 */
export interface CoverLetter {
  /** 求职信正文（分段，\n 分隔） */
  body: string;
  /** 主题行 */
  subject?: string;
  /** 生成时间 */
  createdAt: number;
}

/** AI 生成的双语简历（中英对照） */
export interface BilingualResume {
  /** 英文简历文本（与 finalResume sections 对应的英文版） */
  english: string;
  /** 中文原文 */
  chinese: string;
  /** 生成时间 */
  createdAt: number;
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
  /** 面试官形象（AI 根据 JD/简历生成的模拟面试官设定） */
  interviewerPersona?: string;
}

// ============ Step Status ============
export type StepStatus = 'locked' | 'available' | 'loading' | 'completed';
export type AnalysisStatus = 'idle' | 'loading' | 'done' | 'error';

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
/** AI 调用模式：byok 自备 Key 直连 / points 云端积分代理 */
export type AiMode = 'byok' | 'points';

export interface ApiSettings {
  baseUrl: string;
  apiKey: string;
  model: string;
  aiMode: AiMode;
}

// ============ Auth / 托管模式 ============
export type PlanId = 'free' | 'pro' | 'power';

export interface AuthUser {
  id: string;
  email: string;
  plan: PlanId;
  /** 服务端返回的角色（'admin' 可进入提示词维护等管理入口）；旧数据可能没有该字段 */
  role?: string;
}

export interface QuotaInfo {
  used: number;
  limit: number;
  plan: PlanId;
}

export interface AuthState {
  token: string;
  user: AuthUser | null;
  quota: QuotaInfo | null;
}

/** 后端 /v1/plans 返回的套餐信息（积分制） */
export interface PlanInfo {
  id: PlanId;
  name: string;
  price_cny: number;
  point_limit: number;
}

/** 埋点事件 props（仅数字/枚举字符串，禁 PII） */
export type TrackProps = Record<string, number | string>;

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
  /** 工作职责与成就，自由文本，直接填入描述框（与项目经历一致，不再拆分为逐条列表） */
  description: string;
  /** 旧数据遗留字段：历史版本以逐条列表存储，迁后仅在迁移读取时使用 */
  responsibilities?: string[];
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

/** 自定义模块的条目（部分岗位要求额外模块，如证书、获奖、语言能力等） */
export interface CustomModuleEntry {
  id: string;
  /** 条目标题 */
  title: string;
  /** 附加信息（机构/时间/等级 等） */
  detail: string;
  /** 自由描述 */
  description: string;
  status: 'draft' | 'approved';
}

/** 用户自定义简历模块（名称 + 若干条目） */
export interface CustomModule {
  id: string;
  /** 模块名，如：证书荣誉 / 语言能力 */
  title: string;
  entries: CustomModuleEntry[];
}

export interface ResumeLibrary {
  basicInfo: BasicInfoEntry | null;
  education: EducationEntry[];
  workExperience: WorkExperienceEntry[];
  projects: ProjectEntry[];
  coreSkills: CoreSkillEntry[];
  personalStrengths: PersonalStrengthEntry[];
  /** 用户新增的自定义模块（部分岗位要求额外模块） */
  customModules: CustomModule[];
}

// ============ Resume Builder (简历制作) ============
export type BuilderSectionKey = 'education' | 'workExperience' | 'projects' | 'coreSkills' | 'personalStrengths' | 'custom';

/** 内置排版模板 */
export type BuilderTemplate = 'classic' | 'sidebar' | 'header' | 'minimal';
/** 主题色 */
export type AccentColor = 'slate' | 'blue' | 'green' | 'red' | 'violet';

export interface ResumeBuilderDraft {
  id: string;
  /** 简历名称（列表展示用） */
  name: string;
  updatedAt: number;
  basicInfo: BasicInfoEntry;
  /** 各 section 的排版顺序（上移/下移调整） */
  sectionOrder: BuilderSectionKey[];
  /** 是否在简历中显示该 section */
  visibleSections: Record<BuilderSectionKey, boolean>;
  /** 内置排版模板 */
  template: BuilderTemplate;
  /** 主题色 */
  accentColor: AccentColor;
  fontSize: 'small' | 'medium' | 'large';
  education: EducationEntry[];
  workExperience: WorkExperienceEntry[];
  projects: ProjectEntry[];
  coreSkills: CoreSkillEntry[];
  personalStrengths: PersonalStrengthEntry[];
  /** 用户自定义模块（部分岗位要求额外模块），个别条目独立排版 */
  customSections: CustomModule[];
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
  /** 本轮（assistant 消息）调用的 token / 积分消耗；BYOK 时 costPoints=0 */
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    costPoints: number;
    isByok: boolean;
  };
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

// ============ Real Interview Review (面试复盘) ============
/** 语音转文字模式 */
export type AsrMode = 'server' | 'browser' | 'text' | 'aws';

/** 真实面试复盘状态：录音 → 转写 → 分析 */
export type RealInterviewStage = 'draft' | 'transcribing' | 'transcribed' | 'analyzing' | 'done' | 'error';

/** 一次真实面试记录（复盘对象） */
export interface RealInterview {
  id: string;
  /** 面试企业 */
  company: string;
  /** 面试岗位 */
  position: string;
  /** 面试时间（ISO） */
  interviewTime: string;
  /** 面试形式：电话/视频/现场/笔试等 */
  format?: string;
  /** 面试轮次：一面/二面/HR面/终面等 */
  round?: string;
  /** 面试官数量/角色描述 */
  interviewers?: string;
  /** 备注（面试结果、心态等） */
  note?: string;
  /** 录音文件名（用户上传的音频） */
  audioFileName?: string;
  /** 转写文本（ASR 结果或用户粘贴） */
  transcript: string;
  /** 转写使用的模式 */
  asrMode?: AsrMode;
  /** 转写/分析进度状态 */
  stage: RealInterviewStage;
  /** AI 复盘分析结果 */
  analysis?: InterviewReviewReport;
  /** 关联的本机 AI 面试 session id */
  linkedSessionId?: string;
  /** 关联的简历库快照（选择本地简历时深拷贝） */
  linkedResume?: ResumeLibrary;
  /** 关联的本地 AI 简历分析 id（analysisHistory 条目） */
  linkedAnalysisId?: string;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
}

/** 真实面试复盘分析报告 */
export interface InterviewReviewReport {
  /** 总体评分（0-100） */
  overallScore: number;
  /** 面试对话逐题拆解 */
  qaBreakdown: InterviewReviewQA[];
  /** 表现好的地方 */
  strengths: string[];
  /** 待改进的地方 */
  improvements: string[];
  /** 简历/回答与岗位匹配度点评 */
  matchAnalysis: string;
  /** 下一次面试行动建议 */
  nextSteps: string[];
  /** 总结 */
  summary: string;
}

/** 复盘中的一轮问答 */
export interface InterviewReviewQA {
  /** 面试官问题 */
  question: string;
  /** 候选人回答摘要 */
  answer: string;
  /** 该回答评分（0-100） */
  score: number;
  /** 点评 */
  comment: string;
  /** 更好的回答建议（STAR/量化等） */
  betterAnswer?: string;
}

// ============ Job Applications (E2) ============
export type ApplicationStatus = 'draft' | 'applied' | 'written_test' | 'interview' | 'offer' | 'rejected' | 'withdrawn';

export type ApplicationEventType = 'note' | 'written_test' | 'interview' | 'offer' | 'rejected';

export interface ApplicationEvent {
  id: string;
  type: ApplicationEventType;
  title: string;
  detail?: string;
  /** 安排日期 YYYY-MM-DD，可选 */
  date?: string;
  createdAt: number;
}

export interface JobApplication {
  id: string;
  company: string;
  position: string;
  status: ApplicationStatus;
  /** 投递渠道，如 Boss直聘 / 官网 / 内推 */
  source?: string;
  /** JD 链接 */
  url?: string;
  note?: string;
  /** 与本次分析匹配度的直觉分（0-100，手填，可选） */
  matchScore?: number;
  appliedAt?: number;
  createdAt: number;
  updatedAt: number;
  events: ApplicationEvent[];
}
