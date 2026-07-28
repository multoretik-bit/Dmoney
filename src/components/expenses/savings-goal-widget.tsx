'use client';

import { useState } from 'react';
import { useStore, currentMonthKey, SavingsGoalCategory, LongTermGoal, Wallet } from '@/store/useStore';
import { Plus, Check, Target, Trash2, WalletCards, X } from 'lucide-react';
import { COMMON_CURRENCIES } from '@/lib/currencies';
import { generateUUID } from '@/lib/uuid';

const CATEGORIES: { key: SavingsGoalCategory; label: string; icon: string; color: string }[] = [
  { key: 'work', label: 'В работу', icon: '💼', color: '#f59e0b' },
  { key: 'savings', label: 'Откладывать', icon: '💰', color: '#60a5fa' },
  { key: 'invest', label: 'Инвестировать', icon: '📈', color: '#8b5cf6' },
];

function SavingsGoalRow({ category, label, icon, color }: { category: SavingsGoalCategory; label: string; icon: string; color: string }) {
  const { preferences, setSavingsGoalTarget, addSavingsProgress } = useStore();
  const { baseCurrency } = preferences;
  const month = currentMonthKey();
  const goal = preferences.savingsGoals?.[category]?.month === month ? preferences.savingsGoals?.[category] : null;

  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState('');

  const target = goal?.target || 0;
  const saved = goal?.saved || 0;
  const pct = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
  const isComplete = target > 0 && saved >= target;

  const handleSetTarget = () => {
    const val = parseFloat(targetInput);
    if (!isNaN(val) && val > 0) setSavingsGoalTarget(category, val);
    setIsEditingTarget(false);
    setTargetInput('');
  };

  const handleAdd = () => {
    const val = prompt(`Сколько отложили «${label.toLowerCase()}» в этот раз?`, '');
    if (val === null) return;
    const amount = parseFloat(val);
    if (!isNaN(amount) && amount !== 0) addSavingsProgress(category, amount);
  };

  if (!goal || target <= 0) {
    return (
      <div className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-dashed border-white/10" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2" style={{ color }}>
          <span className="text-base">{icon}</span> {label}
        </span>
        {isEditingTarget ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="number"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSetTarget()}
              placeholder="Сумма"
              className="bg-black/30 px-3 py-2 rounded-xl text-white font-bold border border-white/10 outline-none w-24 text-center"
            />
            <button onClick={handleSetTarget} className="px-3 py-2 bg-white text-black rounded-xl font-black text-[10px] uppercase">
              OK
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditingTarget(true)}
            className="px-4 py-2 bg-accent/20 text-accent rounded-xl font-black text-[9px] uppercase tracking-widest flex-shrink-0"
          >
            Установить цель
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="p-4 rounded-2xl flex flex-col gap-3 transition-colors duration-500"
      style={{
        background: isComplete ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isComplete ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5" style={{ color }}>
            <span className="text-sm">{icon}</span> {label}
          </span>
          <span className="text-base font-black text-white tabular-nums truncate">
            {saved.toFixed(0)} <span className="text-white/30 font-bold text-xs">/ {target.toFixed(0)} {baseCurrency}</span>
          </span>
        </div>
        <button
          onClick={handleAdd}
          className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-90 flex-shrink-0"
          title="Добавить сумму"
        >
          <Plus size={16} strokeWidth={3} />
        </button>
      </div>

      <div className="h-2 rounded-full bg-black/40 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: isComplete ? 'linear-gradient(90deg, #10b981, #34d399)' : `linear-gradient(90deg, ${color}, ${color}aa)`,
            boxShadow: isComplete ? '0 0 10px rgba(16,185,129,0.6)' : `0 0 10px ${color}66`,
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        {isComplete ? (
          <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-400">
            <Check size={11} strokeWidth={3} /> Выполнено!
          </span>
        ) : (
          <span className="text-[9px] font-black uppercase tracking-widest text-white/30">{Math.round(pct)}% из 100%</span>
        )}
        <button
          onClick={() => { setIsEditingTarget(true); setTargetInput(target.toString()); }}
          className="text-[8px] font-bold text-white/20 hover:text-white/50 uppercase tracking-widest"
        >
          Изменить цель
        </button>
      </div>

      {isEditingTarget && (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            type="number"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSetTarget()}
            className="bg-black/30 px-3 py-2 rounded-xl text-white font-bold border border-white/10 outline-none flex-1 text-center"
          />
          <button onClick={handleSetTarget} className="px-3 py-2 bg-white text-black rounded-xl font-black text-[10px] uppercase">
            OK
          </button>
        </div>
      )}
    </div>
  );
}

function WalletGoalRow({ wallet }: { wallet: Wallet }) {
  const target = Number(wallet.targetAmount || 0);
  const balance = Number(wallet.balance || 0);
  const remaining = Math.max(0, target - balance);
  const pct = target > 0 ? Math.min(100, (balance / target) * 100) : 0;
  const color = wallet.color || '#60a5fa';

  return (
    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ color, background: `${color}18` }}>
          <WalletCards size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-white/85 truncate">{wallet.name}</p>
          <p className="text-[10px] font-bold text-white/35 mt-0.5">
            {remaining > 0
              ? `Осталось положить ${remaining.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} ${wallet.currency}`
              : 'Цель достигнута'}
          </p>
        </div>
        <span className="text-xs font-black text-white/70 tabular-nums">
          {balance.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}
          <span className="text-white/25"> / {target.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-black/40 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}aa)` }}
        />
      </div>
    </div>
  );
}

function LongTermGoalRow({ goal }: { goal: LongTermGoal }) {
  const { updateLongTermGoal, deleteLongTermGoal } = useStore();
  const remaining = Math.max(0, goal.target - goal.saved);
  const pct = goal.target > 0 ? Math.min(100, (goal.saved / goal.target) * 100) : 0;
  const isComplete = goal.saved >= goal.target;

  const addProgress = () => {
    const value = prompt(`Сколько добавить к цели «${goal.name}»?`, '');
    if (value === null) return;
    const amount = Number(value.replace(',', '.'));
    if (Number.isFinite(amount) && amount !== 0) {
      updateLongTermGoal(goal.id, { saved: Math.max(0, goal.saved + amount) });
    }
  };

  return (
    <div
      className="p-4 rounded-2xl flex flex-col gap-3 group"
      style={{
        background: isComplete ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isComplete ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ color: goal.color, background: `${goal.color}18` }}>
          <Target size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-white/85 truncate">{goal.name}</p>
          <p className="text-[10px] font-bold text-white/35 mt-0.5">
            {isComplete
              ? 'Цель достигнута'
              : `Осталось накопить ${remaining.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} ${goal.currency}`}
          </p>
        </div>
        <button
          onClick={addProgress}
          className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-90 flex-shrink-0"
          title="Добавить накопления"
        >
          <Plus size={16} strokeWidth={3} />
        </button>
        <button
          onClick={() => deleteLongTermGoal(goal.id)}
          className="p-2 text-white/20 hover:text-rose-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
          title="Удалить цель"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div className="h-2 rounded-full bg-black/40 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: isComplete ? 'linear-gradient(90deg, #10b981, #34d399)' : `linear-gradient(90deg, ${goal.color}, ${goal.color}aa)`,
          }}
        />
      </div>
      <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
        <span className={isComplete ? 'text-emerald-400' : 'text-white/30'}>{Math.round(pct)}%</span>
        <span className="text-white/45 tabular-nums">
          {goal.saved.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} / {goal.target.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} {goal.currency}
        </span>
      </div>
    </div>
  );
}

export function SavingsGoalWidget() {
  const { wallets, preferences, addLongTermGoal } = useStore();
  const walletGoals = wallets.filter(wallet => Number(wallet.targetAmount || 0) > 0);
  const longTermGoals = preferences.longTermGoals || [];
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [currency, setCurrency] = useState(preferences.baseCurrency);
  const [color, setColor] = useState('#8b5cf6');

  const resetForm = () => {
    setName('');
    setTarget('');
    setCurrency(preferences.baseCurrency);
    setColor('#8b5cf6');
    setIsAdding(false);
  };

  const createGoal = () => {
    const numericTarget = Number(target.replace(',', '.'));
    if (!name.trim() || !Number.isFinite(numericTarget) || numericTarget <= 0) return;
    addLongTermGoal({
      id: generateUUID(),
      name: name.trim(),
      target: numericTarget,
      saved: 0,
      currency,
      color,
    });
    resetForm();
  };

  return (
    <div
      className="p-6 rounded-[32px] flex flex-col gap-4"
      style={{
        background: 'linear-gradient(160deg, #101a30 0%, #080d18 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 px-1">Откладывание в этом месяце</span>
      <div className="flex flex-col gap-3">
        {CATEGORIES.map(c => (
          <SavingsGoalRow key={c.key} category={c.key} label={c.label} icon={c.icon} color={c.color} />
        ))}
      </div>

      {walletGoals.length > 0 && (
        <>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 px-1 mt-2">Цели на счетах</span>
          <div className="flex flex-col gap-3">
            {walletGoals.map(wallet => <WalletGoalRow key={wallet.id} wallet={wallet} />)}
          </div>
        </>
      )}

      <div className="flex items-center justify-between gap-3 mt-2 px-1">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Бессрочные цели</span>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="w-8 h-8 rounded-xl bg-violet-400/10 hover:bg-violet-400/20 text-violet-300 flex items-center justify-center transition-colors"
            title="Создать цель"
          >
            <Plus size={15} strokeWidth={3} />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {longTermGoals.map(goal => <LongTermGoalRow key={goal.id} goal={goal} />)}
        {longTermGoals.length === 0 && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="p-4 rounded-2xl border border-dashed border-violet-300/15 text-xs font-bold text-white/30 hover:text-violet-200 hover:bg-violet-400/5 transition-all"
          >
            <Plus size={15} className="inline mr-2" />
            Создать цель без срока
          </button>
        )}
      </div>

      {isAdding && (
        <div className="p-4 rounded-2xl bg-white/[0.035] border border-violet-300/15 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-white">Новая бессрочная цель</p>
            <button onClick={resetForm} className="p-1.5 text-white/30 hover:text-white"><X size={15} /></button>
          </div>
          <input
            autoFocus
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder="Например, новая машина"
            className="bg-black/30 p-3 rounded-xl text-white font-bold border border-white/10 outline-none"
          />
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              value={target}
              onChange={event => setTarget(event.target.value)}
              onKeyDown={event => event.key === 'Enter' && createGoal()}
              placeholder="Нужно накопить"
              className="flex-1 min-w-0 bg-black/30 p-3 rounded-xl text-white font-bold border border-white/10 outline-none"
            />
            <select
              value={currency}
              onChange={event => setCurrency(event.target.value)}
              className="bg-black/30 p-3 rounded-xl text-white font-bold border border-white/10 outline-none"
            >
              {COMMON_CURRENCIES.map(item => <option key={item} value={item} className="bg-[#101a30]">{item}</option>)}
            </select>
            <input
              type="color"
              value={color}
              onChange={event => setColor(event.target.value)}
              aria-label="Цвет цели"
              className="w-12 h-12 p-1.5 rounded-xl bg-black/30 border border-white/10"
            />
          </div>
          <button
            onClick={createGoal}
            disabled={!name.trim() || !target}
            className="py-3 rounded-xl bg-violet-500 hover:bg-violet-400 disabled:opacity-30 text-white font-black text-xs transition-colors"
          >
            Создать цель
          </button>
        </div>
      )}
    </div>
  );
}
