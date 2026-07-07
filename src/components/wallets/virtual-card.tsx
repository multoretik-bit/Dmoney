'use client';

import { motion } from 'framer-motion';
import { CreditCard, Edit2, Target, Trash2 } from 'lucide-react';
import { Wallet } from '@/store/useStore';
import { convertAmount } from '@/lib/exchange';
import { cn } from '@/lib/utils';

// Purely decorative — derives a stable 2-digit "card tail" from the wallet id
// so each account visually reads like a distinct bank card, no real numbers implied.
function cardTail(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return String(hash % 100).padStart(2, '0');
}

export function VirtualCard({
  wallet,
  baseCurrency,
  onEdit,
  onDelete,
  className,
}: {
  wallet: Wallet;
  baseCurrency: string;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}) {
  const balanceConverted = convertAmount(wallet.balance, wallet.currency, baseCurrency);
  const color = wallet.color || '#3b82f6';
  const hasGoal = !!wallet.targetAmount && Number(wallet.targetAmount) > 0;
  const goalPct = hasGoal ? Math.min(100, (wallet.balance / Number(wallet.targetAmount)) * 100) : 0;

  return (
    <motion.div
      layout
      className={cn(
        'relative flex-shrink-0 w-[240px] h-[150px] rounded-[28px] p-5 flex flex-col justify-between overflow-hidden group snap-center shadow-2xl',
        className
      )}
      style={{
        background: `linear-gradient(150deg, ${color}55 0%, #0a0f1e 70%)`,
        border: `1px solid ${color}40`,
      }}
    >
      {/* Sheen */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${color}35 0%, transparent 70%)` }} />

      {/* Top row: name + accent dot */}
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex flex-col gap-0.5 min-w-0 pr-2">
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/50 truncate">{wallet.name}</span>
          <span className="text-xl font-black text-white leading-tight truncate">
            {balanceConverted.toFixed(1)} {baseCurrency}
          </span>
          {wallet.currency !== baseCurrency && (
            <span className="text-[9px] font-bold text-white/30">{wallet.balance.toFixed(1)} {wallet.currency}</span>
          )}
        </div>
        <span
          className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
          style={{ background: color, boxShadow: `0 0 8px ${color}` }}
        />
      </div>

      {/* Bottom row: pseudo card number + icon */}
      <div className="relative z-10 flex items-end justify-between">
        <span className="text-xs font-bold tracking-[0.2em] text-white/35">
          •••• •••• •••• {cardTail(wallet.id)}
        </span>
        <span className="w-8 h-8 rounded-lg bg-black/25 border border-white/10 flex items-center justify-center text-base flex-shrink-0">
          {wallet.icon || <CreditCard size={14} className="text-white/40" />}
        </span>
      </div>

      {hasGoal && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
          <div className="h-full" style={{ width: `${goalPct}%`, background: color }} />
        </div>
      )}

      {/* Hover controls */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="p-1.5 bg-black/40 hover:bg-black/60 rounded-lg transition-all"
        >
          <Edit2 size={12} className="text-white" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1.5 bg-black/40 hover:bg-red-500/60 rounded-lg transition-all"
        >
          <Trash2 size={12} className="text-white" />
        </button>
      </div>

      {hasGoal && (
        <div className="hidden group-hover:flex absolute inset-x-5 bottom-6 items-center gap-1.5 z-20">
          <Target size={10} className="text-white/50" />
          <span className="text-[9px] font-black text-white/50 uppercase tracking-wider">
            Цель {Number(wallet.targetAmount).toFixed(0)} {wallet.currency} · {Math.round(goalPct)}%
          </span>
        </div>
      )}
    </motion.div>
  );
}
