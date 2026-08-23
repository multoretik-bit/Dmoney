'use client';

import { useMemo, useState } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  ArrowUpRight, CalendarClock, ChevronLeft, ChevronRight,
  Landmark, LayoutDashboard, Plus, ReceiptText, Sparkles, TrendingDown, WalletCards,
} from 'lucide-react';
import { useStore, DailyCapitalEntry, Expense } from '@/store/useStore';
import { convertAmount } from '@/lib/exchange';
import { COMMON_CURRENCIES } from '@/lib/currencies';
import { cn } from '@/lib/utils';
import { AddExpenseModal } from './add-expense-modal';
import { PassiveIncomeTab } from '@/components/ui/passive-income-tab';
import { SavingsGoalWidget } from './savings-goal-widget';
import { getNextChargeDate } from './subscriptions-section';

type ViewMode = 'personal' | 'work' | 'large';

const MAX_HISTORY_BARS = 18;

const VIEW_META: Record<ViewMode, { label: string; accent: string }> = {
  personal: { label: 'Личные', accent: '#60a5fa' },
  work: { label: 'Рабочие', accent: '#f59e0b' },
  large: { label: 'Крупные', accent: '#a78bfa' },
};

function money(value: number, currency: string, digits = 0) {
  if (!Number.isFinite(value)) return `— ${currency}`;
  return `${value.toLocaleString('ru-RU', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} ${currency}`;
}

function selectSignificantHistoryPoints(entries: DailyCapitalEntry[], maxPoints: number) {
  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  if (sortedEntries.length <= maxPoints) return sortedEntries;

  const lastIndex = sortedEntries.length - 1;
  const middlePointBudget = Math.max(0, maxPoints - 2);
  const candidates = [];

  for (let index = 1; index < lastIndex; index++) {
    const previous = sortedEntries[index - 1].overallTotal;
    const current = sortedEntries[index].overallTotal;
    const next = sortedEntries[index + 1].overallTotal;

    // A large daily jump is important, while the deviation from neighbouring
    // values keeps meaningful peaks and dips visible in the all-time trend.
    const dailyChange = Math.abs(current - previous);
    const turningPoint = Math.abs(current - ((previous + next) / 2));
    candidates.push({ index, significance: dailyChange + turningPoint });
  }

  const selectedIndexes = new Set([
    0,
    lastIndex,
    ...candidates
      .sort((a, b) => b.significance - a.significance)
      .slice(0, middlePointBudget)
      .map(candidate => candidate.index),
  ]);

  return Array.from(selectedIndexes)
    .sort((a, b) => a - b)
    .map(index => sortedEntries[index]);
}

function formatHistoryDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return format(new Date(year, month - 1, day), 'd MMM yyyy', { locale: ru });
}

export function ExpensesView() {
  const {
    expenses, preferences, categories, portfolios, wallets,
    subscriptions, passiveIncomeSources, capitalHistory,
    dashboardCurrency, setDashboardCurrency,
  } = useStore();
  const { baseCurrency } = preferences;
  const displayCurrency = dashboardCurrency || baseCurrency;

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('personal');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const monthKey = format(currentMonth, 'yyyy-MM');

  const filteredExpenses = useMemo(() => expenses.filter(expense => {
    if (viewMode === 'work') return !!expense.isWork;
    if (viewMode === 'large') return !!expense.isLarge;
    return !expense.isWork && !expense.isLarge;
  }), [expenses, viewMode]);

  const excludedCategoryIds = useMemo(() => new Set(categories.filter(category => {
    const parent = category.parentId ? categories.find(item => item.id === category.parentId) : null;
    return category.excludeFromBudget || parent?.excludeFromBudget;
  }).map(category => category.id)), [categories]);

  const monthExpenses = useMemo(() => filteredExpenses.filter(expense =>
    expense.date.startsWith(monthKey)
    && (viewMode !== 'personal' || !excludedCategoryIds.has(expense.categoryId))
  ), [excludedCategoryIds, filteredExpenses, monthKey, viewMode]);

  const portfolioTotals = useMemo(() => portfolios.map(portfolio => {
    const portfolioWallets = wallets.filter(wallet => wallet.portfolioId === portfolio.id);
    return {
      ...portfolio,
      walletCount: portfolioWallets.length,
      total: portfolioWallets.reduce((sum, wallet) =>
        sum + convertAmount(Number(wallet.balance || 0), wallet.currency, displayCurrency), 0),
    };
  }), [displayCurrency, portfolios, wallets]);

  const totalCapital = portfolioTotals.reduce((sum, portfolio) => sum + portfolio.total, 0);

  const upcoming = subscriptions
    .map(subscription => ({
      subscription,
      date: getNextChargeDate(subscription),
      amount: convertAmount(subscription.amount, subscription.currency, displayCurrency),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 4);

  const passiveTotal = passiveIncomeSources.reduce((sum, source) =>
    sum + convertAmount(source.amount, source.currency, displayCurrency), 0);

  const monthSpentBase = monthExpenses.reduce((sum, expense) => sum + expense.convertedAmount, 0);
  const monthSpent = convertAmount(monthSpentBase, baseCurrency, displayCurrency);
  const topSpentCategories = Object.entries(monthExpenses.reduce<Record<string, number>>((totals, expense) => {
    totals[expense.categoryId] = (totals[expense.categoryId] || 0) + expense.convertedAmount;
    return totals;
  }, {}))
    .map(([id, amount]) => ({
      category: categories.find(category => category.id === id),
      amount: convertAmount(amount, baseCurrency, displayCurrency),
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  const historyChart = useMemo(() => {
    const allPoints = [...(capitalHistory || [])].sort((a, b) => a.date.localeCompare(b.date));
    if (allPoints.length < 2) return null;

    const points = selectSignificantHistoryPoints(allPoints, MAX_HISTORY_BARS);
    const values = points.map(point => convertAmount(
      point.overallTotal,
      point.currency || baseCurrency,
      displayCurrency
    ));
    const min = Math.min(...values);
    const range = Math.max(Math.max(...values) - min, 1);
    return {
      firstDate: allPoints[0].date,
      lastDate: allPoints[allPoints.length - 1].date,
      bars: points.map((point, index) => ({
        date: point.date,
        value: values[index],
        height: 28 + ((values[index] - min) / range) * 72,
      })),
    };
  }, [baseCurrency, capitalHistory, displayCurrency]);

  const openExpense = (expense?: Expense) => {
    setEditingExpense(expense || null);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-5 pb-32">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-400/20 flex items-center justify-center text-blue-300">
            <LayoutDashboard size={21} />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">Обзор</h1>
            <p className="text-xs font-medium text-white/40 mt-0.5">Всё важное о ваших деньгах</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 rounded-2xl bg-white/[0.035] border border-white/[0.07]">
            {(Object.keys(VIEW_META) as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all',
                  viewMode === mode ? 'bg-white/[0.1] text-white shadow-sm' : 'text-white/35 hover:text-white/65'
                )}
              >
                {VIEW_META[mode].label}
              </button>
            ))}
          </div>

          <div className="flex items-center rounded-2xl bg-white/[0.035] border border-white/[0.07] p-1">
            <button
              aria-label="Предыдущий месяц"
              onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
              className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-[116px] text-center text-xs font-black capitalize text-white/80">
              {format(currentMonth, 'LLLL yyyy', { locale: ru })}
            </span>
            <button
              aria-label="Следующий месяц"
              onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
              className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={() => openExpense()}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-[0_10px_30px_-12px_rgba(37,99,235,0.8)] transition-all active:scale-[0.98]"
          >
            <Plus size={16} strokeWidth={3} />
            Добавить операцию
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-7 min-h-[270px] rounded-[28px] p-6 lg:p-8 relative overflow-hidden border border-blue-400/20 bg-[linear-gradient(145deg,#1747a6_0%,#102b66_46%,#0b1426_100%)] shadow-[0_24px_70px_-35px_rgba(37,99,235,0.75)]">
          <div className="absolute -top-28 -right-20 w-80 h-80 rounded-full bg-blue-300/10 blur-3xl" />
          <div className="relative z-10 h-full flex flex-col justify-between gap-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-blue-100/75">Общий капитал</p>
                <p className="mt-3 text-[clamp(1.65rem,8vw,3rem)] font-black tracking-[-0.04em] text-white tabular-nums break-words">
                  {money(totalCapital, displayCurrency, 1)}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-400/12 border border-emerald-300/15 text-[11px] font-bold text-emerald-300">
                    <ArrowUpRight size={13} />
                    {portfolios.length} капиталов
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.07] border border-white/10 text-[11px] font-bold text-white/60">
                    <WalletCards size={13} />
                    {wallets.length} счетов
                  </span>
                </div>
              </div>
              <select
                value={displayCurrency}
                onChange={event => setDashboardCurrency(event.target.value)}
                aria-label="Валюта отображения"
                className="px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-[11px] font-black text-blue-100 outline-none"
              >
                {COMMON_CURRENCIES.map(currency => (
                  <option key={currency} value={currency} className="bg-[#10234a]">{currency}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 text-[9px] font-bold uppercase tracking-wider text-blue-100/35">
                <span>{historyChart ? formatHistoryDate(historyChart.firstDate) : 'Первый замер'}</span>
                <span>Рост за всё время</span>
                <span>{historyChart ? formatHistoryDate(historyChart.lastDate) : 'Последний замер'}</span>
              </div>
              <div className="flex items-end gap-1 h-16" aria-label="Рост общего капитала за всё время">
                {historyChart ? historyChart.bars.map((bar, index) => (
                  <div
                    key={`${bar.date}-${index}`}
                    title={`${formatHistoryDate(bar.date)}: ${money(bar.value, displayCurrency, 1)}`}
                    className="flex-1 min-w-1 rounded-t-md bg-gradient-to-t from-blue-400/20 to-cyan-200/80"
                    style={{ height: `${bar.height}%`, opacity: 0.38 + (index / historyChart.bars.length) * 0.62 }}
                  />
                )) : (
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-200/40 to-transparent relative">
                    <span className="absolute left-0 -top-6 text-[10px] font-medium text-blue-100/40">
                      Динамика появится после второго замера капитала
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-5 rounded-[28px] p-5 lg:p-6 bg-[#0c1422]/95 border border-white/[0.075] shadow-[0_20px_50px_-34px_rgba(0,0,0,0.9)]">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-base font-black text-white">Потрачено за месяц</h2>
              <p className="text-[11px] text-white/35 mt-0.5 capitalize">{format(currentMonth, 'LLLL yyyy', { locale: ru })}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-rose-400/10 text-rose-300 flex items-center justify-center">
              <TrendingDown size={18} />
            </div>
          </div>

          <p className="text-4xl font-black tracking-[-0.04em] text-white tabular-nums mb-5">
            {money(monthSpent, displayCurrency, 1)}
          </p>

          <div className="space-y-2">
            {topSpentCategories.length === 0 ? (
              <div className="py-8 text-center text-xs text-white/30">В этом месяце трат ещё нет</div>
            ) : topSpentCategories.map(({ category, amount }) => (
              <div key={category?.id || amount} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-white/[0.025]">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base" style={{ background: `${category?.color || '#60a5fa'}1f` }}>
                  {category?.icon || '•'}
                </div>
                <p className="min-w-0 flex-1 text-sm font-bold text-white/70 truncate">{category?.name || 'Другое'}</p>
                <span className="text-sm font-black text-white tabular-nums">{money(amount, displayCurrency)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-7 rounded-[28px] p-5 lg:p-6 bg-[#0c1422]/95 border border-white/[0.075]">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={17} className="text-emerald-300" />
                <h2 className="text-base font-black text-white">Пассивный доход</h2>
              </div>
              <p className="text-[11px] text-white/35 mt-1">Источники, которые работают каждый месяц</p>
            </div>
            <div className="min-w-0 max-w-[48%] text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">Всего в месяц</p>
              <p className="truncate text-base min-[390px]:text-xl font-black text-emerald-300 tabular-nums" title={money(passiveTotal, displayCurrency, 1)}>{money(passiveTotal, displayCurrency, 1)}</p>
            </div>
          </div>
          <PassiveIncomeTab selectedCurrency={displayCurrency} compact />

          <div className="mt-5 pt-5 border-t border-white/[0.07]">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Landmark size={16} className="text-blue-300" />
                <h3 className="text-sm font-black text-white">Все капиталы</h3>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-300/70">
                {displayCurrency}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-2.5">
              {portfolioTotals.length === 0 ? (
                <div className="sm:col-span-2 py-6 text-center text-xs text-white/30">
                  Капиталы пока не созданы
                </div>
              ) : portfolioTotals.map(portfolio => (
                <div
                  key={portfolio.id}
                  className="flex min-w-0 items-center gap-2.5 p-3 min-[390px]:p-3.5 rounded-2xl bg-white/[0.025] border border-white/[0.055]"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                    style={{ color: portfolio.color, background: `${portfolio.color}18` }}
                  >
                    {portfolio.icon || <Landmark size={17} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white/85 truncate">{portfolio.name}</p>
                    <p className="text-[10px] text-white/35 mt-0.5">
                      {portfolio.walletCount} {portfolio.walletCount === 1 ? 'счёт' : 'счетов'}
                    </p>
                  </div>
                  <span
                    className="max-w-[48%] flex-shrink-0 truncate whitespace-nowrap text-xs min-[390px]:text-sm font-black text-white tabular-nums text-right"
                    title={money(portfolio.total, displayCurrency, 1)}
                  >
                    {money(portfolio.total, displayCurrency, 1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-5">
          <SavingsGoalWidget displayCurrency={displayCurrency} />
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-12 rounded-[28px] p-5 lg:p-6 bg-[#0c1422]/95 border border-white/[0.075]">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <CalendarClock size={17} className="text-emerald-300" />
                <h2 className="text-base font-black text-white">Ближайшие траты</h2>
              </div>
              <p className="text-[11px] text-white/35 mt-1">Запланированные списания</p>
            </div>
            <span className="text-[10px] font-black text-emerald-300 bg-emerald-400/10 border border-emerald-300/10 px-2.5 py-1.5 rounded-xl">
              {upcoming.length}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-2">
            {upcoming.length === 0 ? (
              <div className="py-12 text-center text-xs font-medium text-white/30">
                Ближайших списаний нет
              </div>
            ) : upcoming.map(({ subscription, date, amount }) => {
              const color = subscription.color || '#10b981';
              return (
              <div
                key={subscription.id}
                className="flex items-center gap-3 p-3 rounded-2xl border"
                style={{ background: `${color}12`, borderColor: `${color}32` }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-400/10 text-emerald-300 bg-cover bg-center overflow-hidden"
                  style={subscription.imageUrl
                    ? { backgroundImage: `url(${subscription.imageUrl})` }
                    : { backgroundColor: `${color}20`, color }}
                >
                  {!subscription.imageUrl && <ReceiptText size={16} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white/85 truncate">{subscription.name}</p>
                  <p className="text-[10px] text-white/35">{format(date, 'd MMMM', { locale: ru })}</p>
                </div>
                <span className="text-xs font-black text-white tabular-nums">{money(amount, displayCurrency)}</span>
              </div>
            )})}
          </div>
        </div>
      </section>

      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingExpense(null);
        }}
        editingExpense={editingExpense}
        initialViewMode={viewMode}
      />
    </div>
  );
}
