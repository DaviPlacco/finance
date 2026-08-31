"use client";

import { useState, useMemo, useEffect } from "react";
import { Lightbulb, Plus, Trash2, TrendingUp, TrendingDown, Wallet, Calculator, FileText, Download, Save, X, Eye } from "lucide-react";
import { exportSimulacaoToCSV, exportSimulacaoToPDF } from "@/lib/exportUtils";
import { api } from "@/lib/api";
import { ModalPortal } from "@/components/ModalPortal";
import { toast } from "sonner";

type Transaction = {
  id: string;
  name: string;
  amount: number;
};

type SavedSimulation = {
  id: number;
  name: string;
  incomes_data: string;
  expenses_data: string;
  created_at: string;
};

export default function SimulacaoPage() {
  const [incomes, setIncomes] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Pagination states for expenses
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [savedSimulations, setSavedSimulations] = useState<SavedSimulation[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [simulationName, setSimulationName] = useState("");
  const [viewingSimulation, setViewingSimulation] = useState<SavedSimulation | null>(null);

  const fetchSimulations = async () => {
    try {
      const res = await api.get("/simulations");
      setSavedSimulations(res.data);
    } catch (e) {
      console.error("Erro ao carregar simulações");
    }
  };

  useEffect(() => {
    fetchSimulations();
    const saved = localStorage.getItem("simulacao_cache");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const now = Date.now();
        // 10 minutes = 600,000 milliseconds
        if (now - parsed.timestamp < 600000) {
          setIncomes(parsed.incomes || []);
          setExpenses(parsed.expenses || []);
        } else {
          setIncomes([{ id: "1", name: "Salário", amount: 2500 }]);
          setExpenses([
            { id: "1", name: "Renda da Casa", amount: 800 },
            { id: "2", name: "Supermercado", amount: 300 }
          ]);
        }
      } catch (e) {
        setIncomes([{ id: "1", name: "Salário", amount: 2500 }]);
        setExpenses([
          { id: "1", name: "Renda da Casa", amount: 800 },
          { id: "2", name: "Supermercado", amount: 300 }
        ]);
      }
    } else {
      setIncomes([{ id: "1", name: "Salário", amount: 2500 }]);
      setExpenses([
        { id: "1", name: "Renda da Casa", amount: 800 },
        { id: "2", name: "Supermercado", amount: 300 }
      ]);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("simulacao_cache", JSON.stringify({
        timestamp: Date.now(),
        incomes,
        expenses
      }));
    }
  }, [incomes, expenses, isLoaded]);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const totalPages = Math.ceil(expenses.length / itemsPerPage) || 1;
  const currentExpenses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return expenses.slice(start, start + itemsPerPage);
  }, [expenses, currentPage, itemsPerPage]);

  const [newIncomeName, setNewIncomeName] = useState("");
  const [newIncomeAmount, setNewIncomeAmount] = useState("");
  
  const [newExpenseName, setNewExpenseName] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const handleAddIncome = () => {
    if (!newIncomeName || !newIncomeAmount) return;
    const newTx: Transaction = {
      id: Date.now().toString(),
      name: newIncomeName,
      amount: parseFloat(newIncomeAmount)
    };
    setIncomes([...incomes, newTx]);
    setNewIncomeName("");
    setNewIncomeAmount("");
  };

  const handleRemoveIncome = (id: string) => {
    setIncomes(incomes.filter(inc => inc.id !== id));
  };

  const handleAddExpense = () => {
    if (!newExpenseName || !newExpenseAmount) return;
    const newTx: Transaction = {
      id: Date.now().toString(),
      name: newExpenseName,
      amount: parseFloat(newExpenseAmount)
    };
    setExpenses([...expenses, newTx]);
    setNewExpenseName("");
    setNewExpenseAmount("");
  };

  const handleRemoveExpense = (id: string) => {
    setExpenses(expenses.filter(exp => exp.id !== id));
  };

  const totalIncome = useMemo(() => {
    return incomes.reduce((acc, curr) => acc + curr.amount, 0);
  }, [incomes]);

  const totalExpense = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [expenses]);

  const balance = totalIncome - totalExpense;

  const handleSaveSimulation = async () => {
    if (!simulationName.trim()) {
      toast.error("Introduz um nome para a simulação.");
      return;
    }
    setIsSaving(true);
    try {
      await api.post("/simulations", {
        name: simulationName,
        incomes_data: JSON.stringify(incomes),
        expenses_data: JSON.stringify(expenses)
      });
      toast.success("Simulação guardada com sucesso!");
      setShowSaveModal(false);
      setSimulationName("");
      fetchSimulations();
    } catch (error) {
      toast.error("Erro ao guardar simulação.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSimulation = (id: number) => {
    toast("Apagar simulação?", {
      description: "Esta ação não pode ser desfeita.",
      action: {
        label: "Sim, apagar",
        onClick: async () => {
          try {
             await api.delete(`/simulations/${id}`);
             toast.success("Simulação apagada.");
             fetchSimulations();
             if (viewingSimulation?.id === id) setViewingSimulation(null);
          } catch (e) {
             toast.error("Erro ao apagar simulação.");
          }
        }
      },
      cancel: {
        label: "Cancelar",
        onClick: () => {}
      }
    });
  };

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 pb-10 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Lightbulb className="w-6 h-6 sm:w-8 sm:h-8 text-primary shrink-0" />
            Simulação Mensal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Planeia e prevê as tuas receitas e despesas para o próximo mês.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <button onClick={() => setShowSaveModal(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-primary hover:brightness-110 text-white rounded-xl transition-all font-semibold text-xs sm:text-sm shadow-sm shadow-primary/20">
            <Save className="w-4 h-4 shrink-0" /> <span>Guardar</span>
          </button>
          <button onClick={() => exportSimulacaoToCSV(incomes, expenses)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 hover:text-emerald-600 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all font-semibold text-xs sm:text-sm shadow-sm">
            <FileText className="w-4 h-4 text-emerald-500 shrink-0" /> <span>CSV</span>
          </button>
          <button onClick={() => exportSimulacaoToPDF(incomes, expenses)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 hover:text-rose-600 hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all font-semibold text-xs sm:text-sm shadow-sm">
            <Download className="w-4 h-4 text-rose-500 shrink-0" /> <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Painel de Resultados */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <div className="glass-card p-4 sm:p-6 border-l-4 border-l-emerald-500 hover:-translate-y-1 active:scale-[0.98] transition-transform duration-300">
          <h3 className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Total Receitas
          </h3>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white truncate">{formatCurrency(totalIncome)}</p>
        </div>

        <div className="glass-card p-4 sm:p-6 border-l-4 border-l-rose-500 hover:-translate-y-1 active:scale-[0.98] transition-transform duration-300">
          <h3 className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
            <TrendingDown className="w-4 h-4 text-rose-500" /> Total Despesas
          </h3>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white truncate">{formatCurrency(totalExpense)}</p>
        </div>

        <div className={`glass-card p-4 sm:p-6 border-l-4 hover:-translate-y-1 active:scale-[0.98] transition-transform duration-300 ${balance >= 0 ? 'border-l-primary' : 'border-l-rose-600'}`}>
          <h3 className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
            <Wallet className={`w-4 h-4 ${balance >= 0 ? 'text-primary' : 'text-rose-600'}`} /> Saldo Previsto
          </h3>
          <p className={`text-2xl sm:text-3xl font-extrabold truncate ${balance >= 0 ? 'text-primary' : 'text-rose-600'}`}>
            {formatCurrency(balance)}
          </p>
          <div className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {balance >= 0 ? 'Excelente! Estás com saldo positivo.' : 'Atenção! Despesas superam receitas.'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Receitas */}
        <div className="glass-card p-6 space-y-6 border-t-4 border-t-emerald-500">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" /> Fontes de Receita
          </h2>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Ex: Freelance..."
                value={newIncomeName}
                onChange={(e) => setNewIncomeName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddIncome()}
                className="w-full px-4 py-2.5 sm:py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-sm sm:text-base"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <input
                type="number"
                placeholder="Valor (€)"
                value={newIncomeAmount}
                onChange={(e) => setNewIncomeAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddIncome()}
                className="flex-1 sm:w-36 px-4 py-2.5 sm:py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-sm sm:text-base"
              />
              <button 
                onClick={handleAddIncome}
                disabled={!newIncomeName || !newIncomeAmount}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 sm:p-3 rounded-xl transition-colors shadow-md shadow-emerald-500/20 flex items-center justify-center shrink-0"
                title="Adicionar Receita"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            {incomes.length === 0 ? (
              <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                Nenhuma receita adicionada.
              </div>
            ) : (
              incomes.map(income => (
                <div key={income.id} className="flex justify-between items-center p-3.5 sm:p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                  <span className="font-semibold text-sm sm:text-base text-slate-700 dark:text-slate-200 truncate mr-2">{income.name}</span>
                  <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                    <span className="font-bold text-sm sm:text-base text-emerald-500">{formatCurrency(income.amount)}</span>
                    <button 
                      onClick={() => handleRemoveIncome(income.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Coluna Despesas */}
        <div className="glass-card p-5 sm:p-6 space-y-6 border-t-4 border-t-rose-500">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-rose-500" /> Lista de Despesas
          </h2>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Ex: Internet, Renda..."
                value={newExpenseName}
                onChange={(e) => setNewExpenseName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddExpense()}
                className="w-full px-4 py-2.5 sm:py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none transition-all font-medium text-sm sm:text-base"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <input
                type="number"
                placeholder="Valor (€)"
                value={newExpenseAmount}
                onChange={(e) => setNewExpenseAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddExpense()}
                className="flex-1 sm:w-36 px-4 py-2.5 sm:py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none transition-all font-medium text-sm sm:text-base"
              />
              <button 
                onClick={handleAddExpense}
                disabled={!newExpenseName || !newExpenseAmount}
                className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 sm:p-3 rounded-xl transition-colors shadow-md shadow-rose-500/20 flex items-center justify-center shrink-0"
                title="Adicionar Despesa"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            {currentExpenses.length === 0 ? (
              <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                Nenhuma despesa adicionada nesta página.
              </div>
            ) : (
              currentExpenses.map(expense => (
                <div key={expense.id} className="flex justify-between items-center p-3.5 sm:p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                  <span className="font-semibold text-sm sm:text-base text-slate-700 dark:text-slate-200 truncate mr-2">{expense.name}</span>
                  <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                    <span className="font-bold text-sm sm:text-base text-rose-500">{formatCurrency(expense.amount)}</span>
                    <button 
                      onClick={() => handleRemoveExpense(expense.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Pagination Controls */}
            {expenses.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 gap-3">
                <div className="flex items-center justify-between w-full sm:w-auto gap-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Itens por página:</span>
                  <select 
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="text-xs font-semibold bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-rose-500 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <option value={3}>3</option>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between w-full sm:w-auto gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Anterior
                  </button>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 px-1 whitespace-nowrap">
                    Página <strong className="text-slate-700 dark:text-slate-200">{currentPage}</strong> de {totalPages}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Simulações Guardadas */}
      <div className="mt-12 glass-card p-5 sm:p-8 border-t-4 border-indigo-500">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
          <Save className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" /> Simulações Guardadas
        </h2>
        
        {savedSimulations.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            Ainda não guardaste nenhuma simulação.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedSimulations.map(sim => {
               const pIncomes = JSON.parse(sim.incomes_data);
               const pExpenses = JSON.parse(sim.expenses_data);
               const tInc = pIncomes.reduce((acc: any, c: any) => acc + c.amount, 0);
               const tExp = pExpenses.reduce((acc: any, c: any) => acc + c.amount, 0);
               const sBal = tInc - tExp;
               
               return (
                  <div key={sim.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group" onClick={() => setViewingSimulation(sim)}>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 transition-colors line-clamp-1">{sim.name}</h3>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteSimulation(sim.id); }} className="text-slate-400 hover:text-rose-500 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Receitas:</span>
                        <span className="font-medium text-emerald-600">{formatCurrency(tInc)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Despesas:</span>
                        <span className="font-medium text-rose-600">{formatCurrency(tExp)}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between font-bold">
                        <span className="text-slate-700 dark:text-slate-300">Saldo:</span>
                        <span className={sBal >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{formatCurrency(sBal)}</span>
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-slate-400 text-right">
                      {new Date(sim.created_at).toLocaleDateString('pt-PT')}
                    </div>
                  </div>
               );
            })}
          </div>
        )}
      </div>

      {/* Modal Guardar Simulação */}
      {showSaveModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[150] w-screen h-screen flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Guardar Simulação</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Dá um nome para identificares esta simulação no futuro (ex: Cenário Pessimista Agosto).</p>
              <input 
                type="text" 
                placeholder="Nome da simulação..." 
                value={simulationName}
                onChange={(e) => setSimulationName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium mb-6"
                autoFocus
              />
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-semibold"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveSimulation}
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 bg-primary hover:brightness-110 text-white rounded-xl transition-colors font-semibold disabled:opacity-70"
                >
                  {isSaving ? 'A guardar...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal Ver Simulação */}
      {viewingSimulation && (
        <ModalPortal>
          <div className="fixed inset-0 z-[150] w-screen h-screen flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
              <div className="min-w-0 pr-2">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                  <Eye className="w-5 h-5 text-primary shrink-0" /> {viewingSimulation.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Guardada a {new Date(viewingSimulation.created_at).toLocaleDateString('pt-PT')}</p>
              </div>
              <button onClick={() => setViewingSimulation(null)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors shrink-0">
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
              {(() => {
                const pIncomes = JSON.parse(viewingSimulation.incomes_data);
                const pExpenses = JSON.parse(viewingSimulation.expenses_data);
                const tInc = pIncomes.reduce((acc: any, c: any) => acc + c.amount, 0);
                const tExp = pExpenses.reduce((acc: any, c: any) => acc + c.amount, 0);
                const sBal = tInc - tExp;

                return (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
                      <div className="bg-emerald-50/80 dark:bg-emerald-950/30 p-3 sm:p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 flex sm:flex-col justify-between sm:justify-center items-center text-left sm:text-center">
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-0 sm:mb-1">Receitas</p>
                        <p className="text-base sm:text-xl font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(tInc)}</p>
                      </div>
                      <div className="bg-rose-50/80 dark:bg-rose-950/30 p-3 sm:p-4 rounded-xl border border-rose-200/60 dark:border-rose-800/40 flex sm:flex-col justify-between sm:justify-center items-center text-left sm:text-center">
                        <p className="text-xs text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider mb-0 sm:mb-1">Despesas</p>
                        <p className="text-base sm:text-xl font-black text-rose-700 dark:text-rose-400">{formatCurrency(tExp)}</p>
                      </div>
                      <div className={`p-3 sm:p-4 rounded-xl border flex sm:flex-col justify-between sm:justify-center items-center text-left sm:text-center ${sBal >= 0 ? 'bg-primary/10 border-primary/30' : 'bg-orange-50/80 dark:bg-orange-950/30 border-orange-200/60 dark:border-orange-800/40'}`}>
                        <p className={`text-xs font-bold uppercase tracking-wider mb-0 sm:mb-1 ${sBal >= 0 ? 'text-primary' : 'text-orange-600 dark:text-orange-400'}`}>Saldo</p>
                        <p className={`text-base sm:text-xl font-black ${sBal >= 0 ? 'text-primary' : 'text-orange-700 dark:text-orange-400'}`}>{formatCurrency(sBal)}</p>
                      </div>
                    </div>

                    {/* Details lists */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2 text-sm sm:text-base">
                          <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" /> Detalhe Receitas
                        </h4>
                        <ul className="space-y-1.5">
                          {pIncomes.map((inc: any, i: number) => (
                            <li key={i} className="flex justify-between items-center text-sm py-1.5 border-b border-slate-100/60 dark:border-slate-800/60 gap-3">
                              <span className="text-slate-600 dark:text-slate-400 font-medium truncate">{inc.name}</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 shrink-0">{formatCurrency(inc.amount)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2 text-sm sm:text-base">
                          <TrendingDown className="w-4 h-4 text-rose-500 shrink-0" /> Detalhe Despesas
                        </h4>
                        <ul className="space-y-1.5">
                          {pExpenses.map((exp: any, i: number) => (
                            <li key={i} className="flex justify-between items-center text-sm py-1.5 border-b border-slate-100/60 dark:border-slate-800/60 gap-3">
                              <span className="text-slate-600 dark:text-slate-400 font-medium truncate">{exp.name}</span>
                              <span className="font-bold text-rose-600 dark:text-rose-400 shrink-0">{formatCurrency(exp.amount)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <button 
                onClick={() => {
                  const pIncomes = JSON.parse(viewingSimulation.incomes_data);
                  const pExpenses = JSON.parse(viewingSimulation.expenses_data);
                  exportSimulacaoToCSV(pIncomes, pExpenses);
                }} 
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:text-emerald-600 hover:border-emerald-500 transition-colors text-sm font-bold shadow-sm"
              >
                <FileText className="w-4 h-4" /> CSV
              </button>
              <button 
                onClick={() => {
                  const pIncomes = JSON.parse(viewingSimulation.incomes_data);
                  const pExpenses = JSON.parse(viewingSimulation.expenses_data);
                  exportSimulacaoToPDF(pIncomes, pExpenses);
                }} 
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:brightness-110 text-white rounded-xl transition-colors text-sm font-bold shadow-sm"
              >
                <Download className="w-4 h-4" /> Exportar PDF
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
      )}
    </div>
  );
}
