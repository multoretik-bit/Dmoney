'use client';

import { useEffect, useState } from 'react';
import { BottomNav } from '@/components/layout/bottom-nav';
import { AuthModal } from '@/components/auth/auth-modal';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { Settings, User as UserIcon, LogOut, Wallet, CircleDollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, setUser, pullData, pushData, wallets, 
    categories, portfolios, folders, expenses, preferences,
    isAuthModalOpen, setAuthModalOpen
  } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [isHydrated, setIsHydrated] = useState(false);

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
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeoutId);
  }, [user, categories, portfolios, folders, wallets, expenses, preferences, pushData]);

  // Real-time pull from Supabase
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        async () => {
          setSyncStatus('syncing');
          await pullData();
          setSyncStatus('synced');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, pullData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const totalBalance = (wallets || []).reduce((acc, w) => acc + (w.balance || 0), 0);

  if (!isHydrated) return null;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col pt-safe relative">
      {/* Premium Header - dHabits Style */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-[100] transition-all duration-300 px-6 py-4 flex items-center justify-between",
        scrolled ? "bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 py-3" : "bg-transparent"
      )}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]">
            <CircleDollarSign className="text-white" size={24} />
          </div>
          <span className="text-xl font-black tracking-tighter text-white">DMoney</span>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className={cn(
              "hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all duration-500",
              syncStatus === 'syncing' ? "bg-accent/10 border-accent/20" : 
              syncStatus === 'error' ? "bg-red-500/10 border-red-500/20" : "bg-white/5 border-white/5"
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full",
                syncStatus === 'syncing' ? "bg-accent animate-pulse" :
                syncStatus === 'synced' ? "bg-emerald-500" :
                syncStatus === 'error' ? "bg-red-500" : "bg-white/20"
              )} />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                {syncStatus === 'syncing' ? 'Syncing...' : 
                 syncStatus === 'error' ? 'Sync Error' : 'Cloud Synced'}
              </span>
            </div>
          )}
          
             <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-xl">
                <div className="w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                   <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
                <span className="text-sm font-black text-accent">{totalBalance.toFixed(1)}</span>
             </div>
          </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto relative pb-32 overflow-x-hidden pt-24 px-6">
        {children}
      </main>
      
      <BottomNav />
      
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
