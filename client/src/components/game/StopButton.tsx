import React from 'react';
import { cn } from '../../lib/utils';
import { Hand } from 'lucide-react';

interface StopButtonProps {
  onStop: () => void;
  disabled: boolean;
  isLocked: boolean;
}

export const StopButton: React.FC<StopButtonProps> = ({ onStop, disabled, isLocked }) => {
  
  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-surface-light rounded-2xl border border-white/10 opacity-80">
        <Hand className="w-8 h-8 mb-2 text-danger" />
        <span className="font-heading font-bold text-xl text-white">ROUND STOPPED</span>
      </div>
    );
  }

  return (
    <button
      disabled={disabled}
      onClick={onStop}
      className={cn(
        "relative flex flex-col items-center justify-center w-40 h-40 rounded-full font-heading font-black text-3xl tracking-widest transition-all duration-300",
        !disabled 
          ? "bg-danger text-white hover:bg-red-600 shadow-2xl shadow-danger/50 hover:scale-105 active:scale-95 animate-pulse-stop cursor-pointer border-4 border-red-400"
          : "bg-surface-light text-text-secondary border-4 border-surface shadow-none cursor-not-allowed opacity-50"
      )}
    >
      <span className="drop-shadow-md">STOP</span>
      {!disabled && (
        <span className="absolute bottom-6 text-xs font-medium uppercase tracking-normal opacity-80">
          Press to lock
        </span>
      )}
    </button>
  );
};
