'use client';

import { FormEvent, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Loader2, Lock, Mail, ShieldCheck, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';

export function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useStore();

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (loginError) throw loginError;

      setUser(data.user);
      setPassword('');
      onClose();
    } catch (loginError: any) {
      setError(
        loginError.message === 'Invalid login credentials'
          ? 'Неверный email или пароль'
          : loginError.message
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-3xl px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={event => event.target === event.currentTarget && onClose()}
      >
        <motion.div
          className="glass-card w-full max-w-lg rounded-[48px] p-8 sm:p-10 flex flex-col gap-8 shadow-2xl relative border-t-4 border-t-accent overflow-hidden"
          initial={{ scale: 0.9, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 30 }}
          onClick={event => event.stopPropagation()}
        >
          <div className="flex flex-col items-center gap-4 relative z-10">
            <button
              onClick={onClose}
              className="absolute right-0 top-0 p-3 bg-white/5 hover:bg-white/10 rounded-full active:scale-95 text-white/40 transition-all"
              aria-label="Закрыть"
            >
              <X size={20} />
            </button>
            <div className="w-16 h-16 bg-accent/20 rounded-[28px] flex items-center justify-center text-accent mb-2 shadow-xl shadow-accent/10">
              <ShieldCheck size={32} strokeWidth={3} />
            </div>
            <div className="flex flex-col items-center text-center">
              <h2 className="text-3xl font-black text-white tracking-[0.2em]">ВХОД</h2>
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-white/25 mt-3">
                ОДИН АККАУНТ НА ВСЕХ УСТРОЙСТВАХ
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5 relative z-10">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-red-500/10 border border-red-500/20 rounded-[24px] flex items-center gap-4 text-red-500 text-xs font-black uppercase tracking-widest"
              >
                <AlertCircle size={20} className="shrink-0" />
                {error}
              </motion.div>
            )}

            <div className="relative group">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent transition-colors" size={20} />
              <input
                type="email"
                autoComplete="email"
                placeholder="Ваш Email адрес"
                className="w-full bg-black/20 border border-white/5 rounded-[32px] py-6 pl-16 pr-6 text-white text-lg font-bold outline-none focus:border-accent/40 transition-all placeholder:text-white/15 placeholder:text-xs placeholder:uppercase placeholder:tracking-[0.2em]"
                value={email}
                onChange={event => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent transition-colors" size={20} />
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Ваш пароль"
                className="w-full bg-black/20 border border-white/5 rounded-[32px] py-6 pl-16 pr-6 text-white text-lg font-bold outline-none focus:border-accent/40 transition-all placeholder:text-white/15 placeholder:text-xs placeholder:uppercase placeholder:tracking-[0.2em]"
                value={password}
                onChange={event => setPassword(event.target.value)}
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email || password.length < 6}
              className="mt-3 h-20 bg-accent text-white text-2xl font-black rounded-[32px] flex items-center justify-center gap-4 shadow-accent/20 shadow-2xl transition-all active:scale-95 disabled:opacity-30 disabled:grayscale group"
            >
              {loading ? <Loader2 className="animate-spin" size={28} /> : (
                <>
                  <span className="tracking-widest">ВОЙТИ</span>
                  <ArrowRight size={28} strokeWidth={3} className="group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
