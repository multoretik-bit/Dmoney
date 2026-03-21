'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronRight, FolderPlus, Plus, Tag } from 'lucide-react';
import { ColorPicker } from '@/components/ui/color-picker';
import { IconPicker } from '@/components/ui/icon-picker';
import { cn } from '@/lib/utils';

function AddCategoryModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addCategory, categories } = useStore();
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const [color, setColor] = useState('#f59e0b');
  const [icon, setIcon] = useState('🛒');

  const headCategories = categories.filter(c => !c.parentId);

  const handleSave = () => {
    if (!name) return;
    addCategory({
      id: Date.now().toString(),
      name,
      parentId,
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
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div 
            className="bg-[#0d1117] w-full h-[85vh] rounded-t-[40px] flex flex-col p-8 shadow-2xl relative border-t border-white/5"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 250 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-2xl font-bold text-white">Новая категория</h2>
               <button onClick={onClose} className="p-3 bg-white/5 rounded-full text-white/40"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-8 hide-scrollbar pb-24">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-white/20 uppercase tracking-widest px-1">Название</label>
                <input 
                  className="bg-white/5 p-5 rounded-2xl outline-none border border-white/5 text-lg font-medium text-white" 
                  placeholder="Например, Продукты" 
                  value={name} onChange={e => setName(e.target.value)} 
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-white/20 uppercase tracking-widest px-1">Родительская категория</label>
                <select 
                  className="bg-white/5 p-5 rounded-2xl outline-none border border-white/5 text-white" 
                  value={parentId || ''} onChange={e => setParentId(e.target.value || undefined)}
                >
                  <option value="">Нет (Главная категория)</option>
                  {headCategories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>

              <ColorPicker color={color} onChange={setColor} />
              <IconPicker icon={icon} onChange={setIcon} />
            </div>

            <button onClick={handleSave} className="h-16 bg-white text-black text-lg font-black rounded-3xl z-[110] shadow-2xl active:scale-[0.98]">
              Создать категорию
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function CategoriesView() {
  const { categories, preferences, updatePreferences } = useStore();
  const { baseCurrency } = preferences;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedHeads, setExpandedHeads] = useState<Record<string, boolean>>({});

  const toggleHead = (id: string) => {
    setExpandedHeads(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const headCategories = categories.filter(c => !c.parentId);

  return (
    <div className="p-6 flex flex-col gap-8 bg-[#0d1117] min-h-screen text-white pb-32">
      <header className="pt-8">
        <h1 className="text-4xl font-black uppercase tracking-tight">Setup</h1>
      </header>

      {/* Currency Selection */}
      <section className="bg-[#1c2128] rounded-[32px] p-8 border border-white/5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
           <span className="font-bold text-white/40 uppercase text-[10px] tracking-widest">Base Currency</span>
           <select 
             className="bg-white/5 px-4 py-2 rounded-xl text-accent font-black"
             value={baseCurrency}
             onChange={(e) => updatePreferences({ baseCurrency: e.target.value })}
           >
             {['USD', 'EUR', 'RUB', 'KZT'].map(c => <option key={c} value={c}>{c}</option>)}
           </select>
        </div>
      </section>

      <div className="flex justify-between items-center mt-4">
        <h2 className="text-2xl font-black uppercase tracking-widest opacity-40">Categories</h2>
        <button onClick={() => setIsModalOpen(true)} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-black shadow-lg">
          <Plus size={24} strokeWidth={3} />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {headCategories.map(head => {
          const subs = categories.filter(c => c.parentId === head.id);
          const isExpanded = expandedHeads[head.id];

          return (
            <div key={head.id} className="flex flex-col gap-3">
              <button 
                onClick={() => toggleHead(head.id)}
                className="flex items-center justify-between p-6 bg-[#1c2128] rounded-[32px] border border-white/5"
              >
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-white/5">{head.icon}</div>
                   <span className="font-bold">{head.name}</span>
                </div>
                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="flex flex-col gap-2 overflow-hidden px-4"
                  >
                    {subs.map(sub => (
                      <div key={sub.id} className="p-5 bg-white/5 rounded-2xl flex items-center gap-4">
                         <span className="text-xl">{sub.icon}</span>
                         <span className="font-medium text-white/60">{sub.name}</span>
                      </div>
                    ))}
                    <button className="p-4 bg-white/5 rounded-2xl border border-dashed border-white/10 text-[10px] font-black uppercase text-white/20">
                      + Add subcategory
                    </button>
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
