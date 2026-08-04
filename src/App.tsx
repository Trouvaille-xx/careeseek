import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { MainLayout } from '@/components/layout/MainLayout';
import { InputPage } from '@/features/input/InputPage';
import { JDParserPage } from '@/features/jd-parser/JDParserPage';
import { DiagnosisPage } from '@/features/diagnosis/DiagnosisPage';
import { MatchingPage } from '@/features/matching/MatchingPage';
import { ExperiencePage } from '@/features/experience/ExperiencePage';
import { OptimizationPage } from '@/features/optimization/OptimizationPage';
import { FinalResumePage } from '@/features/final-resume/FinalResumePage';
import { InterviewPage } from '@/features/interview/InterviewPage';
import { AnalysisHomePage } from '@/features/input/AnalysisHomePage';
import { LandingPage } from '@/features/landing/LandingPage';
import { AuthPage } from '@/features/auth/AuthPage';
import { ResumeLibraryPage } from '@/features/resume-library/ResumeLibraryPage';
import { MockInterviewPage } from '@/features/interview/MockInterviewPage';
import { ApplicationsPage } from '@/features/applications/ApplicationsPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { SyncResumeDialog } from '@/features/resume-library/SyncResumeDialog';
import { UpgradeDialog } from '@/components/ui/PlansDialog';
import { analysisService } from '@/services/analysisService';
import { initTracker, track } from '@/services/tracker';
import { loadOverridesFromCache, loadPromptOverrides } from '@/services/promptOverrides';
import { Button } from '@/components/ui/Button';
import { applyTheme, watchSystemTheme } from '@/utils/theme';

function App() {
  const {
    currentStep,
    analysisStatus,
    userInput,
    jdAnalysis,
    diagnosis,
    matchingRows,
    followUpQuestions,
    optimizationItems,
    optimizationStyle,
    finalResume,
    setCurrentStep,
    setAnalysisStatus,
    setIsAnalyzing,
    startAnalysis,
    setJdAnalysis,
    setDiagnosis,
    setMatchingRows,
    setFollowUpQuestions,
    setOptimizationItems,
    setFinalResume,
    setInterviewPrep,
    setJdStreamText,
    resumeAnalysisId,
    setResumeAnalysisId,
    themeMode,
    quotaError,
    setQuotaError,
    auth,
    analysisHistory,
    landingSeen,
    setLandingSeen,
  } = useAppStore();

  useEffect(() => {
    applyTheme(themeMode);
    if (themeMode === 'system') {
      return watchSystemTheme((dark) =>
        document.documentElement.classList.toggle('dark', dark)
      );
    }
  }, [themeMode]);

  // 启动：恢复埋点缓冲、刷新登录态、拉取套餐、加载提示词覆盖
  useEffect(() => {
    initTracker();
    loadOverridesFromCache();
    const store = useAppStore.getState();
    if (store.auth.token) {
      void store.refreshAuth();
      void loadPromptOverrides();
    } else {
      track('app_open', { is_first: 'yes' });
    }
    void store.fetchPlans();
  }, [auth.token]);

  const processingRef = useRef<Set<number>>(new Set());
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const syncPromptedRef = useRef(false);
  const prevStepRef = useRef(currentStep);

  // Auto-save to history when navigating away from analysis flow
  useEffect(() => {
    const prev = prevStepRef.current;
    prevStepRef.current = currentStep;
    const wasInAnalysis = prev >= 1 && prev <= 8;
    const nowOutside = currentStep < 1 || currentStep > 8;
    if (wasInAnalysis && (nowOutside || currentStep === 0)) {
      const store = useAppStore.getState();
      if (store.userInput.jdContent || store.userInput.resumeContent) {
        store.saveAnalysisToHistory();
      }
    }
    // Reset sync prompt when going back to step 1 or starting new
    if (currentStep <= 1) {
      syncPromptedRef.current = false;
    }
  }, [currentStep]);

  // Auto-chain analysis: 2 → 3 → 4 → 5 (no auto-navigation)
  useEffect(() => {
    if (analysisStatus[2] !== 'loading') return;
    if (processingRef.current.has(2)) return;
    processingRef.current.add(2);

    setJdStreamText('');
    const t0 = Date.now();
    analysisService.analyzeJDStream(userInput, (delta) => {
      setJdStreamText((prev) => prev + delta);
    }).then((result) => {
      setJdAnalysis(result);
      setAnalysisStatus(2, 'done');
      track('analysis_step_completed', { step: 2, duration_ms: Date.now() - t0 });
      processingRef.current.delete(2);
    }).catch((e) => {
      console.error('分析失败:', e);
      setAnalysisStatus(2, 'error');
      track('analysis_step_failed', { step: 2, duration_ms: Date.now() - t0 });
      processingRef.current.delete(2);
    });
  }, [analysisStatus[2], userInput, setJdAnalysis, setAnalysisStatus, setJdStreamText]);

  useEffect(() => {
    if (analysisStatus[2] === 'done' && analysisStatus[3] === 'idle' && jdAnalysis !== null) {
      setAnalysisStatus(3, 'loading');
    }
  }, [analysisStatus[2], analysisStatus[3], jdAnalysis, setAnalysisStatus]);

  useEffect(() => {
    if (analysisStatus[3] !== 'loading') return;
    if (processingRef.current.has(3)) return;
    if (jdAnalysis === null) return;
    processingRef.current.add(3);

    const t0 = Date.now();
    analysisService.diagnoseResume(userInput, jdAnalysis).then((result) => {
      setDiagnosis(result);
      setAnalysisStatus(3, 'done');
      track('analysis_step_completed', { step: 3, duration_ms: Date.now() - t0 });
      processingRef.current.delete(3);
    }).catch((e) => {
      console.error('诊断失败:', e);
      setAnalysisStatus(3, 'error');
      track('analysis_step_failed', { step: 3, duration_ms: Date.now() - t0 });
      processingRef.current.delete(3);
    });
  }, [analysisStatus[3], userInput, jdAnalysis, setDiagnosis, setAnalysisStatus]);

  useEffect(() => {
    if (analysisStatus[3] === 'done' && analysisStatus[4] === 'idle' && diagnosis !== null) {
      setAnalysisStatus(4, 'loading');
    }
  }, [analysisStatus[3], analysisStatus[4], diagnosis, setAnalysisStatus]);

  useEffect(() => {
    if (analysisStatus[4] !== 'loading') return;
    if (processingRef.current.has(4)) return;
    if (jdAnalysis === null || diagnosis === null) return;
    processingRef.current.add(4);

    const t0 = Date.now();
    analysisService.analyzeMatching(userInput, jdAnalysis, diagnosis).then((result) => {
      setMatchingRows(result);
      setAnalysisStatus(4, 'done');
      track('analysis_step_completed', { step: 4, duration_ms: Date.now() - t0 });
      processingRef.current.delete(4);
    }).catch((e) => {
      console.error('匹配分析失败:', e);
      setAnalysisStatus(4, 'error');
      track('analysis_step_failed', { step: 4, duration_ms: Date.now() - t0 });
      processingRef.current.delete(4);
    });
  }, [analysisStatus[4], userInput, jdAnalysis, diagnosis, setMatchingRows, setAnalysisStatus]);

  useEffect(() => {
    if (analysisStatus[4] === 'done' && analysisStatus[5] === 'idle' && jdAnalysis !== null && diagnosis !== null) {
      setAnalysisStatus(5, 'loading');
    }
  }, [analysisStatus[4], analysisStatus[5], jdAnalysis, diagnosis, setAnalysisStatus]);

  useEffect(() => {
    if (analysisStatus[5] !== 'loading') return;
    if (processingRef.current.has(5)) return;
    if (jdAnalysis === null || diagnosis === null) return;
    processingRef.current.add(5);

    const t0 = Date.now();
    analysisService.generateQuestions(userInput, jdAnalysis, diagnosis, matchingRows).then((result) => {
      setFollowUpQuestions(result);
      setAnalysisStatus(5, 'done');
      track('analysis_step_completed', { step: 5, duration_ms: Date.now() - t0 });
      processingRef.current.delete(5);
    }).catch((e) => {
      console.error('生成追问失败:', e);
      setAnalysisStatus(5, 'error');
      track('analysis_step_failed', { step: 5, duration_ms: Date.now() - t0 });
      processingRef.current.delete(5);
    });
  }, [analysisStatus[5], userInput, jdAnalysis, diagnosis, matchingRows, setFollowUpQuestions, setAnalysisStatus]);

  useEffect(() => {
    if (analysisStatus[5] === 'done') {
      setIsAnalyzing(false);
    }
  }, [analysisStatus[5], setIsAnalyzing]);

  // On-demand loading for steps 6, 7, 8
  useEffect(() => {
    if (currentStep === 6 && analysisStatus[6] === 'idle') {
      setAnalysisStatus(6, 'loading');
    }
  }, [currentStep, analysisStatus[6], setAnalysisStatus]);

  useEffect(() => {
    if (analysisStatus[6] !== 'loading') return;
    if (processingRef.current.has(6)) return;
    processingRef.current.add(6);

    const t0 = Date.now();
    analysisService.optimizeResume(userInput, jdAnalysis!, diagnosis!, matchingRows, followUpQuestions, optimizationStyle).then((result) => {
      setOptimizationItems(result);
      setAnalysisStatus(6, 'done');
      track('analysis_step_completed', { step: 6, duration_ms: Date.now() - t0 });
      processingRef.current.delete(6);
    }).catch((e) => {
      console.error('优化失败:', e);
      setAnalysisStatus(6, 'error');
      track('analysis_step_failed', { step: 6, duration_ms: Date.now() - t0 });
      processingRef.current.delete(6);
    });
  }, [analysisStatus[6], userInput, jdAnalysis, diagnosis, matchingRows, followUpQuestions, optimizationStyle, setOptimizationItems, setAnalysisStatus]);

  useEffect(() => {
    if (currentStep === 7 && analysisStatus[7] === 'idle') {
      setAnalysisStatus(7, 'loading');
    }
  }, [currentStep, analysisStatus[7], setAnalysisStatus]);

  useEffect(() => {
    if (analysisStatus[7] !== 'loading') return;
    if (processingRef.current.has(7)) return;
    processingRef.current.add(7);

    const t0 = Date.now();
    analysisService.generateFinalResume(userInput, optimizationItems).then((result) => {
      setFinalResume(result);
      setAnalysisStatus(7, 'done');
      track('analysis_step_completed', { step: 7, duration_ms: Date.now() - t0 });
      processingRef.current.delete(7);
    }).catch((e) => {
      console.error('生成最终简历失败:', e);
      setAnalysisStatus(7, 'error');
      track('analysis_step_failed', { step: 7, duration_ms: Date.now() - t0 });
      processingRef.current.delete(7);
    });
  }, [analysisStatus[7], userInput, optimizationItems, setFinalResume, setAnalysisStatus]);

  useEffect(() => {
    if (currentStep === 8 && analysisStatus[8] === 'idle') {
      setAnalysisStatus(8, 'loading');
    }
  }, [currentStep, analysisStatus[8], setAnalysisStatus]);

  useEffect(() => {
    if (analysisStatus[8] !== 'loading') return;
    if (processingRef.current.has(8)) return;
    if (jdAnalysis === null || diagnosis === null) return;
    processingRef.current.add(8);

    const t0 = Date.now();
    analysisService.generateInterviewPrep(userInput, jdAnalysis, diagnosis).then((result) => {
      setInterviewPrep(result);
      setAnalysisStatus(8, 'done');
      track('analysis_step_completed', { step: 8, duration_ms: Date.now() - t0 });
      track('analysis_completed', { total_duration_ms: 0 });
      processingRef.current.delete(8);
    }).catch((e) => {
      console.error('生成面试准备失败:', e);
      setAnalysisStatus(8, 'error');
      track('analysis_step_failed', { step: 8, duration_ms: Date.now() - t0 });
      processingRef.current.delete(8);
    });
  }, [analysisStatus[8], userInput, jdAnalysis, diagnosis, setInterviewPrep, setAnalysisStatus]);

  // Show sync dialog when entering step 8 (once per session)
  useEffect(() => {
    if (currentStep === 8 && analysisStatus[8] === 'done' && !syncPromptedRef.current) {
      syncPromptedRef.current = true;
      setShowSyncDialog(true);
    }
  }, [currentStep, analysisStatus[8]]);

  // Restore analysis from history
  useEffect(() => {
    if (!resumeAnalysisId) return;
    const state = useAppStore.getState();
    const entry = state.analysisHistory.find((h) => h.id === resumeAnalysisId);
    if (!entry) { setResumeAnalysisId(null); return; }
    // Save current, restore, and navigate
    useAppStore.setState({
      userInput: entry.userInput,
      analysisStatus: entry.analysisStatus,
      jdAnalysis: entry.jdAnalysis,
      diagnosis: entry.diagnosis,
      matchingRows: entry.matchingRows,
      followUpQuestions: entry.followUpQuestions,
      optimizationItems: entry.optimizationItems,
      finalResume: entry.finalResume,
      interviewPrep: entry.interviewPrep,
      currentStep: entry.currentStep >= 1 && entry.currentStep <= 8 ? entry.currentStep : 1,
    });
    setResumeAnalysisId(null);
  }, [resumeAnalysisId, setResumeAnalysisId]);

  // Per-step required conditions
  const stepReady: Record<number, boolean> = {
    1: userInput.jdContent.trim().length > 0 && userInput.resumeContent.trim().length > 0,
    2: jdAnalysis !== null && analysisStatus[2] === 'done',
    3: diagnosis !== null && analysisStatus[3] === 'done',
    4: matchingRows.length > 0 && analysisStatus[4] === 'done',
    5: followUpQuestions.some((q) => q.optimizedBullet.length > 0 || q.userAnswer.trim().length > 0) && analysisStatus[5] === 'done',
    6: optimizationItems.length > 0 && analysisStatus[6] === 'done',
    7: finalResume !== null && analysisStatus[7] === 'done',
    8: false,
  };

  const goNext = () => {
    if (currentStep === 1) {
      // 输入页的“下一步”直接启动 AI 分析（startAnalysis 会切到步骤 2）
      startAnalysis();
    } else if (currentStep < 8 && stepReady[currentStep]) {
      setCurrentStep(currentStep + 1);
    }
  };

  const renderPage = () => {
    switch (currentStep) {
      case -5: return <AuthPage />;
      case -4: return <SettingsPage />;
      case -3: return <ApplicationsPage />;
      case -2: return <MockInterviewPage />;
      case -1: return <ResumeLibraryPage />;
      case 0: {
        // 全新访客（未登录/无历史/未进入过）→ 产品落地页；否则 → 分析工作台
        return isNewVisitor ? <LandingPage /> : <AnalysisHomePage />;
      }
      case 1: return <InputPage />;
      case 2: return <JDParserPage />;
      case 3: return <DiagnosisPage />;
      case 4: return <MatchingPage />;
      case 5: return <ExperiencePage />;
      case 6: return <OptimizationPage />;
      case 7: return <FinalResumePage />;
      case 8: return <InterviewPage />;
      default: return <AnalysisHomePage />;
    }
  };

  const isAnalysisStep = currentStep >= 1 && currentStep <= 8;
  const isLastStep = currentStep === 8;
  const ready = stepReady[currentStep];
  const isNewVisitor = auth.user === null && analysisHistory.length === 0 && !landingSeen;
  const isBarePage = currentStep === -5 || (currentStep === 0 && isNewVisitor);

  return (
    <MainLayout bare={isBarePage}>
      {renderPage()}

      {/* Step footer with next button */}
      {isAnalysisStep && !isLastStep && (
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-slate-200 mt-8 dark:bg-neutral-800 dark:border-neutral-700">
          <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {analysisStatus[currentStep] === 'loading' && (
                <span className="flex items-center gap-2 text-xs text-primary-600">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
                  </span>
                  AI 分析中...
                </span>
              )}
              {analysisStatus[currentStep] !== 'loading' && (
                <span className="text-xs text-slate-400 dark:text-neutral-400">
                  {ready
                    ? '已完成，可进入下一步'
                    : currentStep === 1
                    ? '请填写 JD 原文和简历内容'
                    : currentStep === 5
                    ? '请至少完成一个追问的优化表达'
                    : analysisStatus[currentStep] === 'error'
                    ? '当前步骤分析失败，请点击重试'
                    : analysisStatus[currentStep] === 'idle'
                    ? '请先在输入页面提交分析'
                    : '需等待当前步骤完成'}
                </span>
              )}
            </div>
            <Button onClick={goNext} disabled={!ready}>
              下一步
              <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>
      )}

      {/* Step 8: return to home */}
      {isLastStep && analysisStatus[8] === 'done' && (
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-slate-200 mt-8 dark:bg-neutral-800 dark:border-neutral-700">
          <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-end">
            <Button variant="outline" onClick={() => setCurrentStep(0)}>
              返回首页
            </Button>
          </div>
        </div>
      )}

      {/* Sync to resume library dialog */}
      <SyncResumeDialog open={showSyncDialog} onClose={() => setShowSyncDialog(false)} />

      {/* Quota exceeded upgrade dialog */}
      <UpgradeDialog quota={quotaError} onClose={() => setQuotaError(null)} />
    </MainLayout>
  );
}

export default App;
