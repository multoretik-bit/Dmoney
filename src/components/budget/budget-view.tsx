'use client';

import { useState, useMemo } from 'react';
import { useStore, Category, Expense } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useDragScroll } from '@/hooks/useDragScroll';
import { 
  Settings, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  AlertCircle, 
  Target, 
  Activity,
  Edit2,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddExpenseModal } from '../expenses/add-expense-modal';
import { AddCategoryModal } from '../categories/add-category-modal';

export function BudgetView() {
  const { categories, expenses, setCategoryLimit, updateCategory, preferences, updateCategoryOrder } = useStore();
  const [viewMode, setViewMode] = useState<'plan' | 'execute'>('execute');
  const [expandedBlocks, setExpandedBlocks] = useState<string[]>([]);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [initialParentId, setInitialParentId] = useState<string | undefined>(undefined);
  const [isSelectingExisting, setIsSelectingExisting] = useState<string | null>(null); // blockId
  const { ref: dragScrollRef, props: dragScrollProps } = useDragScroll();

  const currentMonthStr = useMemo(() => new Date().toISOString().substring(0, 7), []);
  const currentMonthName = useMemo(() => {
    const name = new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    return name.charAt(0).toUpperCase() + name.slice(1);
  }, []);

  const currentMonthExpenses = useMemo(() => 
    expenses.filter(e => e.date.startsWith(currentMonthStr)),
  [expenses, currentMonthStr]);

  const openAddBlock = () => {
    setEditingCategory(null);
    setInitialParentId(undefined);
    setIsAddCategoryOpen(true);
  };

  const openAddCategory = (parentId: string) => {
    setEditingCategory(null);
    setInitialParentId(parentId);
    setIsAddCategoryOpen(true);
  };

  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsAddCategoryOpen(true);
  };

  const toggleBlock = (id: string) => {
    setExpandedBlocks(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  // Spending calculations
  const spendingByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    currentMonthExpenses.forEach(e => {
      map[e.categoryId] = (map[e.categoryId] || 0) + e.convertedAmount;
    });
    return map;
  }, [currentMonthExpenses]);

  // Group categories into "Blocks"
  const headCategories = useMemo(() => {
    return categories
      .filter(c => {
        if (c.parentId) return false;
        
        // Show block if it has a limit itself
        const hasLimit = (c.budgetLimit || 0) > 0;
        
        // OR if it has any children with a limit
        const hasChildrenWithLimit = categories.some(child => 
          child.parentId === c.id && (child.budgetLimit || 0) > 0
        );

        // EMERGENCY: Show block if it has ANY children (regardless of limit) for visibility
        const hasAnyChildren = categories.some(child => child.parentId === c.id);
        
        return hasLimit || hasChildrenWithLimit || hasAnyChildren;
      })
      .sort((a, b) => {
        if ((a.sortOrder || 0) !== (b.sortOrder || 0)) return (a.sortOrder || 0) - (b.sortOrder || 0);
        return a.id.localeCompare(b.id);
      });
  }, [categories]);
  
  const categoriesByBlock = useMemo(() => {
    const map: Record<string, Category[]> = {};
    headCategories.forEach(head => {
      map[head.id] = categories
        .filter(c => c.parentId === head.id && (c.budgetLimit || 0) > 0)
        .sort((a, b) => {
          if ((a.sortOrder || 0) !== (b.sortOrder || 0)) return (a.sortOrder || 0) - (b.sortOrder || 0);
          return a.id.localeCompare(b.id);
        });
    });
    return map;
  }, [categories, headCategories]);
  
  // Categories that are NOT blocks themselves
  const availableCategories = useMemo(() => 
    categories.filter(c => {
      // It's a "Category" if it can have a parent or it was intended as one
      // Let's say all items are categories EXCEPT those that already have sub-items (they are blocks)
      const hasSubItems = categories.some(child => child.parentId === c.id);
      return !hasSubItems;
    }), 
  [categories]);

  const addExistingToBlock = (categoryId: string, blockId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    if (cat) {
      console.log(`🔗 Linking category "${cat.name}" to block ID: ${blockId}`);
      updateCategory(cat.id, { ...cat, parentId: blockId });
    }
    setIsSelectingExisting(null);
  };

  const totalPlanned = useMemo(() => 
    categories.reduce((sum, c) => sum + (c.budgetLimit || 0), 0), 
  [categories]);

  const totalSpent = useMemo(() => 
    Object.values(spendingByCategory).reduce((sum, val) => sum + val, 0),
  [spendingByCategory]);

  const overallProgress = totalPlanned > 0 ? (totalSpent / totalPlanned) * 100 : 0;

  // Unplanned categories (not in a block or limit = 0 but has spending)
  const unplannedExpenses = useMemo(() => {
    const plannedIds = new Set(categories.filter(c => c.budgetLimit && c.budgetLimit > 0).map(c => c.id));
    return categories.filter(c => !plannedIds.has(c.id) && (spendingByCategory[c.id] || 0) > 0);
  }, [categories, spendingByCategory]);

  const unusedCategories = useMemo(() => {
    const plannedIds = new Set(categories.filter(c => c.budgetLimit && c.budgetLimit > 0).map(c => c.id));
    return categories.filter(c => {
      if (plannedIds.has(c.id)) return false;
      const hasSubItems = categories.some(child => child.parentId === c.id);
      // It's "unused" if it's a category (not a block container) and has no limit
      return !hasSubItems;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  const totalUnplannedSpent = useMemo(() => 
    unplannedExpenses.reduce((sum, c) => sum + (spendingByCategory[c.id] || 0), 0),
  [unplannedExpenses, spendingByCategory]);

  return (
    <div className="flex flex-col min-h-screen pb-40">
      {/* Header Summary - dHabits Minimalist Style */}
      <header className="py-12 flex flex-col items-center justify-center text-center gap-2">
        <h1 className="text-3xl font-black text-white px-6">
          {viewMode === 'execute' ? 'Траты и Бюджет' : 'Планирование'}
        </h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-2">
          {currentMonthName}
        </p>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
          {viewMode === 'execute' 
            ? `Использовано ${Math.round(overallProgress)}% от лимита` 
            : `Общий план: $${totalPlanned.toFixed(1)}`
          }
        </p>

        <div className="mt-8 bg-black/40 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
          <button 
            onClick={() => setViewMode('plan')}
            className={cn(
              "px-8 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
              viewMode === 'plan' ? "bg-white text-black shadow-xl" : "text-white/40"
            )}
          >
            План
          </button>
          <button 
            onClick={() => setViewMode('execute')}
            className={cn(
              "px-8 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
              viewMode === 'execute' ? "bg-white text-black shadow-xl" : "text-white/40"
            )}
          >
            Выполнение
          </button>
        </div>
      </header>

      <div className="p-6 flex flex-col gap-10 mt-4">
        {/* Budget Blocks */}
        <div className="flex flex-col gap-12">
          {headCategories.map(head => {
            const subCats = categoriesByBlock[head.id] || [];
            const isExpanded = expandedBlocks.includes(head.id);
            
            return (
              <div key={head.id} className="flex flex-col gap-6">
                <div 
                   className="px-4 py-3 flex justify-between items-center group cursor-pointer rounded-2xl transition-all" 
                   style={{ background: `${head.color}05` }}
                   onClick={() => toggleBlock(head.id)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: head.color }} />
                    <span className="text-[12px] font-black uppercase tracking-[0.4em]" style={{ color: head.color }}>{head.name}</span>
                    <div className="h-px flex-1 bg-white/5 group-hover:bg-white/10 transition-colors" />
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Reordering controls for block */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                       <button 
                         onClick={(e) => { e.stopPropagation(); updateCategoryOrder(head.id, 'up'); }}
                         className="p-1.5 text-white/20 hover:text-white"
                       >
                         <ArrowUp size={14} />
                       </button>
                       <button 
                         onClick={(e) => { e.stopPropagation(); updateCategoryOrder(head.id, 'down'); }}
                         className="p-1.5 text-white/20 hover:text-white"
                       >
                         <ArrowDown size={14} />
                       </button>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); openEditCategory(head); }}
                      className="text-white/20 hover:text-white transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <ChevronDown size={16} className={cn("text-white/20 transition-transform", !isExpanded && "-rotate-90")} />
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex flex-col gap-3"
                    >
                      {subCats.map((sub, catIndex) => {
                        const spent = spendingByCategory[sub.id] || 0;
                        const limit = sub.budgetLimit || 0;
                        const percent = limit > 0 ? (spent / limit) * 100 : 0;

                        return (
                          <div 
                            key={sub.id} 
                            style={{ 
                              borderLeft: `4px solid ${spent > limit && limit > 0 ? '#ef4444' : sub.color}`,
                              boxShadow: spent > limit && limit > 0 ? '0 0 20px rgba(239,68,68,0.1)' : `0 0 15px ${sub.color}10`
                            }}
                            className={cn(
                              "glass-card p-4 flex items-center justify-between group active:scale-[0.99] transition-all relative overflow-hidden",
                              spent > limit && limit > 0 && "border-l-red-500"
                            )}
                          >
                            <div className="flex items-center gap-4 flex-1">
                               <div className="w-12 h-12 bg-white/[0.03] rounded-2xl flex items-center justify-center text-2xl border border-white/5 shadow-inner">
                                  {sub.icon}
                               </div>
                               <div className="flex flex-col gap-1 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base font-black text-white leading-tight">{sub.name}</span>
                                    {spent > limit && limit > 0 && <AlertCircle size={14} className="text-red-500 animate-pulse" />}
                                  </div>
                                  <div className="flex items-center gap-2">
                                     <div className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden max-w-[120px]">
                                        <motion.div 
                                          className="h-full bg-white opacity-40" 
                                          initial={{ width: 0 }} animate={{ width: `${Math.min(percent, 100)}%` }}
                                        />
                                     </div>
                                     <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                                        {Math.round(percent)}%
                                     </span>
                                  </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                               <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all mr-2">
                                     <button 
                                       onClick={() => updateCategoryOrder(sub.id, 'up')}
                                       className="p-1 px-2 text-white/20 hover:text-white"
                                     >
                                       <ArrowUp size={12} />
                                     </button>
                                     <button 
                                       onClick={() => updateCategoryOrder(sub.id, 'down')}
                                       className="p-1 px-2 text-white/20 hover:text-white"
                                     >
                                       <ArrowDown size={12} />
                                     </button>
                                  </div>
                                  <span className="text-lg font-black text-white">${spent.toFixed(1)}</span>
                                  <button 
                                    onClick={() => openEditCategory(sub)}
                                    className="p-2 bg-white/5 rounded-xl text-white/20 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                               </div>
                               <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                                 из ${limit.toFixed(1)}
                               </span>
                            </div>
                          </div>
                        );
                      })}
                      
                      <div className="flex gap-3">
                        <button 
                           onClick={() => openAddCategory(head.id)}
                           className="flex-1 h-16 border-2 border-dashed border-white/5 rounded-[32px] flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/10 hover:text-white/40 hover:bg-white/5 transition-all"
                        >
                          <Plus size={14} strokeWidth={4} /> Добавить новую
                        </button>
                        <button 
                           onClick={() => setIsSelectingExisting(isSelectingExisting === head.id ? null : head.id)}
                           className="flex-1 h-16 border-2 border-dashed border-white/5 rounded-[32px] flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/10 hover:text-white/40 hover:bg-white/5 transition-all"
                        >
                          <ChevronDown size={14} className={cn("transition-transform", isSelectingExisting === head.id && "rotate-180")} /> Выбрать существующую
                        </button>
                      </div>

                      {isSelectingExisting === head.id && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                          className="bg-black/20 rounded-[32px] p-4 flex flex-col gap-2 border border-white/5"
                        >
                          {availableCategories.filter(c => c.id !== head.id && c.parentId !== head.id).length === 0 ? (
                            <span className="text-[10px] font-black uppercase text-white/10 text-center py-4">Нет доступных категорий</span>
                          ) : (
                            availableCategories.filter(c => c.id !== head.id && c.parentId !== head.id).map(c => (
                              <button 
                                key={c.id} 
                                onClick={() => addExistingToBlock(c.id, head.id)}
                                className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group"
                              >
                                <span>{c.icon}</span>
                                <span className="text-sm font-bold text-white/60 group-hover:text-white">{c.name}</span>
                              </button>
                            ))
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          
          <button 
            onClick={openAddBlock}
            className="h-24 glass-card rounded-[40px] border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 group hover:border-accent/40 transition-all"
          >
            <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
              <Plus size={24} strokeWidth={4} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 group-hover:text-accent transition-colors">Создать новый блок</span>
          </button>
        </div>

        {/* Unused / Hidden Categories section */}
        {unusedCategories.length > 0 && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-2">
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Неиспользуемые категории</span>
               <span className="text-[10px] font-black text-white/10">{unusedCategories.length}</span>
            </div>
            <div 
              ref={dragScrollRef}
              {...dragScrollProps}
              className="flex overflow-x-auto gap-4 pb-4 no-scrollbar active:cursor-grabbing"
            >
               {unusedCategories.map(cat => (
                 <button 
                  key={cat.id} 
                  onClick={() => openEditCategory(cat)}
                  className="flex-shrink-0 w-32 glass-card rounded-3xl p-5 border border-white/5 flex flex-col items-center gap-3 active:scale-95 transition-all"
                 >
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                       {cat.icon}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-white/40 text-center line-clamp-2">{cat.name}</span>
                 </button>
               ))}
            </div>
          </div>
        )}

        {/* Unplanned Section */}
        {totalUnplannedSpent > 0 && (
          <div className="flex flex-col gap-6">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 px-2">Внеплановые траты</span>
            <div className="glass-card rounded-[40px] border-l-4 border-red-500/50 p-8 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Activity size={80} className="text-red-500" />
               </div>
               <div className="flex justify-between items-center mb-6">
                  <div className="flex flex-col">
                    <span className="text-lg font-black text-red-500/80 tracking-tight">Всего вне плана</span>
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Not budgeted spending</span>
                  </div>
                  <span className="text-2xl font-black text-red-500">${totalUnplannedSpent.toFixed(1)}</span>
               </div>
               <div className="flex flex-col gap-4">
                  {unplannedExpenses.map(sub => (
                    <div key={sub.id} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center text-base border border-red-500/20">{sub.icon}</div>
                           <span className="text-sm font-bold text-white/80">{sub.name}</span>
                       </div>
                       <span className="text-sm font-black text-white/60">${(spendingByCategory[sub.id] || 0).toFixed(1)}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <motion.button 
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsAddExpenseOpen(true)}
        className="fixed bottom-32 right-8 w-16 h-16 bg-white text-black rounded-3xl shadow-2xl flex items-center justify-center active:scale-95 transition-all z-[100]"
      >
        <Plus size={32} strokeWidth={4} />
      </motion.button>

      <AddExpenseModal isOpen={isAddExpenseOpen} onClose={() => setIsAddExpenseOpen(false)} />
      <AddCategoryModal 
        isOpen={isAddCategoryOpen} 
        onClose={() => { setIsAddCategoryOpen(false); setEditingCategory(null); }} 
        initialParentId={initialParentId}
        editingCategory={editingCategory}
      />
    </div>
  );
}
