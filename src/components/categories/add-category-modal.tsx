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
  const [excludeFromBudget, setExcludeFromBudget] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setParentId(editingCategory.parentId);
      setColor(editingCategory.color);
      setIcon(editingCategory.icon);
      setBudgetLimit(editingCategory.budgetLimit?.toString() || '0');
      setExcludeFromBudget(editingCategory.excludeFromBudget || false);
    } else {
      setName('');
      setParentId(initialParentId);
      setColor(preferences.savedColors[0]);
      setIcon('🎯');
      setBudgetLimit('0');
      setExcludeFromBudget(false);
    }
    setShowDeleteConfirm(false);
  }, [editingCategory, initialParentId, isOpen, preferences.savedColors]);

  const handleDelete = () => {
    if (editingCategory) {
      deleteCategory(editingCategory.id);
      onClose();
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    // Calculate next sort order if new
    const siblings = categories.filter(c => (c.parentId || undefined) === (parentId || undefined));
    const nextSortOrder = siblings.length > 0
      ? Math.max(...siblings.map(s => s.sortOrder)) + 1
      : 0;

    if (editingCategory) {
      await updateCategory(editingCategory.id, {
        name: name.trim(),
        parentId: parentId || undefined,
        color,
        icon,
        budgetLimit: hideBudgetLimit ? (editingCategory.budgetLimit || 0) : (parseFloat(budgetLimit) || 0),
        excludeFromBudget
      });
    } else {
      await addCategory({
        id: generateUUID(),
        name: name.trim(),
        parentId: parentId || undefined,
        color,
        icon,
        budgetLimit: hideBudgetLimit ? 0 : (parseFloat(budgetLimit) || 0),
        sortOrder: nextSortOrder,
        excludeFromBudget
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  const headCategories = categories.filter(c => !c.parentId && c.id !== editingCategory?.id);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm px-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          className="surface w-full max-w-xl max-h-[90vh] rounded-4xl p-6 flex flex-col gap-6 shadow-card-lg relative overflow-hidden"
          initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="flex flex-col items-center gap-2 relative">
             <button
                onClick={onClose}
                className="absolute right-0 top-0 p-2.5 bg-white/5 hover:bg-white/10 rounded-full active:scale-95 text-white/40 transition-all"
              >
                <X size={18} />
              </button>

              <div className="w-11 h-11 bg-accent-dim rounded-2xl flex items-center justify-center text-accent mb-1">
                <Layers size={20} />
              </div>
              <h2 className="text-lg font-semibold text-white text-center">
                {editingCategory
                  ? (editingCategory.parentId ? 'Изменить категорию' : 'Изменить блок')
                  : (parentId ? 'Новая категория' : 'Новый блок')}
              </h2>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 hide-scrollbar flex flex-col gap-8 pb-2">
             {/* Name & Icon Preview */}
             <div className="flex flex-col gap-3">
                <span className="text-[12px] font-medium text-textMuted px-1">Название и иконка</span>
                <div className="flex gap-3">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    <span>{icon}</span>
                  </div>
                  <input
                    className="flex-1 bg-black/20 p-5 rounded-2xl text-lg font-semibold text-white outline-none focus:bg-black/30 transition-all"
                    placeholder="Напр. Аренда, Еда..."
                    value={name} onChange={e => setName(e.target.value)}
                    autoFocus
                  />
                </div>
             </div>

             {!hideBudgetLimit && (
             <div className="flex flex-col gap-3">
                <span className="text-[12px] font-medium text-textMuted px-1">Бюджет (лимит)</span>
                <div className="bg-black/20 p-5 rounded-2xl flex items-center justify-between">
                   <span className="text-lg font-semibold text-white">$</span>
                   <input
                      type="number"
                      className="bg-transparent text-lg font-semibold text-white outline-none text-right w-32"
                      placeholder="0.0"
                      value={budgetLimit} onChange={e => setBudgetLimit(e.target.value)}
                   />
                </div>
             </div>
             )}

             <div className="flex flex-col gap-3">
                <span className="text-[12px] font-medium text-textMuted px-1">Внутри блока (расположение)</span>
                <div className="relative group">
                  <select
                      className="w-full bg-black/20 p-4 rounded-2xl text-white/90 outline-none appearance-none font-medium text-sm pr-10 focus:bg-black/30 transition-all"
                      value={parentId || ''} onChange={e => setParentId(e.target.value || undefined)}
                  >
                    <option value="" className="bg-surface">Сделать основным блоком</option>
                    {headCategories.map(c => (
                      <option key={c.id} value={c.id} className="bg-surface">{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 group-hover:text-accent transition-colors" size={18} />
                </div>
             </div>

             <div className="flex flex-col gap-3">
               <button
                 onClick={() => setExcludeFromBudget(!excludeFromBudget)}
                 className={cn(
                   "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left",
                   excludeFromBudget ? "bg-accent-dim border-accent/30 text-accent" : "bg-black/20 border-transparent hover:bg-black/30 text-white/60"
                 )}
               >
                 <div className={cn(
                   "w-5 h-5 rounded-md flex items-center justify-center border transition-all flex-shrink-0",
                   excludeFromBudget ? "bg-accent border-accent text-white" : "border-white/20 bg-black/40"
                 )}>
                   {excludeFromBudget && <Check size={12} strokeWidth={3} />}
                 </div>
                 <div className="flex flex-col flex-1">
                   <span className="font-medium text-sm text-white">Не учитывать в бюджете</span>
                   <span className="text-[11px] leading-tight mt-0.5 opacity-60">Такие траты будут отображаться снизу как &quot;Вне плана&quot;</span>
                 </div>
               </button>
             </div>

             <div className="flex flex-col gap-8">
                <ColorPicker color={color} onChange={setColor} />
                <IconPicker icon={icon} onChange={setIcon} />
             </div>
          </div>

           <div className="flex gap-3">
            {editingCategory && (
              <button
                onClick={() => showDeleteConfirm ? handleDelete() : setShowDeleteConfirm(true)}
                className={cn(
                  "flex-1 h-14 rounded-2xl flex items-center justify-center gap-2.5 transition-all font-semibold text-sm",
                  showDeleteConfirm ? "bg-danger text-white" : "bg-white/5 text-danger"
                )}
              >
                {showDeleteConfirm ? <AlertTriangle size={18} /> : <Trash2 size={18} />}
                {showDeleteConfirm ? 'Удалить?' : 'Удалить'}
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className={cn(
                "h-14 gradient-accent glow-accent text-white text-base font-semibold rounded-2xl flex items-center justify-center gap-2.5 active:scale-95 transition-all disabled:opacity-30",
                editingCategory ? "flex-1" : "w-full"
              )}
            >
              <Check size={20} />
              {editingCategory ? 'Сохранить' : 'Создать'}
            </button>
           </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
