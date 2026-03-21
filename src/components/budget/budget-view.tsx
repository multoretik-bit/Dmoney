'use client';

import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

export function BudgetView() {
  const { expenses, baseCurrency } = useStore();

  // Static budgets for UI prototyping
  const budgets = [
    { id: '1', name: 'Еда', icon: '🍔', limit: 500, categoryId: '1' },
    { id: '2', name: 'Транспорт', icon: '🚕', limit: 150, categoryId: '2' },
    { id: '3', name: 'Жильё', icon: '🏠', limit: 1000, categoryId: '3' },
  ];

  const getSpent = (catId: string) => {
    return expenses
      .filter(e => e.categoryId === catId)
      .reduce((sum, e) => sum + e.convertedAmount, 0);
  };

  const totalBudget = budgets.reduce((acc, b) => acc + b.limit, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + getSpent(b.categoryId), 0);

  return (
    <div className="p-4 flex flex-col gap-6">
      <header className="pt-8 pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Бюджет</h1>
        <p className="text-sm text-textMuted mt-1">Остаток на месяц: <span className="text-white font-medium">{baseCurrency} {(totalBudget - totalSpent).toLocaleString()}</span></p>
      </header>

      <div className="flex flex-col gap-4 pb-20">
        {budgets.map(b => {
          const spent = getSpent(b.categoryId);
          const percent = Math.min((spent / b.limit) * 100, 100);
          
          let colorClass = 'bg-success';
          if (percent > 75) colorClass = 'bg-warning';
          if (percent > 90) colorClass = 'bg-danger';

          return (
            <div key={b.id} className="bg-card rounded-3xl p-5 shadow-lg flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center text-xl">{b.icon}</div>
                  <span className="font-semibold text-white">{b.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{spent.toFixed(0)} / {b.limit} {baseCurrency}</div>
                  <div className="text-xs text-textMuted">{b.limit - spent > 0 ? `осталось ${(b.limit - spent).toFixed(0)}` : 'превышено'}</div>
                </div>
              </div>
              <div className="h-3 w-full bg-background rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all duration-500", colorClass)} style={{ width: `${percent}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
