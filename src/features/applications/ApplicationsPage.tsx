import { useMemo, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { ApplicationStatus, ApplicationEvent, ApplicationEventType, JobApplication } from '@/types';

const STATUS_META: Record<ApplicationStatus, { label: string; badge: string; dot: string }> = {
  draft: { label: '待投递', badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
  applied: { label: '已投递', badge: 'bg-blue-50 text-blue-600', dot: 'bg-blue-500' },
  written_test: { label: '笔试中', badge: 'bg-violet-50 text-violet-600', dot: 'bg-violet-500' },
  interview: { label: '面试中', badge: 'bg-amber-50 text-amber-600', dot: 'bg-amber-500' },
  offer: { label: '已拿 Offer', badge: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' },
  rejected: { label: '已拒绝', badge: 'bg-red-50 text-red-500', dot: 'bg-red-400' },
  withdrawn: { label: '已撤回', badge: 'bg-slate-100 text-slate-400', dot: 'bg-slate-300' },
};

/** 状态流转：下一步可到达的状态 */
const STATUS_NEXT: Record<ApplicationStatus, ApplicationStatus[]> = {
  draft: ['applied', 'rejected', 'withdrawn'],
  applied: ['written_test', 'interview', 'rejected', 'withdrawn'],
  written_test: ['interview', 'rejected', 'withdrawn'],
  interview: ['offer', 'rejected', 'withdrawn'],
  offer: ['rejected', 'withdrawn'],
  rejected: [],
  withdrawn: [],
};

function genId() { return Math.random().toString(36).slice(2, 10); }

const fmtDate = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function ApplicationsPage() {
  const { applications, addApplication, updateApplicationStatus, addApplicationEvent, deleteApplication } = useAppStore();
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const list = useMemo(() => {
    const sorted = [...applications].sort((a, b) => b.updatedAt - a.updatedAt);
    return filter === 'all' ? sorted : sorted.filter((a) => a.status === filter);
  }, [applications, filter]);

  const stats = useMemo(() => {
    const s: Record<string, number> = {};
    applications.forEach((a) => { s[a.status] = (s[a.status] ?? 0) + 1; });
    return s;
  }, [applications]);

  const activeCount = applications.filter((a) =>
    a.status === 'applied' || a.status === 'written_test' || a.status === 'interview'
  ).length;

  const handleStatusChange = (id: string, status: ApplicationStatus) => {
    const app = applications.find((a) => a.id === id);
    updateApplicationStatus(id, status);
    if (app) {
      const meta = STATUS_META[status];
      addApplicationEvent(id, {
        id: genId(),
        type: status === 'offer' ? 'offer' : status === 'rejected' ? 'rejected' : 'note',
        title: `状态更新为「${meta.label}」`,
        createdAt: Date.now(),
      });
    }
    if (status === 'offer' || status === 'rejected' || status === 'withdrawn') {
      setExpandedId(null);
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-1">投递跟踪</h2>
          <p className="text-sm text-slate-500">记录各岗位的投递进度，跟进笔试与面试安排</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          新增投递
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="进行中" value={activeCount} accent="text-primary-600" />
        <StatCard label="已投递" value={stats.applied ?? 0} accent="text-blue-500" />
        <StatCard label="面试中" value={stats.interview ?? 0} accent="text-amber-500" />
        <StatCard label="已拿 Offer" value={stats.offer ?? 0} accent="text-emerald-500" />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-1.5 mb-5">
        <FilterChip label="全部" count={applications.length} active={filter === 'all'} onClick={() => setFilter('all')} />
        {(Object.keys(STATUS_META) as ApplicationStatus[]).map((s) => (
          <FilterChip key={s} label={STATUS_META[s].label} count={stats[s] ?? 0} active={filter === s} onClick={() => setFilter(s)} />
        ))}
      </div>

      {/* Empty state */}
      {list.length === 0 && (
        <Card padding="lg">
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.688c0-.547.305-1.051.793-1.306l7.5-3.938a1.5 1.5 0 011.414 0l7.5 3.938c.488.255.793.759.793 1.306v6.626a1.5 1.5 0 01-.793 1.306l-7.5 3.938a1.5 1.5 0 01-1.414 0L3.793 16.62A1.5 1.5 0 013 15.314V8.688ZM3 8.25l9 4.5m0 0l9-4.5m-9 4.5V21" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">{filter === 'all' ? '还没有投递记录' : '该状态下暂无记录'}</p>
            <p className="text-xs text-slate-400 mb-4">点击右上角「新增投递」，开始记录你的求职进度</p>
            {filter === 'all' && <Button size="sm" onClick={() => setShowForm(true)}>新增投递</Button>}
          </div>
        </Card>
      )}

      {/* List */}
      <div className="space-y-3">
        {list.map((app) => {
          const meta = STATUS_META[app.status];
          const next = STATUS_NEXT[app.status];
          const expanded = expandedId === app.id;
          return (
            <Card key={app.id} padding="lg" className={expanded ? '' : 'hover:border-slate-300 transition-colors'}>
              {/* Header row */}
              <div className="flex items-start justify-between gap-4">
                <button className="flex-1 min-w-0 text-left" onClick={() => setExpandedId(expanded ? null : app.id)}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-900 truncate">{app.position}</span>
                    {app.matchScore !== undefined && (
                      <span className="text-[10px] text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded shrink-0">匹配 {app.matchScore}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="truncate">{app.company}</span>
                    {app.source && <span className="shrink-0 text-slate-400">· {app.source}</span>}
                    <span className="shrink-0 text-slate-400">· 更新于 {fmtDate(app.updatedAt)}</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${meta.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                  {confirmDelete === app.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { deleteApplication(app.id); setConfirmDelete(null); }}
                        className="px-2 py-1 text-xs text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                      >
                        确认
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(app.id)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="删除记录"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => setExpandedId(expanded ? null : app.id)}
                    className={`p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-all ${expanded ? 'rotate-90' : ''}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Expanded: status flow + timeline + note */}
              {expanded && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-fade-in">
                  {/* Status transitions */}
                  {next.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-400 mr-1">流转为：</span>
                      {next.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(app.id, s)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${STATUS_META[s].badge} border-slate-200 hover:border-slate-300`}
                        >
                          {STATUS_META[s].label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Note + URL */}
                  {(app.note || app.url) && (
                    <div className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 space-y-1">
                      {app.note && <p>{app.note}</p>}
                      {app.url && (
                        <a href={app.url} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline break-all">
                          {app.url}
                        </a>
                      )}
                    </div>
                  )}

                  {/* Timeline */}
                  {app.events.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-slate-500">跟进记录</h4>
                      <div className="space-y-2">
                        {[...app.events].reverse().map((ev) => (
                          <EventRow key={ev.id} event={ev} />
                        ))}
                      </div>
                    </div>
                  )}

                  <QuickEventForm app={app} onAdd={addApplicationEvent} />
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <AddApplicationDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={(data) => {
          addApplication({
            id: genId(),
            ...data,
            appliedAt: data.status === 'applied' ? Date.now() : undefined,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            events: [],
          });
          setShowForm(false);
        }}
      />
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <Card padding="md" className="text-center">
      <div className={`text-2xl font-bold ${accent}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </Card>
  );
}

function FilterChip({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
        active
          ? 'bg-primary-600 text-white border-primary-600'
          : 'text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      {label}
      {count > 0 && <span className={`ml-1 ${active ? 'text-primary-200' : 'text-slate-400'}`}>{count}</span>}
    </button>
  );
}

function EventRow({ event }: { event: ApplicationEvent }) {
  const icon = {
    note: <circle cx="12" cy="12" r="4" />,
    written_test: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
    interview: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
    offer: <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />,
    rejected: <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />,
  }[event.type];

  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>{icon}</svg>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-700">{event.title}</span>
          {event.date && <span className="text-[10px] text-slate-400 shrink-0">📅 {event.date}</span>}
          <span className="text-[10px] text-slate-300 ml-auto shrink-0">{fmtDate(event.createdAt)}</span>
        </div>
        {event.detail && <p className="text-xs text-slate-500 mt-0.5 whitespace-pre-wrap">{event.detail}</p>}
      </div>
    </div>
  );
}

function QuickEventForm({ app, onAdd }: { app: JobApplication; onAdd: (id: string, event: ApplicationEvent) => void }) {
  const [type, setType] = useState<ApplicationEventType>('note');
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [date, setDate] = useState('');

  const submit = () => {
    const resolvedTitle = title.trim();
    if (!resolvedTitle && type === 'note') return;
    onAdd(app.id, {
      id: genId(),
      type,
      title: resolvedTitle || (type === 'written_test' ? '笔试安排' : type === 'interview' ? '面试安排' : '跟进记录'),
      detail: detail.trim() || undefined,
      date: date || undefined,
      createdAt: Date.now(),
    });
    setTitle('');
    setDetail('');
    setDate('');
  };

  return (
    <div className="bg-slate-50 rounded-xl p-3 space-y-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {([
          ['note', '笔记'],
          ['written_test', '笔试'],
          ['interview', '面试'],
        ] as [ApplicationEventType, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => { setType(t); if (t === 'written_test') setTitle('笔试安排'); if (t === 'interview') setTitle('面试安排'); }}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              type === t ? 'bg-primary-600 text-white border-primary-600' : 'text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={type === 'note' ? '记录要点，如：HR 约周五电话沟通' : '安排标题，如：二面'}
          className="flex-1 min-w-[160px] text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
        />
        <Button size="sm" onClick={submit}>添加</Button>
      </div>
      <textarea
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        placeholder="补充说明（可选）"
        rows={2}
        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 resize-none"
      />
    </div>
  );
}

function AddApplicationDialog({ open, onClose, onSubmit }: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { company: string; position: string; status: ApplicationStatus; source?: string; url?: string; note?: string; matchScore?: number }) => void;
}) {
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [source, setSource] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [matchScore, setMatchScore] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>('draft');

  if (!open) return null;

  const valid = company.trim().length > 0 && position.trim().length > 0;

  const submit = () => {
    if (!valid) return;
    const score = parseInt(matchScore, 10);
    onSubmit({
      company: company.trim(),
      position: position.trim(),
      status,
      source: source.trim() || undefined,
      url: url.trim() || undefined,
      note: note.trim() || undefined,
      matchScore: !isNaN(score) && score >= 0 && score <= 100 ? score : undefined,
    });
    setCompany(''); setPosition(''); setSource(''); setUrl(''); setNote(''); setMatchScore(''); setStatus('draft');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md mx-4 animate-slide-up">
        <div className="flex items-center justify-between px-6 pt-6 pb-0">
          <h2 className="text-base font-semibold text-slate-900">新增投递</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-3">
          <Field label="公司 *">
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="如：字节跳动" className={inputCls} />
          </Field>
          <Field label="岗位 *">
            <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="如：高级前端工程师" className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="投递渠道">
              <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="如：Boss直聘" className={inputCls} />
            </Field>
            <Field label="匹配度 (0-100)">
              <input value={matchScore} onChange={(e) => setMatchScore(e.target.value)} type="number" min={0} max={100} placeholder="如：82" className={inputCls} />
            </Field>
          </div>
          <Field label="JD 链接">
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className={inputCls} />
          </Field>
          <Field label="当前状态">
            <select value={status} onChange={(e) => setStatus(e.target.value as ApplicationStatus)} className={inputCls}>
              {(Object.keys(STATUS_META) as ApplicationStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_META[s].label}</option>
              ))}
            </select>
          </Field>
          <Field label="备注">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="岗位亮点、沟通要点等" className={`${inputCls} resize-none`} />
          </Field>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <Button variant="ghost" size="md" onClick={onClose}>取消</Button>
          <Button size="md" disabled={!valid} onClick={submit}>保存</Button>
        </div>
      </div>
    </div>
  );
}

const inputCls = 'w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
