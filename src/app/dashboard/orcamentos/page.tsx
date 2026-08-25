"use client";

import { useEffect, useState } from "react";
import { useMonthFilter } from "@/hooks/useMonthFilter";
import { api } from "@/lib/api";
import { PieChart, TrendingDown, AlertTriangle, CheckCircle2, Trash2, X, PiggyBank, Pencil, Plus } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";
import { toast } from "sonner";

export default function OrcamentosPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal de edição / criação de orçamento
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [editBudgetAmount, setEditBudgetAmount] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const currentYear = new Date().getFullYear().toString();
  const [filterYear, setFilterYear] = useState(currentYear);
  const [filterMonth, setFilterMonth] = useMonthFilter('current');

  useEffect(() => {
    fetchData();
  }, [filterYear, filterMonth]);

  useEffect(() => {
    const handleCategoriesUpdate = () => {
      fetchData();
    };
    window.addEventListener("categories-updated", handleCategoriesUpdate);
    return () => window.removeEventListener("categories-updated", handleCategoriesUpdate);
  }, []);

  async function fetchData() {
    try {
      const query = new URLSearchParams();
      query.append("year", filterYear);
      query.append("month", filterMonth);
      query.append("type", "expense");

      const [transRes, catRes] = await Promise.all([
        api.get(`/transactions?${query.toString()}`),
        api.get("/categories")
      ]);
      setTransactions(transRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const handleDeleteBudget = async (categoryId: number, category: any) => {
    if (!window.confirm(`Tens a certeza que queres eliminar o orçamento de ${category.name}?`)) return;
    try {
      await api.put(`/categories/${categoryId}`, {
        name: category.name,
        color: category.color,
        type: category.type,
        budget_limit: null,
        group_id: category.group_id
      });
      toast.success("Orçamento eliminado com sucesso!");
      fetchData();
      window.dispatchEvent(new Event("categories-updated"));
    } catch (err) {
      console.error(err);
      toast.error("Erro ao eliminar a previsão.");
    }
  };

  const handleOpenEditModal = (cat: any) => {
    setIsCreatingNew(false);
    setSelectedCategoryId(String(cat.id));
    setEditBudgetAmount(cat.budget_limit ? cat.budget_limit.toString() : "");
    setEditModalOpen(true);
  };

  const handleOpenNewModal = () => {
    setIsCreatingNew(true);
    const expenseCategories = categories.filter((c: any) => c.type === 'expense');
    const firstWithoutBudget = expenseCategories.find((c: any) => !c.budget_limit || c.budget_limit <= 0);
    const defaultCatId = firstWithoutBudget ? String(firstWithoutBudget.id) : (expenseCategories[0] ? String(expenseCategories[0].id) : "");
    setSelectedCategoryId(defaultCatId);
    setEditBudgetAmount("");
    setEditModalOpen(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryId || !editBudgetAmount) return;

    const amount = parseFloat(editBudgetAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Por favor insere um valor numérico positivo.");
      return;
    }

    const cat = categories.find((c: any) => String(c.id) === String(selectedCategoryId));
    if (!cat) {
      toast.error("Categoria não encontrada.");
      return;
    }

    setIsSaving(true);
    try {
      await api.put(`/categories/${cat.id}`, {
        name: cat.name,
        color: cat.color,
        type: cat.type,
        budget_limit: amount,
        group_id: cat.group_id
      });
      toast.success(isCreatingNew ? "Orçamento criado com sucesso!" : "Orçamento atualizado com sucesso!");
      setEditModalOpen(false);
      fetchData();
      window.dispatchEvent(new Event("categories-updated"));
    } catch (err) {
      console.error("Erro ao salvar orçamento:", err);
      toast.error("Erro ao guardar o orçamento.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse p-8">A carregar previsões...</div>;

  // Filter categories that have a budget limit and are expenses
  const budgetCategories = categories.filter((c: any) => c.type === 'expense' && c.budget_limit && c.budget_limit > 0);
  const allExpenseCategories = categories.filter((c: any) => c.type === 'expense');

  // Calculate spent amount per category
  const categorySpending: Record<string, number> = {};
  let totalSpent = 0;
  transactions.forEach((t: any) => {
    if (!categorySpending[t.category_id]) categorySpending[t.category_id] = 0;
    categorySpending[t.category_id] += t.amount;
    
    if (budgetCategories.find((c: any) => c.id === t.category_id)) {
      totalSpent += t.amount;
    }
  });

  const totalBudget = budgetCategories.reduce((acc: number, cat: any) => acc + cat.budget_limit, 0);
  const budgetDiff = totalBudget - totalSpent;
  const isGlobalOverBudget = budgetDiff < 0;

  // Análise detalhada por categoria
  const exceededCategories = budgetCategories.filter((cat: any) => {
    const spent = categorySpending[cat.id] || 0;
    return spent >= cat.budget_limit;
  });

  const warningCategories = budgetCategories.filter((cat: any) => {
    const spent = categorySpending[cat.id] || 0;
    const pct = (spent / cat.budget_limit) * 100;
    return pct >= 70 && pct < 100;
  });

  let bannerState: 'danger' | 'warning' | 'success' = 'success';
  let bannerTitle = 'Orçamento Controlado';
  let bannerIcon = <PiggyBank className="w-8 h-8" />;
  let bannerBg = 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/30';
  let iconBg = 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]';
  let titleColor = 'text-emerald-700 dark:text-emerald-400';
  let textSubColor = 'text-emerald-600 dark:text-emerald-500';

  if (exceededCategories.length > 0 || isGlobalOverBudget) {
    bannerState = 'danger';
    bannerIcon = <AlertTriangle className="w-8 h-8" />;
    bannerBg = 'bg-rose-50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-900/30';
    iconBg = 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]';
    titleColor = 'text-rose-700 dark:text-rose-400';
    textSubColor = 'text-rose-600 dark:text-rose-500';

    if (exceededCategories.length === 1) {
      bannerTitle = `Atenção: 1 Orçamento Ultrapassado (${exceededCategories[0].name})`;
    } else if (exceededCategories.length > 1) {
      bannerTitle = `Atenção: ${exceededCategories.length} Orçamentos Ultrapassados`;
    } else {
      bannerTitle = 'Orçamento Global Ultrapassado';
    }
  } else if (warningCategories.length > 0) {
    bannerState = 'warning';
    bannerIcon = <AlertTriangle className="w-8 h-8" />;
    bannerBg = 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/30';
    iconBg = 'bg-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.3)]';
    titleColor = 'text-amber-700 dark:text-amber-400';
    textSubColor = 'text-amber-600 dark:text-amber-500';

    if (warningCategories.length === 1) {
      bannerTitle = `Aviso: 1 Categoria Próxima do Limite (${warningCategories[0].name})`;
    } else {
      bannerTitle = `Aviso: ${warningCategories.length} Categorias Próximas do Limite`;
    }
  }

  const currentSelectedCategory = categories.find((c: any) => String(c.id) === String(selectedCategoryId));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <PieChart className="w-8 h-8 text-primary" /> Previsões e Orçamentos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Acompanha o histórico dos teus gastos e não deixes que ultrapassem o teu limite estipulado.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleOpenNewModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-md shadow-primary/25 transition-all active:scale-95 text-sm"
          >
            <Plus className="w-4 h-4" /> Definir Orçamento
          </button>
          <div className="flex gap-2">
            <CustomSelect value={filterYear} onChange={setFilterYear as any} options={[{value:"2025",label:"2025"},{value:"2026",label:"2026"}]} />
            <CustomSelect value={filterMonth} onChange={setFilterMonth as any} options={[{value:"1",label:"Jan"},{value:"2",label:"Fev"},{value:"3",label:"Mar"},{value:"4",label:"Abr"},{value:"5",label:"Mai"},{value:"6",label:"Jun"},{value:"7",label:"Jul"},{value:"8",label:"Ago"},{value:"9",label:"Set"},{value:"10",label:"Out"},{value:"11",label:"Nov"},{value:"12",label:"Dez"}]} />
          </div>
        </div>
      </div>

      {totalBudget > 0 && (
        <div className={`glass-card p-6 flex items-center gap-6 ${bannerBg}`}>
          <div className={`p-4 rounded-xl shrink-0 ${iconBg}`}>
            {bannerIcon}
          </div>
          <div>
            <h3 className={`text-xl font-bold ${titleColor}`}>
              {bannerTitle}
            </h3>
            <p className={`mt-1 font-medium text-lg ${textSubColor}`}>
              {bannerState === 'danger' ? (
                isGlobalOverBudget ? (
                  <>Ultrapassaste o teu teto global em <strong className="text-2xl font-black ml-1 text-rose-700 dark:text-rose-300">{formatCurrency(Math.abs(budgetDiff))}</strong></>
                ) : (
                  <>Ainda assim, no total poupaste <strong className="text-2xl font-black ml-1 text-slate-900 dark:text-white">{formatCurrency(budgetDiff)}</strong> em relação ao teto global</>
                )
              ) : bannerState === 'warning' ? (
                <>Poupaste <strong className="text-2xl font-black ml-1 text-slate-900 dark:text-white">{formatCurrency(budgetDiff)}</strong> em relação ao limite global (tem atenção aos gastos)</>
              ) : (
                <>Poupaste <strong className="text-2xl font-black ml-1">{formatCurrency(budgetDiff)}</strong> em relação ao teu limite</>
              )}
            </p>
          </div>
        </div>
      )}

      {budgetCategories.length === 0 ? (
        <div className="glass-card p-10 text-center flex flex-col items-center justify-center">
          <TrendingDown className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Sem previsões definidas</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            Ainda não definiste nenhum limite mensal para as tuas categorias. Clica no botão abaixo para começares a controlar os teus tetos de gastos.
          </p>
          <button
            onClick={handleOpenNewModal}
            className="flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" /> Definir Primeiro Orçamento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgetCategories.map((cat: any) => {
            const spent = categorySpending[cat.id] || 0;
            const limit = cat.budget_limit;
            const percentage = Math.min((spent / limit) * 100, 100);
            
            let statusColor = "bg-emerald-500";
            let textColor = "text-emerald-500";
            let statusIcon = <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            
            if (percentage >= 100) {
              statusColor = "bg-rose-500";
              textColor = "text-rose-500";
              statusIcon = <AlertTriangle className="w-5 h-5 text-rose-500" />;
            } else if (percentage >= 70) {
              statusColor = "bg-amber-500";
              textColor = "text-amber-500";
              statusIcon = <AlertTriangle className="w-5 h-5 text-amber-500" />;
            }

            return (
              <div key={cat.id} className="glass-card p-6 flex flex-col hover:-translate-y-1 active:scale-[0.98] transition-transform duration-300">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></span>
                      {cat.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Limite: {formatCurrency(limit)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {statusIcon}
                    <button 
                      onClick={() => handleOpenEditModal(cat)}
                      className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Editar orçamento"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteBudget(cat.id, cat)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Eliminar orçamento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Gasto</span>
                      <span className={`text-2xl font-black ${textColor}`}>{formatCurrency(spent)}</span>
                    </div>
                    <span className={`text-sm font-bold ${textColor}`}>
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                  
                  {/* Progress Bar Container */}
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${statusColor} transition-all duration-1000 ease-out`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  
                  {percentage >= 100 && (
                    <p className="text-xs font-bold text-rose-500 mt-3 bg-rose-50 dark:bg-rose-500/10 p-2 rounded-lg text-center">
                      Atingiste o teu limite máximo!
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE EDIÇÃO / CRIAÇÃO DE ORÇAMENTO */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-6 relative border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setEditModalOpen(false)} 
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Pencil className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {isCreatingNew ? "Definir Novo Orçamento" : "Editar Orçamento"}
              </h2>
            </div>

            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
              {isCreatingNew
                ? "Escolhe a categoria de despesa e estipula o limite mensal de gastos."
                : `Ajusta o teto de gastos estipulado para a categoria selecionada.`}
            </p>

            <form onSubmit={handleSaveBudget} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Categoria</label>
                {isCreatingNew ? (
                  <CustomSelect
                    value={selectedCategoryId}
                    onChange={(val) => setSelectedCategoryId(val)}
                    options={allExpenseCategories.map((c: any) => ({
                      value: String(c.id),
                      label: c.budget_limit ? `${c.name} (Atual: ${formatCurrency(c.budget_limit)})` : c.name
                    }))}
                  />
                ) : (
                  currentSelectedCategory && (
                    <div className="flex items-center gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl">
                      <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: currentSelectedCategory.color }} />
                      <span className="font-bold text-slate-900 dark:text-white">{currentSelectedCategory.name}</span>
                    </div>
                  )
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Limite Mensal (€)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">€</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0.01"
                    required 
                    autoFocus
                    value={editBudgetAmount} 
                    onChange={e => setEditBudgetAmount(e.target.value)} 
                    className="w-full pl-10 pr-4 py-3 text-lg font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all" 
                    placeholder="0.00" 
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="w-1/2 py-3 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-1/2 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/30 transition-all disabled:opacity-50"
                >
                  {isSaving ? "A guardar..." : "Guardar Limite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
