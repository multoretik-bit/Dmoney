'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, CircleDollarSign, Loader2, Lock, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (loginError) {
      setError(
        loginError.message === 'Invalid login credentials'
          ? 'Неверный email или пароль'
          : loginError.message
      );
      setLoading(false);
      return;
    }

    router.replace('/expenses');
    router.refresh();
  };

  return (
    <div
      className="min-h-screen text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{
        background: '#060B14',
        backgroundImage: `
          radial-gradient(ellipse 70% 50% at 15% 10%, rgba(59,130,246,0.12) 0%, transparent 55%),
          radial-gradient(ellipse 50% 40% at 85% 90%, rgba(139,92,246,0.08) 0%, transparent 55%)
        `,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8"
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-16 h-16 rounded-[22px] flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #818cf8 100%)',
              boxShadow: '0 0 40px rgba(59,130,246,0.4), 0 0 80px rgba(59,130,246,0.1)',
            }}
          >
            <CircleDollarSign size={32} className="text-white" />
          </div>
          <div className="text-center">
            <h1
              className="text-4xl font-black tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #93c5fd 0%, #60a5fa 50%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              DMoney
            </h1>
            <p className="text-white/30 text-[11px] uppercase tracking-[0.3em] font-bold mt-2">
              Один аккаунт на всех устройствах
            </p>
          </div>
        </div>

        <div
          className="w-full rounded-[28px] p-6 flex flex-col gap-5"
          style={{
            background: 'linear-gradient(145deg, #0d1626 0%, #090e1a 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          }}
        >
          <div>
            <h2 className="text-lg font-black text-white">Войти в аккаунт</h2>
            <p className="text-white/35 text-[13px] mt-1">Используйте одинаковые данные на ПК и телефоне</p>
          </div>

          {error && (
            <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold text-red-400">
              <AlertCircle size={18} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                type="email"
                autoComplete="email"
                placeholder="Ваш Email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-white placeholder-white/25 text-sm font-medium outline-none transition-all bg-white/5 border border-white/[0.08] focus:border-blue-500/40 focus:bg-blue-500/[0.06]"
                required
              />
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Ваш пароль"
                value={password}
                onChange={event => setPassword(event.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-white placeholder-white/25 text-sm font-medium outline-none transition-all bg-white/5 border border-white/[0.08] focus:border-blue-500/40 focus:bg-blue-500/[0.06]"
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email || password.length < 6}
              className="w-full h-12 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 mt-1"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #818cf8 100%)',
                boxShadow: '0 4px 20px rgba(59,130,246,0.35)',
              }}
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>
                  Войти
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
