'use client';

import { CalendarClock, RefreshCw, WalletCards } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { convertAmount } from '@/lib/exchange';
import { SubscriptionsManager } from './subscriptions-section';

export function RecurringExpensesView() {
  const { subscriptions, preferences } = useStore();
  const monthlyTotal = subscriptions
    .filter(item => item.kind !== 'yearly')
    .reduce((sum, item) => sum + convertAmount(item.amount, item.currency, preferences.baseCurrency), 0);
  const regularCount = subscriptions.filter(item => item.group === 'regular').length;
  const subscriptionCount = subscriptions.filter(item => (item.group || 'subscription') === 'subscription').length;

  return (
    <div className="flex flex-col gap-5 pb-32">
      <header className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-emerald-400/12 border border-emerald-300/15 flex items-center justify-center text-emerald-300">
          <RefreshCw size={20} />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">Постоянные траты</h1>
          <p className="text-xs text-white/40 mt-1">Регулярные платежи, подписки и обязательные расходы</p>
        </div>
      </header>

      <section className="grid sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative overflow-hidden rounded-[28px] p-6 bg-[linear-gradient(145deg,#164e63_0%,#0f3446_52%,#0b1420_100%)] border border-cyan-300/15">
          <div className="absolute -right-16 -top-20 w-56 h-56 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="relative">
            <p className="text-xs font-bold text-cyan-100/55">Обязательные расходы в месяц</p>
            <p className="text-3xl sm:text-4xl font-black text-white mt-3 tabular-nums">
              {monthlyTotal.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} {preferences.baseCurrency}
            </p>
            <p className="text-xs text-cyan-100/40 mt-3">Суммы автоматически приведены к основной валюте</p>
          </div>
        </div>
        <div className="rounded-[28px] p-6 bg-[#0c1422] border border-white/[0.075] flex flex-col justify-between gap-6">
          <CalendarClock className="text-blue-300" size={22} />
          <div>
            <p className="text-3xl font-black text-white">{regularCount} + {subscriptionCount}</p>
            <p className="text-xs text-white/40 mt-1">обычных трат и подписок</p>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] p-5 sm:p-6 bg-[#0c1422] border border-white/[0.075]">
        <div className="flex items-center gap-2 mb-5">
          <WalletCards size={17} className="text-blue-300" />
          <p className="text-xs text-white/40">Аренда, транспорт и другие обязательные расходы без деления на тип подписки.</p>
        </div>
        <SubscriptionsManager alwaysExpanded group="regular" />
      </section>

      <section className="rounded-[28px] p-5 sm:p-6 bg-[#0c1422] border border-white/[0.075]">
        <div className="flex items-center gap-2 mb-5">
          <RefreshCw size={17} className="text-emerald-300" />
          <p className="text-xs text-white/40">Подписки разделяются на обычные, рабочие и годовые.</p>
        </div>
        <SubscriptionsManager alwaysExpanded group="subscription" />
      </section>
    </div>
  );
}
