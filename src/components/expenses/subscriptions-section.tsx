'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, Subscription, SubscriptionKind } from '@/store/useStore';
import { generateUUID } from '@/lib/uuid';
import { COMMON_CURRENCIES } from '@/lib/currencies';
import { Plus, Trash2, Edit2, Check, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

const KIND_ORDER: SubscriptionKind[] = ['personal', 'work', 'yearly'];

const KIND_META: Record<SubscriptionKind, { label: string; blockLabel: string; color: string }> = {
  personal: { label: 'Обычная', blockLabel: 'Обычные', color: '#60a5fa' },
  work: { label: 'Рабочая', blockLabel: 'Рабочие', color: '#f59e0b' },
  yearly: { label: 'Годовая', blockLabel: 'Годовые', color: '#8b5cf6' },
};

function daysInMonth(year: number, month1to12: number) {
  return new Date(year, month1to12, 0).getDate();
}

export function getNextChargeDate(sub: Subscription, from: Date = new Date()): Date {
  const todayMidnight = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  if (sub.kind === 'yearly') {
    const month = sub.billingMonth || 1;
    let year = from.getFullYear();
    let day = Math.min(sub.billingDay, daysInMonth(year, month));
    let candidate = new Date(year, month - 1, day);
    if (candidate < todayMidnight) {
      year += 1;
      day = Math.min(sub.billingDay, daysInMonth(year, month));
      candidate = new Date(year, month - 1, day);
    }
    return candidate;
  }

  let month = from.getMonth() + 1;
  let year = from.getFullYear();
  let day = Math.min(sub.billingDay, daysInMonth(year, month));
  let candidate = new Date(year, month - 1, day);
  if (candidate < todayMidnight) {
    month += 1;
    if (month > 12) { month = 1; year += 1; }
    day = Math.min(sub.billingDay, daysInMonth(year, month));
    candidate = new Date(year, month - 1, day);
  }
  return candidate;
}

export function UpcomingSubscriptionsWidget() {
  const { subscriptions, wallets } = useStore();
  if (subscriptions.length === 0) return null;

  const sorted = [...subscriptions].sort(
    (a, b) => getNextChargeDate(a).getTime() - getNextChargeDate(b).getTime()
  );

  return (
    <div className="flex flex-col gap-3 p-5 rounded-[28px] bg-white/[0.03] border border-white/5">
      <div className="flex items-center gap-2 px-1">
        <RefreshCw size={14} className="text-emerald-400" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Ближайшие подписки</span>
      </div>
      <div className="flex flex-col gap-2">
        {sorted.slice(0, 5).map(sub => {
          const wallet = wallets.find(w => w.id === sub.walletId);
          const nextDate = getNextChargeDate(sub);
          const meta = KIND_META[sub.kind];
          return (
            <div
              key={sub.id}
              className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/5"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-white truncate">{sub.name}</span>
                <span className="text-[10px] font-bold text-white/30 truncate">
                  <span style={{ color: meta.color }}>{meta.label}</span>
                  {' · '}{format(nextDate, 'd MMMM', { locale: ru })}
                  {' · '}{wallet ? wallet.name : 'счёт не найден'}
                  {sub.autoCharge && ' · авто'}
                </span>
              </div>
              <span className="text-sm font-black text-white tabular-nums flex-shrink-0">
                {sub.amount.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} {sub.currency}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SubscriptionsManager() {
  const { subscriptions, wallets, deleteSubscription } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

  const openAdd = () => { setEditingSubscription(null); setIsModalOpen(true); };
  const openEdit = (s: Subscription) => { setEditingSubscription(s); setIsModalOpen(true); };

  const byKind = KIND_ORDER.map(kind => ({
    kind,
    items: subscriptions
      .filter(s => s.kind === kind)
      .sort((a, b) => getNextChargeDate(a).getTime() - getNextChargeDate(b).getTime()),
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30">Подписки</span>
          <div className="h-px bg-white/[0.06] w-16 sm:w-32" />
        </div>
        <button
          onClick={openAdd}
          className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400 hover:bg-emerald-500/30 transition-all"
        >
          <Plus size={16} strokeWidth={4} />
        </button>
      </div>

      {subscriptions.length === 0 ? (
        <button
          onClick={openAdd}
          className="py-16 rounded-[36px] border-2 border-dashed border-white/[0.06] flex flex-col items-center justify-center gap-3 text-white/15 hover:text-white/40 hover:border-white/15 transition-all"
        >
          <Plus size={28} strokeWidth={3} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Добавить первую подписку</span>
        </button>
      ) : (
        <div className="flex flex-col gap-7">
          {byKind.map(({ kind, items }) => {
            if (items.length === 0) return null;
            const meta = KIND_META[kind];
            return (
              <div key={kind} className="flex flex-col gap-3">
                <div className="flex items-center gap-2 px-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: meta.color }}>
                    {meta.blockLabel}
                  </span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {items.map(sub => {
                    const wallet = wallets.find(w => w.id === sub.walletId);
                    const nextDate = getNextChargeDate(sub);
                    return (
                      <div
                        key={sub.id}
                        className="p-4 flex items-center justify-between rounded-[20px] group"
                        style={{
                          background: 'linear-gradient(145deg, #0d1626 0%, #090e1a 100%)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div
                            className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
                            style={{ background: `${meta.color}18`, color: meta.color }}
                          >
                            🔁
                          </div>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-[15px] font-bold text-white/90 truncate">{sub.name}</span>
                            <span className="text-[10px] font-bold text-white/30 truncate">
                              {kind === 'yearly'
                                ? format(nextDate, 'd MMMM', { locale: ru })
                                : `${sub.billingDay} числа`}
                              {' · '}{wallet ? wallet.name : 'счёт не найден'}
                              {sub.autoCharge && ' · автосписание'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-[15px] font-black text-white tabular-nums">
                            {sub.amount.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} {sub.currency}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEdit(sub)} className="p-1.5 text-white/20 hover:text-white">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => deleteSubscription(sub.id)} className="p-1.5 text-white/20 hover:text-rose-400">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SubscriptionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} editingSubscription={editingSubscription} />
    </div>
  );
}

function SubscriptionModal({
  isOpen,
  onClose,
  editingSubscription,
}: {
  isOpen: boolean;
  onClose: () => void;
  editingSubscription: Subscription | null;
}) {
  const { addSubscription, updateSubscription, wallets, categories, preferences } = useStore();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(preferences.baseCurrency);
  const [kind, setKind] = useState<SubscriptionKind>('personal');
  const [billingDay, setBillingDay] = useState('1');
  const [billingMonth, setBillingMonth] = useState('1');
  const [walletId, setWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [autoCharge, setAutoCharge] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editingSubscription) {
      setName(editingSubscription.name);
      setAmount(editingSubscription.amount.toString());
      setCurrency(editingSubscription.currency);
      setKind(editingSubscription.kind);
      setBillingDay(editingSubscription.billingDay.toString());
      setBillingMonth((editingSubscription.billingMonth || 1).toString());
      setWalletId(editingSubscription.walletId);
      setCategoryId(editingSubscription.categoryId);
      setAutoCharge(editingSubscription.autoCharge);
    } else {
      setName('');
      setAmount('');
      setCurrency(preferences.baseCurrency);
      setKind('personal');
      setBillingDay('1');
      setBillingMonth('1');
      setWalletId(wallets[0]?.id || '');
      setCategoryId(categories[0]?.id || '');
      setAutoCharge(false);
    }
  }, [isOpen, editingSubscription, preferences.baseCurrency, wallets, categories]);

  const handleSave = () => {
    const numAmount = parseFloat(amount);
    const day = parseInt(billingDay, 10);
    if (!name.trim() || !numAmount || numAmount <= 0 || !walletId || !categoryId) return;
    if (!day || day < 1 || day > 31) return;

    const data = {
      name: name.trim(),
      amount: numAmount,
      currency,
      kind,
      billingDay: day,
      billingMonth: kind === 'yearly' ? parseInt(billingMonth, 10) : undefined,
      walletId,
      categoryId,
      autoCharge,
    };

    if (editingSubscription) {
      updateSubscription(editingSubscription.id, data);
    } else {
      addSubscription({ id: generateUUID(), ...data });
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[160] flex flex-col items-center justify-end bg-black/80 backdrop-blur-sm px-4 pb-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className="bg-[#0d1117] w-full max-w-xl max-h-[95vh] rounded-[40px] p-8 flex flex-col gap-6 border border-white/10 shadow-2xl overflow-y-auto hide-scrollbar"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-black uppercase tracking-widest text-white/40">
                {editingSubscription ? 'Изменить подписку' : 'Новая подписка'}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/40">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-6">
              {/* Kind selector: обычная / рабочая / годовая */}
              <div className="flex bg-white/5 p-1 rounded-2xl">
                {KIND_ORDER.map(k => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={cn(
                      'flex-1 py-3 text-center text-xs font-bold rounded-xl transition-colors',
                      kind === k ? 'text-white' : 'text-white/50 hover:text-white'
                    )}
                    style={kind === k ? { background: KIND_META[k].color } : {}}
                  >
                    {KIND_META[k].label}
                  </button>
                ))}
              </div>

              <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-black uppercase text-white/20 tracking-widest">Название</label>
                  <input
                    className="bg-transparent text-xl font-black text-white outline-none placeholder-white/5"
                    placeholder="Например, Netflix"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="h-px bg-white/5 mx-[-24px]" />

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black uppercase text-white/20 tracking-widest">Сумма</label>
                    <input
                      type="number"
                      className="bg-transparent text-lg font-black text-white outline-none w-full"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2 border-l border-white/5 pl-4">
                    <label className="text-[9px] font-black uppercase text-white/20 tracking-widest">Валюта</label>
                    <select
                      className="bg-transparent text-lg font-black text-white outline-none appearance-none"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      {COMMON_CURRENCIES.map(c => (
                        <option key={c} value={c} className="bg-[#0d1117]">{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="h-px bg-white/5 mx-[-24px]" />

                <div className={cn('grid gap-4', kind === 'yearly' ? 'grid-cols-2' : 'grid-cols-1')}>
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black uppercase text-white/20 tracking-widest">Число месяца</label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      className="bg-transparent text-lg font-black text-white outline-none w-full"
                      value={billingDay}
                      onChange={(e) => setBillingDay(e.target.value)}
                    />
                  </div>
                  {kind === 'yearly' && (
                    <div className="flex flex-col gap-2 border-l border-white/5 pl-4">
                      <label className="text-[9px] font-black uppercase text-white/20 tracking-widest">Месяц</label>
                      <select
                        className="bg-transparent text-lg font-black text-white outline-none appearance-none"
                        value={billingMonth}
                        onChange={(e) => setBillingMonth(e.target.value)}
                      >
                        {MONTH_NAMES.map((m, idx) => (
                          <option key={m} value={idx + 1} className="bg-[#0d1117]">{m}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {wallets.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-black uppercase text-white/20 tracking-widest px-1">Счёт списания</label>
                  <select
                    className="bg-white/5 p-4 rounded-2xl text-white font-bold border border-white/5 outline-none"
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                  >
                    {wallets.map(w => (
                      <option key={w.id} value={w.id} className="bg-[#0d1117]">{w.icon} {w.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {categories.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-black uppercase text-white/20 tracking-widest px-1">Категория</label>
                  <select
                    className="bg-white/5 p-4 rounded-2xl text-white font-bold border border-white/5 outline-none"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id} className="bg-[#0d1117]">
                        {c.parentId ? `— ${c.name}` : c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Auto-charge toggle */}
              <div
                onClick={() => setAutoCharge(!autoCharge)}
                className={cn(
                  'p-6 rounded-[32px] border-2 transition-all cursor-pointer flex items-center justify-between',
                  autoCharge
                    ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
                    : 'bg-white/5 border-transparent hover:bg-white/10'
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all',
                    autoCharge ? 'bg-emerald-500 text-white rotate-12 scale-110' : 'bg-white/5 text-white/20'
                  )}>
                    ⚡
                  </div>
                  <div className="flex flex-col">
                    <span className={cn('text-base font-black transition-colors', autoCharge ? 'text-emerald-500' : 'text-white/60')}>
                      Автоматическое списание
                    </span>
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest leading-none mt-1">
                      В день списания сумма спишется со счёта сама
                    </span>
                  </div>
                </div>
                <div className={cn('w-14 h-8 rounded-full p-1 transition-all', autoCharge ? 'bg-emerald-500' : 'bg-white/10')}>
                  <motion.div animate={{ x: autoCharge ? 24 : 0 }} className="w-6 h-6 bg-white rounded-full shadow-lg" />
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={!name.trim() || !amount || !walletId || !categoryId}
              className="mt-2 min-h-[72px] bg-white text-black text-lg font-black rounded-3xl active:scale-95 transition-all disabled:opacity-20 flex items-center justify-center gap-3"
            >
              <Check size={28} strokeWidth={4} />
              {editingSubscription ? 'СОХРАНИТЬ' : 'ДОБАВИТЬ ПОДПИСКУ'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
