'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Search } from 'lucide-react';

const ICON_GROUPS = {
  'Средства': ['💰', '💵', '💸', '🪙', '💳', '🏦', '💎', '📈', '📉', '💼', '🏢', '🏛️', '🏦', '💹', '🧾', '🛡️'],
  'Кошельки': ['👛', '👜', '🎒', '🧳', '📦', '🛒', '🛍️', '📦', '🎁', '🎈', '🧸', '🧿'],
  'Транспорт': ['🚗', '🚕', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🚲', '🛴', '🛹', '🛼', '⛽', '🅿️', '🚧', '🛑', '🚥', '🚂', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚠', '🚟', '🛫', '✈️', '🚀', '🚁', '⛴️', '🚢', '⚓'],
  'Дом и Быт': ['🏠', '🏡', '🏘️', '🏠', '🛌', '🛋️', '🪑', '🚿', '🛁', '🚽', '🪠', '🔑', '🗝️', '🚪', '🪟', '🧺', '🧼', '🧹', '🪠', '🧺', '🧻', '🥣', '🥢', '🍴', '🍽️', '🍳', '🥘', '🍲', '🏺', '🍼', '🥤', '🍷', '🍺', '🍹', '🥂', '🥃', '🧊'],
  'Еда и Напитки': ['🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🌯', '🥙', '🍳', '🥘', '🍲', '🥣', '🥗', '🍿', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🍡', '🥟', '🥠', '🥡', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '🍎', '🍓', '🍌', '🍇', '🍉', '🥑', '🥦', '🥕'],
  'Сервисы': ['⚡', '📡', '📶', '📱', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📞', '☎️', '📪', '📫', '📬', '📭', '📮', '📮', '✉️', '📧', '📦', '📤', '📥', '🏷️', '📦', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🏮', '🎐'],
  'Личное': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💖', '💗', '💓', '💞', '💕', '💌', '❣', '💔', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦢', '🦉', '🦚', '🦜', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌'],
  'Развлечения': ['🎮', '🕹️', '🎨', '🎭', '🎬', '🎧', '🎸', '🎹', '🎷', '🎺', '🎻', '🥁', '🎤', '🎪', '🏟️', '🎡', '🎢', '🎠', '🎰', '🎳', '🎱', '🎾', '⚽', '🏀', '🏐', '🏈', '🏉', '🏸', '🏒', '🏓', '🏏', '⛳', '🏹', '🎣', '🛶', '🚠', '🛥️', '🚢'],
  'Здоровье': ['🏥', '💊', '🩹', '🩺', '🦷', '💪', '🧘', '🏃', '🚶', '🤸', '🚲', '🩺', '🔬', '🔭', '🧬', '💉', '🩸', '💊', '🩹'],
  'Шопинг': ['👕', '👖', '👔', '👗', '👘', '👙', '👚', '👛', '👜', '👝', '🎒', '👞', '👟', '👠', '👡', '👢', '👑', '👒', '🎩', '🎓', '💄', '💍', '💎', '🕶️', '🌂', '☂️']
};

interface IconPickerProps {
  icon: string;
  onChange: (icon: string) => void;
}

export function IconPicker({ icon, onChange }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const allIcons = Object.entries(ICON_GROUPS).flatMap(([group, icons]) => 
    icons.map(i => ({ icon: i, group }))
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm text-textMuted font-medium text-left">Иконка</div>
      <div className="flex items-center gap-3">
        <button 
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-background rounded-2xl flex items-center justify-center text-3xl border border-white/10 hover:border-white/20 transition-all active:scale-95"
        >
          {icon || '🎯'}
        </button>
        <span className="text-xs text-textMuted">Нажми, чтобы изменить</span>
      </div>

      {isOpen && (
        <div className="mt-2 bg-background border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[300px]">
          <div className="p-3 border-b border-white/5 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
            <div className="relative">
               <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
               <input 
                className="w-full bg-card/40 py-2 pl-9 pr-3 rounded-xl text-sm outline-none border border-transparent focus:border-accent"
                placeholder="Поиск иконок..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
               />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 hide-scrollbar">
            {Object.entries(ICON_GROUPS).map(([group, icons]) => (
              <div key={group} className="mb-4">
                <div className="text-[10px] text-textMuted uppercase tracking-widest mb-2 px-1">{group}</div>
                <div className="grid grid-cols-6 gap-2">
                  {icons.map(i => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { onChange(i); setIsOpen(false); }}
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all",
                        icon === i ? "bg-accent/20 border border-accent" : "hover:bg-white/5 active:scale-90"
                      )}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
