'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronRight, FolderPlus } from 'lucide-react';
import { ColorPicker } from '@/components/ui/color-picker';
import { IconPicker } from '@/components/ui/icon-picker';

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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-[100] flex items-end bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="bg-card w-full h-[80vh] rounded-t-3xl flex flex-col p-6 shadow-2xl relative"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Новая категория</h2>
            <button onClick={onClose} className="p-2 bg-background rounded-full">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-6 hide-scrollbar pb-20">
            <input 
              className="bg-background p-4 rounded-xl outline-none" 
              placeholder="Название (например, Продукты)" 
              value={name} onChange={e => setName(e.target.value)} 
            />

            {categoryFolders.length > 0 && (
              <select 
                className="bg-background p-4 rounded-xl outline-none" 
                value={folderId} onChange={e => setFolderId(e.target.value)}
              >
                {categoryFolders.map(f => <option key={f.id} value={f.id}>Папка: {f.name}</option>)}
              </select>
            )}

            <ColorPicker color={color} onChange={setColor} />
            <IconPicker icon={icon} onChange={setIcon} />
          </div>

          <button onClick={handleSave} disabled={!name} className="absolute bottom-6 left-6 right-6 h-14 bg-accent hover:bg-accent/90 disabled:opacity-50 text-white font-bold rounded-2xl z-50 shadow-lg">
            Добавить
          </button>
        </motion.div>
      </motion.div>
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
    <div className="p-4 flex flex-col gap-6">
      <header className="pt-8 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Настройки</h1>
          <p className="text-sm text-textMuted mt-1">Категории и предпочтения</p>
        </div>
      </header>

      {/* Preferences / Base Currency Selection */}
      <div className="bg-card rounded-3xl p-5 shadow-lg flex flex-col gap-4 border border-white/5">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="font-semibold text-white">Базовая валюта</span>
            <span className="text-xs text-textMuted">В ней будет считаться общий баланс и бюджет</span>
          </div>
          <select 
            className="bg-background px-4 py-2 rounded-xl outline-none border border-transparent focus:border-accent text-accent font-bold"
            value={baseCurrency}
            onChange={(e) => updatePreferences({ baseCurrency: e.target.value })}
          >
            {COMMON_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        <h2 className="text-xl font-bold">Категории</h2>
        <div className="flex gap-2">
          <button onClick={handleAddFolder} className="w-10 h-10 bg-card rounded-2xl flex items-center justify-center text-textMuted active:scale-95">
            <FolderPlus size={20} />
          </button>
          <button onClick={() => setIsModalOpen(true)} className="w-10 h-10 bg-card rounded-2xl flex items-center justify-center text-accent shadow-lg active:scale-95">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>
      </div>

      {categoryFolders.map(folder => {
        const folderCategories = categories.filter(c => c.folderId === folder.id);
        const isExpanded = expandedFolders[folder.id] !== false; // Default true

        return (
          <div key={folder.id} className="flex flex-col gap-4">
            <button 
              onClick={() => toggleFolder(folder.id)}
              className="flex items-center gap-2 text-textMuted hover:text-white transition-colors px-2"
            >
              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <span className="font-semibold text-lg">{folder.name}</span>
              <span className="ml-auto bg-card px-2 py-0.5 rounded-full text-xs">{folderCategories.length}</span>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-4 gap-3 overflow-hidden"
                >
                  {folderCategories.map(c => (
                    <div key={c.id} className="flex flex-col items-center gap-2 p-3 bg-card rounded-2xl shadow-sm border border-transparent" style={{ borderColor: `${c.color}30` }}>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${c.color}20`, color: c.color }}>
                        {c.icon}
                      </div>
                      <span className="text-xs truncate w-full text-center text-textMuted">{c.name}</span>
                    </div>
                  ))}
                  {folderCategories.length === 0 && (
                    <div className="col-span-4 text-center text-xs text-textMuted py-4">Папка пуста</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      <div className="h-24" /> {/* Spacer for bottom nav */}

      <AddCategoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
