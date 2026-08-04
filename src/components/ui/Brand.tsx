/**
 * CareeSeek 品牌 logo：单色简历卡片 + 对勾 mark。
 * 使用 currentColor —— 可随明暗主题/容器前景色自适应，无需额外配色。
 */
export function Logo({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {/* 简历卡片 */}
      <rect x="3" y="3.5" width="18" height="17" rx="3.5" />
      {/* 文本行 */}
      <path d="M8 9h8" />
      <path d="M8 12.5h5" />
      {/* 匹配对勾 */}
      <path d="m9 16.5 2 2 4-4.5" />
    </svg>
  );
}