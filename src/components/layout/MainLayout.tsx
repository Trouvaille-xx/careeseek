import React, { useEffect, useState } from 'react';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import { StepProgressBar } from './StepProgressBar';
import { useAppStore } from '@/stores/useAppStore';

interface MainLayoutProps {
  children: React.ReactNode;
  /** 裸模式：无应用壳（TopNav/Sidebar/进度条），用于产品落地页 */
  bare?: boolean;
}

export function MainLayout({ children, bare = false }: MainLayoutProps) {
  const { currentStep, setCurrentStep, reset } = useAppStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // 桶入工具页后关闭移动端抽屉（含当前步骤变化时）
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [currentStep]);

  // 宽度 ≥1024px（桌面）时自动关闭移动端抽屉
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => { if (mq.matches) setMobileSidebarOpen(false); };
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  // Compute step statuses
  const { analysisStatus } = useAppStore();
  const getStepStatus = (step: number): 'locked' | 'available' | 'loading' | 'completed' => {
    if (step === 1) return 'completed';
    if (analysisStatus[step] === 'loading') return 'loading';
    if (analysisStatus[step] === 'done') return 'completed';
    for (let i = step - 1; i >= 2; i--) {
      if (analysisStatus[i] === 'done') return 'available';
    }
    return 'locked';
  };

  const stepStatuses: Record<number, 'locked' | 'available' | 'loading' | 'completed'> = {};
  for (let i = 1; i <= 8; i++) {
    stepStatuses[i] = getStepStatus(i);
  }

  const handleStepClick = (step: number) => {
    const status = stepStatuses[step];
    if (status !== 'locked' && status !== 'loading') {
      setCurrentStep(step);
    }
  };

  const handleNewAnalysis = () => {
    reset();
    setCurrentStep(1);
  };

  if (bare) {
    return (
      <div className="h-screen flex flex-col bg-white dark:bg-neutral-950 overflow-y-auto scrollbar-thin">
        {children}
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-neutral-950">
      <TopNav onMenuClick={() => setMobileSidebarOpen((v) => !v)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          onNewAnalysis={handleNewAnalysis}
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentStep > 0 && (
            <StepProgressBar
              currentStep={currentStep}
              stepStatuses={stepStatuses}
              onStepClick={handleStepClick}
            />
          )}
          <main className="flex-1 overflow-y-auto scrollbar-thin">
            <div className={currentStep === -1 || currentStep === -4 ? 'w-full px-4 sm:px-6 py-6' : 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'}>
              <div className="animate-slide-up" key={currentStep}>
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
