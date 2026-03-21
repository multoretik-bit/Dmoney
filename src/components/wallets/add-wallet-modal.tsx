'use client';

import { generateUUID } from '@/lib/uuid';

import { useState, useEffect } from 'react';
import { useStore, Wallet } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Check, LayoutGrid, FolderIcon, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COMMON_CURRENCIES } from '@/lib/currencies';
import { ColorPicker } from '@/components/ui/color-picker';
import { CurrencyPicker } from '@/components/ui/currency-picker';

const WALLET_ICONS = ['💳', '💰', '🏦', '💎', '📈', '🏠', '🚗', '🛒', '🎮', '✈️', '🍎', '🍺', '💼', '🎁', '📱'];

export function AddWalletModal({ 
  isOpen, 
  onClose, 
  editingWallet 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  editingWallet?: Wallet | null;
}) {
  const { addWallet, updateWallet, portfolios, folders, preferences } = useStore();
  
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('0');
  const [portfolioId, setPortfolioId] = useState(portfolios[0]?.id || '');
  const [folderId, setFolderId] = useState<string>('');
  const [currency, setCurrency] = useState('USD');
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const [icon, setIcon] = useState('💳');
  const [color, setColor] = useState(preferences.savedColors[0]);
  const [isCurrencyPickerOpen, setIsCurrencyPickerOpen] = useState(false);

  useEffect(() => {
    if (editingWallet) {
      setName(editingWallet.name);
      setBalance(editingWallet.balance.toString());
      setPortfolioId(editingWallet.portfolioId);
      setFolderId(editingWallet.folderId || '');
      setCurrency(editingWallet.currency);
      setDisplayCurrency(editingWallet.displayCurrency || editingWallet.currency);
      setIcon(editingWallet.icon || '💳');
      setColor(editingWallet.color || preferences.savedColors[0]);
    } else {
      setName('');
      setBalance('0');
      setPortfolioId(portfolios[0]?.id || '');
      setFolderId('');
      setCurrency('USD');
      setDisplayCurrency('USD');
      setIcon('💳');
      setColor(preferences.savedColors[0]);
    }
  }, [editingWallet, isOpen, portfolios, preferences.savedColors]);

  const handleSave = () => {
    if (!name.trim() || !portfolioId) return;
    
    const walletData = {
      portfolioId,
      folderId: folderId || undefined,
      name: name.trim(),
      currency,
      displayCurrency,
      balance: parseFloat(balance) || 0,
      icon,
      color,
    };

    if (editingWallet) {
      updateWallet(editingWallet.id, walletData);
    } else {
      addWallet({
        id: generateUUID(),
        ...walletData
      });
    }
    
    onClose();
  };

  const filteredFolders = folders.filter(f => f.portfolioId === portfolioId);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-[160] flex flex-col items-center justify-end bg-black/80 backdrop-blur-sm px-4 pb-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div 
            className="bg-[#0d1117] w-full max-w-xl max-h-[95vh] rounded-[40px] p-8 flex flex-col gap-6 border border-white/10 shadow-2xl overflow-y-auto hide-scrollbar"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-2">
               <h2 className="text-sm font-black uppercase tracking-widest text-white/40">
                 {editingWallet ? 'Edit Account' : 'New Account'}
               </h2>
               <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/40"><X size={20} /></button>
            </div>

            <div className="flex flex-col gap-6">
              {/* Location Selector (Portfolio & Folder) */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="flex flex-col gap-2">
                   <label className="text-[9px] font-black uppercase text-white/20 tracking-widest px-1 flex items-center gap-2">
                     <LayoutGrid size={10} /> Capital
                   </label>
                   <select 
                     className="bg-white/5 p-4 rounded-2xl text-xs font-black text-white outline-none border border-white/5 appearance-none"
                     value={portfolioId} onChange={e => { setPortfolioId(e.target.value); setFolderId(''); }}
                   >
                     {portfolios.map(p => <option key={p.id} value={p.id} className="bg-[#0d1117]">{p.name}</option>)}
                   </select>
                 </div>
                 <div className="flex flex-col gap-2">
                   <label className="text-[9px] font-black uppercase text-white/20 tracking-widest px-1 flex items-center gap-2">
                     <FolderIcon size={10} /> Folder (Optional)
                   </label>
                   <select 
                     className="bg-white/5 p-4 rounded-2xl text-xs font-black text-white outline-none border border-white/5 appearance-none"
                     value={folderId} onChange={e => setFolderId(e.target.value)}
                   >
                     <option value="" className="bg-[#0d1117]">None</option>
                     {filteredFolders.map(f => <option key={f.id} value={f.id} className="bg-[#0d1117]">{f.name}</option>)}
                   </select>
                 </div>
              </div>

              {/* ColorPicker Integration */}
              <ColorPicker color={color} onChange={setColor} />

              {/* Icon Picker */}
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black uppercase text-white/20 tracking-widest px-1">Icon</label>
                <div className="grid grid-cols-5 gap-2 bg-white/5 p-4 rounded-3xl border border-white/5">
                   {WALLET_ICONS.map(i => (
                     <button 
                       key={i} onClick={() => setIcon(i)}
                       className={cn("h-12 rounded-xl flex items-center justify-center text-2xl transition-all border-2", icon === i ? "bg-white/10 border-white" : "bg-transparent border-transparent opacity-40")}
                       style={icon === i ? { color } : {}}
                     >
                       {i}
                     </button>
                   ))}
                </div>
              </div>

              <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                   <label className="text-[9px] font-black uppercase text-white/20 tracking-widest">Account Name</label>
                   <input 
                      className="bg-transparent text-xl font-black text-white outline-none placeholder-white/5"
                      placeholder="My Wallet..."
                      value={name} onChange={e => setName(e.target.value)}
                   />
                </div>

                <div className="h-px bg-white/5 mx-[-24px]" />

                <div className="grid grid-cols-2 gap-4">
                   <div className="flex flex-col gap-2">
                     <label className="text-[9px] font-black uppercase text-white/20 tracking-widest">Currency</label>
                     <button 
                       type="button"
                       onClick={() => setIsCurrencyPickerOpen(true)}
                       className="bg-transparent text-lg font-black text-white outline-none flex items-center justify-between group"
                     >
                       {currency}
                       <ChevronDown size={14} className="text-white/20 group-hover:text-accent transition-colors" />
                     </button>
                     <CurrencyPicker 
                        isOpen={isCurrencyPickerOpen} 
                        onClose={() => setIsCurrencyPickerOpen(false)} 
                        selectedCurrency={currency}
                        onSelect={setCurrency}
                     />
                   </div>
                   <div className="flex flex-col gap-2 border-l border-white/5 pl-4">
                     <label className="text-[9px] font-black uppercase text-white/20 tracking-widest">Balance</label>
                     <input 
                        type="number"
                        className="bg-transparent text-lg font-black text-white outline-none w-full"
                        value={balance} onChange={e => setBalance(e.target.value)}
                     />
                   </div>
                </div>
              </div>
            </div>

            <button 
              onClick={handleSave}
              disabled={!name.trim() || !portfolioId}
              className="mt-2 min-h-[72px] bg-white text-black text-lg font-black rounded-3xl active:scale-95 transition-all disabled:opacity-20 flex items-center justify-center gap-3"
            >
              <Check size={28} strokeWidth={4} />
              {editingWallet ? 'SAVE CHANGES' : 'SAVE ACCOUNT'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
