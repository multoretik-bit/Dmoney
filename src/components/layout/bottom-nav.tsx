'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CreditCard, PieChart, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { href: '/expenses', label: 'Траты', icon: CreditCard },
  { href: '/budget', label: 'Бюджет', icon: PieChart },
  { href: '/wallets', label: 'Кошельки', icon: Wallet },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-t border-white/5 pb-safe">
      <div className="flex justify-around items-center h-20 px-6 max-w-md mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-16 h-full gap-1 tap-highlight-transparent"
            >
              <div
                className={cn(
                  'p-2 rounded-2xl transition-colors duration-200',
                  isActive ? 'text-accent' : 'text-textMuted hover:text-white'
                )}
              >
                <Icon strokeWidth={isActive ? 2.5 : 2} size={24} />
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors duration-200',
                  isActive ? 'text-accent' : 'text-textMuted'
                )}
              >
                {item.label}
              </span>
              
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute top-1 w-8 h-1 bg-accent rounded-full shadow-[0_0_8px_rgba(61,169,252,0.6)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
