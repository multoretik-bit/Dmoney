'use client';

import { useState, useMemo } from 'react';
import { useStore, Category, Expense } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  AlertCircle, 
  Target, 
  Activity,
  Edit2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddExpenseModal } from '../expenses/add-expense-modal';
import { AddCategoryModal } from '../categories/add-category-modal';

export function BudgetView() {
  const { categories, expenses, setCategoryLimit, preferences } = useStore();
  const [viewMode, setViewMode] = useState<'plan' | 'execute'>('execute');
  const [expandedBlocks, setExpandedBlocks] = useState<string[]>([]);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [initialParentId, setInitialParentId] = useState<string | undefined>(undefined);
  const [editingLimitId, setEditingLimitId] = useState<string | null>(null);

  const openAddBlock = () => {
    setInitialParentId(undefined);
    setIsAddCategoryOpen(true);
  };

  const openAddCategory = (parentId: string) => {
    setInitialParentId(parentId);
    setIsAddCategoryOpen(true);
  };

  const toggleBlock = (id: string) => {
    setExpandedBlocks(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  // Group categories into "Blocks"
  const headCategories = useMemo(() => categories.filter(c => !c.parentId), [categories]);
  
  const categoriesByBlock = useMemo(() => {
    const map: Record<string, Category[]> = {};
    headCategories.forEach(head => {
      map[head.id] = categories.filter(c => c.parentId === head.id);
    });
    return map;
  }, [categories, headCategories]);

  // Spending calculations
  const spendingByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => {
      map[e.categoryId] = (map[e.categoryId] || 0) + e.convertedAmount;
    });
    return map;
  }, [expenses]);

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

  const totalUnplannedSpent = useMemo(() => 
    unplannedExpenses.reduce((sum, c) => sum + (spendingByCategory[c.id] || 0), 0),
  [unplannedExpenses, spendingByCategory]);

  return (
    <div className="flex flex-col min-h-screen pb-40 bg-[#0d1117] text-white">
      {/* Header Summary */}
      <header className="p-8 pt-16 bg-[#161b22] rounded-b-[64px] border-b border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[120px] rounded-full -mr-32 -mt-32" />
        
        <div className="flex justify-between items-center mb-10 relative z-10">
          <button className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 shadow-lg"><Settings size={22} className="text-white/40" /></button>
          <div className="flex bg-black/20 p-1 rounded-2xl border border-white/5">
            <button 
              onClick={() => setViewMode('plan')}
              className={cn(
                "px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                viewMode === 'plan' ? "bg-white text-black shadow-xl" : "text-white/40"
              )}
            >
              План
            </button>
            <button 
              onClick={() => setViewMode('execute')}
              className={cn(
                "px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                viewMode === 'execute' ? "bg-white text-black shadow-xl" : "text-white/40"
              )}
            >
              Выполнение
            </button>
          </div>
          <button className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center border border-accent/10 shadow-lg text-accent"><Target size={22} /></button>
        </div>

        <div className="flex flex-col items-center gap-2 relative z-10">
          <div className="relative w-56 h-56 flex items-center justify-center">
             <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="10" />
                <motion.circle 
                  cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="10" 
                  strokeDasharray="276" 
                  initial={{ strokeDashoffset: 276 }} 
                  animate={{ 
                    strokeDashoffset: viewMode === 'plan' ? 0 : 276 - (276 * Math.min(overallProgress, 100)) / 100,
                    opacity: viewMode === 'plan' ? 0.2 : 1
                  }}
                  strokeLinecap="round" className={cn(overallProgress > 100 ? "text-red-500" : "text-accent")}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                {viewMode === 'execute' ? (
                  <>
                    <span className="text-3xl font-black">${totalSpent.toFixed(1)}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Потрачено</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-black">${totalPlanned.toFixed(1)}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">В плане</span>
                  </>
                )}
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-8 mt-2 w-full max-w-xs">
            <div className="flex flex-col items-center">
              <span className="text-white/20 text-[9px] font-black uppercase tracking-widest">{viewMode === 'execute' ? 'Осталось' : 'Бюджет'}</span>
              <span className={cn("text-lg font-black", viewMode === 'execute' && totalPlanned - totalSpent < 0 ? "text-red-500" : "text-white")}>
                ${Math.abs(totalPlanned - totalSpent).toFixed(1)}
              </span>
            </div>
            <div className="flex flex-col items-center border-l border-white/5">
              <span className="text-white/20 text-[9px] font-black uppercase tracking-widest">Прогресс</span>
              <span className="text-lg font-black">{Math.round(overallProgress)}%</span>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 flex flex-col gap-10 mt-4">
        {/* Budget Blocks */}
        <div className="flex flex-col gap-6">
          <div className="px-2 flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Budget Blocks</span>
            <button 
              onClick={openAddBlock}
              className="text-accent text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:opacity-70 transition-all"
            >
              <Plus size={12} strokeWidth={4} /> ADD BLOCK
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {headCategories.map(head => {
              const subCats = categoriesByBlock[head.id] || [];
              const isExpanded = expandedBlocks.includes(head.id);
              
              const blockPlanned = subCats.reduce((sum, c) => sum + (c.budgetLimit || 0), 0);
              const blockSpent = subCats.reduce((sum, c) => sum + (spendingByCategory[c.id] || 0), 0);
              const blockPercent = blockPlanned > 0 ? (blockSpent / blockPlanned) * 100 : 0;

              return (
                <div key={head.id} className="bg-[#1c2128] rounded-[40px] border border-white/5 overflow-hidden shadow-xl">
                  {/* Block Header */}
                  <div 
                    onClick={() => toggleBlock(head.id)}
                    className="p-6 flex items-center justify-between cursor-pointer active:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                       <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg relative border-2" style={{ backgroundColor: `${head.color}30`, borderColor: `${head.color}60`, color: head.color }}>
                          {head.icon}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl pointer-events-none" />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-lg font-black tracking-tight">{head.name}</span>
                          <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                            {viewMode === 'execute' 
                              ? `$${blockSpent.toFixed(1)} / $${blockPlanned.toFixed(1)}` 
                              : `$${blockPlanned.toFixed(1)} в плане`
                            }
                          </span>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full border-2 border-white/5 flex items-center justify-center relative">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                             <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                             <circle 
                               cx="50" cy="50" r="40" fill="none" stroke={head.color} strokeWidth="8" 
                               strokeDasharray="251" strokeDashoffset={251 - (251 * Math.min(blockPercent, 100)) / 100}
                               strokeLinecap="round"
                             />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black">{Math.round(blockPercent)}%</span>
                       </div>
                       {isExpanded ? <ChevronDown size={20} className="text-white/20" /> : <ChevronRight size={20} className="text-white/20" />}
                    </div>
                  </div>

                  {/* Block Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/5 bg-black/20"
                      >
                        <div className="p-6 flex flex-col gap-6">
                           {subCats.map(sub => {
                             const spent = spendingByCategory[sub.id] || 0;
                             const limit = sub.budgetLimit || 0;
                             const percent = limit > 0 ? (spent / limit) * 100 : 0;
                             const isEditing = editingLimitId === sub.id;

                             return (
                               <div key={sub.id} className="flex flex-col gap-3">
                                  <div className="flex justify-between items-center">
                                     <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base border" style={{ backgroundColor: `${sub.color}20`, borderColor: `${sub.color}40`, color: sub.color }}>{sub.icon}</div>
                                        <span className="text-sm font-bold text-white/80">{sub.name}</span>
                                        {spent > limit && limit > 0 && <AlertCircle size={14} className="text-red-500 animate-pulse" />}
                                     </div>
                                     <div className="flex items-center gap-2">
                                        {viewMode === 'plan' ? (
                                          <div className="flex items-center gap-2">
                                            <input 
                                              type="number"
                                              value={limit}
                                              onChange={(e) => setCategoryLimit(sub.id, parseFloat(e.target.value) || 0)}
                                              className="bg-white/5 border border-white/10 rounded-lg w-20 px-2 py-1 text-xs font-black text-right outline-none focus:border-accent/50"
                                            />
                                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">USD</span>
                                          </div>
                                        ) : (
                                          <div className="flex flex-col items-end">
                                            <span className={cn(
                                              "text-sm font-black transition-colors",
                                              spent > limit && limit > 0 ? "text-red-500" : "text-white"
                                            )}>
                                              ${spent.toFixed(1)}
                                            </span>
                                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                                              из ${limit.toFixed(1)}
                                            </span>
                                          </div>
                                        )}
                                     </div>
                                  </div>
                                  {viewMode === 'execute' && (
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
                                       <motion.div 
                                         className={cn("h-full rounded-full", spent > limit ? "bg-red-500" : "bg-accent")} 
                                         initial={{ width: 0 }} animate={{ width: `${Math.min(percent, 100)}%` }}
                                         transition={{ duration: 1, ease: "easeOut" }}
                                       />
                                    </div>
                                  )}
                               </div>
                             );
                           })}
                           <button 
                             onClick={() => openAddCategory(head.id)}
                             className="py-4 border border-dashed border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white/20 hover:bg-white/5 active:scale-[0.98] transition-all"
                           >
                             + Add Category to {head.name}
                           </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Unplanned Section */}
        {totalUnplannedSpent > 0 && (
          <div className="flex flex-col gap-6">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 px-2">Внеплановые траты</span>
            <div className="bg-[#1c2128] rounded-[40px] border border-red-500/20 p-8 shadow-xl relative overflow-hidden">
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
        onClose={() => setIsAddCategoryOpen(false)} 
        initialParentId={initialParentId}
      />
    </div>
  );
}
