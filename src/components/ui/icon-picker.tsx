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
      <div className="text-[12px] font-medium text-textMuted text-left">Иконка</div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-12 h-12 bg-white/[0.04] rounded-2xl flex items-center justify-center text-2xl hover:bg-white/[0.08] transition-all active:scale-95"
        >
          {icon || '🎯'}
        </button>
        <span className="text-[12px] text-textSubtle">Нажми, чтобы изменить</span>
      </div>

      {isOpen && (
        <div className="mt-1 surface-raised rounded-3xl overflow-hidden shadow-card-lg flex flex-col h-[280px]">
          <div className="p-3 border-b border-white/[0.06] sticky top-0 bg-surface-raised/90 backdrop-blur-sm z-10">
            <div className="relative">
               <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-textSubtle" />
               <input
                className="w-full bg-black/20 py-2.5 pl-9 pr-3 rounded-xl text-sm outline-none focus:bg-black/30 transition-all"
                placeholder="Поиск иконок..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
               />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 hide-scrollbar">
            {Object.entries(ICON_GROUPS).map(([group, icons]) => (
              <div key={group} className="mb-4">
                <div className="text-[11px] text-textSubtle mb-2 px-1">{group}</div>
                <div className="grid grid-cols-6 gap-2">
                  {icons.map(i => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { onChange(i); setIsOpen(false); }}
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all",
                        icon === i ? "bg-accent-dim ring-1 ring-accent" : "hover:bg-white/5 active:scale-90"
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
