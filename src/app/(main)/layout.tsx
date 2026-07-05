'use client';

import { useEffect, useState } from 'react';
import { BottomNav } from '@/components/layout/bottom-nav';
import { AuthModal } from '@/components/auth/auth-modal';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { CircleDollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { convertAmount } from '@/lib/exchange';
import { CapitalsModal } from '@/components/ui/capitals-modal';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, setUser, pullData, pushData, wallets,
    categories, portfolios, folders, expenses, preferences,
    isAuthModalOpen, setAuthModalOpen
  } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCapitalsModalOpen, setIsCapitalsModalOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-background text-white/90 flex flex-col pt-safe relative">
      {/* Header */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-[100] transition-all duration-300 px-5 py-4 flex items-center justify-between",
        scrolled
          ? "bg-background/85 backdrop-blur-xl border-b border-white/[0.06] py-3"
          : "bg-transparent"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center gradient-accent glow-accent">
            <CircleDollarSign className="text-white" size={18} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-gradient">
            DMoney
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Sync dot — mobile only */}
          {user && (
            <div
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-all duration-500',
                syncStatus === 'syncing' ? 'bg-accent animate-pulse' :
                syncStatus === 'synced' ? 'bg-success' :
                syncStatus === 'error' ? 'bg-danger' : 'bg-white/15'
              )}
            />
          )}

          {/* Sync label — desktop */}
          {user && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg surface">
              <span className="text-[11px] font-medium text-textMuted">
                {syncStatus === 'syncing' ? 'Синхронизация…' :
                 syncStatus === 'error' ? 'Ошибка синхронизации' : 'Синхронизировано'}
              </span>
            </div>
          )}

          {/* Balance button */}
          <button
            onClick={() => setIsCapitalsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-accent-dim border border-accent/20 transition-all active:scale-95 hover:bg-accent/20"
          >
            <span className="text-sm font-semibold text-accent-light tabular-nums">
              ${totalBalance.toFixed(1)}
            </span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto relative pb-36 overflow-x-hidden pt-24 px-5">
        {children}
      </main>

      <BottomNav />

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} />
      <CapitalsModal isOpen={isCapitalsModalOpen} onClose={() => setIsCapitalsModalOpen(false)} />
    </div>
  );
}
