'use client';

import { useState } from 'react';
import { useStore, WalletType } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, PiggyBank, Landmark, Globe, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COMMON_CURRENCIES } from '@/lib/currencies';

const WALLET_ICONS = ['💳', '💰', '🏦', '💎', '📈', '🏠', '🚗', '🛒', '🎮', '✈️', '🍎', '🍺', '💼', '🎁', '📱'];

export function AddWalletModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addWallet, preferences } = useStore();
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('0');
  const [type, setType] = useState<WalletType>('spending');
  const [currency, setCurrency] = useState('USD');
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const [icon, setIcon] = useState('💳');
  const [color, setColor] = useState(preferences.savedColors[0]);

  const handleSave = () => {
    if (!name.trim()) return;
    
    addWallet({
      id: Date.now().toString(),
      name: name.trim(),
      currency,
      displayCurrency,
      balance: parseFloat(balance) || 0,
      type,
      icon,
      color,
    });
    
    // Reset and close
    setName('');
    setBalance('0');
    setIcon('💳');
    onClose();
  };

  const types: { value: WalletType; label: string; icon: any }[] = [
    { value: 'spending', label: 'Spending', icon: CreditCard },
    { value: 'saving', label: 'Savings', icon: PiggyBank },
    { value: 'debt', label: 'Debt', icon: Landmark },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-[150] flex items-end justify-center bg-black/80 backdrop-blur-sm px-4 pb-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div 
            className="bg-[#0d1117] w-full max-w-xl max-h-[90vh] rounded-[40px] p-8 flex flex-col gap-6 border border-white/10 shadow-2xl overflow-y-auto hide-scrollbar"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
               <h2 className="text-sm font-black uppercase tracking-widest text-white/40">New Wallet</h2>
               <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/40 transition-colors"><X size={20} /></button>
            </div>

            <div className="flex flex-col gap-6">
              {/* Icon & Color Picker */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase text-white/20 tracking-widest">Style</label>
                  <div className="flex gap-1.5">
                    {preferences.savedColors.map(c => (
                      <button 
                        key={c}
                        onClick={() => setColor(c)}
                        className={cn(
                          "w-6 h-6 rounded-full transition-all border-2",
                          color === c ? "border-white scale-110 shadow-lg" : "border-transparent opacity-50 hover:opacity-100"
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2 bg-white/5 p-4 rounded-3xl border border-white/5">
                   {WALLET_ICONS.map(i => (
                     <button 
                       key={i} 
                       onClick={() => setIcon(i)}
                       className={cn(
                         "h-12 rounded-xl flex items-center justify-center text-2xl transition-all border-2",
                         icon === i ? "bg-white/10 border-white" : "bg-transparent border-transparent opacity-40 hover:opacity-100"
                       )}
                       style={icon === i ? { color } : {}}
                     >
                       {i}
                     </button>
                   ))}
                </div>
              </div>

              {/* Type Selector */}
              <div className="flex gap-2">
                 {types.map(t => (
                   <button 
                     key={t.value} 
                     onClick={() => setType(t.value)}
                     className={cn(
                       "flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl transition-all border-2",
                       type === t.value ? "bg-white text-black border-white shadow-xl" : "bg-white/5 text-white/40 border-transparent opacity-60"
                     )}
                   >
                     <t.icon size={20} />
                     <span className="text-[8px] font-black uppercase tracking-widest">{t.label}</span>
                   </button>
                 ))}
              </div>

              <div className="flex flex-col gap-4 bg-white/5 p-6 rounded-[32px] border border-white/5">
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-black uppercase text-white/20 tracking-widest px-1">Name</label>
                  <input 
                    className="bg-transparent text-xl font-black text-white outline-none placeholder-white/5"
                    placeholder="E.g. Cash, Main Bank..."
                    value={name} onChange={e => setName(e.target.value)}
                  />
                </div>

                <div className="h-px bg-white/5 mx-[-24px]" />

                <div className="flex gap-4">
                   <div className="flex-1 flex flex-col gap-2">
                     <label className="text-[9px] font-black uppercase text-white/20 tracking-widest px-1">Currency</label>
                     <select 
                       className="bg-transparent text-lg font-black text-white outline-none appearance-none cursor-pointer"
                       value={currency} onChange={e => setCurrency(e.target.value)}
                     >
                       {COMMON_CURRENCIES.map(c => <option key={c} value={c} className="bg-[#0d1117]">{c}</option>)}
                     </select>
                   </div>
                   <div className="flex-1 flex flex-col gap-2 border-l border-white/5 pl-4">
                     <label className="text-[9px] font-black uppercase text-white/20 tracking-widest px-1">Display In</label>
                     <select 
                       className="bg-transparent text-lg font-black text-white outline-none appearance-none cursor-pointer text-accent"
                       value={displayCurrency} onChange={e => setDisplayCurrency(e.target.value)}
                     >
                       {COMMON_CURRENCIES.map(c => <option key={c} value={c} className="bg-[#0d1117]">{c}</option>)}
                     </select>
                   </div>
                </div>

                <div className="h-px bg-white/5 mx-[-24px]" />

                <div className="flex flex-col gap-2 text-center items-center py-2">
                  <label className="text-[9px] font-black uppercase text-white/20 tracking-widest">Initial Balance</label>
                  <input 
                    type="number"
                    className="bg-transparent text-4xl font-black text-white text-center outline-none w-full"
                    value={balance} onChange={e => setBalance(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleSave}
              disabled={!name.trim()}
              className={cn(
                "min-h-[72px] rounded-[28px] text-lg font-black transition-all flex items-center justify-center gap-3",
                name.trim() ? "bg-white text-black shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-95" : "bg-white/5 text-white/10 cursor-not-allowed"
              )}
            >
              <Check size={24} strokeWidth={4} />
              CREATE ACCOUNT
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
