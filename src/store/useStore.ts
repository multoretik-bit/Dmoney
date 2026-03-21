import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Category {
  id: string;
  parentId?: string;
  name: string;
  icon: string;
  color: string;
  budgetLimit?: number;
}

export interface Portfolio {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Folder {
  id: string;
  portfolioId: string;
  name: string;
  color?: string;
}

export interface Wallet {
  id: string;
  portfolioId: string;
  folderId?: string;
  name: string;
  currency: string;
  displayCurrency?: string;
  balance: number;
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
  portfolios: Portfolio[];
  folders: Folder[];
  wallets: Wallet[];
  expenses: Expense[];

  // Actions
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  addSavedColor: (color: string) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  
  addPortfolio: (p: Portfolio) => void;
  updatePortfolio: (id: string, updates: Partial<Portfolio>) => void;
  deletePortfolio: (id: string) => void;

  addFolder: (f: Folder) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;

  addWallet: (wallet: Wallet) => void;
  updateWallet: (id: string, updates: Partial<Wallet>) => void;
  updateWalletBalance: (walletId: string, amountChange: number) => void;
  deleteWallet: (id: string) => void;

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
        { id: '1', name: 'Дом', icon: '🏠', color: '#8b5cf6' },
        { id: '1-1', parentId: '1', name: 'Оплата квартиры', icon: '🔑', color: '#8b5cf6' },
        { id: '2', name: 'Еда и напитки', icon: '🍔', color: '#f59e0b' },
      ],
      portfolios: [
        { id: 'p1', name: 'Personal Capital', color: '#3b82f6', icon: '👤' },
        { id: 'p2', name: 'Business', color: '#8b5cf6', icon: '💼' },
      ],
      folders: [],
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
      deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter(c => c.id !== id && c.parentId !== id)
      })),

      addPortfolio: (p) => set((state) => ({ portfolios: [...state.portfolios, p] })),
      updatePortfolio: (id, updates) => set((state) => ({
        portfolios: state.portfolios.map(p => p.id === id ? { ...p, ...updates } : p)
      })),
      deletePortfolio: (id) => set((state) => ({
        portfolios: state.portfolios.filter(p => p.id !== id),
        folders: state.folders.filter(f => f.portfolioId !== id),
        wallets: state.wallets.filter(w => w.portfolioId !== id)
      })),

      addFolder: (f) => set((state) => ({ folders: [...state.folders, f] })),
      updateFolder: (id, updates) => set((state) => ({
        folders: state.folders.map(f => f.id === id ? { ...f, ...updates } : f)
      })),
      deleteFolder: (id) => set((state) => ({
        folders: state.folders.filter(f => f.id !== id),
        wallets: state.wallets.map(w => w.folderId === id ? { ...w, folderId: undefined } : w)
      })),

      addWallet: (wallet) => set((state) => ({ wallets: [...state.wallets, wallet] })),
      updateWallet: (id, updates) => set((state) => ({
        wallets: state.wallets.map(w => w.id === id ? { ...w, ...updates } : w)
      })),
      updateWalletBalance: (walletId, amountChange) => set((state) => ({
        wallets: state.wallets.map(w => w.id === walletId ? { ...w, balance: w.balance + amountChange } : w)
      })),
      deleteWallet: (id) => set((state) => ({
        wallets: state.wallets.filter(w => w.id !== id),
        expenses: state.expenses.filter(e => e.walletId !== id)
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
