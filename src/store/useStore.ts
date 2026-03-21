import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WalletType = 'spending' | 'saving' | 'debt';

export interface Category {
  id: string;
  parentId?: string; // NULL if it's a Head Category
  name: string;
  icon: string;
  color: string;
  budgetLimit?: number;
}

export interface Wallet {
  id: string;
  name: string;
  currency: string;
  displayCurrency?: string; // The currency to show balance in
  balance: number;
  type: WalletType;
  icon?: string;
  color?: string;
}

export interface Expense {
  id: string;
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  walletAmount: number;
  exchangeRate: number;
  categoryId: string;
  walletId: string;
  date: string;
}

export interface UserPreferences {
  baseCurrency: string;
  savedColors: string[];
}

interface UserState {
  preferences: UserPreferences;
  categories: Category[];
  wallets: Wallet[];
  expenses: Expense[];

  // Actions
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  addSavedColor: (color: string) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  setCategoryLimit: (id: string, limit: number) => void;
  deleteCategory: (id: string) => void;
  addWallet: (wallet: Wallet) => void;
  updateWallet: (id: string, updates: Partial<Wallet>) => void;
  updateWalletBalance: (walletId: string, amountChange: number) => void;
  addExpense: (expense: Expense) => void;
}

export const useStore = create<UserState>()(
  persist(
    (set) => ({
      preferences: {
        baseCurrency: 'USD',
        savedColors: ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'],
      },
      categories: [
        { id: '1', name: 'Дом', icon: '🏠', color: '#8b5cf6' }, // Head
        { id: '1-1', parentId: '1', name: 'Оплата квартиры', icon: '🔑', color: '#8b5cf6' },
        { id: '1-2', parentId: '1', name: 'Интернет и телефон', icon: '📱', color: '#8b5cf6' },
        { id: '2', name: 'Еда и напитки', icon: '🍔', color: '#f59e0b' }, // Head
        { id: '2-1', parentId: '2', name: 'Продукты', icon: '🛒', color: '#f59e0b' },
        { id: '2-2', parentId: '2', name: 'Рестораны', icon: '🍕', color: '#f59e0b' },
      ],
      wallets: [],
      expenses: [],

      updatePreferences: (prefs) => set((state) => ({ preferences: { ...state.preferences, ...prefs } })),
      addSavedColor: (color) => set((state) => {
        if (state.preferences.savedColors.includes(color)) return state;
        return { preferences: { ...state.preferences, savedColors: [...state.preferences.savedColors, color] } };
      }),
      addCategory: (category) => set((state) => ({ categories: [...state.categories, category] })),
      updateCategory: (id, updates) => set((state) => ({
        categories: state.categories.map(c => c.id === id ? { ...c, ...updates } : c)
      })),
      setCategoryLimit: (id: string, limit: number) => set((state) => ({
        categories: state.categories.map(c => c.id === id ? { ...c, budgetLimit: limit } : c)
      })),
      deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter(c => c.id !== id && c.parentId !== id)
      })),
      addWallet: (wallet) => set((state) => ({ wallets: [...state.wallets, wallet] })),
      updateWallet: (id, updates) => set((state) => ({
        wallets: state.wallets.map(w => w.id === id ? { ...w, ...updates } : w)
      })),
      updateWalletBalance: (walletId, amountChange) => set((state) => ({
        wallets: state.wallets.map(w => w.id === walletId ? { ...w, balance: w.balance + amountChange } : w)
      })),
      addExpense: (expense) => set((state) => {
        const updatedWallets = state.wallets.map(w => {
          if (w.id === expense.walletId) {
            return { ...w, balance: w.balance - expense.walletAmount };
          }
          return w;
        });
        return { expenses: [...state.expenses, expense], wallets: updatedWallets };
      }),
    }),
    {
      name: 'dmoney-storage',
    }
  )
);
