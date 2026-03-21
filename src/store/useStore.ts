import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WalletFolder {
  id: string;
  name: string;
  order: number;
}

export interface CategoryFolder {
  id: string;
  name: string;
  order: number;
}

export interface Category {
  id: string;
  folderId: string;
  name: string;
  icon: string;
  color: string;
}

export interface Wallet {
  id: string;
  folderId?: string;
  name: string;
  currency: string;
  balance: number; // Stored in its own currency
  type: 'cash' | 'bank' | 'crypto';
  icon?: string;
  color?: string;
}

export interface Expense {
  id: string;
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number; // Amount in the user's baseCurrency
  walletAmount: number; // Amount actually deducted from the wallet in the wallet's currency
  exchangeRate: number; // Resulting rate for UI display if needed
  categoryId: string;
  walletId: string;
  date: string;
  note?: string;
}

export interface UserPreferences {
  baseCurrency: string;
  savedColors: string[];
}

interface UserState {
  preferences: UserPreferences;
  walletFolders: WalletFolder[];
  categoryFolders: CategoryFolder[];
  categories: Category[];
  wallets: Wallet[];
  expenses: Expense[];

  // Actions
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  addWalletFolder: (folder: WalletFolder) => void;
  addCategoryFolder: (folder: CategoryFolder) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
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
        savedColors: ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'],
      },
      walletFolders: [
        { id: 'default', name: 'Личное', order: 0 }
      ],
      categoryFolders: [
        { id: 'default', name: 'Основные', order: 0 }
      ],
      categories: [
        { id: '1', folderId: 'default', name: 'Еда', icon: '🍔', color: '#f59e0b' },
        { id: '2', folderId: 'default', name: 'Транспорт', icon: '🚕', color: '#3b82f6' },
        { id: '3', folderId: 'default', name: 'Жильё', icon: '🏠', color: '#8b5cf6' },
      ],
      wallets: [],
      expenses: [],

      updatePreferences: (prefs) => set((state) => ({ preferences: { ...state.preferences, ...prefs } })),
      addWalletFolder: (folder) => set((state) => ({ walletFolders: [...state.walletFolders, folder] })),
      addCategoryFolder: (folder) => set((state) => ({ categoryFolders: [...state.categoryFolders, folder] })),
      addCategory: (category) => set((state) => ({ categories: [...state.categories, category] })),
      updateCategory: (id, updates) => set((state) => ({
        categories: state.categories.map(c => c.id === id ? { ...c, ...updates } : c)
      })),
      deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter(c => c.id !== id)
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
