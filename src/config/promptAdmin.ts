/**
 * 提示词维护入口的可见性规则。
 *
 * 这只是「前端控制」：决定用户菜单里是否出现入口、页面是否渲染编辑器。
 * 真正的权限判断在后端（server/src/auth.ts 的 getPromptAdmin：role=admin + PROMPT_ADMIN_EMAILS）。
 * 前端隐藏入口 ≠ 有权限，直接调接口一样会被 401 拦下。
 *
 * 默认只放行一个管理员邮箱；需要多个时用 VITE_PROMPT_ADMIN_EMAILS（逗号分隔）覆盖。
 */
const RAW = (import.meta.env.VITE_PROMPT_ADMIN_EMAILS as string | undefined) ?? 'admin@example.com';

export const PROMPT_ADMIN_EMAILS: string[] = RAW
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export interface PromptAdminUser {
  email: string;
  role?: string;
}

/** 是否允许显示提示词维护入口 / 渲染维护页 */
export function canMaintainPrompts(user: PromptAdminUser | null | undefined): boolean {
  if (!user || user.role !== 'admin') return false;
  if (PROMPT_ADMIN_EMAILS.length === 0) return true;
  return PROMPT_ADMIN_EMAILS.includes(user.email.toLowerCase());
}
