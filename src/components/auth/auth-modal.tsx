'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Check, AlertCircle, ArrowRight, Loader2, ShieldCheck, KeyRound, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';

export function AuthModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const { setUser } = useStore();

  const handleSendCode = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: loginError } = await supabase.auth.signInWithOtp({ email });
      if (loginError) throw loginError;
      setStep('otp');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });
      if (verifyError) throw verifyError;
      setUser(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message === 'Token has expired or is invalid' ? 'Неверный код или срок его действия истек' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (loginError) throw loginError;
      setUser(data.user);
      onClose();
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
        className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 backdrop-blur-md px-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          className="surface w-full max-w-lg rounded-4xl p-8 flex flex-col gap-8 shadow-card-lg relative overflow-hidden"
          initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex flex-col items-center gap-3 relative z-10">
            <button onClick={onClose} className="absolute right-0 top-0 p-2.5 bg-white/5 hover:bg-white/10 rounded-full active:scale-95 text-white/40 transition-all">
              <X size={18} />
            </button>
            <div className="w-14 h-14 bg-accent-dim rounded-2xl flex items-center justify-center text-accent mb-1">
              <ShieldCheck size={26} />
            </div>
            <div className="flex flex-col items-center text-center">
               <h2 className="text-xl font-semibold text-white">
                 Вход
               </h2>
               <p className="text-[12px] text-textMuted mt-1">
                 Для доступа к вашим счетам
               </p>
            </div>
          </div>

          <div className="flex flex-col gap-5 relative z-10">
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-danger/10 rounded-2xl flex items-center gap-3 text-danger text-sm font-medium">
                <AlertCircle size={18} className="shrink-0" />
                {error}
              </motion.div>
            )}

            {step === 'otp' ? (
              <>
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-success/10 rounded-2xl flex items-center gap-3 text-success text-sm font-medium text-center">
                  <Check size={18} className="shrink-0" />
                  Код отправлен на {email}. Проверьте почту!
                </motion.div>

                <div className="relative group">
                  <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 text-white/25 group-focus-within:text-accent transition-colors" size={18} />
                  <input
                    type="text" placeholder="Введите 6-значный код"
                    className="w-full bg-black/20 rounded-2xl py-5 pl-14 pr-5 text-white text-base font-medium outline-none focus:bg-black/30 transition-all placeholder:text-white/20 tracking-widest"
                    value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                </div>

                <button onClick={handleVerifyOtp} disabled={loading || otp.length < 6} className="mt-2 h-14 gradient-accent glow-accent text-white text-base font-semibold rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-30 group">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (
                    <><span>Подтвердить</span><ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                  )}
                </button>
                <button onClick={() => { setStep('email'); setOtp(''); setError(null); }} className="text-sm text-white/40 hover:text-white transition-colors text-center w-full">
                  Вернуться назад
                </button>
              </>
            ) : step === 'password' ? (
              <>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/25 group-focus-within:text-accent transition-colors" size={18} />
                  <input
                    type="password" placeholder="Ваш пароль"
                    className="w-full bg-black/20 rounded-2xl py-5 pl-14 pr-5 text-white text-base font-medium outline-none focus:bg-black/30 transition-all placeholder:text-white/20"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <button onClick={handlePasswordLogin} disabled={loading || !password} className="mt-2 h-14 gradient-accent glow-accent text-white text-base font-semibold rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-30 group">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (
                    <><span>Войти</span><ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                  )}
                </button>
                <button onClick={() => { setStep('email'); setPassword(''); setError(null); }} className="text-sm text-white/40 hover:text-white transition-colors text-center w-full">
                  Вернуться назад
                </button>
              </>
            ) : (
              <>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-white/25 group-focus-within:text-accent transition-colors" size={18} />
                  <input
                    type="email" placeholder="Ваш email адрес"
                    className="w-full bg-black/20 rounded-2xl py-5 pl-14 pr-5 text-white text-base font-medium outline-none focus:bg-black/30 transition-all placeholder:text-white/20"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <button onClick={handleSendCode} disabled={loading || !email} className="mt-2 h-14 gradient-accent glow-accent text-white text-base font-semibold rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-30 group">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (
                    <><span>Отправить код</span><ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                  )}
                </button>
                <button onClick={() => { setStep('password'); setError(null); }} className="text-sm text-white/40 hover:text-white transition-colors mt-1 text-center w-full">
                  Или войти по паролю
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
