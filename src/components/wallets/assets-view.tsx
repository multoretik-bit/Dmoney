'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, Asset } from '@/store/useStore';
import { convertAmount } from '@/lib/exchange';
import { generateUUID } from '@/lib/uuid';
import { ColorPicker } from '@/components/ui/color-picker';
import { COMMON_CURRENCIES } from '@/lib/currencies';
import { Plus, Trash2, Edit2, Check, X, ImagePlus, Gem } from 'lucide-react';

const MAX_IMAGE_DIMENSION = 480;

function resizeImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Не удалось загрузить изображение'));
      img.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas недоступен')); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function AssetsView() {
  const { assets, preferences, deleteAsset } = useStore();
  const { baseCurrency } = preferences;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const total = assets.reduce((sum, a) => sum + convertAmount(a.estimatedValue, a.currency, baseCurrency), 0);
  const sortedAssets = [...assets].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const openAdd = () => { setEditingAsset(null); setIsModalOpen(true); };
  const openEdit = (a: Asset) => { setEditingAsset(a); setIsModalOpen(true); };

  return (
    <div className="flex flex-col gap-8 pb-32">
      <header className="pt-6 lg:pt-0 flex flex-col items-center lg:items-start justify-center text-center lg:text-left gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Недвижимость и вещи</span>
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 bg-amber-500/15 text-amber-400">
            <Gem size={22} />
          </span>
          <h1 className="text-3xl font-black text-white">Активы</h1>
        </div>
        <span className="text-2xl font-black tabular-nums text-amber-400">
          ~{total.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} {baseCurrency}
        </span>
      </header>

      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30">Список активов</span>
          <div className="h-px bg-white/5 w-16 sm:w-32" />
        </div>
        <button
          onClick={openAdd}
          className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400 hover:bg-amber-500/30 transition-all"
        >
          <Plus size={16} strokeWidth={4} />
        </button>
      </div>

      {sortedAssets.length === 0 ? (
        <button
          onClick={openAdd}
          className="h-40 rounded-[40px] border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 text-white/20 hover:text-white/50 hover:border-white/20 transition-all"
        >
          <Plus size={32} strokeWidth={3} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Добавить первый актив</span>
        </button>
      ) : (
        <div className="flex flex-wrap gap-4">
          {sortedAssets.map(asset => (
            <AssetCard
              key={asset.id}
              asset={asset}
              baseCurrency={baseCurrency}
              onEdit={() => openEdit(asset)}
              onDelete={() => deleteAsset(asset.id)}
            />
          ))}
        </div>
      )}

      <AssetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} editingAsset={editingAsset} />
    </div>
  );
}

function AssetCard({
  asset,
  baseCurrency,
  onEdit,
  onDelete,
}: {
  asset: Asset;
  baseCurrency: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const color = asset.color || '#f59e0b';
  const valueConverted = convertAmount(asset.estimatedValue, asset.currency, baseCurrency);

  return (
    <motion.div
      layout
      whileHover={{ y: -3 }}
      className="relative flex-shrink-0 w-[268px] h-[166px] rounded-[22px] overflow-hidden group snap-center"
      style={{
        background: asset.imageUrl
          ? `url(${asset.imageUrl}) center/cover`
          : `linear-gradient(135deg, ${color}70 0%, ${color}25 32%, #060a14 78%)`,
        boxShadow: `0 24px 48px -18px ${color}66, 0 2px 0 rgba(255,255,255,0.06) inset, 0 0 0 1px rgba(255,255,255,0.08) inset`,
      }}
    >
      {/* Legibility overlay for photo backgrounds */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.7) 100%)' }}
      />

      <div className="relative z-10 h-full p-5 flex flex-col justify-between">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: color, boxShadow: `0 0 10px ${color}, 0 0 0 3px ${color}22` }}
        />
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/60 truncate">{asset.name}</span>
          <span className="text-xl font-black text-white leading-tight truncate tabular-nums">
            ~{valueConverted.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}{' '}
            <span className="text-sm text-white/50 font-bold">{baseCurrency}</span>
          </span>
        </div>
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="p-1.5 bg-black/50 hover:bg-black/70 rounded-lg transition-all backdrop-blur-sm"
        >
          <Edit2 size={12} className="text-white" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1.5 bg-black/50 hover:bg-rose-500/70 rounded-lg transition-all backdrop-blur-sm"
        >
          <Trash2 size={12} className="text-white" />
        </button>
      </div>
    </motion.div>
  );
}

function AssetModal({
  isOpen,
  onClose,
  editingAsset,
}: {
  isOpen: boolean;
  onClose: () => void;
  editingAsset: Asset | null;
}) {
  const { addAsset, updateAsset, preferences } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [currency, setCurrency] = useState(preferences.baseCurrency);
  const [color, setColor] = useState(preferences.savedColors[0] || '#f59e0b');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editingAsset) {
      setName(editingAsset.name);
      setValue(editingAsset.estimatedValue.toString());
      setCurrency(editingAsset.currency);
      setColor(editingAsset.color || preferences.savedColors[0] || '#f59e0b');
      setImageUrl(editingAsset.imageUrl);
    } else {
      setName('');
      setValue('');
      setCurrency(preferences.baseCurrency);
      setColor(preferences.savedColors[0] || '#f59e0b');
      setImageUrl(undefined);
    }
  }, [isOpen, editingAsset, preferences.baseCurrency, preferences.savedColors]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsProcessingImage(true);
    try {
      const dataUrl = await resizeImageFile(file);
      setImageUrl(dataUrl);
    } catch {
      // Ignore unreadable files silently — user can just try another image.
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleSave = () => {
    const numValue = parseFloat(value);
    if (!name.trim() || !numValue || numValue <= 0) return;

    const data = { name: name.trim(), estimatedValue: numValue, currency, color, imageUrl };
    if (editingAsset) {
      updateAsset(editingAsset.id, data);
    } else {
      addAsset({ id: generateUUID(), ...data });
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[160] flex flex-col items-center justify-end bg-black/80 backdrop-blur-sm px-4 pb-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className="bg-[#0d1117] w-full max-w-xl max-h-[95vh] rounded-[40px] p-8 flex flex-col gap-6 border border-white/10 shadow-2xl overflow-y-auto hide-scrollbar"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-black uppercase tracking-widest text-white/40">
                {editingAsset ? 'Изменить актив' : 'Новый актив'}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/40">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-6">
              {/* Image picker */}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative h-40 rounded-[32px] border-2 border-dashed border-white/10 hover:border-white/20 overflow-hidden flex flex-col items-center justify-center gap-2 text-white/30 hover:text-white/50 transition-all"
                style={imageUrl ? { background: `url(${imageUrl}) center/cover`, borderStyle: 'solid' } : {}}
              >
                {imageUrl && <div className="absolute inset-0 bg-black/40" />}
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <ImagePlus size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {isProcessingImage ? 'Обработка...' : imageUrl ? 'Заменить фото' : 'Добавить фото'}
                  </span>
                </div>
              </button>

              <ColorPicker color={color} onChange={setColor} />

              <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-black uppercase text-white/20 tracking-widest">Название</label>
                  <input
                    className="bg-transparent text-xl font-black text-white outline-none placeholder-white/5"
                    placeholder="Например, Квартира на Ленина"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="h-px bg-white/5 mx-[-24px]" />

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black uppercase text-white/20 tracking-widest">За сколько можно продать</label>
                    <input
                      type="number"
                      className="bg-transparent text-lg font-black text-white outline-none w-full"
                      placeholder="0"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2 border-l border-white/5 pl-4">
                    <label className="text-[9px] font-black uppercase text-white/20 tracking-widest">Валюта</label>
                    <select
                      className="bg-transparent text-lg font-black text-white outline-none appearance-none"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      {COMMON_CURRENCIES.map(c => (
                        <option key={c} value={c} className="bg-[#0d1117]">{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={!name.trim() || !value}
              className="mt-2 min-h-[72px] bg-white text-black text-lg font-black rounded-3xl active:scale-95 transition-all disabled:opacity-20 flex items-center justify-center gap-3"
            >
              <Check size={28} strokeWidth={4} />
              {editingAsset ? 'СОХРАНИТЬ' : 'ДОБАВИТЬ АКТИВ'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
