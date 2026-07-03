'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Wallet as WalletIcon, FolderIcon, ChevronRight, ChevronDown, ChevronUp, FolderPlus, Palette, CreditCard, Target, ChevronLeft, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { useStore, Wallet, Portfolio, Folder } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { AddWalletModal } from './add-wallet-modal';
import { AddPortfolioModal, AddFolderModal } from './portfolio-folder-modals';
import { convertAmount } from '@/lib/exchange';
import { useDragScroll } from '@/hooks/useDragScroll';

export function WalletsView() {
  const { portfolios, folders, wallets, deletePortfolio, deleteFolder, deleteWallet, updatePortfolioOrder, updateWalletOrder, preferences, transferFunds } = useStore();
  const { baseCurrency } = preferences;
  
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');

  useEffect(() => {
    if (!selectedPortfolioId && portfolios.length > 0) {
      setSelectedPortfolioId(portfolios[0].id);
    }
  }, [portfolios, selectedPortfolioId]);
  
  // Modals visibility
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  
  // Editing state
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);

  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const { ref: scrollRef, props: dragScrollProps } = useDragScroll();

  const [isDistributed, setIsDistributed] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);

  const personalPortfolioId = preferences.personalPortfolioId;
  const personalPortfolioLimit = preferences.personalPortfolioLimit || 0;

  const personalBalance = personalPortfolioId 
    ? wallets
        .filter(w => w.portfolioId === personalPortfolioId)
        .reduce((sum, w) => sum + convertAmount(w.balance, w.currency, baseCurrency), 0)
    : 0;

  const freeMoney = personalPortfolioId && personalBalance > personalPortfolioLimit
    ? personalBalance - personalPortfolioLimit
    : 0;

  const handleDistribute = async () => {
    if (!preferences.sourceWalletId || freeMoney <= 0) return;
    setIsDistributing(true);
    
    const workAmtBase = freeMoney * (preferences.workPercentage ?? 50) / 100;
    const investAmtBase = freeMoney * (preferences.investPercentage ?? 30) / 100;
    const savingsAmtBase = freeMoney * (preferences.savingsPercentage ?? 20) / 100;

    const sourceWallet = wallets.find(w => w.id === preferences.sourceWalletId);
    if (!sourceWallet) {
      setIsDistributing(false);
      return;
    }

    const workAmtSrc = convertAmount(workAmtBase, baseCurrency, sourceWallet.currency);
    const investAmtSrc = convertAmount(investAmtBase, baseCurrency, sourceWallet.currency);
    const savingsAmtSrc = convertAmount(savingsAmtBase, baseCurrency, sourceWallet.currency);

    if (preferences.workWalletId && workAmtSrc > 0) {
      await transferFunds(preferences.sourceWalletId, preferences.workWalletId, workAmtSrc);
    }
    if (preferences.investWalletId && investAmtSrc > 0) {
      await transferFunds(preferences.sourceWalletId, preferences.investWalletId, investAmtSrc);
    }
    if (preferences.savingsWalletId && savingsAmtSrc > 0) {
      await transferFunds(preferences.sourceWalletId, preferences.savingsWalletId, savingsAmtSrc);
    }

    setIsDistributed(true);
    setIsDistributing(false);
    setTimeout(() => setIsDistributed(false), 4000);
  };


  const sortedPortfolios = [...portfolios].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.id.localeCompare(b.id);
  });

  const selectedPortfolio = sortedPortfolios.find(p => p.id === selectedPortfolioId) || sortedPortfolios[0];
  
  const portfolioWallets = wallets.filter(w => w.portfolioId === (selectedPortfolio?.id || ''));
  const portfolioFolders = folders.filter(f => f.portfolioId === (selectedPortfolio?.id || ''));

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const getPortfolioBalance = (pId: string) => {
    return wallets
      .filter(w => w.portfolioId === pId)
      .reduce((sum, w) => sum + convertAmount(w.balance, w.currency, baseCurrency), 0);
  };

  const handleEditWallet = (w: Wallet) => {
    setEditingWallet(w);
    setIsWalletModalOpen(true);
  };

  const handleEditPortfolio = (p: Portfolio) => {
    setEditingPortfolio(p);
    setIsPortfolioModalOpen(true);
  };

  const handleEditFolder = (f: Folder) => {
    setEditingFolder(f);
    setIsFolderModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-8 pb-32">
      <header className="py-12 flex flex-col items-center justify-center text-center gap-2">
        <h1 className="text-3xl font-black text-white px-6">Ваши Капиталы</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Управление портфелями и счетами</p>
      </header>

      {/* Free Money Gamification Widget */}
      <AnimatePresence>
        {freeMoney > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="mx-6 p-6 bg-gradient-to-r from-accent/20 to-emerald-500/20 border border-white/10 rounded-[32px] backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col gap-4"
          >
            {/* Background glowing gradient */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-accent/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Геймификация: Распределите Свободные Деньги 🎯</span>
                <h3 className="text-2xl font-black text-white">
                  У вас есть <span className="text-accent">${freeMoney.toFixed(1)}</span> свободных денег!
                </h3>
                <p className="text-[10px] font-bold text-white/40">
                  Лимит личного капитала в ${personalPortfolioLimit} превышен. Распределите остаток:
                </p>
              </div>

              {/* Status or Button */}
              {isDistributed ? (
                <motion.div 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-wider"
                >
                  <Check size={18} strokeWidth={3} />
                  Успешно распределено!
                </motion.div>
              ) : (
                <button
                  onClick={handleDistribute}
                  disabled={isDistributing || !preferences.sourceWalletId || (!preferences.workWalletId && !preferences.investWalletId && !preferences.savingsWalletId)}
                  className="bg-white hover:bg-white/90 text-black px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center gap-2 self-start md:self-auto disabled:opacity-30 disabled:pointer-events-none"
                >
                  {isDistributing ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Выполнено</span>
                      <ArrowRight size={14} strokeWidth={3} />
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
              {/* Work */}
              <div className="bg-black/20 p-4 rounded-2xl border border-white/5 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40 font-bold">Рабочий Капитал ({preferences.workPercentage ?? 50}%)</span>
                </div>
                <span className="text-lg font-black text-white">
                  ${(freeMoney * (preferences.workPercentage ?? 50) / 100).toFixed(1)}
                </span>
                <span className="text-[8px] font-bold text-white/30 truncate">
                  {preferences.workWalletId 
                    ? `В счет: ${wallets.find(w => w.id === preferences.workWalletId)?.name || 'Неизвестно'}`
                    : '⚠️ Настройте счет в настройках'
                  }
                </span>
              </div>

              {/* Invest */}
              <div className="bg-black/20 p-4 rounded-2xl border border-white/5 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40 font-bold">Инвестиционный ({preferences.investPercentage ?? 30}%)</span>
                </div>
                <span className="text-lg font-black text-white">
                  ${(freeMoney * (preferences.investPercentage ?? 30) / 100).toFixed(1)}
                </span>
                <span className="text-[8px] font-bold text-white/30 truncate">
                  {preferences.investWalletId 
                    ? `В счет: ${wallets.find(w => w.id === preferences.investWalletId)?.name || 'Неизвестно'}`
                    : '⚠️ Настройте счет в настройках'
                  }
                </span>
              </div>

              {/* Savings */}
              <div className="bg-black/20 p-4 rounded-2xl border border-white/5 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40 font-bold">Сберегательный ({preferences.savingsPercentage ?? 20}%)</span>
                </div>
                <span className="text-lg font-black text-white">
                  ${(freeMoney * (preferences.savingsPercentage ?? 20) / 100).toFixed(1)}
                </span>
                <span className="text-[8px] font-bold text-white/30 truncate">
                  {preferences.savingsWalletId 
                    ? `В счет: ${wallets.find(w => w.id === preferences.savingsWalletId)?.name || 'Неизвестно'}`
                    : '⚠️ Настройте счет в настройках'
                  }
                </span>
              </div>
            </div>

            {/* Source Wallet Info */}
            <div className="flex items-center gap-2 mt-1">
              <AlertCircle size={12} className="text-accent text-emerald-500" />
              <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
                Списание из: {preferences.sourceWalletId ? wallets.find(w => w.id === preferences.sourceWalletId)?.name : '⚠️ Настройте счет списания в настройках (Страница категорий)'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Capitals Carousel - Glass Edition */}
      <div 
        ref={scrollRef}
        {...dragScrollProps}
        className="flex gap-6 overflow-x-auto hide-scrollbar snap-x -mx-6 px-6 pb-4"
      >
        {sortedPortfolios.map((p, idx) => (
          <motion.div 
            key={p.id}
            onClick={() => setSelectedPortfolioId(p.id)}
            className={cn(
              "flex-shrink-0 w-64 h-48 rounded-[40px] p-8 flex flex-col justify-between snap-center transition-all shadow-2xl relative overflow-hidden group border-4 cursor-pointer",
              selectedPortfolioId === p.id ? "scale-100 border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)]" : "opacity-40 scale-[0.95] border-transparent grayscale-[0.5]"
            )}
            style={{ 
              backgroundColor: p.color
            }}
          >
             <div className="absolute inset-0 bg-black/20 pointer-events-none" />
             <div className="relative z-10 flex flex-col items-start gap-1">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">{p.name}</span>
               <span className="text-4xl font-black text-white leading-tight">
                 ${getPortfolioBalance(p.id).toFixed(1)}
               </span>
             </div>
             <div className="relative z-10 flex items-center gap-2">
                <span className="text-2xl">{p.icon}</span>
                <div className="text-[10px] font-black text-white/60 uppercase tracking-widest bg-black/30 px-3 py-1.5 rounded-2xl backdrop-blur-sm">
                  {wallets.filter(w => w.portfolioId === p.id).length} Счетов
                </div>
             </div>
             
             {/* CRUD Actions for Portfolios */}
              <div className={cn(
                "absolute top-6 right-6 flex items-center gap-1.5 transition-opacity z-30",
                selectedPortfolioId === p.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}>
                <button 
                  onClick={(e) => { e.stopPropagation(); updatePortfolioOrder(p.id, 'left'); }}
                  disabled={idx === 0}
                  className="p-2.5 bg-black/40 hover:bg-black/60 disabled:opacity-20 rounded-xl transition-all border border-white/10 active:scale-95"
                >
                  <ChevronLeft size={16} className="text-white" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); updatePortfolioOrder(p.id, 'right'); }}
                  disabled={idx === sortedPortfolios.length - 1}
                  className="p-2.5 bg-black/40 hover:bg-black/60 disabled:opacity-20 rounded-xl transition-all border border-white/10 active:scale-95"
                >
                  <ChevronRight size={16} className="text-white" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleEditPortfolio(p); }}
                  className="p-2.5 bg-black/40 hover:bg-black/60 rounded-xl transition-all border border-white/10 active:scale-95"
                >
                  <Edit2 size={16} className="text-white" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); if (confirm('Удалить портфель? Все счета внутри останутся.')) deletePortfolio(p.id); }}
                  className="p-2.5 bg-black/40 hover:bg-red-500/60 rounded-xl transition-all border border-white/10 active:scale-95"
                >
                  <Trash2 size={16} className="text-white" />
                </button>
              </div>
          </motion.div>
        ))}
        
        <button 
          onClick={() => { setEditingPortfolio(null); setIsPortfolioModalOpen(true); }}
          className="flex-shrink-0 w-64 h-48 rounded-[40px] border-4 border-dashed border-white/5 flex flex-col items-center justify-center gap-4 bg-white/2 hover:bg-white/5 transition-all snap-center opacity-40 hover:opacity-100 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform"><Plus size={24} strokeWidth={4} /></div>
          <span className="text-[10px] font-black uppercase tracking-widest">Новый портфель</span>
        </button>
      </div>

      {/* Account Structure */}
      <div className="flex flex-col gap-10">
        <div className="flex justify-between items-center px-4">
          <div className="flex items-center gap-3">
             <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30">Счета и Папки</span>
             <div className="h-px bg-white/5 w-24 sm:w-48" />
          </div>
          <div className="flex items-center gap-2">
             <button 
              onClick={() => { setEditingFolder(null); setIsFolderModalOpen(true); }}
              className="p-2.5 bg-white/5 rounded-xl text-white/40 hover:text-white transition-all"
             >
               <FolderPlus size={18} />
             </button>
             <button 
              onClick={() => { setEditingWallet(null); setIsWalletModalOpen(true); }}
              className="p-2.5 bg-accent/20 rounded-xl text-accent hover:bg-accent/30 transition-all"
             >
               <Plus size={18} strokeWidth={4} />
             </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {portfolioFolders.map(folder => {
            const isExpanded = expandedFolders.includes(folder.id);
            const folderWallets = portfolioWallets
              .filter(w => w.folderId === folder.id)
              .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
            
            return (
              <div key={folder.id} className="flex flex-col gap-3">
                <div 
                   onClick={() => toggleFolder(folder.id)}
                   className="glass-card rounded-[32px] p-5 flex items-center justify-between cursor-pointer group hover:border-white/10 transition-all border-l-4"
                   style={{ borderLeftColor: folder.color || '#3b82f6' }}
                >
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5 border border-white/5">
                        <FolderIcon size={18} style={{ color: folder.color }} />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-sm font-black uppercase tracking-widest text-white leading-none">{folder.name}</span>
                        <span className="text-[10px] font-black text-white/20 mt-1 uppercase tracking-widest">{folderWallets.length} accounts</span>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <button 
                       onClick={(e) => { e.stopPropagation(); handleEditFolder(folder); }}
                       className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-white"
                     >
                       <Edit2 size={14} />
                     </button>
                     <button 
                       onClick={(e) => { e.stopPropagation(); if (confirm('Удалить папку? Счета сохранятся.')) deleteFolder(folder.id); }}
                       className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-red-500"
                     >
                       <Trash2 size={14} />
                     </button>
                     {isExpanded ? <ChevronDown size={18} className="text-white/20" /> : <ChevronRight size={18} className="text-white/20" />}
                  </div>
                </div>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex flex-col gap-3"
                    >
                      {folderWallets.map((w, idx) => (
                        <WalletCard 
                          key={w.id} 
                          wallet={w} 
                          baseCurrency={baseCurrency} 
                          onDelete={() => deleteWallet(w.id)} 
                          onEdit={() => handleEditWallet(w)} 
                          className={cn(
                            "rounded-[32px]", // Ensure rounded corners are applied
                            idx % 3 === 0 ? "neon-border-blue" : idx % 3 === 1 ? "neon-border-purple" : "neon-border-green"
                          )}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* Uncategorized Wallets */}
          {portfolioWallets
            .filter(w => !w.folderId)
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
            .map((w, idx, arr) => (
            <WalletCard 
              key={w.id} 
              wallet={w} 
              baseCurrency={baseCurrency} 
              onDelete={() => deleteWallet(w.id)} 
              onEdit={() => handleEditWallet(w)} 
              className={cn(
                "rounded-[32px]",
                idx % 3 === 0 ? "neon-border-blue" : idx % 3 === 1 ? "neon-border-purple" : "neon-border-green"
              )}
            />
          ))}
          
          {portfolioFolders.length === 0 && portfolioWallets.length === 0 && (
            <div className="text-center py-20 bg-white/[0.02] rounded-[40px] border-2 border-dashed border-white/5 text-[10px] font-black uppercase tracking-[0.4em] text-white/10">
              Empty Structure
            </div>
          )}
        </div>
      </div>
      
      <AddPortfolioModal isOpen={isPortfolioModalOpen} onClose={() => setIsPortfolioModalOpen(false)} editingPortfolio={editingPortfolio} />
      <AddFolderModal isOpen={isFolderModalOpen} onClose={() => setIsFolderModalOpen(false)} portfolioId={selectedPortfolioId} editingFolder={editingFolder} />
      <AddWalletModal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} editingWallet={editingWallet} />
    </div>
  );
}

function WalletCard({ 
  wallet, 
  baseCurrency, 
  onDelete, 
  onEdit,
  className
}: { 
  wallet: Wallet; 
  baseCurrency: string; 
  onDelete: () => void; 
  onEdit: () => void;
  className?: string;
}) {
  const balanceInUSD = convertAmount(wallet.balance, wallet.currency, baseCurrency);
  
  return (
    <motion.div 
      layout
      className={cn("glass-card p-4 flex flex-col gap-4 group active:scale-[0.99] transition-all border-l-4", className)}
      style={{ borderLeftColor: wallet.color || '#3b82f6' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
           <div className="w-12 h-12 flex-shrink-0 bg-white/[0.03] rounded-2xl flex items-center justify-center text-2xl border border-white/5 shadow-inner">
              {wallet.icon || <CreditCard size={20} className="text-white/20" />}
           </div>
           <div className="flex flex-col gap-1 min-w-0 flex-1">
              <span className="text-base font-black text-white leading-tight truncate">{wallet.name}</span>
              <span className="text-[10px] font-black text-white/20 uppercase tracking-widest truncate">
                 {wallet.balance.toFixed(1)} {wallet.currency}
              </span>
           </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
           <div className="flex flex-col items-end">
              <span className="text-lg font-black text-white">${balanceInUSD.toFixed(1)}</span>
           </div>
           <div className="flex flex-col gap-1">
             <button 
               onClick={(e) => { e.stopPropagation(); onEdit(); }}
               className="p-1 px-2 hover:text-white text-white/40 transition-colors"
             >
               <Edit2 size={16} />
             </button>
             <button 
               onClick={(e) => { e.stopPropagation(); onDelete(); }}
               className="p-1 px-2 hover:text-red-500 text-white/40 transition-colors"
             >
               <Trash2 size={16} />
             </button>
           </div>
        </div>
      </div>

      {wallet.targetAmount && Number(wallet.targetAmount) > 0 ? (
        <div className="flex flex-col gap-3 bg-white/[0.02] p-4 rounded-[24px] border border-white/5 relative overflow-hidden group/goal">
          <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover/goal:opacity-100 transition-opacity" />
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest relative z-10">
            <div className="flex items-center gap-2 text-white/50">
              <Target size={12} className="text-accent" />
              <span>Цель: {Number(wallet.targetAmount).toFixed(0)} {wallet.currency}</span>
            </div>
            <div className="flex items-center gap-1">
               <span className="text-accent font-black">{Math.round((wallet.balance / Number(wallet.targetAmount)) * 100)}%</span>
            </div>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative z-10 p-[1px]">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (wallet.balance / Number(wallet.targetAmount)) * 100)}%` }}
              className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full relative shadow-[0_0_15px_rgba(59,130,246,0.5)]"
            >
               <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)] animate-shimmer" />
            </motion.div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
