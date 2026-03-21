'use client';

import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { Plus, Check } from 'lucide-react';
import { useState } from 'react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const { preferences, addSavedColor } = useStore();
  const { savedColors } = preferences;
  const [tempColor, setTempColor] = useState(color);

  const handleApplyColor = (newColor: string) => {
    onChange(newColor);
    if (!savedColors.includes(newColor)) {
      addSavedColor(newColor);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="text-[10px] font-black uppercase tracking-widest text-white/40 px-1">Selected Color</div>
      <div className="flex flex-wrap gap-2.5">
        {savedColors.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2",
              color === c ? "border-white scale-110 shadow-2xl" : "border-transparent opacity-60 hover:opacity-100"
            )}
            style={{ backgroundColor: c, boxShadow: color === c ? `0 0 20px ${c}80` : 'none' }}
          >
            {color === c && <Check size={18} className="text-white" />}
          </button>
        ))}
        
        <div className="flex items-center gap-2 ml-1">
          <label className="w-10 h-10 rounded-full overflow-hidden cursor-pointer flex items-center justify-center bg-white/5 border border-dashed border-white/20 hover:border-white/40 transition-all relative">
            <input 
              type="color" 
              value={tempColor || '#3b82f6'}
              onChange={(e) => setTempColor(e.target.value)}
              className="opacity-0 w-[200%] h-[200%] absolute cursor-pointer z-10"
            />
            <Plus size={20} className="text-white/40" />
            <div className="absolute inset-0 bg-white/5 -z-0" style={{ backgroundColor: tempColor }} />
          </label>
          
          {tempColor !== color && (
            <button
               type="button"
               onClick={() => handleApplyColor(tempColor)}
               className="bg-accent px-4 py-2 rounded-xl text-[10px] font-black uppercase text-white shadow-lg active:scale-95 transition-all"
            >
              Add To Palette
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
