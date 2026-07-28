'use client';

import { useMemo, useState } from 'react';
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format,
  isSameDay, startOfMonth, startOfWeek, subMonths,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, ReceiptText, Search } from 'lucide-react';
import { Expense, useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { AddExpenseModal } from './add-expense-modal';
import { SpendingRing } from '@/components/wallets/spending-ring';

type ViewMode = 'personal' | 'work' | 'large';

export function OperationsView() {
  const { expenses, categories, wallets, preferences } = useStore();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('personal');

  const filteredByMode = useMemo(() => expenses.filter(expense => {
    if (viewMode === 'work') return !!expense.isWork;
    if (viewMode === 'large') return !!expense.isLarge;
    return !expense.isWork && !expense.isLarge;
  }), [expenses, viewMode]);

  const excludedCategoryIds = useMemo(() => new Set(categories.filter(category => {
    const parent = category.parentId ? categories.find(item => item.id === category.parentId) : null;
    return category.excludeFromBudget || parent?.excludeFromBudget;
  }).map(category => category.id)), [categories]);

  const monthKey = format(currentMonth, 'yyyy-MM');
  const monthExpenses = filteredByMode.filter(expense =>
    expense.date.startsWith(monthKey)
    && (viewMode !== 'personal' || !excludedCategoryIds.has(expense.categoryId))
  );
  const dayExpenses = filteredByMode
    .filter(expense => isSameDay(new Date(expense.date), selectedDate))
    .filter(expense => {
      const category = categories.find(item => item.id === expense.categoryId);
      const wallet = wallets.find(item => item.id === expense.walletId);
      return `${category?.name || ''} ${wallet?.name || ''}`.toLowerCase().includes(query.toLowerCase());
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const budgetLimit = viewMode === 'work'
    ? (preferences.workBudgetLimit || 0)
    : viewMode === 'large'
      ? (preferences.largeBudgetLimit || 0)
      : categories.reduce((sum, category) =>
        sum + (!excludedCategoryIds.has(category.id) && category.budgetLimit ? category.budgetLimit : 0), 0);

  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }),
  });

  const dayTotal = (date: Date) => filteredByMode
    .filter(expense => isSameDay(new Date(expense.date), date))
    .reduce((sum, expense) => sum + expense.convertedAmount, 0);

  const moveMonth = (direction: -1 | 1) => {
    const next = direction < 0 ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1);
    setCurrentMonth(next);
    setSelectedDate(startOfMonth(next));
  };

  return (
    <div className="flex flex-col gap-5 pb-32">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-400/12 border border-blue-300/15 flex items-center justify-center text-blue-300">
            <ReceiptText size={20} />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">Операции</h1>
            <p className="text-xs text-white/40 mt-1">Календарь и история расходов</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex p-1 rounded-2xl bg-white/[0.035] border border-white/[0.07]">
            {(['personal', 'work', 'large'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'px-3.5 py-2 rounded-xl text-[11px] font-bold',
                  viewMode === mode ? 'bg-white/10 text-white' : 'text-white/35'
                )}
              >
                {mode === 'personal' ? 'Личные' : mode === 'work' ? 'Рабочие' : 'Крупные'}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setEditing(null); setIsOpen(true); }}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-blue-600 text-white text-xs font-black"
          >
            <Plus size={16} /> Добавить операцию
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-8 rounded-[28px] p-5 sm:p-6 bg-[#0c1422] border border-white/[0.075]">
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => moveMonth(-1)} className="p-2.5 rounded-xl bg-white/5 text-white/40 hover:text-white">
              <ChevronLeft size={18} />
            </button>
            <div className="text-center">
              <p className="text-sm font-black text-white capitalize">{format(currentMonth, 'LLLL yyyy', { locale: ru })}</p>
              <p className="text-[10px] text-white/30 mt-1">Нажмите на день, чтобы увидеть операции</p>
            </div>
            <button onClick={() => moveMonth(1)} className="p-2.5 rounded-xl bg-white/5 text-white/40 hover:text-white">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'].map(day => (
              <span key={day} className="py-2 text-center text-[9px] font-black tracking-wider text-white/25">{day}</span>
            ))}
            {calendarDays.map(date => {
              const selected = isSameDay(date, selectedDate);
              const inMonth = date.getMonth() === currentMonth.getMonth();
              const total = dayTotal(date);
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    'min-h-16 sm:min-h-20 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all',
                    selected
                      ? 'bg-blue-500/20 border-blue-300/45 text-white'
                      : inMonth
                        ? 'bg-white/[0.025] border-white/[0.055] text-white/65 hover:bg-white/[0.05]'
                        : 'border-transparent text-white/15'
                  )}
                >
                  <span className="text-xs font-black">{format(date, 'd')}</span>
                  {total > 0 && (
                    <span className={cn('text-[9px] font-bold tabular-nums', selected ? 'text-blue-200' : 'text-white/30')}>
                      {total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toFixed(0)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="xl:col-span-4">
          <SpendingRing expenses={monthExpenses} limit={budgetLimit} emptyLabel="Нет трат за этот месяц" />
        </div>
      </section>

      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.035] border border-white/[0.07]">
        <Search size={17} className="text-white/30" />
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Найти среди операций выбранного дня"
          className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/25"
        />
      </div>

      <section className="rounded-[28px] p-4 sm:p-6 bg-[#0c1422] border border-white/[0.075]">
        <div className="flex items-center justify-between gap-3 px-2 mb-3">
          <div>
            <h2 className="text-base font-black text-white">{format(selectedDate, 'd MMMM', { locale: ru })}</h2>
            <p className="text-[10px] text-white/30 mt-1">
              Потрачено {dayTotal(selectedDate).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} {preferences.baseCurrency}
            </p>
          </div>
          <span className="text-xs font-black text-blue-300">{dayExpenses.length} операций</span>
        </div>
        <div className="space-y-1">
          {dayExpenses.length === 0 ? (
            <div className="py-16 text-center text-sm text-white/30">В этот день операций нет</div>
          ) : dayExpenses.map(expense => {
            const category = categories.find(item => item.id === expense.categoryId);
            const wallet = wallets.find(item => item.id === expense.walletId);
            return (
              <button
                key={expense.id}
                onClick={() => { setEditing(expense); setIsOpen(true); }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.035] text-left"
              >
                <span className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: `${category?.color || '#60a5fa'}18` }}>
                  {category?.icon || '•'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-white/85 truncate">{category?.name || 'Другое'}</span>
                  <span className="block text-[10px] text-white/30 mt-0.5">{wallet?.name || 'Без счёта'} · {format(new Date(expense.date), 'HH:mm')}</span>
                </span>
                <span className="text-sm font-black text-white tabular-nums">
                  −{expense.convertedAmount.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} {preferences.baseCurrency}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <AddExpenseModal
        isOpen={isOpen}
        onClose={() => { setIsOpen(false); setEditing(null); }}
        editingExpense={editing}
        initialViewMode={viewMode}
      />
    </div>
  );
}
