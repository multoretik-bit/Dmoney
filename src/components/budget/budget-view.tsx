'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Edit3, ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BudgetView() {
  const { expenses, preferences, categories, setCategoryLimit } = useStore();
  const { baseCurrency } = preferences;
  const [activeTab, setActiveTab] = useState<'plan' | 'remaining' | 'insights'>('plan');

  // Calculate spending per category
  const spendingByCategory: Record<string, number> = {};
  expenses.forEach(e => {
    spendingByCategory[e.categoryId] = (spendingByCategory[e.categoryId] || 0) + e.convertedAmount;
  });

  const totalPlanned = categories.reduce((sum, c) => sum + (c.budgetLimit || 0), 0);
  const totalSpent = Object.values(spendingByCategory).reduce((sum, val) => sum + val, 0);

  const handleEditLimit = (categoryId: string) => {
    const limit = prompt("Введите лимит для категории:");
    if (limit !== null) {
      setCategoryLimit(categoryId, parseFloat(limit));
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-32 bg-[#0d1117]">
      {/* Dynamic Header */}
      <header className="bg-[#00bfa5] pt-14 pb-10 px-6 rounded-b-[48px] shadow-2xl relative">
        <div className="flex justify-between items-center mb-10">
          <button className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white active:scale-95">
            <Settings size={22} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-white font-black uppercase tracking-widest text-sm">Budget:</span>
            <div className="flex items-center gap-1 bg-white/20 px-4 py-2 rounded-xl text-white font-bold cursor-pointer active:scale-95">
               Мой бюджет <ChevronDown size={16} />
            </div>
          </div>
          <button className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white active:scale-95">
            <Edit3 size={20} />
          </button>
        </div>

        <div className="flex justify-between items-center bg-black/10 p-1 rounded-2xl">
           {(['plan', 'remaining', 'insights'] as const).map(tab => (
             <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all",
                activeTab === tab ? "bg-white text-[#00bfa5] shadow-lg" : "text-white/60"
              )}
             >
               {tab}
             </button>
           ))}
        </div>
      </header>

      <div className="p-6 -mt-10">
        {/* Total Planned Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-[#1c2128] rounded-[40px] p-10 border border-white/5 shadow-2xl flex flex-col items-center gap-6"
        >
          <div className="relative w-40 h-40">
            {/* Simple circular progress visualization */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              <circle 
                cx="50" cy="50" r="45" fill="none" stroke="#00bfa5" strokeWidth="10" 
                strokeDasharray={`${(totalSpent / totalPlanned) * 282 || 0} 282`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center mt-2">
              <div className="text-[10px] font-black text-white/40 uppercase tracking-widest text-center px-4">Total planned expenses</div>
              <div className="text-3xl font-black text-white">
                {baseCurrency === 'USD' ? '$' : '₽'}
                {totalPlanned.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex flex-col w-full gap-5">
            {categories.map((cat, idx) => {
              const spent = spendingByCategory[cat.id] || 0;
              const limit = cat.budgetLimit || 0;
              const percentSpent = limit > 0 ? (spent / limit) * 100 : 0;

              return (
                <motion.div 
                  key={cat.id} 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex flex-col gap-2 group cursor-pointer"
                  onClick={() => handleEditLimit(cat.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-sm font-bold text-white group-hover:text-accent transition-colors">{cat.name}</span>
                      <span className="text-[10px] font-black text-white/30 uppercase">{percentSpent.toFixed(0)}%</span>
                    </div>
                    <div className="text-sm font-black text-white">
                      {baseCurrency === 'USD' ? '$' : '₽'}{limit.toLocaleString()}
                    </div>
                  </div>
                  <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(percentSpent, 100)}%` }}
                      className="h-full rounded-full transition-all"
                      style={{ backgroundColor: cat.color }}
                    />
                  </div>
                </motion.div>
              );
            })}
            
            <button className="flex items-center justify-center gap-2 py-4 mt-2 bg-white/5 rounded-2xl text-textMuted border border-white/5 hover:bg-white/10 active:scale-98 transition-all">
              <Plus size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Add Category</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
