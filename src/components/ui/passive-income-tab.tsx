'use client';

import { useState } from 'react';
import { useStore, PassiveIncomeSource } from '@/store/useStore';
import { convertAmount } from '@/lib/exchange';
import { generateUUID } from '@/lib/uuid';
import { COMMON_CURRENCIES } from '@/lib/currencies';
import { Plus, Trash2, Edit2, Check, Sprout } from 'lucide-react';

export function PassiveIncomeTab({
  selectedCurrency,
  compact = false,
}: {
  selectedCurrency: string;
  compact?: boolean;
}) {
  const { passiveIncomeSources, addPassiveIncomeSource, updatePassiveIncomeSource, deletePassiveIncomeSource } = useStore();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(selectedCurrency);

  const total = passiveIncomeSources.reduce(
    (sum, s) => sum + convertAmount(s.amount, s.currency, selectedCurrency),
    0
  );

  const resetForm = () => {
    setName('');
    setAmount('');
    setCurrency(selectedCurrency);
    setIsAdding(false);
    setEditingId(null);
  };

  const startEdit = (s: PassiveIncomeSource) => {
    setEditingId(s.id);
    setName(s.name);
    setAmount(s.amount.toString());
    setCurrency(s.currency);
    setIsAdding(true);
  };

  const handleSave = () => {
    const numAmount = parseFloat(amount);
    if (!name.trim() || !numAmount || numAmount <= 0) return;

    if (editingId) {
      updatePassiveIncomeSource(editingId, { name: name.trim(), amount: numAmount, currency });
    } else {
      addPassiveIncomeSource({ id: generateUUID(), name: name.trim(), amount: numAmount, currency });
    }
    resetForm();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Hero total */}
      {!compact && <div className="flex flex-col items-center text-center gap-1.5 p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400/70">Сумма пассивно в месяц</span>
        <span className="text-3xl font-black text-emerald-400 tabular-nums">
          {total.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} {selectedCurrency}
        </span>
      </div>}

      {/* List of sources */}
      <div className="flex flex-col gap-2.5">
        {passiveIncomeSources.length === 0 && !isAdding && (
          <div className="text-center py-8 text-white/40 text-sm">
            Пока нет источников пассивного дохода
          </div>
        )}
        {passiveIncomeSources.map(s => (
          <div
            key={s.id}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.025] border border-white/[0.055] group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Sprout size={18} />
              </div>
              <span className="text-sm font-bold text-white/85 truncate">{s.name}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="font-black text-white text-sm tabular-nums">
                {s.amount.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} {s.currency}
              </span>
              <button
                onClick={() => startEdit(s)}
                className="p-1.5 text-white/20 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => deletePassiveIncomeSource(s.id)}
                className="p-1.5 text-white/20 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit form */}
      {isAdding ? (
        <div className="p-4 rounded-2xl bg-white/[0.035] border border-white/10 flex flex-col gap-3">
          <input
            autoFocus
            placeholder="Например, Аренда квартиры"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-black/30 p-3 rounded-xl text-white font-bold border border-white/10 outline-none"
          />
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Сумма в месяц"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="flex-1 min-w-0 bg-black/30 p-3 rounded-xl text-white font-bold border border-white/10 outline-none"
            />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-black/30 p-3 rounded-xl text-white font-bold border border-white/10 outline-none"
            >
              {COMMON_CURRENCIES.map(c => (
                <option key={c} value={c} className="bg-[#172554]">{c}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={resetForm}
              className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 font-bold text-sm transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || !amount}
              className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-30"
            >
              <Check size={16} /> Сохранить
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="p-3.5 rounded-2xl border border-dashed border-emerald-400/20 text-emerald-300/60 hover:text-emerald-300 hover:bg-emerald-400/5 font-bold text-xs flex items-center justify-center gap-2 transition-all"
        >
          <Plus size={16} /> Добавить источник дохода
        </button>
      )}
    </div>
  );
}
