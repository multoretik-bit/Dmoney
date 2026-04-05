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
import { ChevronLeft, ChevronRight, Plus, ChevronDown, ChevronUp, Calendar as CalendarIcon, History } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ExpensesView() {
  const { expenses, preferences, categories } = useStore();
  const { baseCurrency } = preferences;
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isWorkMode, setIsWorkMode] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);

  const filteredExpenses = expenses.filter(e => isWorkMode ? !!e.isWork : !e.isWork);
  const dayExpenses = filteredExpenses.filter(e => isSameDay(new Date(e.date), selectedDate));
  const excludeIds = new Set(categories.filter(c => {
    const parent = c.parentId ? categories.find(p => p.id === c.parentId) : null;
    return c.excludeFromBudget || (parent && parent.excludeFromBudget);
  }).map(c => c.id));
  const totalSpentToday = dayExpenses
    .filter(e => isWorkMode || !excludeIds.has(e.categoryId))
    .reduce((sum, e) => sum + e.convertedAmount, 0);

  const totalSpentMonth = filteredExpenses
    .filter(e => e.date.startsWith(format(currentMonth, 'yyyy-MM')) && (isWorkMode || !excludeIds.has(e.categoryId)))
    .reduce((sum, e) => sum + e.convertedAmount, 0);

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
    const dayTotal = filteredExpenses
      .filter(e => isSameDay(new Date(e.date), date) && !excludeIds.has(e.categoryId))
      .reduce((sum, e) => sum + e.convertedAmount, 0);
    
    if (dayTotal === 0) return null;
    return dayTotal > 100 ? 'high' : 'low';
  };

  return (
    <div className="flex flex-col gap-8 pb-32">
       <header className="py-12 flex flex-col items-center justify-center text-center gap-2">
        <h1 className="text-3xl font-black text-white px-6">
          {isWorkMode ? 'Рабочие Траты' : 'Обзор Трат'}
        </h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
          {isWorkMode ? 'Служебные расходы' : 'История и Календарь'}
        </p>

        <div className="mt-6 flex bg-black/40 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
          <button 
            onClick={() => setIsWorkMode(false)}
            className={cn(
              "px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2",
              !isWorkMode ? "bg-white text-black shadow-xl" : "text-white/40"
            )}
          >
            Личные
          </button>
          <button 
            onClick={() => setIsWorkMode(true)}
            className={cn(
              "px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2",
              isWorkMode ? "bg-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.3)]" : "text-white/40"
            )}
          >
            Рабочие
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-8">
        {/* Month Selector & Summary Card */}
        <div className="flex flex-col gap-4">
           <div className="flex justify-between items-center bg-black/40 p-2 rounded-2xl border border-white/5 backdrop-blur-md self-center">
              <button 
                onClick={() => setCurrentMonth(prev => subMonths(prev, 1))} 
                className="p-2 text-white/20 hover:text-white transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex flex-col items-center min-w-[140px]">
                <span className="text-sm font-black uppercase tracking-widest text-white leading-none">
                  {format(currentMonth, 'MMMM', { locale: ru })}
                </span>
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1">
                  {format(currentMonth, 'yyyy')}
                </span>
              </div>
              <button 
                onClick={() => setCurrentMonth(prev => addMonths(prev, 1))} 
                className="p-2 text-white/20 hover:text-white transition-colors"
              >
                <ChevronRight size={20} />
              </button>
           </div>

           <div className="glass-card rounded-[40px] p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden group">
               <div className="flex flex-col items-center text-center">
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
                    {isSameDay(selectedDate, new Date()) ? 'Траты за сегодня' : format(selectedDate, 'd MMMM', { locale: ru })}
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-5xl font-black text-white leading-none">
                      ${totalSpentToday.toFixed(1)}
                    </span>
                  </div>
                  
                  <div className="mt-4 flex flex-col items-center">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">За {(format(currentMonth, 'MMMM', { locale: ru }))}</span>
                    <span className="text-xl font-black text-white/60">${totalSpentMonth.toFixed(1)}</span>
                  </div>
                  
                  {isWorkMode && (preferences.workBudgetLimit || 0) > 0 && (
                    <div className="mt-6 flex flex-col gap-2 w-full max-w-[200px]">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Месячный лимит</span>
                        <span className="text-sm font-black text-amber-500">
                          {Math.round((totalSpentMonth / (preferences.workBudgetLimit || 1)) * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-amber-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (expenses.filter(e => e.isWork && e.date.startsWith(format(currentMonth, 'yyyy-MM'))).reduce((s, e) => s + e.convertedAmount, 0) / (preferences.workBudgetLimit || 1)) * 100)}%` }}
                        />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.2em]">
                          Лимит: {preferences.workBudgetLimit} {baseCurrency}
                        </span>
                        <button 
                          onClick={() => {
                            const val = prompt('Введите новый лимит для рабочих трат:', preferences.workBudgetLimit?.toString());
                            if (val !== null) useStore.getState().updatePreferences({ workBudgetLimit: parseFloat(val) || 0 });
                          }}
                          className="text-[8px] font-black uppercase tracking-widest text-amber-500/40 hover:text-amber-500 transition-colors"
                        >
                          Изменить лимит
                        </button>
                      </div>
                    </div>
                  )}

                  {isWorkMode && (!preferences.workBudgetLimit || preferences.workBudgetLimit === 0) && (
                    <button 
                      onClick={() => {
                        const val = prompt('Установите лимит для рабочих трат:', '0');
                        if (val !== null) useStore.getState().updatePreferences({ workBudgetLimit: parseFloat(val) || 0 });
                      }}
                      className="mt-6 px-6 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[10px] font-black uppercase text-amber-500 tracking-widest hover:bg-amber-500/20 transition-all"
                    >
                      Установить лимит
                    </button>
                  )}
               </div>

              <div className="h-16 flex items-end justify-between gap-1.5 px-1">
                {eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }).map((date, i) => {
                  const dayTotal = filteredExpenses.filter(e => isSameDay(new Date(e.date), date)).reduce((sum, e) => sum + e.convertedAmount, 0);
                  const monthMax = Math.max(...eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }).map(d => 
                    filteredExpenses.filter(e => isSameDay(new Date(e.date), d)).reduce((sum, e) => sum + e.convertedAmount, 0)
                  ), 10);
                  const height = (dayTotal / monthMax) * 100;
                  const isSelected = isSameDay(date, selectedDate);
                  const isToday = isSameDay(date, new Date());

                  return (
                    <button 
                      key={i} 
                      onClick={() => setSelectedDate(date)}
                      className={cn(
                        "flex-1 rounded-full transition-all duration-500",
                        isSelected ? "bg-white" : isToday ? "bg-accent" : "bg-white/5 hover:bg-white/10"
                      )}
                      style={{ height: `${Math.max(height, 6)}%` }}
                    />
                  );
                })}
              </div>
           </div>
        </div>

        {/* Calendar Grid - Modern Glass */}
        <div className="glass-card rounded-[48px] p-8 shadow-2xl">
          <div className="grid grid-cols-7 gap-y-4 text-center">
            {['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'].map(d => (
              <span key={d} className="text-[9px] font-black text-white/10 tracking-widest uppercase mb-2">{d}</span>
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
                    isSelected ? "bg-accent text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] scale-110 z-10" : "hover:bg-white/5"
                  )}
                >
                  <span className={cn(
                    "text-[11px] font-black transition-colors",
                    isSelected ? "text-white" : isCurrentMonth ? "text-white/60" : "text-white/10",
                    isToday && !isSelected && "text-accent"
                  )}>
                    {format(date, 'd')}
                  </span>
                  {hasSpending && !isSelected && (
                    <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-accent shadow-[0_0_8px_rgba(59,130,246,1)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Transactions - Row Style */}
        <div className="flex flex-col gap-6">
           <div className="flex items-center gap-3 px-4">
              <span className="text-[11px] font-black uppercase text-white/30 tracking-[0.4em]">История</span>
              <div className="h-px bg-white/5 flex-1" />
           </div>
           
           <div className="flex flex-col gap-3">
              {dayExpenses.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] rounded-[40px] border-2 border-dashed border-white/5 text-[10px] font-black uppercase tracking-[0.4em] text-white/10">
                  Нет транзакций
                </div>
              ) : (
                dayExpenses.map((exp, idx) => {
                  const cat = categories.find(c => c.id === exp.categoryId) || { icon: '🔹', name: 'Other', color: '#888' };
                  return (
                    <motion.div 
                      key={exp.id} 
                      initial={{ opacity: 0, x: -20 }} 
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => { setEditingExpense(exp); setIsModalOpen(true); }}
                      className={cn(
                        "glass-card p-5 flex items-center justify-between group active:scale-[0.98] transition-all relative overflow-hidden cursor-pointer",
                        idx % 3 === 0 ? "neon-border-blue" : idx % 3 === 1 ? "neon-border-purple" : "neon-border-green"
                      )}
                    >
                      <div className="flex items-center gap-4 flex-1">
                         <div className="w-12 h-12 bg-white/[0.03] rounded-2xl flex items-center justify-center text-2xl border border-white/5 shadow-inner">
                           {cat.icon}
                         </div>
                         <div className="flex flex-col gap-1 min-w-0">
                           <span className="text-base font-black text-white leading-tight truncate">{cat.name}</span>
                           <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                             {format(new Date(exp.date), 'HH:mm')}
                           </span>
                         </div>
                       </div>
                       <div className="flex flex-col items-end">
                         <span className="text-lg font-black text-white">-${exp.convertedAmount.toFixed(1)}</span>
                         <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{exp.originalAmount.toFixed(1)} {exp.originalCurrency}</span>
                       </div>
                    </motion.div>
                  );
                })
              )}
           </div>
        </div>
      </div>

      <button 
        onClick={() => setIsModalOpen(true)}
        className={cn(
          "fixed bottom-32 right-8 w-20 h-20 rounded-[32px] flex items-center justify-center text-white shadow-2xl active:scale-95 hover:scale-105 transition-all z-40 group",
          isWorkMode ? "bg-amber-500 shadow-amber-500/20" : "bg-accent shadow-accent/20"
        )}
      >
        <Plus size={36} strokeWidth={4} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

       <AddExpenseModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingExpense(null); }} 
        editingExpense={editingExpense}
      />
    </div>
  );
}
