'use client';

import { useState } from 'react';
import { useStore, WalletType } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet as WalletIcon, CreditCard, PiggyBank, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AddWalletModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addWallet } = useStore();
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('0');
  const [type, setType] = useState<WalletType>('spending');
  const [icon, setIcon] = useState('💳');
  const [color, setColor] = useState('#3b82f6');

  const handleSave = () => {
    if (!name) return;
    addWallet({
      id: Date.now().toString(),
      name,
      currency: 'USD',
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
          className="fixed inset-0 z-[100] flex items-end bg-black/80 backdrop-blur-md"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div 
            className="bg-[#0d1117] w-full h-[90vh] rounded-t-[48px] p-10 flex flex-col gap-10 border-t border-white/5 shadow-2xl overflow-y-auto"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
               <h2 className="text-2xl font-black uppercase tracking-widest text-white/40">New Account</h2>
               <button onClick={onClose} className="p-3 bg-white/5 rounded-full text-white/40"><X size={24} /></button>
            </div>

            <div className="flex flex-col gap-8">
              {/* Type Selector */}
              <div className="flex gap-4">
                 {types.map(t => (
                   <button 
                     key={t.value} 
                     onClick={() => setType(t.value)}
                     className={cn(
                       "flex-1 flex flex-col items-center gap-3 p-6 rounded-[32px] transition-all border-4",
                       type === t.value ? "bg-white text-black border-white shadow-xl" : "bg-white/5 text-white/40 border-transparent opacity-60"
                     )}
                   >
                     <t.icon size={28} />
                     <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                   </button>
                 ))}
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-black uppercase text-white/20 tracking-widest px-2">Account Name</label>
                <input 
                  className="bg-[#1c2128] p-8 rounded-[32px] text-2xl font-black text-white outline-none border border-white/5 focus:border-white/20 transition-all"
                  placeholder="e.g. My Wallet"
                  value={name} onChange={e => setName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-black uppercase text-white/20 tracking-widest px-2">Initial Balance</label>
                <div className="relative">
                  <span className="absolute left-8 top-1/2 -translate-y-1/2 text-2xl font-black text-white/20">$</span>
                  <input 
                    type="number"
                    className="w-full bg-[#1c2128] p-8 pl-14 rounded-[32px] text-4xl font-black text-white outline-none border border-white/5"
                    value={balance} onChange={e => setBalance(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleSave}
              className="mt-auto h-20 bg-white text-black text-xl font-black rounded-[32px] shadow-2xl shadow-white/10 active:scale-95 transition-all"
            >
              CREATE ACCOUNT
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
