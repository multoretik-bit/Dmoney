'use client';

import { useState } from 'react';
import { useStore, Category, Expense } from '@/store/useStore';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  isSameDay, 
  eachDayOfInterval, 
  startOfWeek, 
  endOfWeek,
  addMonths,
  subMonths
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { AddExpenseModal } from './add-expense-modal';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, ChevronDown, ChevronUp, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ExpensesView() {
  const { expenses, preferences, categories } = useStore();
  const { baseCurrency } = preferences;
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);

  const dayExpenses = expenses.filter(e => isSameDay(new Date(e.date), selectedDate));
  const totalSpentToday = dayExpenses.reduce((sum, e) => sum + e.convertedAmount, 0);

  // Group daily expenses by category
  const groupedExpenses = dayExpenses.reduce((acc, exp) => {
    const cat = categories.find(c => c.id === exp.categoryId) || { id: 'other', name: 'Other', icon: '🔹', color: '#888' };
    if (!acc[cat.id]) {
      acc[cat.id] = { category: cat, items: [], total: 0 };
    }
    acc[cat.id].items.push(exp);
    acc[cat.id].total += exp.convertedAmount;
    return acc;
  }, {} as Record<string, { category: any, items: Expense[], total: number }>);

  // Calendar logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getDaySpendingStatus = (date: Date) => {
    const dayTotal = expenses
      .filter(e => isSameDay(new Date(e.date), date))
      .reduce((sum, e) => sum + e.convertedAmount, 0);
    
    if (dayTotal === 0) return null;
    if (dayTotal > 100) return 'hight'; // Just a placeholder logic
    return 'lite';
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0d1117] text-white pb-32">
      <header className="p-6 pt-12 flex flex-col gap-6">
        <div className="flex justify-between items-center px-2">
           <div className="flex items-center gap-3">
              <button 
                onClick={() => setCurrentMonth(prev => subMonths(prev, 1))} 
                className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-all active:scale-95 text-white/40"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex flex-col items-center min-w-[120px]">
                <span className="text-xl font-black uppercase tracking-widest leading-none">
                  {format(currentMonth, 'MMMM', { locale: ru })}
                </span>
                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">
                  {format(currentMonth, 'yyyy')}
                </span>
              </div>
              <button 
                onClick={() => setCurrentMonth(prev => addMonths(prev, 1))} 
                className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-all active:scale-95 text-white/40"
              >
                <ChevronRight size={18} />
              </button>
           </div>
           <button 
            onClick={() => setIsModalOpen(true)} 
            className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all active:scale-95 border border-white/5 shadow-xl"
           >
             <Plus size={24} />
           </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 hide-scrollbar flex flex-col gap-8 pb-32">
        {/* Spent Today Card */}
        <div className="flex flex-col gap-4">
           <button 
             onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
             className="bg-[#1c2128] rounded-[40px] p-8 border border-white/5 flex flex-col gap-2 shadow-2xl relative overflow-hidden group active:scale-[0.98] transition-all"
           >
              <div className="absolute top-0 right-0 p-6 text-white/10 transition-transform group-hover:scale-110">
                {isSummaryExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
              </div>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
                {isSameDay(selectedDate, new Date()) ? 'Траты за сегодня' : `Траты за ${format(selectedDate, 'd MMMM', { locale: ru })}`}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white leading-none">
                  ${totalSpentToday.toFixed(1)}
                </span>
              </div>

              {/* Monthly Spending Chart (Strip) */}
              <div className="h-16 flex items-end justify-between gap-1 mt-6 px-1">
                {eachDayOfInterval({ 
                  start: startOfMonth(currentMonth), 
                  end: endOfMonth(currentMonth) 
                }).map((date, i) => {
                  const dayTotal = expenses
                    .filter(e => isSameDay(new Date(e.date), date))
                    .reduce((sum, e) => sum + e.convertedAmount, 0);
                  
                  // Scale logic: find max in month or use a reasonable cap
                  const monthMax = Math.max(...eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }).map(d => 
                    expenses.filter(e => isSameDay(new Date(e.date), d)).reduce((sum, e) => sum + e.convertedAmount, 0)
                  ), 10);
                  
                  const height = (dayTotal / monthMax) * 100;
                  const isSelected = isSameDay(date, selectedDate);
                  const isToday = isSameDay(date, new Date());

                  return (
                    <div 
                      key={i} 
                      className={cn(
                        "flex-1 rounded-full transition-all duration-500",
                        isSelected ? "bg-white" : isToday ? "bg-accent" : "bg-white/10"
                      )}
                      style={{ height: `${Math.max(height, 4)}%`, minWidth: '2px' }}
                    />
                  );
                })}
              </div>
              
              <AnimatePresence>
                {isSummaryExpanded && dayExpenses.length > 0 && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-3"
                  >
                    {Object.values(groupedExpenses).map(({ category, total }) => (
                      <div key={category.id} className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full">
                        <span className="text-xs">{category.icon}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">${total.toFixed(1)}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
           </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-[#1c2128] rounded-[48px] p-8 border border-white/5 shadow-2xl">
          <div className="grid grid-cols-7 gap-y-4 text-center">
            {['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'].map(d => (
              <span key={d} className="text-[8px] font-black text-white/20 tracking-widest uppercase mb-2">{d}</span>
            ))}
            {calendarDays.map((date, i) => {
              const isSelected = isSameDay(date, selectedDate);
              const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
              const hasSpending = getDaySpendingStatus(date);
              const isToday = isSameDay(date, new Date());

              return (
                <button 
                  key={i} 
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "relative flex flex-col items-center justify-center h-12 rounded-2xl transition-all active:scale-90",
                    isSelected ? "bg-white shadow-[0_10px_20px_rgba(255,255,255,0.1)] scale-110 z-10" : "hover:bg-white/5"
                  )}
                >
                  <span className={cn(
                    "text-[10px] font-black transition-colors",
                    isSelected ? "text-black" : isCurrentMonth ? "text-white/60" : "text-white/10",
                    isToday && !isSelected && "text-accent"
                  )}>
                    {format(date, 'd')}
                  </span>
                  {hasSpending && (
                    <div className={cn(
                      "absolute bottom-2 w-1 h-1 rounded-full",
                      isSelected ? "bg-black/20" : "bg-accent shadow-[0_0_8px_white]"
                    )} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Transactions */}
        <div className="flex flex-col gap-4">
           <div className="flex items-center gap-2 px-2">
              <CalendarIcon size={12} className="text-white/20" />
              <span className="text-[10px] font-black uppercase text-white/20 tracking-widest">
                Transactions • {dayExpenses.length}
              </span>
           </div>
           
           <div className="flex flex-col gap-3">
              {dayExpenses.length === 0 ? (
                <div className="text-center text-white/10 py-12 bg-white/2 rounded-[32px] border border-dashed border-white/5 font-black uppercase text-[10px] tracking-widest">
                  Нет транзакций
                </div>
              ) : (
                dayExpenses.map(exp => {
                  const cat = categories.find(c => c.id === exp.categoryId) || { icon: '🔹', name: 'Other', color: '#888' };
                  return (
                    <motion.div 
                      key={exp.id} 
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      className="bg-[#1c2128] p-6 rounded-[32px] flex items-center justify-between border border-white/5 shadow-xl group hover:border-white/10 transition-all border-l-4"
                      style={{ borderLeftColor: cat.color }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                          {cat.icon}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-white/90 group-hover:text-white transition-colors">{cat.name}</span>
                          <span className="text-[10px] font-black text-white/20 uppercase tracking-tighter">
                            {format(new Date(exp.date), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xl font-black text-white">-${exp.originalAmount.toLocaleString()}</span>
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{exp.originalCurrency}</span>
                      </div>
                    </motion.div>
                  );
                })
              )}
           </div>
        </div>
      </div>

      {/* Floating Add Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-32 right-8 w-20 h-20 bg-white rounded-full flex items-center justify-center text-black shadow-[0_20px_40px_rgba(255,255,255,0.25)] active:scale-90 hover:scale-105 transition-all z-40 border-8 border-[#0d1117]"
      >
        <Plus size={36} strokeWidth={4} />
      </button>

      <AddExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
