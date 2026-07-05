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
        className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm px-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          className="surface-raised w-full max-w-md h-[600px] rounded-4xl p-6 flex flex-col gap-5 shadow-card-lg"
          initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
              <Globe size={18} className="text-accent" />
              Валюта
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/40"><X size={20} /></button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" size={16} />
            <input
              className="w-full bg-black/20 p-4 pl-11 rounded-2xl text-white outline-none focus:bg-black/30 transition-all text-sm"
              placeholder="Поиск валюты..."
              value={search} onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar flex flex-col gap-6">
            {search === '' && (
              <div className="flex flex-col gap-2.5">
                <span className="text-[11px] font-medium text-textSubtle px-1">Популярные</span>
                <div className="grid grid-cols-2 gap-2">
                  {popularCurrencies.map(c => (
                    <button
                      key={c.code}
                      onClick={() => { onSelect(c.code); onClose(); }}
                      className={cn(
                        "p-3.5 rounded-xl flex items-center justify-between transition-all",
                        selectedCurrency === c.code ? "bg-accent-dim ring-1 ring-accent" : "bg-white/[0.03] hover:bg-white/[0.06]"
                      )}
                    >
                      <div className="flex flex-col items-start overflow-hidden">
                        <span className="text-sm font-semibold">{c.code}</span>
                        <span className="text-[11px] text-white/40 truncate w-24 text-left">{c.name}</span>
                      </div>
                      <span className="text-lg">{c.symbol}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-textSubtle px-1">
                {search === '' ? 'Все валюты' : `Результаты (${filteredCurrencies.length})`}
              </span>
              {filteredCurrencies.map(c => (
                <button
                  key={c.code}
                  onClick={() => { onSelect(c.code); onClose(); }}
                  className={cn(
                    "p-3.5 rounded-xl flex items-center justify-between group transition-all",
                    selectedCurrency === c.code ? "bg-accent-dim" : "hover:bg-white/[0.05]"
                  )}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-black/20 flex items-center justify-center text-base font-semibold">
                      {c.symbol}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-white/90 text-sm">{c.code}</span>
                      <span className="text-xs text-white/30">{c.name}</span>
                    </div>
                  </div>
                  {selectedCurrency === c.code && <Check className="text-accent" size={18} />}
                </button>
              ))}
              {filteredCurrencies.length === 0 && (
                <div className="text-center py-10 text-textSubtle text-[12px]">Ничего не найдено</div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
