'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut, PieChart, Settings2, CircleDollarSign, Plus } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { convertAmount } from '@/lib/exchange';
import { cn } from '@/lib/utils';

const STATIC_ITEMS = [
  { href: '/budget', label: 'Бюджет', icon: PieChart },
  { href: '/categories', label: 'Настройки', icon: Settings2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    portfolios, wallets, preferences, user, setUser,
    selectedPortfolioId, setSelectedPortfolioId,
  } = useStore();
  const { baseCurrency } = preferences;

  const sortedPortfolios = [...portfolios].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.id.localeCompare(b.id);
  });

  const getPortfolioBalance = (pId: string) =>
    wallets
      .filter(w => w.portfolioId === pId)
      .reduce((sum, w) => sum + convertAmount(w.balance, w.currency, baseCurrency), 0);

  const isCapitalsPage = pathname.startsWith('/wallets');

  const handleSelectPortfolio = (id: string) => {
    setSelectedPortfolioId(id);
    if (!isCapitalsPage) router.push('/wallets');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const initial = (user?.email?.[0] || '?').toUpperCase();

  return (
    <aside className="hidden lg:flex flex-col w-[288px] flex-shrink-0 h-screen sticky top-0 py-7 px-5 gap-8 border-r border-white/[0.06]">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-1">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #818cf8 100%)',
            boxShadow: '0 0 20px rgba(59,130,246,0.4)',
          }}
        >
          <CircleDollarSign className="text-white" size={20} />
        </div>
        <span
          className="text-xl font-black tracking-tighter"
          style={{
            background: 'linear-gradient(135deg, #93c5fd 0%, #60a5fa 50%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          DMoney
        </span>
      </div>

      {/* User */}
      <div className="flex items-center gap-3 px-1">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 p-[2px]"
          style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa)' }}
        >
          <div className="w-full h-full rounded-full bg-[#0a0f1e] flex items-center justify-center text-sm font-black text-white/80">
            {initial}
          </div>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-white/90 truncate">
            {user?.email || 'Гость'}
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/25">
            {user ? 'В сети' : 'Не авторизован'}
          </span>
        </div>
      </div>

      {/* Capitals list */}
      <div className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-y-auto hide-scrollbar">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/25">Мои капиталы</span>
          <Link
            href="/wallets"
            className="p-1 text-white/20 hover:text-white transition-colors"
            title="Управление капиталами"
          >
            <Plus size={14} strokeWidth={3} />
          </Link>
        </div>

        {sortedPortfolios.map(p => {
          const isActive = isCapitalsPage && (selectedPortfolioId === p.id || (!selectedPortfolioId && p === sortedPortfolios[0]));
          return (
            <button
              key={p.id}
              onClick={() => handleSelectPortfolio(p.id)}
              className="relative flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-pill"
                  className="absolute inset-0 rounded-2xl"
                  style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              <span className="relative z-10 w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                style={{ backgroundColor: `${p.color}25` }}
              >
                {p.icon}
              </span>
              <div className="relative z-10 flex flex-col min-w-0 flex-1">
                <span className={cn('text-xs font-bold truncate', isActive ? 'text-white' : 'text-white/60')}>
                  {p.name}
                </span>
              </div>
              <span className={cn('relative z-10 text-[11px] font-black flex-shrink-0 tabular-nums', isActive ? 'text-blue-300' : 'text-white/25')}>
                ${getPortfolioBalance(p.id).toFixed(0)}
              </span>
            </button>
          );
        })}

        {sortedPortfolios.length === 0 && (
          <Link
            href="/wallets"
            className="px-3 py-4 text-center text-[10px] font-black uppercase tracking-widest text-white/15 border border-dashed border-white/10 rounded-2xl hover:text-white/30 transition-colors"
          >
            Создать первый капитал
          </Link>
        )}
      </div>

      {/* Static nav + logout */}
      <div className="flex flex-col gap-1 pt-3 border-t border-white/[0.06]">
        {STATIC_ITEMS.map(item => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-colors',
                isActive ? 'text-blue-300 bg-blue-500/10' : 'text-white/50 hover:text-white/80'
              )}
            >
              <Icon size={17} strokeWidth={isActive ? 2.5 : 1.8} />
              {item.label}
            </Link>
          );
        })}

        {user && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold text-white/30 hover:text-red-400 transition-colors"
          >
            <LogOut size={17} strokeWidth={1.8} />
            Выйти
          </button>
        )}
      </div>
    </aside>
  );
}
