import { useAppStore, getProxyBase } from '@/stores/useAppStore';

/**
 * 提示词覆盖存储（服务端管理后台可修改）。
 * - 启动时（App.tsx）调用 loadPromptOverrides() 拉取服务端覆盖，缓存到 localStorage。
 * - prompts.ts 的模板渲染函数每次调用时先查这里，无覆盖则用内置默认值。
 * - 未登录或请求失败时静默回退默认值（不阻塞主流程）。
 */

const STORAGE_KEY = 'careeseek-prompt-overrides';
const REFRESH_MS = 30 * 60 * 1000; // 30 分钟刷新一次

let overrides: Record<string, string> = {};
let lastLoadMs = 0;
let loadInFlight: Promise<void> | null = null;

export function loadOverridesFromCache(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as { ts: number; prompts: Record<string, string> };
      if (data && typeof data.prompts === 'object') {
        overrides = data.prompts;
        lastLoadMs = data.ts ?? 0;
      }
    }
  } catch {
    // 缓存损坏则忽略，走默认值
  }
}

export function getPromptOverride(key: string): string | undefined {
  return overrides[key];
}

export function hasPromptOverrides(): boolean {
  return Object.keys(overrides).length > 0;
}

/** 拉取服务端提示词覆盖（登录后调用；失败静默）。返回是否成功。 */
export async function loadPromptOverrides(force = false): Promise<boolean> {
  const state = useAppStore.getState();
  const token = state.auth.token;
  if (!token) {
    overrides = {};
    return false;
  }
  if (!force && loadInFlight) {
    return loadInFlight.then(() => true);
  }
  if (!force && Date.now() - lastLoadMs < REFRESH_MS && hasPromptOverrides()) {
    return true;
  }

  loadInFlight = (async () => {
    try {
      const res = await fetch(`${getProxyBase()}/prompts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`prompts ${res.status}`);
      const data = (await res.json()) as { prompts?: { key: string; content: string }[] };
      const map: Record<string, string> = {};
      for (const p of data.prompts ?? []) {
        if (p && typeof p.key === 'string' && typeof p.content === 'string') {
          map[p.key] = p.content;
        }
      }
      overrides = map;
      lastLoadMs = Date.now();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: lastLoadMs, prompts: map }));
      } catch {
        // localStorage 满则忽略缓存
      }
    } catch {
      // 拉取失败保留缓存/默认值，静默
    }
  })();

  try {
    await loadInFlight;
    return true;
  } finally {
    loadInFlight = null;
  }
}
