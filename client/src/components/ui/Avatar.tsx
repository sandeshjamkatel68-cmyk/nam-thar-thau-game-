import React from 'react';
import { cn } from '../../lib/utils';

interface AvatarProps {
  name: string;
  color: string;
  isConnected?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, color, isConnected = true, size = 'md', className }) => {
  const initials = name ? name.substring(0, 2).toUpperCase() : '?';
  
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  };

  return (
    <div className="relative inline-block">
      <div 
        className={cn("rounded-full flex items-center justify-center font-bold text-white shadow-md border-2 border-surface font-heading", sizes[size], className)}
        style={{ backgroundColor: color }}
      >
        {initials}
      </div>
      {isConnected !== undefined && (
        <div 
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-surface w-3 h-3",
            isConnected ? "bg-success" : "bg-muted"
          )}
        />
      )}
    </div>
  );
};
