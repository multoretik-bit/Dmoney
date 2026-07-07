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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SpendingRing } from '@/components/wallets/spending-ring';

export function ExpensesView() {
  const { expenses, preferences, categories } = useStore();
  const { baseCurrency } = preferences;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewMode, setViewMode] = useState<'personal' | 'work' | 'large'>('personal');

  const filteredExpenses = expenses.filter(e => {
    if (viewMode === 'work') return !!e.isWork;
    if (viewMode === 'large') return !!e.isLarge;
    return !e.isWork && !e.isLarge;
  });
  const dayExpenses = filteredExpenses.filter(e => isSameDay(new Date(e.date), selectedDate));
  const excludeIds = new Set(categories.filter(c => {
    const parent = c.parentId ? categories.find(p => p.id === c.parentId) : null;
    return c.excludeFromBudget || (parent && parent.excludeFromBudget);
  }).map(c => c.id));
  const totalSpentToday = dayExpenses
    .filter(e => viewMode !== 'personal' || !excludeIds.has(e.categoryId))
    .reduce((sum, e) => sum + e.convertedAmount, 0);

  const totalSpentMonth = filteredExpenses
    .filter(e => e.date.startsWith(format(currentMonth, 'yyyy-MM')) && (viewMode !== 'personal' || !excludeIds.has(e.categoryId)))
    .reduce((sum, e) => sum + e.convertedAmount, 0);

  const ringExpenses = filteredExpenses.filter(e =>
    e.date.startsWith(format(currentMonth, 'yyyy-MM')) && (viewMode !== 'personal' || !excludeIds.has(e.categoryId))
  );
  const ringLimit = viewMode === 'work'
    ? (preferences.workBudgetLimit || 0)
    : viewMode === 'large'
      ? (preferences.largeBudgetLimit || 0)
      : categories.reduce((sum, c) => sum + (!excludeIds.has(c.id) && c.budgetLimit ? c.budgetLimit : 0), 0);

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

  const accentColor = viewMode === 'work'
    ? { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b', glow: 'rgba(245,158,11,0.3)' }
    : viewMode === 'large'
      ? { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.3)', text: '#8b5cf6', glow: 'rgba(139,92,246,0.3)' }
      : { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', text: '#60a5fa', glow: 'rgba(59,130,246,0.4)' };

  return (
    <div className="flex flex-col gap-7 pb-32">
      {/* Page header */}
      <header className="pt-10 flex flex-col items-center text-center gap-2">
        <h1 className="text-3xl font-black text-white tracking-tight">
          {viewMode === 'work' ? 'Рабочие Траты' : viewMode === 'large' ? 'Крупные Покупки' : 'Обзор Трат'}
        </h1>
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20">
          {viewMode === 'work' ? 'Служебные расходы' : viewMode === 'large' ? 'Особые траты' : 'История и Календарь'}
        </p>

        {/* View mode switcher */}
        <div className="mt-5 flex bg-black/40 p-1 rounded-2xl border border-white/[0.06]" style={{ backdropFilter: 'blur(16px)' }}>
          <button
            onClick={() => setViewMode('personal')}
            className={cn(
              "px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-200",
              viewMode === 'personal' ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white/60"
            )}
          >
            Личные
          </button>
          <button
            onClick={() => setViewMode('work')}
            className={cn(
              "px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-200",
              viewMode === 'work' ? "text-white shadow-lg" : "text-white/40 hover:text-white/60"
            )}
            style={viewMode === 'work' ? { background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 4px 20px rgba(245,158,11,0.3)' } : {}}
          >
            Рабочие
          </button>
          <button
            onClick={() => setViewMode('large')}
            className={cn(
              "px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-200",
              viewMode === 'large' ? "text-white shadow-lg" : "text-white/40 hover:text-white/60"
            )}
            style={viewMode === 'large' ? { background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', boxShadow: '0 4px 20px rgba(139,92,246,0.3)' } : {}}
          >
            Крупные
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
      <div className="flex-1 min-w-0 w-full flex flex-col gap-6">
        {/* Month Selector */}
        <div
          className="flex justify-between items-center p-1.5 rounded-2xl self-center"
          style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <button
            onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
            className="p-2 text-white/25 hover:text-white/70 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex flex-col items-center min-w-[130px]">
            <span className="text-sm font-black uppercase tracking-widest text-white leading-none">
              {format(currentMonth, 'MMMM', { locale: ru })}
            </span>
            <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-1">
              {format(currentMonth, 'yyyy')}
            </span>
          </div>
          <button
            onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
            className="p-2 text-white/25 hover:text-white/70 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Summary Card — gradient hero */}
        <div
          className="rounded-[40px] p-8 flex flex-col gap-6 relative overflow-hidden"
          style={{
            background: `linear-gradient(145deg, ${accentColor.bg} 0%, rgba(9,14,26,1) 60%)`,
            border: `1px solid ${accentColor.border}`,
            boxShadow: `0 8px 40px rgba(0,0,0,0.5), 0 0 60px -20px ${accentColor.glow}`,
          }}
        >
          {/* Subtle radial glow top-left */}
          <div
            className="absolute -top-8 -left-8 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, ${accentColor.glow} 0%, transparent 70%)`, opacity: 0.5 }}
          />

          <div className="flex flex-col items-center text-center relative z-10">
            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">
              {isSameDay(selectedDate, new Date()) ? 'Траты за сегодня' : format(selectedDate, 'd MMMM', { locale: ru })}
            </span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-5xl font-black text-white leading-none tracking-tight">
                ${totalSpentToday.toFixed(1)}
              </span>
            </div>

            <div className="mt-4 flex flex-col items-center gap-0.5">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
                За {format(currentMonth, 'MMMM', { locale: ru })}
              </span>
              <span className="text-xl font-black" style={{ color: accentColor.text }}>
                ${totalSpentMonth.toFixed(1)}
              </span>
            </div>

            {/* Work budget limit */}
            {viewMode === 'work' && (preferences.workBudgetLimit || 0) > 0 && (
              <div className="mt-6 flex flex-col gap-2 w-full max-w-[200px]">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Месячный лимит</span>
                  <span className="text-sm font-black" style={{ color: accentColor.text }}>
                    {Math.round((totalSpentMonth / (preferences.workBudgetLimit || 1)) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/[0.07] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: accentColor.text }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (expenses.filter(e => e.isWork && e.date.startsWith(format(currentMonth, 'yyyy-MM'))).reduce((s, e) => s + e.convertedAmount, 0) / (preferences.workBudgetLimit || 1)) * 100)}%` }}
                  />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">
                    Лимит: {preferences.workBudgetLimit} {baseCurrency}
                  </span>
                  <button
                    onClick={() => {
                      const val = prompt('Введите новый лимит для рабочих трат:', preferences.workBudgetLimit?.toString());
                      if (val !== null) useStore.getState().updatePreferences({ workBudgetLimit: parseFloat(val) || 0 });
                    }}
                    className="text-[8px] font-black uppercase tracking-widest transition-colors"
                    style={{ color: `${accentColor.text}60` }}
                  >
                    Изменить лимит
                  </button>
                </div>
              </div>
            )}

            {viewMode === 'work' && (!preferences.workBudgetLimit || preferences.workBudgetLimit === 0) && (
              <button
                onClick={() => {
                  const val = prompt('Установите лимит для рабочих трат:', '0');
                  if (val !== null) useStore.getState().updatePreferences({ workBudgetLimit: parseFloat(val) || 0 });
                }}
                className="mt-6 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                style={{ background: `${accentColor.bg}`, border: `1px solid ${accentColor.border}`, color: accentColor.text }}
              >
                Установить лимит
              </button>
            )}

            {/* Large budget limit */}
            {viewMode === 'large' && (preferences.largeBudgetLimit || 0) > 0 && (
              <div className="mt-6 flex flex-col gap-2 w-full max-w-[200px]">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Месячный лимит</span>
                  <span className="text-sm font-black" style={{ color: accentColor.text }}>
                    {Math.round((totalSpentMonth / (preferences.largeBudgetLimit || 1)) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/[0.07] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: accentColor.text }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (expenses.filter(e => e.isLarge && e.date.startsWith(format(currentMonth, 'yyyy-MM'))).reduce((s, e) => s + e.convertedAmount, 0) / (preferences.largeBudgetLimit || 1)) * 100)}%` }}
                  />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">
                    Лимит: {preferences.largeBudgetLimit} {baseCurrency}
                  </span>
                  <button
                    onClick={() => {
                      const val = prompt('Введите новый лимит для крупных покупок:', preferences.largeBudgetLimit?.toString());
                      if (val !== null) useStore.getState().updatePreferences({ largeBudgetLimit: parseFloat(val) || 0 });
                    }}
                    className="text-[8px] font-black uppercase tracking-widest transition-colors"
                    style={{ color: `${accentColor.text}60` }}
                  >
                    Изменить лимит
                  </button>
                </div>
              </div>
            )}

            {viewMode === 'large' && (!preferences.largeBudgetLimit || preferences.largeBudgetLimit === 0) && (
              <button
                onClick={() => {
                  const val = prompt('Установите лимит для крупных покупок:', '0');
                  if (val !== null) useStore.getState().updatePreferences({ largeBudgetLimit: parseFloat(val) || 0 });
                }}
                className="mt-6 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                style={{ background: `${accentColor.bg}`, border: `1px solid ${accentColor.border}`, color: accentColor.text }}
              >
                Установить лимит
              </button>
            )}
          </div>

          {/* Mini bar chart */}
          <div className="h-14 flex items-end justify-between gap-1 px-1 relative z-10">
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
                  className="flex-1 rounded-full transition-all duration-300"
                  style={{
                    height: `${Math.max(height, 8)}%`,
                    background: isSelected ? '#ffffff' : isToday ? accentColor.text : 'rgba(255,255,255,0.08)',
                    boxShadow: isSelected ? `0 0 8px rgba(255,255,255,0.3)` : undefined,
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Calendar Grid */}
        <div
          className="rounded-[40px] p-6 shadow-card"
          style={{
            background: 'linear-gradient(145deg, #0d1626 0%, #090e1a 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="grid grid-cols-7 gap-y-3 text-center">
            {['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'].map(d => (
              <span key={d} className="text-[9px] font-black text-white/15 tracking-widest uppercase mb-1">{d}</span>
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
                  className="relative flex flex-col items-center justify-center h-11 rounded-2xl transition-all active:scale-90"
                  style={isSelected ? {
                    background: accentColor.text,
                    boxShadow: `0 0 20px ${accentColor.glow}`,
                    transform: 'scale(1.08)',
                    zIndex: 10,
                  } : {}}
                >
                  <span className={cn(
                    "text-[11px] font-black transition-colors",
                    isSelected ? "text-white" : isCurrentMonth ? "text-white/60" : "text-white/12",
                    isToday && !isSelected && "text-blue-400"
                  )}>
                    {format(date, 'd')}
                  </span>
                  {hasSpending && !isSelected && (
                    <div
                      className="absolute bottom-1.5 w-1 h-1 rounded-full"
                      style={{ background: accentColor.text, boxShadow: `0 0 6px ${accentColor.glow}` }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Transaction list */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3 px-2">
            <span className="text-[10px] font-black uppercase text-white/25 tracking-[0.4em]">История</span>
            <div className="h-px bg-white/[0.06] flex-1" />
          </div>

          <div className="flex flex-col gap-2.5">
            {dayExpenses.length === 0 ? (
              <div
                className="text-center py-16 rounded-[36px] text-[10px] font-black uppercase tracking-[0.4em] text-white/15"
                style={{ border: '2px dashed rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}
              >
                Нет транзакций
              </div>
            ) : (
              dayExpenses.map((exp, idx) => {
                const cat = categories.find(c => c.id === exp.categoryId) || { icon: '🔹', name: 'Other', color: '#3b82f6' };
                const catColor = cat.color || '#3b82f6';

                return (
                  <motion.div
                    key={exp.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.25 }}
                    onClick={() => { setEditingExpense(exp); setIsModalOpen(true); }}
                    className="p-4 flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(145deg, #0d1626 0%, #090e1a 100%)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderLeft: `3px solid ${catColor}`,
                      borderRadius: '20px',
                      boxShadow: `0 4px 20px rgba(0,0,0,0.3), -4px 0 16px -6px ${catColor}40`,
                    }}
                  >
                    {/* Category icon */}
                    <div className="flex items-center gap-3.5 flex-1">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ background: `${catColor}18`, border: `1px solid ${catColor}25` }}
                      >
                        {cat.icon}
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[15px] font-bold text-white/90 leading-tight truncate">{cat.name}</span>
                        <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest">
                          {format(new Date(exp.date), 'HH:mm')}
                        </span>
                      </div>
                    </div>
                    {/* Amount */}
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-[17px] font-black text-white">
                        −${exp.convertedAmount.toFixed(1)}
                      </span>
                      <span className="text-[9px] font-bold text-white/25 uppercase tracking-widest">
                        {exp.originalAmount.toFixed(1)} {exp.originalCurrency}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[320px] flex-shrink-0">
        <SpendingRing expenses={ringExpenses} limit={ringLimit} emptyLabel="Нет трат за этот месяц" />
      </div>
      </div>

      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingExpense(null); }}
        editingExpense={editingExpense}
        initialViewMode={viewMode}
      />
    </div>
  );
}
