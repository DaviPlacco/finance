"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, Wallet } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { CustomSelect } from "@/components/CustomSelect";

export default function DashboardPage() {
  const [summary, setSummary] = useState({ balance: 0, income: 0, expense: 0, investments: 0, chartData: [] });
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterMonth, setFilterMonth] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const query = new URLSearchParams();
        if (filterYear) query.append("year", filterYear);
        if (filterMonth) query.append("month", filterMonth);

        const [sumRes, transRes, catRes] = await Promise.all([
          api.get(`/summary?${query.toString()}`),
          api.get(`/transactions?${query.toString()}`),
          api.get("/categories")
        ]);
        setSummary(sumRes.data);
        setTransactions(transRes.data);
        setCategories(catRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filterYear, filterMonth]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const yAxisTickFormatter = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1).replace('.0', '')}k`;
    }
    return value.toString();
  };

  if (loading) return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-slate-200 rounded w-3/4"></div></div></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Visão Geral</h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">Resumo da tua saúde financeira.</p>
        </div>
        <div className="flex gap-4">
          <div className="w-32">
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
          <div className="w-40">
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
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="glass-card p-6 relative overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:shadow-violet-500/30 hover:-translate-y-1 cursor-default">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-700 to-indigo-900 opacity-100 group-hover:opacity-0 transition-opacity duration-500 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-violet-100 group-hover:text-slate-500 dark:group-hover:text-slate-400 uppercase tracking-wider transition-colors duration-500">Saldo Atual</h3>
              <div className="p-2 bg-white/20 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 rounded-lg transition-colors duration-500">
                <Wallet className="w-5 h-5 text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-500" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-white group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-500">{formatCurrency(summary.balance)}</p>
          </div>
        </div>

        <div className="glass-card p-6 relative overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:shadow-violet-500/30 hover:-translate-y-1 cursor-default">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-700 to-indigo-900 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-500 group-hover:text-violet-100 uppercase tracking-wider transition-colors duration-500">Receitas (Mês)</h3>
              <div className="p-2 bg-green-50 group-hover:bg-white/20 rounded-lg transition-colors duration-500">
                <ArrowUpRight className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors duration-500" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-500 group-hover:text-white transition-colors duration-500">{formatCurrency(summary.income)}</p>
          </div>
        </div>

        <div className="glass-card p-6 relative overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:shadow-violet-500/30 hover:-translate-y-1 cursor-default">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-700 to-indigo-900 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-500 group-hover:text-violet-100 uppercase tracking-wider transition-colors duration-500">Despesas (Mês)</h3>
              <div className="p-2 bg-red-50 group-hover:bg-white/20 rounded-lg transition-colors duration-500">
                <ArrowDownRight className="w-5 h-5 text-rose-600 group-hover:text-white transition-colors duration-500" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-rose-600 dark:text-rose-500 group-hover:text-white transition-colors duration-500">{formatCurrency(summary.expense)}</p>
          </div>
        </div>

        <div className="glass-card p-6 relative overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:shadow-violet-500/30 hover:-translate-y-1 cursor-default">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-700 to-indigo-900 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-500 group-hover:text-violet-100 uppercase tracking-wider transition-colors duration-500">Investido</h3>
              <div className="p-2 bg-primary/10 group-hover:bg-white/20 rounded-lg transition-colors duration-500">
                <TrendingUp className="w-5 h-5 text-primary group-hover:text-white transition-colors duration-500" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white group-hover:text-white transition-colors duration-500">{formatCurrency(summary.investments || 0)}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Fluxo de Caixa {filterMonth ? '(Diário)' : '(Mensal)'}</h3>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.chartData || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={yAxisTickFormatter} width={45} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="receitas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Evolução Patrimonial</h3>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary.chartData || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={yAxisTickFormatter} width={45} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="receitas" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Infinite Transaction Carousel */}
      {transactions.length > 0 && (
        <div className="mt-4 relative">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Últimos Movimentos</h3>
          <div 
            className="relative w-full overflow-hidden flex pt-24 pb-8 -mt-20"
            style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}
          >
            <div className="animate-marquee flex gap-4 mt-20">
              {/* Duplicate the array twice to ensure a smooth infinite loop */}
              {[...transactions, ...transactions, ...transactions].map((t: any, i: number) => (
                <div key={i} className="relative group flex-shrink-0 w-64 glass-card p-4 border border-slate-200/60 dark:border-slate-800 hover:border-primary/50 transition-colors cursor-pointer bg-white dark:bg-slate-900">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-slate-500">{new Date(t.date).toLocaleDateString('pt-PT')}</span>
                    <span 
                      className="text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap max-w-[100px] truncate"
                      style={{ 
                        backgroundColor: `${categories.find((c: any) => c.id === t.category_id)?.color || (t.type === 'income' ? '#10b981' : '#f43f5e')}20`, 
                        color: categories.find((c: any) => c.id === t.category_id)?.color || (t.type === 'income' ? '#047857' : '#be123c') 
                      }}
                      title={categories.find((c: any) => c.id === t.category_id)?.name || (t.type === 'income' ? 'Receita' : 'Despesa')}
                    >
                      {categories.find((c: any) => c.id === t.category_id)?.name || (t.type === 'income' ? 'Receita' : 'Despesa')}
                    </span>
                  </div>
                  <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{t.description}</p>
                  <p className={`font-extrabold text-lg mt-1 ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </p>

                  {/* Hover Toast / Tooltip */}
                  <div className="absolute -top-20 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 glass-card text-slate-900 dark:text-white text-sm py-3 px-4 w-max max-w-[250px] shadow-2xl scale-95 group-hover:scale-100 origin-bottom">
                    <div className="font-extrabold text-base">{t.description}</div>
                    <div className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">
                      Categoria: {categories.find((c: any) => c.id === t.category_id)?.name || "Sem Categoria"}
                    </div>
                    {/* Arrow */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 glass-card border-t-0 border-l-0 rotate-45" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
