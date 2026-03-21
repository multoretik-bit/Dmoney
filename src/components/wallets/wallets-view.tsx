'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Settings, CreditCard, ArrowLeftRight } from 'lucide-react';
import { useStore, WalletType } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { AddWalletModal } from './add-wallet-modal';
import { convertAmount } from '@/lib/exchange';

export function WalletsView() {
  const { wallets } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<WalletType | 'total'>('total');

  const filteredWallets = selectedType === 'total' 
    ? wallets 
    : wallets.filter(w => w.type === selectedType);

  const totalNetWorth = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
  const spendingTotal = wallets.filter(w => w.type === 'spending').reduce((sum, w) => sum + w.balance, 0);
  const savingsTotal = wallets.filter(w => w.type === 'saving').reduce((sum, w) => sum + w.balance, 0);
  const debtTotal = wallets.filter(w => w.type === 'debt').reduce((sum, w) => sum + w.balance, 0);

  const carouselCards = [
    { title: 'Total net worth', amount: totalNetWorth, type: 'total', color: 'from-[#ff75c3] via-[#ff4b91] to-[#ff2a6d]' },
    { title: 'Spending wallets', amount: spendingTotal, type: 'spending', color: 'from-[#3b82f6] to-[#2563eb]' },
    { title: 'Debt wallets', amount: debtTotal, type: 'debt', color: 'from-[#ef4444] to-[#dc2626]' },
    { title: 'Savings wallets', amount: savingsTotal, type: 'saving', color: 'from-[#10b981] to-[#059669]' },
  ];

  return (
    <div className="p-6 flex flex-col gap-8 pb-32 bg-[#0d1117] min-h-screen text-white">
      <header className="pt-8 flex justify-between items-center px-2">
        <button className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/60 active:scale-95 transition-all">
          <Settings size={22} />
        </button>
        <h1 className="text-xl font-black tracking-[0.2em] uppercase opacity-40">Capitals</h1>
        <button onClick={() => setIsModalOpen(true)} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white active:scale-95 transition-all">
          <Plus size={24} />
        </button>
      </header>

      {/* Horizontal Carousel */}
      <div className="flex gap-6 overflow-x-auto hide-scrollbar snap-x -mx-6 px-6 pb-4">
        {carouselCards.map((card) => (
          <motion.button 
            key={card.type}
            onClick={() => setSelectedType(card.type as any)}
            className={cn(
              "flex-shrink-0 w-[320px] h-52 rounded-[48px] p-10 flex flex-col justify-between snap-center transition-all border-4 shadow-2xl",
              selectedType === card.type ? "border-white" : "border-transparent opacity-80 scale-[0.98]",
              `bg-gradient-to-br ${card.color}`
            )}
          >
             <div className="flex flex-col items-start gap-1">
               <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">{card.title}</span>
               <span className="text-[44px] font-black text-white leading-tight">${card.amount.toLocaleString()}</span>
             </div>
             <div className="flex gap-2">
                {carouselCards.map((c, i) => (
                  <div key={c.type} className={cn("w-2 h-2 rounded-full transition-all", c.type === card.type ? "bg-white w-6" : "bg-white/30")} />
                ))}
             </div>
          </motion.button>
        ))}
      </div>

      {/* Wallet List */}
      <div className="flex flex-col gap-5 mt-4">
        <div className="text-[10px] font-black uppercase text-white/30 tracking-[0.3em] px-4">Accounts</div>
        {filteredWallets.length === 0 ? (
          <div className="text-center text-white/20 py-20 font-black uppercase tracking-widest text-sm bg-white/5 rounded-[40px] border border-dashed border-white/5">No accounts listed</div>
        ) : (
          filteredWallets.map((w, index) => (
            <motion.div 
              key={w.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#1c2128] rounded-[40px] p-8 flex items-center justify-between group border border-white/5 shadow-xl hover:bg-[#252a33] transition-all"
            >
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">{w.name} {w.currency}</span>
                <span className="text-4xl font-black text-white leading-tight">
                   {w.balance.toLocaleString()} {w.currency}
                </span>
                {w.displayCurrency && w.displayCurrency !== w.currency && (
                  <span className="text-sm font-black text-accent mt-1 uppercase tracking-widest opacity-80">
                    ≈ {convertAmount(w.balance, w.currency, w.displayCurrency).toLocaleString()} {w.displayCurrency}
                  </span>
                )}
              </div>
              <div 
                className="w-18 h-18 rounded-[28px] flex items-center justify-center text-white shadow-2xl transition-all"
                style={{ backgroundColor: w.color || '#3b82f6', boxShadow: `0 12px 24px ${w.color}40` }}
              >
                <span className="text-4xl">{w.icon || '💳'}</span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AddWalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
