import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { convertAmount } from '@/lib/exchange';
import { X, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CapitalsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_CURRENCIES = ['USD', 'RUB', 'THB', 'EUR', 'KZT'];

export function CapitalsModal({ isOpen, onClose }: CapitalsModalProps) {
  const { portfolios, wallets, preferences } = useStore();
  const [selectedCurrency, setSelectedCurrency] = useState(preferences.baseCurrency);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);

  // Calculate totals for each portfolio
  const portfolioTotals = portfolios.map(portfolio => {
    const portfolioWallets = wallets.filter(w => w.portfolioId === portfolio.id);
    const totalInBase = portfolioWallets.reduce((sum, w) => {
      return sum + convertAmount(Number(w.balance || 0), w.currency, selectedCurrency);
    }, 0);
    return {
      ...portfolio,
      total: totalInBase,
    };
  });

  const overallTotal = portfolioTotals.reduce((sum, p) => sum + p.total, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
          />
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-0 right-0 bottom-0 sm:left-1/2 sm:bottom-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-[400px] z-[151]"
          >
            <div className="bg-[#0f172a] border border-white/10 sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#0f172a]/90 backdrop-blur-md z-10">
                <div>
                  <h2 className="text-xl font-black text-white">Мои Капиталы</h2>
                  <p className="text-sm text-white/50 mt-1">
                    Общая сумма: <span className="text-accent font-bold">{overallTotal.toFixed(1)} {selectedCurrency}</span>
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <X size={18} className="text-white/70" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                {/* Currency Selector */}
                <div className="relative z-20">
                  <button
                    onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                  >
                    <span className="text-sm font-medium text-white/70">Валюта отображения</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{selectedCurrency}</span>
                      <ChevronDown size={16} className={cn("text-white/50 transition-transform duration-300", isCurrencyDropdownOpen && "rotate-180")} />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isCurrencyDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-[#1e293b] border border-white/10 rounded-2xl shadow-xl overflow-hidden"
                      >
                        {AVAILABLE_CURRENCIES.map(currency => (
                          <button
                            key={currency}
                            onClick={() => {
                              setSelectedCurrency(currency);
                              setIsCurrencyDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors",
                              selectedCurrency === currency ? "bg-accent/10" : ""
                            )}
                          >
                            <span className="font-bold text-white">{currency}</span>
                            {selectedCurrency === currency && <div className="w-2 h-2 rounded-full bg-accent" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Portfolios List */}
                <div className="space-y-3 mt-4">
                  {portfolioTotals.map(portfolio => (
                    <div
                      key={portfolio.id}
                      className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden group"
                    >
                      <div className="flex items-center gap-4 relative z-10">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-lg"
                          style={{ backgroundColor: portfolio.color + '20', color: portfolio.color }}
                        >
                          {portfolio.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-white">{portfolio.name}</h3>
                          <p className="text-sm text-white/50">Портфель</p>
                        </div>
                      </div>
                      <div className="text-right relative z-10">
                        <span className="font-black text-lg text-white">
                          {portfolio.total.toFixed(1)}
                        </span>
                        <span className="text-sm font-medium text-white/50 ml-1">{selectedCurrency}</span>
                      </div>

                      {/* Subtle hover background effect */}
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
                        style={{ backgroundColor: portfolio.color }}
                      />
                    </div>
                  ))}
                  {portfolioTotals.length === 0 && (
                    <div className="text-center py-8 text-white/50">
                      У вас пока нет капиталов (портфелей)
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
