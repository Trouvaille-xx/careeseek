import { useAppStore, getProxyBase } from '@/stores/useAppStore';

/**
 * 提示词覆盖存储，分两层：
 * - 官方覆盖（服务端管理后台可修改）：启动时（App.tsx）调用 loadPromptOverrides() 拉取，缓存到 localStorage。
 * - 个人覆盖（本机用户在「设置 › 提示词管理」里自定义）：存在 useAppStore.promptOverrides，随应用一起持久化。
 *
 * prompts.ts 的模板渲染函数每次调用时先查这里。优先级：个人 > 官方 > 内置默认。
 * 未登录或请求失败时静默回退默认值（不阻塞主流程）。
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

/** 本机用户在设置里保存的个人覆盖（空串视作未覆盖）。 */
export function getUserOverride(key: string): string | undefined {
  const v = useAppStore.getState().promptOverrides?.[key];
  return v && v.trim() ? v : undefined;
}

/** 官方（服务端管理后台）下发的覆盖。 */
export function getServerOverride(key: string): string | undefined {
  return overrides[key];
}

/** 生效的覆盖值：个人优先，其次官方。无覆盖返回 undefined（由调用方回退内置默认）。 */
export function getPromptOverride(key: string): string | undefined {
  return getUserOverride(key) ?? getServerOverride(key);
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
