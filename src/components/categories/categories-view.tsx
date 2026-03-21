'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronRight, FolderPlus, Plus, Tag } from 'lucide-react';
import { ColorPicker } from '@/components/ui/color-picker';
import { IconPicker } from '@/components/ui/icon-picker';
import { cn } from '@/lib/utils';

function AddCategoryModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addCategory, categoryFolders } = useStore();
  const [name, setName] = useState('');
  const [folderId, setFolderId] = useState(categoryFolders[0]?.id || 'default');
  const [color, setColor] = useState('#f59e0b');
  const [icon, setIcon] = useState('🛒');

  const handleSave = () => {
    if (!name) return;
    addCategory({
      id: Date.now().toString(),
      name,
      folderId,
      color,
      icon,
    });
    setName('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-[100] flex items-end bg-black/70 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
             if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div 
            className="bg-card w-full h-[80vh] rounded-t-[40px] flex flex-col p-8 shadow-2xl relative"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 250 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center text-accent">
                   <Tag size={24} />
                 </div>
                 <h2 className="text-2xl font-bold">Новая категория</h2>
              </div>
              <button 
                type="button"
                onClick={onClose} 
                className="p-3 bg-background border border-white/5 rounded-full active:scale-95 text-textMuted"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-8 hide-scrollbar pb-24">
              <div className="flex flex-col gap-2">
                <div className="text-sm text-textMuted font-medium px-1">Название</div>
                <input 
                  className="bg-background p-5 rounded-2xl outline-none border border-transparent focus:border-accent transition-all text-lg font-medium" 
                  placeholder="Например, Продукты" 
                  value={name} onChange={e => setName(e.target.value)} 
                />
              </div>

              {categoryFolders.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="text-sm text-textMuted font-medium px-1">Папка</div>
                  <select 
                    className="bg-background p-5 rounded-2xl outline-none border border-transparent focus:border-accent" 
                    value={folderId} onChange={e => setFolderId(e.target.value)}
                  >
                    {categoryFolders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              )}

              <ColorPicker color={color} onChange={setColor} />
              <IconPicker icon={icon} onChange={setIcon} />
            </div>

            <button 
              type="button"
              onClick={handleSave} 
              disabled={!name}
              className="absolute bottom-8 left-8 right-8 h-16 bg-accent hover:bg-accent/90 disabled:opacity-50 text-white text-lg font-bold rounded-3xl z-[110] shadow-2xl shadow-accent/20 transition-all active:scale-[0.98]"
            >
              Создать категорию
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function CategoriesView() {
  const { categories, categoryFolders, addCategoryFolder, preferences, updatePreferences } = useStore();
  const { baseCurrency } = preferences;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => ({ ...prev, [id]: prev[id] === undefined ? false : !prev[id] }));
  };

  const handleAddFolder = () => {
    const name = prompt("Название новой папки категорий:");
    if (name) {
      addCategoryFolder({ id: Date.now().toString(), name, order: categoryFolders.length });
    }
  };

  const COMMON_CURRENCIES = ['USD', 'EUR', 'RUB', 'KZT', 'GBP', 'TRY', 'GEL'];

  return (
    <div className="p-6 flex flex-col gap-8">
      <header className="pt-8 pb-4">
        <h1 className="text-4xl font-bold tracking-tight">Настройки</h1>
        <p className="text-sm text-textMuted mt-1">Персонализация и валюты</p>
      </header>

      {/* Preferences / Base Currency Selection */}
      <section className="bg-card rounded-[32px] p-6 shadow-xl border border-white/5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="font-bold text-lg text-white">Основная валюта</span>
            <span className="text-xs text-textMuted max-w-[200px]">В этой валюте будет считаться твой бюджет и баланс по всем счетам.</span>
          </div>
          <select 
            className="bg-background px-4 py-3 rounded-2xl outline-none border border-transparent focus:border-accent text-accent font-black shadow-inner"
            value={baseCurrency}
            onChange={(e) => updatePreferences({ baseCurrency: e.target.value })}
          >
            {COMMON_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </section>

      <div className="flex justify-between items-center mt-4">
        <h2 className="text-2xl font-bold">Категории</h2>
        <div className="flex gap-3">
          <button onClick={handleAddFolder} className="w-10 h-10 bg-card rounded-xl flex items-center justify-center text-textMuted active:scale-95 border border-white/5">
            <FolderPlus size={20} />
          </button>
          <button onClick={() => setIsModalOpen(true)} className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white shadow-lg active:scale-95">
            <Plus size={22} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-8 pb-32">
        {categoryFolders.map(folder => {
          const folderCategories = categories.filter(c => c.folderId === folder.id);
          const isExpanded = expandedFolders[folder.id] !== false; // Default true

          return (
            <div key={folder.id} className="flex flex-col gap-5">
              <button 
                type="button"
                onClick={() => toggleFolder(folder.id)}
                className="flex items-center gap-3 text-textMuted hover:text-white transition-colors group"
              >
                <div className="w-7 h-7 rounded-lg bg-card flex items-center justify-center transition-colors group-hover:bg-accent/10">
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                <span className="font-bold text-lg tracking-tight">{folder.name}</span>
                <span className="bg-card px-2 py-0.5 rounded-full text-[10px] font-black">{folderCategories.length}</span>
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-4 gap-3 overflow-hidden"
                  >
                    {folderCategories.map(c => (
                      <motion.div 
                        key={c.id} 
                        layout
                        className="flex flex-col items-center gap-2 p-4 bg-card rounded-[24px] shadow-sm border border-white/5 active:scale-95 transition-transform"
                      >
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner bg-background/40">
                          {c.icon}
                        </div>
                        <span className="text-[10px] font-bold truncate w-full text-center text-textMuted tracking-tight uppercase">{c.name}</span>
                        <div className="w-4 h-1 rounded-full" style={{ backgroundColor: c.color }} />
                      </motion.div>
                    ))}
                    {folderCategories.length === 0 && (
                      <div className="col-span-4 text-center text-xs text-textMuted py-4 bg-background/20 rounded-2xl border border-dashed border-white/5">Папка пуста</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <AddCategoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
