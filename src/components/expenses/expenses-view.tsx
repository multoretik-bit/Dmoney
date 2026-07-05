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
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    ? { text: '#f59e0b', dim: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' }
    : viewMode === 'large'
      ? { text: '#8b5cf6', dim: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)' }
      : { text: '#60a5fa', dim: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)' };

  return (
    <div className="flex flex-col gap-6 pb-32">
      {/* Page header */}
      <header className="pt-8 flex flex-col items-center text-center gap-1">
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          {viewMode === 'work' ? 'Рабочие траты' : viewMode === 'large' ? 'Крупные покупки' : 'Обзор трат'}
        </h1>
        <p className="text-[13px] text-textMuted">
          {viewMode === 'work' ? 'Служебные расходы' : viewMode === 'large' ? 'Особые траты' : 'История и календарь'}
        </p>

        {/* View mode switcher */}
        <div className="mt-5 flex surface p-1 rounded-xl">
          <button
            onClick={() => setViewMode('personal')}
            className={cn(
              "px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200",
              viewMode === 'personal' ? "bg-white text-black" : "text-white/50 hover:text-white/70"
            )}
          >
            Личные
          </button>
          <button
            onClick={() => setViewMode('work')}
            className={cn(
              "px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200",
              viewMode === 'work' ? "text-white" : "text-white/50 hover:text-white/70"
            )}
            style={viewMode === 'work' ? { background: '#f59e0b' } : {}}
          >
            Рабочие
          </button>
          <button
            onClick={() => setViewMode('large')}
            className={cn(
              "px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200",
              viewMode === 'large' ? "text-white" : "text-white/50 hover:text-white/70"
            )}
            style={viewMode === 'large' ? { background: '#8b5cf6' } : {}}
          >
            Крупные
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-5">
        {/* Month Selector */}
        <div className="flex justify-between items-center p-1 rounded-xl surface self-center">
          <button
            onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
            className="p-2 text-white/40 hover:text-white/80 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex flex-col items-center min-w-[130px]">
            <span className="text-sm font-medium text-white leading-none capitalize">
              {format(currentMonth, 'MMMM', { locale: ru })}
            </span>
            <span className="text-[11px] text-textSubtle mt-1">
              {format(currentMonth, 'yyyy')}
            </span>
          </div>
          <button
            onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
            className="p-2 text-white/40 hover:text-white/80 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Summary Card */}
        <div className="rounded-2xl p-6 flex flex-col gap-6 surface">
          <div className="flex flex-col items-center text-center">
            <span className="text-[12px] text-textMuted">
              {isSameDay(selectedDate, new Date()) ? 'Траты за сегодня' : format(selectedDate, 'd MMMM', { locale: ru })}
            </span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-4xl font-semibold text-white leading-none tracking-tight tabular-nums">
                ${totalSpentToday.toFixed(1)}
              </span>
            </div>

            <div className="mt-4 flex flex-col items-center gap-0.5">
              <span className="text-[12px] text-textMuted capitalize">
                За {format(currentMonth, 'MMMM', { locale: ru })}
              </span>
              <span className="text-lg font-semibold tabular-nums" style={{ color: accentColor.text }}>
                ${totalSpentMonth.toFixed(1)}
              </span>
            </div>

            {/* Work budget limit */}
            {viewMode === 'work' && (preferences.workBudgetLimit || 0) > 0 && (
              <div className="mt-5 flex flex-col gap-2 w-full max-w-[220px]">
                <div className="flex justify-between items-end">
                  <span className="text-[11px] text-textMuted">Месячный лимит</span>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: accentColor.text }}>
                    {Math.round((totalSpentMonth / (preferences.workBudgetLimit || 1)) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: accentColor.text }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (expenses.filter(e => e.isWork && e.date.startsWith(format(currentMonth, 'yyyy-MM'))).reduce((s, e) => s + e.convertedAmount, 0) / (preferences.workBudgetLimit || 1)) * 100)}%` }}
                  />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[11px] text-textSubtle">
                    Лимит: {preferences.workBudgetLimit} {baseCurrency}
                  </span>
                  <button
                    onClick={() => {
                      const val = prompt('Введите новый лимит для рабочих трат:', preferences.workBudgetLimit?.toString());
                      if (val !== null) useStore.getState().updatePreferences({ workBudgetLimit: parseFloat(val) || 0 });
                    }}
                    className="text-[11px] font-medium transition-colors"
                    style={{ color: `${accentColor.text}99` }}
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
                className="mt-5 px-4 py-2 rounded-lg text-[12px] font-medium transition-all"
                style={{ background: accentColor.dim, border: `1px solid ${accentColor.border}`, color: accentColor.text }}
              >
                Установить лимит
              </button>
            )}

            {/* Large budget limit */}
            {viewMode === 'large' && (preferences.largeBudgetLimit || 0) > 0 && (
              <div className="mt-5 flex flex-col gap-2 w-full max-w-[220px]">
                <div className="flex justify-between items-end">
                  <span className="text-[11px] text-textMuted">Месячный лимит</span>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: accentColor.text }}>
                    {Math.round((totalSpentMonth / (preferences.largeBudgetLimit || 1)) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: accentColor.text }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (expenses.filter(e => e.isLarge && e.date.startsWith(format(currentMonth, 'yyyy-MM'))).reduce((s, e) => s + e.convertedAmount, 0) / (preferences.largeBudgetLimit || 1)) * 100)}%` }}
                  />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[11px] text-textSubtle">
                    Лимит: {preferences.largeBudgetLimit} {baseCurrency}
                  </span>
                  <button
                    onClick={() => {
                      const val = prompt('Введите новый лимит для крупных покупок:', preferences.largeBudgetLimit?.toString());
                      if (val !== null) useStore.getState().updatePreferences({ largeBudgetLimit: parseFloat(val) || 0 });
                    }}
                    className="text-[11px] font-medium transition-colors"
                    style={{ color: `${accentColor.text}99` }}
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
                className="mt-5 px-4 py-2 rounded-lg text-[12px] font-medium transition-all"
                style={{ background: accentColor.dim, border: `1px solid ${accentColor.border}`, color: accentColor.text }}
              >
                Установить лимит
              </button>
            )}
          </div>

          {/* Mini bar chart */}
          <div className="h-12 flex items-end justify-between gap-1 px-1">
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
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="rounded-2xl p-5 surface">
          <div className="grid grid-cols-7 gap-y-2 text-center">
            {['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'].map(d => (
              <span key={d} className="text-[11px] font-medium text-textSubtle mb-1">{d}</span>
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
                  className="relative flex flex-col items-center justify-center h-10 rounded-xl transition-all active:scale-90"
                  style={isSelected ? { background: accentColor.text } : {}}
                >
                  <span className={cn(
                    "text-[13px] font-medium transition-colors tabular-nums",
                    isSelected ? "text-white" : isCurrentMonth ? "text-white/70" : "text-white/15",
                    isToday && !isSelected && "text-accent-light"
                  )}>
                    {format(date, 'd')}
                  </span>
                  {hasSpending && !isSelected && (
                    <div
                      className="absolute bottom-1 w-1 h-1 rounded-full"
                      style={{ background: accentColor.text }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Transaction list */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 px-1">
            <span className="text-[12px] font-medium text-textMuted">История</span>
            <div className="h-px bg-white/[0.06] flex-1" />
          </div>

          <div className="flex flex-col gap-2">
            {dayExpenses.length === 0 ? (
              <div className="text-center py-14 rounded-2xl text-[13px] text-textSubtle border border-dashed border-white/[0.08]">
                Нет транзакций
              </div>
            ) : (
              dayExpenses.map((exp, idx) => {
                const cat = categories.find(c => c.id === exp.categoryId) || { icon: '🔹', name: 'Other', color: '#3b82f6' };
                const catColor = cat.color || '#3b82f6';

                return (
                  <motion.div
                    key={exp.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.2 }}
                    onClick={() => { setEditingExpense(exp); setIsModalOpen(true); }}
                    className="p-4 flex items-center justify-between active:scale-[0.99] transition-transform cursor-pointer rounded-2xl surface surface-hover"
                  >
                    {/* Category icon */}
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: `${catColor}18` }}
                      >
                        {cat.icon}
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[14px] font-medium text-white/90 leading-tight truncate">{cat.name}</span>
                        <span className="text-[12px] text-textSubtle tabular-nums">
                          {format(new Date(exp.date), 'HH:mm')}
                        </span>
                      </div>
                    </div>
                    {/* Amount */}
                    <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                      <span className="text-[15px] font-semibold text-white tabular-nums">
                        −${exp.convertedAmount.toFixed(1)}
                      </span>
                      <span className="text-[11px] text-textSubtle tabular-nums">
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

      {/* FAB */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-32 right-5 w-14 h-14 rounded-2xl flex items-center justify-center text-white active:scale-95 hover:opacity-90 transition-all z-40 shadow-card-lg"
        style={{ background: accentColor.text }}
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingExpense(null); }}
        editingExpense={editingExpense}
        initialViewMode={viewMode}
      />
    </div>
  );
}
