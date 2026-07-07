'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronRight } from 'lucide-react';
import { useStore } from '@/store/useStore';

export function RecentOperations({ portfolioId, limit = 6 }: { portfolioId: string; limit?: number }) {
  const { expenses, categories, wallets } = useStore();

  const walletIds = new Set(wallets.filter(w => w.portfolioId === portfolioId).map(w => w.id));
  const items = expenses
    .filter(e => walletIds.has(e.walletId))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/25">Последние операции</span>
        <Link href="/expenses" className="flex items-center gap-0.5 text-[10px] font-black uppercase tracking-widest text-white/25 hover:text-white/60 transition-colors">
          Все <ChevronRight size={12} />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10 rounded-[28px] border-2 border-dashed border-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-white/10">
          Нет операций
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map(exp => {
            const cat = categories.find(c => c.id === exp.categoryId) || { icon: '🔹', name: 'Other', color: '#3b82f6' };
            const catColor = cat.color || '#3b82f6';
            return (
              <div
                key={exp.id}
                className="flex items-center justify-between p-3.5 rounded-2xl transition-colors hover:bg-white/[0.03]"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: `${catColor}1c` }}
                  >
                    {cat.icon}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-white/90 truncate">{cat.name}</span>
                    <span className="text-[10px] font-bold text-white/25 tracking-wide">
                      {format(new Date(exp.date), 'd MMM, HH:mm', { locale: ru })}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-black text-white flex-shrink-0 pl-2 tabular-nums">
                  −{exp.convertedAmount.toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
