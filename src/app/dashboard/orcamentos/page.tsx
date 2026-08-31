"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMonthFilter } from "@/hooks/useMonthFilter";
import { api } from "@/lib/api";
import { 
  PieChart, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  X, 
  PiggyBank, 
  Pencil, 
  Plus, 
  Receipt, 
  Clock, 
  ArrowDownRight, 
  ChevronRight 
} from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";
import { ConfirmModal } from "@/components/ConfirmModal";
import { CategoryIcon, getStoredCategoryIcons } from "@/components/CategoryIcon";
import { ModalPortal } from "@/components/ModalPortal";
import { toast } from "sonner";

const MONTH_NAMES: Record<string, string> = {
  "1": "Janeiro",
  "2": "Fevereiro",
  "3": "Março",
  "4": "Abril",
  "5": "Maio",
  "6": "Junho",
  "7": "Julho",
  "8": "Agosto",
  "9": "Setembro",
  "10": "Outubro",
  "11": "Novembro",
  "12": "Dezembro",
};

export default function OrcamentosPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal de detalhe de gastos da categoria
  const [selectedCategoryForDetails, setSelectedCategoryForDetails] = useState<any | null>(null);

  // Modal de edição / criação de orçamento
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [editBudgetAmount, setEditBudgetAmount] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Confirmação de exclusão
  const [budgetToDelete, setBudgetToDelete] = useState<{ id: number; name: string; category: any } | null>(null);
  const [isDeletingBudget, setIsDeletingBudget] = useState(false);

  const currentYear = new Date().getFullYear().toString();
  const [filterYear, setFilterYear] = useState(currentYear);
  const [filterMonth, setFilterMonth] = useMonthFilter('current');

  const isExpense = (type: any) => {
    const t = String(type || '').toLowerCase();
    return t === 'expense' || t === 'expenses' || t === 'despesa' || t === 'despesas';
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedCategoryForDetails) setSelectedCategoryForDetails(null);
        if (editModalOpen) setEditModalOpen(false);
        if (budgetToDelete) setBudgetToDelete(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCategoryForDetails, editModalOpen, budgetToDelete]);

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
      if (filterYear && filterYear !== "Todos") {
        query.append("year", filterYear);
      }
      if (filterMonth && filterMonth !== "Todos" && filterMonth !== "") {
        query.append("month", filterMonth);
      }
      query.append("type", "expense");

      const [transRes, catRes, goalsRes] = await Promise.all([
        api.get(`/transactions?${query.toString()}`).catch(() => ({ data: [] })),
        api.get("/categories").catch(() => ({ data: [] })),
        api.get("/goals").catch(() => ({ data: [] }))
      ]);

      const storedIcons = getStoredCategoryIcons();
      let fetchedCats: any[] = (Array.isArray(catRes.data) ? catRes.data : []).map((c: any) => ({
        ...c,
        icon: c.icon || storedIcons[String(c.id)] || null
      }));
      
      // Fallback cache local para categorias
      if (fetchedCats.length > 0) {
        try { localStorage.setItem("pl_categories_cache", JSON.stringify(fetchedCats)); } catch {}
      } else {
        try {
          const cached = localStorage.getItem("pl_categories_cache");
          if (cached) {
            fetchedCats = JSON.parse(cached).map((c: any) => ({
              ...c,
              icon: c.icon || storedIcons[String(c.id)] || null
            }));
          }
        } catch {}
      }

      // Sincronizar tetos de despesa definidos em metas caso a categoria não tenha budget_limit
      const goalsList: any[] = Array.isArray(goalsRes.data) ? goalsRes.data : [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("pl_goals_")) {
            const items = JSON.parse(localStorage.getItem(key) || "[]");
            if (Array.isArray(items)) {
              items.forEach(g => {
                if (g && g.goal_type === "expense_ceiling" && g.category_id && !goalsList.some(ex => ex.id === g.id)) {
                  goalsList.push(g);
                }
              });
            }
          }
        }
      } catch {}

      const mergedCats = fetchedCats.map((cat: any) => {
        if (!cat.budget_limit || Number(cat.budget_limit) <= 0) {
          const matchingGoal = goalsList.find(g => g.goal_type === "expense_ceiling" && String(g.category_id) === String(cat.id));
          if (matchingGoal && matchingGoal.target_amount > 0) {
            return { ...cat, budget_limit: matchingGoal.target_amount };
          }
        }
        return cat;
      });

      setCategories(mergedCats);
      setTransactions(Array.isArray(transRes.data) ? transRes.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const confirmDeleteBudget = async () => {
    if (!budgetToDelete) return;
    setIsDeletingBudget(true);
    try {
      await api.put(`/categories/${budgetToDelete.id}`, {
        name: budgetToDelete.category.name,
        color: budgetToDelete.category.color,
        type: budgetToDelete.category.type,
        budget_limit: null,
        group_id: budgetToDelete.category.group_id
      });
      toast.success("Orçamento eliminado com sucesso!");
    } catch (err) {
      console.warn("Backend /categories delete fallback to local:", err);
      try {
        const updated = categories.map((c: any) => String(c.id) === String(budgetToDelete.id) ? { ...c, budget_limit: null } : c);
        setCategories(updated);
        localStorage.setItem("pl_categories_cache", JSON.stringify(updated));
        toast.success("Orçamento eliminado com sucesso!");
      } catch {
        toast.error("Erro ao eliminar a previsão.");
      }
    } finally {
      setBudgetToDelete(null);
      setIsDeletingBudget(false);
      fetchData();
      window.dispatchEvent(new Event("categories-updated"));
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
    const expenseCategories = categories.filter((c: any) => isExpense(c.type));
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
    } catch (err) {
      console.warn("Backend /categories save fallback to local:", err);
      try {
        const updated = categories.map((c: any) => String(c.id) === String(cat.id) ? { ...c, budget_limit: amount } : c);
        setCategories(updated);
        localStorage.setItem("pl_categories_cache", JSON.stringify(updated));
        toast.success(isCreatingNew ? "Orçamento criado com sucesso!" : "Orçamento atualizado com sucesso!");
      } catch {
        toast.error("Erro ao guardar o orçamento.");
      }
    } finally {
      setIsSaving(false);
      setEditModalOpen(false);
      fetchData();
      window.dispatchEvent(new Event("categories-updated"));
    }
  };

  if (loading) return <div className="animate-pulse p-8">A carregar previsões...</div>;

  // Filter categories that have a budget limit and are expenses
  const budgetCategories = categories.filter((c: any) => isExpense(c.type) && c.budget_limit && Number(c.budget_limit) > 0);
  const allExpenseCategories = categories.filter((c: any) => isExpense(c.type));

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

  // Transações e métricas para a categoria selecionada no modal de detalhes
  const categoryDetailsTransactions = selectedCategoryForDetails
    ? transactions
        .filter((t: any) => String(t.category_id) === String(selectedCategoryForDetails.id))
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const detailsSpent = selectedCategoryForDetails ? (categorySpending[selectedCategoryForDetails.id] || 0) : 0;
  const detailsLimit = selectedCategoryForDetails ? selectedCategoryForDetails.budget_limit : 0;
  const detailsPercentage = detailsLimit > 0 ? (detailsSpent / detailsLimit) * 100 : 0;

  let detailsStatusColor = "bg-emerald-500";
  let detailsTextColor = "text-emerald-500";
  if (detailsPercentage >= 100) {
    detailsStatusColor = "bg-rose-500";
    detailsTextColor = "text-rose-500";
  } else if (detailsPercentage >= 70) {
    detailsStatusColor = "bg-amber-500";
    detailsTextColor = "text-amber-500";
  }

  const getPeriodLabel = () => {
    if (filterMonth && filterMonth !== "Todos" && filterMonth !== "") {
      const mName = MONTH_NAMES[String(filterMonth)] || `Mês ${filterMonth}`;
      return filterYear && filterYear !== "Todos" ? `${mName} de ${filterYear}` : mName;
    }
    return filterYear && filterYear !== "Todos" ? `Ano de ${filterYear}` : "Todos os Períodos";
  };

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
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-28 sm:w-32">
              <CustomSelect 
                value={filterYear} 
                onChange={setFilterYear as any} 
                options={[
                  { value: "Todos", label: "Todos" },
                  { value: "2025", label: "2025" },
                  { value: "2026", label: "2026" }
                ]} 
              />
            </div>
            <div className="w-28 sm:w-32">
              <CustomSelect 
                value={filterMonth || "Todos"} 
                onChange={(val) => setFilterMonth(val === "Todos" ? "" : String(val))} 
                options={[
                  { value: "Todos", label: "Todos" },
                  { value: "1", label: "Jan" },
                  { value: "2", label: "Fev" },
                  { value: "3", label: "Mar" },
                  { value: "4", label: "Abr" },
                  { value: "5", label: "Mai" },
                  { value: "6", label: "Jun" },
                  { value: "7", label: "Jul" },
                  { value: "8", label: "Ago" },
                  { value: "9", label: "Set" },
                  { value: "10", label: "Out" },
                  { value: "11", label: "Nov" },
                  { value: "12", label: "Dez" }
                ]} 
              />
            </div>
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
            const catTransactionsCount = transactions.filter((t: any) => String(t.category_id) === String(cat.id)).length;
            
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
              <div 
                key={cat.id} 
                onClick={() => setSelectedCategoryForDetails(cat)}
                className="glass-card p-6 flex flex-col hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 active:scale-[0.98] transition-all duration-300 cursor-pointer group relative"
                title="Clica para ver o detalhe dos gastos desta categoria"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5 group-hover:text-primary transition-colors">
                      <CategoryIcon color={cat.color} icon={cat.icon} size="sm" />
                      <span>{cat.name}</span>
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Limite: {formatCurrency(limit)}</p>
                  </div>
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {statusIcon}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(cat);
                      }}
                      className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Editar orçamento"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setBudgetToDelete({ id: cat.id, name: cat.name, category: cat });
                      }}
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

                  {/* Interactive Footer Cue */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-primary transition-colors">
                    <span>{catTransactionsCount} {catTransactionsCount === 1 ? 'gasto registado' : 'gastos registados'}</span>
                    <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform font-bold">
                      Ver detalhes <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE DETALHES DE GASTOS DA CATEGORIA */}
      {/* ========================================================================= */}
      {selectedCategoryForDetails && (
        <ModalPortal>
          <div 
            className="fixed inset-0 z-[150] w-screen h-screen flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setSelectedCategoryForDetails(null)}
          >
            <div 
              className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl p-6 sm:p-7 relative border border-slate-200 dark:border-slate-800 flex flex-col animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3.5">
                  <CategoryIcon color={selectedCategoryForDetails.color} icon={selectedCategoryForDetails.icon} size="md" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {selectedCategoryForDetails.name}
                      </h2>
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {getPeriodLabel()}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      Histórico discriminado de todas as despesas associadas a este orçamento
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      const cat = selectedCategoryForDetails;
                      setSelectedCategoryForDetails(null);
                      handleOpenEditModal(cat);
                    }}
                    className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                    title="Editar limite do orçamento"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setSelectedCategoryForDetails(null)}
                    className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Fechar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Overview KPI Cards */}
              <div className="grid grid-cols-3 gap-3 my-5">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex flex-col">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Gasto</span>
                  <span className={`text-lg sm:text-xl font-black mt-1 ${detailsTextColor}`}>
                    {formatCurrency(detailsSpent)}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 mt-0.5">
                    {detailsPercentage.toFixed(0)}% do limite
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex flex-col">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Teto Estipulado</span>
                  <span className="text-lg sm:text-xl font-black mt-1 text-slate-900 dark:text-white">
                    {formatCurrency(detailsLimit)}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 mt-0.5">
                    Limite mensal
                  </span>
                </div>

                <div className={`p-3.5 rounded-2xl border flex flex-col ${
                  detailsSpent >= detailsLimit 
                    ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400' 
                    : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                }`}>
                  <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                    {detailsSpent >= detailsLimit ? 'Ultrapassado' : 'Saldo Restante'}
                  </span>
                  <span className="text-lg sm:text-xl font-black mt-1">
                    {formatCurrency(Math.abs(detailsLimit - detailsSpent))}
                  </span>
                  <span className="text-[11px] font-medium opacity-80 mt-0.5">
                    {detailsSpent >= detailsLimit ? 'Excesso acumulado' : 'Disponível para gastar'}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-5 space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>Consumo do limite</span>
                  <span className={`font-bold ${detailsTextColor}`}>{detailsPercentage.toFixed(1)}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${detailsStatusColor} transition-all duration-700`}
                    style={{ width: `${Math.min(detailsPercentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Transactions list header & count */}
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-primary" />
                  Gastos Registados ({categoryDetailsTransactions.length})
                </h4>
                {categoryDetailsTransactions.length > 0 && (
                  <span className="text-xs text-slate-400">
                    Média: {formatCurrency(detailsSpent / categoryDetailsTransactions.length)} / despesa
                  </span>
                )}
              </div>

              {/* Scrollable list */}
              <div className="overflow-y-auto flex-1 max-h-[38vh] pr-1 space-y-2 custom-scrollbar">
                {categoryDetailsTransactions.length === 0 ? (
                  <div className="py-10 text-center flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/60">
                    <Receipt className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">Sem gastos registados</p>
                    <p className="text-xs text-slate-400 mt-0.5">Não foi encontrada nenhuma despesa nesta categoria no período selecionado.</p>
                  </div>
                ) : (
                  categoryDetailsTransactions.map((tx: any) => {
                    const txPct = detailsSpent > 0 ? (tx.amount / detailsSpent) * 100 : 0;
                    const formattedDate = new Date(tx.date).toLocaleDateString('pt-PT', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    });

                    return (
                      <div 
                        key={tx.id}
                        className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 shrink-0">
                            <ArrowDownRight className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                              {tx.description || "Sem descrição"}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formattedDate}
                              </span>
                              {tx.payment_method && (
                                <>
                                  <span>•</span>
                                  <span className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700/60 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                                    {tx.payment_method}
                                  </span>
                                </>
                              )}
                              {tx.receipt_image && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-0.5 text-primary text-[11px] font-semibold">
                                    <Receipt className="w-3 h-3" /> Comprovativo
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0">
                          <span className="font-black text-sm sm:text-base text-rose-600 dark:text-rose-400">
                            - {formatCurrency(tx.amount)}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            {txPct.toFixed(0)}% do gasto
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500 text-center sm:text-left">
                  {categoryDetailsTransactions.length > 0 && (
                    <span>Total de <strong>{categoryDetailsTransactions.length}</strong> {categoryDetailsTransactions.length === 1 ? 'gasto' : 'gastos'} somando <strong>{formatCurrency(detailsSpent)}</strong></span>
                  )}
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setSelectedCategoryForDetails(null)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={() => {
                      const catId = selectedCategoryForDetails.id;
                      setSelectedCategoryForDetails(null);
                      router.push(`/dashboard/gestao?category=${catId}`);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md shadow-primary/25 transition-all active:scale-95"
                  >
                    <span>Gestão de Gastos</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE EDIÇÃO / CRIAÇÃO DE ORÇAMENTO */}
      {/* ========================================================================= */}
      {editModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[150] w-screen h-screen flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
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
                      label: c.budget_limit ? `${c.name} (Atual: ${formatCurrency(c.budget_limit)})` : c.name,
                      color: c.color,
                      icon: c.icon
                    }))}
                  />
                ) : (
                  currentSelectedCategory && (
                    <div className="flex items-center gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl">
                      <CategoryIcon color={currentSelectedCategory.color} icon={currentSelectedCategory.icon} size="sm" />
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
      </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM MODAL: ELIMINAR ORÇAMENTO */}
      {/* ========================================================================= */}
      <ConfirmModal
        isOpen={!!budgetToDelete}
        title="Eliminar Orçamento"
        description={`Tens a certeza que queres eliminar o limite de orçamento para "${budgetToDelete?.name}"?`}
        confirmText="Eliminar Limite"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeletingBudget}
        onConfirm={confirmDeleteBudget}
        onCancel={() => setBudgetToDelete(null)}
      />

    </div>
  );
}
