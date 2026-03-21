import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Wallet {
  id: string;
  name: string;
  currency: string;
  balance: number;
  type: 'cash' | 'bank' | 'crypto';
}

interface Expense {
  id: string;
  amount: number;
  currency: string;
  convertedAmount: number;
  categoryId: string;
  walletId: string;
  date: string;
  note?: string;
}

interface UserState {
  wallets: Wallet[];
  expenses: Expense[];
  baseCurrency: string;
  addWallet: (wallet: Wallet) => void;
  addExpense: (expense: Expense) => void;
  setBaseCurrency: (currency: string) => void;
}

export const useStore = create<UserState>()(
  persist(
    (set) => ({
      wallets: [],
      expenses: [],
      baseCurrency: 'USD',
      addWallet: (wallet) => set((state) => ({ wallets: [...state.wallets, wallet] })),
      addExpense: (expense) => set((state) => ({ expenses: [...state.expenses, expense] })),
      setBaseCurrency: (currency) => set({ baseCurrency: currency }),
    }),
    {
      name: 'dmoney-storage',
    }
  )
);
