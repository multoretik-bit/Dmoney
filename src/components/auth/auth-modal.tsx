'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Check, AlertCircle, ArrowRight, Loader2, ShieldCheck, KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';

export function AuthModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const { setUser } = useStore();

  const handleSendCode = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: loginError } = await supabase.auth.signInWithOtp({
        email,
      });
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
                 ВХОД ПО ПОЧТЕ
               </h2>
               <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/20 mt-2">
                 БЕЗ ПАРОЛЕЙ И ССЫЛОК. ПО КОДУ ИЗ ПИСЬМА.
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

            {step === 'otp' ? (
              <>
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 bg-green-500/10 border border-green-500/20 rounded-[24px] flex items-center gap-4 text-green-500 text-xs font-black uppercase tracking-widest text-center"
                >
                  <Check size={20} className="shrink-0" />
                  Код отправлен на {email}. Проверьте почту!
                </motion.div>

                <div className="flex flex-col gap-4">
                  <div className="relative group">
                    <KeyRound className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent transition-colors" size={20} />
                    <input 
                      type="text" 
                      placeholder="Введите 6-значный код"
                      className="w-full bg-black/20 border border-white/5 rounded-[32px] py-7 pl-16 pr-6 text-white text-xl font-bold outline-none focus:border-accent/40 transition-all placeholder:text-white/10 placeholder:font-black placeholder:uppercase placeholder:tracking-[0.2em] placeholder:text-xs tracking-widest"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    />
                  </div>
                </div>

                <button 
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length < 6}
                  className="mt-6 h-20 bg-accent text-white text-2xl font-black rounded-[32px] flex items-center justify-center gap-4 shadow-accent/20 shadow-2xl transition-all active:scale-95 disabled:opacity-30 disabled:grayscale group"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={28} />
                  ) : (
                    <>
                      <span className="tracking-widest">ПОДТВЕРДИТЬ</span>
                      <ArrowRight size={28} strokeWidth={3} className="group-hover:translate-x-2 transition-transform" />
                    </>
                  )}
                </button>
                <button
                  onClick={() => { setStep('email'); setOtp(''); setError(null); }}
                  className="text-xs text-white/40 uppercase tracking-widest hover:text-white transition-colors mt-2 text-center w-full"
                >
                  Изменить email
                </button>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-4">
                  <div className="relative group">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent transition-colors" size={20} />
                    <input 
                      type="email" 
                      placeholder="Ваш Email адрес"
                      className="w-full bg-black/20 border border-white/5 rounded-[32px] py-7 pl-16 pr-6 text-white text-xl font-bold outline-none focus:border-accent/40 transition-all placeholder:text-white/10 placeholder:font-black placeholder:uppercase placeholder:tracking-[0.2em] placeholder:text-xs"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  onClick={handleSendCode}
                  disabled={loading || !email}
                  className="mt-6 h-20 bg-accent text-white text-2xl font-black rounded-[32px] flex items-center justify-center gap-4 shadow-accent/20 shadow-2xl transition-all active:scale-95 disabled:opacity-30 disabled:grayscale group"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={28} />
                  ) : (
                    <>
                      <span className="tracking-widest">ОТПРАВИТЬ КОД</span>
                      <ArrowRight size={28} strokeWidth={3} className="group-hover:translate-x-2 transition-transform" />
                    </>
                  )}
                </button>
                <div className="flex flex-col items-center gap-4 mt-6">
                   <div className="flex items-center gap-4 w-full">
                     <div className="h-px bg-white/5 flex-1" />
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">ИЛИ</span>
                     <div className="h-px bg-white/5 flex-1" />
                   </div>
                   
                   <button 
                     onClick={async () => {
                       await supabase.auth.signInWithOAuth({
                         provider: 'google',
                         options: { redirectTo: `${window.location.origin}/` }
                       });
                     }}
                     className="w-full h-16 bg-white/5 border border-white/10 text-white font-bold rounded-[24px] hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-3"
                   >
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                       <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                       <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                       <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                       <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                     </svg>
                     Войти через Google
                   </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
