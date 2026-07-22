'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, FolderIcon, ChevronRight, ChevronDown, ChevronLeft, FolderPlus } from 'lucide-react';
import { format } from 'date-fns';
import { useStore, Portfolio, Folder, Wallet } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { AddWalletModal } from './add-wallet-modal';
import { AddPortfolioModal, AddFolderModal } from './portfolio-folder-modals';
import { convertAmount } from '@/lib/exchange';
import { useDragScroll } from '@/hooks/useDragScroll';
import { VirtualCard } from './virtual-card';
import { SpendingRing } from './spending-ring';

export function WalletsView() {
  const {
    portfolios, folders, wallets, deletePortfolio, deleteFolder, deleteWallet,
    updatePortfolioOrder, preferences, categories, expenses,
    selectedPortfolioId, setSelectedPortfolioId,
  } = useStore();
  const { baseCurrency } = preferences;

  const { ringExpenses, ringLimit } = useMemo(() => {
    const monthStr = format(new Date(), 'yyyy-MM');
    const excludeIds = new Set(
      categories
        .filter(c => {
          const parent = c.parentId ? categories.find(p => p.id === c.parentId) : null;
          return c.excludeFromBudget || (parent && parent.excludeFromBudget);
        })
        .map(c => c.id)
    );
    const filtered = expenses.filter(e => e.date.startsWith(monthStr) && !e.isWork && !e.isLarge && !excludeIds.has(e.categoryId));
    const totalLimit = categories.reduce((sum, c) => sum + (!excludeIds.has(c.id) && c.budgetLimit ? c.budgetLimit : 0), 0);
    return { ringExpenses: filtered, ringLimit: totalLimit };
  }, [categories, expenses]);

  useEffect(() => {
    if ((!selectedPortfolioId || !portfolios.some(p => p.id === selectedPortfolioId)) && portfolios.length > 0) {
      setSelectedPortfolioId(portfolios[0].id);
    }
  }, [portfolios, selectedPortfolioId, setSelectedPortfolioId]);

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);

  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);

  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const { ref: scrollRef, props: dragScrollProps } = useDragScroll();

  const sortedPortfolios = [...portfolios].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.id.localeCompare(b.id);
  });

  const selectedPortfolio = sortedPortfolios.find(p => p.id === selectedPortfolioId) || sortedPortfolios[0];
  const selectedIdx = selectedPortfolio ? sortedPortfolios.findIndex(p => p.id === selectedPortfolio.id) : -1;

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

  if (sortedPortfolios.length === 0) {
    return (
      <div className="flex flex-col gap-8 pb-32">
        <header className="py-12 flex flex-col items-center justify-center text-center gap-2">
          <h1 className="text-3xl font-black text-white px-6">Мои Капиталы</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Управление портфелями и счетами</p>
        </header>
        <button
          onClick={() => { setEditingPortfolio(null); setIsPortfolioModalOpen(true); }}
          className="mx-6 h-40 rounded-[40px] border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 text-white/20 hover:text-white/50 hover:border-white/20 transition-all"
        >
          <Plus size={32} strokeWidth={3} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Создать первый капитал</span>
        </button>
        <AddPortfolioModal isOpen={isPortfolioModalOpen} onClose={() => setIsPortfolioModalOpen(false)} editingPortfolio={editingPortfolio} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-32">
      <header className="pt-6 lg:pt-0 flex flex-col items-center lg:items-start justify-center text-center lg:text-left gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Мои капиталы</span>
        <div className="flex items-center gap-3">
          <span
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: `${selectedPortfolio?.color}20` }}
          >
            {selectedPortfolio?.icon}
          </span>
          <h1 className="text-3xl font-black text-white">{selectedPortfolio?.name}</h1>
        </div>
        <span className="text-2xl font-black tabular-nums" style={{ color: selectedPortfolio?.color }}>
          {selectedPortfolio ? getPortfolioBalance(selectedPortfolio.id).toFixed(1) : '0'} {baseCurrency}
        </span>
      </header>

      {/* Mobile-only capital switcher (desktop uses the sidebar) */}
      <div
        ref={scrollRef}
        {...dragScrollProps}
        className="lg:hidden flex gap-2 overflow-x-auto hide-scrollbar snap-x -mx-6 px-6 pb-1"
      >
        {sortedPortfolios.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedPortfolioId(p.id)}
            className={cn(
              'flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl border snap-center transition-all',
              selectedPortfolioId === p.id ? 'border-white/20 bg-white/10' : 'border-white/5 bg-white/[0.02] opacity-50'
            )}
          >
            <span className="text-base">{p.icon}</span>
            <span className="text-xs font-black text-white whitespace-nowrap">{p.name}</span>
            <span className="text-xs font-black text-white/40 whitespace-nowrap">${getPortfolioBalance(p.id).toFixed(0)}</span>
          </button>
        ))}
        <button
          onClick={() => { setEditingPortfolio(null); setIsPortfolioModalOpen(true); }}
          className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-2xl border border-dashed border-white/10 text-white/30"
        >
          <Plus size={16} strokeWidth={3} />
        </button>
      </div>

      {/* Capital controls (reorder / edit / delete / new) */}
      <div className="flex items-center justify-between px-1 -mt-4">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => selectedPortfolio && updatePortfolioOrder(selectedPortfolio.id, 'left')}
            disabled={selectedIdx <= 0}
            className="p-2 text-white/20 hover:text-white disabled:opacity-20 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => selectedPortfolio && updatePortfolioOrder(selectedPortfolio.id, 'right')}
            disabled={selectedIdx === sortedPortfolios.length - 1}
            className="p-2 text-white/20 hover:text-white disabled:opacity-20 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { setEditingPortfolio(selectedPortfolio || null); setIsPortfolioModalOpen(true); }}
            className="p-2.5 bg-white/5 rounded-xl text-white/30 hover:text-white transition-all"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => {
              if (selectedPortfolio && confirm('Удалить капитал? Все счета внутри также будут удалены.')) deletePortfolio(selectedPortfolio.id);
            }}
            className="p-2.5 bg-white/5 rounded-xl text-white/30 hover:text-red-400 transition-all"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={() => { setEditingPortfolio(null); setIsPortfolioModalOpen(true); }}
            className="p-2.5 bg-accent/20 rounded-xl text-accent hover:bg-accent/30 transition-all"
          >
            <Plus size={14} strokeWidth={4} />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Center column */}
        <div className="flex-1 min-w-0 w-full flex flex-col gap-10">
          {/* Accounts as virtual cards */}
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30">Счета капитала</span>
                <div className="h-px bg-white/5 w-16 sm:w-32" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setEditingFolder(null); setIsFolderModalOpen(true); }}
                  className="p-2.5 bg-white/5 rounded-xl text-white/40 hover:text-white transition-all"
                >
                  <FolderPlus size={16} />
                </button>
                <button
                  onClick={() => { setEditingWallet(null); setIsWalletModalOpen(true); }}
                  className="p-2.5 bg-accent/20 rounded-xl text-accent hover:bg-accent/30 transition-all"
                >
                  <Plus size={16} strokeWidth={4} />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {portfolioFolders.map(folder => {
                const isExpanded = expandedFolders.includes(folder.id);
                const folderWallets = portfolioWallets
                  .filter(w => w.folderId === folder.id)
                  .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

                return (
                  <div key={folder.id} className="flex flex-col gap-3">
                    <div
                      onClick={() => toggleFolder(folder.id)}
                      className="flex items-center justify-between cursor-pointer group px-1"
                    >
                      <div className="flex items-center gap-2.5">
                        <FolderIcon size={13} style={{ color: folder.color }} />
                        <span className="text-xs font-black uppercase tracking-widest text-white/60">{folder.name}</span>
                        <span className="text-[10px] font-black text-white/20">{folderWallets.length}</span>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingFolder(folder); setIsFolderModalOpen(true); }}
                          className="p-1.5 text-white/20 hover:text-white"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); if (confirm('Удалить папку? Счета сохранятся.')) deleteFolder(folder.id); }}
                          className="p-1.5 text-white/20 hover:text-red-400"
                        >
                          <Trash2 size={12} />
                        </button>
                        {isExpanded ? <ChevronDown size={14} className="text-white/20" /> : <ChevronRight size={14} className="text-white/20" />}
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="flex flex-wrap gap-4"
                        >
                          {folderWallets.map(w => (
                            <VirtualCard
                              key={w.id}
                              wallet={w}
                              baseCurrency={baseCurrency}
                              onEdit={() => handleEditWallet(w)}
                              onDelete={() => deleteWallet(w.id)}
                            />
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {/* Unfoldered wallets */}
              <div className="flex flex-wrap gap-4">
                {portfolioWallets
                  .filter(w => !w.folderId)
                  .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                  .map(w => (
                    <VirtualCard
                      key={w.id}
                      wallet={w}
                      baseCurrency={baseCurrency}
                      onEdit={() => handleEditWallet(w)}
                      onDelete={() => deleteWallet(w.id)}
                    />
                  ))}

                <button
                  onClick={() => { setEditingWallet(null); setIsWalletModalOpen(true); }}
                  className="flex-shrink-0 w-[268px] h-[166px] rounded-[22px] border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 text-white/15 hover:text-white/40 hover:border-white/20 transition-all"
                >
                  <Plus size={22} strokeWidth={3} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Новый счёт</span>
                </button>
              </div>

              {portfolioFolders.length === 0 && portfolioWallets.length === 0 && (
                <div className="text-center py-16 rounded-[36px] border-2 border-dashed border-white/5 text-[10px] font-black uppercase tracking-[0.4em] text-white/10">
                  Нет счетов
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: spending ring */}
        <div className="w-full lg:w-[320px] flex-shrink-0">
          <SpendingRing expenses={ringExpenses} limit={ringLimit} />
        </div>
      </div>

      <AddPortfolioModal isOpen={isPortfolioModalOpen} onClose={() => setIsPortfolioModalOpen(false)} editingPortfolio={editingPortfolio} />
      <AddFolderModal isOpen={isFolderModalOpen} onClose={() => setIsFolderModalOpen(false)} portfolioId={selectedPortfolioId} editingFolder={editingFolder} />
      <AddWalletModal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} editingWallet={editingWallet} />
    </div>
  );
}
