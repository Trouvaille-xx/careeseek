import React from 'react';

type BadgeVariant = 'default' | 'green' | 'yellow' | 'orange' | 'red' | 'amber' | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700',
  green: 'bg-emerald-50 text-emerald-700',
  yellow: 'bg-amber-50 text-amber-700',
  orange: 'bg-orange-50 text-orange-700',
  red: 'bg-red-50 text-red-700',
  amber: 'bg-amber-50 text-amber-700',
  purple: 'bg-purple-50 text-purple-700',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}
