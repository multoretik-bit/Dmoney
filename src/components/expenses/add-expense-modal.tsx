'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { CURRENCIES, convertCurrency } from '@/lib/currencies';
import { cn } from '@/lib/utils';

export function AddExpenseModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addExpense, baseCurrency, wallets } = useStore();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [categoryId, setCategoryId] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [note, setNote] = useState('');

  const categories = [
    { id: '1', name: 'Еда', icon: '🍔', color: 'bg-orange-500' },
    { id: '2', name: 'Транспорт', icon: '🚕', color: 'bg-yellow-500' },
    { id: '3', name: 'Жильё', icon: '🏠', color: 'bg-blue-500' },
  ];

  const handleSave = async () => {
    if (!amount || !categoryId) return;
    
    // Convert logic
    const numericAmount = parseFloat(amount);
    const converted = await convertCurrency(numericAmount, currency, baseCurrency);

    addExpense({
      id: Date.now().toString(),
      amount: numericAmount,
      currency,
      convertedAmount: converted,
      categoryId,
      walletId,
      date: new Date().toISOString(),
      note
    });

    if (navigator.vibrate) navigator.vibrate(50);
    onClose();
    setAmount('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="bg-card w-full h-[85vh] rounded-t-3xl flex flex-col p-6 shadow-2xl relative"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Новая трата</h2>
            <button onClick={onClose} className="p-2 bg-background rounded-full active:scale-95">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-6 hide-scrollbar pb-20">
            {/* Amount Input */}
            <div className="flex flex-col items-center justify-center p-6 bg-background rounded-3xl">
              <div className="text-sm text-textMuted mb-2">Сумма</div>
              <div className="flex items-center gap-2">
                <select 
                  className="bg-transparent text-xl font-semibold outline-none text-accent"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol}</option>)}
                </select>
                <input 
                  type="number" 
                  className="bg-transparent text-5xl font-bold text-center outline-none w-48 text-white placeholder-textMuted/50"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* Category Grid */}
            <div>
              <div className="text-sm text-textMuted mb-3">Категория</div>
              <div className="grid grid-cols-4 gap-3">
                {categories.map(c => (
                  <button 
                    key={c.id} 
                    onClick={() => setCategoryId(c.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all",
                      categoryId === c.id ? "bg-accent/20 border border-accent" : "bg-background"
                    )}
                  >
                    <div className="text-2xl">{c.icon}</div>
                    <span className="text-xs truncate w-full text-center">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
            
             {/* Wallet Selection */}
            {wallets.length > 0 && (
              <div>
                <div className="text-sm text-textMuted mb-3">Кошелек</div>
                <select 
                  className="w-full bg-background p-4 rounded-2xl outline-none"
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                >
                  {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({w.currency})</option>)}
                </select>
              </div>
            )}

            {/* Note */}
            <div>
              <div className="text-sm text-textMuted mb-3">Заметка</div>
              <input 
                type="text"
                placeholder="На что ушли деньги?"
                className="w-full bg-background p-4 rounded-2xl outline-none"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={!amount || !categoryId}
            className="absolute bottom-6 left-6 right-6 h-14 bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:bg-textMuted text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-accent/20 transition-all active:scale-95"
          >
            <Check size={20} strokeWidth={3} />
            Добавить Расход
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
