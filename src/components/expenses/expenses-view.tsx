'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { AddExpenseModal } from './add-expense-modal';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ExpensesView() {
  const { expenses, preferences, categories } = useStore();
  const { baseCurrency } = preferences;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Month range
  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });

  // Grouping logic
  const dailyTotals: Record<string, number> = {};
  expenses.forEach(e => {
    const d = format(new Date(e.date), 'yyyy-MM-dd');
    dailyTotals[d] = (dailyTotals[d] || 0) + e.convertedAmount;
  });

  const totalSpentMonth = days.reduce((sum, day) => {
    const d = format(day, 'yyyy-MM-dd');
    return sum + (dailyTotals[d] || 0);
  }, 0);

  // Chart data (SVG Points)
  const chartPoints = days.map((day, i) => {
    const d = format(day, 'yyyy-MM-dd');
    const spent = dailyTotals[d] || 0;
    const x = (i / (days.length - 1)) * 100;
    const y = 80 - (Math.min(spent / 500, 1) * 60); // Max 500 for scaling demo
    return `${x},${y}`;
  }).join(' ');

  const selectedDayExpenses = selectedDate 
    ? expenses.filter(e => isSameDay(new Date(e.date), selectedDate))
    : [];

  return (
    <div className="flex flex-col min-h-screen bg-[#0d1117] pb-32">
       {/* Global Spent Header */}
       <header className="p-8 pb-4">
          <div className="bg-[#1c2128] rounded-[48px] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-[80px]" />
             <div className="flex flex-col gap-1 relative z-10">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Spent this month</span>
                <div className="text-5xl font-black text-white leading-tight">
                  {baseCurrency === 'USD' ? '$' : '₽'}
                  {totalSpentMonth.toLocaleString()}
                </div>
             </div>

             {/* Simple Line Chart */}
             <div className="mt-8 h-32 relative group">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path 
                    d={`M 0,100 L ${chartPoints} L 100,100 Z`}
                    fill="url(#chartGradient)"
                    className="transition-all duration-1000"
                  />
                  <polyline
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={chartPoints}
                    className="transition-all duration-1000"
                  />
                  {/* Last point dot */}
                  {days.length > 0 && dailyTotals[format(new Date(), 'yyyy-MM-dd')] && (
                    <circle cx="100" cy="20" r="3" fill="#8b5cf6" className="animate-pulse" />
                  )}
                </svg>
                <div className="flex justify-between mt-2 px-1">
                   <span className="text-[8px] font-bold text-white/20">1</span>
                   <span className="text-[8px] font-bold text-white/20">{days.length}</span>
                </div>
             </div>
          </div>
       </header>

       {/* Calendar Grid Section */}
       <section className="px-8 mt-4">
          <div className="bg-[#1c2128] rounded-[48px] p-8 border border-white/5 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                 <button className="p-3 bg-white/5 rounded-full text-white/40"><ChevronLeft size={20} /></button>
                 <h2 className="text-xl font-black text-white">{format(currentMonth, 'MMMM yyyy', { locale: ru })}</h2>
                 <button className="p-3 bg-white/5 rounded-full text-white/40"><ChevronRight size={20} /></button>
              </div>

              <div className="grid grid-cols-7 gap-y-4 text-center mb-4">
                 {['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'].map(d => (
                   <span key={d} className="text-[8px] font-black text-white/20 tracking-widest">{d}</span>
                 ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                 {/* Calendar Empty Padding */}
                 {Array.from({ length: (getDay(start) + 6) % 7 }).map((_, i) => <div key={i} />)}
                 
                 {days.map(day => {
                   const d = format(day, 'yyyy-MM-dd');
                   const spent = dailyTotals[d] || 0;
                   const isToday = isSameDay(day, new Date());
                   
                   return (
                     <button 
                        key={d} 
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          "aspect-square rounded-2xl flex flex-col items-center justify-center gap-0.5 border transition-all active:scale-90",
                          spent > 0 
                            ? "bg-[#332b4a] border-[#8b5cf6]/30 text-white" 
                            : "bg-white/5 border-transparent text-white/40",
                          isToday && "ring-2 ring-accent ring-offset-2 ring-offset-[#0d1117]"
                        )}
                     >
                        <span className="text-[10px] font-black">{format(day, 'd')}</span>
                        {spent > 0 && (
                          <span className="text-[7px] font-black opacity-60">
                            {baseCurrency === 'USD' ? '$' : ''}{spent.toFixed(0)}
                          </span>
                        )}
                     </button>
                   );
                 })}
              </div>
          </div>
       </section>

       {/* FAB */}
       <button 
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-32 right-8 w-18 h-18 bg-white rounded-full flex items-center justify-center text-black shadow-2xl active:scale-95 transition-all z-40 hover:rotate-90"
        >
          <Plus size={32} strokeWidth={3} />
       </button>

       {/* Day Details Modal */}
       <AnimatePresence>
          {selectedDate && (
            <motion.div 
               className="fixed inset-0 z-[100] flex items-end bg-black/80 backdrop-blur-xl"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setSelectedDate(null)}
            >
               <motion.div 
                  className="bg-[#0d1117] w-full max-h-[70vh] rounded-t-[48px] flex flex-col p-8 border-t border-white/5"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  onClick={e => e.stopPropagation()}
               >
                  <div className="flex justify-between items-center mb-8">
                     <div>
                        <h3 className="text-3xl font-black text-white">{format(selectedDate, 'EEEE, dd MMM', { locale: ru })}</h3>
                        <div className="text-white/40 font-bold mt-1 uppercase tracking-widest text-xs">
                          Итого: {baseCurrency === 'USD' ? '$' : '₽'}{(dailyTotals[format(selectedDate, 'yyyy-MM-dd')] || 0).toLocaleString()}
                        </div>
                     </div>
                     <button onClick={() => setSelectedDate(null)} className="p-3 bg-white/5 rounded-full text-white/40"><X size={24} /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto flex flex-col gap-4 hide-scrollbar">
                     {selectedDayExpenses.length === 0 ? (
                       <div className="py-10 text-center text-white/20 font-bold uppercase">No records</div>
                     ) : (
                       selectedDayExpenses.map(exp => {
                         const cat = categories.find(c => c.id === exp.categoryId) || { icon: '🔹', name: 'Other', color: '#888' };
                         return (
                           <div key={exp.id} className="bg-white/5 p-6 rounded-[28px] flex items-center justify-between border border-white/5">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-2xl">{cat.icon}</div>
                                 <div className="flex flex-col">
                                    <span className="font-bold text-white/80">{cat.name}</span>
                                    <span className="text-[10px] font-black uppercase text-white/20 tracking-tighter">14:00</span>
                                 </div>
                              </div>
                              <div className="text-xl font-black text-white">
                                 -{exp.originalAmount.toLocaleString()} {exp.originalCurrency}
                              </div>
                           </div>
                         );
                       })
                     )}
                  </div>
               </motion.div>
            </motion.div>
          )}
       </AnimatePresence>

       <AddExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
