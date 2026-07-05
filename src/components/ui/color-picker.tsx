'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Pipette, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';

interface AdvancedColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

// Helper: Hex to RGB
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

// Helper: RGB to Hex
const rgbToHex = (r: number, g: number, b: number) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

// Helper: RGB to HSV
const rgbToHsv = (r: number, g: number, b: number) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
};

// Helper: HSV to RGB
const hsvToRgb = (h: number, s: number, v: number) => {
  h /= 360; s /= 100; v /= 100;
  let r = 0, g = 0, b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};

export function AdvancedColorPicker({ color, onChange }: AdvancedColorPickerProps) {
  const [hsv, setHsv] = useState(() => {
    const rgb = hexToRgb(color);
    return rgbToHsv(rgb.r, rgb.g, rgb.b);
  });

  const svRef = useRef<HTMLDivElement>(null);
  const hRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rgb = hexToRgb(color);
    const newHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    setHsv(newHsv);
  }, [color]);

  const updateColor = (newHsv: { h: number, s: number, v: number }) => {
    setHsv(newHsv);
    const rgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
    onChange(rgbToHex(rgb.r, rgb.g, rgb.b));
  };

  const handleSvMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!svRef.current) return;
      const rect = svRef.current.getBoundingClientRect();
      const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : (moveEvent as MouseEvent).clientX;
      const clientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : (moveEvent as MouseEvent).clientY;
      
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      
      updateColor({ ...hsv, s: x * 100, v: (1 - y) * 100 });
    };

    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);
    
    // Initial hit
    const anyEvent = e as any;
    handleMove(anyEvent.nativeEvent || anyEvent);
  };

  const handleHMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!hRef.current) return;
      const rect = hRef.current.getBoundingClientRect();
      const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : (moveEvent as MouseEvent).clientX;
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      updateColor({ ...hsv, h: x * 360 });
    };

    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);
    
    const anyEvent = e as any;
    handleMove(anyEvent.nativeEvent || anyEvent);
  };

  const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);

  return (
    <div className="flex flex-col gap-6 bg-white rounded-3xl p-4 shadow-2xl overflow-hidden border border-black/5">
      {/* Saturation/Value Square */}
      <div 
        ref={svRef}
        onMouseDown={handleSvMouseDown}
        onTouchStart={handleSvMouseDown}
        className="w-full h-40 rounded-xl relative cursor-crosshair overflow-hidden"
        style={{ backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        <motion.div 
          className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg -translate-x-2 -translate-y-2 pointer-events-none"
          style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%`, backgroundColor: color }}
        />
      </div>

      <div className="flex items-center gap-4">
        {/* Eyedropper & Current Color */}
        <div className="flex items-center gap-3">
           <button className="w-8 h-8 flex items-center justify-center text-black/60 hover:bg-black/5 rounded-lg transition-colors">
              <Pipette size={18} />
           </button>
           <div className="w-10 h-10 rounded-full shadow-inner border border-black/5" style={{ backgroundColor: color }} />
        </div>

        {/* Hue Slider */}
        <div 
          ref={hRef}
          onMouseDown={handleHMouseDown}
          onTouchStart={handleHMouseDown}
          className="flex-1 h-3 rounded-full relative cursor-pointer"
          style={{ background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)' }}
        >
          <motion.div 
            className="absolute w-4 h-4 bg-white border border-black/10 rounded-full shadow-md -top-0.5 -translate-x-2"
            style={{ left: `${(hsv.h / 360) * 100}%` }}
          />
        </div>
      </div>

      {/* Inputs */}
      <div className="flex gap-2">
         <ColorInput label="R" value={rgb.r} onChange={v => updateColor(rgbToHsv(v, rgb.g, rgb.b))} />
         <ColorInput label="G" value={rgb.g} onChange={v => updateColor(rgbToHsv(rgb.r, v, rgb.b))} />
         <ColorInput label="B" value={rgb.b} onChange={v => updateColor(rgbToHsv(rgb.r, rgb.g, v))} />
      </div>
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-1">
      <input 
        type="number" 
        min="0" max="255"
        className="w-full h-10 border border-black/10 rounded-lg text-center text-black font-medium text-sm outline-none focus:border-black/30 transition-colors"
        value={value}
        onChange={e => onChange(Math.max(0, Math.min(255, parseInt(e.target.value) || 0)))}
      />
      <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">{label}</span>
    </div>
  );
}

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const { preferences, addSavedColor } = useStore();
  const { savedColors } = preferences;
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleApplyColor = (newColor: string) => {
    onChange(newColor);
    if (!savedColors.includes(newColor)) {
      addSavedColor(newColor);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center px-1">
        <label className="text-[10px] font-black uppercase text-white/20 tracking-widest">Color Palette</label>
        <button 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-[9px] font-black uppercase text-accent tracking-widest hover:underline"
        >
          {showAdvanced ? 'Quick Palette' : 'Advanced Picker'}
        </button>
      </div>

      {showAdvanced ? (
        <AdvancedColorPicker color={color} onChange={onChange} />
      ) : (
        <div className="flex flex-wrap gap-2.5">
          {savedColors.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                color === c ? "border-white scale-110 shadow-2xl" : "border-transparent opacity-40 hover:opacity-100"
              )}
              style={{ backgroundColor: c, boxShadow: color === c ? `0 0 20px ${c}40` : 'none' }}
            >
              {color === c && <Check size={18} className="text-white" />}
            </button>
          ))}
          <button 
            onClick={() => setShowAdvanced(true)}
            className="w-10 h-10 rounded-full bg-white/5 border border-dashed border-white/20 flex items-center justify-center hover:border-white/40 transition-all"
          >
            <Plus size={18} className="text-white/40" />
          </button>
        </div>
      )}
      
      {showAdvanced && !savedColors.includes(color) && (
        <button 
          onClick={() => handleApplyColor(color)}
          className="w-full h-12 bg-accent/20 border border-accent/30 rounded-2xl text-[10px] font-black uppercase tracking-widest text-accent hover:bg-accent/30 transition-all"
        >
          Add to my palette
        </button>
      )}
    </div>
  );
}
