'use client';

import { useState, useMemo } from 'react';
import { useStore, Category } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronRight, FolderPlus, Plus, Tag, LogOut, User as UserIcon, Mail, Fingerprint, Globe, RefreshCw, Edit2, ArrowUp, ArrowDown, CircleDollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ColorPicker } from '@/components/ui/color-picker';
import { IconPicker } from '@/components/ui/icon-picker';
import { cn } from '@/lib/utils';

import { AddCategoryModal } from './add-category-modal';
import { fetchCBRRates, CBRResponse } from '@/lib/cbr';
import { useEffect } from 'react';

export function CategoriesView() {
  const { user, setUser, pullData, pushData, setAuthModalOpen, categories, portfolios, wallets, preferences, updatePreferences, updateCategoryOrder } = useStore();
  const { baseCurrency = 'USD' } = preferences || {};
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [initialParentId, setInitialParentId] = useState<string | undefined>(undefined);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedHeads, setExpandedHeads] = useState<Record<string, boolean>>({});
  const [cbrData, setCbrData] = useState<CBRResponse | null>(null);

  useEffect(() => {
    fetchCBRRates().then(setCbrData);
    const interval = setInterval(() => fetchCBRRates().then(setCbrData), 1000 * 60 * 30);
    return () => clearInterval(interval);
  }, []);

  const toggleHead = (id: string) => {
    setExpandedHeads(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openAddSub = (id: string) => {
    setEditingCategory(null);
    setInitialParentId(id);
    setIsModalOpen(true);
  };

  const openEdit = (cat: any) => {
    setEditingCategory(cat);
    setInitialParentId(cat.parentId);
    setIsModalOpen(true);
  };

  const allCategories = useMemo(() => categories || [], [categories]);

  const headCategories = useMemo(() =>
    allCategories
      .filter(c => !c.parentId)
      .sort((a, b) => {
        if ((a.sortOrder || 0) !== (b.sortOrder || 0)) return (a.sortOrder || 0) - (b.sortOrder || 0);
        return a.id.localeCompare(b.id);
      }),
  [allCategories]);

  const orphanedCategories = useMemo(() => {
    const headIds = new Set(headCategories.map(h => h.id));
    return allCategories.filter(c => c.parentId && !headIds.has(c.parentId));
  }, [allCategories, headCategories]);

  return (
    <div className="flex flex-col gap-9 min-h-screen pb-40">
      <header className="pt-8">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Опции</h1>
      </header>

      {/* Account Info */}
      <section className="flex flex-col gap-3">
        <span className="text-[12px] font-medium text-textMuted px-1">Аккаунт</span>

        {user ? (
          <div className="surface rounded-2xl p-6 flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-accent-dim rounded-2xl flex items-center justify-center text-accent flex-shrink-0">
                <UserIcon size={24} />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                   <Mail size={12} className="text-white/25 flex-shrink-0" />
                   <span className="text-[15px] font-medium text-white truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                   <Fingerprint size={12} className="text-white/25 flex-shrink-0" />
                   <span className="text-[11px] text-textSubtle select-all truncate">ID: {user.id}</span>
                </div>
              </div>
              <button
                onClick={async () => {
                  setIsSyncing(true);
                  try {
                    await pullData();
                    await pushData();
                  } finally {
                    setIsSyncing(false);
                  }
                }}
                disabled={isSyncing}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
                  isSyncing ? "bg-accent-dim text-accent animate-spin" : "bg-white/5 text-white/40 hover:bg-white/10"
                )}
                title="Force Sync"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            <button
              onClick={async () => {
                 await supabase.auth.signOut();
                 setUser(null);
              }}
              className="w-full h-12 bg-danger/10 hover:bg-danger text-danger hover:text-white rounded-xl transition-all font-medium text-sm flex items-center justify-center gap-2.5"
            >
              <LogOut size={16} />
              Выйти из аккаунта
            </button>
          </div>
        ) : (
          <div className="surface rounded-2xl p-8 flex flex-col items-center gap-5 text-center">
             <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center text-white/25">
                <UserIcon size={26} />
             </div>
             <div className="flex flex-col gap-1.5">
               <p className="font-medium text-white/70 text-sm">Вы не вошли в аккаунт</p>
               <p className="text-textSubtle text-[12px] px-6">Войдите, чтобы синхронизировать данные между устройствами.</p>
             </div>
             <button
               onClick={() => setAuthModalOpen(true)}
               className="w-full h-12 gradient-accent glow-accent text-white rounded-xl transition-all active:scale-95 font-medium text-sm flex items-center justify-center gap-2.5"
             >
               Войти в аккаунт
             </button>
          </div>
        )}
      </section>

      {/* Currency Selection & Exchange Rates */}
      <section className="flex flex-col gap-3">
        <span className="text-[12px] font-medium text-textMuted px-1">Настройки</span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="surface rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                 <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center text-success">
                    <Globe size={20} />
                 </div>
                 <div className="flex flex-col">
                   <span className="font-medium text-white text-[13px] mb-0.5">Основная валюта</span>
                   <span className="text-[12px] text-textMuted">Используется для расчетов</span>
                 </div>
              </div>
               <div className="relative group">
                  <select
                    className="bg-white/5 pl-4 pr-9 py-3 rounded-xl text-accent font-medium text-sm outline-none appearance-none cursor-pointer focus:bg-white/10 transition-all"
                    value={baseCurrency}
                    onChange={(e) => updatePreferences({ baseCurrency: e.target.value })}
                  >
                    {['USD', 'EUR', 'RUB', 'KZT', 'THB', 'KGS'].map(c => <option key={c} value={c} className="bg-surface">{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" size={14} />
               </div>
            </div>
          </div>

          <div className="surface rounded-2xl p-6 flex flex-col gap-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-9 h-9 bg-accent-dim rounded-lg flex items-center justify-center text-accent">
                      <CircleDollarSign size={18} />
                   </div>
                   <span className="text-[12px] font-medium text-textMuted">Курсы ЦБ РФ</span>
                </div>
                {cbrData && (
                   <span className="text-[11px] text-textSubtle">
                      Обновлено {new Date(cbrData.Timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </span>
                )}
             </div>

             <div className="flex items-center gap-5 overflow-x-auto hide-scrollbar py-1">
                {cbrData ? (
                   ['USD', 'EUR', 'KZT', 'THB', 'KGS'].map(code => {
                      const val = cbrData.Valute[code];
                      if (!val) return null;
                      const rate = (val.Value / val.Nominal).toFixed(2);
                      const diff = val.Value - val.Previous;
                      return (
                         <div key={code} className="flex flex-col gap-1 flex-shrink-0">
                            <div className="flex items-center gap-1.5">
                               <span className="text-xs font-medium text-white">{code}</span>
                               <span className={cn(
                                  "text-[10px] font-medium",
                                  diff >= 0 ? "text-success" : "text-danger"
                               )}>
                                  {diff >= 0 ? '↑' : '↓'}
                               </span>
                            </div>
                            <span className="text-base font-semibold text-accent tabular-nums">
                               {rate}
                            </span>
                         </div>
                      );
                   })
                ) : (
                   <div className="flex items-center gap-2 text-textSubtle py-2">
                      <RefreshCw size={12} className="animate-spin" />
                      <span className="text-[12px]">Загрузка курсов...</span>
                   </div>
                )}
             </div>
          </div>
        </div>
      </section>

      {/* Gamification Settings: Свободные деньги */}
      <section className="flex flex-col gap-3">
        <span className="text-[12px] font-medium text-textMuted px-1">Свободные деньги (геймификация)</span>

        <div className="surface rounded-2xl p-6 flex flex-col gap-5">
          <p className="text-[13px] text-textMuted leading-relaxed">Настройте лимит для личного капитала. При превышении этого лимита избыток («свободные деньги») будет автоматически предлагаться распределить между другими капиталами.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Personal Capital Config */}
            <div className="flex flex-col gap-3 p-4 surface-sunken rounded-2xl">
              <span className="text-[12px] font-medium text-accent">Личный капитал</span>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-textSubtle">Портфель</label>
                <select
                  className="bg-black/20 p-2.5 rounded-lg text-white text-sm outline-none"
                  value={preferences.personalPortfolioId || ''}
                  onChange={(e) => updatePreferences({ personalPortfolioId: e.target.value })}
                >
                  <option value="">Выберите портфель</option>
                  {portfolios.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-textSubtle">Лимит личного капитала ({baseCurrency})</label>
                <input
                  type="number"
                  className="bg-black/20 p-2.5 rounded-lg text-white text-sm outline-none"
                  value={preferences.personalPortfolioLimit || ''}
                  onChange={(e) => updatePreferences({ personalPortfolioLimit: parseFloat(e.target.value) || 0 })}
                  placeholder="Например, 1000"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-textSubtle">Счет списания</label>
                <select
                  className="bg-black/20 p-2.5 rounded-lg text-white text-sm outline-none"
                  value={preferences.sourceWalletId || ''}
                  onChange={(e) => updatePreferences({ sourceWalletId: e.target.value })}
                >
                  <option value="">Выберите счет</option>
                  {wallets.filter(w => w.portfolioId === preferences.personalPortfolioId).map(w => (
                    <option key={w.id} value={w.id}>{w.icon} {w.name} ({w.balance} {w.currency})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Target Capitals Config */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Work Capital */}
              <div className="flex flex-col gap-2.5 p-3.5 surface-sunken rounded-2xl">
                <span className="text-[11px] font-medium text-white">Рабочий капитал</span>
                <select
                  className="bg-black/20 p-2 rounded-lg text-white text-xs outline-none"
                  value={preferences.workPortfolioId || ''}
                  onChange={(e) => updatePreferences({ workPortfolioId: e.target.value })}
                >
                  <option value="">Портфель</option>
                  {portfolios.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
                </select>
                <select
                  className="bg-black/20 p-2 rounded-lg text-white text-xs outline-none"
                  value={preferences.workWalletId || ''}
                  onChange={(e) => updatePreferences({ workWalletId: e.target.value })}
                >
                  <option value="">Целевой счет</option>
                  {wallets.filter(w => w.portfolioId === preferences.workPortfolioId).map(w => (
                    <option key={w.id} value={w.id}>{w.icon} {w.name}</option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="bg-black/20 p-2 rounded-lg text-white text-xs outline-none w-20 text-center"
                    value={preferences.workPercentage ?? 50}
                    onChange={(e) => updatePreferences({ workPercentage: parseInt(e.target.value) || 0 })}
                  />
                  <span className="text-xs text-textMuted">%</span>
                </div>
              </div>

              {/* Invest Capital */}
              <div className="flex flex-col gap-2.5 p-3.5 surface-sunken rounded-2xl">
                <span className="text-[11px] font-medium text-white">Инвестиционный</span>
                <select
                  className="bg-black/20 p-2 rounded-lg text-white text-xs outline-none"
                  value={preferences.investPortfolioId || ''}
                  onChange={(e) => updatePreferences({ investPortfolioId: e.target.value })}
                >
                  <option value="">Портфель</option>
                  {portfolios.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
                </select>
                <select
                  className="bg-black/20 p-2 rounded-lg text-white text-xs outline-none"
                  value={preferences.investWalletId || ''}
                  onChange={(e) => updatePreferences({ investWalletId: e.target.value })}
                >
                  <option value="">Целевой счет</option>
                  {wallets.filter(w => w.portfolioId === preferences.investPortfolioId).map(w => (
                    <option key={w.id} value={w.id}>{w.icon} {w.name}</option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="bg-black/20 p-2 rounded-lg text-white text-xs outline-none w-20 text-center"
                    value={preferences.investPercentage ?? 30}
                    onChange={(e) => updatePreferences({ investPercentage: parseInt(e.target.value) || 0 })}
                  />
                  <span className="text-xs text-textMuted">%</span>
                </div>
              </div>

              {/* Savings Capital */}
              <div className="flex flex-col gap-2.5 p-3.5 surface-sunken rounded-2xl">
                <span className="text-[11px] font-medium text-white">Сберегательный</span>
                <select
                  className="bg-black/20 p-2 rounded-lg text-white text-xs outline-none"
                  value={preferences.savingsPortfolioId || ''}
                  onChange={(e) => updatePreferences({ savingsPortfolioId: e.target.value })}
                >
                  <option value="">Портфель</option>
                  {portfolios.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
                </select>
                <select
                  className="bg-black/20 p-2 rounded-lg text-white text-xs outline-none"
                  value={preferences.savingsWalletId || ''}
                  onChange={(e) => updatePreferences({ savingsWalletId: e.target.value })}
                >
                  <option value="">Целевой счет</option>
                  {wallets.filter(w => w.portfolioId === preferences.savingsPortfolioId).map(w => (
                    <option key={w.id} value={w.id}>{w.icon} {w.name}</option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="bg-black/20 p-2 rounded-lg text-white text-xs outline-none w-20 text-center"
                    value={preferences.savingsPercentage ?? 20}
                    onChange={(e) => updatePreferences({ savingsPercentage: parseInt(e.target.value) || 0 })}
                  />
                  <span className="text-xs text-textMuted">%</span>
                </div>
              </div>
            </div>
          </div>

          {((preferences.workPercentage || 0) + (preferences.investPercentage || 0) + (preferences.savingsPercentage || 0)) !== 100 && (
            <p className="text-danger text-[12px] font-medium text-center">
              Сумма процентов должна быть равна 100% (сейчас: {(preferences.workPercentage || 0) + (preferences.investPercentage || 0) + (preferences.savingsPercentage || 0)}%)
            </p>
          )}
        </div>
      </section>

      <div className="flex justify-between items-center px-1">
        <div className="flex flex-col gap-1">
           <span className="text-[12px] font-medium text-textMuted">Настройка</span>
           <h2 className="text-lg font-semibold text-white/80">Бюджетные блоки</h2>
        </div>
        <button
          onClick={() => { setInitialParentId(undefined); setEditingCategory(null); setIsModalOpen(true); }}
          className="w-11 h-11 bg-accent rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all"
          title="Создать новый блок"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {headCategories.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-white/15">
             <Plus size={36} strokeWidth={1.5} />
             <span className="text-[12px] font-medium">Нет созданных блоков</span>
          </div>
        ) : (
          headCategories.map(head => {
            const subs = allCategories
              .filter(c => c.parentId === head.id)
              .sort((a, b) => {
                if ((a.sortOrder || 0) !== (b.sortOrder || 0)) return (a.sortOrder || 0) - (b.sortOrder || 0);
                return a.id.localeCompare(b.id);
              });
            const isExpanded = expandedHeads[head.id];

            return (
              <div key={head.id} className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleHead(head.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleHead(head.id); } }}
                    className="flex-1 flex items-center justify-between p-5 rounded-2xl surface surface-hover active:scale-[0.99] transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                       <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: head.color }}>
                          {head.icon}
                       </div>
                       <span className="text-[15px] font-medium text-white">{head.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <button
                          onClick={(e) => { e.stopPropagation(); openEdit(head); }}
                          className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100"
                       >
                          <Edit2 size={14} />
                       </button>
                       {isExpanded ? <ChevronDown size={18} className="text-white/30" /> : <ChevronRight size={18} className="text-white/30" />}
                    </div>
                  </div>

                  {/* Reordering controls for block */}
                  <div className="flex flex-col gap-1">
                     <button
                       onClick={() => updateCategoryOrder(head.id, 'up')}
                       className="p-2.5 bg-white/[0.04] rounded-xl text-white/30 hover:text-white hover:bg-white/[0.08] transition-all"
                     >
                       <ArrowUp size={16} />
                     </button>
                     <button
                       onClick={() => updateCategoryOrder(head.id, 'down')}
                       className="p-2.5 bg-white/[0.04] rounded-xl text-white/30 hover:text-white hover:bg-white/[0.08] transition-all"
                     >
                       <ArrowDown size={16} />
                     </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="flex flex-col gap-2 pl-4">
                    {subs.map(sub => (
                      <div
                        key={sub.id}
                        className="p-4 rounded-xl flex items-center justify-between surface-sunken group"
                      >
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: `${sub.color}18` }}>
                              {sub.icon}
                           </div>
                           <span className="text-sm font-medium text-white/80">{sub.name}</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all mr-1">
                               <button
                                 onClick={() => updateCategoryOrder(sub.id, 'up')}
                                 className="p-1.5 text-white/30 hover:text-white"
                               >
                                 <ArrowUp size={14} />
                               </button>
                               <button
                                 onClick={() => updateCategoryOrder(sub.id, 'down')}
                                 className="p-1.5 text-white/30 hover:text-white"
                               >
                                 <ArrowDown size={14} />
                               </button>
                            </div>
                            <button
                              onClick={() => openEdit(sub)}
                              className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Edit2 size={13} />
                            </button>
                         </div>
                      </div>
                    ))}
                    <button
                      onClick={() => openAddSub(head.id)}
                      className="p-4 surface-sunken rounded-xl border border-dashed border-white/10 text-[12px] font-medium text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all"
                    >
                      + Добавить категорию в блок
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}

        {orphanedCategories.length > 0 && (
          <div className="mt-6 flex flex-col gap-3">
             <span className="text-[12px] font-medium text-danger/70 px-1">Потерянные категории</span>
             <div className="flex flex-col gap-2">
                {orphanedCategories.map(sub => (
                   <div
                    key={sub.id}
                    className="p-4 rounded-xl flex items-center justify-between bg-danger/5 border border-danger/10 group"
                   >
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg bg-black/20">
                          {sub.icon}
                       </div>
                       <span className="text-sm font-medium text-white/80">{sub.name}</span>
                     </div>
                     <button
                       onClick={() => openEdit(sub)}
                       className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5"
                     >
                        <Edit2 size={13} />
                     </button>
                   </div>
                ))}
             </div>
          </div>
        )}
      </div>

      <AddCategoryModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingCategory(null); }}
        initialParentId={initialParentId}
        editingCategory={editingCategory}
        hideBudgetLimit={true}
      />
    </div>
  );
}
