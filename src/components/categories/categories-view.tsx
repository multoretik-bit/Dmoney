'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronRight, FolderPlus, Plus, Tag, LogOut, User as UserIcon, Mail, Fingerprint, Globe, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ColorPicker } from '@/components/ui/color-picker';
import { IconPicker } from '@/components/ui/icon-picker';
import { cn } from '@/lib/utils';

import { AddCategoryModal } from './add-category-modal';

export function CategoriesView() {
  const { user, setUser, pullData, pushData, categories, preferences, updatePreferences } = useStore();
  const { baseCurrency } = preferences;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
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
    <div className="p-6 flex flex-col gap-10 bg-[#0d1117] min-h-screen text-white pb-40">
      <header className="pt-12 px-2">
        <h1 className="text-4xl font-black uppercase tracking-tight text-white/90">Опции</h1>
      </header>

      {/* Account Info */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3 px-2">
          <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30">Аккаунт</span>
          <div className="h-px bg-white/5 flex-1" />
        </div>
        
        {user ? (
          <div className="bg-[#1c2128] rounded-[48px] p-8 border border-white/5 flex flex-col gap-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl -mr-16 -mt-16 group-hover:bg-accent/10 transition-all" />
            
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-accent/10 rounded-[32px] flex items-center justify-center text-accent shadow-inner">
                <UserIcon size={32} strokeWidth={3} />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                   <Mail size={12} className="text-white/20" />
                   <span className="text-lg font-black tracking-tight text-white truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                   <Fingerprint size={12} className="text-white/20" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-white/20 select-all truncate">ID: {user.id}</span>
                </div>
              </div>
              <button 
                onClick={async () => {
                  setIsSyncing(true);
                  try {
                    await pullData();
                    await pushData();
                  } finally {
                    setIsSyncing(false);
                  }
                }}
                disabled={isSyncing}
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all border border-white/5",
                  isSyncing ? "bg-accent/20 text-accent animate-spin" : "bg-white/5 text-white/40 hover:bg-white/10"
                )}
                title="Force Sync"
              >
                <RefreshCw size={20} />
              </button>
            </div>

            <button 
              onClick={async () => {
                 await supabase.auth.signOut();
                 setUser(null);
              }}
              className="w-full h-16 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-[24px] border border-red-500/20 transition-all font-black uppercase tracking-widest flex items-center justify-center gap-3"
            >
              <LogOut size={20} />
              Выйти из аккаунта
            </button>
          </div>
        ) : (
          <div className="bg-[#1c2128] rounded-[48px] p-10 border border-white/5 flex flex-col items-center gap-6 shadow-xl text-center">
             <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white/20 mb-2">
                <UserIcon size={32} />
             </div>
             <p className="font-black text-white/40 uppercase tracking-widest text-xs">Вы не вошли в аккаунт</p>
             <p className="text-white/20 text-xs px-10">Войдите, чтобы синхронизировать данные между устройствами.</p>
          </div>
        )}
      </section>

      {/* Currency Selection */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3 px-2">
          <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30">Настройки</span>
          <div className="h-px bg-white/5 flex-1" />
        </div>
        <div className="bg-[#1c2128] rounded-[48px] p-8 border border-white/5 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                  <Globe size={24} />
               </div>
               <div className="flex flex-col">
                 <span className="font-black text-white uppercase text-[9px] tracking-[0.2em] mb-1">Основная валюта</span>
                 <span className="text-xs font-bold text-white/40">Используется для расчетов</span>
               </div>
            </div>
             <div className="relative group">
                <select 
                  className="bg-white/5 pl-6 pr-10 py-4 rounded-2xl text-accent font-black border border-white/5 outline-none appearance-none cursor-pointer focus:border-accent/30 transition-all"
                  value={baseCurrency}
                  onChange={(e) => updatePreferences({ baseCurrency: e.target.value })}
                >
                  {['USD', 'EUR', 'RUB', 'KZT', 'THB', 'KGS'].map(c => <option key={c} value={c} className="bg-[#1c2128]">{c}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none group-hover:text-accent transition-colors" size={16} />
             </div>
          </div>
        </div>
      </section>

      <div className="flex justify-between items-center mt-6 px-2">
        <div className="flex flex-col">
           <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30 mb-1">Система</span>
           <h2 className="text-2xl font-black uppercase tracking-widest text-white/60">Категории</h2>
        </div>
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
