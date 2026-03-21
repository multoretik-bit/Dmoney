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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#020617]/90 backdrop-blur-xl border-t border-white/5 pb-safe rounded-t-[32px]">
      <div className="flex justify-around items-center h-20 px-6 max-w-5xl mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-full h-full gap-1 tap-highlight-transparent"
            >
              <div
                className={cn(
                  'p-2 rounded-2xl transition-all duration-300 relative z-10 flex flex-col items-center gap-1',
                  isActive ? 'text-accent' : 'text-white/20'
                )}
              >
                <Icon strokeWidth={isActive ? 3 : 2} size={24} />
                <span
                  className={cn(
                    'text-[9px] font-black uppercase tracking-widest transition-colors duration-200',
                    isActive ? 'text-accent' : 'text-white/20'
                  )}
                >
                  {item.label}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="nav-bg"
                    className="absolute -inset-1 bg-accent/5 rounded-2xl -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
