"use client";

import { useEffect, useState } from "react";
import { useMonthFilter } from "@/hooks/useMonthFilter";
import { api } from "@/lib/api";
import { PieChart, TrendingDown, AlertTriangle, CheckCircle2, Trash2, X, PiggyBank } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";
import { toast } from "sonner";

export default function OrcamentosPage() {
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

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
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const handleDeleteBudget = async (categoryId: number, category: any) => {
    if (!window.confirm("Tens a certeza que queres eliminar esta previsão de gastos?")) return;
    try {
      await api.put(`/categories/${categoryId}`, {
        name: category.name,
        color: category.color,
        type: category.type,
        budget_limit: null
      });
      toast.error("Previsão eliminada com sucesso!");
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao eliminar a previsão.");
    }
  };

  if (loading) return <div className="animate-pulse p-8">A carregar previsões...</div>;

  // Filter categories that have a budget limit and are expenses
  const budgetCategories = categories.filter((c: any) => c.type === 'expense' && c.budget_limit && c.budget_limit > 0);

  // Calculate spent amount per category
  const categorySpending: Record<string, number> = {};
  let totalSpent = 0;
  transactions.forEach((t: any) => {
    if (!categorySpending[t.category_id]) categorySpending[t.category_id] = 0;
    categorySpending[t.category_id] += t.amount;
    
    // Contar gasto total apenas para categorias orçamentadas
    if (budgetCategories.find((c: any) => c.id === t.category_id)) {
      totalSpent += t.amount;
    }
  });

  const totalBudget = budgetCategories.reduce((acc: number, cat: any) => acc + cat.budget_limit, 0);
  const budgetDiff = totalBudget - totalSpent;
  const overBudget = budgetDiff < 0;

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
        <div className="flex flex-wrap gap-2">
          <CustomSelect value={filterYear} onChange={setFilterYear as any} options={[{value:"2025",label:"2025"},{value:"2026",label:"2026"}]} />
          <CustomSelect value={filterMonth} onChange={setFilterMonth as any} options={[{value:"1",label:"Jan"},{value:"2",label:"Fev"},{value:"3",label:"Mar"},{value:"4",label:"Abr"},{value:"5",label:"Mai"},{value:"6",label:"Jun"},{value:"7",label:"Jul"},{value:"8",label:"Ago"},{value:"9",label:"Set"},{value:"10",label:"Out"},{value:"11",label:"Nov"},{value:"12",label:"Dez"}]} />
        </div>
      </div>

      {totalBudget > 0 && (
        <div className={`glass-card p-6 flex items-center gap-6 ${overBudget ? 'bg-rose-50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-900/30' : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/30'}`}>
          <div className={`p-4 rounded-xl shrink-0 ${overBudget ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]' : 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'}`}>
            {overBudget ? <AlertTriangle className="w-8 h-8" /> : <PiggyBank className="w-8 h-8" />}
          </div>
          <div>
            <h3 className={`text-xl font-bold ${overBudget ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
              {overBudget ? 'Orçamento Ultrapassado' : 'Orçamento Controlado'}
            </h3>
            <p className={`mt-1 font-medium text-lg ${overBudget ? 'text-rose-600 dark:text-rose-500' : 'text-emerald-600 dark:text-emerald-500'}`}>
              {overBudget ? (
                <>Passaste o teu limite total em <strong className="text-2xl font-black ml-1">{formatCurrency(Math.abs(budgetDiff))}</strong></>
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
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Ainda não definiste nenhum limite mensal para as tuas categorias. Vai à aba <strong>Gestão</strong> e adiciona as tuas previsões para começares a controlar o teu dinheiro a 100%.
          </p>
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
                  <div className="flex items-center gap-3">
                    {statusIcon}
                    <button 
                      onClick={() => handleDeleteBudget(cat.id, cat)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Eliminar previsão"
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

    </div>
  );
}
