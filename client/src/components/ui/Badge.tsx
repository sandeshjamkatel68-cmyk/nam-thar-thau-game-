import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'host' | 'winner' | 'rank' | 'default';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className }) => {
  const variants = {
    host: 'bg-accent/20 text-accent border border-accent/30',
    winner: 'bg-success/20 text-success border border-success/30',
    rank: 'bg-surface-light text-white border border-white/10',
    default: 'bg-surface-light text-text-secondary',
  };

  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider inline-flex items-center", variants[variant], className)}>
      {children}
    </span>
  );
};
