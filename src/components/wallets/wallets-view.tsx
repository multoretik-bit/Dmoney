'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronRight, FolderPlus, Plus, CreditCard } from 'lucide-react';
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-[100] flex items-end bg-black/70 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
             if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div 
            className="bg-card w-full h-[90vh] rounded-t-[40px] flex flex-col p-8 shadow-2xl relative"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 250 }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center text-accent">
                   <Plus size={24} />
                 </div>
                 <h2 className="text-2xl font-bold">Новый кошелек</h2>
              </div>
              <button 
                type="button"
                onClick={onClose} 
                className="p-3 bg-background border border-white/5 rounded-full active:scale-95 text-textMuted hover:text-white transition-colors"
                aria-label="Закрыть"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-8 hide-scrollbar pb-24">
              <div className="flex flex-col gap-2">
                <div className="text-sm text-textMuted font-medium px-1">Название</div>
                <input 
                  className="bg-background p-5 rounded-2xl outline-none border border-transparent focus:border-accent transition-all text-lg font-medium" 
                  placeholder="Например, Основная карта" 
                  value={name} onChange={e => setName(e.target.value)} 
                />
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col gap-2 w-1/3">
                  <div className="text-sm text-textMuted font-medium px-1">Валюта</div>
                  <select 
                    className="bg-background p-5 rounded-2xl outline-none border border-transparent focus:border-accent text-accent font-bold" 
                    value={currency} onChange={e => setCurrency(e.target.value)}
                  >
                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <div className="text-sm text-textMuted font-medium px-1">Начальный баланс</div>
                  <input 
                    type="number" className="bg-background p-5 rounded-2xl outline-none border border-transparent focus:border-accent font-bold text-lg" 
                    placeholder="0.00" 
                    value={balance} onChange={e => setBalance(e.target.value)} 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-sm text-textMuted font-medium px-1">Тип</div>
                <div className="grid grid-cols-3 gap-3">
                   {(['bank', 'cash', 'crypto'] as const).map(t => (
                     <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={cn(
                          "py-4 rounded-2xl flex flex-col items-center gap-2 transition-all border",
                          type === t ? "bg-accent/10 border-accent text-accent" : "bg-background border-transparent text-textMuted"
                        )}
                     >
                        <span className="text-xs font-bold uppercase">{t === 'bank' ? 'Карта' : t === 'cash' ? 'Кэш' : 'Крипта'}</span>
                     </button>
                   ))}
                </div>
              </div>

              {walletFolders.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="text-sm text-textMuted font-medium px-1">Папка</div>
                  <select 
                    className="bg-background p-5 rounded-2xl outline-none border border-transparent focus:border-accent" 
                    value={folderId} onChange={e => setFolderId(e.target.value)}
                  >
                    {walletFolders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              )}

              <ColorPicker color={color} onChange={setColor} />
              <IconPicker icon={icon} onChange={setIcon} />
            </div>

            <button 
              type="button"
              onClick={handleSave} 
              disabled={!name || !balance}
              className="absolute bottom-8 left-8 right-8 h-16 bg-accent hover:bg-accent/90 disabled:opacity-50 text-white text-lg font-bold rounded-3xl z-[110] shadow-2xl shadow-accent/20 transition-all active:scale-[0.98]"
            >
              Создать кошелек
            </button>
          </motion.div>
        </motion.div>
      )}
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
    <div className="p-6 flex flex-col gap-8">
      <header className="pt-8 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Кошельки</h1>
          <p className="text-sm text-textMuted mt-1">Всего активов: {wallets.length}</p>
        </div>
        <div className="flex gap-3">
          <button 
            type="button"
            onClick={handleAddFolder} 
            className="w-12 h-12 bg-card rounded-2xl flex items-center justify-center text-textMuted active:scale-95 hover:bg-white/5 transition-colors border border-white/5"
            title="Новая папка"
          >
            <FolderPlus size={22} />
          </button>
          <button 
            type="button"
            onClick={() => setIsModalOpen(true)} 
            className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-white shadow-xl shadow-accent/20 active:scale-95 hover:bg-accent/90 transition-all"
            title="Добавить кошелек"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>
      </header>

      {wallets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-10 bg-card/40 border border-dashed border-white/10 rounded-[40px] text-center gap-4">
           <div className="w-16 h-16 bg-background rounded-3xl flex items-center justify-center text-textMuted/40">
             <CreditCard size={32} />
           </div>
           <div className="text-textMuted font-medium">Нет активных кошельков</div>
           <button 
            onClick={() => setIsModalOpen(true)}
            className="text-accent font-bold text-sm bg-accent/10 px-6 py-2 rounded-full active:scale-95"
           >
             Создать первый
           </button>
        </div>
      ) : (
        <div className="flex flex-col gap-8 pb-32">
          {walletFolders.map(folder => {
            const folderWallets = wallets.filter(w => w.folderId === folder.id);
            if (folderWallets.length === 0) return null;
            
            const isExpanded = expandedFolders[folder.id] !== false; // Default true

            return (
              <div key={folder.id} className="flex flex-col gap-5">
                <button 
                  type="button"
                  onClick={() => toggleFolder(folder.id)}
                  className="flex items-center gap-3 text-textMuted hover:text-white transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center transition-colors group-hover:bg-accent/10 group-hover:text-accent">
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                  <span className="font-bold text-xl tracking-tight">{folder.name}</span>
                  <div className="h-[1px] flex-1 bg-white/5 ml-2" />
                  <span className="bg-card px-3 py-1 rounded-full text-xs font-bold text-textMuted border border-white/5">{folderWallets.length}</span>
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-col gap-4 overflow-hidden"
                    >
                      {folderWallets.map(w => (
                        <motion.div 
                          key={w.id} 
                          layout
                          className="bg-card rounded-[32px] p-6 shadow-xl relative overflow-hidden flex items-center gap-5 border border-white/5 active:scale-[0.98] transition-transform"
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-2.5" style={{ backgroundColor: w.color || '#3b82f6' }} />
                          <div className="w-14 h-14 rounded-2xl bg-background border border-white/5 flex items-center justify-center text-3xl z-10 shadow-inner">
                            {w.icon || '💳'}
                          </div>
                          <div className="flex-1 z-10">
                            <div className="flex justify-between items-center opacity-70 text-[10px] font-black uppercase tracking-widest mb-1">
                              <span className="text-white/80">{w.name}</span>
                              <span className="bg-white/10 px-1.5 py-0.5 rounded-md">{w.type}</span>
                            </div>
                            <div className="text-2xl font-black tracking-tight text-white">
                              {w.balance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} 
                              <span className="text-sm font-bold ml-1.5 opacity-40">{w.currency}</span>
                            </div>
                          </div>
                        </motion.div>
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
