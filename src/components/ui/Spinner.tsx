import { useState, useEffect } from 'react';

const TIPS = [
  'CareeSeek 支持上传 PDF、Word、Markdown、JSON 和图片格式的简历与 JD',
  '在"简历库"中维护教育背景、工作经历等项目，分析时可直接引用',
  '完成分析后可在步骤 8 将优化结果一键同步到简历库',
  '在侧边栏设置中可配置自定义 API 地址和模型',
  '追问环节支持多轮对话，填写后可生成优化简历表达',
  '简历优化支持 4 种风格：更简洁、降低夸张、偏 AI 产品、偏 ToB SaaS',
  '模拟面试提供真实面试和学习模式两种选择',
  '每次分析完成后，系统自动保存到历史记录，可随时继续',
  '侧边栏可展开/收起，为工作区提供更大空间',
  '点击"使用示例数据"可快速体验完整分析流程',
  '最终简历支持一键复制到剪贴板',
  '面试准备模块生成 10 个可能追问和自我介绍脚本',
  '历史分析记录按时间排序，未完成的也可随时继续',
  '所有数据存储在浏览器本地，不会上传到外部服务器',
];

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin h-5 w-5 text-primary-600 ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function useRotatingTip(): string {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % TIPS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);
  return TIPS[index];
}

export function PageLoading({ text = 'AI 分析中' }: { text?: string }) {
  const tip = useRotatingTip();

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
      <div className="relative">
        <Spinner className="h-10 w-10" />
        <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary-500 rounded-full animate-ping" />
      </div>
      <div className="flex items-center gap-1">
        <p className="text-sm text-slate-500">{text}</p>
        <span className="inline-flex">
          <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce ml-0.5" style={{ animationDelay: '150ms' }} />
          <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce ml-0.5" style={{ animationDelay: '300ms' }} />
        </span>
      </div>
      <div className="max-w-sm text-center mt-4 px-6 py-3 bg-slate-50 rounded-xl border border-slate-100 animate-fade-in">
        <p className="text-xs text-slate-500 leading-relaxed">{tip}</p>
      </div>
    </div>
  );
}

export function SectionLoading({ text = '加载中...' }: { text?: string }) {
  const tip = useRotatingTip();

  return (
    <div className="flex flex-col items-center gap-3 py-8 text-slate-400 animate-fade-in">
      <div className="flex items-center gap-3">
        <Spinner className="h-4 w-4" />
        <span className="text-sm">{text}</span>
      </div>
      <p className="text-[11px] text-slate-400 max-w-md text-center">{tip}</p>
    </div>
  );
}
