"use client";

import { useEffect, useState, useMemo } from "react";
import { useMonthFilter } from "@/hooks/useMonthFilter";
import { api } from "@/lib/api";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  Wallet,
  BarChart3,
  LineChart as LineChartIcon,
  AreaChart as AreaChartIcon,
  Layers,
  X,
  Receipt,
  Calendar,
  Sparkles
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  AreaChart,
  Area
} from "recharts";
import { CustomSelect } from "@/components/CustomSelect";
import { useSettings } from "@/lib/SettingsContext";

export default function DashboardPage() {
  const { primaryColor } = useSettings();
  const [summary, setSummary] = useState({ balance: 0, income: 0, expense: 0, investments: 0, chartData: [] });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [greeting, setGreeting] = useState("Olá");
  const [currentDate, setCurrentDate] = useState("");
  const [username, setUsername] = useState("Utilizador");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Chart Type Switches
  const [cashFlowChartType, setCashFlowChartType] = useState<"bar" | "line" | "area">("bar");
  const [wealthChartType, setWealthChartType] = useState<"line" | "area" | "bar">("line");

  // Selected Group for Premium Pop-up Modal
  const [selectedGroupModal, setSelectedGroupModal] = useState<any | null>(null);

  // Filters
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterMonth, setFilterMonth] = useMonthFilter('current');

  const fetchData = async () => {
    try {
      const query = new URLSearchParams();
      if (filterYear) query.append("year", filterYear);
      if (filterMonth) query.append("month", filterMonth);

      const [sumRes, transRes, catRes, groupsRes] = await Promise.all([
        api.get(`/summary?${query.toString()}`),
        api.get(`/transactions?${query.toString()}`),
        api.get("/categories"),
        api.get("/category-groups")
      ]);
      setSummary(sumRes.data);
      setTransactions(transRes.data);
      setCategories(catRes.data);
      setCategoryGroups(groupsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("Bom dia");
    else if (hour >= 12 && hour < 19) setGreeting("Boa tarde");
    else setGreeting("Boa noite");
    
    setCurrentDate(new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
  }, [filterYear, filterMonth]);

  useEffect(() => {
    const handleUpdates = async () => {
      fetchData();
    };
    window.addEventListener("categories-updated", handleUpdates);
    window.addEventListener("groups-updated", handleUpdates);
    return () => {
      window.removeEventListener("categories-updated", handleUpdates);
      window.removeEventListener("groups-updated", handleUpdates);
    };
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem("showWelcome") === "true") {
      setShowWelcome(true);
      sessionStorage.removeItem("showWelcome");
    }

    const storedName = localStorage.getItem("username");
    if (storedName) {
      setUsername(storedName.charAt(0).toUpperCase() + storedName.slice(1));
    }
    api.get("/users/me").then(res => {
      if (res.data.profile_image) {
        setProfileImage(res.data.profile_image);
      } else {
        const storedImage = localStorage.getItem("profileImage");
        if (storedImage) setProfileImage(storedImage);
      }
    }).catch(err => {
      console.error("Erro ao carregar perfil", err);
      const storedImage = localStorage.getItem("profileImage");
      if (storedImage) setProfileImage(storedImage);
    });
  }, []);

  // Compute expenses by category and aggregated groups
  const expensesGrouped = useMemo(() => {
    const expenses = transactions.filter((t: any) => t.type === 'expense');
    
    // Group totals by category id
    const catAmounts: Record<number, number> = {};
    expenses.forEach((t: any) => {
      catAmounts[t.category_id] = (catAmounts[t.category_id] || 0) + t.amount;
    });

    // Map categories into groups or standalone items
    const groupedItems: any[] = [];
    const processedCatIds = new Set<number>();

    // Process explicit category groups for expense
    categoryGroups.filter((g: any) => g.type === "expense").forEach((group: any) => {
      const groupCatIds = group.category_ids || [];
      let totalGroupAmount = 0;
      const subcategories: any[] = [];

      groupCatIds.forEach((catId: number) => {
        processedCatIds.add(catId);
        const cat = categories.find((c: any) => c.id === catId);
        const amt = catAmounts[catId] || 0;
        totalGroupAmount += amt;
        if (cat) {
          subcategories.push({
            id: cat.id,
            name: cat.name,
            color: cat.color || group.color,
            amount: amt
          });
        }
      });

      if (totalGroupAmount > 0 || subcategories.length > 0) {
        subcategories.sort((a, b) => b.amount - a.amount);
        groupedItems.push({
          id: `group-${group.id}`,
          groupId: group.id,
          name: group.name,
          color: group.color || "#6366f1",
          amount: totalGroupAmount,
          isGroup: true,
          subcategories,
          groupObject: group
        });
      }
    });

    // Process standalone categories (not part of any group)
    categories.filter((c: any) => c.type === "expense" && !processedCatIds.has(c.id)).forEach((cat: any) => {
      const amt = catAmounts[cat.id] || 0;
      if (amt > 0) {
        groupedItems.push({
          id: `cat-${cat.id}`,
          catId: cat.id,
          name: cat.name,
          color: cat.color || "#94a3b8",
          amount: amt,
          isGroup: false,
          subcategories: []
        });
      }
    });

    return groupedItems.sort((a, b) => b.amount - a.amount);
  }, [transactions, categories, categoryGroups]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const yAxisTickFormatter = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1).replace('.0', '')}k`;
    }
    return value.toString();
  };

  const tooltipFormatter = (value: number) => {
    return Number(value).toFixed(3);
  };

  const openGroupModal = (item: any) => {
    if (!item.isGroup) return;
    const groupCatIds = item.subcategories.map((s: any) => s.id);
    const groupTransactions = transactions.filter((t: any) => groupCatIds.includes(t.category_id));
    setSelectedGroupModal({
      ...item,
      transactions: groupTransactions
    });
  };

  if (loading) return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-slate-200 rounded w-3/4"></div></div></div>;

  return (
    <div className="space-y-8">
      {/* Header with mobile-optimized filters */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{greeting}, {username}</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 capitalize">{currentDate}</p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3">
          <div className="w-full sm:w-32">
            <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Ano</label>
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
          <div className="w-full sm:w-40">
            <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Mês</label>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <div 
          className="glass-card p-6 relative overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] cursor-default border border-slate-200/80 dark:border-slate-800 shadow-[0_0_30px_rgba(139,92,246,0.12)] dark:shadow-[0_0_50px_rgba(139,92,246,0.15)]"
        >
          <div 
            className="absolute inset-0 opacity-100 group-hover:opacity-0 transition-opacity duration-500 pointer-events-none" 
            style={{
              background: 'var(--card-hero-gradient, linear-gradient(135deg, #6d28d9 0%, #4338ca 50%, #312e81 100%))'
            }}
          />
          <div 
            className="absolute -bottom-16 -right-16 w-48 h-48 blur-[50px] pointer-events-none rounded-full" 
            style={{
              backgroundColor: 'var(--card-hero-orb, rgba(217, 70, 239, 0.45))'
            }}
          />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs sm:text-sm font-bold text-violet-100 group-hover:text-slate-500 dark:group-hover:text-slate-400 uppercase tracking-wider transition-colors duration-500">Saldo Atual</h3>
              <div className="p-2 bg-white/20 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 rounded-lg transition-colors duration-500">
                <Wallet className="w-5 h-5 text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-500" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-500">{formatCurrency(summary.balance)}</p>
          </div>
        </div>

        <div className="glass-card p-6 relative overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] cursor-default border border-slate-200/80 dark:border-slate-800">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-800 opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs sm:text-sm font-bold text-slate-500 group-hover:text-emerald-100 uppercase tracking-wider transition-colors duration-500">Receitas (Mês)</h3>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 group-hover:bg-white/20 rounded-lg transition-colors duration-500">
                <ArrowUpRight className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors duration-500" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 group-hover:text-white transition-colors duration-500">{formatCurrency(summary.income)}</p>
          </div>
        </div>

        <div className="glass-card p-6 relative overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] cursor-default border border-slate-200/80 dark:border-slate-800">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-600 to-red-800 opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs sm:text-sm font-bold text-slate-500 group-hover:text-rose-100 uppercase tracking-wider transition-colors duration-500">Despesas (Mês)</h3>
              <div className="p-2 bg-rose-50 dark:bg-rose-950/40 group-hover:bg-white/20 rounded-lg transition-colors duration-500">
                <ArrowDownRight className="w-5 h-5 text-rose-600 group-hover:text-white transition-colors duration-500" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 group-hover:text-white transition-colors duration-500">{formatCurrency(summary.expense)}</p>
          </div>
        </div>

        <div className="glass-card p-6 relative overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] cursor-default border border-slate-200/80 dark:border-slate-800">
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity duration-500 pointer-events-none" 
            style={{
              background: 'var(--card-hero-gradient, linear-gradient(135deg, #6d28d9 0%, #4338ca 50%, #312e81 100%))'
            }}
          />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs sm:text-sm font-bold text-slate-500 group-hover:text-white/90 uppercase tracking-wider transition-colors duration-500">Investido</h3>
              <div className="p-2 bg-primary/10 group-hover:bg-white/20 rounded-lg transition-colors duration-500">
                <TrendingUp className="w-5 h-5 text-primary group-hover:text-white transition-colors duration-500" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white group-hover:text-white transition-colors duration-500">{formatCurrency(summary.investments || 0)}</p>
          </div>
        </div>
      </div>

      {/* 📊 Charts Section with Style Switcher & Clear Color Legends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Fluxo de Caixa */}
        <div className="glass-card p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Fluxo de Caixa {filterMonth ? '(Diário)' : '(Mensal)'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Comparação de entradas e saídas no período
                </p>
              </div>

              {/* Chart Style Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setCashFlowChartType("bar")}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    cashFlowChartType === "bar" 
                      ? "bg-white dark:bg-slate-700 text-primary shadow-xs" 
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                  title="Gráfico de Barras"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Barras</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCashFlowChartType("line")}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    cashFlowChartType === "line" 
                      ? "bg-white dark:bg-slate-700 text-primary shadow-xs" 
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                  title="Gráfico de Linhas"
                >
                  <LineChartIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Linhas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCashFlowChartType("area")}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    cashFlowChartType === "area" 
                      ? "bg-white dark:bg-slate-700 text-primary shadow-xs" 
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                  title="Gráfico de Área"
                >
                  <AreaChartIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Área</span>
                </button>
              </div>
            </div>

            {/* Visual Color Legend */}
            <div className="flex items-center gap-4 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs" />
                <span>Receitas</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <span className="w-3 h-3 rounded-full bg-rose-500 shadow-xs" />
                <span>Despesas</span>
              </div>
            </div>
          </div>

          <div className="h-[240px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              {cashFlowChartType === "bar" ? (
                <BarChart data={summary.chartData || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReceitasBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="colorDespesasBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                      <stop offset="100%" stopColor="#e11d48" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={yAxisTickFormatter} width={45} />
                  <Tooltip formatter={tooltipFormatter} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)', color: '#f8fafc' }} itemStyle={{ color: '#e2e8f0', fontWeight: 500 }} />
                  <Bar dataKey="receitas" name="Receitas" fill="url(#colorReceitasBar)" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="despesas" name="Despesas" fill="url(#colorDespesasBar)" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              ) : cashFlowChartType === "line" ? (
                <LineChart data={summary.chartData || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={yAxisTickFormatter} width={45} />
                  <Tooltip formatter={tooltipFormatter} contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', color: '#f8fafc' }} itemStyle={{ color: '#e2e8f0', fontWeight: 500 }} />
                  <Line type="monotone" dataKey="receitas" name="Receitas" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="despesas" name="Despesas" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: '#f43f5e' }} activeDot={{ r: 6 }} />
                </LineChart>
              ) : (
                <AreaChart data={summary.chartData || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReceitasArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDespesasArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={yAxisTickFormatter} width={45} />
                  <Tooltip formatter={tooltipFormatter} contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', color: '#f8fafc' }} itemStyle={{ color: '#e2e8f0', fontWeight: 500 }} />
                  <Area type="monotone" dataKey="receitas" name="Receitas" stroke="#10b981" fillOpacity={1} fill="url(#colorReceitasArea)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="despesas" name="Despesas" stroke="#f43f5e" fillOpacity={1} fill="url(#colorDespesasArea)" strokeWidth={2.5} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Evolução Patrimonial */}
        <div 
          className="glass-card p-5 sm:p-6 relative overflow-hidden border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-[0_0_30px_rgba(139,92,246,0.04)] dark:shadow-[0_0_40px_rgba(139,92,246,0.04)]"
        >
          <div 
            className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-3/4 h-32 blur-[60px] pointer-events-none rounded-full opacity-30 dark:opacity-20" 
            style={{
              backgroundColor: 'var(--primary-glow)'
            }}
          />
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 relative z-10">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Evolução Patrimonial & Poupança
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Crescimento acumulado do património
                </p>
              </div>

              {/* Chart Style Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setWealthChartType("line")}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    wealthChartType === "line" 
                      ? "bg-white dark:bg-slate-700 text-primary shadow-xs" 
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                  title="Gráfico de Linhas"
                >
                  <LineChartIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Linhas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWealthChartType("area")}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    wealthChartType === "area" 
                      ? "bg-white dark:bg-slate-700 text-primary shadow-xs" 
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                  title="Gráfico de Área"
                >
                  <AreaChartIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Área</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWealthChartType("bar")}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    wealthChartType === "bar" 
                      ? "bg-white dark:bg-slate-700 text-primary shadow-xs" 
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                  title="Gráfico de Barras"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Barras</span>
                </button>
              </div>
            </div>

            {/* Visual Color Legend */}
            <div className="flex items-center gap-4 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs relative z-10">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <span className="w-3 h-3 rounded-full shadow-xs" style={{ backgroundColor: primaryColor || '#8b5cf6' }} />
                <span>Património Líquido</span>
              </div>
            </div>
          </div>

          <div className="h-[240px] w-full relative z-10 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              {wealthChartType === "line" ? (
                <LineChart data={summary.chartData || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={yAxisTickFormatter} width={45} />
                  <Tooltip formatter={tooltipFormatter} contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)', color: '#f8fafc' }} itemStyle={{ color: '#e2e8f0', fontWeight: 500 }} />
                  <Line 
                    type="monotone" 
                    dataKey="saldo" 
                    name="Património"
                    stroke={primaryColor || "#8b5cf6"} 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: primaryColor || "#8b5cf6", strokeWidth: 0 }} 
                    activeDot={{ r: 6, fill: '#fff', stroke: primaryColor || "#8b5cf6", strokeWidth: 2 }} 
                  />
                </LineChart>
              ) : wealthChartType === "area" ? (
                <AreaChart data={summary.chartData || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPatrimonioArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={primaryColor || "#8b5cf6"} stopOpacity={0.6} />
                      <stop offset="95%" stopColor={primaryColor || "#8b5cf6"} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={yAxisTickFormatter} width={45} />
                  <Tooltip formatter={tooltipFormatter} contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', color: '#f8fafc' }} itemStyle={{ color: '#e2e8f0', fontWeight: 500 }} />
                  <Area 
                    type="monotone" 
                    dataKey="saldo" 
                    name="Património"
                    stroke={primaryColor || "#8b5cf6"} 
                    fillOpacity={1} 
                    fill="url(#colorPatrimonioArea)" 
                    strokeWidth={2.5} 
                  />
                </AreaChart>
              ) : (
                <BarChart data={summary.chartData || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={yAxisTickFormatter} width={45} />
                  <Tooltip formatter={tooltipFormatter} contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', color: '#f8fafc' }} itemStyle={{ color: '#e2e8f0', fontWeight: 500 }} />
                  <Bar 
                    dataKey="saldo" 
                    name="Património"
                    fill={primaryColor || "#8b5cf6"} 
                    radius={[6, 6, 0, 0]} 
                    barSize={24} 
                  />
                </BarChart>
              )}
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
            <div className="animate-marquee flex gap-4 mt-4" style={{ animationDuration: `${Math.max(transactions.length * 4, 30)}s` }}>
              {[...transactions, ...transactions, ...transactions].map((t: any, i: number) => (
                <div 
                  key={i} 
                  className="card-history-item relative group flex-shrink-0 w-64 glass-card p-4 border border-slate-200/60 dark:border-slate-800 transition-all duration-500 cursor-pointer bg-white dark:bg-slate-900 hover:-translate-y-4 hover:-rotate-[5deg] hover:z-20"
                >
                  <div 
                    className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-32 h-20 blur-[40px] pointer-events-none rounded-full transition-all duration-500 opacity-0 group-hover:opacity-40" 
                    style={{
                      backgroundColor: 'var(--card-history-accent)'
                    }}
                  />
                  
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

                  <div 
                    className="absolute -top-20 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 glass-card text-slate-900 dark:text-white text-sm py-3 px-4 w-max max-w-[250px] shadow-2xl scale-95 group-hover:scale-100 origin-bottom border border-slate-200/80 dark:border-slate-800"
                    style={{
                      boxShadow: '0 10px 30px -5px var(--card-history-glow)'
                    }}
                  >
                    <div className="font-extrabold text-base">{t.description}</div>
                    <div className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">
                      Categoria: {categories.find((c: any) => c.id === t.category_id)?.name || "Sem Categoria"}
                    </div>
                    <div 
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 glass-card border-t-0 border-l-0 rotate-45 border-r border-b border-slate-200/80 dark:border-slate-800" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 🗂️ Category Expenses Summary (with Group support & Pop-up drill-down) */}
      {expensesGrouped.length > 0 && (
        <div className="mt-8 space-y-4 animate-in slide-in-from-bottom-5 fade-in duration-500 delay-150">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-rose-500" /> Top Categorias & Grupos de Gastos
            </h2>
            <span className="text-xs text-slate-400">Clica num grupo para ver as categorias que o compõem</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {expensesGrouped.map((item, idx) => {
              const maxAmount = expensesGrouped[0].amount;
              const percent = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
              
              return (
                <div 
                  key={item.id} 
                  onClick={() => openGroupModal(item)}
                  className={`card-expenses-item glass-card p-5 relative overflow-hidden group transition-all duration-500 ${
                    item.isGroup ? 'cursor-pointer hover:border-primary/50 hover:shadow-lg hover:-translate-y-2' : 'hover:-translate-y-1'
                  }`}
                >
                  <div 
                    className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-40 h-24 blur-[40px] pointer-events-none rounded-full transition-opacity duration-500 opacity-0 group-hover:opacity-40" 
                    style={{ backgroundColor: item.color || 'var(--primary)' }}
                  />
                  
                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: item.color }} />
                      <div className="min-w-0">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate block" title={item.name}>
                          {item.name}
                        </span>
                        {item.isGroup && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary dark:text-primary-foreground bg-primary/10 px-1.5 py-0.5 rounded-md mt-0.5">
                            <Layers className="w-2.5 h-2.5" />
                            {item.subcategories.length} {item.subcategories.length === 1 ? 'categoria' : 'categorias'}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-extrabold text-sm text-rose-600 dark:text-rose-400 shrink-0">
                      -{formatCurrency(item.amount)}
                    </span>
                  </div>
                  
                  {/* Progress bar background */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800/50 h-2 rounded-full overflow-hidden relative z-10 mt-2">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out" 
                      style={{ 
                        width: `${percent}%`, 
                        backgroundColor: item.color 
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

      {/* 🌟 Premium Pop-up Modal for Category Group Drill-down */}
      {selectedGroupModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
                  style={{ backgroundColor: selectedGroupModal.color }}
                >
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      Grupo: {selectedGroupModal.name}
                    </h3>
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      Despesa
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Total gasto no período: <strong className="text-rose-600 dark:text-rose-400">{formatCurrency(selectedGroupModal.amount)}</strong>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedGroupModal(null)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1 [scrollbar-width:thin]">
              {/* Subcategories Breakdown */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" /> Distribuição por Categoria
                </h4>
                <div className="space-y-2.5">
                  {selectedGroupModal.subcategories.map((sub: any) => {
                    const subPercent = selectedGroupModal.amount > 0 ? (sub.amount / selectedGroupModal.amount) * 100 : 0;
                    return (
                      <div key={sub.id} className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: sub.color }} />
                            <span className="font-bold text-slate-800 dark:text-slate-200">{sub.name}</span>
                          </div>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-slate-400 text-[11px]">{subPercent.toFixed(1)}%</span>
                            <span className="font-extrabold text-rose-600 dark:text-rose-400">-{formatCurrency(sub.amount)}</span>
                          </div>
                        </div>
                        {/* Mini progress bar */}
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500" 
                            style={{ width: `${subPercent}%`, backgroundColor: sub.color }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Transactions in this Group */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-primary" /> Movimentos Recentes Neste Grupo
                </h4>
                {selectedGroupModal.transactions?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                    Sem transações registadas neste período para este grupo.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/70 dark:border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    {selectedGroupModal.transactions.map((t: any) => {
                      const cat = categories.find((c: any) => c.id === t.category_id);
                      return (
                        <div key={t.id} className="p-2.5 bg-white dark:bg-slate-800/80 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate">{t.description || "Sem descrição"}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                              <span>{new Date(t.date).toLocaleDateString('pt-PT')}</span>
                              <span>•</span>
                              <span style={{ color: cat?.color }}>{cat?.name}</span>
                            </div>
                          </div>
                          <span className="font-mono font-extrabold text-rose-600 dark:text-rose-400 shrink-0 ml-2">
                            -{formatCurrency(t.amount)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex justify-end">
              <button
                onClick={() => setSelectedGroupModal(null)}
                className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:opacity-90 transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Premium Modal */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-700">
          <div 
            className="relative w-full max-w-md rounded-[20px] overflow-hidden p-[2px] group"
            style={{
              boxShadow: '0 0 80px var(--primary-glow)'
            }}
          >
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] animate-spin pointer-events-none" 
              style={{ animationDuration: '4s', background: 'conic-gradient(from 0deg, transparent 0 280deg, var(--primary) 360deg)' }} 
            />
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] animate-spin pointer-events-none" 
              style={{ animationDuration: '6s', animationDirection: 'reverse', background: 'conic-gradient(from 0deg, transparent 0 280deg, var(--secondary) 360deg)' }} 
            />
            
            <div className="relative bg-white dark:bg-slate-900 p-8 rounded-[18px] h-full w-full z-10 flex flex-col items-center animate-in zoom-in-95 duration-500 delay-150">
              <button onClick={() => setShowWelcome(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
              
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 shadow-xl border-4 border-white dark:border-slate-800 flex items-center justify-center relative z-10 mb-6 overflow-hidden">
                  <div 
                    className="absolute inset-0 animate-pulse opacity-20" 
                    style={{
                      background: 'linear-gradient(135deg, var(--primary), var(--secondary))'
                    }}
                  />
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span 
                      className="text-2xl font-black bg-clip-text text-transparent"
                      style={{
                        backgroundImage: 'linear-gradient(135deg, var(--primary), var(--secondary))'
                      }}
                    >
                      {username.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="text-center mb-8 w-full">
                  <h2 
                    className="text-3xl font-extrabold text-transparent bg-clip-text mb-2"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, var(--primary), var(--secondary))'
                    }}
                  >
                    {greeting}, {username}!
                  </h2>
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
                
                {expensesGrouped.length > 0 && (
                  <div className="bg-rose-50/50 dark:bg-rose-950/20 p-5 rounded-2xl border border-rose-100 dark:border-rose-900/30 relative overflow-hidden group-hover:border-rose-500/30 transition-colors">
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-500/10 blur-xl rounded-full" />
                    <p className="text-sm font-semibold text-rose-500 mb-2">Maior Gasto do Mês</p>
                    <div className="flex justify-between items-end relative z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shadow-sm shadow-rose-500/50" style={{ backgroundColor: expensesGrouped[0].color }} />
                        <p className="font-bold text-slate-800 dark:text-rose-100 truncate max-w-[120px]">{expensesGrouped[0].name}</p>
                      </div>
                      <p className="text-xl font-bold text-rose-600 dark:text-rose-400">-{formatCurrency(expensesGrouped[0].amount)}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => setShowWelcome(false)} 
                className="mt-8 w-full py-4 text-white font-bold rounded-xl transition-all hover:-translate-y-1 active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  boxShadow: '0 10px 30px -5px var(--primary-glow)'
                }}
              >
                Aceder ao Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
