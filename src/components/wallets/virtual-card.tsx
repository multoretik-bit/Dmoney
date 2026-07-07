'use client';

import { motion } from 'framer-motion';
import { CreditCard, Edit2, Target, Trash2 } from 'lucide-react';
import { Wallet } from '@/store/useStore';
import { convertAmount } from '@/lib/exchange';
import { cn } from '@/lib/utils';

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
      whileHover={{ y: -3 }}
      className={cn(
        'relative flex-shrink-0 w-[268px] h-[166px] rounded-[22px] p-5 flex flex-col justify-between overflow-hidden group snap-center transition-shadow',
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${color}70 0%, ${color}25 32%, #060a14 78%)`,
        boxShadow: `0 24px 48px -18px ${color}66, 0 2px 0 rgba(255,255,255,0.06) inset, 0 0 0 1px rgba(255,255,255,0.08) inset`,
      }}
    >
      {/* Diagonal sheen texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.35] mix-blend-overlay"
        style={{ background: 'repeating-linear-gradient(115deg, rgba(255,255,255,0.12) 0px, rgba(255,255,255,0.12) 1px, transparent 1px, transparent 10px)' }}
      />
      {/* Glow blob */}
      <div className="absolute -top-14 -right-14 w-40 h-40 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${color}55 0%, transparent 70%)` }} />
      {/* Top glossy highlight edge */}
      <div className="absolute inset-x-0 top-0 h-14 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 100%)' }} />

      {/* Top row: chip + status dot */}
      <div className="relative z-10 flex items-start justify-between">
        <div
          className="w-8 h-6 rounded-[6px] flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #f4e4b8 0%, #d8bd7c 45%, #b89654 100%)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.4) inset',
          }}
        />
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5"
          style={{ background: color, boxShadow: `0 0 10px ${color}, 0 0 0 3px ${color}22` }}
        />
      </div>

      {/* Balance block */}
      <div className="relative z-10 flex flex-col gap-0.5 min-w-0">
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/50 truncate">{wallet.name}</span>
        <span className="text-2xl font-black text-white leading-tight truncate tabular-nums">
          {balanceConverted.toFixed(1)} <span className="text-sm text-white/50 font-bold">{baseCurrency}</span>
        </span>
        {wallet.currency !== baseCurrency && (
          <span className="text-[9px] font-bold text-white/30">{wallet.balance.toFixed(1)} {wallet.currency}</span>
        )}
      </div>

      {/* Bottom row: icon badge */}
      <div className="relative z-10 flex items-end justify-end">
        <span className="w-8 h-8 rounded-full bg-black/30 border border-white/10 flex items-center justify-center text-base flex-shrink-0 backdrop-blur-sm">
          {wallet.icon || <CreditCard size={14} className="text-white/40" />}
        </span>
      </div>

      {hasGoal && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40 rounded-b-[22px] overflow-hidden">
          <div className="h-full" style={{ width: `${goalPct}%`, background: `linear-gradient(90deg, ${color}, #fff8)` }} />
        </div>
      )}

      {/* Hover controls */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="p-1.5 bg-black/50 hover:bg-black/70 rounded-lg transition-all backdrop-blur-sm"
        >
          <Edit2 size={12} className="text-white" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1.5 bg-black/50 hover:bg-red-500/70 rounded-lg transition-all backdrop-blur-sm"
        >
          <Trash2 size={12} className="text-white" />
        </button>
      </div>

      {hasGoal && (
        <div className="hidden group-hover:flex absolute inset-x-5 bottom-6 items-center gap-1.5 z-20">
          <Target size={10} className="text-white/60" />
          <span className="text-[9px] font-black text-white/60 uppercase tracking-wider">
            Цель {Number(wallet.targetAmount).toFixed(0)} {wallet.currency} · {Math.round(goalPct)}%
          </span>
        </div>
      )}
    </motion.div>
  );
}
