'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Check, AlertCircle, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';

export function AuthModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useStore();

  const handleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      if (mode === 'signup') {
        const { data, error: signupError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signupError) throw signupError;
        alert('Проверьте почту для подтверждения!');
      } else {
        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (loginError) throw loginError;
        setUser(data.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' ? 'Неверный email или пароль' : err.message);
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
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div 
          className="glass-card w-full max-w-lg rounded-[48px] p-10 flex flex-col gap-10 shadow-2xl relative border-t-4 border-t-accent overflow-hidden"
          initial={{ scale: 0.9, y: 30 }} 
          animate={{ scale: 1, y: 0 }} 
          exit={{ scale: 0.9, y: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex flex-col items-center gap-4 relative z-10">
            <button 
              onClick={onClose} 
              className="absolute right-0 top-0 p-3 bg-white/5 hover:bg-white/10 rounded-full active:scale-95 text-white/40 transition-all"
            >
              <X size={20} />
            </button>
            
            <div className="w-16 h-16 bg-accent/20 rounded-[28px] flex items-center justify-center text-accent mb-2 shadow-xl shadow-accent/10">
              <ShieldCheck size={32} strokeWidth={3} />
            </div>
            
            <div className="flex flex-col items-center text-center">
               <h2 className="text-3xl font-black text-white tracking-tight uppercase tracking-[0.2em]">
                 {mode === 'login' ? 'С ВОЗВРАЩЕНИЕМ' : 'РЕГИСТРАЦИЯ'}
               </h2>
               <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/20 mt-2">
                 {mode === 'login' ? 'Войдите для синхронизации данных' : 'Начните ваш финансовый путь'}
               </p>
            </div>
          </div>

          <div className="flex flex-col gap-6 relative z-10">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-red-500/10 border border-red-500/20 rounded-[24px] flex items-center gap-4 text-red-500 text-xs font-black uppercase tracking-widest"
              >
                <AlertCircle size={20} />
                {error}
              </motion.div>
            )}

            <div className="flex flex-col gap-4">
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent transition-colors" size={20} />
                <input 
                  type="email" 
                  placeholder="Email адрес"
                  className="w-full bg-black/20 border border-white/5 rounded-[32px] py-7 pl-16 pr-6 text-white text-xl font-bold outline-none focus:border-accent/40 transition-all placeholder:text-white/10 placeholder:font-black placeholder:uppercase placeholder:tracking-[0.2em] placeholder:text-xs"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent transition-colors" size={20} />
                <input 
                  type="password" 
                  placeholder="Пароль"
                  className="w-full bg-black/20 border border-white/5 rounded-[32px] py-7 pl-16 pr-6 text-white text-xl font-bold outline-none focus:border-accent/40 transition-all placeholder:text-white/10 placeholder:font-black placeholder:uppercase placeholder:tracking-[0.2em] placeholder:text-xs"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              onClick={handleAuth}
              disabled={loading || !email || !password}
              className="mt-6 h-20 bg-accent text-white text-2xl font-black rounded-[32px] flex items-center justify-center gap-4 shadow-accent/20 shadow-2xl transition-all active:scale-95 disabled:opacity-30 disabled:grayscale group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={28} />
              ) : (
                <>
                  <span className="tracking-widest">{mode === 'login' ? 'ВОЙТИ' : 'СОЗДАТЬ'}</span>
                  <ArrowRight size={28} strokeWidth={3} className="group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </button>

            <div className="flex flex-col items-center gap-4 mt-4">
               <div className="h-px bg-white/5 w-24" />
               <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                    {mode === 'login' ? "Нет аккаунта?" : "Уже есть аккаунт?"}
                  </span>
                  <button 
                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                    className="text-[10px] font-black uppercase tracking-[0.4em] text-accent hover:scale-105 transition-all"
                  >
                    {mode === 'login' ? 'РЕГИСТРАЦИЯ' : 'ВХОД'}
                  </button>
               </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
