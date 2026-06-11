import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    
    const variants = {
      default: 'bg-surface border border-white/5',
      elevated: 'bg-surface shadow-xl shadow-black/40 border border-white/10',
      interactive: 'bg-surface border border-white/5 hover:border-white/20 transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer',
      glass: 'glass',
    };
    
    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    return (
      <div
        ref={ref}
        className={cn('rounded-xl overflow-hidden', variants[variant], paddings[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';
