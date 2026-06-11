import React from 'react';
import { Category, CATEGORY_ICONS, CATEGORY_LABELS } from 'shared/types';
import { Input } from '../ui/Input';
import { Check, X } from 'lucide-react';

interface CategoryInputProps {
  category: Category;
  letter: string;
  value: string;
  onChange: (value: string) => void;
  locked: boolean;
}

export const CategoryInput: React.FC<CategoryInputProps> = ({ category, letter, value, onChange, locked }) => {
  const isFilled = value.trim().length > 0;
  const startsWithCorrectLetter = value.trim().toLowerCase().startsWith(letter.toLowerCase());
  
  const isValid = isFilled && startsWithCorrectLetter;
  const isInvalid = isFilled && !startsWithCorrectLetter;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full bg-surface-light/30 p-3 rounded-xl border border-white/5">
      <div className="flex items-center gap-2 w-full sm:w-48 shrink-0 pl-1">
        <span className="text-xl">{CATEGORY_ICONS[category]}</span>
        <span className="font-medium text-text-secondary">{CATEGORY_LABELS[category]}</span>
      </div>
      
      <div className="relative w-full">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={locked}
          placeholder={`Enter a ${category}...`}
          className="w-full bg-surface"
          success={isValid}
          error={isInvalid}
        />
        
        {isFilled && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid ? (
              <Check className="w-5 h-5 text-success" />
            ) : (
              <X className="w-5 h-5 text-danger" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
