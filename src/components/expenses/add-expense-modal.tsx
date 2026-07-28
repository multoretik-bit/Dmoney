'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight, CalendarClock, Check, ChevronDown, Tag, Wallet, X,
} from 'lucide-react';
import { generateUUID } from '@/lib/uuid';
import { useStore, Expense } from '@/store/useStore';
import { convertAmount, getExchangeRate } from '@/lib/exchange';
import { cn } from '@/lib/utils';
import { CurrencyPicker } from '@/components/ui/currency-picker';
import { getNextChargeDate } from './subscriptions-section';

type ViewMode = 'personal' | 'work' | 'large';
type ExpenseSource = 'regular' | 'recurring';

export function AddExpenseModal({
  isOpen,
  onClose,
  editingExpense,
  initialViewMode = 'personal',
}: {
  isOpen: boolean;
  onClose: () => void;
  editingExpense?: Expense | null;
  initialViewMode?: ViewMode;
}) {
  const {
    addExpense, updateExpense, deleteExpense, preferences,
    wallets, categories, subscriptions,
  } = useStore();
  const { baseCurrency } = preferences;

  const [amountInput, setAmountInput] = useState('');
  const [currency, setCurrency] = useState(baseCurrency);
  const [walletId, setWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState('');
  const [source, setSource] = useState<ExpenseSource>('regular');
  const [subscriptionId, setSubscriptionId] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('personal');
  const [isCurrencyPickerOpen, setIsCurrencyPickerOpen] = useState(false);

  const rootCategories = useMemo(
    () => categories.filter(category => !category.parentId).sort((a, b) => a.sortOrder - b.sortOrder),
    [categories]
  );
  const childCategories = useMemo(
    () => categories.filter(category => category.parentId === parentCategoryId).sort((a, b) => a.sortOrder - b.sortOrder),
    [categories, parentCategoryId]
  );

  useEffect(() => {
    if (!isOpen) return;
    const state = useStore.getState();
    if (editingExpense) {
      const category = state.categories.find(item => item.id === editingExpense.categoryId);
      setAmountInput(editingExpense.originalAmount.toString());
      setCurrency(editingExpense.originalCurrency);
      setWalletId(editingExpense.walletId);
      setCategoryId(editingExpense.categoryId);
      setParentCategoryId(category?.parentId || category?.id || '');
      setSource(editingExpense.isSubscription ? 'recurring' : 'regular');
      setSubscriptionId('');
      setViewMode(editingExpense.isWork ? 'work' : editingExpense.isLarge ? 'large' : 'personal');
    } else {
      const lastExpense = state.expenses[state.expenses.length - 1];
      const lastCategory = state.categories.find(item => item.id === lastExpense?.categoryId);
      setAmountInput('');
      setCurrency(state.preferences.baseCurrency);
      setWalletId(lastExpense?.walletId || state.wallets[0]?.id || '');
      setCategoryId(lastExpense?.categoryId || '');
      setParentCategoryId(lastCategory?.parentId || lastCategory?.id || '');
      setSource('regular');
      setSubscriptionId('');
      setViewMode(initialViewMode);
    }
  }, [editingExpense, initialViewMode, isOpen]);

  const selectRootCategory = (id: string) => {
    setSource('regular');
    setSubscriptionId('');
    setParentCategoryId(id);
    const children = categories.filter(category => category.parentId === id);
    setCategoryId(children.length === 0 ? id : '');
  };

  const selectRecurring = (id: string) => {
    const recurring = subscriptions.find(item => item.id === id);
    if (!recurring) return;
    setSource('recurring');
    setSubscriptionId(id);
    setAmountInput(recurring.amount.toString());
    setCurrency(recurring.currency);
    setWalletId(recurring.walletId);
    setCategoryId(recurring.categoryId);
    const category = categories.find(item => item.id === recurring.categoryId);
    setParentCategoryId(category?.parentId || category?.id || '');
    setViewMode(recurring.kind === 'work' ? 'work' : 'personal');
  };

  const evaluateAmount = () => {
    try {
      const sanitized = amountInput.replace(/[^-+*/().0-9]/g, '');
      const value = Function(`'use strict'; return (${sanitized})`)();
      return Number(value);
    } catch {
      return Number(amountInput);
    }
  };

  const handleSave = () => {
    const numericAmount = evaluateAmount();
    const wallet = wallets.find(item => item.id === walletId);
    if (!numericAmount || numericAmount <= 0 || !wallet || !categoryId) return;

    const recurring = subscriptions.find(item => item.id === subscriptionId);
    const expenseData: Expense = {
      id: editingExpense?.id || generateUUID(),
      originalAmount: numericAmount,
      originalCurrency: currency,
      convertedAmount: convertAmount(numericAmount, currency, baseCurrency),
      walletAmount: convertAmount(numericAmount, currency, wallet.currency),
      exchangeRate: getExchangeRate(currency, wallet.currency),
      categoryId,
      walletId,
      date: editingExpense?.date || new Date().toISOString(),
      isWork: viewMode === 'work',
      isLarge: viewMode === 'large',
      isSubscription: source === 'recurring',
      subscriptionNextChargeDate: recurring
        ? getNextChargeDate(recurring).toISOString().slice(0, 10)
        : editingExpense?.subscriptionNextChargeDate,
    };

    if (editingExpense) updateExpense(editingExpense.id, expenseData);
    else addExpense(expenseData);
    navigator.vibrate?.(40);
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[170] flex items-end justify-center bg-black/75 backdrop-blur-md p-3 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={event => event.target === event.currentTarget && onClose()}
          >
            <motion.div
              initial={{ y: 70, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 70, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="w-full max-w-3xl max-h-[94vh] overflow-y-auto hide-scrollbar rounded-[32px] border border-white/10 bg-[#0b1320] shadow-2xl"
            >
              <div className="sticky top-0 z-20 flex items-center justify-between px-5 sm:px-7 py-5 bg-[#0b1320]/90 backdrop-blur-xl border-b border-white/[0.06]">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-300">Новая операция</p>
                  <h2 className="text-xl font-black text-white mt-1">
                    {editingExpense ? 'Изменить трату' : 'Добавить трату'}
                  </h2>
                </div>
                <button onClick={onClose} className="p-2.5 rounded-xl bg-white/5 text-white/40 hover:text-white">
                  <X size={19} />
                </button>
              </div>

              <div className="p-5 sm:p-7 space-y-7">
                <section className="rounded-[26px] p-5 sm:p-7 bg-[linear-gradient(145deg,#1747a6_0%,#10234a_60%,#0b1426_100%)] border border-blue-300/15">
                  <p className="text-xs font-bold text-blue-100/55">Сумма операции</p>
                  <div className="flex items-end gap-3 mt-4">
                    <input
                      autoFocus
                      inputMode="decimal"
                      value={amountInput}
                      onChange={event => setAmountInput(event.target.value)}
                      placeholder="0"
                      className="min-w-0 flex-1 bg-transparent outline-none text-5xl sm:text-6xl font-black tracking-[-0.04em] text-white placeholder:text-white/10"
                    />
                    <button
                      onClick={() => setIsCurrencyPickerOpen(true)}
                      className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 border border-white/10 text-sm font-black text-white"
                    >
                      {currency}
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  {Number(amountInput) > 0 && currency !== baseCurrency && (
                    <p className="text-xs text-blue-100/45 mt-4">
                      ≈ {convertAmount(Number(amountInput), currency, baseCurrency).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} {baseCurrency}
                    </p>
                  )}
                </section>

                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Tag size={15} className="text-blue-300" />
                    <h3 className="text-sm font-black text-white">Категория траты</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {rootCategories.map(category => (
                      <button
                        key={category.id}
                        onClick={() => selectRootCategory(category.id)}
                        className={cn(
                          'flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all',
                          source === 'regular' && parentCategoryId === category.id
                            ? 'text-white'
                            : 'bg-white/[0.025] border-white/[0.06] text-white/55 hover:text-white/80'
                        )}
                        style={source === 'regular' && parentCategoryId === category.id
                          ? { background: `${category.color}20`, borderColor: `${category.color}70` }
                          : {}}
                      >
                        <span className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: `${category.color}1d` }}>
                          {category.icon}
                        </span>
                        <span className="text-xs font-bold truncate">{category.name}</span>
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setSource('recurring');
                        setParentCategoryId('');
                        setCategoryId('');
                      }}
                      className={cn(
                        'flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all',
                        source === 'recurring'
                          ? 'bg-emerald-400/12 border-emerald-300/40 text-white'
                          : 'bg-white/[0.025] border-white/[0.06] text-white/55 hover:text-white/80'
                      )}
                    >
                      <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-400/12 text-emerald-300">
                        <CalendarClock size={17} />
                      </span>
                      <span className="text-xs font-bold">Постоянные траты</span>
                    </button>
                  </div>

                  {source === 'regular' && parentCategoryId && childCategories.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-2">На что именно</p>
                      <div className="flex flex-wrap gap-2">
                        {childCategories.map(category => (
                          <button
                            key={category.id}
                            onClick={() => setCategoryId(category.id)}
                            className={cn(
                              'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all',
                              categoryId === category.id ? 'text-white' : 'bg-white/[0.025] border-white/[0.06] text-white/45'
                            )}
                            style={categoryId === category.id
                              ? { background: `${category.color}20`, borderColor: `${category.color}70` }
                              : {}}
                          >
                            <span>{category.icon}</span>
                            {category.name}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {source === 'recurring' && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 grid sm:grid-cols-2 gap-2.5">
                      {subscriptions.length === 0 ? (
                        <div className="sm:col-span-2 p-7 text-center rounded-2xl border border-dashed border-white/10 text-xs text-white/35">
                          Сначала добавьте постоянную трату в отдельном разделе
                        </div>
                      ) : subscriptions.map(item => (
                        <button
                          key={item.id}
                          onClick={() => selectRecurring(item.id)}
                          className={cn(
                            'relative overflow-hidden flex items-center gap-3 p-3 rounded-2xl border text-left transition-all',
                            subscriptionId === item.id
                              ? 'border-emerald-300/50 bg-emerald-400/10'
                              : 'border-white/[0.06] bg-white/[0.025]'
                          )}
                        >
                          <span
                            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-400/10 text-emerald-300 bg-cover bg-center"
                            style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})` } : {}}
                          >
                            {!item.imageUrl && <CalendarClock size={18} />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-bold text-white truncate">{item.name}</span>
                            <span className="block text-[10px] text-white/35 mt-0.5">
                              {item.billingDay} числа · {item.amount.toLocaleString('ru-RU')} {item.currency}
                            </span>
                          </span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </section>

                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Wallet size={15} className="text-blue-300" />
                    <h3 className="text-sm font-black text-white">Списать со счёта</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {wallets.map(item => (
                      <button
                        key={item.id}
                        onClick={() => setWalletId(item.id)}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-2xl border text-left transition-all',
                          walletId === item.id
                            ? 'bg-blue-400/12 border-blue-300/40 text-white'
                            : 'bg-white/[0.025] border-white/[0.06] text-white/45'
                        )}
                      >
                        <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5">{item.icon || '◈'}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-bold truncate">{item.name}</span>
                          <span className="block text-[10px] opacity-45">{item.balance.toLocaleString('ru-RU')} {item.currency}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="flex flex-wrap gap-2">
                  {(['personal', 'work', 'large'] as ViewMode[]).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={cn(
                        'px-4 py-2.5 rounded-xl border text-xs font-bold transition-colors',
                        viewMode === mode
                          ? mode === 'work'
                            ? 'bg-amber-400/15 border-amber-300/35 text-amber-200'
                            : mode === 'large'
                              ? 'bg-violet-400/15 border-violet-300/35 text-violet-200'
                              : 'bg-blue-400/15 border-blue-300/35 text-blue-200'
                          : 'bg-white/[0.025] border-white/[0.06] text-white/35'
                      )}
                    >
                      {mode === 'personal' ? 'Личная' : mode === 'work' ? 'Рабочая' : 'Крупная'}
                    </button>
                  ))}
                </section>
              </div>

              <div className="sticky bottom-0 flex gap-3 p-5 sm:px-7 bg-[#0b1320]/95 backdrop-blur-xl border-t border-white/[0.06]">
                {editingExpense && (
                  <button
                    onClick={() => {
                      deleteExpense(editingExpense.id);
                      onClose();
                    }}
                    className="px-4 rounded-2xl border border-rose-400/20 text-rose-300 text-xs font-bold"
                  >
                    Удалить
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={!evaluateAmount() || !categoryId || !walletId}
                  className="flex-1 min-h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-25 text-white font-black flex items-center justify-center gap-2 transition-all"
                >
                  <Check size={18} strokeWidth={3} />
                  {editingExpense ? 'Сохранить' : 'Добавить трату'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CurrencyPicker
        isOpen={isCurrencyPickerOpen}
        onClose={() => setIsCurrencyPickerOpen(false)}
        selectedCurrency={currency}
        onSelect={setCurrency}
      />
    </>
  );
}
