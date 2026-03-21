'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Wallet as WalletIcon, FolderIcon, ChevronRight, ChevronDown, FolderPlus, Palette } from 'lucide-react';
import { useStore, Wallet, Portfolio, Folder } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { AddWalletModal } from './add-wallet-modal';
import { AddPortfolioModal, AddFolderModal } from './portfolio-folder-modals';
import { convertAmount } from '@/lib/exchange';

export function WalletsView() {
  const { portfolios, folders, wallets, deletePortfolio, deleteFolder, deleteWallet, preferences } = useStore();
  const { baseCurrency } = preferences;
  
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>(portfolios[0]?.id || '');
  
  // Modals visibility
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  
  // Editing state
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);

  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);

  const selectedPortfolio = portfolios.find(p => p.id === selectedPortfolioId) || portfolios[0];
  
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
    <div className="p-6 flex flex-col gap-8 pb-32 bg-[#0d1117] min-h-screen text-white">
      <header className="pt-8 flex justify-between items-center px-4">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black tracking-tight text-white/90">My Capitals</h1>
          <span className="text-[10px] font-black uppercase text-accent tracking-[0.3em]">Managed Portfolios</span>
        </div>
        <button 
          onClick={() => { setEditingPortfolio(null); setIsPortfolioModalOpen(true); }} 
          className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-white/40 active:scale-90 transition-all border border-white/5"
        >
          <Plus size={24} />
        </button>
      </header>

      {/* Capitals Carousel */}
      <div className="flex gap-6 overflow-x-auto hide-scrollbar snap-x -mx-6 px-6 pb-4">
        {portfolios.map((p) => (
          <motion.button 
            key={p.id}
            onClick={() => setSelectedPortfolioId(p.id)}
            className={cn(
              "flex-shrink-0 w-[240px] h-48 rounded-[40px] p-8 flex flex-col justify-between snap-center transition-all border-4 shadow-2xl relative overflow-hidden group",
              selectedPortfolioId === p.id ? "border-white scale-100" : "border-transparent opacity-60 scale-[0.95]"
            )}
            style={{ backgroundColor: p.color }}
          >
             <div className="flex flex-col items-start gap-1">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">{p.name}</span>
               <span className="text-4xl font-black text-white leading-tight">
                 ${Math.floor(getPortfolioBalance(p.id)).toLocaleString()}
               </span>
             </div>
             <div className="flex items-center gap-2">
                <span className="text-2xl opacity-80">{p.icon}</span>
                <div className="text-[10px] font-black text-white/40 uppercase tracking-widest bg-black/20 px-2 py-1 rounded-full">
                  {wallets.filter(w => w.portfolioId === p.id).length} Acc
                </div>
             </div>
             
             {/* CRUD Actions for Portfolios */}
             <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button 
                 onClick={(e) => { e.stopPropagation(); handleEditPortfolio(p); }}
                 className="p-2 bg-black/20 hover:bg-black/40 rounded-xl transition-all"
               >
                 <Edit2 size={14} className="text-white/60" />
               </button>
               <button 
                 onClick={(e) => { e.stopPropagation(); deletePortfolio(p.id); }}
                 className="p-2 bg-black/20 hover:bg-red-500/40 rounded-xl transition-all"
               >
                 <Trash2 size={14} className="text-white/60" />
               </button>
             </div>
          </motion.button>
        ))}
        
        <button 
          onClick={() => { setEditingPortfolio(null); setIsPortfolioModalOpen(true); }}
          className="flex-shrink-0 w-[240px] h-48 rounded-[40px] border-4 border-dashed border-white/5 flex flex-col items-center justify-center gap-4 bg-white/2 hover:bg-white/5 transition-all snap-center opacity-40 hover:opacity-100"
        >
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"><Plus size={24} /></div>
          <span className="text-[10px] font-black uppercase tracking-widest">New Capital</span>
        </button>
      </div>

      {/* Wallet List with Folders */}
      {selectedPortfolio && (
        <div className="flex flex-col gap-6 mt-2">
          <div className="flex justify-between items-center px-4">
            <div className="flex items-center gap-6">
               <h3 className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em]">Structure</h3>
               <button 
                onClick={() => { setEditingFolder(null); setIsFolderModalOpen(true); }}
                className="flex items-center gap-2 text-white/40 text-[9px] font-black uppercase tracking-widest p-2 hover:bg-white/5 rounded-xl transition-all"
               >
                 <FolderPlus size={14} /> Folder
               </button>
            </div>
             <button 
              onClick={() => { setEditingWallet(null); setIsWalletModalOpen(true); }}
              className="flex items-center gap-2 text-accent text-[10px] font-black uppercase tracking-widest p-2 hover:bg-accent/10 rounded-xl transition-all"
             >
               <Plus size={14} strokeWidth={4} /> Account
             </button>
          </div>

          <div className="flex flex-col gap-4 px-2">
            {portfolioFolders.map(folder => {
              const isExpanded = expandedFolders.includes(folder.id);
              const folderWallets = portfolioWallets.filter(w => w.folderId === folder.id);
              
              return (
                <div key={folder.id} className="flex flex-col gap-3">
                  <div className="flex items-center group">
                    <button 
                       onClick={() => toggleFolder(folder.id)}
                       className="flex-1 flex items-center justify-between p-4 bg-white/2 hover:bg-white/5 rounded-2xl transition-all border border-transparent"
                       style={folder.color ? { borderColor: `${folder.color}20`, backgroundColor: `${folder.color}05` } : {}}
                    >
                      <div className="flex items-center gap-3">
                         <div 
                           className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg"
                           style={{ backgroundColor: folder.color ? `${folder.color}20` : 'rgba(0, 191, 165, 0.2)', color: folder.color || '#00bfa5' }}
                         >
                            <FolderIcon size={18} />
                         </div>
                         <span className="text-xs font-black uppercase tracking-widest text-white/60">{folder.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                         <span className="text-[10px] font-bold text-white/10">{folderWallets.length} accounts</span>
                         {isExpanded ? <ChevronDown size={16} className="text-white/20" /> : <ChevronRight size={16} className="text-white/20" />}
                      </div>
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                      <button 
                        onClick={() => handleEditFolder(folder)}
                        className="w-10 h-10 flex items-center justify-center text-white/20 hover:text-white transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => deleteFolder(folder.id)}
                        className="w-10 h-10 flex items-center justify-center text-red-500/40 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col gap-3 pl-4 overflow-hidden border-l-2 border-white/5 ml-4"
                      >
                        {folderWallets.map(w => (
                          <WalletCard key={w.id} wallet={w} baseCurrency={baseCurrency} onDelete={() => deleteWallet(w.id)} onEdit={() => handleEditWallet(w)} />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Uncategorized Wallets */}
            {portfolioWallets.filter(w => !w.folderId).map(w => (
              <WalletCard key={w.id} wallet={w} baseCurrency={baseCurrency} onDelete={() => deleteWallet(w.id)} onEdit={() => handleEditWallet(w)} />
            ))}
            
            {portfolioFolders.length === 0 && portfolioWallets.length === 0 && (
              <div className="text-center text-white/5 py-20 font-black uppercase tracking-[0.3em] text-[10px]">
                Empty structure
              </div>
            )}
          </div>
        </div>
      )}
      
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
  onEdit 
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
      className="bg-[#1c2128] rounded-[32px] p-6 flex items-center gap-5 border border-white/5 shadow-xl group relative overflow-hidden active:scale-[0.98] transition-all"
    >
      <div 
        className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-white shadow-lg relative overflow-hidden"
        style={{ backgroundColor: wallet.color || '#3b82f6' }}
      >
        <div className="absolute inset-0 bg-white/10 flex items-center justify-center">
            <span className="text-2xl">{wallet.icon || '💳'}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] truncate">{wallet.name}</span>
          <div className="w-1 h-1 rounded-full bg-accent/30" />
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-black text-white leading-tight">
             ${Math.floor(balanceInUSD).toLocaleString()}
          </span>
          <span className="text-[9px] font-black text-accent/50 uppercase tracking-widest">
             {wallet.balance.toLocaleString()} {wallet.currency}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
         <button 
           onClick={(e) => { e.stopPropagation(); onEdit(); }}
           className="p-3 hover:bg-white/5 rounded-xl transition-colors"
         >
           <Edit2 size={16} className="text-white/20" />
         </button>
         <button 
           onClick={(e) => { e.stopPropagation(); onDelete(); }}
           className="p-3 hover:bg-red-500/10 rounded-xl transition-colors group/del"
         >
           <Trash2 size={16} className="text-red-500/40 group-hover/del:text-red-500" />
         </button>
      </div>
    </motion.div>
  );
}
