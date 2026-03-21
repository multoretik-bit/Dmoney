'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Edit3, ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BudgetView() {
  const { expenses, preferences, categories, setCategoryLimit, addExpense } = useStore();
  const { baseCurrency } = preferences;
  const [activeTab, setActiveTab] = useState<'plan' | 'remaining' | 'insights'>('plan');

  // Logic to calculate spending
  const spendingByCategory: Record<string, number> = {};
  expenses.forEach(e => {
    spendingByCategory[e.categoryId] = (spendingByCategory[e.categoryId] || 0) + e.convertedAmount;
  });

  const headCategories = categories.filter(c => !c.parentId);
  const totalPlanned = categories.reduce((sum, c) => sum + (c.budgetLimit || 0), 0);
  const totalSpent = Object.values(spendingByCategory).reduce((sum, val) => sum + val, 0);

  return (
    <div className="flex flex-col min-h-screen pb-32 bg-[#0d1117] text-white">
      {/* Header with Segmented Control */}
      <header className="p-6 pt-12 flex flex-col gap-6 bg-[#1c2128] rounded-b-[48px] border-b border-white/5">
        <div className="flex justify-between items-center px-2">
           <button className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center"><Settings size={20} /></button>
           <h1 className="text-xl font-black uppercase tracking-widest">Budget</h1>
           <button className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center"><Edit3 size={18} /></button>
        </div>

        <div className="bg-white/5 p-1 rounded-2xl flex">
          {(['plan', 'remaining', 'insights'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all",
                activeTab === tab ? "bg-white text-black shadow-lg" : "text-white/40"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <div className="p-6 flex flex-col gap-8">
        {activeTab === 'plan' && (
           <div className="flex flex-col gap-10">
              {/* Total Planned Donut */}
              <div className="bg-[#1c2128] rounded-[48px] p-10 border border-white/5 flex flex-col items-center gap-6 shadow-2xl">
                 <div className="relative w-48 h-48">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                       <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                       <circle 
                         cx="50" cy="50" r="42" fill="none" stroke="#00bfa5" strokeWidth="10" 
                         strokeDasharray="210 264" strokeLinecap="round" 
                       />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                       <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] leading-tight px-6 mb-1">Total planned expenses</span>
                       <span className="text-3xl font-black">${totalPlanned.toLocaleString()}</span>
                    </div>
                 </div>
                 
                 {/* Legend */}
                 <div className="grid grid-cols-2 gap-x-8 gap-y-3 w-full border-t border-white/5 pt-6">
                    {headCategories.slice(0, 4).map(head => (
                       <div key={head.id} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: head.color }} />
                          <span className="text-[10px] font-black text-white/40 uppercase truncate">{head.name}</span>
                          <span className="text-[10px] font-black ml-auto">32%</span>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Constructor */}
              <div className="flex flex-col gap-6">
                 {headCategories.map(head => (
                   <div key={head.id} className="flex flex-col gap-4">
                      <div className="flex justify-between items-center px-2">
                         <span className="text-xs font-black uppercase text-white/40 tracking-widest">{head.name}</span>
                         <Plus size={16} className="text-white/20" />
                      </div>
                      <div className="flex flex-col gap-2">
                         {categories.filter(c => c.parentId === head.id).map(sub => (
                           <div key={sub.id} className="bg-[#1c2128] p-5 rounded-[28px] border border-white/5 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: `${sub.color}20` }}>{sub.icon}</div>
                                 <span className="font-bold">{sub.name}</span>
                              </div>
                              <span className="font-black text-white/40">${sub.budgetLimit || 0}</span>
                           </div>
                         ))}
                      </div>
                   </div>
                 ))}
                 <button className="py-5 bg-white/5 rounded-[28px] border border-dashed border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:bg-white/10 transition-all">
                    New section
                 </button>
              </div>
           </div>
        )}

        {activeTab === 'remaining' && (
           <div className="flex flex-col gap-10">
              {/* Semi-circle Summary */}
              <div className="bg-[#1c2128] rounded-[48px] p-10 pt-16 flex flex-col items-center gap-4 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#00bfa5] to-transparent" />
                 <div className="relative w-64 h-32 overflow-hidden">
                    <svg className="w-64 h-64 -rotate-180" viewBox="0 0 100 100">
                       <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                       <circle 
                         cx="50" cy="50" r="45" fill="none" stroke="#00bfa5" strokeWidth="10" 
                         strokeDasharray="141 282" strokeLinecap="round" 
                       />
                    </svg>
                 </div>
                 <div className="flex flex-col items-center -mt-8 relative z-10">
                    <span className="text-4xl font-black text-white">$1,141</span>
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Left to spend</span>
                 </div>
              </div>

              {/* Detailed Progress List */}
              <div className="flex flex-col gap-4">
                 {categories.filter(c => c.parentId).map(sub => {
                   const spent = spendingByCategory[sub.id] || 0;
                   const limit = sub.budgetLimit || 1;
                   const percent = Math.min((spent / limit) * 100, 100);
                   return (
                     <div key={sub.id} className="bg-[#1c2128] p-6 rounded-[32px] border border-white/5 flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-white/5">{sub.icon}</div>
                              <div className="flex flex-col">
                                 <span className="font-bold">{sub.name}</span>
                                 <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">${spent} / ${limit}</span>
                              </div>
                           </div>
                           <button className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/40 active:scale-90"><Plus size={18} /></button>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                           <div className="h-full rounded-full transition-all duration-700 bg-accent" style={{ width: `${percent}%` }} />
                        </div>
                     </div>
                   );
                 })}
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
