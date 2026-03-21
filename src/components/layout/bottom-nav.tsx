'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, PieChart, Wallet, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { href: '/expenses', label: 'Обзор', icon: LayoutGrid },
  { href: '/budget', label: 'Бюджет', icon: PieChart },
  { href: '/wallets', label: 'Счета', icon: Wallet },
  { href: '/categories', label: 'Опции', icon: Settings2 },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#161b22]/90 backdrop-blur-xl border-t border-white/5 pb-safe rounded-t-[32px]">
      <div className="flex justify-around items-center h-22 px-4 max-w-md mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-20 h-full gap-1.5 tap-highlight-transparent py-4"
            >
              <div
                className={cn(
                  'p-2.5 rounded-2xl transition-all duration-300 relative z-10',
                  isActive ? 'text-white' : 'text-textMuted group-hover:text-white'
                )}
              >
                <Icon strokeWidth={isActive ? 2.5 : 2} size={26} />
                {isActive && (
                  <motion.div 
                    layoutId="nav-bg"
                    className="absolute inset-0 bg-white/10 rounded-2xl -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] font-black uppercase tracking-[0.05em] transition-colors duration-200',
                  isActive ? 'text-white' : 'text-textMuted'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
