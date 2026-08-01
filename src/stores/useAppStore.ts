import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  UserInput,
  JDAnalysis,
  ResumeDiagnosis,
  MatchingRow,
  FollowUpQuestion,
  OptimizationItem,
  OptimizationStyle,
  FinalResume,
  InterviewPrep,
  AnalysisStatus,
  ApiSettings,
  UploadedFile,
  ResumeLibrary,
  EducationEntry,
  WorkExperienceEntry,
  ProjectEntry,
  CoreSkillEntry,
  BasicInfoEntry,
  PersonalStrengthEntry,
  InterviewSession,
  InterviewMessage,
  InterviewReport,
  AnalysisHistoryEntry,
  JobApplication,
  ApplicationEvent,
  ApplicationStatus,
  ResumeBuilderDraft,
  BuilderSectionKey,
  BuilderTemplate,
  AccentColor,
} from '@/types';

interface AppStore {
  // State
  currentStep: number;
  userInput: UserInput;
  analysisStatus: Record<number, AnalysisStatus>;
  isAnalyzing: boolean;
  jdAnalysis: JDAnalysis | null;
  diagnosis: ResumeDiagnosis | null;
  matchingRows: MatchingRow[];
  followUpQuestions: FollowUpQuestion[];
  followUpRound: number;
  optimizationItems: OptimizationItem[];
  optimizationStyle: OptimizationStyle;
  finalResume: FinalResume | null;
  interviewPrep: InterviewPrep | null;
  sidebarExpanded: boolean;
  apiSettings: ApiSettings;
  uploadedJD: UploadedFile | null;
  uploadedResume: UploadedFile | null;
  resumeLibrary: ResumeLibrary;
  interviewSessions: InterviewSession[];
  currentInterviewId: string | null;
  interviewLoading: boolean;
  analysisHistory: AnalysisHistoryEntry[];
  resumeAnalysisId: string | null;
  jdStreamText: string;
  applications: JobApplication[];
  resumeBuilder: ResumeBuilderDraft | null;
  /** 简历制作列表（多份简历草稿） */
  builderDrafts: ResumeBuilderDraft[];
  /** 当前正在编辑的草稿 id（null 表示回到列表页） */
  builderActiveId: string | null;
  /** 简历库页签：管理 / 制作 */
  resumeLibraryTab: 'manage' | 'build';
  currentWorkspace: string;
  workspaceList: string[];
  workspaceData: Record<string, Record<string, unknown>>;
  /** 主题模式：跟随系统 / 浅色 / 深色（全局共享） */
  themeMode: 'system' | 'light' | 'dark';

  // Actions
  setUserInput: (input: Partial<UserInput>) => void;
  setCurrentStep: (step: number) => void;
  startAnalysis: () => void;
  setAnalysisStatus: (step: number, status: AnalysisStatus) => void;
  setJdAnalysis: (data: JDAnalysis) => void;
  setDiagnosis: (data: ResumeDiagnosis) => void;
  setMatchingRows: (rows: MatchingRow[]) => void;
  setFollowUpQuestions: (questions: FollowUpQuestion[]) => void;
  updateFollowUpAnswer: (id: string, answer: string) => void;
  updateFollowUpBullet: (id: string, bullet: string) => void;
  setFollowUpRound: (round: number) => void;
  setOptimizationItems: (items: OptimizationItem[]) => void;
  updateOptimizationItem: (id: string, patch: Partial<OptimizationItem>) => void;
  setOptimizationStyle: (style: OptimizationStyle) => void;
  setFinalResume: (resume: FinalResume) => void;
  setInterviewPrep: (prep: InterviewPrep) => void;
  setIsAnalyzing: (v: boolean) => void;
  reset: () => void;
  toggleSidebar: () => void;
  setSidebarExpanded: (v: boolean) => void;
  setApiSettings: (settings: ApiSettings) => void;
  setUploadedJD: (file: UploadedFile | null) => void;
  setUploadedResume: (file: UploadedFile | null) => void;
  extractFileContent: (file: File) => Promise<{ text: string; isImage: boolean }>;
  setResumeLibrary: (lib: ResumeLibrary) => void;
  addEducation: (entry: EducationEntry) => void;
  updateEducation: (id: string, entry: EducationEntry) => void;
  deleteEducation: (id: string) => void;
  addWorkExperience: (entry: WorkExperienceEntry) => void;
  updateWorkExperience: (id: string, entry: WorkExperienceEntry) => void;
  deleteWorkExperience: (id: string) => void;
  addProject: (entry: ProjectEntry) => void;
  updateProject: (id: string, entry: ProjectEntry) => void;
  deleteProject: (id: string) => void;
  addCoreSkill: (entry: CoreSkillEntry) => void;
  updateCoreSkill: (id: string, entry: CoreSkillEntry) => void;
  deleteCoreSkill: (id: string) => void;
  setBasicInfo: (info: BasicInfoEntry) => void;
  addPersonalStrength: (entry: PersonalStrengthEntry) => void;
  updatePersonalStrength: (id: string, entry: PersonalStrengthEntry) => void;
  deletePersonalStrength: (id: string) => void;
  startInterview: (mode: 'real' | 'learning') => void;
  addInterviewMessage: (msg: InterviewMessage) => void;
  updateLastAssistantMessage: (updates: Partial<InterviewMessage>) => void;
  completeInterview: (report: InterviewReport) => void;
  setInterviewLoading: (v: boolean) => void;
  resetCurrentInterview: () => void;
  saveAnalysisToHistory: () => void;
  loadAnalysisFromHistory: (id: string) => void;
  deleteAnalysisHistory: (id: string) => void;
  setResumeAnalysisId: (id: string | null) => void;
  setJdStreamText: (text: string | ((prev: string) => string)) => void;
  newAnalysis: () => void;
  addApplication: (app: JobApplication) => void;
  updateApplication: (id: string, patch: Partial<JobApplication>) => void;
  updateApplicationStatus: (id: string, status: ApplicationStatus) => void;
  addApplicationEvent: (id: string, event: ApplicationEvent) => void;
  deleteApplication: (id: string) => void;
  initResumeBuilder: () => void;
  setResumeBuilder: (draft: ResumeBuilderDraft) => void;
  /** 从简历库克隆生成一份新草稿并打开编辑 */
  createBuilderDraft: () => void;
  /** 打开指定草稿继续编辑 */
  loadBuilderDraft: (id: string) => void;
  /** 返回简历列表（关闭当前编辑） */
  exitBuilder: () => void;
  deleteBuilderDraft: (id: string) => void;
  duplicateBuilderDraft: (id: string) => void;
  renameBuilderDraft: (id: string, name: string) => void;
  /** 导入一份外部构造的草稿（AI 分析结果同步） */
  importBuilderDraft: (draft: ResumeBuilderDraft) => void;
  setResumeLibraryTab: (tab: 'manage' | 'build') => void;
  updateBuilderBasicInfo: (info: Partial<BasicInfoEntry>) => void;
  updateBuilderEntry: (section: BuilderSectionKey, id: string, entry: EducationEntry | WorkExperienceEntry | ProjectEntry | CoreSkillEntry | PersonalStrengthEntry) => void;
  addBuilderEntry: (section: BuilderSectionKey, entry: EducationEntry | WorkExperienceEntry | ProjectEntry | CoreSkillEntry | PersonalStrengthEntry) => void;
  deleteBuilderEntry: (section: BuilderSectionKey, id: string) => void;
  moveBuilderSection: (from: number, to: number) => void;
  toggleBuilderSection: (key: BuilderSectionKey) => void;
  setBuilderTemplate: (template: BuilderTemplate) => void;
  setBuilderAccentColor: (color: AccentColor) => void;
  setBuilderFontSize: (size: 'small' | 'medium' | 'large') => void;
  resetResumeBuilder: () => void;
  switchWorkspace: (name: string) => void;
  createWorkspace: (name: string) => void;
  deleteWorkspace: (name: string) => void;
  setThemeMode: (mode: 'system' | 'light' | 'dark') => void;
  testApiConnection: (settings?: ApiSettings) => Promise<{ success: boolean; message: string }>;
}

const defaultInput: UserInput = {
  targetRole: '',
  industry: '',
  companyType: '',
  careerStage: '',
  highlightSkills: '',
  jdContent: '',
  resumeContent: '',
  supplementInfo: '',
};

const defaultAnalysisStatus: Record<number, AnalysisStatus> = {
  1: 'done',
  2: 'idle',
  3: 'idle',
  4: 'idle',
  5: 'idle',
  6: 'idle',
  7: 'idle',
  8: 'idle',
};

// ============ Workspace 分区 ============
/** 按工作区隔离的业务字段（全局字段：apiSettings/sidebarExpanded 不分） */
const BUSINESS_KEYS = [
  'userInput',
  'jdAnalysis',
  'diagnosis',
  'matchingRows',
  'followUpQuestions',
  'followUpRound',
  'optimizationItems',
  'optimizationStyle',
  'finalResume',
  'interviewPrep',
  'currentStep',
  'analysisStatus',
  'isAnalyzing',
  'uploadedJD',
  'uploadedResume',
  'resumeLibrary',
  'interviewSessions',
  'analysisHistory',
  'applications',
  'resumeBuilder',
  'builderDrafts',
  'builderActiveId',
  'resumeLibraryTab',
] as const;

const defaultResumeLibrary = (): ResumeLibrary => ({
  basicInfo: null,
  education: [],
  workExperience: [],
  projects: [],
  coreSkills: [],
  personalStrengths: [],
});

/** 旧版 builder 草稿（templateColor）迁移为模板 + 主题色，并补 id/name/updatedAt */
function normalizeBuilderDraft(d: Partial<ResumeBuilderDraft> | undefined | null): ResumeBuilderDraft | null {
  if (!d) return null;
  const tc = (d as unknown as { templateColor?: 'black' | 'blue' }).templateColor;
  const draft: ResumeBuilderDraft = {
    id: d.id ?? `draft-${Math.random().toString(36).slice(2, 10)}`,
    name: d.name ?? '未命名简历',
    updatedAt: d.updatedAt ?? Date.now(),
    basicInfo: d.basicInfo ?? { name: '', phone: '', email: '', city: '', jobIntent: '', website: '', summary: '' },
    sectionOrder: d.sectionOrder ?? ['education', 'workExperience', 'projects', 'coreSkills', 'personalStrengths'],
    visibleSections: d.visibleSections ?? { education: true, workExperience: true, projects: true, coreSkills: true, personalStrengths: true },
    template: d.template ?? (tc ? 'classic' : 'classic'),
    accentColor: d.accentColor ?? (tc === 'blue' ? 'blue' : 'slate'),
    fontSize: d.fontSize ?? 'medium',
    education: d.education ?? [],
    workExperience: normalizeWorkExperience(d.workExperience),
    projects: d.projects ?? [],
    coreSkills: d.coreSkills ?? [],
    personalStrengths: d.personalStrengths ?? [],
  };
  return draft;
}

/** 刷新/恢复后没有正在运行的请求，残留的 loading 一律清回 idle（避免假 loading 卡死或静默重跑） */
function clearStaleLoading(statuses: Record<number, AnalysisStatus>): Record<number, AnalysisStatus> {
  const out: Record<number, AnalysisStatus> = { ...statuses };
  for (const k of Object.keys(out) as unknown as number[]) {
    if (out[k] === 'loading') out[k] = 'idle';
  }
  return out;
}

/** 旧 WorkExperienceEntry（description 为多行字符串）→ 新结构（responsibilities 数组） */
function normalizeWorkExperience(raw: unknown): WorkExperienceEntry[] {
  return ((raw as unknown[]) ?? [])
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
    .map((item) => {
      const existing = Array.isArray(item.responsibilities)
        ? (item.responsibilities as unknown[]).filter((s): s is string => typeof s === 'string')
        : undefined;
      const fromDesc = typeof item.description === 'string'
        ? item.description.split('\n').map((s) => s.trim()).filter(Boolean)
        : [];
      return {
        id: typeof item.id === 'string' ? item.id : `w-${Math.random().toString(36).slice(2, 8)}`,
        company: typeof item.company === 'string' ? item.company : '',
        position: typeof item.position === 'string' ? item.position : '',
        startDate: typeof item.startDate === 'string' ? item.startDate : '',
        endDate: typeof item.endDate === 'string' ? item.endDate : '',
        responsibilities: existing ?? fromDesc,
        status: item.status === 'draft' ? 'draft' : 'approved',
      };
    });
}

/** 旧数据/LLM 输出字段缺失兜底 */
function normalizeFollowUps(raw: unknown): FollowUpQuestion[] {
  return ((raw as unknown[]) ?? [])
    .filter((q): q is Record<string, unknown> => q !== null && typeof q === 'object')
    .map((q) => ({
      id: typeof q.id === 'string' ? q.id : `q-${Math.random().toString(36).slice(2, 8)}`,
      round: typeof q.round === 'number' ? q.round : 1,
      question: typeof q.question === 'string' ? q.question : '',
      direction: typeof q.direction === 'string' ? q.direction : '',
      userAnswer: typeof q.userAnswer === 'string' ? q.userAnswer : '',
      optimizedBullet: typeof q.optimizedBullet === 'string' ? q.optimizedBullet : '',
      isExpanded: false,
    }));
}

/** 旧数据/LLM 输出字段缺失兜底 */
function normalizeOptimizationItems(raw: unknown): OptimizationItem[] {
  return ((raw as unknown[]) ?? [])
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : `opt-${Math.random().toString(36).slice(2, 8)}`,
      section: typeof item.section === 'string' ? item.section : '',
      original: typeof item.original === 'string' ? item.original : '',
      optimized: typeof item.optimized === 'string' ? item.optimized : '',
      aiOptimized: typeof item.aiOptimized === 'string' ? item.aiOptimized : (typeof item.optimized === 'string' ? item.optimized : ''),
      reason: typeof item.reason === 'string' ? item.reason : '',
      riskNote: typeof item.riskNote === 'string' ? item.riskNote : undefined,
    }));
}

/** 从任意数据源取业务字段，缺失值兜底为默认 */
function sanitizeBusiness(d: Record<string, unknown> | undefined): Record<string, unknown> {
  const src = d ?? {};
  return {
    userInput: src.userInput ?? { ...defaultInput },
    jdAnalysis: src.jdAnalysis ?? null,
    diagnosis: src.diagnosis ?? null,
    matchingRows: src.matchingRows ?? [],
    followUpQuestions: normalizeFollowUps(src.followUpQuestions),
    followUpRound: src.followUpRound ?? 1,
    optimizationItems: normalizeOptimizationItems(src.optimizationItems),
    optimizationStyle: src.optimizationStyle ?? 'default',
    finalResume: src.finalResume ?? null,
    interviewPrep: src.interviewPrep ?? null,
    currentStep: src.currentStep ?? 0,
    analysisStatus: clearStaleLoading({ ...defaultAnalysisStatus, ...((src.analysisStatus as Record<number, AnalysisStatus>) ?? {}) }),
    isAnalyzing: false,
    uploadedJD: src.uploadedJD ?? null,
    uploadedResume: src.uploadedResume ?? null,
    resumeLibrary: { ...defaultResumeLibrary(), ...((src.resumeLibrary as Partial<ResumeLibrary>) ?? {}), workExperience: normalizeWorkExperience((src.resumeLibrary as Record<string, unknown>)?.workExperience) },
    interviewSessions: src.interviewSessions ?? [],
    analysisHistory: src.analysisHistory ?? [],
    applications: src.applications ?? [],
    resumeBuilder: normalizeBuilderDraft(src.resumeBuilder as Partial<ResumeBuilderDraft>),
    builderDrafts: ((src.builderDrafts as unknown[]) ?? [])
      .map((d) => normalizeBuilderDraft(d as Partial<ResumeBuilderDraft>))
      .filter((d): d is ResumeBuilderDraft => d !== null),
    builderActiveId: src.builderActiveId ?? null,
    resumeLibraryTab: src.resumeLibraryTab === 'build' ? 'build' : 'manage',
  };
}

/** 从 store 全量状态中提取业务字段 */
function pickBusiness(s: AppStore): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of BUSINESS_KEYS) out[k] = s[k];
  return out;
}

/** 编辑 builder 草稿并同步写回草稿列表（自动更新 updatedAt / activeId） */
function builderEdit(
  s: AppStore,
  edit: (draft: ResumeBuilderDraft) => ResumeBuilderDraft
): Partial<AppStore> {
  if (!s.resumeBuilder) return {};
  const draft = { ...edit(s.resumeBuilder), updatedAt: Date.now() };
  const exists = s.builderDrafts.some((d) => d.id === draft.id);
  return {
    resumeBuilder: draft,
    builderDrafts: exists
      ? s.builderDrafts.map((d) => (d.id === draft.id ? draft : d))
      : [draft, ...s.builderDrafts],
    builderActiveId: exists ? s.builderActiveId : draft.id,
  };
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      userInput: { ...defaultInput },
      analysisStatus: { ...defaultAnalysisStatus },
      isAnalyzing: false,
      jdAnalysis: null,
      diagnosis: null,
      matchingRows: [],
      followUpQuestions: [],
      followUpRound: 1,
      optimizationItems: [],
      optimizationStyle: 'default',
      finalResume: null,
      interviewPrep: null,
      resumeLibrary: { basicInfo: null, education: [], workExperience: [], projects: [], coreSkills: [], personalStrengths: [] },
      interviewSessions: [],
      currentInterviewId: null,
      interviewLoading: false,
      analysisHistory: [],
      resumeAnalysisId: null,
      jdStreamText: '',
      applications: [],
      resumeBuilder: null,
      builderDrafts: [],
      builderActiveId: null,
      resumeLibraryTab: 'manage',
      currentWorkspace: 'default',
      workspaceList: ['default'],
      workspaceData: {},
      sidebarExpanded: false,
      uploadedJD: null,
      uploadedResume: null,
      themeMode: 'system',
      apiSettings: {
        baseUrl: 'https://api.openai.com/v1',
        apiKey: '',
        model: 'gpt-4o',
      },

      setUserInput: (input) =>
        set((s) => ({ userInput: { ...s.userInput, ...input } })),

      setCurrentStep: (step) => set({ currentStep: step }),

      startAnalysis: () => {
        // Save current session to history first
        const current = useAppStore.getState();
        if (current.userInput.jdContent || current.userInput.resumeContent) {
          current.saveAnalysisToHistory();
        }
        const statuses: Record<number, AnalysisStatus> = { ...defaultAnalysisStatus };
        statuses[2] = 'loading';
        set({
          isAnalyzing: true,
          jdAnalysis: null,
          diagnosis: null,
          matchingRows: [],
          followUpQuestions: [],
          followUpRound: 1,
          optimizationItems: [],
          optimizationStyle: 'default',
          finalResume: null,
          interviewPrep: null,
          analysisStatus: statuses,
          currentStep: 2,
          jdStreamText: '',
        });
      },

      setAnalysisStatus: (step, status) =>
        set((s) => ({
          analysisStatus: { ...s.analysisStatus, [step]: status },
        })),

      setJdAnalysis: (data) => set({ jdAnalysis: data }),
      setDiagnosis: (data) => set({ diagnosis: data }),
      setMatchingRows: (rows) => set({ matchingRows: rows }),

      setFollowUpQuestions: (questions) => set({ followUpQuestions: questions }),

      updateFollowUpAnswer: (id, answer) =>
        set((s) => ({
          followUpQuestions: s.followUpQuestions.map((q) =>
            q.id === id ? { ...q, userAnswer: answer } : q
          ),
        })),

      updateFollowUpBullet: (id, bullet) =>
        set((s) => ({
          followUpQuestions: s.followUpQuestions.map((q) =>
            q.id === id ? { ...q, optimizedBullet: bullet } : q
          ),
        })),

      setFollowUpRound: (round) => set({ followUpRound: round }),

      setOptimizationItems: (items) => set({ optimizationItems: items }),
      updateOptimizationItem: (id, patch) =>
        set((s) => ({
          optimizationItems: s.optimizationItems.map((item) =>
            item.id === id ? { ...item, ...patch } : item
          ),
        })),

      setOptimizationStyle: (style) => set({ optimizationStyle: style }),

      setFinalResume: (resume) => set({ finalResume: resume }),

      setInterviewPrep: (prep) => set({ interviewPrep: prep }),

      setIsAnalyzing: (v) => set({ isAnalyzing: v }),

      toggleSidebar: () => set((s) => ({ sidebarExpanded: !s.sidebarExpanded })),
      setSidebarExpanded: (v) => set({ sidebarExpanded: v }),

      setApiSettings: (settings) => set({ apiSettings: settings }),

      testApiConnection: async (settings?: ApiSettings) => {
        const { apiSettings } = useAppStore.getState();
        const s = settings ?? apiSettings;
        try {
          const res = await fetch(`${s.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${s.apiKey}`,
            },
            body: JSON.stringify({
              model: s.model,
              messages: [{ role: 'user', content: 'Hi' }],
              max_tokens: 5,
            }),
          });
          if (res.ok) return { success: true, message: '连接成功' };
          const err = await res.text();
          return { success: false, message: `错误 ${res.status}: ${err.slice(0, 100)}` };
        } catch (e: any) {
          return { success: false, message: e?.message || '连接失败' };
        }
      },

      setUploadedJD: (file) => set({ uploadedJD: file }),
      setUploadedResume: (file) => set({ uploadedResume: file }),

      extractFileContent: async (file: File) => {
        const name = file.name.toLowerCase();
        if (name.endsWith('.pdf')) {
          return { text: `[PDF 文件: ${file.name}] 文件已上传，AI 将提取其中的文字内容进行分析。`, isImage: false };
        }
        if (name.endsWith('.docx')) {
          return { text: `[Word 文件: ${file.name}] 文件已上传，AI 将提取其中的文字内容进行分析。`, isImage: false };
        }
        if (name.endsWith('.md') || name.endsWith('.txt')) {
          const text = await file.text();
          return { text, isImage: false };
        }
        if (name.endsWith('.json')) {
          const raw = await file.text();
          try {
            const parsed = JSON.parse(raw);
            const text = typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2);
            return { text, isImage: false };
          } catch {
            return { text: raw, isImage: false };
          }
        }
        if (name.match(/\.(png|jpg|jpeg|webp|gif|bmp)$/)) {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          return { text: base64, isImage: true };
        }
        const text = await file.text();
        return { text, isImage: false };
      },

      setResumeLibrary: (lib) => set({ resumeLibrary: lib }),

      addEducation: (entry) => set((s) => ({ resumeLibrary: { ...s.resumeLibrary, education: [...s.resumeLibrary.education, entry] } })),
      updateEducation: (id, entry) => set((s) => ({ resumeLibrary: { ...s.resumeLibrary, education: s.resumeLibrary.education.map((e) => e.id === id ? entry : e) } })),
      deleteEducation: (id) => set((s) => ({ resumeLibrary: { ...s.resumeLibrary, education: s.resumeLibrary.education.filter((e) => e.id !== id) } })),

      addWorkExperience: (entry) => set((s) => ({ resumeLibrary: { ...s.resumeLibrary, workExperience: [...s.resumeLibrary.workExperience, entry] } })),
      updateWorkExperience: (id, entry) => set((s) => ({ resumeLibrary: { ...s.resumeLibrary, workExperience: s.resumeLibrary.workExperience.map((e) => e.id === id ? entry : e) } })),
      deleteWorkExperience: (id) => set((s) => ({ resumeLibrary: { ...s.resumeLibrary, workExperience: s.resumeLibrary.workExperience.filter((e) => e.id !== id) } })),

      addProject: (entry) => set((s) => ({ resumeLibrary: { ...s.resumeLibrary, projects: [...s.resumeLibrary.projects, entry] } })),
      updateProject: (id, entry) => set((s) => ({ resumeLibrary: { ...s.resumeLibrary, projects: s.resumeLibrary.projects.map((e) => e.id === id ? entry : e) } })),
      deleteProject: (id) => set((s) => ({ resumeLibrary: { ...s.resumeLibrary, projects: s.resumeLibrary.projects.filter((e) => e.id !== id) } })),

      addCoreSkill: (entry) => set((s) => ({ resumeLibrary: { ...s.resumeLibrary, coreSkills: [...s.resumeLibrary.coreSkills, entry] } })),
      updateCoreSkill: (id, entry) => set((s) => ({ resumeLibrary: { ...s.resumeLibrary, coreSkills: s.resumeLibrary.coreSkills.map((e) => e.id === id ? entry : e) } })),
      deleteCoreSkill: (id) => set((s) => ({ resumeLibrary: { ...s.resumeLibrary, coreSkills: s.resumeLibrary.coreSkills.filter((e) => e.id !== id) } })),

      setBasicInfo: (info) => set((s) => ({ resumeLibrary: { ...s.resumeLibrary, basicInfo: info } })),

      addPersonalStrength: (entry) => set((s) => ({ resumeLibrary: { ...s.resumeLibrary, personalStrengths: [...s.resumeLibrary.personalStrengths, entry] } })),
      updatePersonalStrength: (id, entry) => set((s) => ({ resumeLibrary: { ...s.resumeLibrary, personalStrengths: s.resumeLibrary.personalStrengths.map((e) => e.id === id ? entry : e) } })),
      deletePersonalStrength: (id) => set((s) => ({ resumeLibrary: { ...s.resumeLibrary, personalStrengths: s.resumeLibrary.personalStrengths.filter((e) => e.id !== id) } })),

      startInterview: (mode) => set((s) => {
        const id = Date.now().toString(36);
        const session: InterviewSession = {
          id, mode, interviewerPersona: '', messages: [], completed: false, createdAt: Date.now(),
        };
        return { interviewSessions: [...s.interviewSessions, session], currentInterviewId: id };
      }),
      addInterviewMessage: (msg) => set((s) => ({
        interviewSessions: s.interviewSessions.map((ses) =>
          ses.id === s.currentInterviewId ? { ...ses, messages: [...ses.messages, msg] } : ses
        ),
      })),
      updateLastAssistantMessage: (updates) => set((s) => ({
        interviewSessions: s.interviewSessions.map((ses) => {
          if (ses.id !== s.currentInterviewId) return ses;
          const msgs = [...ses.messages];
          for (let i = msgs.length - 1; i >= 0; i--) {
            if (msgs[i].role === 'assistant') { msgs[i] = { ...msgs[i], ...updates }; break; }
          }
          return { ...ses, messages: msgs };
        }),
      })),
      completeInterview: (report) => set((s) => ({
        interviewSessions: s.interviewSessions.map((ses) =>
          ses.id === s.currentInterviewId ? { ...ses, completed: true, report } : ses
        ),
      })),
      setInterviewLoading: (v) => set({ interviewLoading: v }),
      resetCurrentInterview: () => set({ currentInterviewId: null }),

      saveAnalysisToHistory: () => set((s) => {
        if (!s.userInput.jdContent && !s.userInput.resumeContent) return {};
        const entry: AnalysisHistoryEntry = {
          id: Date.now().toString(36),
          title: s.userInput.targetRole || '未命名分析',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          completed: s.analysisStatus[8] === 'done' || s.analysisStatus[7] === 'done',
          currentStep: s.currentStep >= 1 && s.currentStep <= 8 ? s.currentStep : 1,
          userInput: s.userInput,
          analysisStatus: s.analysisStatus,
          jdAnalysis: s.jdAnalysis,
          diagnosis: s.diagnosis,
          matchingRows: s.matchingRows,
          followUpQuestions: s.followUpQuestions,
          optimizationItems: s.optimizationItems,
          finalResume: s.finalResume,
          interviewPrep: s.interviewPrep,
        };
        // Replace existing entry with same title+date, or append
        const existingIdx = s.analysisHistory.findIndex(
          (h) => h.title === entry.title && Math.abs(h.createdAt - entry.createdAt) < 60000
        );
        const history = existingIdx >= 0
          ? s.analysisHistory.map((h, i) => i === existingIdx ? entry : h)
          : [...s.analysisHistory, entry];
        const trimmed = history.slice(-20);
        if (trimmed.length < history.length) {
          console.warn('[careeseek] 分析历史已裁剪至最近 20 条（防止 localStorage 超限）');
        }
        return { analysisHistory: trimmed };
      }),

      loadAnalysisFromHistory: (id) => set((s) => {
        const entry = s.analysisHistory.find((h) => h.id === id);
        if (!entry) return {};
        return {
          currentStep: entry.currentStep,
          userInput: entry.userInput,
          analysisStatus: entry.analysisStatus,
          jdAnalysis: entry.jdAnalysis,
          diagnosis: entry.diagnosis,
          matchingRows: entry.matchingRows,
          followUpQuestions: entry.followUpQuestions,
          optimizationItems: entry.optimizationItems,
          finalResume: entry.finalResume,
          interviewPrep: entry.interviewPrep,
        };
      }),

      deleteAnalysisHistory: (id) => set((s) => ({
        analysisHistory: s.analysisHistory.filter((h) => h.id !== id),
      })),

      setResumeAnalysisId: (id) => set({ resumeAnalysisId: id }),

      setJdStreamText: (text) =>
        set((s) => ({
          jdStreamText: typeof text === 'function' ? text(s.jdStreamText) : text,
        })),

      addApplication: (app) =>
        set((s) => ({ applications: [...s.applications, app] })),

      updateApplication: (id, patch) =>
        set((s) => ({
          applications: s.applications.map((a) =>
            a.id === id ? { ...a, ...patch, updatedAt: Date.now() } : a
          ),
        })),

      updateApplicationStatus: (id, status) =>
        set((s) => ({
          applications: s.applications.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status,
                  appliedAt: status === 'applied' && !a.appliedAt ? Date.now() : a.appliedAt,
                  updatedAt: Date.now(),
                }
              : a
          ),
        })),

      addApplicationEvent: (id, event) =>
        set((s) => ({
          applications: s.applications.map((a) =>
            a.id === id
              ? { ...a, events: [...a.events, event], updatedAt: Date.now() }
              : a
          ),
        })),

      deleteApplication: (id) =>
        set((s) => ({ applications: s.applications.filter((a) => a.id !== id) })),

      initResumeBuilder: () => {
        useAppStore.getState().createBuilderDraft();
      },

      /** 从简历库克隆生成一份新草稿并打开编辑 */
      createBuilderDraft: () => {
        const s = useAppStore.getState();
        const lib = s.resumeLibrary;
        const blank: BasicInfoEntry = { name: '', phone: '', email: '', city: '', jobIntent: '', website: '', summary: '' };
        const draft: ResumeBuilderDraft = {
          id: `draft-${Math.random().toString(36).slice(2, 10)}`,
          name: `简历 ${s.builderDrafts.length + 1}`,
          updatedAt: Date.now(),
          basicInfo: lib.basicInfo ? { ...lib.basicInfo } : blank,
          sectionOrder: ['education', 'workExperience', 'projects', 'coreSkills', 'personalStrengths'],
          visibleSections: {
            education: true,
            workExperience: true,
            projects: true,
            coreSkills: true,
            personalStrengths: true,
          },
          template: 'classic',
          accentColor: 'slate',
          fontSize: 'medium',
          education: lib.education.map((e) => ({ ...e })),
          workExperience: lib.workExperience.map((e) => ({ ...e })),
          projects: lib.projects.map((e) => ({ ...e })),
          coreSkills: lib.coreSkills.map((e) => ({ ...e })),
          personalStrengths: lib.personalStrengths.map((e) => ({ ...e })),
        };
        set({
          resumeBuilder: draft,
          builderDrafts: [draft, ...s.builderDrafts],
          builderActiveId: draft.id,
          resumeLibraryTab: 'build',
        });
      },

      setResumeBuilder: (draft) => set((s) => ({
        resumeBuilder: draft,
        builderDrafts: s.builderDrafts.some((d) => d.id === draft.id)
          ? s.builderDrafts.map((d) => (d.id === draft.id ? draft : d))
          : [draft, ...s.builderDrafts],
        builderActiveId: draft.id,
      })),

      loadBuilderDraft: (id) =>
        set((s) => {
          const draft = s.builderDrafts.find((d) => d.id === id);
          if (!draft) return {};
          return { resumeBuilder: { ...draft }, builderActiveId: id };
        }),

      exitBuilder: () => set({ resumeBuilder: null, builderActiveId: null }),

      deleteBuilderDraft: (id) =>
        set((s) => ({
          builderDrafts: s.builderDrafts.filter((d) => d.id !== id),
          builderActiveId: s.builderActiveId === id ? null : s.builderActiveId,
          resumeBuilder: s.builderActiveId === id ? null : s.resumeBuilder,
        })),

      duplicateBuilderDraft: (id) =>
        set((s) => {
          const src = s.builderDrafts.find((d) => d.id === id);
          if (!src) return {};
          const copy: ResumeBuilderDraft = {
            ...src,
            id: `draft-${Math.random().toString(36).slice(2, 10)}`,
            name: `${src.name} 副本`,
            updatedAt: Date.now(),
            basicInfo: { ...src.basicInfo },
            education: src.education.map((e) => ({ ...e })),
            workExperience: src.workExperience.map((e) => ({ ...e })),
            projects: src.projects.map((e) => ({ ...e })),
            coreSkills: src.coreSkills.map((e) => ({ ...e })),
            personalStrengths: src.personalStrengths.map((e) => ({ ...e })),
            sectionOrder: [...src.sectionOrder],
            visibleSections: { ...src.visibleSections },
          };
          return { builderDrafts: [copy, ...s.builderDrafts] };
        }),

      renameBuilderDraft: (id, name) =>
        set((s) => ({
          builderDrafts: s.builderDrafts.map((d) => (d.id === id ? { ...d, name, updatedAt: Date.now() } : d)),
          resumeBuilder: s.resumeBuilder && s.resumeBuilder.id === id ? { ...s.resumeBuilder, name, updatedAt: Date.now() } : s.resumeBuilder,
        })),

      /** 导入一份外部构造的草稿（AI 分析结果同步） */
      importBuilderDraft: (draft) =>
        set((s) => ({
          resumeBuilder: { ...draft },
          builderDrafts: [draft, ...s.builderDrafts],
          builderActiveId: draft.id,
          resumeLibraryTab: 'build',
        })),

      setResumeLibraryTab: (tab) => set({ resumeLibraryTab: tab }),

      updateBuilderBasicInfo: (info) =>
        set((s) => builderEdit(s, (d) => ({ ...d, basicInfo: { ...d.basicInfo, ...info } }))),

      updateBuilderEntry: (section, id, entry) =>
        set((s) => builderEdit(s, (d) => ({ ...d, [section]: d[section].map((e) => (e.id === id ? entry : e)) }))),

      addBuilderEntry: (section, entry) =>
        set((s) => builderEdit(s, (d) => ({ ...d, [section]: [...d[section], entry] }))),

      deleteBuilderEntry: (section, id) =>
        set((s) => builderEdit(s, (d) => ({ ...d, [section]: d[section].filter((e) => e.id !== id) }))),

      moveBuilderSection: (from, to) =>
        set((s) =>
          builderEdit(s, (d) => {
            const order = [...d.sectionOrder];
            if (from < 0 || from >= order.length || to < 0 || to >= order.length || from === to) return d;
            const [item] = order.splice(from, 1);
            order.splice(to, 0, item);
            return { ...d, sectionOrder: order };
          })
        ),

      toggleBuilderSection: (key) =>
        set((s) =>
          builderEdit(s, (d) => ({ ...d, visibleSections: { ...d.visibleSections, [key]: !d.visibleSections[key] } }))
        ),

      setBuilderTemplate: (template) =>
        set((s) => builderEdit(s, (d) => ({ ...d, template }))),

      setBuilderAccentColor: (accentColor) =>
        set((s) => builderEdit(s, (d) => ({ ...d, accentColor }))),

      setBuilderFontSize: (fontSize) =>
        set((s) => builderEdit(s, (d) => ({ ...d, fontSize }))),

      resetResumeBuilder: () =>
        set((s) => {
          if (!s.resumeBuilder) return {};
          const lib = s.resumeLibrary;
          const draft: ResumeBuilderDraft = {
            ...s.resumeBuilder,
            updatedAt: Date.now(),
            basicInfo: lib.basicInfo ? { ...lib.basicInfo } : s.resumeBuilder.basicInfo,
            education: lib.education.map((e) => ({ ...e })),
            workExperience: lib.workExperience.map((e) => ({ ...e })),
            projects: lib.projects.map((e) => ({ ...e })),
            coreSkills: lib.coreSkills.map((e) => ({ ...e })),
            personalStrengths: lib.personalStrengths.map((e) => ({ ...e })),
          };
          return {
            resumeBuilder: draft,
            builderDrafts: s.builderDrafts.map((d) => (d.id === draft.id ? draft : d)),
          };
        }),

      switchWorkspace: (name) => {
        const s = get();
        if (name === s.currentWorkspace || !s.workspaceList.includes(name)) return;
        // 保存当前工作区数据
        set({
          workspaceData: { ...s.workspaceData, [s.currentWorkspace]: pickBusiness(s) },
          ...sanitizeBusiness(s.workspaceData[name]),
          currentWorkspace: name,
          jdStreamText: '',
        });
      },

      setThemeMode: (mode) => set({ themeMode: mode }),

      createWorkspace: (name) => {
        const s = get();
        const trimmed = name.trim();
        if (!trimmed || s.workspaceList.includes(trimmed)) return;
        set({ workspaceList: [...s.workspaceList, trimmed] });
        get().switchWorkspace(trimmed);
      },

      deleteWorkspace: (name) => {
        const s = get();
        if (name === 'default' || !s.workspaceList.includes(name)) return;
        const rest = s.workspaceList.filter((w) => w !== name);
        const data = { ...s.workspaceData };
        delete data[name];
        if (s.currentWorkspace === name) {
          set({
            workspaceList: rest,
            workspaceData: data,
            ...sanitizeBusiness(data.default),
            currentWorkspace: 'default',
            jdStreamText: '',
          });
        } else {
          set({ workspaceList: rest, workspaceData: data });
        }
      },

      newAnalysis: () => {
        const current = useAppStore.getState();
        if (current.userInput.jdContent || current.userInput.resumeContent) {
          current.saveAnalysisToHistory();
        }
        set({
          currentStep: 1,
          userInput: { ...defaultInput },
          analysisStatus: { ...defaultAnalysisStatus },
          isAnalyzing: false,
          jdAnalysis: null,
          diagnosis: null,
          matchingRows: [],
          followUpQuestions: [],
          followUpRound: 1,
          optimizationItems: [],
          optimizationStyle: 'default',
          finalResume: null,
          interviewPrep: null,
          uploadedJD: null,
          uploadedResume: null,
          jdStreamText: '',
        });
      },

      reset: () =>
        set({
          currentStep: 1,
          userInput: { ...defaultInput },
          analysisStatus: { ...defaultAnalysisStatus },
          isAnalyzing: false,
          jdAnalysis: null,
          diagnosis: null,
          matchingRows: [],
          followUpQuestions: [],
          followUpRound: 1,
          optimizationItems: [],
          optimizationStyle: 'default',
          finalResume: null,
          interviewPrep: null,
          jdStreamText: '',
        }),
    }),
    {
      name: 'careeseek-storage',
      version: 2,
      migrate: (persistedState) => persistedState,
      partialize: (state) => ({
        currentWorkspace: state.currentWorkspace,
        workspaceList: state.workspaceList,
        workspaceData: {
          ...state.workspaceData,
          [state.currentWorkspace]: pickBusiness(state),
        },
        apiSettings: state.apiSettings,
        sidebarExpanded: state.sidebarExpanded,
        themeMode: state.themeMode,
      }),
      merge: (persisted, current) => {
        const p = persisted as {
          version?: number;
          currentWorkspace?: string;
          workspaceList?: string[];
          workspaceData?: Record<string, Record<string, unknown>>;
          apiSettings?: ApiSettings;
          sidebarExpanded?: boolean;
          themeMode?: 'system' | 'light' | 'dark';
        } | undefined;
        if (!p) return current;

        // v2: 工作区分区格式
        if (p.version === 2 && p.workspaceData) {
          const name = typeof p.currentWorkspace === 'string' ? p.currentWorkspace : 'default';
          const list = Array.isArray(p.workspaceList) && p.workspaceList.length > 0 ? p.workspaceList : ['default'];
          return {
            ...current,
            ...sanitizeBusiness(p.workspaceData[name]),
            currentWorkspace: list.includes(name) ? name : 'default',
            workspaceList: list,
            workspaceData: p.workspaceData,
            apiSettings: p.apiSettings ?? current.apiSettings,
            sidebarExpanded: p.sidebarExpanded ?? current.sidebarExpanded,
            themeMode: p.themeMode ?? 'system',
          };
        }

        // v1 旧格式：全部归入 default 工作区
        const legacy = p as unknown as Partial<AppStore>;
        return {
          ...current,
          ...sanitizeBusiness(legacy as Record<string, unknown>),
          currentWorkspace: 'default',
          workspaceList: ['default'],
          workspaceData: { default: sanitizeBusiness(legacy as Record<string, unknown>) },
          apiSettings: legacy.apiSettings ?? current.apiSettings,
          sidebarExpanded: legacy.sidebarExpanded ?? current.sidebarExpanded,
          themeMode: legacy.themeMode ?? 'system',
        };
      },
    }
  )
);
