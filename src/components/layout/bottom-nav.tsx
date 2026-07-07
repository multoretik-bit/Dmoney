'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, PieChart, Wallet, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { href: '/expenses', label: 'История', icon: LayoutGrid },
  { href: '/wallets', label: 'Капиталы', icon: Wallet },
  { href: '/budget', label: 'Бюджет', icon: PieChart },
  { href: '/categories', label: 'Настройки', icon: Settings2 },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="mx-4 mb-4 max-w-xl xl:max-w-5xl xl:mx-auto">
        <div
          className="flex justify-around items-center h-[68px] px-2 rounded-[26px]"
          style={{
            background: 'linear-gradient(145deg, rgba(13,22,38,0.97) 0%, rgba(9,14,26,0.97) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06) inset',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center justify-center flex-1 h-full gap-1"
              >
                <div className="relative flex flex-col items-center gap-1 px-4 py-2 rounded-2xl">
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        background: 'rgba(59,130,246,0.12)',
                        border: '1px solid rgba(59,130,246,0.2)',
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                    />
                  )}
                  <Icon
                    size={21}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    className={cn(
                      'relative z-10 transition-colors duration-200',
                      isActive ? 'text-blue-400' : 'text-white/25'
                    )}
                  />
                  <span
                    className={cn(
                      'relative z-10 text-[9px] font-black uppercase tracking-widest transition-colors duration-200',
                      isActive ? 'text-blue-400' : 'text-white/20'
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
