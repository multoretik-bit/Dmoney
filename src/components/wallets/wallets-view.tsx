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
      <header className="pt-8 pb-4 flex flex-col items-center justify-center text-center gap-1">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Ваши капиталы</h1>
        <p className="text-[13px] text-textMuted">Управление портфелями и счетами</p>
      </header>

      {/* Free Money Gamification Widget */}
      <AnimatePresence>
        {freeMoney > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="mx-1 p-6 surface rounded-2xl flex flex-col gap-4"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-medium text-accent">Распределите свободные деньги</span>
                <h3 className="text-xl font-semibold text-white">
                  У вас есть <span className="text-accent">${freeMoney.toFixed(1)}</span> свободных денег
                </h3>
                <p className="text-[12px] text-textMuted">
                  Лимит личного капитала в ${personalPortfolioLimit} превышен. Распределите остаток:
                </p>
              </div>

              {/* Status or Button */}
              {isDistributed ? (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-2 bg-success/15 text-success px-5 py-3 rounded-xl font-medium text-sm"
                >
                  <Check size={16} />
                  Успешно распределено
                </motion.div>
              ) : (
                <button
                  onClick={handleDistribute}
                  disabled={isDistributing || !preferences.sourceWalletId || (!preferences.workWalletId && !preferences.investWalletId && !preferences.savingsWalletId)}
                  className="bg-white hover:bg-white/90 text-black px-5 py-3 rounded-xl font-medium text-sm transition-all active:scale-95 flex items-center gap-2 self-start md:self-auto disabled:opacity-30 disabled:pointer-events-none"
                >
                  {isDistributing ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Выполнить</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mt-1">
              {/* Work */}
              <div className="surface-sunken p-4 rounded-xl flex flex-col gap-1">
                <span className="text-[11px] font-medium text-textMuted">Рабочий капитал ({preferences.workPercentage ?? 50}%)</span>
                <span className="text-base font-semibold text-white tabular-nums">
                  ${(freeMoney * (preferences.workPercentage ?? 50) / 100).toFixed(1)}
                </span>
                <span className="text-[11px] text-textSubtle truncate">
                  {preferences.workWalletId
                    ? `В счет: ${wallets.find(w => w.id === preferences.workWalletId)?.name || 'Неизвестно'}`
                    : 'Настройте счет в настройках'
                  }
                </span>
              </div>

              {/* Invest */}
              <div className="surface-sunken p-4 rounded-xl flex flex-col gap-1">
                <span className="text-[11px] font-medium text-textMuted">Инвестиционный ({preferences.investPercentage ?? 30}%)</span>
                <span className="text-base font-semibold text-white tabular-nums">
                  ${(freeMoney * (preferences.investPercentage ?? 30) / 100).toFixed(1)}
                </span>
                <span className="text-[11px] text-textSubtle truncate">
                  {preferences.investWalletId
                    ? `В счет: ${wallets.find(w => w.id === preferences.investWalletId)?.name || 'Неизвестно'}`
                    : 'Настройте счет в настройках'
                  }
                </span>
              </div>

              {/* Savings */}
              <div className="surface-sunken p-4 rounded-xl flex flex-col gap-1">
                <span className="text-[11px] font-medium text-textMuted">Сберегательный ({preferences.savingsPercentage ?? 20}%)</span>
                <span className="text-base font-semibold text-white tabular-nums">
                  ${(freeMoney * (preferences.savingsPercentage ?? 20) / 100).toFixed(1)}
                </span>
                <span className="text-[11px] text-textSubtle truncate">
                  {preferences.savingsWalletId
                    ? `В счет: ${wallets.find(w => w.id === preferences.savingsWalletId)?.name || 'Неизвестно'}`
                    : 'Настройте счет в настройках'
                  }
                </span>
              </div>
            </div>

            {/* Source Wallet Info */}
            <div className="flex items-center gap-2">
              <AlertCircle size={12} className="text-textSubtle" />
              <span className="text-[11px] text-textSubtle">
                Списание из: {preferences.sourceWalletId ? wallets.find(w => w.id === preferences.sourceWalletId)?.name : 'Настройте счет списания в настройках'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Capitals Carousel */}
      <div
        ref={scrollRef}
        {...dragScrollProps}
        className="flex gap-4 overflow-x-auto hide-scrollbar snap-x -mx-1 px-1 pb-2"
      >
        {sortedPortfolios.map((p, idx) => (
          <motion.div
            key={p.id}
            onClick={() => setSelectedPortfolioId(p.id)}
            className={cn(
              "flex-shrink-0 w-60 h-40 rounded-3xl p-6 flex flex-col justify-between snap-center transition-all relative overflow-hidden group cursor-pointer",
              selectedPortfolioId === p.id ? "opacity-100" : "opacity-45 scale-[0.97]"
            )}
            style={{
              backgroundColor: p.color
            }}
          >
             <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.25) 100%)' }} />
             <div className="relative z-10 flex flex-col items-start gap-1">
               <span className="text-[12px] font-medium text-white/70">{p.name}</span>
               <span className="text-3xl font-semibold text-white leading-tight tabular-nums">
                 ${getPortfolioBalance(p.id).toFixed(1)}
               </span>
             </div>
             <div className="relative z-10 flex items-center gap-2">
                <span className="text-xl">{p.icon}</span>
                <div className="text-[11px] font-medium text-white/70 bg-black/25 px-2.5 py-1 rounded-lg">
                  {wallets.filter(w => w.portfolioId === p.id).length} счетов
                </div>
             </div>

             {/* CRUD Actions for Portfolios */}
              <div className={cn(
                "absolute top-4 right-4 flex items-center gap-1 transition-opacity z-30",
                selectedPortfolioId === p.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}>
                <button
                  onClick={(e) => { e.stopPropagation(); updatePortfolioOrder(p.id, 'left'); }}
                  disabled={idx === 0}
                  className="p-2 bg-black/30 hover:bg-black/50 disabled:opacity-20 rounded-lg transition-all active:scale-95"
                >
                  <ChevronLeft size={14} className="text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); updatePortfolioOrder(p.id, 'right'); }}
                  disabled={idx === sortedPortfolios.length - 1}
                  className="p-2 bg-black/30 hover:bg-black/50 disabled:opacity-20 rounded-lg transition-all active:scale-95"
                >
                  <ChevronRight size={14} className="text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleEditPortfolio(p); }}
                  className="p-2 bg-black/30 hover:bg-black/50 rounded-lg transition-all active:scale-95"
                >
                  <Edit2 size={14} className="text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); if (confirm('Удалить портфель? Все счета внутри останутся.')) deletePortfolio(p.id); }}
                  className="p-2 bg-black/30 hover:bg-danger/70 rounded-lg transition-all active:scale-95"
                >
                  <Trash2 size={14} className="text-white" />
                </button>
              </div>
          </motion.div>
        ))}

        <button
          onClick={() => { setEditingPortfolio(null); setIsPortfolioModalOpen(true); }}
          className="flex-shrink-0 w-60 h-40 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-3 hover:bg-white/[0.03] transition-all snap-center opacity-50 hover:opacity-100 group"
        >
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-105 transition-transform"><Plus size={20} /></div>
          <span className="text-[12px] font-medium">Новый портфель</span>
        </button>
      </div>

      {/* Account Structure */}
      <div className="flex flex-col gap-8">
        <div className="flex justify-between items-center px-1">
          <span className="text-[12px] font-medium text-textMuted">Счета и папки</span>
          <div className="flex items-center gap-2">
             <button
              onClick={() => { setEditingFolder(null); setIsFolderModalOpen(true); }}
              className="p-2.5 bg-white/[0.04] rounded-xl text-white/40 hover:text-white hover:bg-white/[0.08] transition-all"
             >
               <FolderPlus size={16} />
             </button>
             <button
              onClick={() => { setEditingWallet(null); setIsWalletModalOpen(true); }}
              className="p-2.5 bg-accent-dim rounded-xl text-accent hover:bg-accent/25 transition-all"
             >
               <Plus size={16} />
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
              <div key={folder.id} className="flex flex-col gap-2.5">
                <div
                   onClick={() => toggleFolder(folder.id)}
                   className="surface surface-hover rounded-2xl p-4 flex items-center justify-between cursor-pointer group transition-all"
                >
                  <div className="flex items-center gap-3">
                     <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5">
                        <FolderIcon size={16} style={{ color: folder.color }} />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[14px] font-medium text-white leading-none">{folder.name}</span>
                        <span className="text-[11px] text-textSubtle mt-1">{folderWallets.length} счетов</span>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <button
                       onClick={(e) => { e.stopPropagation(); handleEditFolder(folder); }}
                       className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-white"
                     >
                       <Edit2 size={13} />
                     </button>
                     <button
                       onClick={(e) => { e.stopPropagation(); if (confirm('Удалить папку? Счета сохранятся.')) deleteFolder(folder.id); }}
                       className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-danger"
                     >
                       <Trash2 size={13} />
                     </button>
                     {isExpanded ? <ChevronDown size={16} className="text-white/30" /> : <ChevronRight size={16} className="text-white/30" />}
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex flex-col gap-2.5 pl-2"
                    >
                      {folderWallets.map((w) => (
                        <WalletCard
                          key={w.id}
                          wallet={w}
                          baseCurrency={baseCurrency}
                          onDelete={() => deleteWallet(w.id)}
                          onEdit={() => handleEditWallet(w)}
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
            .map((w) => (
            <WalletCard
              key={w.id}
              wallet={w}
              baseCurrency={baseCurrency}
              onDelete={() => deleteWallet(w.id)}
              onEdit={() => handleEditWallet(w)}
            />
          ))}

          {portfolioFolders.length === 0 && portfolioWallets.length === 0 && (
            <div className="text-center py-16 rounded-2xl border border-dashed border-white/[0.08] text-[12px] text-textSubtle">
              Пусто
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
}: {
  wallet: Wallet;
  baseCurrency: string;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const balanceInUSD = convertAmount(wallet.balance, wallet.currency, baseCurrency);

  return (
    <motion.div
      layout
      className="surface surface-hover rounded-2xl p-4 flex flex-col gap-4 group active:scale-[0.99] transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-4">
           <div className="w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center text-xl" style={{ background: `${wallet.color || '#3b82f6'}18` }}>
              {wallet.icon || <CreditCard size={18} className="text-white/30" />}
           </div>
           <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <span className="text-[14px] font-medium text-white leading-tight truncate">{wallet.name}</span>
              <span className="text-[11px] text-textSubtle truncate tabular-nums">
                 {wallet.balance.toFixed(1)} {wallet.currency}
              </span>
           </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
           <span className="text-[15px] font-semibold text-white tabular-nums">${balanceInUSD.toFixed(1)}</span>
           <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
             <button
               onClick={(e) => { e.stopPropagation(); onEdit(); }}
               className="p-1 px-1.5 hover:text-white text-white/40 transition-colors"
             >
               <Edit2 size={14} />
             </button>
             <button
               onClick={(e) => { e.stopPropagation(); onDelete(); }}
               className="p-1 px-1.5 hover:text-danger text-white/40 transition-colors"
             >
               <Trash2 size={14} />
             </button>
           </div>
        </div>
      </div>

      {wallet.targetAmount && Number(wallet.targetAmount) > 0 ? (
        <div className="flex flex-col gap-2.5 surface-sunken p-3.5 rounded-xl">
          <div className="flex justify-between items-center text-[11px]">
            <div className="flex items-center gap-1.5 text-textMuted">
              <Target size={12} className="text-accent" />
              <span>Цель: {Number(wallet.targetAmount).toFixed(0)} {wallet.currency}</span>
            </div>
            <span className="text-accent font-medium tabular-nums">{Math.round((wallet.balance / Number(wallet.targetAmount)) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (wallet.balance / Number(wallet.targetAmount)) * 100)}%` }}
              className="h-full gradient-accent rounded-full"
            />
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
