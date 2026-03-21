'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Calculator, Wallet as WalletIcon, Tag, ArrowRight, ChevronDown } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { convertAmount, getExchangeRate } from '@/lib/exchange';
import { COMMON_CURRENCIES } from '@/lib/currencies';
import { cn } from '@/lib/utils';
import { CurrencyPicker } from '@/components/ui/currency-picker';

export function AddExpenseModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addExpense, preferences, wallets, categories, expenses } = useStore();
  const { baseCurrency } = preferences;
  
  const [amountInput, setAmountInput] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [categoryId, setCategoryId] = useState('');
  const [walletId, setWalletId] = useState('');
  const [isCurrencyPickerOpen, setIsCurrencyPickerOpen] = useState(false);

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
          className="fixed inset-0 z-[100] flex flex-col items-center justify-end bg-black/80 backdrop-blur-md px-4 pb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div 
            className="glass-card w-full max-w-2xl max-h-[90vh] rounded-[48px] flex flex-col p-8 shadow-2xl relative border-t-4 border-t-accent"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 250 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* CENTERED HEADER */}
            <div className="flex flex-col items-center mb-10 relative">
              <button 
                onClick={onClose} 
                className="absolute right-0 top-0 p-3 bg-white/5 hover:bg-white/10 rounded-full active:scale-95 text-white/40 transition-all"
              >
                <X size={20} />
              </button>
              
              <div className="w-16 h-16 bg-accent/20 rounded-[28px] flex items-center justify-center text-accent mb-4 shadow-xl shadow-accent/10">
                <Calculator size={32} strokeWidth={3} />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-[0.3em] text-white">Расход</h2>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-10 hide-scrollbar pb-24">
              {/* Amount Input with Enhanced Preview */}
              <div className="flex flex-col items-center justify-center p-12 bg-black/20 rounded-[48px] border border-white/5 relative overflow-hidden min-h-[320px]">
                <div className="text-[11px] text-white/20 font-black uppercase tracking-[0.4em] mb-10">Введите сумму</div>
                
                <div className="flex flex-col items-center gap-8 w-full">
                  <div className="flex items-center justify-center gap-4 w-full">
                    <button 
                      type="button"
                      onClick={() => setIsCurrencyPickerOpen(true)}
                      className="bg-white/5 px-5 h-16 rounded-[24px] text-xl font-black outline-none text-accent border border-accent/10 flex items-center gap-3 hover:bg-accent/10 transition-all"
                    >
                      {currency}
                      <ChevronDown size={14} className="text-accent/60" />
                    </button>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      className="bg-transparent text-7xl font-black text-left outline-none min-w-[140px] max-w-[240px] text-white placeholder-white/5"
                      placeholder="0"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <CurrencyPicker 
                    isOpen={isCurrencyPickerOpen} 
                    onClose={() => setIsCurrencyPickerOpen(false)} 
                    selectedCurrency={currency}
                    onSelect={setCurrency}
                  />

                  <div className="h-40 flex items-center justify-center w-full">
                    {(() => {
                      const wallet = wallets.find(w => w.id === walletId);
                      const numericAmount = parseFloat(amountInput) || 0;
                      if (numericAmount > 0) {
                        const convertedUSD = convertAmount(numericAmount, currency, 'USD');
                        const convertedRUB = convertAmount(numericAmount, currency, 'RUB');
                        const convertedWallet = wallet ? convertAmount(numericAmount, currency, wallet.currency) : null;
                        
                        return (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center gap-2 bg-accent/5 p-6 rounded-[32px] border border-accent/10 w-full"
                          >
                             <div className="flex items-center gap-3 text-accent">
                                <span className="text-4xl font-black tracking-tight">
                                  ≈ {convertedUSD.toFixed(1)} USD
                                </span>
                             </div>
                             <div className="flex flex-col items-center gap-1 opacity-30">
                                <span className="text-[13px] font-black uppercase tracking-widest text-white">
                                  ≈ {convertedRUB.toFixed(1)} RUB
                                </span>
                                {wallet && wallet.currency !== 'USD' && wallet.currency !== 'RUB' && (
                                  <span className="text-[10px] font-black uppercase tracking-widest">
                                    {convertedWallet?.toFixed(1)} {wallet.currency} • {wallet.name}
                                  </span>
                                )}
                             </div>
                          </motion.div>
                        );
                      }
                      return (
                        <div className="text-[10px] font-black uppercase text-white/5 tracking-[0.5em] animate-pulse">
                          Ожидание ввода
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Category Selection */}
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3 px-2">
                  <span className="text-[12px] font-black uppercase tracking-[0.4em] text-white/30">Категория</span>
                  <div className="h-px bg-white/5 flex-1" />
                </div>
                {categories.length === 0 ? (
                  <div className="text-center py-20 bg-white/[0.02] rounded-[40px] border-2 border-dashed border-white/5 text-[10px] font-black uppercase tracking-[0.4em] text-white/10">
                    Сначала создайте категории
                  </div>
                ) : (
                  <div className="flex flex-col gap-10">
                    {categories.filter(c => !c.parentId).map(head => {
                      const subs = categories.filter(c => c.parentId === head.id);
                      return (
                        <div key={head.id} className="flex flex-col gap-4">
                          <span className="text-[11px] font-black uppercase text-white/40 tracking-[0.2em] px-2">{head.name}</span>
                          <div className="grid grid-cols-4 gap-4">
                            <button 
                              onClick={() => setCategoryId(head.id)}
                              className={cn(
                                "flex flex-col items-center justify-center gap-3 h-24 rounded-[28px] transition-all border-l-4",
                                categoryId === head.id ? "bg-accent/20 border-accent shadow-[0_0_20px_rgba(59,130,246,0.2)] scale-105" : "bg-white/5 border-transparent opacity-40 hover:opacity-100"
                              )}
                            >
                              <div className="text-3xl" style={categoryId === head.id ? { color: head.color } : {}}>{head.icon}</div>
                              <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Все</span>
                            </button>
                            {subs.map(sub => (
                              <button 
                                key={sub.id} 
                                onClick={() => setCategoryId(sub.id)}
                                className={cn(
                                  "flex flex-col items-center justify-center gap-3 h-24 rounded-[28px] transition-all border-l-4",
                                  categoryId === sub.id ? "bg-accent/20 border-accent shadow-[0_0_20px_rgba(59,130,246,0.2)] scale-105" : "bg-white/5 border-transparent opacity-40 hover:opacity-100"
                                )}
                              >
                                <div className="text-3xl" style={categoryId === sub.id ? { color: sub.color } : {}}>{sub.icon}</div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/60 truncate w-full px-2 text-center">{sub.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
               {/* Wallet Selection */}
              {wallets.length > 0 && (
                <div className="flex flex-col gap-6">
                   <div className="flex items-center gap-3 px-2">
                    <span className="text-[12px] font-black uppercase tracking-[0.4em] text-white/30">Списать с</span>
                    <div className="h-px bg-white/5 flex-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {wallets.map(w => (
                      <button
                        key={w.id}
                        onClick={() => setWalletId(w.id)}
                        className={cn(
                          "p-5 rounded-[32px] flex items-center gap-4 transition-all active:scale-95 border-l-4",
                          walletId === w.id ? "bg-accent/20 border-accent text-accent shadow-[0_0_20px_rgba(59,130,246,0.1)]" : "bg-white/5 border-transparent text-white/20"
                        )}
                      >
                        <div className="w-12 h-12 rounded-2xl bg-black/20 flex items-center justify-center text-2xl" style={walletId === w.id ? { color: w.color } : {}}>
                          {w.icon}
                        </div>
                        <div className="flex flex-col items-start min-w-0">
                          <span className={cn("text-sm font-black uppercase tracking-tighter truncate w-full", walletId === w.id ? "text-white" : "text-white/40")}>{w.name}</span>
                          <span className="text-[10px] font-black opacity-20 tracking-widest leading-none mt-1">{w.balance.toFixed(1)} {w.currency}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={handleSave}
              disabled={!amountInput || !categoryId || !walletId}
              className="mt-6 min-h-[80px] bg-accent text-white text-2xl font-black rounded-[32px] flex items-center justify-center gap-4 shadow-2xl shadow-accent/20 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale group"
            >
              <Check size={32} strokeWidth={4} className="group-hover:scale-125 transition-transform" />
              СОХРАНИТЬ
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
