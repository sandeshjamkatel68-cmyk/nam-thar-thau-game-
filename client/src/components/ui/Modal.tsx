"use client";
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  preventClose?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, onClose, title, children, size = 'md', preventClose = false 
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !preventClose) {
      onClose();
    }
  };

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div 
        className={cn("w-full bg-surface border border-white/10 rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200", sizes[size])}
      >
        {(title || !preventClose) && (
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            {title && <h2 className="text-xl font-heading font-semibold text-white">{title}</h2>}
            {!preventClose && (
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-surface-light text-text-secondary hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
