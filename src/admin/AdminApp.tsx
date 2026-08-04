import { useCallback, useEffect, useState } from 'react';
import {
  ApiError, adminLogin, clearAdminToken, getAdminToken,
} from './api';
import { DashboardView } from './views/DashboardView';
import { UsersView } from './views/UsersView';
import { PromptsView } from './views/PromptsView';

type Tab = 'dashboard' | 'users' | 'prompts';

function AdminApp() {
  const [loggedIn, setLoggedIn] = useState(() => getAdminToken().length > 0);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      await adminLogin(email.trim(), password);
      setLoggedIn(true);
    } catch (err) {
      setLoginError(err instanceof ApiError ? err.message : '登录失败');
    } finally {
      setLoggingIn(false);
    }
  };

  const logout = () => {
    clearAdminToken();
    setLoggedIn(false);
  };

  const onUnauthorized = useCallback(() => {
    clearAdminToken();
    setLoggedIn(false);
  }, []);

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-xl font-semibold text-center mb-1">CareeSeek 管理后台</h1>
          <p className="text-sm text-slate-400 text-center mb-6">仅管理员账号可登录</p>
          <form onSubmit={doLogin} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="管理员邮箱"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {loginError && <p className="text-xs text-red-500">{loginError}</p>}
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {loggingIn ? '登录中...' : '登录'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'dashboard', label: '数据看板' },
    { id: 'users', label: '用户管理' },
    { id: 'prompts', label: '提示词管理' },
  ];

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-slate-900">CareeSeek 管理后台</span>
            <nav className="flex gap-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    tab === t.id
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </div>
          <button
            onClick={logout}
            className="text-sm text-slate-400 hover:text-slate-700"
          >
            退出登录
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {tab === 'dashboard' && <DashboardView onUnauthorized={onUnauthorized} />}
        {tab === 'users' && <UsersView onUnauthorized={onUnauthorized} />}
        {tab === 'prompts' && <PromptsView onUnauthorized={onUnauthorized} />}
      </main>
    </div>
  );
}

export default AdminApp;
