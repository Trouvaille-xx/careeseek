import { useMemo, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { getDefaultPrompt, type PromptKey } from '@/services/prompts';
import { getServerOverride } from '@/services/promptOverrides';
import { PROMPT_GROUPS } from '@/config/promptGroups';
import { Button } from '@/components/ui/Button';

/**
 * 设置 › 提示词管理。
 *
 * 让本机用户查看并修改项目里所有 LLM 提示词。个人覆盖存在 store.promptOverrides，
 * 随应用一起持久化（仅本机）。生效优先级：个人修改 > 官方（服务端管理后台）> 内置默认。
 *
 * 只做展示 + 编辑；真正的渲染发生在分析时（services/prompts.ts 的 render 每次读这里）。
 */
export function PromptManager() {
  const promptOverrides = useAppStore((s) => s.promptOverrides);
  const setPromptOverride = useAppStore((s) => s.setPromptOverride);
  const clearPromptOverride = useAppStore((s) => s.clearPromptOverride);
  const clearAllPromptOverrides = useAppStore((s) => s.clearAllPromptOverrides);

  const [selectedGroup, setSelectedGroup] = useState<string>(PROMPT_GROUPS[0].id);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');

  const group = PROMPT_GROUPS.find((g) => g.id === selectedGroup) ?? PROMPT_GROUPS[0];

  const customizedCount = useMemo(
    () => Object.values(promptOverrides).filter((v) => v && v.trim()).length,
    [promptOverrides]
  );

  /** 草稿初值：已保存的个人覆盖 → 官方覆盖 → 内置默认。 */
  const draftOf = (key: PromptKey): string =>
    drafts[key] ?? promptOverrides[key] ?? getServerOverride(key) ?? getDefaultPrompt(key);

  const flash = (text: string) => {
    setMsg(text);
    window.setTimeout(() => setMsg((m) => (m === text ? '' : m)), 2000);
  };

  const save = (key: PromptKey) => {
    const content = drafts[key];
    if (!content || !content.trim()) return;
    setPromptOverride(key, content);
    flash(`已保存「${key}」，分析时将使用你的版本`);
  };

  const reset = (key: PromptKey) => {
    clearPromptOverride(key);
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    flash(`已恢复「${key}」为${getServerOverride(key) ? '官方版本' : '内置默认'}`);
  };

  const resetAll = () => {
    if (customizedCount === 0) return;
    if (!window.confirm(`确定清除全部 ${customizedCount} 条自定义提示词，恢复为默认？`)) return;
    clearAllPromptOverrides();
    setDrafts({});
    flash('已清除全部自定义提示词');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100">提示词管理</h3>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5 leading-relaxed max-w-xl">
            修改 AI 各步骤使用的提示词模板。修改只保存在本机，仅影响你自己的分析；
            保留 <code className="text-slate-500">{'{jd}'}</code> <code className="text-slate-500">{'{resume}'}</code>{' '}
            等占位符（渲染时会替换为实际内容）。
          </p>
        </div>
        {customizedCount > 0 && (
          <Button variant="outline" size="sm" onClick={resetAll}>
            全部恢复默认
          </Button>
        )}
      </div>

      {msg && (
        <div className="text-xs px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          {msg}
        </div>
      )}

      {/* 分组选择：移动端横向滚动，桌面换行 */}
      <div className="flex flex-wrap gap-1.5">
        {PROMPT_GROUPS.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelectedGroup(g.id)}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
              selectedGroup === g.id
                ? 'bg-primary-50 text-primary-700 font-medium dark:bg-neutral-700 dark:text-neutral-100'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-neutral-400 dark:hover:bg-neutral-700/60'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* 当前分组的每条提示词 */}
      <div className="space-y-4">
        {group.keys.map(({ key, label }) => {
          const def = getDefaultPrompt(key);
          const server = getServerOverride(key);
          const user = promptOverrides[key];
          const hasUser = Boolean(user && user.trim());
          const hasServer = Boolean(server && server.trim());
          const dirty = drafts[key] !== undefined && drafts[key] !== (user ?? server ?? def);
          return (
            <div key={key} className="rounded-xl border border-slate-200 dark:border-neutral-700 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-neutral-100">{label}</h4>
                  <code className="text-[11px] text-slate-400">{key}</code>
                  {hasUser ? (
                    <span className="px-1.5 py-px rounded text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
                      已自定义
                    </span>
                  ) : hasServer ? (
                    <span className="px-1.5 py-px rounded text-[10px] bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300">
                      官方已覆盖
                    </span>
                  ) : (
                    <span className="px-1.5 py-px rounded text-[10px] bg-slate-100 text-slate-400 dark:bg-neutral-700 dark:text-neutral-400">
                      默认
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {hasUser && (
                    <button
                      onClick={() => reset(key)}
                      className="text-xs text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                    >
                      恢复默认
                    </button>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!drafts[key]?.trim() || !dirty}
                    onClick={() => save(key)}
                  >
                    保存
                  </Button>
                </div>
              </div>

              <textarea
                value={draftOf(key)}
                onChange={(e) => setDrafts((prev) => ({ ...prev, [key]: e.target.value }))}
                rows={Math.min(20, Math.max(6, draftOf(key).split('\n').length + 1))}
                spellCheck={false}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-200"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
