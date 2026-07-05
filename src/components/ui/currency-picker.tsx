'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Globe, Check } from 'lucide-react';
import { CURRENCIES, COMMON_CURRENCIES } from '@/lib/currencies';
import { cn } from '@/lib/utils';

interface CurrencyPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (code: string) => void;
  selectedCurrency: string;
}

export function CurrencyPicker({ isOpen, onClose, onSelect, selectedCurrency }: CurrencyPickerProps) {
  const [search, setSearch] = useState('');

  const filteredCurrencies = CURRENCIES.filter(c => 
    c.code.toLowerCase().includes(search.toLowerCase()) || 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const popularCurrencies = CURRENCIES.filter(c => COMMON_CURRENCIES.includes(c.code));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md px-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div 
          className="bg-[#1c2128] w-full max-w-md h-[600px] rounded-[48px] p-8 flex flex-col gap-6 shadow-2xl border border-white/10"
          initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
              <Globe size={20} className="text-accent" />
              Currency
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full"><X size={24} /></button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              className="w-full bg-black/20 p-5 pl-12 rounded-2xl text-white outline-none border border-white/5 focus:border-accent/30 transition-all font-bold"
              placeholder="Search currency..."
              value={search} onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-8">
            {search === '' && (
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 px-2">Popular</span>
                <div className="grid grid-cols-2 gap-2">
                  {popularCurrencies.map(c => (
                    <button
                      key={c.code}
                      onClick={() => { onSelect(c.code); onClose(); }}
                      className={cn(
                        "p-4 rounded-2xl flex items-center justify-between border-2 transition-all",
                        selectedCurrency === c.code ? "bg-accent/10 border-accent" : "bg-white/2 border-transparent hover:bg-white/5"
                      )}
                    >
                      <div className="flex flex-col items-start overflow-hidden">
                        <span className="text-sm font-black">{c.code}</span>
                        <span className="text-[10px] text-white/40 truncate w-24 text-left">{c.name}</span>
                      </div>
                      <span className="text-xl">{c.symbol}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 px-2">
                {search === '' ? 'All Currencies' : `Results (${filteredCurrencies.length})`}
              </span>
              {filteredCurrencies.map(c => (
                <button
                  key={c.code}
                  onClick={() => { onSelect(c.code); onClose(); }}
                  className={cn(
                    "p-4 rounded-2xl flex items-center justify-between group transition-all",
                    selectedCurrency === c.code ? "bg-accent/20" : "bg-white/2 hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center text-lg font-black group-hover:scale-110 transition-transform">
                      {c.symbol}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-bold text-white/90">{c.code}</span>
                      <span className="text-xs text-white/30">{c.name}</span>
                    </div>
                  </div>
                  {selectedCurrency === c.code && <Check className="text-accent" size={20} />}
                </button>
              ))}
              {filteredCurrencies.length === 0 && (
                <div className="text-center py-10 text-white/20 font-black uppercase tracking-widest text-[10px]">No results found</div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
