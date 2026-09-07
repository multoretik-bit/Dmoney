'use client';

import { useRef, useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Target, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { convertAmount } from '@/lib/exchange';

const money = (amount: number, currency: string) => `${amount.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} ${currency}`;

export function CapitalGoalButton({ currency }: { currency: string }) {
  const { preferences, updatePreferences } = useStore();
  const goal = preferences.capitalGoal;
  const dialog = useRef<HTMLDialogElement>(null);
  const [amount, setAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [goalCurrency, setGoalCurrency] = useState(currency);
  const [error, setError] = useState('');
  const today = format(new Date(), 'yyyy-MM-dd');

  function open() {
    setAmount(goal ? String(goal.target) : '');
    setDeadline(goal?.deadline || '');
    setGoalCurrency(goal?.currency || currency);
    setError('');
    dialog.current?.showModal();
  }

  return <>
    <button type="button" onClick={open} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-[11px] font-bold text-blue-100 hover:bg-white/20 transition-colors">
      <Target size={15} />{goal ? 'Изменить цель' : 'Цель капитала'}
    </button>
    <dialog ref={dialog} aria-labelledby="capital-goal-title" className="w-[calc(100%-2rem)] max-w-md rounded-3xl border border-white/10 bg-[#101d36] p-6 text-white shadow-2xl backdrop:bg-black/70" onClick={event => { if (event.target === dialog.current) dialog.current?.close(); }}>
      <form className="space-y-5" onSubmit={event => {
        event.preventDefault();
        const target = Number(amount.replace(/\s/g, '').replace(',', '.'));
        const date = new Date(`${deadline}T00:00:00`);
        if (!Number.isFinite(target) || target <= 0) { setError('Введите сумму больше нуля.'); return; }
        if (!deadline || !Number.isFinite(date.getTime()) || format(date, 'yyyy-MM-dd') !== deadline || deadline < today) { setError('Выберите сегодняшний день или будущую дату.'); return; }
        updatePreferences({ capitalGoal: { target, currency: goalCurrency, deadline } });
        dialog.current?.close();
      }}>
        <div className="flex items-center justify-between gap-3">
          <h2 id="capital-goal-title" className="text-lg font-black">Цель капитала</h2>
          <button type="button" aria-label="Закрыть" onClick={() => dialog.current?.close()} className="p-2 rounded-xl hover:bg-white/10"><X size={18} /></button>
        </div>
        <label className="block text-sm text-blue-100/80">
          Сумма цели, {goalCurrency}
          <input autoFocus required inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} placeholder="Например, 3 000 000" className="mt-2 block w-full rounded-xl border border-white/15 bg-black/20 p-3 text-white outline-none focus:border-blue-300" />
        </label>
        <label className="block text-sm text-blue-100/80">
          Достичь к
          <input required type="date" min={today} value={deadline} onChange={event => setDeadline(event.target.value)} className="mt-2 block w-full min-w-0 rounded-xl border border-white/15 bg-black/20 p-3 text-white outline-none focus:border-blue-300 [color-scheme:dark]" />
        </label>
        <p className="text-xs text-blue-100/50">Прогресс обновляется автоматически по общему капиталу.</p>
        {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="flex-1 rounded-xl bg-blue-500 px-4 py-3 text-sm font-bold hover:bg-blue-400">{goal ? 'Сохранить' : 'Создать цель'}</button>
          {goal && <button type="button" onClick={() => { updatePreferences({ capitalGoal: null }); dialog.current?.close(); }} className="rounded-xl px-4 py-3 text-sm text-rose-300 hover:bg-white/5">Удалить цель</button>}
        </div>
      </form>
    </dialog>
  </>;
}

export function CapitalGoalProgress({ totalCapital, currency }: { totalCapital: number; currency: string }) {
  const goal = useStore(state => state.preferences.capitalGoal);
  if (!goal || !Number.isFinite(goal.target) || goal.target <= 0) return null;
  const target = convertAmount(goal.target, goal.currency, currency);
  if (!Number.isFinite(target) || target <= 0 || !Number.isFinite(totalCapital)) return null;
  const remaining = Math.max(0, target - totalCapital);
  const percent = Math.min(100, Math.max(0, totalCapital / target * 100));
  const reached = totalCapital >= target;
  const date = new Date(`${goal.deadline}T00:00:00`);
  const dateLabel = Number.isFinite(date.getTime()) ? format(date, 'd MMM yyyy', { locale: ru }) : goal.deadline;
  const overdue = goal.deadline < format(new Date(), 'yyyy-MM-dd') && !reached;

  return <div className="mt-5 border-t border-white/10 pt-4 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
      <span className="font-bold text-blue-100">Цель: {money(target, currency)}</span>
      <span className={overdue ? 'text-amber-200' : 'text-blue-100/60'}>{overdue ? 'Срок прошёл · ' : 'К '}{dateLabel}</span>
    </div>
    <div role="progressbar" aria-label="Прогресс цели капитала" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-valuetext={`${percent.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%`} className="h-3 overflow-hidden rounded-full bg-black/25">
      <div className="h-full rounded-full bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-300 transition-[width] duration-700 motion-reduce:transition-none" style={{ width: `${percent}%` }} />
    </div>
    <div className="flex flex-wrap justify-between gap-2 text-xs">
      <span className="text-blue-100/75">Достигнуто {percent.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}% · {money(Math.max(0, totalCapital), currency)}</span>
      <span className="font-bold text-emerald-200">{reached ? 'Цель достигнута!' : `Осталось ${money(remaining, currency)}`}</span>
    </div>
  </div>;
}

