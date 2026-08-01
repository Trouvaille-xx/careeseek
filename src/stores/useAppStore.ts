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
  testApiConnection: () => Promise<{ success: boolean; message: string }>;
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

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
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
      sidebarExpanded: false,
      uploadedJD: null,
      uploadedResume: null,
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

      setOptimizationStyle: (style) => set({ optimizationStyle: style }),

      setFinalResume: (resume) => set({ finalResume: resume }),

      setInterviewPrep: (prep) => set({ interviewPrep: prep }),

      setIsAnalyzing: (v) => set({ isAnalyzing: v }),

      toggleSidebar: () => set((s) => ({ sidebarExpanded: !s.sidebarExpanded })),
      setSidebarExpanded: (v) => set({ sidebarExpanded: v }),

      setApiSettings: (settings) => set({ apiSettings: settings }),

      testApiConnection: async () => {
        const { apiSettings } = useAppStore.getState();
        try {
          const res = await fetch(`${apiSettings.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiSettings.apiKey}`,
            },
            body: JSON.stringify({
              model: apiSettings.model,
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
          currentStep: s.currentStep,
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
      partialize: (state) => ({
        userInput: state.userInput,
        jdAnalysis: state.jdAnalysis,
        diagnosis: state.diagnosis,
        matchingRows: state.matchingRows,
        followUpQuestions: state.followUpQuestions,
        followUpRound: state.followUpRound,
        optimizationItems: state.optimizationItems,
        optimizationStyle: state.optimizationStyle,
        finalResume: state.finalResume,
        interviewPrep: state.interviewPrep,
        currentStep: state.currentStep,
        analysisStatus: state.analysisStatus,
        isAnalyzing: state.isAnalyzing,
        sidebarExpanded: state.sidebarExpanded,
        apiSettings: state.apiSettings,
        uploadedJD: state.uploadedJD,
        uploadedResume: state.uploadedResume,
        resumeLibrary: state.resumeLibrary,
        interviewSessions: state.interviewSessions,
        analysisHistory: state.analysisHistory,
        applications: state.applications,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<AppStore> | undefined;
        return {
          ...current,
          ...p,
          applications: p?.applications ?? [],
          resumeLibrary: {
            basicInfo: null,
            education: [],
            workExperience: [],
            projects: [],
            coreSkills: [],
            personalStrengths: [],
            ...(p?.resumeLibrary as Partial<ResumeLibrary> | undefined),
          },
        };
      },
    }
  )
);
