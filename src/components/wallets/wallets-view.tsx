'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronRight, FolderPlus } from 'lucide-react';
import { CURRENCIES, convertCurrency } from '@/lib/currencies';
import { ColorPicker } from '@/components/ui/color-picker';
import { IconPicker } from '@/components/ui/icon-picker';
import { cn } from '@/lib/utils';

function AddWalletModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addWallet, walletFolders } = useStore();
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [balance, setBalance] = useState('');
  const [type, setType] = useState<'cash' | 'bank' | 'crypto'>('bank');
  const [folderId, setFolderId] = useState(walletFolders[0]?.id || 'default');
  const [color, setColor] = useState('#3b82f6');
  const [icon, setIcon] = useState('💳');

  const handleSave = () => {
    if (!name || !balance) return;
    addWallet({
      id: Date.now().toString(),
      name,
      currency,
      balance: parseFloat(balance),
      type,
      folderId,
      color,
      icon,
    });
    setName('');
    setBalance('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-[100] flex items-end bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="bg-card w-full h-[85vh] rounded-t-3xl flex flex-col p-6 shadow-2xl relative"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Новый кошелек</h2>
            <button onClick={onClose} className="p-2 bg-background rounded-full">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-6 hide-scrollbar pb-20">
            <input 
              className="bg-background p-4 rounded-xl outline-none" 
              placeholder="Название (например, Tinkoff)" 
              value={name} onChange={e => setName(e.target.value)} 
            />

            <div className="flex gap-4">
              <select 
                className="bg-background p-4 rounded-xl outline-none w-1/3" 
                value={currency} onChange={e => setCurrency(e.target.value)}
              >
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
              </select>
              <input 
                type="number" className="bg-background p-4 rounded-xl outline-none flex-1" 
                placeholder="Начальный баланс" 
                value={balance} onChange={e => setBalance(e.target.value)} 
              />
            </div>

            <select 
              className="bg-background p-4 rounded-xl outline-none" 
              value={type} onChange={e => setType(e.target.value as any)}
            >
              <option value="bank">Банк</option>
              <option value="cash">Наличные</option>
              <option value="crypto">Крипта</option>
            </select>

            {walletFolders.length > 0 && (
              <select 
                className="bg-background p-4 rounded-xl outline-none" 
                value={folderId} onChange={e => setFolderId(e.target.value)}
              >
                {walletFolders.map(f => <option key={f.id} value={f.id}>Папка: {f.name}</option>)}
              </select>
            )}

            <ColorPicker color={color} onChange={setColor} />
            <IconPicker icon={icon} onChange={setIcon} />
          </div>

          <button onClick={handleSave} className="absolute bottom-6 left-6 right-6 h-14 bg-accent text-white font-bold rounded-2xl z-50 shadow-lg">
            Добавить
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function WalletsView() {
  const { wallets, walletFolders, addWalletFolder, preferences } = useStore();
  const { baseCurrency } = preferences;
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Track expanded state for folders
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => ({ ...prev, [id]: prev[id] === undefined ? false : !prev[id] }));
  };

  const handleAddFolder = () => {
    const name = prompt("Название новой папки:");
    if (name) {
      addWalletFolder({ id: Date.now().toString(), name, order: walletFolders.length });
    }
  };

  return (
    <div className="p-4 flex flex-col gap-6">
      <header className="pt-8 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Кошельки</h1>
          <p className="text-sm text-textMuted mt-1">Всего кошельков: {wallets.length}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleAddFolder} className="w-10 h-10 bg-card rounded-2xl flex items-center justify-center text-textMuted active:scale-95">
            <FolderPlus size={20} />
          </button>
          <button onClick={() => setIsModalOpen(true)} className="w-10 h-10 bg-card rounded-2xl flex items-center justify-center text-accent shadow-lg active:scale-95">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>
      </header>

      {wallets.length === 0 ? (
        <div className="text-center text-textMuted py-10 bg-card rounded-3xl">
          Нет кошельков. Добавьте первый!
        </div>
      ) : (
        <div className="flex flex-col gap-6 pb-20">
          {walletFolders.map(folder => {
            const folderWallets = wallets.filter(w => w.folderId === folder.id);
            if (folderWallets.length === 0) return null; // Don't show empty folders for now
            
            const isExpanded = expandedFolders[folder.id] !== false; // Default true

            return (
              <div key={folder.id} className="flex flex-col gap-4">
                <button 
                  onClick={() => toggleFolder(folder.id)}
                  className="flex items-center gap-2 text-textMuted hover:text-white transition-colors px-2"
                >
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <span className="font-semibold text-lg">{folder.name}</span>
                  <span className="ml-auto bg-card px-2 py-0.5 rounded-full text-xs">{folderWallets.length}</span>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-col gap-4 overflow-hidden"
                    >
                      {folderWallets.map(w => (
                        <div key={w.id} className="bg-card rounded-3xl p-5 shadow-xl relative overflow-hidden flex items-center gap-4">
                          <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundColor: w.color || '#3b82f6' }} />
                          <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center text-2xl z-10">
                            {w.icon || '💳'}
                          </div>
                          <div className="flex-1 z-10">
                            <div className="flex justify-between items-center opacity-90 text-sm">
                              <span className="font-semibold text-white/90">{w.name}</span>
                              <span className="text-xs text-textMuted uppercase">{w.type}</span>
                            </div>
                            <div className="text-2xl font-bold mt-1 tracking-tight">
                              {w.balance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} <span className="text-sm font-medium opacity-70">{w.currency}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      <AddWalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
