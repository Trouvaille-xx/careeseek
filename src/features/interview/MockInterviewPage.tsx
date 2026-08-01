import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { analysisService } from '@/services/analysisService';
import type { InterviewMessage, InterviewReport } from '@/types';

export function MockInterviewPage() {
  const {
    interviewSessions, currentInterviewId, interviewLoading, setInterviewLoading,
    startInterview, addInterviewMessage, updateLastAssistantMessage,
    completeInterview, resetCurrentInterview,
    jdAnalysis, diagnosis,
  } = useAppStore();

  const currentSession = interviewSessions.find((s) => s.id === currentInterviewId);
  const [mode, setMode] = useState<'real' | 'learning' | null>(null);
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<'select' | 'interview' | 'report'>('select');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { userInput } = useAppStore();

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [currentSession?.messages]);

  const handleStart = async (selectedMode: 'real' | 'learning') => {
    setMode(selectedMode);
    startInterview(selectedMode);
    setPhase('interview');
    setInterviewLoading(true);

    try {
      const { persona, firstQuestion } = await analysisService.startInterview(
        userInput, jdAnalysis!, diagnosis!, selectedMode
      );
      addInterviewMessage({ id: genId(), role: 'assistant', content: persona, round: 0 });
      addInterviewMessage({ id: genId(), role: 'assistant', content: firstQuestion, round: 1 });
    } catch (e: any) {
      addInterviewMessage({ id: genId(), role: 'assistant', content: `面试启动失败：${e?.message || '未知错误'}`, round: 0 });
    }
    setInterviewLoading(false);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !currentSession) return;
    setInput('');

    const userRound = currentSession.messages.filter((m) => m.role === 'user').length + 1;
    addInterviewMessage({ id: genId(), role: 'user', content: text, round: userRound });
    setInterviewLoading(true);

    try {
      const result = await analysisService.continueInterview(
        userInput, jdAnalysis!, diagnosis!,
        [...currentSession.messages, { id: genId(), role: 'user', content: text, round: userRound }],
        mode || 'real'
      );

      const nextRound = currentSession.messages.filter((m) => m.role === 'assistant' && m.round > 0).length + 1;
      addInterviewMessage({
        id: genId(), role: 'assistant', content: result.response,
        tip: result.tip, score: result.score, round: nextRound,
      });
    } catch (e: any) {
      addInterviewMessage({ id: genId(), role: 'assistant', content: `抱歉，出现了错误：${e?.message || '未知错误'}。请重试。`, round: userRound + 0.5 });
    }
    setInterviewLoading(false);
  };

  const handleFinish = () => {
    if (!currentSession) return;
    const userMsgs = currentSession.messages.filter((m) => m.role === 'user');
    const roundScores = userMsgs.map((m, i) => {
      const score = m.content.length > 100 ? 70 + Math.floor(Math.random() * 20) : 50 + Math.floor(Math.random() * 20);
      return { round: i + 1, score: Math.min(score, 98), comment: score >= 70 ? '回答较完整' : '建议补充更多细节' };
    });
    const overall = Math.round(roundScores.reduce((a, b) => a + b.score, 0) / roundScores.length);
    const report: InterviewReport = {
      overallScore: overall,
      roundScores,
      strengths: ['积极参与面试过程', '能够结合自身经验回答问题'],
      improvements: ['建议增加量化成果的表达', '加强对 JD 关键要求的针对性回答'],
      summary: `本次${mode === 'real' ? '真实面试' : '学习模式面试'}共进行了${userMsgs.length}轮问答。整体表现${overall >= 75 ? '良好' : '中等'}。`,
    };
    completeInterview(report);
    setPhase('report');
  };

  const handleNewInterview = () => {
    resetCurrentInterview();
    setMode(null);
    setPhase('select');
    setInput('');
  };

  // ---- Select Mode ----
  if (phase === 'select') {
    const hasAnalysis = jdAnalysis !== null;
    return (
      <div className="animate-fade-in max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">模拟面试</h2>
          <p className="text-sm text-slate-500">基于你的简历和岗位 JD，进行 AI 模拟面试</p>
        </div>

        {!hasAnalysis && (
          <Card padding="md" className="bg-amber-50 border-amber-200 mb-6">
            <p className="text-sm text-amber-800">请先完成简历分析流程，系统将基于分析结果生成面试内容。</p>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <button onClick={() => hasAnalysis && handleStart('real')} disabled={!hasAnalysis}
            className="text-left bg-white rounded-2xl border-2 border-slate-200 hover:border-primary-400 p-6 transition-all disabled:opacity-50 disabled:cursor-not-allowed group">
            <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-primary-50 flex items-center justify-center mb-3 transition-colors">
              <svg className="w-5 h-5 text-slate-600 group-hover:text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">真实面试</h3>
            <p className="text-xs text-slate-500 leading-relaxed">模拟真实面试场景，面试官风格相对严厉。结束后生成完整面试报告。</p>
          </button>

          <button onClick={() => hasAnalysis && handleStart('learning')} disabled={!hasAnalysis}
            className="text-left bg-white rounded-2xl border-2 border-slate-200 hover:border-primary-400 p-6 transition-all disabled:opacity-50 disabled:cursor-not-allowed group">
            <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-primary-50 flex items-center justify-center mb-3 transition-colors">
              <svg className="w-5 h-5 text-slate-600 group-hover:text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" /></svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">学习模式</h3>
            <p className="text-xs text-slate-500 leading-relaxed">每轮对话后提供回答提示和评分，可重新回答。适合练习和准备。</p>
          </button>
        </div>
      </div>
    );
  }

  // ---- Interview ----
  if (phase === 'interview' && currentSession) {
    const userCount = currentSession.messages.filter((m) => m.role === 'user').length;
    const totalRounds = Math.ceil(currentSession.messages.filter((m) => m.role === 'assistant' && m.round > 0).length);
    const lastMsg = currentSession.messages[currentSession.messages.length - 1];
    const isAwaitingAnswer = lastMsg?.role === 'assistant' && !lastMsg.content.includes('回答已记录');
    const canFinish = userCount >= 3;

    return (
      <div className="animate-fade-in flex flex-col h-[calc(100vh-12rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <span className="text-xs text-slate-400 font-medium">{mode === 'real' ? '真实面试' : '学习模式'}</span>
            <span className="text-xs text-slate-300 mx-2">|</span>
            <span className="text-xs text-slate-500">{totalRounds} 轮</span>
          </div>
          <div className="flex gap-2">
            {canFinish && (
              <Button variant="outline" size="sm" onClick={handleFinish}>
                结束面试
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleNewInterview}>
              重新开始
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
          {currentSession.messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isSystem = msg.round > 0 && msg.round % 1 !== 0;
            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${isUser ? 'order-1' : 'order-1'}`}>
                  {!isUser && !isSystem && (
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
                      </div>
                      <span className="text-xs font-medium text-slate-500">面试官</span>
                      <span className="text-[10px] text-slate-300">第 {Math.floor(msg.round)} 问</span>
                    </div>
                  )}
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isUser ? 'bg-primary-600 text-white' : isSystem ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {msg.content.split('\n').map((line, i) => <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>)}
                  </div>
                  {mode === 'learning' && msg.role === 'assistant' && msg.tip && !isSystem && (
                    <div className="mt-1.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-[11px] text-amber-700 leading-relaxed">提示：{msg.tip}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {interviewLoading && (
            <div className="flex justify-start">
              <div className="px-4 py-3">
                <Spinner className="w-5 h-5" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="mt-4 flex gap-3 shrink-0">
          <input
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
            placeholder="输入你的回答..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={!isAwaitingAnswer || interviewLoading}
          />
          <Button onClick={handleSend} disabled={!input.trim() || !isAwaitingAnswer || interviewLoading}>
            发送
          </Button>
        </div>
      </div>
    );
  }

  // ---- Report ----
  if (phase === 'report' && currentSession?.report) {
    const report = currentSession.report;
    return (
      <div className="animate-fade-in max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            report.overallScore >= 75 ? 'bg-emerald-100' : report.overallScore >= 60 ? 'bg-amber-100' : 'bg-red-100'
          }`}>
            <span className={`text-2xl font-bold ${
              report.overallScore >= 75 ? 'text-emerald-700' : report.overallScore >= 60 ? 'text-amber-700' : 'text-red-700'
            }`}>{report.overallScore}</span>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-1">面试报告</h2>
          <p className="text-sm text-slate-500">{report.summary}</p>
        </div>

        {/* Score breakdown */}
        <Card padding="lg" className="mb-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">各轮评分</h3>
          <div className="space-y-3">
            {report.roundScores.map((rs) => (
              <div key={rs.round}>
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span>第 {rs.round} 轮</span>
                  <span className="font-semibold">{rs.score} 分</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${
                    rs.score >= 75 ? 'bg-emerald-500' : rs.score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                  }`} style={{ width: `${rs.score}%` }} />
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{rs.comment}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Strengths */}
        <Card padding="lg" className="mb-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">表现出色的地方</h3>
          <ul className="space-y-2">
            {report.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <svg className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                {s}
              </li>
            ))}
          </ul>
        </Card>

        {/* Improvements */}
        <Card padding="lg" className="mb-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">需要改进的地方</h3>
          <ul className="space-y-2">
            {report.improvements.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
                {s}
              </li>
            ))}
          </ul>
        </Card>

        <div className="flex justify-center pb-8">
          <Button variant="outline" onClick={handleNewInterview}>
            重新开始面试
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

function genId() { return Math.random().toString(36).slice(2, 10); }
