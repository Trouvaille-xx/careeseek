import { Button } from './Button';

/** 无序列表编辑器：一条公司/项目记录内逐条描述职责与成就 */
export function ResponsibilitiesEditor({ items, onChange }: { items: string[]; onChange: (items: string[]) => void }) {
  const list = items ?? [];
  const setItem = (i: number, v: string) => {
    const next = [...list];
    next[i] = v;
    onChange(next);
  };
  const removeItem = (i: number) => onChange(list.filter((_, idx) => idx !== i));
  const addItem = () => onChange([...list, '']);
  const moveUp = (i: number) => {
    if (i === 0) return;
    const next = [...list];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    onChange(next);
  };
  const moveDown = (i: number) => {
    if (i === list.length - 1) return;
    const next = [...list];
    [next[i + 1], next[i]] = [next[i], next[i + 1]];
    onChange(next);
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-medium text-slate-700 dark:text-neutral-200">工作职责与成就</label>
        <Button variant="ghost" size="sm" onClick={addItem}>
          <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          添加一条
        </Button>
      </div>
      <ul className="space-y-1.5">
        {list.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5 group">
            <span className="text-slate-400 dark:text-neutral-500 text-sm select-none shrink-0">•</span>
            <input
              value={item}
              onChange={(e) => setItem(i, e.target.value)}
              placeholder="如：负责 XX 系统架构设计，日活 10 万"
              className="flex-1 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 dark:focus:border-primary-400 transition-all"
            />
            <button onClick={() => moveUp(i)} disabled={i === 0} className="p-1 rounded text-slate-300 dark:text-neutral-600 hover:text-slate-500 dark:hover:text-neutral-300 disabled:opacity-30 shrink-0" title="上移">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
            </button>
            <button onClick={() => moveDown(i)} disabled={i === list.length - 1} className="p-1 rounded text-slate-300 dark:text-neutral-600 hover:text-slate-500 dark:hover:text-neutral-300 disabled:opacity-30 shrink-0" title="下移">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </button>
            <button onClick={() => removeItem(i)} className="p-1 rounded text-slate-300 dark:text-neutral-600 hover:text-red-500 shrink-0" title="删除">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </li>
        ))}
        {list.length === 0 && (
          <li className="text-xs text-slate-400 dark:text-neutral-500 italic">暂无职责，点击"添加一条"逐条描述（推荐每条约 20-40 字，量化成果更佳）</li>
        )}
      </ul>
    </div>
  );
}
