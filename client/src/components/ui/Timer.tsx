import React from 'react';
import { cn } from '../../lib/utils';

interface TimerProps {
  remaining: number;
  progress: number;
  isUrgent: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Timer: React.FC<TimerProps> = ({ remaining, progress, isUrgent, size = 'md', className }) => {
  const sizes = {
    sm: { size: 60, stroke: 4, text: 'text-sm' },
    md: { size: 80, stroke: 6, text: 'text-xl' },
    lg: { size: 120, stroke: 8, text: 'text-3xl' },
  };

  const { size: sqSize, stroke, text } = sizes[size];
  const radius = (sqSize - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  const colorClass = isUrgent 
    ? 'text-danger' 
    : progress > 0.5 ? 'text-warning' : 'text-success';

  return (
    <div className={cn("relative flex items-center justify-center", isUrgent && "animate-pulse", className)}>
      <svg
        width={sqSize}
        height={sqSize}
        viewBox={`0 0 ${sqSize} ${sqSize}`}
        className="transform -rotate-90"
      >
        <circle
          cx={sqSize / 2}
          cy={sqSize / 2}
          r={radius}
          strokeWidth={stroke}
          className="stroke-surface-light fill-none"
        />
        <circle
          cx={sqSize / 2}
          cy={sqSize / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn("fill-none transition-all duration-1000 ease-linear", colorClass)}
          strokeLinecap="round"
        />
      </svg>
      <div className={cn("absolute font-heading font-bold text-white", text)}>
        {remaining}
      </div>
    </div>
  );
};
