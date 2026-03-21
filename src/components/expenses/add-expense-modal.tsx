'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { convertAmount, getExchangeRate } from '@/lib/exchange';
import { cn } from '@/lib/utils';

const COMMON_CURRENCIES = ['USD', 'EUR', 'RUB', 'KZT', 'GBP', 'TRY', 'GEL'];

export function AddExpenseModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addExpense, preferences, wallets, categories, expenses } = useStore();
  const { baseCurrency } = preferences;
  
  const [amountInput, setAmountInput] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [categoryId, setCategoryId] = useState('');
  const [walletId, setWalletId] = useState('');
  const [note, setNote] = useState('');

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
      return Function(`'use strict'; return (${expr})`)();
    } catch {
      return null;
    }
  };

  const handleSave = () => {
    let numericAmount = evaluateMath(amountInput);
    if (!numericAmount || numericAmount <= 0) {
      numericAmount = parseFloat(amountInput);
    }
    if (!numericAmount || !categoryId || !walletId) return;
    
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
      date: new Date().toISOString(),
      note
    });

    if (navigator.vibrate) navigator.vibrate(50);
    onClose();
    setAmountInput('');
    setNote('');
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
          className="bg-card w-full h-[90vh] rounded-t-3xl flex flex-col p-6 shadow-2xl relative"
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

          <div className="flex-1 overflow-y-auto flex flex-col gap-6 hide-scrollbar pb-24">
            {/* Amount Input with Calculator */}
            <div className="flex flex-col items-center justify-center p-6 bg-background rounded-3xl relative">
              <div className="text-sm text-textMuted mb-2">Сумма (можно 100+50)</div>
              
              <div className="flex items-center gap-2">
                <select 
                  className="bg-transparent text-xl font-semibold outline-none text-accent"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {COMMON_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input 
                  type="text" 
                  inputMode="decimal"
                  className="bg-transparent text-5xl font-bold text-center outline-none w-48 text-white placeholder-textMuted/50"
                  placeholder="0"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* Category Grid */}
            <div>
              <div className="text-sm text-textMuted mb-3">Категория</div>
              {categories.length === 0 ? (
                <div className="text-center text-textMuted">Создайте категории в настройках</div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {categories.map(c => (
                    <button 
                      key={c.id} 
                      onClick={() => setCategoryId(c.id)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all",
                        categoryId === c.id ? "border" : "bg-background border border-transparent"
                      )}
                      style={categoryId === c.id ? { borderColor: c.color, backgroundColor: `${c.color}20` } : {}}
                    >
                      <div className="text-2xl">{c.icon}</div>
                      <span className="text-xs truncate w-full text-center" style={{ color: categoryId === c.id ? c.color : undefined }}>{c.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
             {/* Wallet Selection */}
            {wallets.length > 0 && (
              <div>
                <div className="text-sm text-textMuted mb-3">Кошелек списания</div>
                <select 
                  className="w-full bg-background p-4 rounded-2xl outline-none border border-transparent focus:border-accent"
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
                placeholder="Описание или комментарий"
                className="w-full bg-background p-4 rounded-2xl outline-none"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={!amountInput || !categoryId || !walletId}
            className="absolute bottom-6 left-6 right-6 h-14 bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:bg-textMuted text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-accent/20 transition-all active:scale-95 z-50"
          >
            <Check size={20} strokeWidth={3} />
            Добавить Расход
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
