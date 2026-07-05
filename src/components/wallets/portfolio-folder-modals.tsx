'use client';

import { generateUUID } from '@/lib/uuid';

import { useState, useEffect } from 'react';
import { useStore, Portfolio, Folder } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, FolderPlus, Grid, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ColorPicker } from '@/components/ui/color-picker';
import { IconPicker } from '@/components/ui/icon-picker';

export function AddPortfolioModal({
  isOpen,
  onClose,
  editingPortfolio
}: {
  isOpen: boolean;
  onClose: () => void;
  editingPortfolio?: Portfolio | null;
}) {
  const { addPortfolio, updatePortfolio, preferences } = useStore();
  const [name, setName] = useState('');
  const [color, setColor] = useState(preferences.savedColors[0]);
  const [icon, setIcon] = useState('💼');

  useEffect(() => {
    if (editingPortfolio) {
      setName(editingPortfolio.name);
      setColor(editingPortfolio.color);
      setIcon(editingPortfolio.icon || '💼');
    } else {
      setName('');
      setColor(preferences.savedColors[0]);
      setIcon('💼');
    }
  }, [editingPortfolio, isOpen, preferences.savedColors]);

  const handleSave = () => {
    if (!name.trim()) return;

    if (editingPortfolio) {
      updatePortfolio(editingPortfolio.id, { name: name.trim(), color, icon });
    } else {
      const { portfolios } = useStore.getState();
      const nextSortOrder = portfolios.length > 0
        ? Math.max(...portfolios.map(p => p.sortOrder)) + 1
        : 0;
      addPortfolio({ id: generateUUID(), name: name.trim(), color, icon, sortOrder: nextSortOrder });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm px-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          className="surface w-full max-w-md rounded-4xl p-7 flex flex-col gap-6 shadow-card-lg"
          initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-[13px] font-medium text-textMuted">
              {editingPortfolio ? 'Изменить капитал' : 'Новый капитал'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/40"><X size={20} /></button>
          </div>

          <div className="flex flex-col gap-5">
             <div className="flex flex-col gap-2.5">
               <label className="text-[11px] text-textSubtle px-1">Название</label>
               <input
                  className="bg-black/20 p-5 rounded-2xl text-lg font-semibold text-white outline-none"
                  placeholder="Название капитала"
                  value={name} onChange={e => setName(e.target.value)}
               />
             </div>

             <IconPicker icon={icon} onChange={setIcon} />

             <ColorPicker color={color} onChange={setColor} />
          </div>

          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="h-14 gradient-accent glow-accent text-white text-base font-semibold rounded-2xl flex items-center justify-center gap-2.5 active:scale-95 transition-all disabled:opacity-30"
          >
            <Check size={20} />
            {editingPortfolio ? 'Сохранить изменения' : 'Создать'}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function AddFolderModal({
  isOpen,
  onClose,
  portfolioId,
  editingFolder
}: {
  isOpen: boolean;
  onClose: () => void;
  portfolioId: string;
  editingFolder?: Folder | null;
}) {
  const { addFolder, updateFolder, preferences } = useStore();
  const [name, setName] = useState('');
  const [color, setColor] = useState(preferences.savedColors[0]);

  useEffect(() => {
    if (editingFolder) {
      setName(editingFolder.name);
      setColor(editingFolder.color || preferences.savedColors[0]);
    } else {
      setName('');
      setColor(preferences.savedColors[0]);
    }
  }, [editingFolder, isOpen, preferences.savedColors]);

  const handleSave = () => {
    if (!name.trim()) return;

    if (editingFolder) {
      updateFolder(editingFolder.id, { name: name.trim(), color });
    } else {
      addFolder({ id: generateUUID(), portfolioId, name: name.trim(), color });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm px-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          className="surface w-full max-w-md rounded-4xl p-7 flex flex-col gap-6 shadow-card-lg"
          initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-[13px] font-medium text-textMuted">
              {editingFolder ? 'Изменить папку' : 'Новая папка'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/40"><X size={20} /></button>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2.5">
               <label className="text-[11px] text-textSubtle px-1">Название папки</label>
               <input
                  className="bg-black/20 p-5 rounded-2xl text-lg font-semibold text-white outline-none"
                  placeholder="Напр. Сбережения, Крипта..."
                  value={name} onChange={e => setName(e.target.value)}
               />
            </div>

            <ColorPicker color={color} onChange={setColor} />
          </div>

          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="h-14 gradient-accent glow-accent text-white text-base font-semibold rounded-2xl flex items-center justify-center gap-2.5 active:scale-95 transition-all disabled:opacity-30"
          >
            <FolderPlus size={20} />
            {editingFolder ? 'Сохранить изменения' : 'Добавить папку'}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
