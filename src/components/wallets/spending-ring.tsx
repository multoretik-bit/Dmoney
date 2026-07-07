'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { useStore } from '@/store/useStore';

const SIZE = 160;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

export function SpendingRing() {
  const { categories, expenses, preferences } = useStore();
  const { baseCurrency } = preferences;

  const { spent, limit, segments } = useMemo(() => {
    const monthStr = format(new Date(), 'yyyy-MM');
    const excludeIds = new Set(
      categories
        .filter(c => {
          const parent = c.parentId ? categories.find(p => p.id === c.parentId) : null;
          return c.excludeFromBudget || (parent && parent.excludeFromBudget);
        })
        .map(c => c.id)
    );

    const monthExpenses = expenses.filter(e => e.date.startsWith(monthStr) && !e.isWork && !excludeIds.has(e.categoryId));

    const byCategory: Record<string, number> = {};
    monthExpenses.forEach(e => {
      byCategory[e.categoryId] = (byCategory[e.categoryId] || 0) + e.convertedAmount;
    });

    const totalLimit = categories.reduce((sum, c) => {
      const isExcluded = excludeIds.has(c.id);
      return sum + (!isExcluded && c.budgetLimit ? c.budgetLimit : 0);
    }, 0);

    const totalSpent = Object.values(byCategory).reduce((a, b) => a + b, 0);

    const topCategories = Object.entries(byCategory)
      .map(([catId, amount]) => {
        const cat = categories.find(c => c.id === catId);
        const count = monthExpenses.filter(e => e.categoryId === catId).length;
        return { id: catId, name: cat?.name || 'Other', color: cat?.color || '#3b82f6', amount, count };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);

    return { spent: totalSpent, limit: totalLimit, segments: topCategories };
  }, [categories, expenses]);

  const remaining = Math.max(0, limit - spent);
  const progress = limit > 0 ? Math.min(1, spent / limit) : (spent > 0 ? 1 : 0);

  let offsetAccum = 0;
  const total = segments.reduce((s, seg) => s + seg.amount, 0) || 1;

  return (
    <div className="glass-card rounded-[36px] p-7 flex flex-col gap-6">
      <div className="flex flex-col items-center gap-1">
        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} className="-rotate-90">
            <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke="rgba(255,255,255,0.06)" strokeWidth={STROKE} fill="none" />
            {segments.length > 0 ? segments.map((seg, idx) => {
              const fraction = seg.amount / total;
              const dash = fraction * CIRC;
              const gap = CIRC - dash;
              const strokeDashoffset = -offsetAccum;
              offsetAccum += dash;
              return (
                <circle
                  key={seg.id}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  stroke={seg.color}
                  strokeWidth={STROKE}
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                />
              );
            }) : (
              <circle
                cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
                stroke="#3b82f6" strokeWidth={STROKE}
                strokeDasharray={`${progress * CIRC} ${CIRC}`}
                strokeLinecap="round" fill="none"
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Потрачено</span>
            <span className="text-xl font-black text-white">{spent.toFixed(0)}</span>
            <span className="text-[9px] font-bold text-white/20">{baseCurrency}</span>
          </div>
        </div>
      </div>

      {limit > 0 && (
        <div className="flex justify-between px-2">
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/25">Лимит</span>
            <span className="text-sm font-black text-white">{limit.toFixed(0)}</span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/25">Остаток</span>
            <span className="text-sm font-black text-accent">{remaining.toFixed(0)}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {segments.length === 0 ? (
          <span className="text-center text-[10px] font-black uppercase tracking-widest text-white/15 py-2">
            Нет трат в этом месяце
          </span>
        ) : segments.map(seg => (
          <div key={seg.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: seg.color }} />
              <span className="text-xs font-bold text-white/70 truncate">{seg.name}</span>
            </div>
            <div className="flex flex-col items-end flex-shrink-0 pl-2">
              <span className="text-xs font-black text-white">{seg.amount.toFixed(0)} {baseCurrency}</span>
              <span className="text-[9px] font-bold text-white/25">{seg.count} операций</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
