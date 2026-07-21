"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { Plus, Trash2, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";
import { useSettings } from "@/lib/SettingsContext";
import { toast } from "sonner";

export default function GestaoPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState("expense");

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  // Budget state
  const [budgetCategoryId, setBudgetCategoryId] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");

  const { itemsPerPage } = useSettings();
  const [currentPage, setCurrentPage] = useState(1);

  // Filter state
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterMonth, setFilterMonth] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");

  useEffect(() => {
    setCurrentPage(1);
    fetchData();
  }, [filterYear, filterMonth, filterType, filterCategoryId]);

  async function fetchData() {
    try {
      const query = new URLSearchParams();
      if (filterYear) query.append("year", filterYear);
      if (filterMonth) query.append("month", filterMonth);
      if (filterType) query.append("type", filterType);
      if (filterCategoryId) query.append("category_id", filterCategoryId);

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

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/transactions", {
        amount: parseFloat(amount),
        type,
        category_id: parseInt(categoryId),
        description,
        date
      });
      setAmount("");
      setDescription("");
      fetchData();
      toast.success("Registo adicionado com sucesso!");
    } catch (err) {
      console.error("Failed to add transaction");
      toast.error("Erro ao adicionar registo");
    }
  };

  const handleAddNewCategory = () => {
    setIsAddingCategory(true);
  };

  const confirmAddCategory = async () => {
    if (newCatName && newCatName.trim() !== "") {
      try {
        const res = await api.post("/categories", {
          name: newCatName.trim(),
          type: type,
          color: "#" + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
        });
        setCategories([...categories, res.data]);
        setCategoryId(res.data.id.toString());
        setIsAddingCategory(false);
        setNewCatName("");
        toast.success("Categoria criada com sucesso!");
      } catch (err) {
        toast.error("Erro ao criar categoria");
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/transactions/${id}`);
      fetchData();
      toast.success("Transação eliminada.");
    } catch (err) {
      console.error("Failed to delete transaction");
      toast.error("Erro ao eliminar transação.");
    }
  };

  const handleDeleteCategory = async (id: string | number) => {
    if (confirm("Tens a certeza que queres eliminar esta categoria?")) {
      try {
        await api.delete(`/categories/${id}`);
        fetchData();
        if (categoryId === id.toString()) setCategoryId("");
        if (filterCategoryId === id.toString()) setFilterCategoryId("");
        toast.success("Categoria eliminada com sucesso.");
      } catch (err) {
        console.error("Failed to delete category");
        toast.error("Erro ao eliminar a categoria.");
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT');
  };

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const paginatedTransactions = transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSetBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetCategoryId || !budgetAmount) return;
    try {
      const cat: any = categories.find((c: any) => String(c.id) === String(budgetCategoryId));
      if (cat) {
        await api.put(`/categories/${budgetCategoryId}`, {
          name: cat.name,
          color: cat.color,
          type: cat.type,
          budget_limit: parseFloat(budgetAmount)
        });
        setBudgetAmount("");
        fetchData();
        toast.success("Previsão de gastos atualizada com sucesso!");
      }
    } catch (err) {
      console.error("Failed to set budget");
      toast.error("Erro ao definir previsão.");
    }
  };

  const expensesByCategory = useMemo(() => {
    // Filter only current visible transactions or ALL transactions?
    // User wants "gastos totais em cada categoria", usually this means for the filtered view.
    // We will use the fetched `transactions` which is already filtered by year/month from the API.
    const expenses = transactions.filter((t: any) => t.type === 'expense');
    
    const grouped = expenses.reduce((acc: any, t: any) => {
      acc[t.category_id] = (acc[t.category_id] || 0) + t.amount;
      return acc;
    }, {});

    return Object.keys(grouped).map(catId => {
      const category = categories.find((c: any) => c.id === parseInt(catId));
      return {
        id: catId,
        name: category ? category.name : "Sem Categoria",
        color: category ? category.color : "#94a3b8",
        amount: grouped[catId]
      };
    }).sort((a, b) => b.amount - a.amount);
  }, [transactions, categories]);

  if (loading) return <div className="animate-pulse p-8">A carregar...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Gestão de Dados</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Gere as tuas entradas e saídas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Novo Registo
            </h3>
            
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setType("income")}
                  className={`py-2 px-4 rounded-xl font-semibold transition-all ${type === 'income' ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-2 border-transparent'}`}
                >
                  Receita
                </button>
                <button
                  type="button"
                  onClick={() => setType("expense")}
                  className={`py-2 px-4 rounded-xl font-semibold transition-all ${type === 'expense' ? 'bg-rose-100 text-rose-700 border-2 border-rose-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-2 border-transparent'}`}
                >
                  Despesa
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Valor (€)</label>
                <input type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" placeholder="0.00" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Data</label>
                <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Categoria</label>
                <CustomSelect 
                  required
                  value={categoryId} 
                  onChange={val => setCategoryId(val as string)} 
                  options={categories.filter((c: any) => c.type === type).map((cat: any) => ({ value: cat.id, label: cat.name }))}
                  placeholder="Selecione uma categoria"
                  onAddNew={handleAddNewCategory}
                  addNewLabel="Nova Categoria"
                  onDeleteOption={handleDeleteCategory}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" placeholder="Ex: Supermercado" />
              </div>

              <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all mt-4">
                Guardar Registo
              </button>
            </form>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" /> Previsão de Gastos
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Define um limite mensal de gastos para as tuas categorias de despesa.</p>
            <form onSubmit={handleSetBudget} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Categoria</label>
                <CustomSelect 
                  required
                  value={budgetCategoryId} 
                  onChange={val => {
                    setBudgetCategoryId(String(val));
                    const cat: any = categories.find((c: any) => String(c.id) === String(val));
                    if (cat && cat.budget_limit) setBudgetAmount(cat.budget_limit.toString());
                    else setBudgetAmount("");
                  }} 
                  options={categories.filter((c: any) => c.type === "expense").map((cat: any) => ({ value: cat.id, label: cat.name }))}
                  placeholder="Selecione uma despesa"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Limite Mensal (€)</label>
                <input type="number" step="0.01" required value={budgetAmount} onChange={e => setBudgetAmount(e.target.value)} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" placeholder="0.00" />
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all mt-4">
                Guardar Previsão
              </button>
            </form>
          </div>
        </div>

        {/* Table Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-4 flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Ano</label>
              <CustomSelect 
                value={filterYear}
                onChange={val => setFilterYear(val as string)}
                options={[
                  { value: "", label: "Todos" },
                  { value: "2024", label: "2024" },
                  { value: "2025", label: "2025" },
                  { value: "2026", label: "2026" }
                ]}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Mês</label>
              <CustomSelect 
                value={filterMonth}
                onChange={val => setFilterMonth(val as string)}
                options={[
                  { value: "", label: "Todos" },
                  { value: "1", label: "Janeiro" }, { value: "2", label: "Fevereiro" },
                  { value: "3", label: "Março" }, { value: "4", label: "Abril" },
                  { value: "5", label: "Maio" }, { value: "6", label: "Junho" },
                  { value: "7", label: "Julho" }, { value: "8", label: "Agosto" },
                  { value: "9", label: "Setembro" }, { value: "10", label: "Outubro" },
                  { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" }
                ]}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Tipo</label>
              <CustomSelect 
                value={filterType}
                onChange={val => setFilterType(val as string)}
                options={[
                  { value: "", label: "Ambos" },
                  { value: "income", label: "Receitas" },
                  { value: "expense", label: "Despesas" }
                ]}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Categoria</label>
              <CustomSelect 
                value={filterCategoryId}
                onChange={val => setFilterCategoryId(val as string)}
                options={[
                  { value: "", label: "Todas" },
                  ...categories.map((c: any) => ({ value: c.id, label: c.name }))
                ]}
              />
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/40">
              <h3 className="text-lg font-bold text-slate-900">Histórico de Transações</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                    <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">Data</th>
                    <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">Descrição</th>
                    <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">Categoria</th>
                    <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 text-right">Valor</th>
                    <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        Não existem transações para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    paginatedTransactions.map((t: any) => {
                      const isIncome = t.type === 'income';
                      const category = categories.find((c: any) => c.id === t.category_id);
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800">
                          <td className="p-4 text-slate-600 dark:text-slate-400 text-sm font-medium">{formatDate(t.date)}</td>
                          <td className="p-4 text-slate-900 dark:text-slate-200 font-medium">{t.description || '-'}</td>
                          <td className="p-4">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap max-w-[120px] truncate text-center align-middle" style={{ backgroundColor: `${category?.color}20`, color: category?.color }} title={category?.name || 'Sem Categoria'}>
                              {category?.name || 'Sem Categoria'}
                            </span>
                          </td>
                          <td className={`p-4 text-right font-bold ${isIncome ? 'text-emerald-600 dark:text-emerald-500' : 'text-slate-900 dark:text-slate-200'}`}>
                            {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                          </td>
                          <td className="p-4 text-center">
                            <button onClick={() => handleDelete(t.id)} className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-rose-950/30">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-6 py-4">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  A mostrar {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, transactions.length)} de {transactions.length} registos
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex gap-1 hidden sm:flex">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                      // Show limited pages if too many
                      if (totalPages > 7 && page > 3 && page < totalPages - 2 && Math.abs(currentPage - page) > 1) {
                        if (page === 4 || page === totalPages - 3) return <span key={page} className="px-2 text-slate-400">...</span>;
                        return null;
                      }
                      
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${currentPage === page ? 'bg-primary text-white shadow-md shadow-primary/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Nova Categoria */}
        {isAddingCategory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Nova Categoria</h3>
              <input 
                type="text" 
                value={newCatName} 
                onChange={e => setNewCatName(e.target.value)} 
                placeholder="Ex: Streaming" 
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none mb-6"
                autoFocus
              />
              <div className="flex gap-3">
                <button 
                  onClick={() => { setIsAddingCategory(false); setNewCatName(""); }} 
                  className="flex-1 py-2 font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmAddCategory}
                  disabled={!newCatName.trim()}
                  className="flex-1 py-2 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category Expenses Summary */}
      {expensesByCategory.length > 0 && (
        <div className="mt-8 space-y-4 animate-in slide-in-from-bottom-5 fade-in duration-500 delay-150">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-rose-500" /> Top Categorias de Gastos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {expensesByCategory.map((cat, idx) => {
              const maxAmount = expensesByCategory[0].amount;
              const percent = maxAmount > 0 ? (cat.amount / maxAmount) * 100 : 0;
              
              return (
                <div key={cat.id} className="glass-card p-5 relative overflow-hidden group hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(139,92,246,0.2)] hover:border-primary/50 transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-700/0 to-indigo-900/0 group-hover:from-violet-700/10 group-hover:to-indigo-900/10 transition-colors duration-500 rounded-xl pointer-events-none" />
                  <div 
                    className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-40 h-24 blur-[40px] pointer-events-none rounded-full transition-opacity duration-500 opacity-0 group-hover:opacity-40" 
                    style={{ backgroundColor: cat.color }}
                  />
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]" title={cat.name}>
                        {cat.name}
                      </span>
                    </div>
                    <span className="font-bold text-rose-600 dark:text-rose-500">
                      -{formatCurrency(cat.amount)}
                    </span>
                  </div>
                  
                  {/* Progress bar background */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800/50 h-2 rounded-full overflow-hidden relative z-10">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${percent}%`, 
                        backgroundColor: cat.color 
                      }} 
                    />
                  </div>
                  
                  {/* Ranking Number */}
                  <div className="absolute -right-3 -bottom-5 text-7xl font-black text-slate-900/5 dark:text-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                    #{idx + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
