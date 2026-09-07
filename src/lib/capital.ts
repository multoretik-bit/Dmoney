import type { DailyCapitalEntry, Portfolio, Wallet } from '@/store/useStore';
import { convertAmount } from './exchange';

export function getTotalCapital(wallets: Wallet[], currency: string): number {
  return wallets.reduce((sum, wallet) => sum + convertAmount(Number(wallet.balance || 0), wallet.currency, currency), 0);
}

// Past days are snapshots; today's point always reflects the current wallets
// and rates, even before the history has been saved or synchronized.
export function getLiveCapitalHistory(
  history: DailyCapitalEntry[], wallets: Wallet[], portfolios: Portfolio[], currency: string,
  today = new Date().toLocaleDateString('sv'),
): DailyCapitalEntry[] {
  const portfolioTotals: Record<string, number> = {};
  for (const portfolio of portfolios) {
    portfolioTotals[portfolio.id] = getTotalCapital(wallets.filter(wallet => wallet.portfolioId === portfolio.id), currency);
  }
  return [...history.filter(entry => entry.date !== today), {
    date: today,
    overallTotal: getTotalCapital(wallets, currency),
    portfolioTotals,
    currency,
  }].sort((a, b) => a.date.localeCompare(b.date));
}
