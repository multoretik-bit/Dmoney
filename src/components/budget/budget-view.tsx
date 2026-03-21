'use client';

import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

export function BudgetView() {
  const { expenses, preferences, categories } = useStore();
  const { baseCurrency } = preferences;

  // Group spends by category dynamically
  const spendingByCategory: Record<string, number> = {};
  expenses.forEach(e => {
    spendingByCategory[e.categoryId] = (spendingByCategory[e.categoryId] || 0) + e.convertedAmount;
  });

  const totalSpent = Object.values(spendingByCategory).reduce((acc, v) => acc + v, 0);
  const totalBudget = 2000; // Mock total budget for now

  return (
    <div className="p-4 flex flex-col gap-6">
      <header className="pt-8 pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Бюджет</h1>
        <p className="text-sm text-textMuted mt-1">Остаток на месяц: <span className="text-white font-medium">{(totalBudget - totalSpent).toLocaleString()} {baseCurrency}</span></p>
      </header>

      <div className="flex flex-col gap-4 pb-20">
        {categories.map(c => {
          const spent = spendingByCategory[c.id] || 0;
          const limit = 500; // Mock limit until we store limits in categories
          const percent = Math.min((spent / limit) * 100, 100);
          
          return (
            <div key={c.id} className="bg-card rounded-3xl p-5 shadow-lg flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center text-xl">{c.icon}</div>
                  <span className="font-semibold text-white">{c.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{spent.toFixed(0)} / {limit} {baseCurrency}</div>
                  <div className="text-xs text-textMuted">{limit - spent > 0 ? `осталось ${(limit - spent).toFixed(0)}` : 'превышено'}</div>
                </div>
              </div>
              <div className="h-3 w-full bg-background rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: c.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
