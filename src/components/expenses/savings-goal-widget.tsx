'use client';

import { useState } from 'react';
import { useStore, currentMonthKey, SavingsGoalCategory } from '@/store/useStore';
import { Plus, Check } from 'lucide-react';

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

export function SavingsGoalWidget() {
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
    </div>
  );
}
