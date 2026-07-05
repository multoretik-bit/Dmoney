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
  ArrowDown,
  ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, subMonths, addMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
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
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const currentMonthStr = useMemo(() => format(currentMonth, 'yyyy-MM'), [currentMonth]);

  const currentMonthExpenses = useMemo(() =>
    expenses.filter(e => e.date.startsWith(currentMonthStr) && !e.isWork),
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
      updateCategory(cat.id, { ...cat, parentId: blockId });
    }
    setIsSelectingExisting(null);
  };

  const totalPlanned = useMemo(() =>
    categories.reduce((sum, c) => {
      const parent = c.parentId ? categories.find(p => p.id === c.parentId) : null;
      const isExcluded = c.excludeFromBudget || (parent && parent.excludeFromBudget);
      return sum + (!isExcluded && c.budgetLimit ? c.budgetLimit : 0);
    }, 0),
  [categories]);

  const totalSpent = useMemo(() => {
    let sum = 0;
    for (const [catId, amount] of Object.entries(spendingByCategory)) {
      const cat = categories.find(c => c.id === catId);
      if (cat) {
        const parent = cat.parentId ? categories.find(p => p.id === cat.parentId) : null;
        const isExcluded = cat.excludeFromBudget || (parent && parent.excludeFromBudget);
        if (!isExcluded) {
          sum += amount;
        }
      }
    }
    return sum;
  }, [spendingByCategory, categories]);

  const overallProgress = totalPlanned > 0 ? (totalSpent / totalPlanned) * 100 : 0;

  const unplannedExpenses = useMemo(() => {
    const plannedIds = new Set(categories.filter(c => {
      const parent = c.parentId ? categories.find(p => p.id === c.parentId) : null;
      const isExcluded = c.excludeFromBudget || (parent && parent.excludeFromBudget);
      return !isExcluded && c.budgetLimit && c.budgetLimit > 0;
    }).map(c => c.id));
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

  const blockSummaries = useMemo(() => {
    return headCategories.filter(h => !h.excludeFromBudget).map(head => {
      const children = categories.filter(c => c.parentId === head.id && !c.excludeFromBudget);
      const totalLimit = (head.budgetLimit || 0) + children.reduce((sum, c) => sum + (c.budgetLimit || 0), 0);
      const totalSpent = (spendingByCategory[head.id] || 0) + children.reduce((sum, c) => sum + (spendingByCategory[c.id] || 0), 0);
      return { id: head.id, name: head.name, color: head.color, limit: totalLimit, spent: totalSpent };
    });
  }, [headCategories, categories, spendingByCategory]);

  return (
    <div className="flex flex-col min-h-screen pb-40">
      {/* Header Summary */}
      <header className="pt-8 flex flex-col items-center justify-center text-center gap-1">
        <h1 className="text-2xl font-semibold text-white px-6 tracking-tight">
          {viewMode === 'execute' ? 'Траты и бюджет' : 'Планирование'}
        </h1>

        <div className="flex justify-between items-center surface p-1.5 rounded-xl mt-4 mb-2 w-full max-w-[240px]">
          <button
            onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
            className="p-2 text-white/40 hover:text-white transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex flex-col items-center min-w-[120px]">
            <span className="text-sm font-medium text-white leading-none capitalize">
              {format(currentMonth, 'MMMM', { locale: ru })}
            </span>
            <span className="text-[11px] text-textSubtle mt-1">
              {format(currentMonth, 'yyyy')}
            </span>
          </div>
          <button
            onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
            className="p-2 text-white/40 hover:text-white transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {viewMode === 'execute' ? (
          <div className="w-full px-8 flex flex-col gap-3">
             <div className="flex justify-between items-end">
                <div className="flex flex-col items-start">
                   <span className="text-2xl font-semibold text-white tabular-nums">${totalSpent.toFixed(1)}</span>
                   <span className="text-[12px] text-textMuted">Потрачено из ${totalPlanned.toFixed(1)}</span>
                </div>
                <span className="text-lg font-semibold text-accent tabular-nums">{Math.round(overallProgress)}%</span>
             </div>
             <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                   initial={{ width: 0 }}
                   animate={{ width: `${Math.min(100, overallProgress)}%` }}
                   className="h-full rounded-full"
                   style={{ background: overallProgress > 100 ? '#f43f5e' : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}
                />
             </div>
          </div>
        ) : (
          <div className="w-full px-4 flex flex-col gap-4">
             <div className="flex flex-col items-center">
                <span className="text-3xl font-semibold text-white tabular-nums">${totalPlanned.toFixed(1)}</span>
                <span className="text-[12px] text-textMuted">Общий бюджет</span>
             </div>
             <div className="flex overflow-x-auto gap-2.5 py-2 no-scrollbar px-4">
                {blockSummaries.map(b => (
                  <div key={b.id} className="flex-shrink-0 surface p-3 px-4 rounded-xl flex flex-col items-start gap-1">
                     <span className="text-[11px] font-medium" style={{ color: `${b.color}` }}>{b.name}</span>
                     <span className="text-sm font-semibold text-white tabular-nums">${b.limit.toFixed(0)}</span>
                  </div>
                ))}
             </div>
          </div>
        )}

        <div className="mt-6 surface p-1 rounded-xl">
          <button
            onClick={() => setViewMode('plan')}
            className={cn(
              "px-6 py-2 text-[13px] font-medium rounded-lg transition-all",
              viewMode === 'plan' ? "bg-white text-black" : "text-white/50"
            )}
          >
            План
          </button>
          <button
            onClick={() => setViewMode('execute')}
            className={cn(
              "px-6 py-2 text-[13px] font-medium rounded-lg transition-all",
              viewMode === 'execute' ? "bg-white text-black" : "text-white/50"
            )}
          >
            Выполнение
          </button>
        </div>
      </header>

      <div className="p-5 flex flex-col gap-9 mt-4">
        {/* Budget Blocks */}
        <div className="flex flex-col gap-9">
          {headCategories.map(head => {
            const subCats = categoriesByBlock[head.id] || [];
            const isExpanded = expandedBlocks.includes(head.id);

            return (
              <div key={head.id} className="flex flex-col gap-4">
                <div
                   className="px-3 py-2.5 flex justify-between items-center group cursor-pointer rounded-xl transition-all hover:bg-white/[0.03]"
                   onClick={() => toggleBlock(head.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: head.color }} />
                    <span className="text-[13px] font-medium" style={{ color: head.color }}>{head.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Reordering controls for block */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                       <button
                         onClick={(e) => { e.stopPropagation(); updateCategoryOrder(head.id, 'up'); }}
                         className="p-1.5 text-white/30 hover:text-white"
                       >
                         <ArrowUp size={14} />
                       </button>
                       <button
                         onClick={(e) => { e.stopPropagation(); updateCategoryOrder(head.id, 'down'); }}
                         className="p-1.5 text-white/30 hover:text-white"
                       >
                         <ArrowDown size={14} />
                       </button>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditCategory(head); }}
                      className="text-white/30 hover:text-white transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <ChevronDown size={16} className={cn("text-white/30 transition-transform", !isExpanded && "-rotate-90")} />
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex flex-col gap-2.5"
                    >
                      {subCats.map((sub) => {
                        const spent = spendingByCategory[sub.id] || 0;
                        const limit = sub.budgetLimit || 0;
                        const percent = limit > 0 ? (spent / limit) * 100 : 0;
                        const isOverBudget = viewMode === 'execute' && spent > limit && limit > 0;

                        return (
                          <div
                            key={sub.id}
                            className="surface surface-hover p-4 rounded-2xl flex items-center justify-between group active:scale-[0.99] transition-all"
                          >
                            <div className="flex items-center gap-3.5 flex-1 min-w-0">
                               <div className="w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center text-xl" style={{ background: `${sub.color}18` }}>
                                  {sub.icon}
                               </div>
                               <div className="flex flex-col gap-1 flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-white/90 leading-tight text-[14px] truncate">{sub.name}</span>
                                    {isOverBudget && <AlertCircle size={13} className="text-danger flex-shrink-0" />}
                                  </div>

                                  {viewMode === 'execute' && (
                                    <div className="flex items-center gap-2">
                                       <div className="h-1 flex-1 bg-white/[0.06] rounded-full overflow-hidden max-w-[120px]">
                                          <motion.div
                                            className={cn("h-full rounded-full", isOverBudget ? "bg-danger" : "bg-white/40")}
                                            initial={{ width: 0 }} animate={{ width: `${Math.min(percent, 100)}%` }}
                                          />
                                       </div>
                                       <span className="text-[11px] text-textSubtle tabular-nums">
                                          {Math.round(percent)}%
                                       </span>
                                    </div>
                                  )}
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                               <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all mr-1">
                                     <button
                                       onClick={() => updateCategoryOrder(sub.id, 'up')}
                                       className="p-1 px-1.5 text-white/30 hover:text-white"
                                     >
                                       <ArrowUp size={12} />
                                     </button>
                                     <button
                                       onClick={() => updateCategoryOrder(sub.id, 'down')}
                                       className="p-1 px-1.5 text-white/30 hover:text-white"
                                     >
                                       <ArrowDown size={12} />
                                     </button>
                                  </div>

                                  {viewMode === 'execute' ? (
                                    <span className="text-[15px] font-semibold text-white tabular-nums">${spent.toFixed(1)}</span>
                                  ) : (
                                    <span className="text-lg font-semibold text-white tabular-nums">${limit.toFixed(0)}</span>
                                  )}

                                  <button
                                    onClick={() => openEditCategory(sub)}
                                    className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                               </div>

                               {viewMode === 'execute' && (
                                 <span className="text-[11px] text-textSubtle tabular-nums">
                                   из ${limit.toFixed(1)}
                                 </span>
                               )}
                            </div>
                          </div>
                        );
                      })}

                      <div className="flex gap-2.5">
                        <button
                           onClick={() => openAddCategory(head.id)}
                           className="flex-1 h-14 border border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-2 text-[12px] font-medium text-white/25 hover:text-white/60 hover:bg-white/[0.03] transition-all"
                        >
                          <Plus size={14} /> Добавить новую
                        </button>
                        <button
                           onClick={() => setIsSelectingExisting(isSelectingExisting === head.id ? null : head.id)}
                           className="flex-1 h-14 border border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-2 text-[12px] font-medium text-white/25 hover:text-white/60 hover:bg-white/[0.03] transition-all"
                        >
                          <ChevronDown size={14} className={cn("transition-transform", isSelectingExisting === head.id && "rotate-180")} /> Выбрать существующую
                        </button>
                      </div>

                      {isSelectingExisting === head.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                          className="surface-sunken rounded-2xl p-3 flex flex-col gap-2"
                        >
                          {availableCategories.filter(c => c.id !== head.id && c.parentId !== head.id).length === 0 ? (
                            <span className="text-[12px] text-textSubtle text-center py-4">Нет доступных категорий</span>
                          ) : (
                            availableCategories.filter(c => c.id !== head.id && c.parentId !== head.id).map(c => (
                              <button
                                key={c.id}
                                onClick={() => addExistingToBlock(c.id, head.id)}
                                className="flex items-center gap-3 p-3 bg-white/[0.03] hover:bg-white/[0.06] rounded-xl transition-all group"
                              >
                                <span>{c.icon}</span>
                                <span className="text-sm font-medium text-white/60 group-hover:text-white">{c.name}</span>
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
            className="h-20 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-2 group hover:border-accent/40 hover:bg-white/[0.02] transition-all"
          >
            <div className="w-9 h-9 bg-accent-dim rounded-xl flex items-center justify-center text-accent group-hover:scale-105 transition-transform">
              <Plus size={18} />
            </div>
            <span className="text-[12px] font-medium text-white/30 group-hover:text-accent transition-colors">Создать новый блок</span>
          </button>
        </div>

        {/* Unused / Hidden Categories section */}
        {unusedCategories.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
               <span className="text-[12px] font-medium text-textMuted">Неиспользуемые категории</span>
               <span className="text-[12px] text-textSubtle">{unusedCategories.length}</span>
            </div>
            <div
              ref={dragScrollRef}
              {...dragScrollProps}
              className="flex overflow-x-auto gap-3 pb-4 no-scrollbar active:cursor-grabbing"
            >
               {unusedCategories.map(cat => (
                 <button
                  key={cat.id}
                  onClick={() => openEditCategory(cat)}
                  className="flex-shrink-0 w-28 surface surface-hover rounded-2xl p-4 flex flex-col items-center gap-2.5 active:scale-95 transition-all"
                 >
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">
                       {cat.icon}
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                       <span className="text-[12px] font-medium text-white/60 text-center line-clamp-1">{cat.name}</span>
                       <span className="text-[11px] text-textSubtle tabular-nums">${(cat.budgetLimit || 0).toFixed(0)}</span>
                    </div>
                 </button>
               ))}
            </div>
          </div>
        )}

        {/* Unplanned Section - Only in Execution/Execute mode */}
        {viewMode === 'execute' && totalUnplannedSpent > 0 && (
          <div className="flex flex-col gap-4">
            <span className="text-[12px] font-medium text-textMuted px-1">Внеплановые / вне бюджета</span>
            <div className="surface rounded-2xl border-l-2 border-l-danger/60 p-6 flex flex-col gap-5">
               <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-base font-semibold text-danger tracking-tight">Всего вне плана</span>
                    <span className="text-[12px] text-textMuted">Not budgeted / excluded</span>
                  </div>
                  <span className="text-xl font-semibold text-danger tabular-nums">${totalUnplannedSpent.toFixed(1)}</span>
               </div>
               <div className="flex flex-col gap-2.5">
                  {unplannedExpenses.map(sub => (
                    <div key={sub.id} className="flex justify-between items-center bg-white/[0.03] p-3.5 rounded-xl">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center text-base">{sub.icon}</div>
                           <span className="text-sm font-medium text-white/80">{sub.name}</span>
                       </div>
                       <span className="text-sm font-semibold text-white/70 tabular-nums">${(spendingByCategory[sub.id] || 0).toFixed(1)}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsAddExpenseOpen(true)}
        className="fixed bottom-32 right-5 w-14 h-14 gradient-accent glow-accent text-white rounded-2xl shadow-card-lg flex items-center justify-center active:scale-95 transition-all z-40"
      >
        <Plus size={24} strokeWidth={2.5} />
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
