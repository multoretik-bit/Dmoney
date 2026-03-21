'use client';

import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { Plus } from 'lucide-react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const { preferences, addSavedColor } = useStore();
  const { savedColors } = preferences;

  const handleCustomColor = (newColor: string) => {
    onChange(newColor);
    // Auto-save to palette if it's a new color
    if (!savedColors.includes(newColor)) {
      addSavedColor(newColor);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm text-textMuted font-medium">Цвет оформления</div>
      <div className="flex flex-wrap gap-2.5">
        {savedColors.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 border-2",
              color === c ? "border-white scale-110 shadow-lg" : "border-transparent opacity-80 hover:opacity-100"
            )}
            style={{ backgroundColor: c }}
          />
        ))}
        
        <label className="w-9 h-9 rounded-full overflow-hidden cursor-pointer flex items-center justify-center bg-card border border-dashed border-white/20 hover:border-white/40 transition-colors relative">
          <input 
            type="color" 
            value={color || '#3b82f6'}
            onChange={(e) => handleCustomColor(e.target.value)}
            className="opacity-0 w-[200%] h-[200%] absolute cursor-pointer z-10"
          />
          <Plus size={16} className="text-textMuted" />
        </label>
      </div>
    </div>
  );
}
