'use client';

import { useEffect, useState } from 'react';
import { BottomNav } from '@/components/layout/bottom-nav';
import { AuthModal } from '@/components/auth/auth-modal';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { Settings, User as UserIcon } from 'lucide-react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, setUser, pullData } = useStore();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) pullData();
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN' && session?.user) pullData();
    });

    return () => subscription.unsubscribe();
  }, [setUser, pullData]);

  return (
    <div className="min-h-screen bg-background text-textMain flex flex-col pt-safe relative">
      {/* Top Auth Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 z-[100] px-6 flex justify-end items-center pointer-events-none">
        <button 
          onClick={() => setIsAuthOpen(true)}
          className="pointer-events-auto p-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 text-white/40 hover:text-accent transition-all flex items-center gap-2 group"
        >
          {user ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/20 group-hover:text-white">Synced</span>
            </div>
          ) : (
            <>
              <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-white">Sign In</span>
              <UserIcon size={16} />
            </>
          )}
        </button>
      </div>

      <main className="flex-1 w-full max-w-md mx-auto relative pb-24 overflow-x-hidden pt-16">
        {children}
      </main>
      <BottomNav />
      
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}
