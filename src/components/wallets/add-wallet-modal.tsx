'use client';

import { generateUUID } from '@/lib/uuid';

import { useState, useEffect } from 'react';
import { useStore, Wallet } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Check, LayoutGrid, FolderIcon, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COMMON_CURRENCIES } from '@/lib/currencies';
import { ColorPicker } from '@/components/ui/color-picker';
import { CurrencyPicker } from '@/components/ui/currency-picker';
import { IconPicker } from '@/components/ui/icon-picker';

export function AddWalletModal({
  isOpen,
  onClose,
  editingWallet
}: {
  isOpen: boolean;
  onClose: () => void;
  editingWallet?: Wallet | null;
}) {
  const { addWallet, updateWallet, updateWalletOrder, portfolios, folders, preferences } = useStore();

  const [name, setName] = useState('');
  const [balance, setBalance] = useState('0');
  const [portfolioId, setPortfolioId] = useState(portfolios[0]?.id || '');
  const [folderId, setFolderId] = useState<string>('');
  const [currency, setCurrency] = useState('USD');
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const [icon, setIcon] = useState('💳');
  const [color, setColor] = useState(preferences.savedColors[0]);
  const [targetAmount, setTargetAmount] = useState('0');
  const [isCurrencyPickerOpen, setIsCurrencyPickerOpen] = useState(false);

  useEffect(() => {
    if (editingWallet) {
      setName(editingWallet.name);
      setBalance(editingWallet.balance.toString());
      setPortfolioId(editingWallet.portfolioId);
      setFolderId(editingWallet.folderId || '');
      setCurrency(editingWallet.currency);
      setDisplayCurrency(editingWallet.displayCurrency || editingWallet.currency);
      setIcon(editingWallet.icon || '💳');
      setColor(editingWallet.color || preferences.savedColors[0]);
      setTargetAmount(editingWallet.targetAmount?.toString() || '0');
    } else {
      setName('');
      setBalance('0');
      setPortfolioId(portfolios[0]?.id || '');
      setFolderId('');
      setCurrency('USD');
      setDisplayCurrency('USD');
      setIcon('💳');
      setColor(preferences.savedColors[0]);
      setTargetAmount('0');
    }
  }, [editingWallet, isOpen, portfolios, preferences.savedColors]);

  const handleSave = () => {
    if (!name.trim() || !portfolioId) return;

    const walletData = {
      portfolioId,
      folderId: folderId || undefined,
      name: name.trim(),
      currency,
      displayCurrency,
      balance: parseFloat(balance) || 0,
      icon,
      color,
      targetAmount: parseFloat(targetAmount) || 0,
    };

    if (editingWallet) {
      updateWallet(editingWallet.id, walletData);
    } else {
      addWallet({
        id: generateUUID(),
        ...walletData
      });
    }

    onClose();
  };

  const filteredFolders = folders.filter(f => f.portfolioId === portfolioId);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[160] flex flex-col items-center justify-end bg-black/70 backdrop-blur-sm px-4 pb-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className="surface w-full max-w-xl max-h-[95vh] rounded-4xl p-6 flex flex-col gap-5 shadow-card-lg overflow-y-auto hide-scrollbar"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-1">
               <h2 className="text-[13px] font-medium text-textMuted">
                 {editingWallet ? 'Изменить счет' : 'Новый счет'}
               </h2>
               <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/40"><X size={18} /></button>
            </div>

            <div className="flex flex-col gap-5">
              {/* Location Selector (Portfolio & Folder) */}
              <div className="grid grid-cols-2 gap-3">
                 <div className="flex flex-col gap-2">
                   <label className="text-[11px] text-textSubtle px-1 flex items-center gap-1.5">
                     <LayoutGrid size={11} /> Капитал
                   </label>
                   <select
                     className="bg-white/5 p-3.5 rounded-xl text-sm font-medium text-white outline-none appearance-none"
                     value={portfolioId} onChange={e => { setPortfolioId(e.target.value); setFolderId(''); }}
                   >
                     {portfolios.map(p => <option key={p.id} value={p.id} className="bg-surface">{p.name}</option>)}
                   </select>
                 </div>
                 <div className="flex flex-col gap-2">
                   <label className="text-[11px] text-textSubtle px-1 flex items-center gap-1.5">
                     <FolderIcon size={11} /> Папка (опционально)
                   </label>
                   <select
                     className="bg-white/5 p-3.5 rounded-xl text-sm font-medium text-white outline-none appearance-none"
                     value={folderId} onChange={e => setFolderId(e.target.value)}
                   >
                     <option value="" className="bg-surface">Нет</option>
                     {filteredFolders.map(f => <option key={f.id} value={f.id} className="bg-surface">{f.name}</option>)}
                   </select>
                 </div>
              </div>

              {/* ColorPicker Integration */}
              <ColorPicker color={color} onChange={setColor} />

              <IconPicker icon={icon} onChange={setIcon} />

              <div className="bg-white/[0.04] p-5 rounded-3xl flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                   <label className="text-[11px] text-textSubtle">Название счета</label>
                   <input
                      className="bg-transparent text-lg font-semibold text-white outline-none placeholder-white/10"
                      placeholder="Мой кошелек..."
                      value={name} onChange={e => setName(e.target.value)}
                   />
                </div>

                <div className="h-px bg-white/5 mx-[-20px]" />

                <div className="grid grid-cols-2 gap-4">
                   <div className="flex flex-col gap-2">
                     <label className="text-[11px] text-textSubtle">Валюта</label>
                     <button
                       type="button"
                       onClick={() => setIsCurrencyPickerOpen(true)}
                       className="bg-transparent text-base font-semibold text-white outline-none flex items-center justify-between group"
                     >
                       {currency}
                       <ChevronDown size={14} className="text-white/25 group-hover:text-accent transition-colors" />
                     </button>
                     <CurrencyPicker
                        isOpen={isCurrencyPickerOpen}
                        onClose={() => setIsCurrencyPickerOpen(false)}
                        selectedCurrency={currency}
                        onSelect={setCurrency}
                     />
                   </div>
                   <div className="flex flex-col gap-2 border-l border-white/5 pl-4">
                     <label className="text-[11px] text-textSubtle">Баланс</label>
                     <input
                        type="number"
                        className="bg-transparent text-base font-semibold text-white outline-none w-full"
                        value={balance} onChange={e => setBalance(e.target.value)}
                     />
                   </div>
                </div>

                <div className="h-px bg-white/5 mx-[-20px]" />

                <div className="flex flex-col gap-2">
                   <label className="text-[11px] text-textSubtle flex items-center gap-1.5">
                     <Target size={11} /> Цель накопления (необязательно)
                   </label>
                   <input
                      type="number"
                      className="bg-transparent text-base font-semibold text-white outline-none w-full"
                      placeholder="0"
                      value={targetAmount} onChange={e => setTargetAmount(e.target.value)}
                   />
                </div>
              </div>

              {editingWallet && (
                <div className="flex justify-between items-center bg-white/[0.04] p-3.5 rounded-2xl">
                   <span className="text-[12px] font-medium text-white/60 px-1">Порядок в списке</span>
                   <div className="flex gap-2">
                     <button
                       type="button"
                       onClick={(e) => { e.preventDefault(); updateWalletOrder(editingWallet.id, 'up'); }}
                       className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white"
                     >
                       <ChevronUp size={18} />
                     </button>
                     <button
                       type="button"
                       onClick={(e) => { e.preventDefault(); updateWalletOrder(editingWallet.id, 'down'); }}
                       className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white"
                     >
                       <ChevronDown size={18} />
                     </button>
                   </div>
                </div>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={!name.trim() || !portfolioId}
              className="mt-1 min-h-[60px] bg-accent text-white text-base font-semibold rounded-2xl active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-2.5"
            >
              <Check size={20} />
              {editingWallet ? 'Сохранить изменения' : 'Сохранить счет'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
