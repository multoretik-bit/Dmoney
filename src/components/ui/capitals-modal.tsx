import { motion, AnimatePresence } from 'framer-motion';
import { useStore, DailyCapitalEntry } from '@/store/useStore';
import { convertAmount } from '@/lib/exchange';
import { X, ChevronDown, TrendingUp, TrendingDown, Calendar, Info, Sprout } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { PassiveIncomeTab } from './passive-income-tab';

interface CapitalsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_CURRENCIES = ['USD', 'RUB', 'THB', 'EUR', 'KZT'];

// Picks the first entry, the last entry, and the biggest day-over-day
// jumps in between, so the chart reads as key milestones instead of
// a dense, noisy line through every single day.
function selectSignificantEntries(entries: DailyCapitalEntry[], maxPoints: number): DailyCapitalEntry[] {
  if (entries.length <= maxPoints) return entries;

  const lastIdx = entries.length - 1;
  const middleBudget = Math.max(0, maxPoints - 2);

  const deltas = [];
  for (let i = 1; i < lastIdx; i++) {
    deltas.push({ idx: i, delta: Math.abs(entries[i].overallTotal - entries[i - 1].overallTotal) });
  }
  deltas.sort((a, b) => b.delta - a.delta);

  const chosenIdx = new Set([0, lastIdx, ...deltas.slice(0, middleBudget).map(d => d.idx)]);
  return Array.from(chosenIdx).sort((a, b) => a - b).map(i => entries[i]);
}

export function CapitalsModal({ isOpen, onClose }: CapitalsModalProps) {
  const { portfolios, wallets, preferences, capitalHistory } = useStore();
  const [selectedCurrency, setSelectedCurrency] = useState(preferences.baseCurrency);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'chart' | 'income'>('list');
  const [selectedPointIdx, setSelectedPointIdx] = useState<number | null>(null);

  // Calculate totals for each portfolio in selected currency
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

  // Generate chart data based on history
  const todayStr = new Date().toLocaleDateString('sv');
  let chartEntries = [...(capitalHistory || [])];
  
  // Make sure we have today's current value in chart data
  const hasToday = chartEntries.some(e => e.date === todayStr);
  if (!hasToday && overallTotal > 0) {
    const currentPortfolioTotals: { [id: string]: number } = {};
    portfolioTotals.forEach(p => {
      // Calculate in base currency for history compatibility
      const portfolioWallets = wallets.filter(w => w.portfolioId === p.id);
      const totalInBase = portfolioWallets.reduce((sum, w) => {
        return sum + convertAmount(Number(w.balance || 0), w.currency, preferences.baseCurrency);
      }, 0);
      currentPortfolioTotals[p.id] = totalInBase;
    });

    const totalInBase = portfolios.reduce((sum, portfolio) => {
      const portfolioWallets = wallets.filter(w => w.portfolioId === portfolio.id);
      return sum + portfolioWallets.reduce((s, w) => s + convertAmount(Number(w.balance || 0), w.currency, preferences.baseCurrency), 0);
    }, 0);

    chartEntries.push({
      date: todayStr,
      overallTotal: totalInBase,
      portfolioTotals: currentPortfolioTotals
    });
  }

  // Sort entries chronologically
  chartEntries = chartEntries
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-90); // Keep a generous pool so "biggest jumps" has something to pick from

  // Reduce to first day, last day, and the biggest day-over-day swings —
  // a clean milestone chart instead of a dense line through every single day.
  const chartPoints = selectSignificantEntries(chartEntries, 8);

  // Set default selected point to the last entry when modal opens or tab changes
  useEffect(() => {
    if (chartEntries.length > 0) {
      setSelectedPointIdx(chartEntries.length - 1);
    }
  }, [activeTab, capitalHistory]);

  // Helper to convert history entry amount from base currency to selected currency
  const getConvertedHistoryAmount = (amountInBase: number) => {
    return convertAmount(amountInBase, preferences.baseCurrency, selectedCurrency);
  };

  // Find min and max for chart scaling, based on what's actually plotted
  const historyValues = chartPoints.map(e => getConvertedHistoryAmount(e.overallTotal));
  const maxVal = Math.max(...historyValues, 1) * 1.05;
  const minVal = Math.min(...historyValues, 0) * 0.95;
  const range = maxVal - minVal || 1;

  // Generate SVG coordinates for the reduced set of milestone points
  const width = 360;
  const height = 140;
  const points = chartPoints.map((e, idx) => {
    const x = chartPoints.length > 1
      ? (idx / (chartPoints.length - 1)) * (width - 30) + 15
      : width / 2;
    const y = height - ((getConvertedHistoryAmount(e.overallTotal) - minVal) / range) * (height - 40) - 20;
    const originalIdx = chartEntries.findIndex(ce => ce.date === e.date);
    return { x, y, value: getConvertedHistoryAmount(e.overallTotal), date: e.date, originalIdx };
  });

  const pathD = chartPoints.length > 1
    ? points.reduce((acc, p, idx) => acc + (idx === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`), '')
    : '';

  const areaD = chartPoints.length > 1 && points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`
    : '';

  const selectedEntry = selectedPointIdx !== null ? chartEntries[selectedPointIdx] : null;

  // Overall trend across the visible history window, for the badge under the total.
  let periodChangePct: number | null = null;
  if (chartEntries.length > 1) {
    const first = getConvertedHistoryAmount(chartEntries[0].overallTotal);
    const last = getConvertedHistoryAmount(chartEntries[chartEntries.length - 1].overallTotal);
    if (first > 0) periodChangePct = ((last - first) / first) * 100;
  }

  const formattedTotal = overallTotal.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full sm:w-[460px] bg-[#0b1329]/95 border border-white/10 sm:rounded-3xl rounded-t-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[85vh] z-[151]"
          >
            {/* Header */}
            <div className="relative shrink-0 px-6 pt-6 pb-7 border-b border-white/5 bg-[#0b1329]/90 backdrop-blur-md sticky top-0 z-10 overflow-hidden">
              {/* Ambient glow behind the hero total */}
              <div className="absolute left-1/2 top-6 -translate-x-1/2 w-52 h-52 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between">
                <h2 className="text-[11px] font-black uppercase tracking-[0.35em] text-white/40">Мои Капиталы</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <X size={18} className="text-white/70" />
                </button>
              </div>

              <div className="relative z-10 flex flex-col items-center text-center gap-2 mt-5">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Общая сумма</span>
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-[42px] leading-none font-black tabular-nums bg-gradient-to-br from-white to-accent bg-clip-text text-transparent"
                  >
                    {formattedTotal}
                  </span>
                  <span className="text-base font-bold text-white/40">{selectedCurrency}</span>
                </div>
                {periodChangePct !== null && Math.abs(periodChangePct) >= 0.05 && (
                  <div
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold",
                      periodChangePct >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                    )}
                  >
                    {periodChangePct >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    {periodChangePct >= 0 ? '+' : ''}{periodChangePct.toFixed(1)}% за период
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex shrink-0 border-b border-white/5 p-1 bg-white/5 m-4 rounded-xl gap-0.5">
              <button
                onClick={() => setActiveTab('list')}
                className={cn(
                  "flex-1 py-2 px-1 text-center text-[11px] sm:text-xs font-bold rounded-lg transition-colors leading-tight",
                  activeTab === 'list' ? "bg-accent text-white" : "text-white/60 hover:text-white"
                )}
              >
                Список счетов
              </button>
              <button
                onClick={() => setActiveTab('chart')}
                className={cn(
                  "flex-1 py-2 px-1 text-center text-[11px] sm:text-xs font-bold rounded-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 leading-tight",
                  activeTab === 'chart' ? "bg-accent text-white" : "text-white/60 hover:text-white"
                )}
              >
                <TrendingUp size={14} />
                Динамика
              </button>
              <button
                onClick={() => setActiveTab('income')}
                className={cn(
                  "flex-1 py-2 px-1 text-center text-[11px] sm:text-xs font-bold rounded-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 leading-tight",
                  activeTab === 'income' ? "bg-emerald-500 text-white" : "text-white/60 hover:text-white"
                )}
              >
                <Sprout size={14} />
                Пассивный доход
              </button>
            </div>

            {/* Body */}
            <div className="p-6 pt-0 overflow-y-auto custom-scrollbar flex flex-col gap-4 flex-grow min-h-0">
              
              {activeTab === 'list' ? (
                <>
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
                          className="absolute top-full left-0 right-0 mt-2 bg-[#172554] border border-white/10 rounded-2xl shadow-xl overflow-hidden"
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
                  <div className="space-y-3 mt-2">
                    {portfolioTotals.map(portfolio => (
                      <div
                        key={portfolio.id}
                        className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden group"
                      >
                        <div className="flex items-center gap-4 relative z-10 flex-1 min-w-0 pr-4">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-lg flex-shrink-0"
                            style={{ backgroundColor: portfolio.color + '20', color: portfolio.color }}
                          >
                            {portfolio.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-white truncate">{portfolio.name}</h3>
                            <p className="text-sm text-white/50">Портфель</p>
                          </div>
                        </div>
                        <div className="text-right relative z-10 flex-shrink-0">
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
                </>
              ) : activeTab === 'income' ? (
                <PassiveIncomeTab selectedCurrency={selectedCurrency} />
              ) : (
                /* Chart View */
                <div className="flex flex-col gap-5">
                  {chartEntries.length < 2 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-6 bg-white/5 border border-white/5 rounded-2xl text-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-accent">
                        <Info size={24} />
                      </div>
                      <span className="font-bold text-white text-sm">Данные о динамике отсутствуют</span>
                      <p className="text-xs text-white/40 max-w-[280px]">
                        Приложение автоматически записывает ежедневный баланс ваших счетов. Зайдите завтра, чтобы увидеть график в динамике.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingUp size={16} className="text-accent" />
                            <span className="text-sm font-bold text-white/70">Динамика развития</span>
                          </div>
                          <div className="text-xs text-white/40 flex items-center gap-1">
                            <Calendar size={12} />
                            История баланса
                          </div>
                        </div>

                        {chartPoints.length < chartEntries.length && (
                          <p className="text-[10px] font-bold text-white/25 -mt-2">
                            Показаны начало, конец и самые заметные изменения баланса
                          </p>
                        )}

                        {/* SVG Chart */}
                        <div className="relative w-full flex items-center justify-center bg-slate-900/50 rounded-xl p-3 border border-white/5">
                          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
                            <defs>
                              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                            
                            {/* Grid lines */}
                            <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                            <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                            <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />

                            {/* Area path */}
                            {areaD && <path d={areaD} fill="url(#chartGradient)" />}

                            {/* Line path */}
                            {pathD && (
                              <path 
                                d={pathD} 
                                fill="none" 
                                stroke="#3b82f6" 
                                strokeWidth="3" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                              />
                            )}

                            {/* Milestone point dots */}
                            {points.map((p) => (
                              <g
                                key={p.date}
                                className="group/dot cursor-pointer"
                                onClick={() => setSelectedPointIdx(p.originalIdx)}
                              >
                                <circle
                                  cx={p.x}
                                  cy={p.y}
                                  r={selectedPointIdx === p.originalIdx ? "6" : "4"}
                                  fill={selectedPointIdx === p.originalIdx ? "#3b82f6" : "#0f172a"}
                                  stroke="#3b82f6"
                                  strokeWidth="2.5"
                                  className="transition-all duration-150"
                                />
                                <circle
                                  cx={p.x}
                                  cy={p.y}
                                  r="12"
                                  fill="#3b82f6"
                                  fillOpacity="0"
                                  className="hover:fill-opacity-10 transition-all duration-150"
                                />
                              </g>
                            ))}

                            {/* Floating tooltip above the selected point */}
                            {(() => {
                              const activePoint = points.find(p => p.originalIdx === selectedPointIdx);
                              if (!activePoint) return null;

                              const isLatest = selectedPointIdx === chartEntries.length - 1;
                              const diff = overallTotal - activePoint.value;
                              const tooltipW = 210;
                              const tooltipH = isLatest ? 30 : 58;
                              const tx = Math.min(Math.max(activePoint.x - tooltipW / 2, 2), width - tooltipW - 2);
                              const ty = Math.max(activePoint.y - tooltipH - 16, 2);
                              const arrowX = Math.min(Math.max(activePoint.x, tx + 10), tx + tooltipW - 10);

                              return (
                                <g className="pointer-events-none">
                                  <polygon
                                    points={`${arrowX - 6},${ty + tooltipH} ${arrowX + 6},${ty + tooltipH} ${arrowX},${ty + tooltipH + 7}`}
                                    fill="#0f172a"
                                    stroke="rgba(255,255,255,0.15)"
                                    strokeWidth="1"
                                  />
                                  <foreignObject x={tx} y={ty} width={tooltipW} height={tooltipH} className="overflow-visible">
                                    <div className="bg-[#0f172a] border border-white/15 rounded-xl px-3 py-2 shadow-xl flex flex-col items-center gap-1 text-center leading-tight">
                                      <span className="text-[11px] font-black text-white tabular-nums">
                                        {activePoint.value.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} {selectedCurrency}
                                      </span>
                                      {!isLatest && (
                                        <span
                                          className={cn(
                                            "text-[9px] font-bold",
                                            diff >= 0 ? "text-emerald-400" : "text-rose-400"
                                          )}
                                        >
                                          {diff >= 0 ? '▲ Выросли на' : '▼ Снизились на'} {Math.abs(diff).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} {selectedCurrency}
                                        </span>
                                      )}
                                    </div>
                                  </foreignObject>
                                </g>
                              );
                            })()}
                          </svg>
                        </div>

                        {/* Chart Legend & Stats */}
                        <div className="flex justify-between text-[11px] text-white/40 px-2 mt-1">
                          <span>{chartEntries[0] ? new Date(chartEntries[0].date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : ''}</span>
                          <span>{chartEntries[chartEntries.length - 1] ? new Date(chartEntries[chartEntries.length - 1].date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : ''}</span>
                        </div>
                      </div>

                      {/* Details of Selected Point */}
                      {selectedEntry && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
                          <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-xs text-white/50 font-bold uppercase tracking-wider">
                              Детализация на {new Date(selectedEntry.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                            <span className="text-xs font-black text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                              {getConvertedHistoryAmount(selectedEntry.overallTotal).toFixed(1)} {selectedCurrency}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            {portfolios.map(portfolio => {
                              const amountInBase = selectedEntry.portfolioTotals[portfolio.id] || 0;
                              const amountInSelected = getConvertedHistoryAmount(amountInBase);
                              
                              return (
                                <div key={portfolio.id} className="flex justify-between items-center text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{portfolio.icon}</span>
                                    <span className="text-white/80 font-medium">{portfolio.name}</span>
                                  </div>
                                  <span className="font-bold text-white">
                                    {amountInSelected.toFixed(1)} {selectedCurrency}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* List of historical checkpoints */}
                      <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1 mt-1">
                        {chartEntries.slice().reverse().map((entry, idx) => {
                          const originalIdx = chartEntries.length - 1 - idx;
                          const amount = getConvertedHistoryAmount(entry.overallTotal);
                          const prevEntry = chartEntries[originalIdx - 1];
                          let pctChange = 0;
                          if (prevEntry) {
                            const prevAmount = getConvertedHistoryAmount(prevEntry.overallTotal);
                            if (prevAmount > 0) {
                              pctChange = ((amount - prevAmount) / prevAmount) * 100;
                            }
                          }

                          return (
                            <button 
                              key={entry.date} 
                              onClick={() => setSelectedPointIdx(originalIdx)}
                              className={cn(
                                "w-full text-left flex items-center justify-between p-3 rounded-xl transition-all border",
                                selectedPointIdx === originalIdx 
                                  ? "bg-accent/10 border-accent/30 shadow-md" 
                                  : "bg-white/5 border-white/5 hover:bg-white/10"
                              )}
                            >
                              <div className="flex flex-col">
                                <span className="font-bold text-white text-sm">
                                  {new Date(entry.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                                </span>
                                <span className="text-xs text-white/40">Нажмите для просмотра счетов</span>
                              </div>
                              <div className="text-right">
                                <span className="font-black text-white block">
                                  {amount.toFixed(1)} {selectedCurrency}
                                </span>
                                {pctChange !== 0 && (
                                  <span className={cn(
                                    "text-xs font-bold",
                                    pctChange > 0 ? "text-emerald-400" : "text-rose-400"
                                  )}>
                                    {pctChange > 0 ? '+' : ''}{pctChange.toFixed(1)}%
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
