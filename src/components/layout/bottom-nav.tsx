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
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="mx-4 mb-4 max-w-xl xl:max-w-5xl xl:mx-auto">
        <div className="flex justify-around items-center h-[64px] px-2 rounded-2xl surface shadow-card-lg backdrop-blur-xl">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center justify-center flex-1 h-full gap-1"
              >
                <div className="relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl">
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-xl bg-accent-dim"
                      transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                    />
                  )}
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.25 : 1.75}
                    className={cn(
                      'relative z-10 transition-colors duration-200',
                      isActive ? 'text-accent-light' : 'text-white/35'
                    )}
                  />
                  <span
                    className={cn(
                      'relative z-10 text-[10px] font-medium transition-colors duration-200',
                      isActive ? 'text-accent-light' : 'text-white/35'
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
