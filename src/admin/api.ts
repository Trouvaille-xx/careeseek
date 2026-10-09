/** 管理后台 API 封装（同域 /v1；admin token 存 localStorage，与主应用隔离） */

const ADMIN_TOKEN_KEY = 'careeseek-admin-token';
const BASE = '/v1';

/**
 * 主应用内嵌使用时的 token 覆盖。
 * 管理后台独立 bundle 用 careeseek-admin-token；主应用里用户已登录，直接复用会话 token
 * （后端 getPromptAdmin 会校验 role + 邮箱白名单，因此复用不会绕过权限）。
 */
let tokenOverride: string | null = null;

export function setAdminApiTokenOverride(token: string | null): void {
  tokenOverride = token;
}

export function getAdminToken(): string {
  return tokenOverride ?? localStorage.getItem(ADMIN_TOKEN_KEY) ?? '';
}

export function setAdminToken(token: string): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (res.status === 401 || res.status === 403) {
    throw new ApiError(res.status, '无权限，请先登录');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, (data as { error?: string }).error || `请求失败 (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export interface AuthUser {
  id: string;
  email: string;
  plan: string;
  role: string;
}

export async function adminLogin(email: string, password: string): Promise<AuthUser> {
  const data = await request<{ token: string; user: AuthUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data.user.role !== 'admin') {
    throw new ApiError(403, '该账号无管理权限');
  }
  setAdminToken(data.token);
  return data.user;
}

export interface Overview {
  total_users: number;
  new_users_today: number;
  paid_users: number;
  active_users_7d: number;
  revenue_cny: number;
  llm_today: { requests: number; tokens: number; cost_cny: number };
  llm_total: { requests: number; tokens: number; cost_cny: number };
  points_consumed_month: number;
}

export interface TrendPoint {
  day: string;
  dau: number;
  requests: number;
  tokens: number;
  cost_cny: number;
  new_users: number;
}

export interface FunnelData {
  days: number;
  byName: { name: string; c: number }[];
  analysisStepCompleted: { step: number; count: number }[];
}

export interface AdminUser {
  id: string;
  email: string;
  plan: string;
  plan_expires_at: number | null;
  role: string;
  created_at: number;
  points_used_month: number;
  last_seen: number | null;
}

export interface PromptEntry {
  key: string;
  content: string;
  version: number;
  updated_by: string | null;
  updated_at: number;
}

export interface PromptVersion {
  version: number;
  content: string;
  action: string;
  created_by: string | null;
  created_at: number;
}

export const getOverview = () => request<Overview>('/admin/stats/overview');
export const getTrend = (days: number) => request<{ days: number; series: TrendPoint[] }>(`/admin/stats/trend?days=${days}`);
export const getFunnel = (days: number) => request<FunnelData>(`/admin/stats/funnel?days=${days}`);
export const getUsers = (q = '', plan = '') => {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (plan) params.set('plan', plan);
  return request<{ total: number; users: AdminUser[] }>(`/admin/users?${params.toString()}`);
};
export const patchUser = (id: string, body: { plan?: string; role?: string }) =>
  request<{ ok: boolean }>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) });

export const getPrompts = () =>
  request<{ prompts: PromptEntry[]; allowedKeys: string[] }>('/admin/prompts');
export const putPrompt = (key: string, content: string) =>
  request<{ key: string; version: number; updated_at: number }>(`/admin/prompts/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
export const getPromptVersions = (key: string) =>
  request<{ versions: PromptVersion[] }>(`/admin/prompts/${key}/versions`);
export const rollbackPrompt = (key: string, version: number) =>
  request<{ key: string; version: number; updated_at: number }>(`/admin/prompts/${key}/rollback`, {
    method: 'POST',
    body: JSON.stringify({ version }),
  });

export interface EvaReview {
  key: string;
  review: string;
}

/** Eva 评审：用上游 LLM 评审单条提示词（非流式，最长约 90s） */
export const evaReview = (key: string, content: string) =>
  request<EvaReview>('/admin/eva/review', {
    method: 'POST',
    body: JSON.stringify({ key, content }),
  });
