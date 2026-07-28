'use client';

import { Target } from 'lucide-react';
import { SavingsGoalWidget } from './savings-goal-widget';

export function GoalsView() {
  return (
    <div className="flex flex-col gap-5 pb-32 max-w-4xl">
      <header className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-violet-400/12 border border-violet-300/15 flex items-center justify-center text-violet-300">
          <Target size={20} />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">Цели</h1>
          <p className="text-xs text-white/40 mt-1">Планы на работу, накопления и инвестиции</p>
        </div>
      </header>
      <SavingsGoalWidget showRewards />
    </div>
  );
}
