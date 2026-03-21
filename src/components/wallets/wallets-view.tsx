'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Settings, ArrowLeftRight, CreditCard } from 'lucide-react';
import { CURRENCIES } from '@/lib/currencies';
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
  const [color, setColor] = useState('#ff4b91');
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
          className="fixed inset-0 z-[100] flex items-end bg-black/80 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div 
            className="bg-[#0d1117] w-full h-[90vh] rounded-t-[48px] flex flex-col p-8 shadow-2xl relative border-t border-white/5"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 35, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black tracking-tight text-white">New Wallet</h2>
              <button onClick={onClose} className="p-4 bg-white/5 rounded-full active:scale-95 text-white/40">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-10 hide-scrollbar pb-24">
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 px-1">Account Name</label>
                <input 
                  className="bg-white/5 p-6 rounded-[24px] outline-none border border-white/5 focus:border-white/20 text-xl font-bold text-white placeholder-white/10" 
                  placeholder="e.g. Tinkoff Black" 
                  value={name} onChange={e => setName(e.target.value)} 
                />
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col gap-3 w-1/3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 px-1">Cur</label>
                  <select 
                    className="bg-white/5 p-6 rounded-[24px] outline-none border border-white/5 focus:border-white/20 text-white font-black text-lg appearance-none text-center"
                    value={currency} onChange={e => setCurrency(e.target.value)}
                  >
                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-3 flex-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 px-1">Balance</label>
                  <input 
                    type="number" className="bg-white/5 p-6 rounded-[24px] outline-none border border-white/5 focus:border-white/20 text-white font-black text-2xl" 
                    placeholder="0" 
                    value={balance} onChange={e => setBalance(e.target.value)} 
                  />
                </div>
              </div>

              <ColorPicker color={color} onChange={setColor} />
              <IconPicker icon={icon} onChange={setIcon} />
            </div>

            <button onClick={handleSave} className="h-18 bg-white text-black active:scale-[0.98] transition-all font-black text-xl rounded-[28px] shadow-2xl z-50">
              Create Account
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function WalletsView() {
  const { wallets, preferences } = useStore();
  const { baseCurrency } = preferences;
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Total net worth logic (simplification for UI)
  const totalNetWorth = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);

  return (
    <div className="p-6 flex flex-col gap-8 pb-32">
      <header className="pt-8 flex justify-between items-center">
        <button className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/60 active:scale-95">
          <Settings size={22} />
        </button>
        <h1 className="text-xl font-black tracking-tight text-white uppercase opacity-40">Wallets</h1>
        <div className="flex gap-3">
          <button className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/60 active:scale-95">
            <ArrowLeftRight size={20} />
          </button>
          <button onClick={() => setIsModalOpen(true)} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white active:scale-95">
            <Plus size={24} />
          </button>
        </div>
      </header>

      {/* Net Worth Card - Pink Gradient */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-br from-[#ff75c3] via-[#ff4b91] to-[#ff2a6d] rounded-[40px] p-10 shadow-2xl shadow-[#ff4b91]/30 relative overflow-hidden"
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col items-center gap-1">
          <div className="text-[52px] font-black text-white leading-tight">
            {baseCurrency === 'USD' ? '$' : baseCurrency === 'RUB' ? '₽' : baseCurrency}
            {totalNetWorth.toLocaleString()}
          </div>
          <div className="text-white/60 text-sm font-bold tracking-wide uppercase">Total net worth</div>
          
          <div className="flex gap-1.5 mt-8">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={cn("w-2 h-2 rounded-full transition-all", i === 0 ? "bg-white w-4" : "bg-white/30")} />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Wallet List */}
      <div className="flex flex-col gap-4 mt-4">
        {wallets.length === 0 ? (
          <div className="text-center text-white/20 py-10 font-bold uppercase tracking-widest text-sm">No accounts found</div>
        ) : (
          wallets.map((w, index) => (
            <motion.div 
              key={w.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#1c2128] rounded-[32px] p-8 flex items-center justify-between group active:scale-[0.98] transition-transform border border-white/5"
            >
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{w.name}</span>
                <span className="text-4xl font-black text-white leading-tight">
                   {w.currency === 'USD' ? '$' : w.currency === 'RUB' ? '₽' : w.currency}
                   {w.balance.toLocaleString()}
                </span>
              </div>
              <div 
                className="w-16 h-16 rounded-[22px] flex items-center justify-center text-white shadow-lg transition-all group-hover:scale-110"
                style={{ backgroundColor: w.color || '#3b82f6', boxShadow: `0 8px 16px ${w.color}40` }}
              >
                {w.icon ? <span className="text-3xl">{w.icon}</span> : <CreditCard size={32} strokeWidth={2.5} />}
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AddWalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
