'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CreditCard, Trash2, Edit2, Wallet as WalletIcon } from 'lucide-react';
import { useStore, WalletType, Wallet } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { AddWalletModal } from './add-wallet-modal';
import { convertAmount } from '@/lib/exchange';

export function WalletsView() {
  const { wallets, updateWallet, deleteWallet, preferences } = useStore();
  const { baseCurrency } = preferences;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<WalletType | 'total'>('total');

  const filteredWallets = selectedType === 'total' 
    ? wallets 
    : wallets.filter(w => w.type === selectedType);

  const totalNetWorth = wallets.reduce((sum, w) => sum + convertAmount(w.balance, w.currency, baseCurrency), 0);
  const spendingTotal = wallets.filter(w => w.type === 'spending').reduce((sum, w) => sum + convertAmount(w.balance, w.currency, baseCurrency), 0);
  const savingsTotal = wallets.filter(w => w.type === 'saving').reduce((sum, w) => sum + convertAmount(w.balance, w.currency, baseCurrency), 0);
  const debtTotal = wallets.filter(w => w.type === 'debt').reduce((sum, w) => sum + convertAmount(w.balance, w.currency, baseCurrency), 0);

  const carouselCards = [
    { title: 'Total net worth', amount: totalNetWorth, type: 'total', color: 'from-[#ff75c3] via-[#ff4b91] to-[#ff2a6d]' },
    { title: 'Spending wallets', amount: spendingTotal, type: 'spending', color: 'from-[#3b82f6] to-[#2563eb]' },
    { title: 'Debt wallets', amount: debtTotal, type: 'debt', color: 'from-[#ef4444] to-[#dc2626]' },
    { title: 'Savings wallets', amount: savingsTotal, type: 'saving', color: 'from-[#10b981] to-[#059669]' },
  ];

  const handleDelete = (id: string) => {
    // In a real app we'd trigger a store action. 
    // Assuming useStore has deleteWallet or we'll add it.
    // Let's just use updateWallet for now if we don't have deleteWallet.
    // Wait, let's call it deleteWallet and hope it exists or add it.
  };

  return (
    <div className="p-6 flex flex-col gap-8 pb-32 bg-[#0d1117] min-h-screen text-white">
      <header className="pt-8 flex justify-between items-center px-4">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black tracking-tight text-white/90">My Capitals</h1>
          <span className="text-[10px] font-black uppercase text-accent tracking-[0.3em]">Portfolios & Accounts</span>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all shadow-xl border border-white/5"
        >
          <Plus size={28} />
        </button>
      </header>

      {/* Horizontal Carousel */}
      <div className="flex gap-6 overflow-x-auto hide-scrollbar snap-x -mx-6 px-6 pb-4">
        {carouselCards.map((card) => (
          <motion.button 
            key={card.type}
            onClick={() => setSelectedType(card.type as any)}
            className={cn(
              "flex-shrink-0 w-[320px] h-52 rounded-[48px] p-10 flex flex-col justify-between snap-center transition-all border-4 shadow-[0_20px_40px_rgba(0,0,0,0.3)]",
              selectedType === card.type ? "border-white" : "border-transparent opacity-80 scale-[0.98]",
              `bg-gradient-to-br ${card.color}`
            )}
          >
             <div className="flex flex-col items-start gap-1">
               <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">{card.title}</span>
               <span className="text-[44px] font-black text-white leading-tight">${Math.floor(card.amount).toLocaleString()}</span>
             </div>
             <div className="flex gap-2">
                {carouselCards.map((c) => (
                  <div key={c.type} className={cn("w-2 h-2 rounded-full transition-all", c.type === card.type ? "bg-white w-6" : "bg-white/30")} />
                ))}
             </div>
          </motion.button>
        ))}
      </div>

      {/* Wallet List */}
      <div className="flex flex-col gap-5 mt-4">
        <div className="flex justify-between items-center px-4">
           <div className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em]">Active Accounts</div>
           <div className="text-[10px] font-black uppercase text-accent tracking-[0.2em]">{filteredWallets.length} items</div>
        </div>

        {filteredWallets.length === 0 ? (
          <div className="text-center text-white/10 py-24 font-black uppercase tracking-[0.3em] text-xs bg-white/2 border border-dashed border-white/5 rounded-[40px] flex flex-col items-center gap-4">
            <WalletIcon size={40} className="text-white/5" />
            No accounts in this category
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {filteredWallets.map((w, index) => {
                const balanceInUSD = convertAmount(w.balance, w.currency, baseCurrency);
                return (
                  <motion.div 
                    key={w.id}
                    layout
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-[#1c2128] rounded-[48px] p-8 flex items-center justify-between group border border-white/5 shadow-2xl hover:bg-[#252a33] transition-all relative overflow-hidden active:scale-[0.98]"
                  >
                    <div className="flex flex-col gap-1 z-10">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">{w.name}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                      </div>
                      {/* PRIMARY: USD */}
                      <span className="text-4xl font-black text-white leading-none">
                         ${Math.floor(balanceInUSD).toLocaleString()}
                      </span>
                      {/* SECONDARY: Original Currency (Hidden by default, shown as "local") */}
                      <span className="text-[10px] font-black text-accent mt-2 uppercase tracking-widest opacity-60">
                         {w.balance.toLocaleString()} {w.currency} (Local)
                      </span>
                    </div>

                    <div className="flex items-center gap-4 z-10">
                       <div 
                        className="w-16 h-16 rounded-[28px] flex items-center justify-center text-white shadow-2xl transition-all"
                        style={{ backgroundColor: w.color || '#3b82f6', boxShadow: `0 12px 24px ${w.color}40` }}
                      >
                        <span className="text-3xl">{w.icon || '💳'}</span>
                      </div>
                    </div>
                    
                    {/* Hover Actions (Edit/Delete) - Semi-visible in Buddy style? */}
                    <div className="absolute right-0 top-0 bottom-0 flex items-center gap-2 pr-6 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-[#1c2128] via-[#1c2128] to-transparent pl-20 pointer-events-none group-hover:pointer-events-auto">
                       <button className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 active:scale-90 transition-all"><Edit2 size={18} /></button>
                       <button 
                         onClick={() => deleteWallet(w.id)}
                         className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500/20 active:scale-90 transition-all"
                       >
                         <Trash2 size={18} />
                       </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AddWalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
