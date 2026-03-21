'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { AddExpenseModal } from './add-expense-modal';

export function ExpensesView() {
  const { expenses, preferences, categories } = useStore();
  const { baseCurrency } = preferences;
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculate totals
  const totalSpent = expenses.reduce((sum, e) => sum + e.convertedAmount, 0);

  return (
    <>
      <div className="p-4 flex flex-col gap-6">
        <header className="pt-8 pb-4">
          <h1 className="text-sm font-medium text-textMuted uppercase tracking-wider">Всего за месяц</h1>
          <div className="text-4xl font-bold mt-1 tracking-tight flex items-baseline gap-1">
            {baseCurrency === 'USD' ? '$' : baseCurrency === 'RUB' ? '₽' : baseCurrency} 
            {totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </header>

        <section className="bg-card rounded-3xl p-5 shadow-lg shadow-black/20 pb-20">
          <h2 className="text-lg font-semibold mb-4">История</h2>
          {expenses.length === 0 ? (
            <div className="text-center text-textMuted py-10">
              Пока нет трат. Нажмите + чтобы добавить.
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {expenses.slice().reverse().map((exp) => {
                const cat = categories.find(c => c.id === exp.categoryId) || { icon: '🔹', name: 'Другое', color: '#888' };
                return (
                  <div key={exp.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                        {cat.icon}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{cat.name}</div>
                        <div className="text-xs text-textMuted mt-0.5">
                          {format(new Date(exp.date), 'dd MMM HH:mm', { locale: ru })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg text-white">
                        -{exp.originalAmount} {exp.originalCurrency}
                      </div>
                      {exp.originalCurrency !== baseCurrency && (
                        <div className="text-xs text-textMuted">
                          ~{exp.convertedAmount.toFixed(2)} {baseCurrency}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* FAB */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-28 right-6 w-14 h-14 bg-accent rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(61,169,252,0.5)] active:scale-95 transition-transform z-40 hover:bg-accent/90"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>

      <AddExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
