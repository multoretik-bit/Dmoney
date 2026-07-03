'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CircleDollarSign, Mail, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/expenses`,
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setSent(true);
      setMessage('Ссылка для входа отправлена на вашу почту!');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/expenses`,
      },
    });
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
      {/* Ambient glow orbs */}
      <div
        className="absolute top-1/4 right-0 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }}
      />
      <div
        className="absolute bottom-1/4 left-0 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8"
      >
        {/* Logo */}
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
            <p className="text-white/30 text-[11px] uppercase tracking-[0.4em] font-bold mt-1">
              Finances in control
            </p>
          </div>
        </div>

        {/* Card */}
        <div
          className="w-full rounded-[28px] p-6 flex flex-col gap-5"
          style={{
            background: 'linear-gradient(145deg, #0d1626 0%, #090e1a 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          }}
        >
          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 py-4 text-center"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}
              >
                <Mail size={22} className="text-emerald-400" />
              </div>
              <p className="text-white font-bold">Проверьте почту</p>
              <p className="text-white/40 text-sm">{message}</p>
            </motion.div>
          ) : (
            <>
              <div>
                <h2 className="text-lg font-black text-white">Войти в аккаунт</h2>
                <p className="text-white/35 text-[13px] mt-0.5">Введите email для входа по ссылке</p>
              </div>

              <form onSubmit={handleLogin} className="flex flex-col gap-3">
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                  <input
                    type="email"
                    placeholder="Ваш Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-white placeholder-white/25 text-sm font-medium outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    onFocus={e => {
                      e.target.style.border = '1px solid rgba(59,130,246,0.4)';
                      e.target.style.background = 'rgba(59,130,246,0.06)';
                    }}
                    onBlur={e => {
                      e.target.style.border = '1px solid rgba(255,255,255,0.08)';
                      e.target.style.background = 'rgba(255,255,255,0.05)';
                    }}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #818cf8 100%)',
                    boxShadow: '0 4px 20px rgba(59,130,246,0.35)',
                  }}
                >
                  {loading ? 'Отправка...' : (
                    <>
                      Отправить ссылку
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
                {message && !sent && (
                  <p className="text-center text-sm text-red-400/80">{message}</p>
                )}
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/[0.06]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/20">или</span>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>

              {/* Google button */}
              <button
                onClick={handleGoogleLogin}
                className="w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-white/70">Продолжить с Google</span>
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
