import { useEffect, useState } from 'react';
import {
  ApiError, evaReview, getPromptVersions, getPrompts, putPrompt, rollbackPrompt,
  type PromptEntry, type PromptVersion,
} from '../api';
import { getDefaultPrompt, type PromptKey } from '../../services/prompts';
import { MiniMarkdown } from '../components/MiniMarkdown';

interface Props {
  onUnauthorized: () => void;
}

/** 功能分组：相同功能的系统/用户提示词放在一起 */
interface PromptGroup {
  id: string;
  label: string;
  keys: { key: PromptKey; label: string }[];
}

const PROMPT_GROUPS: PromptGroup[] = [
  {
    id: 'global', label: '全局设定',
    keys: [
      { key: 'role', label: '角色设定' },
      { key: 'json_req', label: 'JSON 输出要求' },
    ],
  },
  {
    id: 'jd', label: 'JD 解析',
    keys: [
      { key: 'jd_parse_system', label: '系统提示词' },
      { key: 'jd_prompt', label: '用户提示词' },
    ],
  },
  {
    id: 'diagnosis', label: '简历诊断',
    keys: [
      { key: 'diagnosis_system', label: '系统提示词' },
      { key: 'diagnosis_prompt', label: '用户提示词' },
    ],
  },
  {
    id: 'matching', label: '匹配分析',
    keys: [
      { key: 'matching_system', label: '系统提示词' },
      { key: 'matching_prompt', label: '用户提示词' },
    ],
  },
  {
    id: 'questions', label: '追问',
    keys: [
      { key: 'questions_system', label: '系统提示词' },
      { key: 'questions_prompt', label: '用户提示词' },
      { key: 'followup_prompt', label: '深层追问提示词' },
    ],
  },
  {
    id: 'bullet', label: '追问优化表达',
    keys: [
      { key: 'bullet_system', label: '系统提示词' },
      { key: 'bullet_prompt', label: '用户提示词' },
    ],
  },
  {
    id: 'optimize', label: '逐段优化',
    keys: [
      { key: 'optimize_system', label: '系统提示词' },
      { key: 'optimize_prompt', label: '用户提示词' },
    ],
  },
  {
    id: 'final', label: '最终简历',
    keys: [
      { key: 'final_resume_system', label: '系统提示词' },
      { key: 'final_resume_prompt', label: '用户提示词' },
    ],
  },
  {
    id: 'prep', label: '面试准备',
    keys: [
      { key: 'interview_prep_system', label: '系统提示词' },
      { key: 'interview_prep_prompt', label: '用户提示词' },
    ],
  },
  {
    id: 'interview', label: '模拟面试',
    keys: [
      { key: 'interview_system', label: '面试官系统提示词' },
      { key: 'interview_followup_prompt', label: '追问提示词' },
    ],
  },
  {
    id: 'cover-letter', label: '求职信',
    keys: [
      { key: 'cover_letter_system', label: '系统提示词' },
      { key: 'cover_letter_prompt', label: '用户提示词' },
    ],
  },
  {
    id: 'bilingual', label: '双语简历',
    keys: [
      { key: 'bilingual_system', label: '系统提示词' },
      { key: 'bilingual_prompt', label: '用户提示词' },
    ],
  },
  {
    id: 'review', label: '面试复盘',
    keys: [
      { key: 'review_system', label: '系统提示词' },
      { key: 'review_prompt', label: '用户提示词' },
    ],
  },
];

export function PromptsView({ onUnauthorized }: Props) {
  const [prompts, setPrompts] = useState<PromptEntry[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>(PROMPT_GROUPS[0].id);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [versionsMap, setVersionsMap] = useState<Record<string, PromptVersion[]>>({});
  const [historyOpen, setHistoryOpen] = useState<string | null>(null);
  const [eva, setEva] = useState<{ key: string; loading: boolean; error: string; review: string } | null>(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const entryOf = (key: string): PromptEntry | undefined => prompts.find((p) => p.key === key);
  const contentOf = (key: string): string => {
    const e = entryOf(key);
    return e ? e.content : getDefaultPrompt(key as PromptKey);
  };

  const load = async () => {
    setError('');
    try {
      const data = await getPrompts();
      setPrompts(data.prompts);
      // 未编辑过的键用服务端保存值（无保存则内置默认值）初始化草稿
      setDrafts((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const g of PROMPT_GROUPS) {
          for (const { key } of g.keys) {
            if (next[key] === undefined) {
              const e = data.prompts.find((p) => p.key === key);
              next[key] = e ? e.content : getDefaultPrompt(key);
              changed = true;
            }
          }
        }
        return changed ? next : prev;
      });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return onUnauthorized();
      setError(e instanceof Error ? e.message : '加载失败');
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (key: string) => {
    const content = drafts[key];
    if (!content || !content.trim()) return;
    setSavingKey(key);
    setError('');
    setMsg('');
    try {
      const res = await putPrompt(key, content);
      setPrompts((prev) => {
        const rest = prev.filter((p) => p.key !== key);
        return [...rest, { key, content, version: res.version, updated_by: null, updated_at: res.updated_at }];
      });
      setMsg(`已保存并发布 ${key}（v${res.version}）`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return onUnauthorized();
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSavingKey(null);
    }
  };

  const toggleHistory = async (key: string) => {
    if (historyOpen === key) {
      setHistoryOpen(null);
      return;
    }
    setError('');
    try {
      if (!versionsMap[key]) {
        const d = await getPromptVersions(key);
        setVersionsMap((prev) => ({ ...prev, [key]: d.versions }));
      }
      setHistoryOpen(key);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return onUnauthorized();
      setError(e instanceof Error ? e.message : '加载历史失败');
    }
  };

  const rollback = async (key: string, version: number) => {
    if (!confirm(`确认回滚 ${key} 到 v${version}？当前版本将保留在历史中。`)) return;
    setError('');
    setMsg('');
    try {
      const res = await rollbackPrompt(key, version);
      const content = getDefaultPrompt(key as PromptKey);
      setPrompts((prev) => {
        const rest = prev.filter((p) => p.key !== key);
        const target = versionsMap[key]?.find((v) => v.version === version);
        return [...rest, { key, content: target ? target.content : content, version: res.version, updated_by: null, updated_at: res.updated_at }];
      });
      setDrafts((prev) => {
        const target = versionsMap[key]?.find((v) => v.version === version);
        return { ...prev, [key]: target ? target.content : content };
      });
      setMsg(`已回滚 ${key} 到 v${version}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return onUnauthorized();
      setError(e instanceof Error ? e.message : '回滚失败');
    }
  };

  const runEva = async (key: string) => {
    const content = drafts[key];
    if (!content || !content.trim()) return;
    setEva({ key, loading: true, error: '', review: '' });
    setError('');
    try {
      const res = await evaReview(key, content);
      setEva({ key, loading: false, error: '', review: res.review });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return onUnauthorized();
      setEva({ key, loading: false, error: e instanceof Error ? e.message : '评审失败', review: '' });
    }
  };

  const group = PROMPT_GROUPS.find((g) => g.id === selectedGroup) ?? PROMPT_GROUPS[0];
  const groupKeys = group.keys;

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="bg-white rounded-xl border border-slate-200 p-3 md:col-span-1">
        <h2 className="font-medium text-slate-900 px-2 py-1.5 text-sm">提示词（按功能分组）</h2>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto">
          {PROMPT_GROUPS.map((g) => (
            <div key={g.id}>
              <button
                onClick={() => setSelectedGroup(g.id)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedGroup === g.id ? 'bg-primary-50 text-primary-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {g.label}
              </button>
              <div className="mt-0.5 space-y-0.5 pl-3">
                {g.keys.map(({ key, label }) => {
                  const v = entryOf(key)?.version ?? 0;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedGroup(g.id)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors ${
                        selectedGroup === g.id ? 'text-primary-600' : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <span className={v > 0 ? 'font-medium text-slate-700' : 'text-slate-500'}>{label}</span>
                        <span className={`px-1 py-px rounded text-[10px] ${v > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                          {v > 0 ? `v${v}` : '默认'}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="md:col-span-2 space-y-4">
        <h2 className="font-medium text-slate-900 text-lg">{group.label}</h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {msg && <p className="text-green-600 text-sm">{msg}</p>}

        {groupKeys.map(({ key, label }) => {
          const v = entryOf(key)?.version ?? 0;
          const isSaving = savingKey === key;
          const isEvaKey = eva?.key === key;
          const versions = versionsMap[key] ?? [];
          return (
            <div key={key} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <div>
                  <h3 className="font-medium text-slate-900 text-sm">
                    {label}
                    <span className="ml-2 text-xs font-normal text-slate-400">{key}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {v === 0 ? '内置默认（保存并发布为 v1）' : `当前 v${v}`}
                    {' · '}支持 {'{role}'} {'{jd}'} {'{resume}'} 等占位符
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void toggleHistory(key)}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs"
                  >
                    历史
                  </button>
                  <button
                    onClick={() => void runEva(key)}
                    disabled={isEvaKey && eva?.loading}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isEvaKey && eva?.loading
                        ? 'bg-violet-100 text-violet-500 cursor-wait'
                        : 'bg-violet-600 hover:bg-violet-700 text-white'
                    }`}
                  >
                    {isEvaKey && eva?.loading ? 'Eva 评审中...' : 'Eva 评审'}
                  </button>
                  <button
                    onClick={() => void save(key)}
                    disabled={isSaving || !drafts[key]?.trim()}
                    className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium"
                  >
                    {isSaving ? '保存中...' : '保存并发布'}
                  </button>
                </div>
              </div>
              <textarea
                value={drafts[key] ?? contentOf(key)}
                onChange={(e) => setDrafts((prev) => ({ ...prev, [key]: e.target.value }))}
                rows={14}
                spellCheck={false}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary-500 bg-slate-50"
              />

              {isEvaKey && eva && (
                <div className="mt-3 border border-violet-200 bg-violet-50/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-violet-800">Eva 评审报告 · {key}</h4>
                    <button
                      onClick={() => setEva(null)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      关闭
                    </button>
                  </div>
                  {eva.loading ? (
                    <p className="text-sm text-violet-600 flex items-center gap-2">
                      <span className="inline-block w-3 h-3 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
                      Eva 正在评审该提示词（约 10-30 秒）...
                    </p>
                  ) : eva.error ? (
                    <p className="text-sm text-red-500">{eva.error}</p>
                  ) : (
                    <MiniMarkdown source={eva.review} />
                  )}
                </div>
              )}

              {historyOpen === key && (
                <div className="mt-3 border border-slate-100 rounded-lg p-3">
                  <h4 className="text-xs font-medium text-slate-500 mb-2">版本历史（点击回滚）</h4>
                  {versions.length === 0 ? (
                    <p className="text-xs text-slate-400">暂无历史版本（内置默认值未发布过）</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {versions.map((ver) => (
                        <div key={ver.version} className="flex items-start gap-3 border border-slate-100 rounded-lg p-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs whitespace-nowrap">v{ver.version}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-400 mb-1">
                              {ver.action === 'rollback' ? '回滚' : ver.action === 'create' ? '创建' : '更新'}
                              {' · '}{new Date(ver.created_at).toLocaleString('zh-CN')}
                            </p>
                            <p className="text-xs text-slate-500 font-mono whitespace-pre-wrap line-clamp-3">{ver.content}</p>
                          </div>
                          <button
                            onClick={() => void rollback(key, ver.version)}
                            className="text-xs text-primary-600 hover:text-primary-800 whitespace-nowrap"
                          >
                            回滚
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
