"use client";

import { useState, useMemo, useEffect } from "react";
import { Lightbulb, Plus, Trash2, TrendingUp, TrendingDown, Wallet, Calculator, FileText, Download } from "lucide-react";
import { exportSimulacaoToCSV, exportSimulacaoToPDF } from "@/lib/exportUtils";

type Transaction = {
  id: string;
  name: string;
  amount: number;
};

export default function SimulacaoPage() {
  const [incomes, setIncomes] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Pagination states for expenses
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
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

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Lightbulb className="w-8 h-8 text-primary" />
            Simulação Mensal
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Planeia e prevê as tuas receitas e despesas para o próximo mês.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button onClick={() => exportSimulacaoToCSV(incomes, expenses)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 hover:text-emerald-600 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all font-semibold text-sm shadow-sm">
            <FileText className="w-4 h-4 text-emerald-500" /> Exportar CSV
          </button>
          <button onClick={() => exportSimulacaoToPDF(incomes, expenses)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 hover:text-rose-600 hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all font-semibold text-sm shadow-sm">
            <Download className="w-4 h-4 text-rose-500" /> Exportar PDF
          </button>
        </div>
      </div>

      {/* Painel de Resultados */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 border-l-4 border-l-emerald-500 hover:-translate-y-1 transition-transform duration-300">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Total Receitas
          </h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalIncome)}</p>
        </div>

        <div className="glass-card p-6 border-l-4 border-l-rose-500 hover:-translate-y-1 transition-transform duration-300">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-rose-500" /> Total Despesas
          </h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalExpense)}</p>
        </div>

        <div className={`glass-card p-6 border-l-4 hover:-translate-y-1 transition-transform duration-300 ${balance >= 0 ? 'border-l-primary' : 'border-l-rose-600'}`}>
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Wallet className={`w-4 h-4 ${balance >= 0 ? 'text-primary' : 'text-rose-600'}`} /> Saldo Previsto (Sobra)
          </h3>
          <p className={`text-3xl font-extrabold ${balance >= 0 ? 'text-primary' : 'text-rose-600'}`}>
            {formatCurrency(balance)}
          </p>
          <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {balance >= 0 ? 'Excelente! Estás com saldo positivo.' : 'Atenção! As despesas superam as receitas.'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Receitas */}
        <div className="glass-card p-6 space-y-6 border-t-4 border-t-emerald-500">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" /> Fontes de Receita
          </h2>

          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Ex: Freelance..."
                value={newIncomeName}
                onChange={(e) => setNewIncomeName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddIncome()}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
              />
            </div>
            <div className="w-1/3">
              <input
                type="number"
                placeholder="Valor (€)"
                value={newIncomeAmount}
                onChange={(e) => setNewIncomeAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddIncome()}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
              />
            </div>
            <button 
              onClick={handleAddIncome}
              disabled={!newIncomeName || !newIncomeAmount}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors shadow-md shadow-emerald-500/20 flex items-center justify-center"
              title="Adicionar Receita"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3 mt-4">
            {incomes.length === 0 ? (
              <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                Nenhuma receita adicionada.
              </div>
            ) : (
              incomes.map(income => (
                <div key={income.id} className="flex justify-between items-center p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{income.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-emerald-500">{formatCurrency(income.amount)}</span>
                    <button 
                      onClick={() => handleRemoveIncome(income.id)}
                      className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
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
        <div className="glass-card p-6 space-y-6 border-t-4 border-t-rose-500">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-rose-500" /> Lista de Despesas
          </h2>

          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Ex: Internet..."
                value={newExpenseName}
                onChange={(e) => setNewExpenseName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddExpense()}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none transition-all font-medium"
              />
            </div>
            <div className="w-1/3">
              <input
                type="number"
                placeholder="Valor (€)"
                value={newExpenseAmount}
                onChange={(e) => setNewExpenseAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddExpense()}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none transition-all font-medium"
              />
            </div>
            <button 
              onClick={handleAddExpense}
              disabled={!newExpenseName || !newExpenseAmount}
              className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors shadow-md shadow-rose-500/20 flex items-center justify-center"
              title="Adicionar Despesa"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3 mt-4">
            {currentExpenses.length === 0 ? (
              <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                Nenhuma despesa adicionada nesta página.
              </div>
            ) : (
              currentExpenses.map(expense => (
                <div key={expense.id} className="flex justify-between items-center p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{expense.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-rose-500">{formatCurrency(expense.amount)}</span>
                    <button 
                      onClick={() => handleRemoveExpense(expense.id)}
                      className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Pagination Controls */}
            {expenses.length > 0 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Itens por página:</span>
                  <select 
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="text-xs font-semibold bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-rose-500 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <option value={3}>3</option>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Anterior
                  </button>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Página <strong className="text-slate-700 dark:text-slate-200">{currentPage}</strong> de {totalPages}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
