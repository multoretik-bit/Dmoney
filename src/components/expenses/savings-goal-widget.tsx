'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore, currentMonthKey, SavingsGoalCategory, LongTermGoal, Wallet } from '@/store/useStore';
import { Award, ChevronDown, Check, ImagePlus, Medal, Plus, Target, Trash2, WalletCards, X } from 'lucide-react';
import { COMMON_CURRENCIES } from '@/lib/currencies';
import { generateUUID } from '@/lib/uuid';
import { convertAmount } from '@/lib/exchange';

const CATEGORIES: { key: SavingsGoalCategory; label: string; icon: string; color: string }[] = [
  { key: 'savings', label: 'Отложить', icon: '💰', color: '#60a5fa' },
];

function resizeRewardImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Не удалось прочитать изображение'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Не удалось обработать изображение'));
      image.onload = () => {
        const maxSize = 360;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        if (!context) return reject(new Error('Не удалось обработать изображение'));
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.76));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function SavingsGoalRow({ category, label, icon, color, displayCurrency }: { category: SavingsGoalCategory; label: string; icon: string; color: string; displayCurrency: string }) {
  const { preferences, setSavingsGoalTarget, addSavingsProgress, pendingSavings, user } = useStore();
  const [today, setToday] = useState(() => new Date());
  const [mode, setMode] = useState<'target' | 'deposit' | null>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const refresh = () => setToday(new Date());
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const goal = preferences.savingsGoals?.[category];
  const target = goal?.month === month ? goal.target : 0;
  const saved = goal?.month === month ? goal.saved : 0;
  const remaining = Math.max(0, target - saved);
  const deadline = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const days = deadline.getDate() - today.getDate() + 1;
  const pct = target > 0 ? Math.max(0, Math.min(100, saved / target * 100)) : 0;
  const isComplete = target > 0 && remaining === 0;
  const format = (amount: number) => convertAmount(amount, preferences.baseCurrency, displayCurrency).toLocaleString('ru-RU', { maximumFractionDigits: 2 });
  const daily = Math.ceil(convertAmount(remaining, preferences.baseCurrency, displayCurrency) / days * 100) / 100;
  const dayLabel = days % 10 === 1 && days % 100 !== 11 ? 'день' : days % 10 >= 2 && days % 10 <= 4 && (days % 100 < 12 || days % 100 > 14) ? 'дня' : 'дней';

  const open = (nextMode: 'target' | 'deposit') => {
    setMode(nextMode);
    setInput(nextMode === 'target' && target > 0 ? String(convertAmount(target, preferences.baseCurrency, displayCurrency)) : '');
    setError('');
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(input.replace(/\s/g, '').replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Введите сумму больше нуля');
      return;
    }
    const baseAmount = convertAmount(amount, displayCurrency, preferences.baseCurrency);
    if (mode === 'target') setSavingsGoalTarget(category, baseAmount);
    else if (mode === 'deposit') addSavingsProgress(category, baseAmount);
    setMode(null);
    setInput('');
    setError('');
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl flex flex-col gap-4 border" style={{ background: isComplete ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)', borderColor: isComplete ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)' }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2" style={{ color }}><span className="text-xl">{icon}</span>{label}</span>
        <button onClick={() => open(target > 0 ? 'deposit' : 'target')} className="px-4 py-2.5 rounded-xl bg-accent/20 text-accent text-xs font-black hover:bg-accent/30 transition-colors">
          {target > 0 ? 'Отложить сумму' : 'Выбрать сумму'}
        </button>
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-2xl font-black text-white tabular-nums">{format(saved)} <span className="text-xs text-white/40">/ {format(target)} {displayCurrency}</span></p>
        <span className="text-xs font-bold text-white/50 tabular-nums">{Math.round(pct)}%</span>
      </div>
      <div role="progressbar" aria-label="Наполнение месячной копилки" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-4 rounded-full bg-black/40 overflow-hidden border border-white/5">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: isComplete ? 'linear-gradient(90deg, #10b981, #34d399)' : `linear-gradient(90deg, ${color}, #93c5fd)`, boxShadow: `0 0 16px ${color}55` }} />
      </div>
      {target > 0 ? (
        <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3">
          <div className="rounded-xl bg-black/20 p-3">
            <p className="text-[10px] font-bold text-white/40">Примерно в день</p>
            <p className="mt-1 text-lg font-black text-blue-300 tabular-nums">{daily.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} {displayCurrency}</p>
          </div>
          <div className="rounded-xl bg-black/20 p-3">
            <p className="text-[10px] font-bold text-white/40">Осталось накопить</p>
            <p className="mt-1 text-lg font-black text-white tabular-nums">{format(remaining)} {displayCurrency}</p>
          </div>
        </div>
      ) : <p className="text-xs text-white/45">Выберите, сколько хотите накопить до конца месяца, и пополняйте копилку.</p>}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className={isComplete ? 'text-emerald-400 font-bold' : 'text-white/50'}>
          {isComplete ? <><Check size={13} className="inline mr-1" />Копилка наполнена!</> : `${days} ${dayLabel}, включая сегодня · до ${deadline.toLocaleDateString('ru-RU')}`}
        </span>
        {target > 0 && <button onClick={() => open('target')} className="text-white/40 hover:text-white">Изменить цель</button>}
      </div>
      {target > 0 && <p role="status" className="text-[10px] text-white/35">
        {!user ? 'Сохранено на устройстве · войдите в аккаунт для синхронизации' : pendingSavings ? 'Сохранено на устройстве · ожидает сохранения в облаке' : 'Сохранено в облаке'}
      </p>}
      {mode && (
        <form onSubmit={submit} className="flex flex-col gap-2 border-t border-white/10 pt-3">
          <label htmlFor="monthly-savings-amount" className="text-xs font-bold text-white/65">{mode === 'target' ? 'Цель на этот месяц' : 'Сколько отложить'} ({displayCurrency})</label>
          <div className="flex flex-wrap gap-2">
            <input id="monthly-savings-amount" autoFocus inputMode="decimal" value={input} onChange={event => { setInput(event.target.value); setError(''); }} placeholder="Сумма" aria-invalid={!!error} aria-describedby={error ? 'monthly-savings-error' : undefined} className="min-w-0 flex-1 w-24 bg-black/30 px-3 py-2 rounded-xl text-white font-bold border border-white/10 outline-none focus:border-blue-400" />
            <button type="submit" className="px-3 py-2 bg-accent text-white rounded-xl text-xs font-bold">{mode === 'target' ? 'Сохранить' : 'Добавить'}</button>
            <button type="button" onClick={() => setMode(null)} aria-label="Отмена" className="p-2 text-white/50 hover:text-white"><X size={18} /></button>
          </div>
          {error && <p id="monthly-savings-error" role="alert" className="text-xs text-rose-400">{error}</p>}
        </form>
      )}
    </div>
  );
}

function WalletGoalRow({ wallet, displayCurrency }: { wallet: Wallet; displayCurrency: string }) {
  const target = Number(wallet.targetAmount || 0);
  const balance = Number(wallet.balance || 0);
  const remaining = Math.max(0, target - balance);
  const displayedTarget = convertAmount(target, wallet.currency, displayCurrency);
  const displayedBalance = convertAmount(balance, wallet.currency, displayCurrency);
  const displayedRemaining = convertAmount(remaining, wallet.currency, displayCurrency);
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
              ? `Осталось положить ${displayedRemaining.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} ${displayCurrency}`
              : 'Цель достигнута'}
          </p>
        </div>
        <span className="text-xs font-black text-white/70 tabular-nums">
          {displayedBalance.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}
          <span className="text-white/25"> / {displayedTarget.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} {displayCurrency}</span>
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

function LongTermGoalRow({ goal, displayCurrency }: { goal: LongTermGoal; displayCurrency: string }) {
  const { updateLongTermGoal, deleteLongTermGoal } = useStore();
  const remaining = Math.max(0, goal.target - goal.saved);
  const displayedTarget = convertAmount(goal.target, goal.currency, displayCurrency);
  const displayedSaved = convertAmount(goal.saved, goal.currency, displayCurrency);
  const displayedRemaining = convertAmount(remaining, goal.currency, displayCurrency);
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
              : `Осталось накопить ${displayedRemaining.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} ${displayCurrency}`}
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
          {displayedSaved.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} / {displayedTarget.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} {displayCurrency}
        </span>
      </div>
    </div>
  );
}

function RewardsCollection() {
  const rewards = useStore(state => state.preferences.goalRewards || []);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-[24px] border border-amber-300/15 bg-[linear-gradient(145deg,rgba(245,158,11,0.08),rgba(255,255,255,0.02))] overflow-hidden">
      <button
        onClick={() => setIsExpanded(value => !value)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.025] transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="w-10 h-10 rounded-2xl bg-amber-400/12 text-amber-300 flex items-center justify-center">
          <Award size={19} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-white">Мои награды</p>
          <p className="text-[10px] font-bold text-white/35 mt-0.5">
            {rewards.length > 0 ? `${rewards.length} ${rewards.length === 1 ? 'медаль' : 'медалей'} в коллекции` : 'Здесь появятся медали за выполненные цели'}
          </p>
        </div>
        <ChevronDown size={17} className={`text-white/35 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="border-t border-white/[0.06] p-4">
          {rewards.length === 0 ? (
            <div className="py-7 text-center">
              <Medal size={26} className="mx-auto text-amber-300/30 mb-2" />
              <p className="text-xs font-bold text-white/30">Закройте первую цель, чтобы получить медаль</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {rewards.map(reward => (
                <div key={reward.id} className="flex items-center gap-3 p-3 rounded-2xl bg-black/20 border border-white/[0.06]">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-cover bg-center border border-white/10"
                    style={reward.imageUrl
                      ? { backgroundImage: `url(${reward.imageUrl})` }
                      : { background: `linear-gradient(145deg, ${reward.color}55, ${reward.color}16)`, color: reward.color }}
                  >
                    {!reward.imageUrl && <Medal size={25} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-white/90 leading-snug">{reward.title}</p>
                    <p className="text-[9px] text-white/35 mt-1 line-clamp-2">{reward.description}</p>
                    <p className="text-[8px] font-bold uppercase tracking-wider text-amber-300/55 mt-1.5">
                      {new Date(reward.earnedAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SavingsGoalWidget({ showRewards = false, displayCurrency }: { showRewards?: boolean; displayCurrency?: string }) {
  const { wallets, preferences, addLongTermGoal, addGoalReward } = useStore();
  const resolvedDisplayCurrency = displayCurrency || preferences.baseCurrency;
  const walletGoals = useMemo(
    () => wallets.filter(wallet => Number(wallet.targetAmount || 0) > 0),
    [wallets]
  );
  const longTermGoals = useMemo(
    () => preferences.longTermGoals || [],
    [preferences.longTermGoals]
  );
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [currency, setCurrency] = useState(preferences.baseCurrency);
  const [color, setColor] = useState('#8b5cf6');
  const [rewardName, setRewardName] = useState('');
  const [rewardImageUrl, setRewardImageUrl] = useState<string | undefined>();
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  useEffect(() => {
    const earnedAt = new Date().toISOString();
    const month = currentMonthKey();
    const monthLabelRaw = new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(new Date());
    const monthLabel = monthLabelRaw.charAt(0).toUpperCase() + monthLabelRaw.slice(1);

    CATEGORIES.forEach(meta => {
      const goal = preferences.savingsGoals?.[meta.key];
      if (!goal || goal.month !== month || goal.target <= 0 || goal.saved < goal.target) return;
      const titles: Record<SavingsGoalCategory, string> = {
        work: `Мастер планов — ${monthLabel}`,
        savings: `Накопитель месяца ${monthLabel}`,
        invest: `Инвестор месяца ${monthLabel}`,
      };
      addGoalReward({
        id: `monthly:${meta.key}:${month}`,
        sourceType: 'monthly',
        sourceId: `${meta.key}:${month}`,
        title: titles[meta.key],
        description: `Выполнена ежемесячная цель «${meta.label}»: ${goal.target.toLocaleString('ru-RU')} ${preferences.baseCurrency}`,
        color: meta.color,
        earnedAt,
      });
    });

    longTermGoals.forEach(goal => {
      if (goal.target <= 0 || goal.saved < goal.target) return;
      addGoalReward({
        id: `long-term:${goal.id}`,
        sourceType: 'longTerm',
        sourceId: goal.id,
        title: goal.rewardName || `Цель «${goal.name}» выполнена`,
        description: `Накоплено ${goal.target.toLocaleString('ru-RU')} ${goal.currency}`,
        color: goal.color,
        imageUrl: goal.rewardImageUrl,
        earnedAt,
      });
    });

    walletGoals.forEach(wallet => {
      const target = Number(wallet.targetAmount || 0);
      if (target <= 0 || Number(wallet.balance || 0) < target) return;
      addGoalReward({
        id: `wallet:${wallet.id}:${target}`,
        sourceType: 'wallet',
        sourceId: wallet.id,
        title: `Счёт «${wallet.name}» наполнен`,
        description: `Достигнута цель накопления ${target.toLocaleString('ru-RU')} ${wallet.currency}`,
        color: wallet.color || '#60a5fa',
        earnedAt,
      });
    });
  }, [addGoalReward, longTermGoals, preferences.baseCurrency, preferences.savingsGoals, walletGoals]);

  const resetForm = () => {
    setName('');
    setTarget('');
    setCurrency(preferences.baseCurrency);
    setColor('#8b5cf6');
    setRewardName('');
    setRewardImageUrl(undefined);
    setIsProcessingImage(false);
    setIsAdding(false);
  };

  const handleRewardImage = async (file?: File) => {
    if (!file) return;
    setIsProcessingImage(true);
    try {
      setRewardImageUrl(await resizeRewardImage(file));
    } finally {
      setIsProcessingImage(false);
    }
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
      rewardName: rewardName.trim() || `Цель «${name.trim()}» выполнена`,
      rewardImageUrl,
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
          <SavingsGoalRow key={c.key} category={c.key} label={c.label} icon={c.icon} color={c.color} displayCurrency={resolvedDisplayCurrency} />
        ))}
      </div>

      {walletGoals.length > 0 && (
        <>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 px-1 mt-2">Цели на счетах</span>
          <div className="flex flex-col gap-3">
            {walletGoals.map(wallet => <WalletGoalRow key={wallet.id} wallet={wallet} displayCurrency={resolvedDisplayCurrency} />)}
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
        {longTermGoals.map(goal => <LongTermGoalRow key={goal.id} goal={goal} displayCurrency={resolvedDisplayCurrency} />)}
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
          <input
            value={rewardName}
            onChange={event => setRewardName(event.target.value)}
            placeholder="Название будущей медали"
            className="bg-black/30 p-3 rounded-xl text-white font-bold border border-white/10 outline-none"
          />
          <label
            className="min-h-20 rounded-2xl border border-dashed border-amber-300/20 bg-amber-400/[0.035] flex items-center gap-3 p-3 cursor-pointer hover:bg-amber-400/[0.07] transition-colors"
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={event => handleRewardImage(event.target.files?.[0])}
            />
            <div
              className="w-14 h-14 rounded-2xl bg-amber-400/10 text-amber-300 flex items-center justify-center bg-cover bg-center flex-shrink-0"
              style={rewardImageUrl ? { backgroundImage: `url(${rewardImageUrl})` } : undefined}
            >
              {!rewardImageUrl && <ImagePlus size={21} />}
            </div>
            <div>
              <p className="text-xs font-black text-white/75">
                {isProcessingImage ? 'Обрабатываю изображение…' : rewardImageUrl ? 'Заменить картинку медали' : 'Выбрать картинку медали'}
              </p>
              <p className="text-[9px] text-white/30 mt-1">Она появится в коллекции после выполнения цели</p>
            </div>
          </label>
          <button
            onClick={createGoal}
            disabled={!name.trim() || !target}
            className="py-3 rounded-xl bg-violet-500 hover:bg-violet-400 disabled:opacity-30 text-white font-black text-xs transition-colors"
          >
            Создать цель
          </button>
        </div>
      )}

      {showRewards && <RewardsCollection />}
    </div>
  );
}
