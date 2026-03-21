'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronRight, FolderPlus, Plus, Tag } from 'lucide-react';
import { ColorPicker } from '@/components/ui/color-picker';
import { IconPicker } from '@/components/ui/icon-picker';
import { cn } from '@/lib/utils';

import { AddCategoryModal } from './add-category-modal';

export function CategoriesView() {
  const { categories, preferences, updatePreferences } = useStore();
  const { baseCurrency } = preferences;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialParentId, setInitialParentId] = useState<string | undefined>(undefined);
  const [expandedHeads, setExpandedHeads] = useState<Record<string, boolean>>({});

  const toggleHead = (id: string) => {
    setExpandedHeads(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openAddSub = (id: string) => {
    setInitialParentId(id);
    setIsModalOpen(true);
  };

  const headCategories = categories.filter(c => !c.parentId);

  return (
    <div className="p-6 flex flex-col gap-8 bg-[#0d1117] min-h-screen text-white pb-40">
      <header className="pt-12 px-2">
        <h1 className="text-4xl font-black uppercase tracking-tight text-white/90">Setup</h1>
      </header>

      {/* Currency Selection */}
      <section className="bg-[#1c2128] rounded-[48px] p-8 border border-white/5 flex flex-col gap-4 shadow-xl">
        <div className="flex items-center justify-between">
           <div className="flex flex-col">
             <span className="font-black text-white/20 uppercase text-[9px] tracking-[0.2em] mb-1">Base Currency</span>
             <span className="text-xs font-bold text-white/40">Used for total calculations</span>
           </div>
           <select 
             className="bg-white/5 px-6 py-3 rounded-2xl text-accent font-black border border-white/5 outline-none appearance-none cursor-pointer"
             value={baseCurrency}
             onChange={(e) => updatePreferences({ baseCurrency: e.target.value })}
           >
             {['USD', 'EUR', 'RUB', 'KZT', 'THB', 'KGS'].map(c => <option key={c} value={c} className="bg-[#1c2128]">{c}</option>)}
           </select>
        </div>
      </section>

      <div className="flex justify-between items-center mt-6 px-2">
        <h2 className="text-2xl font-black uppercase tracking-widest text-white/20">Categories</h2>
        <button 
          onClick={() => { setInitialParentId(undefined); setIsModalOpen(true); }} 
          className="w-14 h-14 bg-white rounded-3xl flex items-center justify-center text-black shadow-2xl active:scale-90 transition-all"
        >
          <Plus size={28} strokeWidth={4} />
        </button>
      </div>

      <div className="flex flex-col gap-5">
        {headCategories.map(head => {
          const subs = categories.filter(c => c.parentId === head.id);
          const isExpanded = expandedHeads[head.id];

          return (
            <div key={head.id} className="flex flex-col gap-3">
              <button 
                onClick={() => toggleHead(head.id)}
                className="flex items-center justify-between p-7 bg-[#1c2128] rounded-[40px] border border-white/5 shadow-lg active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-5">
                   <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${head.color}15`, color: head.color }}>
                      {head.icon}
                   </div>
                   <span className="text-lg font-black tracking-tight">{head.name}</span>
                </div>
                {isExpanded ? <ChevronDown size={22} className="text-white/20" /> : <ChevronRight size={22} className="text-white/20" />}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="flex flex-col gap-3 overflow-hidden px-6"
                  >
                    {subs.map(sub => (
                      <div key={sub.id} className="p-5 bg-white/2 rounded-2xl flex items-center justify-between border border-white/5">
                         <div className="flex items-center gap-4">
                           <span className="text-xl">{sub.icon}</span>
                           <span className="font-bold text-white/70">{sub.name}</span>
                         </div>
                         <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.color }} />
                      </div>
                    ))}
                    <button 
                      onClick={() => openAddSub(head.id)}
                      className="p-5 bg-white/5 rounded-[24px] border border-dashed border-white/10 text-[10px] font-black uppercase tracking-widest text-white/20 hover:bg-white/10 transition-all"
                    >
                      + Add subcategory
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <AddCategoryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialParentId={initialParentId}
      />
    </div>
  );
}
