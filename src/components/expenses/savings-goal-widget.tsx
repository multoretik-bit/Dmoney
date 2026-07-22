'use client';

import { useState } from 'react';
import { useStore, currentMonthKey } from '@/store/useStore';
import { Plus, PiggyBank, Check } from 'lucide-react';

export function SavingsGoalWidget() {
  const { preferences, setSavingsGoalTarget, addSavingsProgress } = useStore();
  const { baseCurrency } = preferences;
  const month = currentMonthKey();
  const goal = preferences.savingsGoal?.month === month ? preferences.savingsGoal : null;

  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState('');

  const target = goal?.target || 0;
  const saved = goal?.saved || 0;
  const pct = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
  const isComplete = target > 0 && saved >= target;

  const handleSetTarget = () => {
    const val = parseFloat(targetInput);
    if (!isNaN(val) && val > 0) setSavingsGoalTarget(val);
    setIsEditingTarget(false);
    setTargetInput('');
  };

  const handleAdd = () => {
    const val = prompt('Сколько отложили в этот раз?', '');
    if (val === null) return;
    const amount = parseFloat(val);
    if (!isNaN(amount) && amount !== 0) addSavingsProgress(amount);
  };

  if (!goal || target <= 0) {
    return (
      <div className="p-6 rounded-[32px] border border-dashed border-white/10 flex flex-col items-center gap-3 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <PiggyBank size={26} className="text-white/20" />
        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Нет цели накоплений на этот месяц</p>
        {isEditingTarget ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="number"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSetTarget()}
              placeholder="Сумма"
              className="bg-black/30 px-4 py-2.5 rounded-xl text-white font-bold border border-white/10 outline-none w-32 text-center"
            />
            <button onClick={handleSetTarget} className="px-4 py-2.5 bg-white text-black rounded-xl font-black text-xs uppercase">
              OK
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditingTarget(true)}
            className="px-5 py-2.5 bg-accent/20 text-accent rounded-xl font-black text-[10px] uppercase tracking-widest"
          >
            Установить цель
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="p-6 rounded-[32px] flex flex-col gap-4 relative overflow-hidden transition-colors duration-500"
      style={{
        background: isComplete ? 'linear-gradient(160deg, rgba(16,185,129,0.16), rgba(8,13,24,0.92))' : 'linear-gradient(160deg, #101a30 0%, #080d18 100%)',
        border: `1px solid ${isComplete ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Откладывание в этом месяце</span>
          <span className="text-xl font-black text-white tabular-nums truncate">
            {saved.toFixed(0)} <span className="text-white/30 font-bold">/ {target.toFixed(0)} {baseCurrency}</span>
          </span>
        </div>
        <button
          onClick={handleAdd}
          className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-90 flex-shrink-0"
          title="Добавить сумму"
        >
          <Plus size={20} strokeWidth={3} />
        </button>
      </div>

      <div className="h-3 rounded-full bg-black/40 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: isComplete ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #60a5fa, #a78bfa)',
            boxShadow: isComplete ? '0 0 12px rgba(16,185,129,0.6)' : '0 0 12px rgba(96,165,250,0.4)',
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        {isComplete ? (
          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            <Check size={12} strokeWidth={3} /> Цель выполнена!
          </span>
        ) : (
          <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{Math.round(pct)}% из 100%</span>
        )}
        <button
          onClick={() => { setIsEditingTarget(true); setTargetInput(target.toString()); }}
          className="text-[9px] font-bold text-white/20 hover:text-white/50 uppercase tracking-widest"
        >
          Изменить цель
        </button>
      </div>

      {isEditingTarget && (
        <div className="flex items-center gap-2 mt-1">
          <input
            autoFocus
            type="number"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSetTarget()}
            className="bg-black/30 px-4 py-2.5 rounded-xl text-white font-bold border border-white/10 outline-none flex-1 text-center"
          />
          <button onClick={handleSetTarget} className="px-4 py-2.5 bg-white text-black rounded-xl font-black text-xs uppercase">
            OK
          </button>
        </div>
      )}
    </div>
  );
}
