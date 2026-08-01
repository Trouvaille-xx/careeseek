import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({ children, className = '', padding = 'md', style }: CardProps) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm dark:bg-neutral-800 dark:border-neutral-700 ${paddings[padding]} ${className}`} style={style}>
      {children}
    </div>
  );
}
