'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronLeft, ChevronRight, Gem, LayoutGrid, LogOut, PieChart,
  ReceiptText, RefreshCw, Settings2, Target,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { convertAmount } from '@/lib/exchange';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/expenses', label: 'Обзор', icon: LayoutGrid },
  { href: '/operations', label: 'Операции', icon: ReceiptText },
  { href: '/budget', label: 'Бюджет', icon: PieChart },
  { href: '/goals', label: 'Цели', icon: Target },
  { href: '/recurring', label: 'Постоянные траты', icon: RefreshCw },
  { href: '/categories', label: 'Настройки', icon: Settings2 },
];

export function MobileSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const {
    portfolios, wallets, assets, preferences, user, setUser,
    selectedPortfolioId, setSelectedPortfolioId, dashboardCurrency,
  } = useStore();
  const displayCurrency = dashboardCurrency || preferences.baseCurrency;

  const sortedPortfolios = [...portfolios].sort((a, b) =>
    a.sortOrder !== b.sortOrder ? a.sortOrder - b.sortOrder : a.id.localeCompare(b.id)
  );

  const getPortfolioBalance = (portfolioId: string) => wallets
    .filter(wallet => wallet.portfolioId === portfolioId)
    .reduce((sum, wallet) => sum + convertAmount(wallet.balance, wallet.currency, displayCurrency), 0);

  const assetsTotal = assets.reduce(
    (sum, asset) => sum + convertAmount(asset.estimatedValue, asset.currency, displayCurrency),
    0
  );

  const selectPortfolio = (id: string) => {
    setSelectedPortfolioId(id);
    setIsOpen(false);
    router.push('/wallets');
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <>
      {isOpen && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          aria-label="Закрыть меню"
          className="lg:hidden fixed inset-0 z-[109] bg-black/55 backdrop-blur-sm"
        />
      )}

      <button
        onClick={() => setIsOpen(value => !value)}
        aria-label={isOpen ? 'Свернуть меню' : 'Развернуть меню'}
        aria-expanded={isOpen}
        className="lg:hidden fixed top-3 left-3 z-[111] w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-400/15 text-blue-300 flex items-center justify-center backdrop-blur-xl shadow-lg active:scale-95 transition-all"
      >
        {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : -292 }}
        transition={{ type: 'spring', stiffness: 420, damping: 38 }}
        className="lg:hidden fixed left-0 top-0 bottom-0 z-[110] w-[292px] flex flex-col overflow-hidden border-r border-white/[0.08] bg-[#08101d]/95 backdrop-blur-2xl shadow-[18px_0_45px_-28px_rgba(0,0,0,0.95)]"
      >
        <div className="h-[72px] flex items-center pl-[68px] pr-3 border-b border-white/[0.06] flex-shrink-0">
          <div className="min-w-0">
            <p className="text-base font-black text-white whitespace-nowrap">DMoney</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/25 whitespace-nowrap">Навигация</p>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-3 px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map(item => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'relative h-11 rounded-2xl flex items-center overflow-hidden transition-colors',
                    isActive ? 'text-blue-300 bg-blue-500/12' : 'text-white/35 hover:text-white/80 hover:bg-white/[0.04]'
                  )}
                >
                  <span className="w-11 h-11 flex items-center justify-center flex-shrink-0">
                    <Icon size={19} strokeWidth={isActive ? 2.5 : 1.8} />
                  </span>
                  <span className="ml-2 text-xs font-black whitespace-nowrap">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="h-px bg-white/[0.06] my-3" />

          <div className="px-2 pb-2">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/25 whitespace-nowrap">Мои капиталы</p>
          </div>

          <div className="flex flex-col gap-1">
            {sortedPortfolios.map(portfolio => {
              const isActive = pathname.startsWith('/wallets')
                && (selectedPortfolioId === portfolio.id || (!selectedPortfolioId && portfolio === sortedPortfolios[0]));
              return (
                <button
                  key={portfolio.id}
                  onClick={() => selectPortfolio(portfolio.id)}
                  className={cn(
                    'h-12 rounded-2xl flex items-center overflow-hidden text-left transition-colors',
                    isActive ? 'bg-blue-500/12' : 'hover:bg-white/[0.04]'
                  )}
                >
                  <span
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{ backgroundColor: `${portfolio.color}20` }}
                  >
                    {portfolio.icon}
                  </span>
                  <span className="ml-2 min-w-0 flex-1">
                    <span className="block text-xs font-bold text-white/70 truncate">{portfolio.name}</span>
                  </span>
                  <span className="pr-3 text-[10px] font-black text-white/30 tabular-nums whitespace-nowrap">
                    {getPortfolioBalance(portfolio.id).toFixed(0)} {displayCurrency}
                  </span>
                </button>
              );
            })}

            <Link
              href="/assets"
              onClick={() => setIsOpen(false)}
              className={cn(
                'h-12 rounded-2xl flex items-center overflow-hidden transition-colors',
                pathname.startsWith('/assets') ? 'bg-amber-400/10' : 'hover:bg-white/[0.04]'
              )}
            >
              <span className="w-11 h-11 rounded-xl bg-amber-500/12 text-amber-300 flex items-center justify-center flex-shrink-0">
                <Gem size={18} />
              </span>
              <span className="ml-2 min-w-0 flex-1 text-xs font-bold text-white/70">Активы</span>
              <span className="pr-3 text-[10px] font-black text-white/30 tabular-nums whitespace-nowrap">
                {assetsTotal.toFixed(0)} {displayCurrency}
              </span>
            </Link>
          </div>
        </div>

        {user && (
          <div className="p-2 border-t border-white/[0.06] flex-shrink-0">
            <button
              onClick={logout}
              className="w-full h-11 rounded-2xl flex items-center overflow-hidden text-white/30 hover:text-rose-400 hover:bg-rose-400/5 transition-colors"
            >
              <span className="w-11 h-11 flex items-center justify-center flex-shrink-0"><LogOut size={18} /></span>
              <span className="ml-2 text-xs font-black whitespace-nowrap">Выйти</span>
            </button>
          </div>
        )}
      </motion.aside>
    </>
  );
}
