"use client";

import { useState, useMemo } from "react";

import { TrendingUp, Calculator, PiggyBank, Target, CalendarDays, LineChart as LineChartIcon, Wallet, FileText, Download } from "lucide-react";
import { exportPrevisaoToCSV, exportPrevisaoToPDF } from "@/lib/exportUtils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";

export default function PrevisaoPage() {
  const [initialAmount, setInitialAmount] = useState<string>("10000");
  const [monthlyContribution, setMonthlyContribution] = useState<string>("500");
  const [annualRate, setAnnualRate] = useState<string>("8");
  const [customYears, setCustomYears] = useState<string>("15");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const calculateFutureValue = (principal: number, monthlyAdd: number, ratePercent: number, years: number) => {
    if (years === 0) return principal;
    const r_monthly = (ratePercent / 100) / 12;
    const n_months = years * 12;

    if (r_monthly === 0) {
      return principal + (monthlyAdd * n_months);
    }

    const futureValuePrincipal = principal * Math.pow(1 + r_monthly, n_months);
    const futureValueContributions = monthlyAdd * ((Math.pow(1 + r_monthly, n_months) - 1) / r_monthly);
    
    return futureValuePrincipal + futureValueContributions;
  };

  const calculateTotalInvested = (principal: number, monthlyAdd: number, years: number) => {
    return principal + (monthlyAdd * years * 12);
  };

  const results = useMemo(() => {
    const p = parseFloat(initialAmount) || 0;
    const m = parseFloat(monthlyContribution) || 0;
    const r = parseFloat(annualRate) || 0;
    const y = parseInt(customYears) || 0;

    return {
      year10: calculateFutureValue(p, m, r, 10),
      year20: calculateFutureValue(p, m, r, 20),
      year30: calculateFutureValue(p, m, r, 30),
      custom: calculateFutureValue(p, m, r, y),
      customInvested: calculateTotalInvested(p, m, y),
      customInterest: calculateFutureValue(p, m, r, y) - calculateTotalInvested(p, m, y)
    };
  }, [initialAmount, monthlyContribution, annualRate, customYears]);

  const chartData = useMemo(() => {
    const p = parseFloat(initialAmount) || 0;
    const m = parseFloat(monthlyContribution) || 0;
    const r = parseFloat(annualRate) || 0;
    const y = parseInt(customYears) || 15;

    const data = [];
    for (let i = 0; i <= Math.max(y, 30); i++) {
      data.push({
        ano: `Ano ${i}`,
        Total: Math.round(calculateFutureValue(p, m, r, i)),
        Investido: Math.round(calculateTotalInvested(p, m, i)),
      });
    }
    return data;
  }, [initialAmount, monthlyContribution, annualRate, customYears]);

  const yAxisTickFormatter = (value: number) => {
    if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `€${(value / 1000).toFixed(0)}k`;
    return `€${value}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <p className="font-bold text-white mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-primary font-semibold text-sm">
              Total Acumulado: {formatCurrency(payload[0].value)}
            </p>
            {payload[1] && (
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                Total Investido: {formatCurrency(payload[1].value)}
              </p>
            )}
            {payload[1] && (
              <p className="text-emerald-500 font-medium text-sm pt-1 border-t border-slate-100 dark:border-slate-800 mt-1">
                Juros Compostos: {formatCurrency(payload[0].value - payload[1].value)}
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <LineChartIcon className="w-8 h-8 text-primary" />
            Previsão Patrimonial
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Calcula o poder dos juros compostos a longo prazo.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button onClick={() => exportPrevisaoToCSV(chartData)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 hover:text-emerald-600 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all font-semibold text-sm shadow-sm">
            <FileText className="w-4 h-4 text-emerald-500" /> Exportar CSV
          </button>
          <button onClick={() => exportPrevisaoToPDF(chartData, results, customYears)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 hover:text-rose-600 hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all font-semibold text-sm shadow-sm">
            <Download className="w-4 h-4 text-rose-500" /> Exportar PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Formulário */}
        <div className="glass-card p-6 xl:col-span-1 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
            <Calculator className="w-5 h-5 text-primary" /> Parâmetros
          </h2>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Património Inicial (€)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Wallet className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="number"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Aporte Mensal (€)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <PiggyBank className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Taxa de Juro Anual (%)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <TrendingUp className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="number"
                value={annualRate}
                onChange={(e) => setAnnualRate(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex justify-between">
              <span>Período Personalizado (Anos)</span>
              <span className="text-primary">{customYears} Anos</span>
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={customYears}
              onChange={(e) => setCustomYears(e.target.value)}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>

        {/* Resultados em Cartões */}
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 h-fit">
          <div className="glass-card p-6 border-l-4 border-l-indigo-400 hover:-translate-y-1 transition-transform duration-300">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> Em 10 Anos
            </h3>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(results.year10)}</p>
          </div>
          
          <div className="glass-card p-6 border-l-4 border-l-violet-500 hover:-translate-y-1 transition-transform duration-300">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> Em 20 Anos
            </h3>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(results.year20)}</p>
          </div>

          <div className="glass-card p-6 border-l-4 border-l-fuchsia-500 hover:-translate-y-1 transition-transform duration-300">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> Em 30 Anos
            </h3>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(results.year30)}</p>
          </div>

          <div className="glass-card p-6 border-l-4 border-l-primary relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Meta ({customYears} Anos)
            </h3>
            <p className="text-3xl font-extrabold text-primary">{formatCurrency(results.custom)}</p>
            <div className="mt-3 text-sm flex gap-3 text-slate-500 dark:text-slate-400">
              <span title="Total Investido do teu bolso" className="cursor-help">Investido: {formatCurrency(results.customInvested)}</span>
              <span className="text-emerald-500 font-medium hidden sm:inline">Juros: +{formatCurrency(results.customInterest)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Projeção de Crescimento vs Total Investido</h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorInvestido" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
              <XAxis 
                dataKey="ano" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }} 
                dy={10} 
                minTickGap={30}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }} 
                tickFormatter={yAxisTickFormatter} 
                width={55} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="Total" 
                stroke="#4f46e5" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorTotal)" 
                activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
              />
              <Area 
                type="monotone" 
                dataKey="Investido" 
                stroke="#64748b" 
                strokeWidth={2}
                strokeDasharray="5 5"
                fillOpacity={1} 
                fill="url(#colorInvestido)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
