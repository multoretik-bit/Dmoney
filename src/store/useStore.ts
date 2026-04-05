import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface Category {
  id: string;
  parentId?: string;
  name: string;
  icon: string;
  color: string;
  budgetLimit?: number;
  sortOrder: number;
  excludeFromBudget?: boolean;
}

export interface Portfolio {
  id: string;
  name: string;
  color: string;
  icon: string;
  sortOrder: number;
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
  targetAmount?: number;
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
  isWork?: boolean;
}

export interface UserPreferences {
  baseCurrency: string;
  savedColors: string[];
  workBudgetLimit?: number;
}

interface UserState {
  preferences: UserPreferences;
  categories: Category[];
  portfolios: Portfolio[];
  folders: Folder[];
  wallets: Wallet[];
  expenses: Expense[];
  user: User | null;
  isAuthModalOpen: boolean;
  isReordering: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setAuthModalOpen: (open: boolean) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  addSavedColor: (color: string) => void;
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  setCategoryLimit: (id: string, limit: number) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  addPortfolio: (p: Portfolio) => void;
  updatePortfolio: (id: string, updates: Partial<Portfolio>) => void;
  deletePortfolio: (id: string) => Promise<void>;
  updatePortfolioOrder: (id: string, direction: 'left' | 'right') => Promise<void>;

  addFolder: (f: Folder) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => Promise<void>;

  addWallet: (wallet: Wallet) => void;
  updateWallet: (id: string, updates: Partial<Wallet>) => void;
  updateWalletBalance: (walletId: string, amountChange: number) => void;
  deleteWallet: (id: string) => Promise<void>;

  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, expense: Expense) => void;
  deleteExpense: (id: string) => void;
  pullData: () => Promise<void>;
  pushData: () => Promise<void>;
  updateCategoryOrder: (id: string, direction: 'up' | 'down') => Promise<void>;
}

export const useStore = create<UserState>()(
  persist(
    (set) => ({
      preferences: {
        baseCurrency: 'USD',
        savedColors: ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'],
      },
      categories: [
        { id: '3f6e8c1b-7a2d-4e9b-9c1a-1a2b3c4d5e6f', name: 'Дом', icon: '🏠', color: '#8b5cf6', sortOrder: 0 },
        { id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', parentId: '3f6e8c1b-7a2d-4e9b-9c1a-1a2b3c4d5e6f', name: 'Оплата квартиры', icon: '🔑', color: '#8b5cf6', sortOrder: 0 },
        { id: 'f1e2d3c4-b5a6-4c7d-8e9f-0a1b2c3d4e5f', name: 'Еда и напитки', icon: '🍔', color: '#f59e0b', sortOrder: 1 },
      ],
      portfolios: [
        { id: '7d8e9f0a-1b2c-3d4e-5f6a-7b8c9d0e1f2a', name: 'Main Capital', color: '#3b82f6', icon: '🏦', sortOrder: 0 },
      ],
      folders: [],
      wallets: [],
      expenses: [],
      user: null,
      isAuthModalOpen: false,
      isReordering: false,

      setUser: (user) => set({ user }),
      setAuthModalOpen: (open) => set({ isAuthModalOpen: open }),
      updatePreferences: (prefs) => set((state) => ({ preferences: { ...state.preferences, ...prefs } })),
      addSavedColor: (color) => set((state) => {
        if (state.preferences.savedColors.includes(color)) return state;
        return { preferences: { ...state.preferences, savedColors: [...state.preferences.savedColors, color] } };
      }),

      addCategory: async (category) => {
        set((state) => ({ categories: [...state.categories, category] }));
        const { user } = useStore.getState();
        if (user) {
          const { error } = await supabase.from('categories').upsert({
             id: category.id,
             user_id: user.id,
             parent_id: category.parentId || null,
             name: category.name,
             icon: category.icon,
             color: category.color,
             budget_limit: category.budgetLimit,
             sort_order: category.sortOrder
          }, { onConflict: 'id' });
          if (error) console.error('❌ Sync error (addCategory):', error);
        }
      },

      updateCategory: async (id, updates) => {
        set((state) => ({
          categories: state.categories.map(c => c.id === id ? { ...c, ...updates } : c)
        }));
        
        const state = useStore.getState();
        if (state.user) {
          const cat = state.categories.find(c => c.id === id);
          if (cat) {
            console.log('📤 Updating category in Supabase:', cat.name);
            const { error } = await supabase.from('categories').upsert({
              id: cat.id,
              user_id: state.user.id,
              parent_id: cat.parentId || null,
              name: cat.name,
              icon: cat.icon,
              color: cat.color,
              budget_limit: cat.budgetLimit,
              sort_order: cat.sortOrder
            }, { onConflict: 'id' });
            if (error) console.error('❌ Sync error (updateCategory):', error);
          }
        }
      },

      setCategoryLimit: async (id, limit) => {
        await useStore.getState().updateCategory(id, { budgetLimit: limit });
      },

      deleteCategory: async (id) => {
        const { user } = useStore.getState();
        if (user) {
          await supabase.from('categories').delete().eq('id', id);
        }
        set((state) => ({
          categories: state.categories.filter(c => c.id !== id && c.parentId !== id)
        }));
      },

      updateCategoryOrder: async (id, direction) => {
        const state = useStore.getState();
        if (state.isReordering) return;
        set({ isReordering: true });

        try {
          const category = state.categories.find(c => c.id === id);
          if (!category) return;

          // Get siblings and sort them by current order (or index as tie-breaker)
          const siblings = state.categories
            .filter(c => (c.parentId || undefined) === (category.parentId || undefined))
            .sort((a, b) => {
               if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
               return a.id.localeCompare(b.id); // Tie-breaker
            });

          const currentIndex = siblings.findIndex(s => s.id === id);
          const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

          if (newIndex < 0 || newIndex >= siblings.length) return;

          // Create a new array of siblings with swapped items
          const newSiblings = [...siblings];
          const temp = newSiblings[currentIndex];
          newSiblings[currentIndex] = newSiblings[newIndex];
          newSiblings[newIndex] = temp;

          // Assign clean sort orders 0, 1, 2...
          const updatedWithNewOrders = newSiblings.map((s, idx) => ({
             ...s,
             sortOrder: idx
          }));

          // Merge back into main categories list
          const updatedCategories = state.categories.map(c => {
             const updatedSibling = updatedWithNewOrders.find(u => u.id === c.id);
             return updatedSibling || c;
          });

          set({ categories: updatedCategories });
          
          // Push all updated siblings to Supabase in a single batch
          if (state.user) {
             console.log('📤 Updating sequence in Supabase...', updatedWithNewOrders.map(s => s.name));
             const { error } = await supabase.from('categories').upsert(updatedWithNewOrders.map(s => ({
                id: s.id,
                user_id: state.user!.id,
                parent_id: s.parentId || null,
                name: s.name,
                icon: s.icon,
                color: s.color,
                budget_limit: s.budgetLimit,
                sort_order: s.sortOrder
             })), { onConflict: 'id' });
             if (error) console.error('❌ Sync error (updateCategoryOrder):', error);
          }
        } finally {
          set({ isReordering: false });
        }
      },

      addPortfolio: (p) => set((state) => ({ portfolios: [...state.portfolios, p] })),
      updatePortfolio: (id, updates) => set((state) => ({
        portfolios: state.portfolios.map(p => p.id === id ? { ...p, ...updates } : p)
      })),
      updatePortfolioOrder: async (id, direction) => {
        const state = useStore.getState();
        if (state.isReordering) return;
        set({ isReordering: true });

        try {
          const portfolio = state.portfolios.find(p => p.id === id);
          if (!portfolio) return;

          const sortedPortfolios = [...state.portfolios].sort((a, b) => {
             if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
             return a.id.localeCompare(b.id);
          });

          const currentIndex = sortedPortfolios.findIndex(p => p.id === id);
          const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;

          if (newIndex < 0 || newIndex >= sortedPortfolios.length) return;

          const newPortfoliosOrdered = [...sortedPortfolios];
          const temp = newPortfoliosOrdered[currentIndex];
          newPortfoliosOrdered[currentIndex] = newPortfoliosOrdered[newIndex];
          newPortfoliosOrdered[newIndex] = temp;

          const updatedWithNewOrders = newPortfoliosOrdered.map((p, idx) => ({
             ...p,
             sortOrder: idx
          }));

          set({ portfolios: updatedWithNewOrders });
          
          if (state.user) {
             const { error } = await supabase.from('portfolios').upsert(updatedWithNewOrders.map(p => ({
                id: p.id,
                user_id: state.user!.id,
                name: p.name,
                color: p.color,
                icon: p.icon,
                sort_order: p.sortOrder
             })), { onConflict: 'id' });
             if (error) console.error('❌ Sync error (updatePortfolioOrder):', error);
          }
        } finally {
          set({ isReordering: false });
        }
      },
      deletePortfolio: async (id) => {
        const { user } = useStore.getState();
        if (user) {
          await supabase.from('portfolios').delete().eq('id', id);
        }
        set((state) => ({
          portfolios: state.portfolios.filter(p => p.id !== id),
          folders: state.folders.filter(f => f.portfolioId !== id),
          wallets: state.wallets.filter(w => w.portfolioId !== id)
        }));
      },

      addFolder: (f) => set((state) => ({ folders: [...state.folders, f] })),
      updateFolder: (id, updates) => set((state) => ({
        folders: state.folders.map(f => f.id === id ? { ...f, ...updates } : f)
      })),
      deleteFolder: async (id) => {
        const { user } = useStore.getState();
        if (user) {
          await supabase.from('folders').delete().eq('id', id);
        }
        set((state) => ({
          folders: state.folders.filter(f => f.id !== id),
          wallets: state.wallets.map(w => w.folderId === id ? { ...w, folderId: undefined } : w)
        }));
      },

      addWallet: (wallet) => set((state) => ({ wallets: [...state.wallets, wallet] })),
      updateWallet: (id, updates) => set((state) => ({
        wallets: state.wallets.map(w => w.id === id ? { ...w, ...updates } : w)
      })),
      updateWalletBalance: (walletId, amountChange) => set((state) => ({
        wallets: state.wallets.map(w => w.id === walletId ? { ...w, balance: w.balance + amountChange } : w)
      })),
      deleteWallet: async (id) => {
        const { user } = useStore.getState();
        if (user) {
          await supabase.from('wallets').delete().eq('id', id);
        }
        set((state) => ({
          wallets: state.wallets.filter(w => w.id !== id),
          expenses: state.expenses.filter(e => e.walletId !== id)
        }));
      },
      addExpense: (expense) => set((state) => {
        const updatedWallets = state.wallets.map(w => {
          if (w.id === expense.walletId) {
            return { ...w, balance: w.balance - expense.walletAmount };
          }
          return w;
        });
        return { expenses: [...state.expenses, expense], wallets: updatedWallets };
      }),
      deleteExpense: (id) => set((state) => {
        const expense = state.expenses.find(e => e.id === id);
        if (!expense) return state;
        
        const updatedWallets = state.wallets.map(w => {
          if (w.id === expense.walletId) {
            return { ...w, balance: w.balance + expense.walletAmount };
          }
          return w;
        });
        
        return { 
          expenses: state.expenses.filter(e => e.id !== id),
          wallets: updatedWallets 
        };
      }),
      updateExpense: (id, newExpense) => set((state) => {
        const oldExpense = state.expenses.find(e => e.id === id);
        if (!oldExpense) return state;

        // "Undo" old expense balance
        let intermediateWallets = state.wallets.map(w => {
          if (w.id === oldExpense.walletId) {
            return { ...w, balance: w.balance + oldExpense.walletAmount };
          }
          return w;
        });

        // "Apply" new expense balance
        const updatedWallets = intermediateWallets.map(w => {
          if (w.id === newExpense.walletId) {
            return { ...w, balance: w.balance - newExpense.walletAmount };
          }
          return w;
        });

        return {
          expenses: state.expenses.map(e => e.id === id ? newExpense : e),
          wallets: updatedWallets
        };
      }),

      pullData: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
          console.log('🔄 Pulling data from Supabase...');
          // Fetch all in parallel
          const [cats, ports, folds, walls, exps, prefs] = await Promise.all([
            supabase.from('categories').select('*'),
            supabase.from('portfolios').select('*'),
            supabase.from('folders').select('*'),
            supabase.from('wallets').select('*'),
            supabase.from('transactions').select('*'),
            supabase.from('user_preferences').select('*').eq('user_id', user.id).single(),
          ]);

          if (cats.data && cats.data.length > 0) {
            console.log(`📥 Fetched ${cats.data.length} categories from Supabase`);
            set({ categories: cats.data.map((c: any) => ({
              id: c.id,
              parentId: c.parent_id || undefined,
              name: c.name,
              icon: c.icon,
              color: c.color,
              budgetLimit: c.budget_limit,
              sortOrder: c.sort_order || 0,
              excludeFromBudget: c.exclude_from_budget
            })) });
          } else if (cats.data && cats.data.length === 0 && useStore.getState().categories.length > 0) {
            console.log('⚠️ Supabase returned 0 categories, keeping local state to prevent accidental wipe.');
            // Only overwrite if we are absolutely sure the user has 0 categories in cloud (e.g. fresh account)
            // For now, let's keep local state if cloud is empty but local is not.
          }

          if (ports.data) set({ portfolios: ports.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            color: p.color,
            icon: p.icon,
            sortOrder: p.sort_order || 0
          })) });

          if (folds.data) set({ folders: folds.data.map((f: any) => ({
            id: f.id,
            portfolioId: f.portfolio_id,
            name: f.name,
            color: f.color
          })) });

          if (walls.data) set({ wallets: walls.data.map((w: any) => ({
            id: w.id,
            portfolioId: w.portfolio_id,
            folderId: w.folder_id,
            name: w.name,
            currency: w.currency,
            balance: w.balance,
            icon: w.icon,
            color: w.color,
            targetAmount: w.target_amount
          })) });

          if (exps.data) set({ expenses: exps.data.map((e: any) => ({
             id: e.id,
             originalAmount: e.amount,
             originalCurrency: e.currency,
             convertedAmount: e.converted_amount,
             walletAmount: e.wallet_amount,
             exchangeRate: e.exchange_rate,
             categoryId: e.category_id,
             walletId: e.wallet_id,
             date: e.date,
             isWork: e.is_work
          })) });

          if (prefs.data) set({ preferences: {
            baseCurrency: prefs.data.base_currency,
            savedColors: prefs.data.saved_colors || [],
            workBudgetLimit: prefs.data.work_budget_limit || 0
          }});

          console.log('✅ Data pulled successfully');
        } catch (error) {
          console.error('❌ Error pulling data:', error);
        }
      },

      pushData: async () => {
         const { data: { user } } = await supabase.auth.getUser();
         if (!user) return;
         
         const state = useStore.getState();
         
         try {
            console.log('☁️ Pushing data to Supabase...');
            const results = await Promise.all([
               supabase.from('categories').upsert(state.categories.map(c => ({
                  id: c.id,
                  user_id: user.id,
                  parent_id: c.parentId || null,
                  name: c.name,
                  icon: c.icon,
                  color: c.color,
                  budget_limit: c.budgetLimit,
                  sort_order: c.sortOrder || 0,
                  exclude_from_budget: c.excludeFromBudget || false
               })), { onConflict: 'id' }),
               supabase.from('portfolios').upsert(state.portfolios.map(p => ({
                  id: p.id,
                  user_id: user.id,
                  name: p.name,
                  color: p.color,
                  icon: p.icon,
                  sort_order: p.sortOrder || 0
               })), { onConflict: 'id' }),
               supabase.from('folders').upsert(state.folders.map(f => ({
                  id: f.id,
                  user_id: user.id,
                  portfolio_id: f.portfolioId,
                  name: f.name,
                  color: f.color
               })), { onConflict: 'id' }),
               supabase.from('wallets').upsert(state.wallets.map(w => ({
                  id: w.id,
                  user_id: user.id,
                  portfolio_id: w.portfolioId,
                  folder_id: w.folderId,
                  name: w.name,
                  currency: w.currency,
                  balance: w.balance,
                  icon: w.icon,
                  color: w.color,
                  target_amount: w.targetAmount
               })), { onConflict: 'id' }),
               supabase.from('transactions').upsert(state.expenses.map(e => ({
                  id: e.id,
                  user_id: user.id,
                  category_id: e.categoryId,
                  wallet_id: e.walletId,
                  amount: e.originalAmount,
                  currency: e.originalCurrency,
                  converted_amount: e.convertedAmount,
                  wallet_amount: e.walletAmount,
                  exchange_rate: e.exchangeRate,
                  date: e.date,
                  is_work: e.isWork || false
               })), { onConflict: 'id' }),
               supabase.from('user_preferences').upsert({
                  user_id: user.id,
                  base_currency: state.preferences.baseCurrency,
                  saved_colors: state.preferences.savedColors,
                  work_budget_limit: state.preferences.workBudgetLimit || 0,
                  updated_at: new Date().toISOString()
               }, { onConflict: 'user_id' })
            ]);

            const firstError = results.find(r => r.error)?.error;
            if (firstError) {
               console.error('❌ Push error:', firstError);
               throw firstError;
            }

            console.log('✅ Data pushed successfully');
         } catch (error) {
            console.error('❌ Error pushing data:', error);
            throw error;
         }
      }
    }),
    {
      name: 'dmoney-storage',
    }
  )
);
