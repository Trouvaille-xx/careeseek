import React from 'react';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import { StepProgressBar } from './StepProgressBar';
import { useAppStore } from '@/stores/useAppStore';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { currentStep, setCurrentStep, reset } = useAppStore();

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

  return (
    <div className="h-screen flex flex-col bg-white">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onNewAnalysis={handleNewAnalysis} />
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentStep > 0 && (
            <StepProgressBar
              currentStep={currentStep}
              stepStatuses={stepStatuses}
              onStepClick={handleStepClick}
            />
          )}
          <main className="flex-1 overflow-y-auto scrollbar-thin">
            <div className={currentStep === -1 ? 'w-full px-6 py-6' : 'max-w-6xl mx-auto px-8 py-8'}>
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
