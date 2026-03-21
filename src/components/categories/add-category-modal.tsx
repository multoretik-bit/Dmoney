'use client';

import { generateUUID } from '@/lib/uuid';

import { useState, useEffect } from 'react';
import { useStore, Category } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Tag, FolderPlus, Palette, Grid, Plus, Trash2, AlertTriangle, Layers, ChevronDown } from 'lucide-react';
import { ColorPicker } from '@/components/ui/color-picker';
import { IconPicker } from '@/components/ui/icon-picker';
import { cn } from '@/lib/utils';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialParentId?: string;
  editingCategory?: Category | null;
  hideBudgetLimit?: boolean;
}

export function AddCategoryModal({ 
  isOpen, 
  onClose, 
  initialParentId, 
  editingCategory,
  hideBudgetLimit = false
}: AddCategoryModalProps) {
  const { addCategory, updateCategory, deleteCategory, categories, preferences } = useStore();
  
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const [color, setColor] = useState(preferences.savedColors[0]);
  const [icon, setIcon] = useState('🎯');
  const [budgetLimit, setBudgetLimit] = useState('0');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setParentId(editingCategory.parentId);
      setColor(editingCategory.color);
      setIcon(editingCategory.icon);
      setBudgetLimit(editingCategory.budgetLimit?.toString() || '0');
    } else {
      setName('');
      setParentId(initialParentId);
      setColor(preferences.savedColors[0]);
      setIcon('🎯');
      setBudgetLimit('0');
    }
    setShowDeleteConfirm(false);
  }, [editingCategory, initialParentId, isOpen, preferences.savedColors]);

  const handleDelete = () => {
    if (editingCategory) {
      deleteCategory(editingCategory.id);
      onClose();
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    
    if (editingCategory) {
      updateCategory(editingCategory.id, { 
        name: name.trim(), 
        parentId: parentId || undefined, 
        color, 
        icon,
        budgetLimit: hideBudgetLimit ? (editingCategory.budgetLimit || 0) : (parseFloat(budgetLimit) || 0)
      });
    } else {
      addCategory({
        id: generateUUID(),
        name: name.trim(),
        parentId: parentId || undefined,
        color,
        icon,
        budgetLimit: hideBudgetLimit ? 0 : (parseFloat(budgetLimit) || 0)
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
          className="glass-card w-full max-w-xl max-h-[90vh] rounded-[48px] p-8 flex flex-col gap-8 shadow-2xl relative border-t-4 border-t-accent overflow-hidden"
          initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="flex flex-col items-center gap-2 relative">
             <button 
                onClick={onClose} 
                className="absolute right-0 top-0 p-3 bg-white/5 hover:bg-white/10 rounded-full active:scale-95 text-white/40 transition-all"
              >
                <X size={20} />
              </button>
              
              <div className="w-14 h-14 bg-accent/20 rounded-[24px] flex items-center justify-center text-accent mb-2 shadow-xl shadow-accent/10">
                <Layers size={28} strokeWidth={3} />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-[0.3em] text-white/90 text-center">
                {editingCategory 
                  ? (editingCategory.parentId ? 'Изменить категорию' : 'Изменить блок') 
                  : (parentId ? 'Новая Категория' : 'Новый Блок')}
              </h2>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 hide-scrollbar flex flex-col gap-10 pb-4">
             {/* Name & Icon Preview */}
             <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 px-2">
                   <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30">Название и Иконка</span>
                   <div className="h-px bg-white/5 flex-1" />
                </div>
                <div className="flex gap-4">
                  <div 
                    className="w-20 h-20 rounded-[28px] flex items-center justify-center text-3xl shadow-2xl border-4 transition-all shrink-0 relative overflow-hidden"
                    style={{ backgroundColor: color, borderLeftColor: 'rgba(255,255,255,0.2)', borderTopColor: 'rgba(255,255,255,0.2)' }}
                  >
                    <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                    <span className="relative z-10">{icon}</span>
                  </div>
                  <input 
                    className="flex-1 bg-black/20 p-6 rounded-[28px] text-xl font-black text-white outline-none border border-white/5 focus:border-accent/30 transition-all font-black"
                    placeholder="Напр. Аренда, Еда..."
                    value={name} onChange={e => setName(e.target.value)}
                    autoFocus
                  />
                </div>
             </div>

             {!hideBudgetLimit && (
             <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 px-2">
                   <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30">Бюджет (Лимит)</span>
                   <div className="h-px bg-white/5 flex-1" />
                </div>
                <div className="bg-black/20 p-6 rounded-[28px] border border-white/5 flex items-center justify-between">
                   <span className="text-xl font-black text-white">$</span>
                   <input 
                      type="number"
                      className="bg-transparent text-xl font-black text-white outline-none text-right w-32 font-black"
                      placeholder="0.0"
                      value={budgetLimit} onChange={e => setBudgetLimit(e.target.value)}
                   />
                </div>
             </div>
             )}

             <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 px-2">
                   <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30">Внутри Блока (Расположение)</span>
                   <div className="h-px bg-white/5 flex-1" />
                </div>
                <div className="relative group">
                  <select 
                      className="w-full bg-black/20 p-5 rounded-[24px] text-white/90 outline-none border border-white/5 appearance-none font-black uppercase tracking-widest text-[11px] pr-12 focus:border-accent/30 transition-all font-black"
                      value={parentId || ''} onChange={e => setParentId(e.target.value || undefined)}
                  >
                    <option value="" className="bg-[#020617]">Сделать основным Блоком</option>
                    {headCategories.map(c => (
                      <option key={c.id} value={c.id} className="bg-[#020617]">{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-accent transition-colors" size={20} />
                </div>
             </div>

             <div className="flex flex-col gap-10">
                <ColorPicker color={color} onChange={setColor} />
                <IconPicker icon={icon} onChange={setIcon} />
             </div>
          </div>

           <div className="flex gap-4 mt-2">
            {editingCategory && (
              <button 
                onClick={() => showDeleteConfirm ? handleDelete() : setShowDeleteConfirm(true)}
                className={cn(
                  "flex-1 h-20 rounded-[32px] flex items-center justify-center gap-3 transition-all shadow-xl font-black text-lg",
                  showDeleteConfirm ? "bg-red-500 text-white" : "bg-white/5 text-red-500 border border-red-500/20"
                )}
              >
                {showDeleteConfirm ? <AlertTriangle size={24} /> : <Trash2 size={24} />}
                {showDeleteConfirm ? 'УДАЛИТЬ?' : 'УДАЛИТЬ'}
              </button>
            )}
            <button 
              onClick={handleSave}
              disabled={!name.trim()}
              className={cn(
                "h-20 bg-accent text-white text-xl font-black rounded-[32px] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-accent/20 shadow-2xl disabled:opacity-30 disabled:grayscale",
                editingCategory ? "flex-1" : "w-full"
              )}
            >
              <Check size={28} strokeWidth={4} />
              {editingCategory ? 'СОХРАНИТЬ' : 'СОЗДАТЬ'}
            </button>
           </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
