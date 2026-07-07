'use client';

import { useMemo } from 'react';
import { useStore, Expense } from '@/store/useStore';

const SIZE = 176;
const STROKE = 18;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

export function SpendingRing({
  expenses,
  limit,
  emptyLabel = 'Нет трат за этот период',
}: {
  expenses: Expense[];
  limit: number;
  emptyLabel?: string;
}) {
  const { categories, preferences } = useStore();
  const { baseCurrency } = preferences;

  const { spent, segments } = useMemo(() => {
    const byCategory: Record<string, number> = {};
    expenses.forEach(e => {
      byCategory[e.categoryId] = (byCategory[e.categoryId] || 0) + e.convertedAmount;
    });

    const totalSpent = Object.values(byCategory).reduce((a, b) => a + b, 0);

    const topCategories = Object.entries(byCategory)
      .map(([catId, amount]) => {
        const cat = categories.find(c => c.id === catId);
        const count = expenses.filter(e => e.categoryId === catId).length;
        return { id: catId, name: cat?.name || 'Other', color: cat?.color || '#3b82f6', amount, count };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);

    return { spent: totalSpent, segments: topCategories };
  }, [categories, expenses]);

  const remaining = Math.max(0, limit - spent);
  const progress = limit > 0 ? Math.min(1, spent / limit) : (spent > 0 ? 1 : 0);
  const dash = progress * CIRC;

  return (
    <div
      className="rounded-[32px] p-7 flex flex-col gap-7"
      style={{
        background: 'linear-gradient(160deg, #101a30 0%, #080d18 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 20px 50px -20px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05) inset',
      }}
    >
      <div className="flex flex-col items-center gap-1">
        <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} className="-rotate-90 absolute inset-0 drop-shadow-[0_0_18px_rgba(139,92,246,0.35)]">
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
            <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke="rgba(255,255,255,0.06)" strokeWidth={STROKE} fill="none" />
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke="url(#ringGrad)"
              strokeWidth={STROKE}
              strokeDasharray={`${dash} ${CIRC}`}
              strokeLinecap="round"
              fill="none"
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
          </svg>
          <div className="flex flex-col items-center justify-center gap-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/35">Потрачено</span>
            <span className="text-2xl font-black text-white tabular-nums">{spent.toFixed(0)}</span>
            <span className="text-[9px] font-bold text-white/25">{baseCurrency}</span>
          </div>
        </div>
      </div>

      {limit > 0 && (
        <div className="flex justify-between px-1">
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Лимит</span>
            <span className="text-base font-black text-white tabular-nums">{limit.toFixed(0)}</span>
          </div>
          <div className="w-px bg-white/[0.06]" />
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Остаток</span>
            <span className="text-base font-black text-violet-300 tabular-nums">{remaining.toFixed(0)}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {segments.length === 0 ? (
          <span className="text-center text-[10px] font-black uppercase tracking-widest text-white/15 py-2">
            {emptyLabel}
          </span>
        ) : segments.map(seg => (
          <div
            key={seg.id}
            className="flex items-center justify-between px-4 py-3 rounded-2xl"
            style={{ background: `${seg.color}14`, border: `1px solid ${seg.color}22` }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: seg.color, boxShadow: `0 0 6px ${seg.color}` }} />
              <span className="text-xs font-bold text-white/80 truncate">{seg.name}</span>
            </div>
            <div className="flex flex-col items-end flex-shrink-0 pl-2">
              <span className="text-xs font-black text-white tabular-nums">{seg.amount.toFixed(0)} {baseCurrency}</span>
              <span className="text-[9px] font-bold text-white/30">{seg.count} операций</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
