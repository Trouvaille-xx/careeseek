import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Brand';
import { PlansDialog } from '@/components/ui/PlansDialog';
import { track } from '@/services/tracker';
import { useState } from 'react';

/**
 * 产品落地页（未登录新访客的首页）
 * 结构：Hero → 8 步流程 → 功能卖点 → 定价 → 隐私承诺 → CTA
 */
export function LandingPage() {
  const { auth, setCurrentStep, fetchPlans } = useAppStore();
  const [showPlans, setShowPlans] = useState(false);

  const handleStart = () => {
    useAppStore.getState().setLandingSeen(true);
    if (auth.token) {
      useAppStore.getState().newAnalysis();
    } else {
      setCurrentStep(1);
    }
  };

  const handlePlans = () => {
    void fetchPlans();
    setShowPlans(true);
  };

  return (
    <div className="animate-fade-in">
      {/* ===== 顶部导航（独立于应用壳） ===== */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-950/80 backdrop-blur border-b border-slate-100 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo className="w-5 h-5 text-slate-900 dark:text-neutral-100" />
            <span className="text-sm font-semibold text-slate-900 dark:text-neutral-100">CareeSeek</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlans}
              className="px-3 py-1.5 rounded-lg text-sm text-slate-500 dark:text-neutral-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition-colors"
            >
              定价
            </button>
            {auth.token ? (
              <button
                onClick={() => setCurrentStep(0)}
                className="px-4 py-1.5 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                进入工作台
              </button>
            ) : (
              <Button size="sm" onClick={() => { useAppStore.getState().setLandingSeen(true); setCurrentStep(-5); }}>
                登录 / 注册
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="text-center py-16 md:py-24 px-4">
        <div className="inline-flex items-center gap-1.5 text-xs text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 rounded-full px-3 py-1 mb-6">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
          </svg>
          AI 简历工作台
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-neutral-100 tracking-tight mb-5 max-w-2xl mx-auto leading-tight">
          一份简历，<span className="text-primary-600 dark:text-primary-400">对标每一份 JD</span>
        </h1>
        <p className="text-base md:text-lg text-slate-500 dark:text-neutral-400 max-w-xl mx-auto mb-8 leading-relaxed">
          粘贴目标岗位 JD 和你的简历，AI 深度解析岗位要求、诊断匹配度、
          逐条优化表达、模拟面试演练，最终产出可直接投递的 PDF 简历。
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button size="lg" onClick={handleStart}>
            免费开始分析
            <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Button>
          <Button variant="outline" size="lg" onClick={handlePlans}>
            查看套餐
          </Button>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-4">
          {auth.token ? '登录状态已就绪' : '无需注册也可体验（使用自备 API Key）'} · 简历数据仅存本地浏览器
        </p>
      </section>

      {/* ===== 8-step flow ===== */}
      <section className="py-12 px-4 bg-slate-50 dark:bg-neutral-900/40 rounded-2xl mx-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-neutral-100 text-center mb-2">8 步完成一份定向简历</h2>
        <p className="text-sm text-slate-500 dark:text-neutral-400 text-center mb-8">从 JD 解析到面试模拟，全流程 AI 驱动</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {[
            { n: '01', t: '输入 JD 与简历', d: '粘贴岗位 JD 和现有简历，或上传文件' },
            { n: '02', t: 'JD 深度解析', d: '提取核心要求、隐藏需求与关键词' },
            { n: '03', t: '简历诊断', d: '匹配度评分 + ATS 机器可读性检测' },
            { n: '04', t: '逐条匹配分析', d: '每段经历与岗位要求逐条对照' },
            { n: '05', t: '追问补强', d: '针对薄弱点补全关键经历细节' },
            { n: '06', t: 'AI 逐条优化', d: '每一条经历改写为量化成果表达' },
            { n: '07', t: '生成最终简历', d: '结构化排版，一键导出 PDF' },
            { n: '08', t: '面试模拟', d: '基于岗位的模拟问答 + 评分反馈' },
          ].map((s) => (
            <div key={s.n} className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700 p-5">
              <span className="text-[11px] font-semibold text-primary-600 dark:text-primary-300">{s.n}</span>
              <h3 className="text-sm font-medium text-slate-900 dark:text-neutral-100 mt-1 mb-1">{s.t}</h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Features ===== */}
      <section className="py-14 px-4 max-w-5xl mx-auto">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-neutral-100 text-center mb-8">不止于润色</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />,
              t: 'JD 定向匹配', d: '每份简历针对一个具体岗位生成，匹配度评分可视化',
            },
            {
              icon: <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />,
              t: '逐条可编辑', d: 'AI 每一条改写都附理由与风险提示，手动修改随时还原',
            },
            {
              icon: <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0 0 10 9.87v4.263a1 1 0 0 0 1.555.832l3.197-2.132a1 1 0 0 0 0-1.664Z" />,
              t: '面试模拟', d: '真实面试节奏，逐题反馈 + 综合评分，上场前查漏补缺',
            },
            {
              icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.688c0-.547.305-1.051.793-1.306l7.5-3.938a1.5 1.5 0 0 1 1.414 0l7.5 3.938c.488.255.793.759.793 1.306v6.626a1.5 1.5 0 0 1-.793 1.306l-7.5 3.938a1.5 1.5 0 0 1-1.414 0L3.793 16.62A1.5 1.5 0 0 1 3 15.314V8.688ZM3 8.25l9 4.5m0 0 9-4.5m-9 4.5V21" />,
              t: '投递跟踪', d: '从投递到 offer 全程看板管理，面试/笔试节点跟进',
            },
            {
              icon: <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" />,
              t: '简历库 + 制作器', d: '沉淀每份优化产物，多模板排版，导出 PDF/JSON',
            },
            {
              icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />,
              t: '本地优先', d: '简历内容只存你的浏览器，不上传任何服务器',
            },
          ].map((f) => (
            <div key={f.t} className="rounded-xl border border-slate-200 dark:border-neutral-700 p-5">
              <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-primary-600 dark:text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>{f.icon}</svg>
              </div>
              <h3 className="text-sm font-medium text-slate-900 dark:text-neutral-100 mb-1">{f.t}</h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Pricing ===== */}
      <section className="py-12 px-4 bg-slate-50 dark:bg-neutral-900/40 rounded-2xl mx-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-neutral-100 text-center mb-2">简单透明的定价</h2>
        <p className="text-sm text-slate-500 dark:text-neutral-400 text-center mb-8">按云端 AI 额度订阅，一份人工代改的钱用一整季</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700 p-6 text-center">
            <h3 className="text-sm font-medium text-slate-900 dark:text-neutral-100">免费版</h3>
            <p className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-2">¥0</p>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 mb-4">1000 积分</p>
            <p className="text-xs text-slate-500 dark:text-neutral-400">约 1 次完整分析<br />体验核心功能</p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-xl border-2 border-primary-400 dark:border-primary-600 p-6 text-center shadow-lg shadow-primary-500/5 relative">
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] text-white bg-primary-500 px-2 py-0.5 rounded-full">最受欢迎</span>
            <h3 className="text-sm font-medium text-slate-900 dark:text-neutral-100">Pro</h3>
            <p className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-2">¥19<span className="text-xs text-slate-400 font-normal">/月</span></p>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 mb-4">5000 积分</p>
            <p className="text-xs text-slate-500 dark:text-neutral-400">典型求职季用量 5 倍余量<br />多岗位并行分析</p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700 p-6 text-center">
            <h3 className="text-sm font-medium text-slate-900 dark:text-neutral-100">Power</h3>
            <p className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-2">¥49<span className="text-xs text-slate-400 font-normal">/月</span></p>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 mb-4">50000 积分</p>
            <p className="text-xs text-slate-500 dark:text-neutral-400">重度使用不限量迭代<br />适合长期多目标求职</p>
          </div>
        </div>
        <div className="text-center mt-6">
          <Button variant="outline" size="md" onClick={handlePlans}>查看全部套餐详情</Button>
        </div>
      </section>

      {/* ===== Privacy ===== */}
      <section className="py-14 px-4 max-w-3xl mx-auto text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-neutral-100 mb-2">你的简历，只有你看得到</h2>
        <p className="text-sm text-slate-500 dark:text-neutral-400 leading-relaxed max-w-lg mx-auto">
          简历内容只保存在你的浏览器本地，永远不会上传到我们的服务器。
          云端仅记录用量与匿名使用统计（不包含任何简历内容），
          你可以随时导出/导入自己的数据。
        </p>
      </section>

      {/* ===== Final CTA ===== */}
      <section className="pb-16 px-4 text-center">
        <Button size="lg" onClick={handleStart}>
          立即开始第一份定向简历
          <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
          </svg>
        </Button>
      </section>

      {/* Plans dialog */}
      <PlansDialog open={showPlans} onClose={() => setShowPlans(false)} />
    </div>
  );
}
