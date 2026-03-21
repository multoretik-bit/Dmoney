'use client';

import { useState } from 'react';
import { useStore, Category } from '@/store/useStore';
import { format, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { AddExpenseModal } from './add-expense-modal';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ExpensesView() {
  const { expenses, preferences, categories } = useStore();
  const { baseCurrency } = preferences;
  const [activeTab, setActiveTab] = useState<'overview' | 'spending' | 'list'>('spending');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'heads' | 'subs'>('heads');

  // Head categories
  const headCategories = categories.filter(c => !c.parentId);

  const [activeCategory, setActiveCategory] = useState<Category | null>(headCategories[0] || null);

  // Calculate spending per head category (including subcategories)
  const headCategorySpending = headCategories.map(head => {
    const spent = expenses.filter(e => {
      const cat = categories.find(c => c.id === e.categoryId);
      return cat?.id === head.id || cat?.parentId === head.id;
    }).reduce((sum, e) => sum + e.convertedAmount, 0);
    return { ...head, spent };
  }).filter(h => h.spent > 0);

  const totalSpent = headCategorySpending.reduce((sum, h) => sum + h.spent, 0);

  // Donut SVG logic
  let currentOffset = 0;
  const segments = headCategorySpending.map(h => {
    const percentage = totalSpent > 0 ? (h.spent / totalSpent) * 100 : 0;
    const dashArray = `${percentage * 2.51} 251.2`;
    const offset = -currentOffset;
    currentOffset += percentage;
    return { ...h, dashArray, offset };
  });

  const displayCategory = activeCategory || headCategories[0];
  const displaySpent = headCategorySpending.find(h => h.id === displayCategory?.id)?.spent || 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#0d1117] text-white pb-32">
      <header className="p-6 pt-12 flex flex-col gap-6">
        <div className="flex justify-between items-center px-2">
           <div className="flex items-center gap-2">
              <button onClick={() => setCurrentMonth(prev => new Date(prev.setMonth(prev.getMonth() - 1)))} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-all active:scale-95 text-white/40"><ChevronLeft size={18} /></button>
              <div className="flex flex-col items-center">
                <span className="text-xl font-black uppercase tracking-widest leading-none">{format(currentMonth, 'MMMM yyyy', { locale: ru })}</span>
                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">{expenses.length} TRNS</span>
              </div>
              <button onClick={() => setCurrentMonth(prev => new Date(prev.setMonth(prev.getMonth() + 1)))} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-all active:scale-95 text-white/40"><ChevronRight size={18} /></button>
           </div>
           <button onClick={() => setIsModalOpen(true)} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all active:scale-95"><Plus size={24} /></button>
        </div>

        <div className="bg-white/5 p-1 rounded-2xl flex">
          {(['overview', 'spending', 'list'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-4 text-[10px] font-black uppercase tracking-[0.25em] rounded-xl transition-all",
                activeTab === tab ? "bg-white text-black shadow-lg" : "text-white/40"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 hide-scrollbar flex flex-col gap-8 pb-32">
        {activeTab === 'spending' && (
           <>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#1c2128] p-5 rounded-[32px] border border-white/5 flex flex-col items-center gap-1 shadow-2xl">
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest leading-none">Income</span>
                    <span className="text-sm font-black text-[#00bfa5] leading-none">+$0</span>
                </div>
                <div className="bg-[#1c2128] p-5 rounded-[32px] border border-white/5 flex flex-col items-center gap-1 shadow-2xl">
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest leading-none">Expenses</span>
                    <span className="text-sm font-black text-[#ff4b91] leading-none">-${totalSpent.toLocaleString()}</span>
                </div>
                <div className="bg-[#1c2128] p-5 rounded-[32px] border border-white/5 flex flex-col items-center gap-1 shadow-2xl">
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest leading-none">Left</span>
                    <span className="text-sm font-black text-white leading-none">${(0 - totalSpent).toLocaleString()}</span>
                </div>
              </div>

              {/* Center Donut Chart */}
              <div className="relative w-80 h-80 mx-auto flex items-center justify-center">
                 <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                   <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                   {segments.map((seg) => (
                     <motion.circle 
                       key={seg.id}
                       initial={{ strokeDasharray: "0 251.2" }}
                       animate={{ strokeDasharray: seg.dashArray }}
                       cx="50" cy="50" r="40" fill="none" stroke={seg.color} strokeWidth="10" 
                       strokeDashoffset={seg.offset * 2.51} strokeLinecap="round" 
                       className="cursor-pointer transition-all hover:stroke-[12px]"
                       onClick={() => setActiveCategory(seg)}
                     />
                   ))}
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none">
                    <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center text-3xl shadow-xl">{displayCategory?.icon || '📦'}</div>
                    <span className="text-xs font-black uppercase text-white/40 tracking-widest">{displayCategory?.name || 'Total'}</span>
                    <span className="text-4xl font-black text-white leading-none">${displaySpent.toLocaleString()}</span>
                 </div>
              </div>

              {/* Category List */}
              <div className="flex flex-col gap-4">
                <div className="flex bg-white/5 p-1 rounded-2xl w-fit">
                   <button 
                     onClick={() => setViewMode('heads')}
                     className={cn("px-4 py-2 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all", viewMode === 'heads' ? "bg-white/10 text-white" : "text-white/20")}
                   >Head Categories</button>
                   <button 
                     onClick={() => setViewMode('subs')}
                     className={cn("px-4 py-2 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all", viewMode === 'subs' ? "bg-white/10 text-white" : "text-white/20")}
                   >Categories</button>
                </div>
                
                <div className="flex flex-col gap-3">
                  {(viewMode === 'heads' ? headCategories : categories.filter(c => c.parentId)).map(cat => {
                    const spent = expenses
                      .filter(e => {
                        if (viewMode === 'heads') {
                          const expenseCat = categories.find(c => c.id === e.categoryId);
                          return expenseCat?.id === cat.id || expenseCat?.parentId === cat.id;
                        }
                        return e.categoryId === cat.id;
                      })
                      .reduce((sum, e) => sum + e.convertedAmount, 0);

                    return (
                      <motion.div 
                        key={cat.id} 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-[#1c2128] p-6 rounded-[32px] flex items-center justify-between border border-white/5 hover:border-white/10 transition-all cursor-pointer group"
                        onClick={() => setActiveCategory(cat)}
                      >
                         <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-[22px] flex items-center justify-center text-2xl shadow-lg border border-white/5" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                              {cat.icon}
                            </div>
                            <span className="font-black uppercase tracking-widest text-sm opacity-80 group-hover:opacity-100 transition-opacity">{cat.name}</span>
                         </div>
                         <div className="flex items-center gap-4">
                           <span className="text-lg font-black">${spent.toLocaleString()}</span>
                           <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-white/20 group-hover:text-white/40"><ChevronRight size={16} /></div>
                         </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
           </>
        )}

        {activeTab === 'overview' && (
           <div className="flex flex-col gap-8">
              <div className="bg-[#1c2128] rounded-[40px] p-8 border border-white/5 h-64 flex flex-col justify-between shadow-2xl">
                 <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Expenses</span>
                       <span className="text-3xl font-black text-white">${totalSpent.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                       <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-accent" />
                          <span className="text-[8px] font-bold text-white/40 uppercase">This period</span>
                       </div>
                    </div>
                 </div>
                 <div className="w-full h-24 bg-white/5 rounded-2xl flex items-center justify-center text-white/10 font-black italic">CHART ANIMATION</div>
              </div>

              <div className="bg-[#1c2128] rounded-[48px] p-8 border border-white/5 shadow-2xl">
                <div className="grid grid-cols-7 gap-y-6 text-center">
                  {['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'].map(d => (
                    <span key={d} className="text-[8px] font-black text-white/20 tracking-widest uppercase">{d}</span>
                  ))}
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <span className="text-[10px] font-black text-white/40">{i+1}</span>
                      {i % 4 === 0 && <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_white]" />}
                    </div>
                  ))}
                </div>
              </div>
           </div>
        )}

        {activeTab === 'list' && (
           <div className="flex flex-col gap-4">
              {expenses.length === 0 ? (
                <div className="text-center text-white/20 py-20 font-black uppercase tracking-widest">No transactions</div>
              ) : (
                expenses.map(exp => {
                  const cat = categories.find(c => c.id === exp.categoryId) || { icon: '🔹', name: 'Other', color: '#888' };
                  return (
                    <div key={exp.id} className="bg-[#1c2128] p-6 rounded-[32px] flex items-center justify-between border border-white/5 shadow-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-2xl">{cat.icon}</div>
                        <div className="flex flex-col">
                          <span className="font-bold">{cat.name}</span>
                          <span className="text-[10px] font-black text-white/20 uppercase tracking-tighter">{format(new Date(exp.date), 'dd MMM, HH:mm', { locale: ru })}</span>
                        </div>
                      </div>
                      <span className="text-xl font-black">-{exp.originalAmount} {exp.originalCurrency}</span>
                    </div>
                  );
                })
              )}
           </div>
        )}
      </div>

      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-32 right-8 w-20 h-20 bg-white rounded-full flex items-center justify-center text-black shadow-[0_20px_40px_rgba(255,255,255,0.15)] active:scale-90 transition-all z-40"
      >
        <Plus size={36} strokeWidth={3} />
      </button>

      <AddExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
