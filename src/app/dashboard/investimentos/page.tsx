"use client";

import { useEffect, useState, useMemo } from "react";
import { useMonthFilter } from "@/hooks/useMonthFilter";
import { api } from "@/lib/api";
import { TrendingUp, Plus, Target, PiggyBank, Pencil, Trash2, X, Minus } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSettings } from "@/lib/SettingsContext";

export default function InvestimentosPage() {
  const { primaryColor } = useSettings();
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState("");
  const [customAssetType, setCustomAssetType] = useState("");
  const [balance, setBalance] = useState("");
  const [target, setTarget] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [chartData, setChartData] = useState([]);
  const [filterYear, setFilterYear] = useState("2026");
  const [filterMonth, setFilterMonth] = useMonthFilter('todos');
  const [filterDay, setFilterDay] = useState("Todos");

  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustInv, setAdjustInv] = useState<any>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustType, setAdjustType] = useState<"add" | "remove">("add");

  useEffect(() => {
    fetchData();
  }, [filterYear, filterMonth, filterDay]);

  async function fetchData() {
    try {
      const query = new URLSearchParams();
      if (filterYear && filterYear !== "Todos") query.append("year", filterYear);
      if (filterMonth && filterMonth !== "Todos") query.append("month", filterMonth);
      if (filterDay && filterDay !== "Todos") query.append("day", filterDay);

      const [invRes, histRes] = await Promise.all([
        api.get("/investments"),
        api.get(`/investments/history?${query.toString()}`)
      ]);
      setInvestments(invRes.data);
      setChartData(histRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const STANDARD_ASSET_TYPES = ["Ações", "Criptomoedas", "Imobiliário", "Obrigações", "Numerário"];

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustInv) return;
    const amount = parseFloat(adjustAmount.replace(",", "."));
    if (isNaN(amount) || amount <= 0) return;

    const newBalance = adjustType === "add" ? parseFloat(adjustInv.balance) + amount : parseFloat(adjustInv.balance) - amount;

    try {
      await api.put(`/investments/${adjustInv.id}`, {
        name: adjustInv.name,
        asset_type: adjustInv.asset_type,
        balance: newBalance,
        target: adjustInv.target
      });
      toast("Saldo atualizado com sucesso!", { style: { background: '#ffffff', color: '#000000', border: '1px solid #e2e8f0' } });
      setAdjustModalOpen(false);
      setAdjustAmount("");
      fetchData();
    } catch(err) {
      console.error(err);
      toast.error("Erro ao atualizar o saldo.");
    }
  };

  const handleEdit = (inv: any) => {
    setEditingId(inv.id);
    setName(inv.name);
    
    if (STANDARD_ASSET_TYPES.includes(inv.asset_type)) {
      setAssetType(inv.asset_type);
      setCustomAssetType("");
    } else {
      setAssetType("Outro");
      setCustomAssetType(inv.asset_type);
    }

    setBalance(inv.balance.toString());
    setTarget(inv.target ? inv.target.toString() : "");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if(window.confirm("Tem certeza que deseja apagar este investimento?")) {
      try {
        await api.delete(`/investments/${id}`);
        toast.error("Investimento apagado com sucesso.");
        fetchData();
      } catch (err) {
        toast.error("Erro ao apagar investimento");
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setAssetType("");
    setCustomAssetType("");
    setBalance("");
    setTarget("");
  };

  const handleAddInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalAssetType = assetType === "Outro" ? customAssetType : assetType;
      
      if (editingId) {
        await api.put(`/investments/${editingId}`, {
          name,
          asset_type: finalAssetType,
          balance: parseFloat(balance) || 0,
          target: target ? parseFloat(target) : null
        });
        setEditingId(null);
      } else {
        await api.post("/investments", {
          name,
          asset_type: finalAssetType,
          balance: parseFloat(balance) || 0,
          target: target ? parseFloat(target) : null
        });
      }
      setName("");
      setAssetType("");
      setCustomAssetType("");
      setBalance("");
      setTarget("");
      if (editingId) {
        toast("Ativo atualizado com sucesso!", { style: { background: '#ffffff', color: '#000000', border: '1px solid #e2e8f0' } });
      } else {
        toast.success("Ativo adicionado com sucesso!");
      }
      fetchData();
    } catch (err) {
      console.error("Failed to save investment");
      toast.error("Erro ao guardar ativo.");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  if (loading) return <div>A carregar...</div>;

  const totalInvested = investments.reduce((acc: number, curr: any) => acc + curr.balance, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Investimentos</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Acompanha o crescimento do teu património.</p>
        </div>
        <div className="glass-card px-6 py-4 flex items-center gap-4 bg-primary/5 border-primary/20">
          <div className="p-3 bg-primary rounded-xl"><PiggyBank className="w-6 h-6 text-white" /></div>
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase">Total Património</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalInvested)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 sticky top-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> {editingId ? "Editar Ativo" : "Novo Ativo"}
            </h3>
            
            <form onSubmit={handleAddInvestment} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome do Ativo</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" placeholder="Ex: S&P 500" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipo de Ativo</label>
                <CustomSelect 
                  required
                  value={assetType} 
                  onChange={val => setAssetType(val as string)} 
                  options={[
                    { value: "Ações", label: "Ações / ETFs" },
                    { value: "Criptomoedas", label: "Criptomoedas" },
                    { value: "Imobiliário", label: "Imobiliário" },
                    { value: "Obrigações", label: "Obrigações" },
                    { value: "Numerário", label: "Numerário / Depósitos" },
                    { value: "Outro", label: "Outro (Personalizado)..." }
                  ]}
                  placeholder="Selecione..."
                />
              </div>

              {assetType === "Outro" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Qual o tipo de ativo?</label>
                  <input type="text" required value={customAssetType} onChange={e => setCustomAssetType(e.target.value)} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" placeholder="Ex: Relógios, Ouro..." />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Saldo Inicial (€)</label>
                <input type="number" step="0.01" value={balance} onChange={e => setBalance(e.target.value)} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" placeholder="0.00" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Meta a Atingir (€) - Opcional</label>
                <input type="number" step="0.01" value={target} onChange={e => setTarget(e.target.value)} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" placeholder="10000.00" />
              </div>

              <div className="flex gap-2 mt-4">
                {editingId && (
                  <button type="button" onClick={handleCancelEdit} className="w-1/3 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl transition-all">
                    Cancelar
                  </button>
                )}
                <button type="submit" className={`${editingId ? 'w-2/3' : 'w-full'} py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all`}>
                  {editingId ? "Guardar Ativo" : "Adicionar Ativo"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          {/* Chart Section */}
          <div className="glass-card p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Evolução Patrimonial</h3>
              <div className="flex flex-wrap gap-2">
                <CustomSelect value={filterYear} onChange={setFilterYear as any} options={[{value:"Todos",label:"Ano (Todos)"},{value:"2025",label:"2025"},{value:"2026",label:"2026"}]} />
                <CustomSelect value={filterMonth} onChange={setFilterMonth as any} options={[{value:"Todos",label:"Mês (Todos)"},{value:"1",label:"Jan"},{value:"2",label:"Fev"},{value:"3",label:"Mar"},{value:"4",label:"Abr"},{value:"5",label:"Mai"},{value:"6",label:"Jun"},{value:"7",label:"Jul"},{value:"8",label:"Ago"},{value:"9",label:"Set"},{value:"10",label:"Out"},{value:"11",label:"Nov"},{value:"12",label:"Dez"}]} />
                <CustomSelect value={filterDay} onChange={setFilterDay as any} options={[{value:"Todos",label:"Dia (Todos)"},{value:"1",label:"01"},{value:"5",label:"05"},{value:"10",label:"10"},{value:"15",label:"15"},{value:"20",label:"20"},{value:"25",label:"25"}]} />
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' }}
                    itemStyle={{ color: '#e2e8f0', fontWeight: 500 }}
                    formatter={(value: number) => [`${formatCurrency(value)}`, 'Património']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="valor" 
                    stroke={primaryColor || "#8b5cf6"} 
                    strokeWidth={3} 
                    dot={{ fill: primaryColor || "#8b5cf6", strokeWidth: 2, r: 4 }} 
                    activeDot={{ r: 6, fill: '#fff', stroke: primaryColor || "#8b5cf6" }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {investments.length === 0 ? (
              <div className="col-span-full glass-card p-8 text-center text-slate-500 dark:text-slate-400">
                Nenhum investimento registado. Adiciona o teu primeiro ativo para começares a acompanhar.
              </div>
            ) : (
              investments.map((inv: any) => {
                const progress = inv.target ? Math.min((inv.balance / inv.target) * 100, 100) : 0;
                
                return (
                  <div key={inv.id} className="glass-card p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-24 h-24 text-primary" />
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-md mb-2">{inv.asset_type}</span>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{inv.name}</h3>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2 relative z-20">
                          <button onClick={() => { setAdjustInv(inv); setAdjustType("add"); setAdjustModalOpen(true); }} className="p-2 text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-500 rounded-lg transition-colors" title="Adicionar Valor"><Plus className="w-4 h-4" /></button>
                          <button onClick={() => { setAdjustInv(inv); setAdjustType("remove"); setAdjustModalOpen(true); }} className="p-2 text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-500 rounded-lg transition-colors" title="Retirar Valor"><Minus className="w-4 h-4" /></button>
                          <button onClick={() => handleEdit(inv)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary rounded-lg transition-colors" title="Editar Ativo"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(inv.id)} className="p-2 text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 rounded-lg transition-colors" title="Eliminar Ativo"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <p className="text-3xl font-extrabold text-primary">{formatCurrency(inv.balance)}</p>
                      </div>

                      {inv.target && (
                        <div className="mt-6">
                          <div className="flex justify-between text-sm mb-2 font-medium">
                            <span className="text-slate-500 flex items-center gap-1"><Target className="w-4 h-4" /> Meta</span>
                            <span className="text-slate-900 dark:text-white">{formatCurrency(inv.target)}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div className="bg-primary h-2.5 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                          </div>
                          <p className="text-right text-xs font-bold text-primary mt-1">{progress.toFixed(1)}% alcançado</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>

      {adjustModalOpen && adjustInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-6 relative border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <button onClick={() => setAdjustModalOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {adjustType === "add" ? "Adicionar Valor" : "Retirar Valor"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
              Ajusta o saldo do teu ativo <strong className="text-slate-700 dark:text-slate-200">{adjustInv.name}</strong>.
            </p>
            <form onSubmit={handleAdjustBalance} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Valor (€)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">€</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    autoFocus
                    value={adjustAmount} 
                    onChange={e => setAdjustAmount(e.target.value)} 
                    className="w-full pl-10 pr-4 py-3 text-lg font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all" 
                    placeholder="0.00" 
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className={`w-full py-4 text-white font-bold rounded-xl shadow-lg transition-all ${
                  adjustType === "add" 
                  ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30" 
                  : "bg-rose-500 hover:bg-rose-600 shadow-rose-500/30"
                }`}
              >
                {adjustType === "add" ? "Confirmar Adição" : "Confirmar Remoção"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
