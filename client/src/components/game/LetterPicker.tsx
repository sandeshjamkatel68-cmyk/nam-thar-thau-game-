import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

interface LetterPickerProps {
  letters: string[];
  usedLetters?: string[];
  onPick: (letter: string) => void;
  disabled?: boolean;
}

export const LetterPicker: React.FC<LetterPickerProps> = ({ letters, usedLetters = [], onPick, disabled }) => {
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);

  const handlePick = (letter: string, index: number) => {
    if (disabled || usedLetters.includes(letter)) return;
    setPickedIndex(index);
    // Give a slight delay for the animation before firing
    setTimeout(() => {
      onPick(letter);
    }, 400);
  };

  return (
    <div className="grid grid-cols-5 sm:grid-cols-6 gap-3 max-w-2xl mx-auto">
      {letters.map((letter, i) => {
        const isUsed = usedLetters.includes(letter);
        return (
          <button
            key={i}
            disabled={disabled || pickedIndex !== null || isUsed}
            onClick={() => handlePick(letter, i)}
            title={isUsed ? `${letter} has already been used this game` : undefined}
            className={cn(
              "relative aspect-square rounded-xl flex items-center justify-center text-2xl sm:text-3xl font-heading font-bold shadow-lg transition-all duration-300 transform",
              pickedIndex === i
                ? "bg-primary text-white scale-110 shadow-primary/50"
                : "bg-surface-light text-text-secondary hover:bg-surface hover:text-white hover:-translate-y-1 border border-white/5 hover:border-white/20",
              isUsed && "opacity-30 cursor-not-allowed hover:translate-y-0 hover:bg-surface-light hover:text-text-secondary",
              disabled && pickedIndex !== i && !isUsed && "opacity-50 cursor-not-allowed hover:translate-y-0"
            )}
          >
            {letter}
            {isUsed && (
              <X className="w-full h-full absolute inset-0 p-2 text-danger" strokeWidth={3} />
            )}
          </button>
        );
      })}
    </div>
  );
};
