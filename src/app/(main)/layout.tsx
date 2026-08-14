'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MobileSidebar } from '@/components/layout/bottom-nav';
import { Sidebar } from '@/components/layout/sidebar';
import { AuthModal } from '@/components/auth/auth-modal';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { CircleDollarSign, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { convertAmount, fetchLatestRates, hydrateCachedRates } from '@/lib/exchange';
import { AddExpenseModal } from '@/components/expenses/add-expense-modal';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, setUser, pullData, pushData, syncPendingWallets, wallets,
    categories, portfolios, folders, expenses, preferences,
    passiveIncomeSources, assets, subscriptions, runSubscriptionAutoCharges,
    isAuthModalOpen, setAuthModalOpen, dashboardCurrency, bumpExchangeRatesRevision,
  } = useStore();
  const displayCurrency = dashboardCurrency || preferences.baseCurrency;
  const [scrolled, setScrolled] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [areExchangeRatesReady, setAreExchangeRatesReady] = useState(false);
  const [exchangeRateRefreshFinished, setExchangeRateRefreshFinished] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const pushPendingRef = useRef(false);

  useEffect(() => {
    let active = true;

    // Use the last successful rates (or the complete realistic fallback) for
    // the first visible frame, then refresh and notify every money component.
    hydrateCachedRates();
    bumpExchangeRatesRevision();
    setAreExchangeRatesReady(true);

    void fetchLatestRates().finally(() => {
      if (!active) return;
      bumpExchangeRatesRevision();
      setExchangeRateRefreshFinished(true);
    });

    return () => {
      active = false;
    };
  }, [bumpExchangeRatesRevision]);

  useEffect(() => {
    if (!exchangeRateRefreshFinished) return;

    // Ask supported browsers not to evict DMoney's local session and queued
    // finance data under storage pressure. Browsers may safely decline.
    if (navigator.storage?.persist) {
      void navigator.storage.persist().catch(() => false);
    }
    // Runs once per app load (guest or logged-in) — persisted state has
    // rehydrated from localStorage by the time this effect fires.
    runSubscriptionAutoCharges();
  }, [exchangeRateRefreshFinished, runSubscriptionAutoCharges]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!exchangeRateRefreshFinished) return;

    let active = true;

    const restoreSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!active) return;

      // A temporary storage/network error must not turn a remembered user into
      // a guest. Supabase will retry token refresh automatically.
      if (error) {
        console.error('Session restore error:', error);
        return;
      }

      setUser(session?.user ?? null);
      if (session?.user) await pullData();
    };

    void restoreSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        return;
      }

      if (session?.user) {
        setUser(session.user);
        if (event === 'SIGNED_IN') void pullData();
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [exchangeRateRefreshFinished, setUser, pullData]);

  // Auto-push changes to Supabase.
  // pushPendingRef is set the instant any tracked state changes (synchronously,
  // before the debounce timer even starts) so the realtime pull below knows
  // not to fetch-and-overwrite while a local edit hasn't reached the server yet.
  useEffect(() => {
    if (!user) return;
    pushPendingRef.current = true;

    const timeoutId = setTimeout(async () => {
      setSyncStatus('syncing');
      try {
        await pushData();
        setSyncStatus('synced');
      } catch {
        setSyncStatus('error');
      } finally {
        pushPendingRef.current = false;
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [user, categories, portfolios, folders, wallets, expenses, preferences, passiveIncomeSources, assets, subscriptions, pushData]);

  // Offline edits stay in the persisted queue. Retry them as soon as the app
  // comes online or returns to the foreground, without waiting for another edit.
  useEffect(() => {
    if (!user) return;

    const flushPendingWallets = async () => {
      setSyncStatus('syncing');
      try {
        await syncPendingWallets();
        setSyncStatus('synced');
      } catch {
        setSyncStatus('error');
      }
    };
    const handleOnline = () => void flushPendingWallets();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void flushPendingWallets();
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, syncPendingWallets]);

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
            // Skip: a local edit is queued to push (or pushing right now) and
            // hasn't been confirmed saved — pulling now would overwrite it
            // with stale server data. The push's own writes will trigger
            // another realtime event once it lands, so we'll pull then instead.
            if (pushPendingRef.current) return;
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
    acc + convertAmount(Number(w.balance || 0), w.currency, displayCurrency), 0
  );

  if (!areExchangeRatesReady) {
    return (
      <div className="min-h-screen bg-background text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <CircleDollarSign className="text-blue-400 animate-pulse" size={36} />
          <p className="text-xs font-black uppercase tracking-[0.25em] text-white/35">Подготавливаем курсы валют</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-slate-100 flex lg:flex-row flex-col pt-safe relative">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header — mobile only, desktop uses the sidebar for branding/sync/balance */}
        <header className={cn(
          "lg:hidden fixed top-0 left-[60px] right-0 z-[100] transition-all duration-300 px-4 py-4 flex items-center justify-between",
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

            {/* Read-only balance indicator */}
            <div className="flex items-center gap-1.5 px-2 py-2">
              <span className="text-sm font-black text-blue-300 tracking-tight">
                {totalBalance.toFixed(1)} {displayCurrency}
              </span>
            </div>
          </div>
        </header>

        {/* Read-only balance indicator — desktop */}
        <div className="hidden lg:flex justify-end px-8 pt-6">
          <div className="flex items-center gap-1.5 px-2 py-2.5">
            <span className="text-sm font-black text-blue-300 tracking-tight tabular-nums">
              {totalBalance.toFixed(1)} {displayCurrency}
            </span>
          </div>
        </div>

        <main className="flex-1 w-full max-w-[1480px] mx-auto relative pb-24 lg:pb-16 overflow-x-hidden pt-24 lg:pt-8 pl-[76px] pr-4 lg:px-8">
          {children}
        </main>

        <MobileSidebar />

        {/* Global add-expense FAB — reachable from every page */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsAddExpenseOpen(true)}
          className="fixed bottom-6 lg:bottom-10 right-5 lg:right-10 w-16 h-16 rounded-[22px] flex items-center justify-center text-white z-40 group"
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #818cf8 100%)',
            boxShadow: '0 8px 30px rgba(59,130,246,0.4)',
          }}
        >
          <Plus size={30} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
        </motion.button>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} />
      <AddExpenseModal isOpen={isAddExpenseOpen} onClose={() => setIsAddExpenseOpen(false)} />
    </div>
  );
}
