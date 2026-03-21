'use client';

import { useState } from 'react';
import { useStore, WalletType } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, PiggyBank, Landmark, Globe, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COMMON_CURRENCIES } from '@/lib/currencies';

const WALLET_ICONS = ['💳', '💰', '🏦', '💎', '📈', '🏠', '🚗', '🛒', '🎮', '✈️', '🍎', '🍺', '💼', '🎁', '📱'];

export function AddWalletModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addWallet } = useStore();
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('0');
  const [type, setType] = useState<WalletType>('spending');
  const [currency, setCurrency] = useState('USD');
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const [icon, setIcon] = useState('💳');
  const [color, setColor] = useState('#3b82f6');

  const handleSave = () => {
    if (!name) return;
    addWallet({
      id: Date.now().toString(),
      name,
      currency,
      displayCurrency,
      balance: parseFloat(balance) || 0,
      type,
      icon,
      color,
    });
    setName('');
    setBalance('0');
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
          className="fixed inset-0 z-[110] flex items-end bg-black/80 backdrop-blur-md"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div 
            className="bg-[#0d1117] w-full h-[95vh] rounded-t-[48px] p-8 flex flex-col gap-8 border-t border-white/5 shadow-2xl overflow-y-auto hide-scrollbar"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center -mt-2">
               <h2 className="text-xl font-black uppercase tracking-widest text-white/40">New Wallet</h2>
               <button onClick={onClose} className="p-3 bg-white/5 rounded-full text-white/40"><X size={20} /></button>
            </div>

            <div className="flex flex-col gap-6">
              {/* Icon Picker */}
              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-black uppercase text-white/20 tracking-widest px-2">Choose Icon</label>
                <div className="grid grid-cols-5 gap-3">
                   {WALLET_ICONS.map(i => (
                     <button 
                       key={i} 
                       onClick={() => setIcon(i)}
                       className={cn(
                         "h-16 rounded-2xl flex items-center justify-center text-3xl transition-all border-4",
                         icon === i ? "bg-white/10 border-white scale-110 shadow-lg" : "bg-white/5 border-transparent opacity-40 hover:opacity-100"
                       )}
                     >
                       {i}
                     </button>
                   ))}
                </div>
              </div>

              {/* Type Selector */}
              <div className="flex gap-3 mt-2">
                 {types.map(t => (
                   <button 
                     key={t.value} 
                     onClick={() => setType(t.value)}
                     className={cn(
                       "flex-1 flex flex-col items-center gap-3 p-5 rounded-[28px] transition-all border-4",
                       type === t.value ? "bg-white text-black border-white shadow-xl" : "bg-white/5 text-white/40 border-transparent opacity-60"
                     )}
                   >
                     <t.icon size={24} />
                     <span className="text-[9px] font-black uppercase tracking-widest">{t.label}</span>
                   </button>
                 ))}
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black uppercase text-white/20 tracking-widest px-2">Wallet Name</label>
                  <input 
                    className="bg-[#1c2128] p-6 rounded-[28px] text-xl font-black text-white outline-none border border-white/5"
                    placeholder="My Wallet"
                    value={name} onChange={e => setName(e.target.value)}
                  />
                </div>

                <div className="flex flex-row gap-4">
                   <div className="flex-1 flex flex-col gap-3">
                     <label className="text-[10px] font-black uppercase text-white/20 tracking-widest px-2">Currency</label>
                     <div className="relative">
                       <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                       <select 
                         className="w-full bg-[#1c2128] p-6 pl-14 rounded-[28px] text-lg font-black text-white outline-none border border-white/5 appearance-none"
                         value={currency} onChange={e => setCurrency(e.target.value)}
                       >
                         {COMMON_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                     </div>
                   </div>
                   <div className="flex-1 flex flex-col gap-3">
                     <label className="text-[10px] font-black uppercase text-white/20 tracking-widest px-2">Display secondary as</label>
                     <select 
                       className="w-full bg-[#1c2128] p-6 rounded-[28px] text-lg font-black text-white outline-none border border-white/5 appearance-none"
                       value={displayCurrency} onChange={e => setDisplayCurrency(e.target.value)}
                     >
                       {COMMON_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                   </div>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black uppercase text-white/20 tracking-widest px-2">Initial Balance</label>
                  <div className="relative">
                    <span className="absolute left-8 top-1/2 -translate-y-1/2 text-2xl font-black text-white/20">{currency === 'USD' ? '$' : currency === 'RUB' ? '₽' : currency}</span>
                    <input 
                      type="number"
                      className="w-full bg-[#1c2128] p-6 pl-14 rounded-[28px] text-3xl font-black text-white outline-none border border-white/5"
                      value={balance} onChange={e => setBalance(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={handleSave}
              className="mt-6 min-h-[72px] bg-white text-black text-lg font-black rounded-[28px] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <Check size={24} strokeWidth={4} />
              SAVE WALLET
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
