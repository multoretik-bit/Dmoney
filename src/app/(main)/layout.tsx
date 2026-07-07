'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Sidebar } from '@/components/layout/sidebar';
import { AuthModal } from '@/components/auth/auth-modal';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { CircleDollarSign, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { convertAmount } from '@/lib/exchange';
import { CapitalsModal } from '@/components/ui/capitals-modal';
import { AddExpenseModal } from '@/components/expenses/add-expense-modal';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, setUser, pullData, pushData, wallets,
    categories, portfolios, folders, expenses, preferences,
    isAuthModalOpen, setAuthModalOpen
  } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCapitalsModalOpen, setIsCapitalsModalOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) pullData();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN' && session?.user) pullData();
    });

    return () => subscription.unsubscribe();
  }, [setUser, pullData]);

  // Auto-push changes to Supabase
  useEffect(() => {
    if (!user) return;

    const timeoutId = setTimeout(async () => {
      setSyncStatus('syncing');
      try {
        await pushData();
        setSyncStatus('synced');
      } catch {
        setSyncStatus('error');
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [user, categories, portfolios, folders, wallets, expenses, preferences, pushData]);

  // Real-time pull from Supabase with debounce
  useEffect(() => {
    if (!user) return;

    let pullTimeout: NodeJS.Timeout;

    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        () => {
          clearTimeout(pullTimeout);
          pullTimeout = setTimeout(async () => {
            setSyncStatus('syncing');
            await pullData();
            setSyncStatus('synced');
          }, 500);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(pullTimeout);
      supabase.removeChannel(channel);
    };
  }, [user, pullData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const totalBalance = (wallets || []).reduce((acc, w) =>
    acc + convertAmount(Number(w.balance || 0), w.currency, preferences.baseCurrency), 0
  );

  const sortedPortfolios = [...portfolios].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.id.localeCompare(b.id);
  });
  const getPortfolioBalance = (pId: string) =>
    wallets
      .filter(w => w.portfolioId === pId)
      .reduce((sum, w) => sum + convertAmount(Number(w.balance || 0), w.currency, preferences.baseCurrency), 0);

  return (
    <div className="min-h-screen bg-background text-slate-100 flex lg:flex-row flex-col pt-safe relative">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header — mobile only, desktop uses the sidebar for branding/sync/balance */}
        <header className={cn(
          "lg:hidden fixed top-0 left-0 right-0 z-[100] transition-all duration-300 px-5 py-4 flex items-center justify-between",
          scrolled
            ? "bg-[#060B14]/80 backdrop-blur-2xl border-b border-white/[0.06] py-3"
            : "bg-transparent"
        )}>
          {/* Logo */}
          <div className="flex items-center gap-2.5">
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

          <div className="flex items-center gap-2">
            {/* Sync dot — mobile only */}
            {user && (
              <div
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-500',
                  syncStatus === 'syncing' ? 'bg-blue-400 animate-pulse' :
                  syncStatus === 'synced' ? 'bg-emerald-400' :
                  syncStatus === 'error' ? 'bg-red-400' : 'bg-white/15'
                )}
              />
            )}

            {/* Sync label — desktop */}
            {user && (
              <div className={cn(
                "hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all duration-500",
                syncStatus === 'syncing'
                  ? "bg-blue-500/10 border-blue-500/20"
                  : syncStatus === 'error'
                    ? "bg-red-500/10 border-red-500/20"
                    : "bg-white/[0.04] border-white/[0.06]"
              )}>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/35">
                  {syncStatus === 'syncing' ? 'Sync...' :
                   syncStatus === 'error' ? 'Error' : 'Synced'}
                </span>
              </div>
            )}

            {/* Balance button */}
            <button
              onClick={() => setIsCapitalsModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all active:scale-95"
              style={{
                background: 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.2)',
              }}
            >
              <span className="text-sm font-black text-blue-300 tracking-tight">
                ${totalBalance.toFixed(1)}
              </span>
            </button>
          </div>
        </header>

        {/* Capitals totals strip — desktop only */}
        {sortedPortfolios.length > 0 && (
          <div className="hidden lg:flex items-center gap-3 flex-wrap px-8 pt-6">
            {sortedPortfolios.map(p => (
              <div
                key={p.id}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
                style={{ background: `${p.color}12`, border: `1px solid ${p.color}25` }}
              >
                <span className="text-base">{p.icon}</span>
                <span className="text-xs font-bold text-white/70">{p.name}</span>
                <span className="text-xs font-black tabular-nums" style={{ color: p.color }}>
                  {getPortfolioBalance(p.id).toFixed(1)} {preferences.baseCurrency}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] ml-auto">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Всего</span>
              <span className="text-sm font-black text-white tabular-nums">
                {totalBalance.toFixed(1)} {preferences.baseCurrency}
              </span>
            </div>
          </div>
        )}

        <main className="flex-1 w-full max-w-6xl mx-auto relative pb-36 lg:pb-16 overflow-x-hidden pt-24 lg:pt-8 px-5 lg:px-8">
          {children}
        </main>

        <BottomNav />

        {/* Global add-expense FAB — reachable from every page */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsAddExpenseOpen(true)}
          className="fixed bottom-32 lg:bottom-10 right-5 lg:right-10 w-16 h-16 rounded-[22px] flex items-center justify-center text-white z-40 group"
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #818cf8 100%)',
            boxShadow: '0 8px 30px rgba(59,130,246,0.4)',
          }}
        >
          <Plus size={30} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
        </motion.button>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} />
      <CapitalsModal isOpen={isCapitalsModalOpen} onClose={() => setIsCapitalsModalOpen(false)} />
      <AddExpenseModal isOpen={isAddExpenseOpen} onClose={() => setIsAddExpenseOpen(false)} />
    </div>
  );
}
