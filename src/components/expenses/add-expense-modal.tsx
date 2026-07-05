'use client';

import { generateUUID } from '@/lib/uuid';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Calculator, Wallet as WalletIcon, Tag, ArrowRight, ChevronDown } from 'lucide-react';
import { useStore, Expense } from '@/store/useStore';
import { convertAmount, getExchangeRate } from '@/lib/exchange';
import { COMMON_CURRENCIES } from '@/lib/currencies';
import { cn } from '@/lib/utils';
import { CurrencyPicker } from '@/components/ui/currency-picker';

export function AddExpenseModal({
  isOpen,
  onClose,
  editingExpense,
  initialViewMode = 'personal'
}: {
  isOpen: boolean;
  onClose: () => void;
  editingExpense?: Expense | null;
  initialViewMode?: 'personal' | 'work' | 'large';
}) {
  const { addExpense, updateExpense, deleteExpense, preferences, wallets, categories, expenses } = useStore();
  const { baseCurrency } = preferences;

  const [amountInput, setAmountInput] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [categoryId, setCategoryId] = useState('');
  const [walletId, setWalletId] = useState('');
  const [isWork, setIsWork] = useState(false);
  const [isLarge, setIsLarge] = useState(false);
  const [isCurrencyPickerOpen, setIsCurrencyPickerOpen] = useState(false);

  // Auto-select logic
  useEffect(() => {
    if (isOpen) {
      if (editingExpense) {
        setAmountInput(editingExpense.originalAmount.toString());
        setCurrency(editingExpense.originalCurrency);
        setCategoryId(editingExpense.categoryId);
        setWalletId(editingExpense.walletId);
        setIsWork(!!editingExpense.isWork);
        setIsLarge(!!editingExpense.isLarge);
      } else if (expenses.length > 0) {
        const last = expenses[expenses.length - 1];
        setCategoryId(last.categoryId);
        setWalletId(last.walletId);
        setCurrency(baseCurrency);
        setAmountInput('');
        setIsWork(initialViewMode === 'work');
        setIsLarge(initialViewMode === 'large');
      } else {
        if (wallets.length > 0) setWalletId(wallets[0].id);
        setCurrency(baseCurrency);
        setAmountInput('');
        setIsWork(initialViewMode === 'work');
        setIsLarge(initialViewMode === 'large');
      }
    }
  }, [isOpen, editingExpense, expenses, wallets, baseCurrency]);

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

    const expenseData = {
      id: editingExpense ? editingExpense.id : generateUUID(),
      originalAmount: numericAmount,
      originalCurrency: currency,
      convertedAmount,
      walletAmount,
      exchangeRate,
      categoryId,
      walletId,
      date: editingExpense ? editingExpense.date : new Date().toISOString(),
      isWork,
      isLarge
    };

    if (editingExpense) {
      updateExpense(editingExpense.id, expenseData);
    } else {
      addExpense(expenseData);
    }

    if (navigator.vibrate) navigator.vibrate(50);
    onClose();
    setAmountInput('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-end bg-black/70 backdrop-blur-sm px-4 pb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className="surface w-full max-w-2xl max-h-[90vh] rounded-4xl flex flex-col p-6 shadow-card-lg relative"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 250 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* CENTERED HEADER */}
            <div className="flex flex-col items-center mb-8 relative">
              <button
                onClick={onClose}
                className="absolute right-0 top-0 p-2.5 bg-white/5 hover:bg-white/10 rounded-full active:scale-95 text-white/40 transition-all"
              >
                <X size={18} />
              </button>

              <div className="w-12 h-12 bg-accent-dim rounded-2xl flex items-center justify-center text-accent mb-3">
                <Calculator size={22} />
              </div>
              <h2 className="text-lg font-semibold text-white">
                {editingExpense ? 'Правка' : 'Новый расход'}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-8 hide-scrollbar pb-24">
              {/* Amount Input with Enhanced Preview */}
              <div className="flex flex-col items-center justify-center p-8 surface-sunken rounded-4xl relative overflow-hidden min-h-[280px]">
                <div className="text-[12px] text-textMuted mb-8">Введите сумму</div>

                <div className="flex flex-col items-center gap-6 w-full">
                  <div className="flex items-center justify-center gap-4 w-full">
                    <button
                      type="button"
                      onClick={() => setIsCurrencyPickerOpen(true)}
                      className="bg-white/5 px-4 h-12 rounded-2xl text-base font-semibold outline-none text-accent flex items-center gap-2 hover:bg-white/10 transition-all"
                    >
                      {currency}
                      <ChevronDown size={14} className="text-accent/60" />
                    </button>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="bg-transparent text-6xl font-semibold text-left outline-none min-w-[140px] max-w-[240px] text-white placeholder-white/10 tabular-nums"
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

                  <div className="h-32 flex items-center justify-center w-full">
                    {(() => {
                      const wallet = wallets.find(w => w.id === walletId);
                      const numericAmount = parseFloat(amountInput) || 0;
                      if (numericAmount > 0) {
                        const convertedUSD = convertAmount(numericAmount, currency, 'USD');
                        const convertedRUB = convertAmount(numericAmount, currency, 'RUB');
                        const convertedWallet = wallet ? convertAmount(numericAmount, currency, wallet.currency) : null;

                        return (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center gap-2 bg-accent-dim p-5 rounded-3xl w-full"
                          >
                             <span className="text-3xl font-semibold text-accent tracking-tight tabular-nums">
                                ≈ {convertedUSD.toFixed(1)} USD
                             </span>
                             <div className="flex flex-col items-center gap-1 opacity-40">
                                <span className="text-[13px] font-medium text-white tabular-nums">
                                  ≈ {convertedRUB.toFixed(1)} RUB
                                </span>
                                {wallet && wallet.currency !== 'USD' && wallet.currency !== 'RUB' && (
                                  <span className="text-[11px] tabular-nums">
                                    {convertedWallet?.toFixed(1)} {wallet.currency} • {wallet.name}
                                  </span>
                                )}
                             </div>
                          </motion.div>
                        );
                      }
                      return (
                        <div className="text-[12px] text-white/15">
                          Ожидание ввода
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Category Selection */}
              <div className="flex flex-col gap-5">
                <span className="text-[12px] font-medium text-textMuted px-1">Категория</span>
                {categories.length === 0 ? (
                  <div className="text-center py-16 rounded-3xl border border-dashed border-white/[0.08] text-[12px] text-textSubtle">
                    Сначала создайте категории
                  </div>
                ) : (
                  <div className="flex flex-col gap-8">
                    {categories.filter(c => !c.parentId).map(head => {
                      const subs = categories.filter(c => c.parentId === head.id);
                      return (
                        <div key={head.id} className="flex flex-col gap-3">
                          <span className="text-[12px] font-medium text-white/50 px-1">{head.name}</span>
                          <div className="grid grid-cols-4 gap-3">
                            <button
                              onClick={() => setCategoryId(head.id)}
                              className={cn(
                                "flex flex-col items-center justify-center gap-2 h-20 rounded-2xl transition-all",
                                categoryId === head.id ? "bg-accent-dim ring-1 ring-accent" : "bg-white/[0.04] opacity-50 hover:opacity-100"
                              )}
                            >
                              <div className="text-2xl" style={categoryId === head.id ? { color: head.color } : {}}>{head.icon}</div>
                              <span className="text-[10px] font-medium text-white/60">Все</span>
                            </button>
                            {subs.map(sub => (
                              <button
                                key={sub.id}
                                onClick={() => setCategoryId(sub.id)}
                                className={cn(
                                  "flex flex-col items-center justify-center gap-2 h-20 rounded-2xl transition-all",
                                  categoryId === sub.id ? "bg-accent-dim ring-1 ring-accent" : "bg-white/[0.04] opacity-50 hover:opacity-100"
                                )}
                              >
                                <div className="text-2xl" style={categoryId === sub.id ? { color: sub.color } : {}}>{sub.icon}</div>
                                <span className="text-[10px] font-medium text-white/60 truncate w-full px-1 text-center">{sub.name}</span>
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
                <div className="flex flex-col gap-5">
                  <span className="text-[12px] font-medium text-textMuted px-1">Списать с</span>
                  <div className="grid grid-cols-2 gap-3">
                    {wallets.map(w => (
                      <button
                        key={w.id}
                        onClick={() => setWalletId(w.id)}
                        className={cn(
                          "p-4 rounded-2xl flex items-center gap-3.5 transition-all active:scale-95",
                          walletId === w.id ? "bg-accent-dim ring-1 ring-accent text-accent" : "bg-white/[0.04] text-white/30"
                        )}
                      >
                        <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center text-xl" style={walletId === w.id ? { color: w.color } : {}}>
                          {w.icon}
                        </div>
                        <div className="flex flex-col items-start min-w-0">
                          <span className={cn("text-sm font-medium truncate w-full", walletId === w.id ? "text-white" : "text-white/40")}>{w.name}</span>
                          <span className="text-[11px] opacity-50 tabular-nums leading-none mt-1">{Number(w.balance || 0).toFixed(1)} {w.currency}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Expense Toggle */}
              <div
                onClick={() => { setIsWork(!isWork); if (!isWork) setIsLarge(false); }}
                className={cn(
                  "p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between",
                  isWork
                    ? "bg-warning/10 border-warning/40"
                    : "bg-white/[0.04] border-transparent hover:bg-white/[0.07]"
                )}
              >
                <div className="flex items-center gap-3.5">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all",
                    isWork ? "bg-warning text-white" : "bg-white/5 text-white/20"
                  )}>
                    💼
                  </div>
                  <div className="flex flex-col">
                    <span className={cn("text-sm font-medium transition-colors", isWork ? "text-warning" : "text-white/60")}>Рабочая трата</span>
                    <span className="text-[11px] text-textSubtle leading-none mt-1">Отдельный учет и лимит</span>
                  </div>
                </div>
                <div className={cn(
                  "w-12 h-7 rounded-full p-1 transition-all",
                  isWork ? "bg-warning" : "bg-white/10"
                )}>
                  <motion.div
                    animate={{ x: isWork ? 20 : 0 }}
                    className="w-5 h-5 bg-white rounded-full"
                  />
                </div>
              </div>

              {/* Large Purchase Toggle */}
              <div
                onClick={() => { setIsLarge(!isLarge); if (!isLarge) setIsWork(false); }}
                className={cn(
                  "p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between",
                  isLarge
                    ? "bg-violet/10 border-violet/40"
                    : "bg-white/[0.04] border-transparent hover:bg-white/[0.07]"
                )}
              >
                <div className="flex items-center gap-3.5">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all",
                    isLarge ? "bg-violet text-white" : "bg-white/5 text-white/20"
                  )}>
                    🛍️
                  </div>
                  <div className="flex flex-col">
                    <span className={cn("text-sm font-medium transition-colors", isLarge ? "text-violet" : "text-white/60")}>Крупная покупка</span>
                    <span className="text-[11px] text-textSubtle leading-none mt-1">Вне основного бюджета</span>
                  </div>
                </div>
                <div className={cn(
                  "w-12 h-7 rounded-full p-1 transition-all",
                  isLarge ? "bg-violet" : "bg-white/10"
                )}>
                  <motion.div
                    animate={{ x: isLarge ? 20 : 0 }}
                    className="w-5 h-5 bg-white rounded-full"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={!amountInput || !categoryId || !walletId}
              className="mt-4 min-h-[64px] bg-accent text-white text-base font-semibold rounded-3xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-30"
            >
              <Check size={20} />
              Сохранить
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
