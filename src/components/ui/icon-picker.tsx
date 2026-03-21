'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';

const ICONS = ['💼', '🏦', '💳', '💵', '🍔', '🚕', '🏠', '✈️', '🎮', '🛒', '🎓', '🏥', '🎉', '🐶', '❤️'];

interface IconPickerProps {
  icon: string;
  onChange: (icon: string) => void;
}

export function IconPicker({ icon, onChange }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm text-textMuted">Иконка</div>
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-background rounded-2xl flex items-center justify-center text-3xl hover:bg-white/5 transition-colors"
        >
          {icon || '🎯'}
        </button>
      </div>

      {isOpen && (
        <div className="grid grid-cols-5 gap-2 mt-2 bg-background p-3 rounded-2xl">
          {ICONS.map(i => (
            <button
              key={i}
              onClick={() => { onChange(i); setIsOpen(false); }}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-2xl transition-all",
                icon === i ? "bg-accent/20 border border-accent" : "hover:bg-white/10"
              )}
            >
              {i}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
