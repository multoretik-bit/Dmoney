'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { CURRENCIES } from '@/lib/currencies';

function AddWalletModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addWallet } = useStore();
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [balance, setBalance] = useState('');
  const [type, setType] = useState<'cash' | 'bank' | 'crypto'>('bank');

  const handleSave = () => {
    if (!name || !balance) return;
    addWallet({
      id: Date.now().toString(),
      name,
      currency,
      balance: parseFloat(balance),
      type
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
          className="bg-card w-full rounded-t-3xl flex flex-col p-6 shadow-2xl relative"
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

          <div className="flex flex-col gap-4 mb-20">
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
                placeholder="Баланс" 
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
          </div>

          <button onClick={handleSave} className="absolute bottom-6 left-6 right-6 h-14 bg-accent text-white font-bold rounded-2xl">
            Добавить
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function WalletsView() {
  const { wallets } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // In a real app we would async fetch conversions here if needed, or cache.
  // For MVP UI, assume balance is strictly in wallet currency.

  return (
    <div className="p-4 flex flex-col gap-6">
      <header className="pt-8 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Кошельки</h1>
          <p className="text-sm text-textMuted mt-1">Всего кошельков: {wallets.length}</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="w-10 h-10 bg-card rounded-2xl flex items-center justify-center text-accent shadow-lg active:scale-95">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </header>

      {wallets.length === 0 ? (
        <div className="text-center text-textMuted py-10 bg-card rounded-3xl">
          Нет кошельков. Добавьте первый!
        </div>
      ) : (
        <div className="flex flex-col gap-4 pb-20">
          {wallets.map(w => (
            <div key={w.id} className="bg-gradient-to-br from-card to-card/50 rounded-3xl p-6 shadow-xl border border-white/5 relative overflow-hidden">
              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex justify-between items-center opacity-90 text-sm">
                  <span className="font-medium text-white/80">{w.name}</span>
                  <span className="bg-background px-2 py-1 rounded-lg text-xs">{w.type.toUpperCase()}</span>
                </div>
                <div className="text-3xl font-bold mt-2">
                  {w.balance.toLocaleString()} <span className="text-lg text-accent">{w.currency}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddWalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
