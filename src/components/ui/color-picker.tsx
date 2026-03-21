'use client';

import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const { preferences } = useStore();
  const { savedColors } = preferences;

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm text-textMuted">Цвет</div>
      <div className="flex flex-wrap gap-3">
        {savedColors.map(c => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all",
              color === c ? "ring-2 ring-white scale-110" : "opacity-80 hover:opacity-100"
            )}
            style={{ backgroundColor: c }}
          />
        ))}
        {/* Simple native color input for custom colors */}
        <label className="w-10 h-10 rounded-full overflow-hidden cursor-pointer flex items-center justify-center bg-card border border-white/10">
          <input 
            type="color" 
            value={color || '#ffffff'}
            onChange={(e) => onChange(e.target.value)}
            className="opacity-0 w-[200%] h-[200%] absolute cursor-pointer"
          />
          <span className="text-xl">+</span>
        </label>
      </div>
    </div>
  );
}
