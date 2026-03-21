'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Check, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
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
        alert('Check your email for confirmation!');
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-2xl px-6"
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div 
          className="bg-[#1c2128] w-full max-w-md rounded-[48px] p-10 flex flex-col gap-8 shadow-2xl border border-white/10 relative overflow-hidden"
          initial={{ scale: 0.9, y: 20 }} 
          animate={{ scale: 1, y: 0 }} 
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full -ml-32 -mb-32 pointer-events-none" />

          <div className="flex justify-between items-center relative z-10">
            <div className="flex flex-col">
               <h2 className="text-2xl font-black text-white tracking-tight">
                 {mode === 'login' ? 'Welcome Back' : 'Create Account'}
               </h2>
               <p className="text-[10px] font-black uppercase tracking-widest text-white/20">
                 {mode === 'login' ? 'Sign in to sync your data' : 'Start your financial journey'}
               </p>
            </div>
            <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-white/40 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-col gap-5 relative z-10">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold"
              >
                <AlertCircle size={16} />
                {error}
              </motion.div>
            )}

            <div className="flex flex-col gap-2">
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent transition-colors" size={20} />
                <input 
                  type="email" 
                  placeholder="Email Address"
                  className="w-full bg-black/20 border border-white/5 rounded-3xl py-6 pl-16 pr-6 text-white text-lg font-bold outline-none focus:border-accent/40 focus:bg-black/40 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent transition-colors" size={20} />
                <input 
                  type="password" 
                  placeholder="Password"
                  className="w-full bg-black/20 border border-white/5 rounded-3xl py-6 pl-16 pr-6 text-white text-lg font-bold outline-none focus:border-accent/40 focus:bg-black/40 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              onClick={handleAuth}
              disabled={loading || !email || !password}
              className="mt-4 h-20 bg-white text-black text-xl font-black rounded-3xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl disabled:opacity-20 group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  {mode === 'login' ? 'SIGN IN' : 'SIGN UP'}
                  <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="flex justify-center items-center gap-2 mt-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/20">
                {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
              </span>
              <button 
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-[10px] font-black uppercase tracking-widest text-accent hover:underline decoration-2 underline-offset-4"
              >
                {mode === 'login' ? 'Sign Up' : 'Log In'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
