'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Calculator, Wallet as WalletIcon, Tag } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { convertAmount, getExchangeRate } from '@/lib/exchange';
import { COMMON_CURRENCIES } from '@/lib/currencies';
import { cn } from '@/lib/utils';

export function AddExpenseModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addExpense, preferences, wallets, categories, expenses } = useStore();
  const { baseCurrency } = preferences;
  
  const [amountInput, setAmountInput] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [categoryId, setCategoryId] = useState('');
  const [walletId, setWalletId] = useState('');

  // Auto-select logic
  useEffect(() => {
    if (isOpen) {
      if (expenses.length > 0) {
        const last = expenses[expenses.length - 1];
        setCategoryId(last.categoryId);
        setWalletId(last.walletId);
      } else if (wallets.length > 0) {
        setWalletId(wallets[0].id);
      }
      setCurrency(baseCurrency);
    }
  }, [isOpen, expenses, wallets, baseCurrency]);

  const evaluateMath = (expr: string) => {
    try {
      // Basic safe math eval without dangerous eval()
      // eslint-disable-next-line no-new-func
      const sanitized = expr.replace(/[^-+*/().0-9]/g, '');
      return Function(`'use strict'; return (${sanitized})`)();
    } catch {
      return null;
    }
  };

  const handleSave = () => {
    let numericAmount = evaluateMath(amountInput);
    if (numericAmount === null || isNaN(numericAmount) || numericAmount <= 0) {
      numericAmount = parseFloat(amountInput);
    }
    if (!numericAmount || isNaN(numericAmount) || !categoryId || !walletId) return;
    
    const wallet = wallets.find(w => w.id === walletId);
    if (!wallet) return;

    const walletAmount = convertAmount(numericAmount, currency, wallet.currency);
    const convertedAmount = convertAmount(numericAmount, currency, baseCurrency);
    const exchangeRate = getExchangeRate(currency, wallet.currency);

    addExpense({
      id: Date.now().toString(),
      originalAmount: numericAmount,
      originalCurrency: currency,
      convertedAmount,
      walletAmount,
      exchangeRate,
      categoryId,
      walletId,
      date: new Date().toISOString()
    });

    if (navigator.vibrate) navigator.vibrate(50);
    onClose();
    setAmountInput('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/70 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
             if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div 
            className="bg-card w-full h-[85vh] rounded-t-[40px] flex flex-col p-8 shadow-2xl relative"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 250 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center text-accent">
                   <Calculator size={24} />
                 </div>
                 <h2 className="text-2xl font-bold">Расход</h2>
              </div>
              <button 
                type="button"
                onClick={onClose} 
                className="p-3 bg-background border border-white/5 rounded-full active:scale-95 text-textMuted"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-8 hide-scrollbar pb-24">
              {/* Amount Input with Calculator UI vibe */}
              <div className="flex flex-col items-center justify-center p-8 bg-background/50 border border-white/5 rounded-[32px] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-accent/20" />
                <div className="text-[10px] text-textMuted font-black uppercase tracking-widest mb-3">Сумма трат</div>
                
                <div className="flex items-center gap-4">
                  <select 
                    className="bg-card/50 px-3 py-2 rounded-xl text-lg font-black outline-none text-accent border border-white/5"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    {COMMON_CURRENCIES.map((c: string) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input 
                    type="text" 
                    inputMode="decimal"
                    className="bg-transparent text-5xl font-black text-center outline-none w-48 text-white placeholder-white/5"
                    placeholder="0"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              {/* Category Grid */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-1">
                  <Tag size={14} className="text-accent" />
                  <div className="text-sm text-textMuted font-bold uppercase tracking-wider">Категория</div>
                </div>
                {categories.length === 0 ? (
                  <div className="text-center text-textMuted p-10 bg-background/40 rounded-3xl border border-dashed border-white/5">
                    Сначала создайте категории
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-3">
                    {categories.map(c => (
                      <button 
                        key={c.id} 
                        type="button"
                        onClick={() => setCategoryId(c.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-2xl transition-all border-2",
                          categoryId === c.id ? "border-white shadow-lg" : "bg-card border-transparent opacity-60"
                        )}
                        style={{ backgroundColor: c.color }}
                      >
                        <div className="text-2xl drop-shadow-md">{c.icon}</div>
                        <span className="text-[10px] font-black uppercase truncate w-full text-center text-white">{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
               {/* Wallet Selection */}
              {wallets.length > 0 && (
                <div className="flex flex-col gap-4">
                   <div className="flex items-center gap-2 px-1">
                    <WalletIcon size={14} className="text-accent" />
                    <div className="text-sm text-textMuted font-bold uppercase tracking-wider">Списать с</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {wallets.map(w => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setWalletId(w.id)}
                        className={cn(
                          "p-4 rounded-2xl flex items-center gap-3 border-2 transition-all",
                          walletId === w.id ? "bg-accent/10 border-accent" : "bg-card border-transparent"
                        )}
                      >
                        <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-lg">{w.icon}</div>
                        <div className="flex flex-col items-start overflow-hidden">
                          <span className={cn("text-xs font-bold truncate w-full", walletId === w.id ? "text-accent" : "text-textMuted")}>{w.name}</span>
                          <span className="text-[10px] font-black opacity-40">{w.balance.toFixed(0)} {w.currency}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button 
              type="button"
              onClick={handleSave}
              disabled={!amountInput || !categoryId || !walletId}
              className="absolute bottom-8 left-8 right-8 h-18 bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:bg-textMuted text-white text-xl font-black rounded-3xl flex items-center justify-center gap-3 shadow-2xl shadow-accent/20 transition-all active:scale-[0.98] z-[120]"
            >
              <Check size={28} strokeWidth={4} />
              СОХРАНИТЬ
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
