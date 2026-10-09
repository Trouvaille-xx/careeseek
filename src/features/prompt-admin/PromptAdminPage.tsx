import { useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { canMaintainPrompts } from '@/config/promptAdmin';
import { setAdminApiTokenOverride } from '@/admin/api';
import { PromptsView } from '@/admin/views/PromptsView';

/**
 * 提示词维护页（主应用内嵌）。
 *
 * 复用管理后台的 PromptsView（按功能分组、版本历史、回滚、Eva 评审），只把鉴权换成主应用会话 token。
 * 双重控制：
 *   - 前端：用户菜单入口 + 本页渲染都要求 canMaintainPrompts（role=admin 且邮箱在白名单内）
 *   - 后端：/v1/admin/prompts* 由 getPromptAdmin 校验，隐藏入口不能绕过
 */
export function PromptAdminPage() {
  const { auth, setCurrentStep } = useAppStore();
  const allowed = canMaintainPrompts(auth.user);

  useEffect(() => {
    setAdminApiTokenOverride(auth.token || null);
    return () => setAdminApiTokenOverride(null);
  }, [auth.token]);

  if (!allowed) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-3 animate-fade-in">
        <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 dark:bg-neutral-800 flex items-center justify-center">
          <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <p className="text-sm text-slate-600 dark:text-neutral-300">该页面仅管理员可见</p>
        <p className="text-xs text-slate-400 dark:text-neutral-500">
          当前账号{auth.user ? `（${auth.user.email}）` : '（未登录）'}没有提示词维护权限
        </p>
        <button
          type="button"
          onClick={() => setCurrentStep(0)}
          className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-300"
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-primary-500 rounded-full" />
            提示词维护
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">
            按分析步骤分组编辑系统/用户提示词，保存即发布（登录用户会在 30 分钟内自动生效）；支持版本历史与回滚。
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCurrentStep(0)}
          className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          返回首页
        </button>
      </div>

      <PromptsView onUnauthorized={() => setCurrentStep(0)} />
    </div>
  );
}
