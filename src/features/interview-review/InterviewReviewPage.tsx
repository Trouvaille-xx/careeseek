import { useState, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { MarkdownText } from '@/components/ui/MarkdownText';
import { Spinner } from '@/components/ui/Spinner';
import { transcribeAudio, isBrowserWhisperSupported } from '@/services/asrService';
import { analysisService } from '@/services/analysisService';
import { track } from '@/services/tracker';
import type { RealInterview, AsrMode, InterviewReviewReport, ResumeLibrary, AnalysisHistoryEntry, InterviewSession, InterviewReport } from '@/types';

interface CreateForm {
  company: string;
  position: string;
  interviewTime: string;
  format: string;
  round: string;
  interviewers: string;
  note: string;
  asrMode: AsrMode;
  transcript: string;
  audioFile: File | null;
  linkedResumeId: string;
  linkedAnalysisId: string;
  linkedSessionId: string;
}

const emptyForm: CreateForm = {
  company: '',
  position: '',
  interviewTime: '',
  format: '',
  round: '',
  interviewers: '',
  note: '',
  asrMode: 'text',
  transcript: '',
  audioFile: null,
  linkedResumeId: '',
  linkedAnalysisId: '',
  linkedSessionId: '',
};

/** 简历库 → 可读文本 */
function resumeLibraryToText(lib: ResumeLibrary): string {
  const parts: string[] = [];
  const basic = lib.basicInfo;
  if (basic) {
    parts.push(`基本信息：${[basic.name, basic.jobIntent, basic.phone, basic.email, basic.city].filter(Boolean).join(' | ')}`);
    if (basic.summary) parts.push(`个人简介：${basic.summary}`);
  }
  if (lib.education.length > 0) {
    parts.push('教育经历：');
    for (const e of lib.education) {
      parts.push(`- ${[e.school, e.major, e.degree].filter(Boolean).join(' / ')}${e.startDate ? `（${e.startDate}-${e.endDate}）` : ''}`);
      if (e.description) parts.push(`  ${e.description}`);
    }
  }
  if (lib.workExperience.length > 0) {
    parts.push('工作经历：');
    for (const w of lib.workExperience) {
      parts.push(`- ${[w.company, w.position].filter(Boolean).join(' / ')}${w.startDate ? `（${w.startDate}-${w.endDate}）` : ''}`);
      if (w.description) parts.push(`  ${w.description}`);
    }
  }
  if (lib.projects.length > 0) {
    parts.push('项目经历：');
    for (const p of lib.projects) {
      parts.push(`- ${[p.name, p.role].filter(Boolean).join(' / ')}${p.startDate ? `（${p.startDate}-${p.endDate}）` : ''}`);
      if (p.description) parts.push(`  ${p.description}`);
    }
  }
  if (lib.coreSkills.length > 0) {
    parts.push('专业技能：');
    for (const s of lib.coreSkills) parts.push(`- ${s.skills}`);
  }
  if (lib.personalStrengths.length > 0) {
    parts.push('个人优势：');
    for (const p of lib.personalStrengths) parts.push(`- ${p.content}`);
  }
  return parts.join('\n');
}

/** 分析历史 → 可读摘要 */
function analysisHistoryToText(h: AnalysisHistoryEntry): string {
  const lines: string[] = [`分析标题：${h.title || '未命名'}`];
  if (h.jdAnalysis) {
    lines.push(`JD 关键词：${h.jdAnalysis.keywords.join('、')}`);
    lines.push(`理想候选人：${h.jdAnalysis.idealCandidate}`);
  }
  if (h.diagnosis) {
    lines.push(`简历诊断评分：${h.diagnosis.overallScore}`);
    lines.push(`ATS 评分：${h.diagnosis.atsScore ?? 'N/A'}`);
    lines.push(`优先改进：${h.diagnosis.priorityFixes.join('；')}`);
  }
  return lines.join('\n');
}

export function InterviewReviewPage() {
  const {
    realInterviews, interviewSessions, analysisHistory, resumeLibrary,
    addRealInterview, updateRealInterview, deleteRealInterview,
  } = useAppStore();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateForm>(emptyForm);
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptProgress, setTranscriptProgress] = useState(0);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  // 可选关联列表
  const localSessions = interviewSessions.filter((s) => s.completed);
  const localAnalyses = analysisHistory.filter((h) => h.completed || h.finalResume);
  const localResumes = useAppStore.getState().builderDrafts;

  const set = (patch: Partial<CreateForm>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleCreateOpen = useCallback(() => {
    setForm({ ...emptyForm });
    setError('');
    setMsg('');
    setShowCreate(true);
  }, []);

  const handleTranscribe = async () => {
    if (!form.audioFile) {
      setError('请先选择录音文件');
      return;
    }
    setError('');
    setTranscribing(true);
    setTranscriptProgress(0);
    try {
      const result = await transcribeAudio(form.asrMode, form.audioFile, (p) => setTranscriptProgress(p));
      set({ transcript: result.text, asrMode: result.mode });
      setMsg('语音转写完成，可编辑下方文本后再分析');
    } catch (e) {
      setError(e instanceof Error ? e.message : '转写失败');
    } finally {
      setTranscribing(false);
    }
  };

  const handleCreate = () => {
    if (!form.company.trim() || !form.position.trim()) {
      setError('请填写面试企业和面试岗位');
      return;
    }
    if (!form.transcript.trim()) {
      setError('请粘贴或转写面试内容（文本模式直接粘贴，录音模式先转写）');
      return;
    }
    const linkedResume = form.linkedResumeId
      ? localResumes.find((d) => d.id === form.linkedResumeId)
      : undefined;
    const entry: RealInterview = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      company: form.company.trim(),
      position: form.position.trim(),
      interviewTime: form.interviewTime,
      format: form.format.trim() || undefined,
      round: form.round.trim() || undefined,
      interviewers: form.interviewers.trim() || undefined,
      note: form.note.trim() || undefined,
      audioFileName: form.audioFile?.name || undefined,
      transcript: form.transcript.trim(),
      asrMode: form.asrMode,
      stage: 'draft',
      linkedSessionId: form.linkedSessionId || undefined,
      linkedResume: linkedResume ? { ...resumeLibrary } : undefined,
      linkedAnalysisId: form.linkedAnalysisId || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addRealInterview(entry);
    setShowCreate(false);
    setMsg('真实面试记录已创建');
    track('real_interview_created', { asr_mode: form.asrMode });
    void analyzeEntry(entry.id);
  };

  /** 生成复盘分析 */
  const analyzeEntry = async (id: string) => {
    const entry = useAppStore.getState().realInterviews.find((r) => r.id === id);
    if (!entry || entry.stage === 'analyzing') return;
    setAnalyzingId(id);
    updateRealInterview(id, { stage: 'analyzing' });
    try {
      const resumeText = entry.linkedResume ? resumeLibraryToText(entry.linkedResume) : '';
      let analysisText = '';
      if (entry.linkedAnalysisId) {
        const h = useAppStore.getState().analysisHistory.find((x) => x.id === entry.linkedAnalysisId);
        if (h) analysisText = analysisHistoryToText(h);
      }
      const report = await analysisService.generateInterviewReview({
        company: entry.company,
        position: entry.position,
        time: entry.interviewTime || '未记录',
        transcript: entry.transcript,
        resume: resumeText,
        analysis: analysisText,
      });
      updateRealInterview(id, { analysis: report, stage: 'done' });
      track('real_interview_analyzed', {});
    } catch (e) {
      updateRealInterview(id, { stage: 'error' });
      setError(e instanceof Error ? e.message : '分析失败，请重试');
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm('确认删除这条真实面试记录？复盘分析也会一并删除。')) return;
    deleteRealInterview(id);
  };

  const formatTime = (iso: string): string => {
    if (!iso) return '未记录时间';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const sessionTitle = (id?: string): string => {
    if (!id) return '';
    const s = interviewSessions.find((x) => x.id === id);
    if (!s) return '';
    const rounds = s.messages.filter((m) => m.role === 'user').length;
    return `${s.mode === 'real' ? '真实模式' : '学习模式'} · ${rounds} 轮${s.report ? ` · ${s.report.overallScore}分` : ''}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-primary-500 rounded-full" />
            面试复盘
          </h2>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">本机 AI 面试回放 · 真实面试录音复盘 · 绑定简历与分析</p>
        </div>
        <Button size="sm" onClick={handleCreateOpen}>
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          创建真实面试
        </Button>
      </div>

      {error && (
        <div className="text-xs px-3 py-2 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300">{error}</div>
      )}
      {msg && (
        <div className="text-xs px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{msg}</div>
      )}

      {/* ============ 区块一：本机 AI 面试 ============ */}
      <Card padding="lg">
        <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-primary-500 rounded-full" />
          本机 AI 面试
          <Badge variant="default">{localSessions.length}</Badge>
        </h3>
        {localSessions.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-slate-400 dark:text-neutral-500">还没有完成的本机 AI 面试记录</p>
            <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">在「模拟面试」中完成一次面试后，这里会显示回放与报告</p>
            <Button
              variant="outline" size="sm" className="mt-4"
              onClick={() => useAppStore.getState().setCurrentStep(-2)}
            >
              去模拟面试
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {localSessions.map((s) => (
              <div key={s.id} className="border border-slate-200 dark:border-neutral-700 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={s.mode === 'real' ? 'green' : 'purple'}>
                      {s.mode === 'real' ? '真实模式' : '学习模式'}
                    </Badge>
                    <span className="text-xs text-slate-400 dark:text-neutral-500">
                      {new Date(s.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  {s.report && (
                    <span className="text-sm font-bold text-primary-600 dark:text-primary-300">{s.report.overallScore} 分</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-neutral-400 line-clamp-2">
                  {s.messages.filter((m) => m.role === 'user').length} 轮问答
                  {s.report ? ` · ${s.report.summary}` : ' · 未生成报告'}
                </p>
                <div className="flex gap-2 mt-auto">
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                  >
                    {expandedId === s.id ? '收起' : '回放对话'}
                  </Button>
                  {s.report && (
                    <Button
                      variant="outline" size="sm"
                      onClick={() => setExpandedId(expandedId === `report-${s.id}` ? null : `report-${s.id}`)}
                    >
                      查看报告
                    </Button>
                  )}
                </div>
                {expandedId === s.id && <SessionReplay session={s} />}
                {expandedId === `report-${s.id}` && s.report && <ReportView report={s.report} />}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ============ 区块二：真实面试复盘 ============ */}
      <Card padding="lg">
        <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-emerald-500 rounded-full" />
          真实面试复盘
          <Badge variant="green">{realInterviews.length}</Badge>
        </h3>
        {realInterviews.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-slate-400 dark:text-neutral-500">还没有真实面试记录</p>
            <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">
              上传面试录音（或粘贴文字），AI 将拆解问答、逐题点评并给出改进建议
            </p>
            <Button size="sm" className="mt-4" onClick={handleCreateOpen}>
              创建真实面试
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {realInterviews.map((r) => (
              <RealInterviewCard
                key={r.id}
                interview={r}
                analyzing={analyzingId === r.id}
                sessionTitle={sessionTitle(r.linkedSessionId)}
                onAnalyze={() => void analyzeEntry(r.id)}
                onDelete={() => handleDelete(r.id)}
                onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
                expanded={expandedId === r.id}
              />
            ))}
          </div>
        )}
      </Card>

      {/* 创建弹窗 */}
      <CreateInterviewDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        form={form}
        setForm={set}
        transcribing={transcribing}
        transcriptProgress={transcriptProgress}
        onTranscribe={handleTranscribe}
        onSubmit={handleCreate}
        localSessions={localSessions}
        localAnalyses={localAnalyses}
        localResumes={localResumes}
        error={error}
      />
    </div>
  );
}

/* ============ 子组件：会话回放 ============ */
function SessionReplay({ session }: { session: InterviewSession }) {
  return (
    <div className="mt-3 space-y-2 max-h-64 overflow-y-auto border-t border-slate-100 dark:border-neutral-700 pt-3">
      {session.messages.map((m) => (
        <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[85%] text-xs rounded-xl px-3 py-2 ${
            m.role === 'user'
              ? 'bg-primary-600 text-white'
              : 'bg-slate-100 dark:bg-neutral-700/60 text-slate-700 dark:text-neutral-200'
          }`}>
            {m.content}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============ 子组件：报告视图（本机 AI 面试报告） ============ */
function ReportView({ report }: { report: InterviewReport }) {
  return (
    <div className="mt-3 space-y-3 border-t border-slate-100 dark:border-neutral-700 pt-3 text-xs text-slate-600 dark:text-neutral-300">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-900 dark:text-neutral-100">总体评分</span>
        <span className="text-base font-bold text-primary-600 dark:text-primary-300">{report.overallScore}</span>
      </div>
      <p>{report.summary}</p>
      {report.strengths.length > 0 && (
        <div>
          <p className="font-semibold text-emerald-600 dark:text-emerald-300 mb-1">表现出色</p>
          <ul className="list-disc pl-4 space-y-0.5">{report.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      )}
      {report.improvements.length > 0 && (
        <div>
          <p className="font-semibold text-amber-600 dark:text-amber-300 mb-1">待改进</p>
          <ul className="list-disc pl-4 space-y-0.5">{report.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

/* ============ 子组件：真实面试卡片 ============ */
function RealInterviewCard({
  interview, analyzing, sessionTitle, onAnalyze, onDelete, onToggle, expanded,
}: {
  interview: RealInterview;
  analyzing: boolean;
  sessionTitle: string;
  onAnalyze: () => void;
  onDelete: () => void;
  onToggle: () => void;
  expanded: boolean;
}) {
  const stageBadge = (stage: RealInterview['stage']) => {
    switch (stage) {
      case 'done': return <Badge variant="green">已分析</Badge>;
      case 'analyzing': return <Badge variant="yellow">分析中...</Badge>;
      case 'transcribing': return <Badge variant="yellow">转写中...</Badge>;
      case 'error': return <Badge variant="red">分析失败</Badge>;
      default: return <Badge variant="default">待分析</Badge>;
    }
  };

  const formatTime = (iso: string): string => {
    if (!iso) return '未记录时间';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <div className="border border-slate-200 dark:border-neutral-700 rounded-xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-900 dark:text-neutral-100">{interview.company}</span>
              <span className="text-xs text-slate-400 dark:text-neutral-500">{interview.position}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span className="text-[11px] text-slate-400 dark:text-neutral-500">{formatTime(interview.interviewTime)}</span>
              {interview.round && <Badge variant="purple">{interview.round}</Badge>}
              {interview.format && <Badge>{interview.format}</Badge>}
              {stageBadge(interview.stage)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {interview.analysis && (
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-300">{interview.analysis.overallScore} 分</span>
          )}
          {interview.stage !== 'done' && interview.stage !== 'analyzing' && (
            <Button size="sm" onClick={onAnalyze} disabled={analyzing}>
              {interview.stage === 'error' ? '重试分析' : '开始分析'}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {expanded ? '收起' : '详情'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-500 hover:text-red-600">
            删除
          </Button>
        </div>
      </div>

      {analyzing && (
        <div className="mt-3 flex items-center gap-2 text-xs text-primary-600 dark:text-primary-300">
          <Spinner className="w-4 h-4" />
          AI 正在拆解面试问答、生成复盘报告...
        </div>
      )}

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-slate-100 dark:border-neutral-700 pt-4">
          {/* 关联信息 */}
          {(sessionTitle || interview.linkedAnalysisId || interview.linkedResume) && (
            <div className="flex flex-wrap gap-2">
              {sessionTitle && <Badge variant="purple">关联 AI 面试：{sessionTitle}</Badge>}
              {interview.linkedAnalysisId && <Badge>已关联简历分析</Badge>}
              {interview.linkedResume && <Badge>已关联简历库</Badge>}
            </div>
          )}

          {/* 逐字稿 */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 dark:text-neutral-200 mb-2">面试内容（逐字稿）</h4>
            <div className="text-xs text-slate-600 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-neutral-900 rounded-lg p-3 max-h-60 overflow-y-auto">
              {interview.transcript}
            </div>
            <div className="flex justify-end mt-2">
              <Button
                variant="outline" size="sm"
                onClick={() => {
                  const text = interview.transcript;
                  navigator.clipboard.writeText(text).catch(() => { /* ignore */ });
                }}
              >
                复制全文
              </Button>
            </div>
          </div>

          {/* 复盘报告 */}
          {interview.analysis && <InterviewReviewReportView report={interview.analysis} />}
        </div>
      )}
    </div>
  );
}

/* ============ 子组件：复盘报告完整视图 ============ */
function InterviewReviewReportView({ report }: { report: InterviewReviewReport }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? report.qaBreakdown : report.qaBreakdown.slice(0, 3);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
          <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{report.overallScore}</span>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">复盘报告</h4>
          <p className="text-xs text-slate-400 dark:text-neutral-500">{report.summary}</p>
        </div>
      </div>

      {/* 逐题拆解 */}
      {report.qaBreakdown.length > 0 && (
        <div>
          <h5 className="text-xs font-semibold text-slate-700 dark:text-neutral-200 mb-2">逐题拆解（{report.qaBreakdown.length} 题）</h5>
          <div className="space-y-2">
            {visible.map((qa, i) => (
              <div key={i} className="border border-slate-200 dark:border-neutral-700 rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-slate-800 dark:text-neutral-100">{i + 1}. {qa.question}</p>
                  <span className={`text-xs font-bold shrink-0 ${qa.score >= 75 ? 'text-emerald-600' : qa.score >= 60 ? 'text-amber-600' : 'text-red-500'}`}>{qa.score} 分</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1.5 line-clamp-2">你的回答：{qa.answer || '（未记录）'}</p>
                <p className="text-xs text-slate-600 dark:text-neutral-300 mt-1.5">{qa.comment}</p>
                {qa.betterAnswer && (
                  <div className="mt-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300">更优示范：{qa.betterAnswer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          {report.qaBreakdown.length > 3 && (
            <button
              className="mt-2 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-300"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? '收起' : `查看全部 ${report.qaBreakdown.length} 题`}
            </button>
          )}
        </div>
      )}

      {/* 表现/改进/匹配/建议 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {report.strengths.length > 0 && (
          <div className="bg-emerald-50/50 dark:bg-emerald-900/20 rounded-lg p-3">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1.5">表现出色</p>
            <ul className="space-y-1">{report.strengths.map((s, i) => (
              <li key={i} className="text-xs text-slate-600 dark:text-neutral-300 flex gap-1.5">
                <span className="text-emerald-500 shrink-0">+</span>{s}
              </li>
            ))}</ul>
          </div>
        )}
        {report.improvements.length > 0 && (
          <div className="bg-amber-50/50 dark:bg-amber-900/20 rounded-lg p-3">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1.5">待改进</p>
            <ul className="space-y-1">{report.improvements.map((s, i) => (
              <li key={i} className="text-xs text-slate-600 dark:text-neutral-300 flex gap-1.5">
                <span className="text-amber-500 shrink-0">!</span>{s}
              </li>
            ))}</ul>
          </div>
        )}
      </div>
      {report.matchAnalysis && (
        <div className="bg-primary-50/50 dark:bg-primary-900/20 rounded-lg p-3">
          <p className="text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1">岗位匹配度</p>
          <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">{report.matchAnalysis}</p>
        </div>
      )}
      {report.nextSteps.length > 0 && (
        <div className="bg-slate-50 dark:bg-neutral-900 rounded-lg p-3">
          <p className="text-xs font-semibold text-slate-700 dark:text-neutral-200 mb-1.5">下次行动建议</p>
          <ul className="space-y-1">{report.nextSteps.map((s, i) => (
            <li key={i} className="text-xs text-slate-600 dark:text-neutral-300 flex gap-1.5">
              <span className="text-primary-500 shrink-0">→</span>{s}
            </li>
          ))}</ul>
        </div>
      )}
    </div>
  );
}

/* ============ 创建真实面试弹窗 ============ */
function CreateInterviewDialog({
  open, onClose, form, setForm, transcribing, transcriptProgress, onTranscribe, onSubmit,
  localSessions, localAnalyses, localResumes, error,
}: {
  open: boolean;
  onClose: () => void;
  form: CreateForm;
  setForm: (patch: Partial<CreateForm>) => void;
  transcribing: boolean;
  transcriptProgress: number;
  onTranscribe: () => void;
  onSubmit: () => void;
  localSessions: InterviewSession[];
  localAnalyses: AnalysisHistoryEntry[];
  localResumes: { id: string; name: string }[];
  error: string;
}) {
  const inputCls = "w-full rounded-lg border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all";
  const labelCls = "block text-xs font-medium text-slate-500 dark:text-neutral-400 mb-1";

  return (
    <Dialog open={open} onClose={onClose} title="创建真实面试">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {error && (
          <div className="text-xs px-3 py-2 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>面试企业 *</label>
            <input className={inputCls} value={form.company} onChange={(e) => setForm({ company: e.target.value })} placeholder="如：字节跳动" />
          </div>
          <div>
            <label className={labelCls}>面试岗位 *</label>
            <input className={inputCls} value={form.position} onChange={(e) => setForm({ position: e.target.value })} placeholder="如：产品经理" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>面试时间</label>
            <input type="datetime-local" className={inputCls} value={form.interviewTime} onChange={(e) => setForm({ interviewTime: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>面试形式</label>
            <select className={inputCls} value={form.format} onChange={(e) => setForm({ format: e.target.value })}>
              <option value="">请选择</option>
              <option value="电话面">电话面</option>
              <option value="视频面">视频面</option>
              <option value="现场面">现场面</option>
              <option value="笔试">笔试</option>
              <option value="HR面">HR面</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>面试轮次</label>
            <select className={inputCls} value={form.round} onChange={(e) => setForm({ round: e.target.value })}>
              <option value="">请选择</option>
              <option value="一面">一面</option>
              <option value="二面">二面</option>
              <option value="三面">三面</option>
              <option value="终面">终面</option>
              <option value="HR面">HR面</option>
              <option value="其他">其他</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>面试官 / 备注</label>
          <input className={inputCls} value={form.interviewers} onChange={(e) => setForm({ interviewers: e.target.value })} placeholder="如：技术负责人 + HR，全程约 40 分钟" />
        </div>

        {/* 关联本地数据 */}
        <div>
          <label className={labelCls}>关联本地 AI 简历分析（可选，推荐）</label>
          <select className={inputCls} value={form.linkedAnalysisId} onChange={(e) => setForm({ linkedAnalysisId: e.target.value })}>
            <option value="">不关联</option>
            {localAnalyses.map((h) => (
              <option key={h.id} value={h.id}>{h.title || '未命名分析'}（{new Date(h.createdAt).toLocaleDateString('zh-CN')}）</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>关联本地简历（可选，推荐）</label>
          <select className={inputCls} value={form.linkedResumeId} onChange={(e) => setForm({ linkedResumeId: e.target.value })}>
            <option value="">不关联</option>
            {localResumes.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>关联本机 AI 面试（可选）</label>
          <select className={inputCls} value={form.linkedSessionId} onChange={(e) => setForm({ linkedSessionId: e.target.value })}>
            <option value="">不关联</option>
            {localSessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.mode === 'real' ? '真实模式' : '学习模式'} · {s.messages.filter((m) => m.role === 'user').length} 轮 · {new Date(s.createdAt).toLocaleDateString('zh-CN')}
              </option>
            ))}
          </select>
        </div>

        {/* 面试内容来源 */}
        <div className="border-t border-slate-100 dark:border-neutral-700 pt-4">
          <p className="text-xs font-semibold text-slate-700 dark:text-neutral-200 mb-2">面试内容</p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {([['text', '粘贴文本', '直接粘贴面试对话'], ['server', '服务器转写', '上传录音·云端 Whisper'], ['browser', '本地转写', '浏览器 Whisper·隐私最佳']] as const).map(([mode, label, desc]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setForm({ asrMode: mode })}
                disabled={mode === 'browser' && !isBrowserWhisperSupported()}
                className={`rounded-xl border-2 p-3 text-left transition-all disabled:opacity-40 ${
                  form.asrMode === mode
                    ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20'
                    : 'border-slate-200 dark:border-neutral-700 hover:border-primary-300'
                }`}
              >
                <p className="text-xs font-medium text-slate-800 dark:text-neutral-100">{label}</p>
                <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5 leading-relaxed">{desc}</p>
              </button>
            ))}
          </div>

          {form.asrMode === 'text' ? (
            <textarea
              className={`${inputCls} min-h-[120px]`}
              value={form.transcript}
              onChange={(e) => setForm({ transcript: e.target.value })}
              placeholder={'粘贴面试对话逐字稿（面试官：... / 我：...）'}
            />
          ) : (
            <div className="space-y-3">
              <input
                type="file"
                accept="audio/*,.wav,.mp3,.ogg,.m4a"
                onChange={(e) => setForm({ audioFile: e.target.files?.[0] ?? null })}
                className="block w-full text-sm text-slate-500 dark:text-neutral-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/30 dark:file:text-primary-300"
              />
              <div className="flex items-center gap-3">
                <Button size="sm" onClick={onTranscribe} disabled={transcribing || !form.audioFile}>
                  {transcribing ? '转写中...' : '开始转写'}
                </Button>
                {transcribing && (
                  <div className="flex-1">
                    <div className="h-1.5 bg-slate-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full transition-all duration-300" style={{ width: `${transcriptProgress}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">首次使用需下载模型（base 约 150MB），请耐心等待</p>
                  </div>
                )}
              </div>
              <textarea
                className={`${inputCls} min-h-[120px]`}
                value={form.transcript}
                onChange={(e) => setForm({ transcript: e.target.value })}
                placeholder="转写完成后可在此编辑/修正"
              />
            </div>
          )}
        </div>

        <div>
          <label className={labelCls}>备注</label>
          <textarea className={`${inputCls} min-h-[60px]`} value={form.note} onChange={(e) => setForm({ note: e.target.value })} placeholder="面试结果、心态、下一步安排等" />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={onSubmit}>创建并分析</Button>
        </div>
      </div>
    </Dialog>
  );
}
