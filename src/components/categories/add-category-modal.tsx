'use client';

import { useState, useEffect } from 'react';
import { useStore, Category } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Tag, FolderPlus, Palette, Grid, Plus } from 'lucide-react';
import { ColorPicker } from '@/components/ui/color-picker';
import { IconPicker } from '@/components/ui/icon-picker';
import { cn } from '@/lib/utils';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialParentId?: string;
  editingCategory?: Category | null;
}

export function AddCategoryModal({ 
  isOpen, 
  onClose, 
  initialParentId, 
  editingCategory 
}: AddCategoryModalProps) {
  const { addCategory, updateCategory, categories, preferences } = useStore();
  
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const [color, setColor] = useState(preferences.savedColors[0]);
  const [icon, setIcon] = useState('🎯');

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setParentId(editingCategory.parentId);
      setColor(editingCategory.color);
      setIcon(editingCategory.icon);
    } else {
      setName('');
      setParentId(initialParentId);
      setColor(preferences.savedColors[0]);
      setIcon('🎯');
    }
  }, [editingCategory, initialParentId, isOpen, preferences.savedColors]);

  const handleSave = () => {
    if (!name.trim()) return;
    
    if (editingCategory) {
      updateCategory(editingCategory.id, { 
        name: name.trim(), 
        parentId: parentId || undefined, 
        color, 
        icon 
      });
    } else {
      addCategory({
        id: Date.now().toString(),
        name: name.trim(),
        parentId: parentId || undefined,
        color,
        icon
      });
    }
    
    onClose();
  };

  if (!isOpen) return null;

  const headCategories = categories.filter(c => !c.parentId && c.id !== editingCategory?.id);

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md px-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div 
          className="bg-[#1c2128] w-full max-w-md max-h-[90vh] rounded-[48px] p-10 flex flex-col gap-8 shadow-2xl border border-white/10 overflow-hidden"
          initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black uppercase tracking-widest text-white/40">
              {editingCategory ? 'Edit Category' : parentId ? 'New Subcategory' : 'New Block'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full"><X size={24} /></button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-8 pb-4">
             <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black uppercase text-white/20 tracking-widest px-2">Preview & Name</label>
                <div className="flex gap-4">
                  <div 
                    className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl shadow-2xl border-4 transition-all shrink-0 relative overflow-hidden"
                    style={{ backgroundColor: color, borderColor: color }}
                  >
                    <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                    <span className="relative z-10 filter brightness-50 contrast-150">{icon}</span>
                  </div>
                  <input 
                    className="flex-1 bg-black/20 p-6 rounded-3xl text-xl font-black text-white outline-none border border-white/5 focus:border-white/10 transition-all"
                    placeholder="E.g. Rent, Food, Home..."
                    value={name} onChange={e => setName(e.target.value)}
                    autoFocus
                  />
                </div>
             </div>

             <div className="flex flex-col gap-3">
               <label className="text-[10px] font-black uppercase text-white/20 tracking-widest px-2">Block / Parent</label>
               <select 
                  className="bg-black/20 p-5 rounded-2xl text-white outline-none border border-white/5 appearance-none font-bold"
                  value={parentId || ''} onChange={e => setParentId(e.target.value || undefined)}
               >
                 <option value="" className="bg-[#0d1117]">None (Main Block)</option>
                 {headCategories.map(c => (
                   <option key={c.id} value={c.id} className="bg-[#0d1117]">{c.name}</option>
                 ))}
               </select>
             </div>

             <div className="grid grid-cols-1 gap-8">
               <ColorPicker color={color} onChange={setColor} />
               <IconPicker icon={icon} onChange={setIcon} />
             </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={!name.trim()}
            className="h-20 bg-white text-black text-xl font-black rounded-3xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl disabled:opacity-20"
          >
            {editingCategory ? <Check size={28} strokeWidth={4} /> : <Plus size={28} strokeWidth={4} />}
            {editingCategory ? 'SAVE CHANGES' : parentId ? 'ADD CATEGORY' : 'CREATE BLOCK'}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
