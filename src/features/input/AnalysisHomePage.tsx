import { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';

export function AnalysisHomePage() {
  const { analysisHistory, deleteAnalysisHistory, setResumeAnalysisId } = useAppStore();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const sortedHistory = [...analysisHistory].sort((a, b) => b.updatedAt - a.updatedAt);
  const visibleHistory = showAll ? sortedHistory : sortedHistory.slice(0, 3);

  const handleResume = (id: string) => {
    setResumeAnalysisId(id);
  };

  const handleNewAnalysis = () => {
    useAppStore.getState().newAnalysis();
  };

  const handleDelete = (id: string) => {
    deleteAnalysisHistory(id);
    setConfirmDelete(null);
  };

  const fmtDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-neutral-700 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-primary-600 dark:text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-neutral-100 mb-2">简历分析</h2>
        <p className="text-sm text-slate-500 dark:text-neutral-400">基于目标岗位 JD，诊断简历匹配度并生成优化方案</p>
      </div>

      {/* Create new analysis */}
      <div className="mb-8">
        <button
          onClick={handleNewAnalysis}
          className="w-full group bg-white dark:bg-neutral-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-neutral-700 hover:border-primary-400 hover:bg-primary-50/30 transition-all duration-200 p-6 text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-neutral-700 group-hover:bg-primary-100 dark:group-hover:bg-slate-700 flex items-center justify-center transition-colors shrink-0">
              <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100 mb-0.5">创建新分析</h3>
              <p className="text-sm text-slate-500 dark:text-neutral-400">输入目标岗位 JD 和简历，AI 进行全方位诊断与优化</p>
            </div>
            <svg className="w-5 h-5 text-slate-300 dark:text-neutral-600 group-hover:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>

      {/* History */}
      {sortedHistory.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-neutral-200 flex items-center gap-2 px-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            历史分析
          </h3>
          {visibleHistory.map((entry) => (
            <div
              key={entry.id}
              className="group bg-white dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700 hover:border-slate-300 dark:hover:border-neutral-600 transition-all p-4"
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleResume(entry.id)}
                  className="flex-1 text-left min-w-0"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-900 dark:text-neutral-100 truncate">{entry.title}</span>
                    {entry.completed ? (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded shrink-0">已完成</span>
                    ) : (
                      <span className="text-[10px] text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded shrink-0">未完成</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-neutral-500">{fmtDate(entry.updatedAt)}</p>
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-3 shrink-0">
                  <button
                    onClick={() => handleResume(entry.id)}
                    className="px-2.5 py-1.5 text-xs text-slate-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                  >
                    继续
                  </button>
                  {confirmDelete === entry.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="px-2 py-1.5 text-xs text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                      >
                        确认
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-2 py-1.5 text-xs text-slate-500 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(entry.id)}
                      className="p-1.5 rounded-lg text-slate-400 dark:text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {sortedHistory.length > 3 && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="w-full py-2.5 mt-1 text-xs text-slate-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-neutral-700 rounded-xl border border-slate-200 dark:border-neutral-700 hover:border-primary-300 transition-colors"
            >
              {showAll ? '收起' : `查看更多（共 ${sortedHistory.length} 次）`}
              <svg
                className={`w-3.5 h-3.5 inline-block ml-1 transition-transform ${showAll ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Feature highlights */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: <svg className="w-6 h-6 text-primary-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>, title: 'JD 深度解析', desc: '提取岗位核心要求与隐性需求' },
          { icon: <svg className="w-6 h-6 text-primary-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>, title: '匹配度评分', desc: '多维度诊断简历匹配程度' },
          { icon: <svg className="w-6 h-6 text-primary-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>, title: '智能优化', desc: '基于 JD 定制简历表达' },
        ].map((item) => (
          <div key={item.title} className="text-center p-4">
            <div className="mb-3">{item.icon}</div>
            <h4 className="text-sm font-medium text-slate-900 dark:text-neutral-100 mb-1">{item.title}</h4>
            <p className="text-xs text-slate-500 dark:text-neutral-400">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
