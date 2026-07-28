'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Plus, ReceiptText, Search } from 'lucide-react';
import { Expense, useStore } from '@/store/useStore';
import { AddExpenseModal } from './add-expense-modal';

export function OperationsView() {
  const { expenses, categories, wallets, preferences } = useStore();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  const filtered = [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter(expense => {
      const category = categories.find(item => item.id === expense.categoryId);
      const wallet = wallets.find(item => item.id === expense.walletId);
      return `${category?.name || ''} ${wallet?.name || ''}`.toLowerCase().includes(query.toLowerCase());
    });

  return (
    <div className="flex flex-col gap-5 pb-32">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-400/12 border border-blue-300/15 flex items-center justify-center text-blue-300">
            <ReceiptText size={20} />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">Операции</h1>
            <p className="text-xs text-white/40 mt-1">Полная история ваших расходов</p>
          </div>
        </div>
        <button
          onClick={() => { setEditing(null); setIsOpen(true); }}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-blue-600 text-white text-xs font-black"
        >
          <Plus size={16} /> Добавить операцию
        </button>
      </header>

      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.035] border border-white/[0.07]">
        <Search size={17} className="text-white/30" />
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Найти категорию или счёт"
          className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/25"
        />
      </div>

      <section className="rounded-[28px] p-4 sm:p-6 bg-[#0c1422] border border-white/[0.075]">
        <div className="space-y-1">
          {filtered.length === 0 ? (
            <div className="py-20 text-center text-sm text-white/30">Операций не найдено</div>
          ) : filtered.map(expense => {
            const category = categories.find(item => item.id === expense.categoryId);
            const wallet = wallets.find(item => item.id === expense.walletId);
            return (
              <button
                key={expense.id}
                onClick={() => { setEditing(expense); setIsOpen(true); }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.035] text-left transition-colors"
              >
                <span className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: `${category?.color || '#60a5fa'}18` }}>
                  {category?.icon || '•'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-white/85 truncate">{category?.name || 'Другое'}</span>
                  <span className="block text-[10px] text-white/30 mt-0.5">
                    {wallet?.name || 'Без счёта'} · {format(new Date(expense.date), 'd MMMM, HH:mm', { locale: ru })}
                  </span>
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
      />
    </div>
  );
}
