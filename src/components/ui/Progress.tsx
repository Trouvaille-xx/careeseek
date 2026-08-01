import React from 'react';

interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const variantColors: Record<string, string> = {
  default: 'bg-primary-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
};

const sizeHeights: Record<string, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export function Progress({
  value,
  max = 100,
  size = 'md',
  showLabel = false,
  className = '',
  variant = 'default',
}: ProgressProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`flex-1 bg-slate-100 rounded-full overflow-hidden dark:bg-neutral-800 ${sizeHeights[size]}`}>
        <div
          className={`${sizeHeights[size]} ${variantColors[variant]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-semibold text-slate-700 tabular-nums min-w-[3ch] text-right dark:text-neutral-300">
          {Math.round(pct)}
        </span>
      )}
    </div>
  );
}
