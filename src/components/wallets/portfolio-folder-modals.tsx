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
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md px-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div 
          className="bg-[#1c2128] w-full max-w-md rounded-[48px] p-10 flex flex-col gap-8 shadow-2xl border border-white/10"
          initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black uppercase tracking-widest text-white/40">
              {editingPortfolio ? 'Edit Capital' : 'New Capital'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full"><X size={24} /></button>
          </div>

          <div className="flex flex-col gap-6">
             <div className="flex flex-col gap-3">
               <label className="text-[10px] font-black uppercase text-white/20 tracking-widest px-2">Название</label>
               <input 
                  className="bg-black/20 p-6 rounded-3xl text-xl font-black text-white outline-none border border-white/5"
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
            className="h-20 bg-white text-black text-xl font-black rounded-3xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl disabled:opacity-20"
          >
            {editingPortfolio ? <Check size={28} strokeWidth={4} /> : <Check size={28} strokeWidth={4} />}
            {editingPortfolio ? 'SAVE CHANGES' : 'CREATE'}
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
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md px-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div 
          className="bg-[#1c2128] w-full max-w-md rounded-[48px] p-10 flex flex-col gap-8 shadow-2xl border border-white/10"
          initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black uppercase tracking-widest text-white/40">
              {editingFolder ? 'Edit Folder' : 'New Folder'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full"><X size={24} /></button>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
               <label className="text-[10px] font-black uppercase text-white/20 tracking-widest px-2">Folder Name</label>
               <input 
                  className="bg-black/20 p-6 rounded-3xl text-xl font-black text-white outline-none border border-white/5"
                  placeholder="E.g. Savings, Daily, Crypto..."
                  value={name} onChange={e => setName(e.target.value)}
               />
            </div>

            <ColorPicker color={color} onChange={setColor} />
          </div>

          <button 
            onClick={handleSave}
            disabled={!name.trim()}
            className="h-20 bg-accent text-white text-xl font-black rounded-3xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl disabled:opacity-20"
          >
            <FolderPlus size={28} strokeWidth={4} />
            {editingFolder ? 'SAVE CHANGES' : 'ADD FOLDER'}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
