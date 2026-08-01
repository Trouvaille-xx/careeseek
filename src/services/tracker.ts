import { useAppStore } from '@/stores/useAppStore';
import { getProxyBase } from '@/stores/useAppStore';
import type { TrackProps } from '@/types';

/**
 * 埋点 SDK：仅记录过程（事件名 + 数字/枚举 props），禁 PII/简历内容。
 * - 批量：满 10 条或 5s 上报一次
 * - 离线缓冲：localStorage（上限 200 条，溢出丢最旧）
 * - 静默失败：任何错误不抛、不污染业务
 * - 未登录不上报
 */

const QUEUE_KEY = 'careeseek-track-queue';
const FLUSH_INTERVAL_MS = 5000;
const BATCH_SIZE = 10;
const MAX_BUFFER = 200;

let queue: { name: string; props: TrackProps; ts: number }[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

const sessionId = typeof crypto !== 'undefined' && crypto.randomUUID
  ? crypto.randomUUID()
  : `sess-${Date.now().toString(36)}`;

function loadBuffer(): { name: string; props: TrackProps; ts: number }[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveBuffer(): void {
  try {
    if (queue.length === 0) localStorage.removeItem(QUEUE_KEY);
    else localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-MAX_BUFFER)));
  } catch {
    // localStorage 满/不可用 → 丢弃缓冲
  }
}

async function flush(): Promise<void> {
  if (timer) { clearTimeout(timer); timer = null; }
  if (queue.length === 0) return;
  const { auth } = useAppStore.getState();
  if (!auth.token) {
    queue = [];
    saveBuffer();
    return;
  }
  const batch = queue;
  queue = [];
  saveBuffer();
  try {
    const res = await fetch(`${getProxyBase()}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}`, 'x-session-id': sessionId },
      body: JSON.stringify({ events: batch }),
    });
    if (!res.ok) {
      // 失败（如 401/400）→ 重新入队（限上限），下次 flush 重试
      queue = [...batch, ...queue].slice(-MAX_BUFFER);
      saveBuffer();
    }
  } catch {
    queue = [...batch, ...queue].slice(-MAX_BUFFER);
    saveBuffer();
  }
}

function schedule(): void {
  if (timer) return;
  timer = setTimeout(() => { void flush(); }, FLUSH_INTERVAL_MS);
}

/** 上报一个事件（仅记录过程；未登录或非法 props 直接丢弃） */
export function track(name: string, props: TrackProps = {}): void {
  // 白名单校验（前端防御，服务端仍会校验）
  const validProps: TrackProps = {};
  for (const [k, v] of Object.entries(props)) {
    if (typeof v === 'number' && Number.isFinite(v)) validProps[k] = v;
    else if (typeof v === 'string') validProps[k] = v;
    else return; // 非法值 → 丢弃整个事件
  }
  queue.push({ name, props: validProps, ts: Date.now() });
  if (queue.length >= BATCH_SIZE) {
    void flush();
  } else {
    schedule();
  }
}

/** 页面关闭前尽力冲刷 */
export function flushTrackNow(): void {
  void flush();
}

/** 恢复离线缓冲（应用启动时调用） */
export function initTracker(): void {
  const pending = loadBuffer();
  if (pending.length > 0) {
    queue = pending;
    void flush();
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => { void flush(); });
  }
}
