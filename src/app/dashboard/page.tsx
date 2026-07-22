"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, Wallet } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { CustomSelect } from "@/components/CustomSelect";

export default function DashboardPage() {
  const [summary, setSummary] = useState({ balance: 0, income: 0, expense: 0, investments: 0, chartData: [] });
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [greeting, setGreeting] = useState("Olá");
  const [currentDate, setCurrentDate] = useState("");
  const [username, setUsername] = useState("Utilizador");
  const [profileImage, setProfileImage] = useState<string | null>(null);

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

    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("Bom dia");
    else if (hour >= 12 && hour < 19) setGreeting("Boa tarde");
    else setGreeting("Boa noite");
    
    setCurrentDate(new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
  }, [filterYear, filterMonth]);

  useEffect(() => {
    // Mostrar o pop-up apenas após o login
    if (sessionStorage.getItem("showWelcome") === "true") {
      setShowWelcome(true);
      sessionStorage.removeItem("showWelcome");
    }

    const storedName = localStorage.getItem("username");
    if (storedName) {
      setUsername(storedName.charAt(0).toUpperCase() + storedName.slice(1));
    }
    const storedImage = localStorage.getItem("profileImage");
    if (storedImage) {
      setProfileImage(storedImage);
    }
  }, []);

  const expensesByCategory = useMemo(() => {
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
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{greeting}, {username}</h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1 capitalize">{currentDate}</p>
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
        <div className="glass-card p-6 relative overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:shadow-violet-500/30 hover:-translate-y-1 cursor-default shadow-[0_0_30px_rgba(139,92,246,0.15)] dark:shadow-[0_0_50px_rgba(139,92,246,0.15)]">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-700 to-indigo-900 opacity-100 group-hover:opacity-0 transition-opacity duration-500 pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-fuchsia-500/40 blur-[50px] pointer-events-none rounded-full" />
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
                <defs>
                  <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb7185" stopOpacity={1} />
                    <stop offset="100%" stopColor="#e11d48" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={yAxisTickFormatter} width={45} />
                <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)', color: '#f8fafc' }} itemStyle={{ color: '#e2e8f0', fontWeight: 500 }} />
                <Bar dataKey="receitas" fill="url(#colorReceitas)" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="despesas" fill="url(#colorDespesas)" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6 relative overflow-hidden shadow-[0_0_30px_rgba(139,92,246,0.05)] dark:shadow-[0_0_40px_rgba(139,92,246,0.05)]">
          <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-indigo-600/30 blur-[60px] pointer-events-none rounded-full" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 relative z-10">Evolução Patrimonial</h3>
          <div className="h-[240px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary.chartData || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={yAxisTickFormatter} width={45} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)', color: '#f8fafc' }} itemStyle={{ color: '#e2e8f0', fontWeight: 500 }} />
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
            className="relative w-full overflow-hidden flex pt-24 pb-20 -mt-20 -mb-12"
            style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}
          >
            <div className="animate-marquee flex gap-4 mt-4">
              {/* Duplicate the array twice to ensure a smooth infinite loop */}
              {[...transactions, ...transactions, ...transactions].map((t: any, i: number) => (
                <div key={i} className="relative group flex-shrink-0 w-64 glass-card p-4 border border-slate-200/60 dark:border-slate-800 transition-all duration-500 cursor-pointer bg-white dark:bg-slate-900 hover:border-primary/50 hover:-translate-y-4 hover:-rotate-[5deg] hover:shadow-[0_0_40px_rgba(139,92,246,0.3)] hover:z-20">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-700/0 to-indigo-900/0 group-hover:from-violet-700/10 group-hover:to-indigo-900/10 transition-colors duration-500 rounded-xl pointer-events-none" />
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-32 h-20 bg-indigo-600/0 group-hover:bg-indigo-600/40 blur-[40px] pointer-events-none rounded-full transition-colors duration-500" />
                  
                  <div className="relative z-10">
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
                  </div>

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

      {/* Welcome Premium Modal */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-700">
          <div className="relative w-full max-w-md rounded-[20px] overflow-hidden p-[2px] shadow-[0_0_80px_rgba(139,92,246,0.3)] group">
            {/* Animated glowing borders */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] animate-spin pointer-events-none" 
              style={{ animationDuration: '4s', background: 'conic-gradient(from 0deg, transparent 0 280deg, #8b5cf6 360deg)' }} 
            />
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] animate-spin pointer-events-none" 
              style={{ animationDuration: '6s', animationDirection: 'reverse', background: 'conic-gradient(from 0deg, transparent 0 280deg, #3b82f6 360deg)' }} 
            />
            
            {/* Inner Content */}
            <div className="relative bg-white dark:bg-slate-900 p-8 rounded-[18px] h-full w-full z-10 flex flex-col items-center animate-in zoom-in-95 duration-500 delay-150">
              <button onClick={() => setShowWelcome(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
              
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 shadow-xl border-4 border-white dark:border-slate-800 flex items-center justify-center relative z-10 mb-6 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/20 to-indigo-500/20 animate-pulse" />
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-tr from-violet-500 to-indigo-500">
                      {username.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="text-center mb-8 w-full">
                  <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-500 mb-2">{greeting}, {username}!</h2>
                  <p className="text-slate-500 dark:text-slate-400">Aqui tens o resumo de como está a tua saúde financeira neste mês.</p>
                </div>
              </div>
              
              <div className="space-y-4 w-full">
                <div className={`p-5 rounded-2xl border relative overflow-hidden transition-colors ${
                  summary.balance >= 0 
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 group-hover:border-emerald-500/30' 
                    : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 group-hover:border-rose-500/30'
                }`}>
                  <div className={`absolute -right-4 -top-4 w-24 h-24 blur-xl rounded-full ${
                    summary.balance >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                  }`} />
                  <p className={`text-sm font-semibold mb-1 ${
                    summary.balance >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'
                  }`}>Saldo Atual</p>
                  <p className={`text-3xl font-bold ${
                    summary.balance >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                  }`}>{formatCurrency(summary.balance)}</p>
                </div>
                
                {expensesByCategory.length > 0 && (
                  <div className="bg-rose-50/50 dark:bg-rose-950/20 p-5 rounded-2xl border border-rose-100 dark:border-rose-900/30 relative overflow-hidden group-hover:border-rose-500/30 transition-colors">
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-500/10 blur-xl rounded-full" />
                    <p className="text-sm font-semibold text-rose-500 mb-2">Maior Gasto do Mês</p>
                    <div className="flex justify-between items-end relative z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shadow-sm shadow-rose-500/50" style={{ backgroundColor: expensesByCategory[0].color }} />
                        <p className="font-bold text-slate-800 dark:text-rose-100 truncate max-w-[120px]">{expensesByCategory[0].name}</p>
                      </div>
                      <p className="text-xl font-bold text-rose-600 dark:text-rose-400">-{formatCurrency(expensesByCategory[0].amount)}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <button onClick={() => setShowWelcome(false)} className="mt-8 w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-1">
                Aceder ao Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
