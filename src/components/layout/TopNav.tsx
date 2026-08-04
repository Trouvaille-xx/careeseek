import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Logo } from '@/components/ui/Brand';

export function TopNav({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-4 sm:px-6 shrink-0 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-center gap-3">
        {/* 移动端汉堡菜单 */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 -ml-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors dark:text-neutral-300 dark:hover:bg-neutral-800"
          title="菜单"
          aria-label="打开菜单"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <Logo className="w-5 h-5 text-slate-900 dark:text-neutral-100" />
        <span className="text-base font-semibold text-slate-900 dark:text-neutral-100">CareeSeek</span>
        <span className="text-xs text-slate-400 hidden sm:inline">你的简历助手</span>
      </div>

      <div className="flex items-center gap-2">
        <WorkspaceSwitcher />
        
      </div>
    </header>
  );
}

function WorkspaceSwitcher() {
  const { currentWorkspace, workspaceList, switchWorkspace, createWorkspace, deleteWorkspace } = useAppStore();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
        setConfirmDelete(null);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const handleCreate = () => {
    const name = newName.trim();
    if (!name || workspaceList.includes(name)) {
      setNewName('');
      setCreating(false);
      return;
    }
    createWorkspace(name);
    setNewName('');
    setCreating(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
          open ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200 dark:bg-neutral-700 dark:text-neutral-100 dark:ring-neutral-600' : 'text-slate-600 hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
        }`}
        title="切换工作区"
      >
        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        <span className="max-w-[120px] truncate font-medium">{currentWorkspace}</span>
        <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-fade-in dark:bg-neutral-800 dark:border-neutral-700 dark:shadow-black/40">
          <p className="px-4 pb-1 text-[10px] text-slate-400 dark:text-neutral-500">工作区（数据相互隔离）</p>
          {workspaceList.map((name) => {
            const isCurrent = name === currentWorkspace;
            return (
              <div
                key={name}
                className={`flex items-center gap-2 px-4 py-2 ${isCurrent ? 'bg-primary-50/60 dark:bg-neutral-700/50' : ''}`}
              >
                <button
                  onClick={() => { switchWorkspace(name); setOpen(false); }}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left"
                >
                  <svg className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-primary-600 dark:text-primary-400' : 'text-slate-300 dark:text-neutral-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={`text-sm truncate flex-1 ${isCurrent ? 'font-medium text-slate-900 dark:text-neutral-100' : 'text-slate-600 dark:text-neutral-300'}`}>{name}</span>
                </button>
                {name !== 'default' && (
                  confirmDelete === name ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => { deleteWorkspace(name); setConfirmDelete(null); setOpen(false); }}
                        className="px-1.5 py-0.5 text-[10px] text-white bg-red-500 hover:bg-red-600 rounded transition-colors"
                      >
                        确认
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-1.5 py-0.5 text-[10px] text-slate-500 hover:bg-slate-100 rounded transition-colors dark:text-neutral-400 dark:hover:bg-neutral-700"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(name)}
                      className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0 dark:text-neutral-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                      title="删除工作区"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )
                )}
              </div>
            );
          })}

          {creating ? (
            <div className="px-3 py-1.5 border-t border-slate-100 mt-1 dark:border-neutral-700">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') { setCreating(false); setNewName(''); }
                }}
                placeholder="工作区名称"
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500"
              />
              <div className="flex items-center gap-1.5 mt-1.5">
                <button onClick={handleCreate} className="flex-1 px-2 py-1 text-xs text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors">创建</button>
                <button onClick={() => { setCreating(false); setNewName(''); }} className="flex-1 px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded-lg transition-colors dark:text-neutral-400 dark:hover:bg-neutral-700">取消</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 transition-colors border-t border-slate-100 mt-1 dark:text-primary-400 dark:hover:bg-neutral-700/50 dark:border-neutral-700"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              新建工作区
            </button>
          )}
        </div>
      )}
    </div>
  );
}
