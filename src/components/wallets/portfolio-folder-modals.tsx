'use client';

import { useState } from 'react';
import { useStore, Portfolio, Folder } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, FolderPlus, Grid, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AddPortfolioModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addPortfolio, preferences } = useStore();
  const [name, setName] = useState('');
  const [color, setColor] = useState(preferences.savedColors[0]);
  const [icon, setIcon] = useState('💼');

  const handleSave = () => {
    if (!name.trim()) return;
    addPortfolio({ id: Date.now().toString(), name: name.trim(), color, icon });
    setName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md px-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div 
          className="bg-[#1c2128] w-full max-w-md rounded-[48px] p-10 flex flex-col gap-8 shadow-2xl border border-white/10"
          initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black uppercase tracking-widest text-white/40">New Capital</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full"><X size={24} /></button>
          </div>

          <div className="flex flex-col gap-6">
             <div className="flex flex-col gap-3">
               <label className="text-[10px] font-black uppercase text-white/20 tracking-widest px-2">Name</label>
               <input 
                  className="bg-black/20 p-6 rounded-3xl text-xl font-black text-white outline-none border border-white/5"
                  placeholder="Portfolio Name"
                  value={name} onChange={e => setName(e.target.value)}
               />
             </div>

             <div className="flex flex-col gap-3">
               <label className="text-[10px] font-black uppercase text-white/20 tracking-widest px-2">Primary Color</label>
               <div className="flex gap-3 px-2">
                 {preferences.savedColors.map(c => (
                   <button 
                     key={c}
                     onClick={() => setColor(c)}
                     className={cn("w-10 h-10 rounded-full transition-all border-4", color === c ? "border-white scale-110" : "border-transparent opacity-40")}
                     style={{ backgroundColor: c }}
                   />
                 ))}
               </div>
             </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={!name.trim()}
            className="h-20 bg-white text-black text-xl font-black rounded-3xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl disabled:opacity-20"
          >
            <Check size={28} strokeWidth={4} />
            CREATE
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function AddFolderModal({ isOpen, onClose, portfolioId }: { isOpen: boolean; onClose: () => void; portfolioId: string }) {
  const { addFolder } = useStore();
  const [name, setName] = useState('');

  const handleSave = () => {
    if (!name.trim()) return;
    addFolder({ id: Date.now().toString(), portfolioId, name: name.trim() });
    setName('');
    onClose();
  };

  if (!isOpen || !portfolioId) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md px-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div 
          className="bg-[#1c2128] w-full max-w-md rounded-[48px] p-10 flex flex-col gap-8 shadow-2xl border border-white/10"
          initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black uppercase tracking-widest text-white/40">New Folder</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full"><X size={24} /></button>
          </div>

          <div className="flex flex-col gap-3">
             <label className="text-[10px] font-black uppercase text-white/20 tracking-widest px-2">Folder Name</label>
             <input 
                className="bg-black/20 p-6 rounded-3xl text-xl font-black text-white outline-none border border-white/5"
                placeholder="E.g. Savings, Daily, Crypto..."
                value={name} onChange={e => setName(e.target.value)}
             />
          </div>

          <button 
            onClick={handleSave}
            disabled={!name.trim()}
            className="h-20 bg-accent text-white text-xl font-black rounded-3xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl disabled:opacity-20"
          >
            <FolderPlus size={28} strokeWidth={4} />
            ADD FOLDER
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
