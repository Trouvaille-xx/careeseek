import React from 'react';

type BadgeVariant = 'default' | 'green' | 'yellow' | 'orange' | 'red' | 'amber' | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700 dark:bg-neutral-700 dark:text-neutral-300',
  green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  yellow: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  orange: 'bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  red: 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  purple: 'bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}
