"use client";

import { useEffect, useState, useMemo } from "react";
import { useMonthFilter } from "@/hooks/useMonthFilter";
import { api } from "@/lib/api";
import { 
  TrendingUp, 
  Plus, 
  Target, 
  PiggyBank, 
  Pencil, 
  Trash2, 
  X, 
  Minus, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Wallet, 
  Percent, 
  Calendar,
  Lightbulb,
  ArrowRight,
  Flame
} from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";
import { ConfirmModal } from "@/components/ConfirmModal";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSettings } from "@/lib/SettingsContext";

interface GoalItem {
  id: number;
  user_id: number;
  title: string;
  goal_type: "investment_deposit" | "expense_ceiling" | "savings_rate" | "net_savings";
  target_amount: number;
  category_id?: number | null;
  investment_id?: number | null;
  month: number;
  year: number;
  category_name?: string;
  investment_name?: string;
  created_at: string;
}

export default function InvestimentosPage() {
  const { primaryColor } = useSettings();
  const [investments, setInvestments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Asset Form State
  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState("");
  const [customAssetType, setCustomAssetType] = useState("");
  const [balance, setBalance] = useState("");
  const [target, setTarget] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  // Asset Chart Filters
  const [chartData, setChartData] = useState([]);
  const [filterYear, setFilterYear] = useState("2026");
  const [filterMonth, setFilterMonth] = useMonthFilter('todos');
  const [filterDay, setFilterDay] = useState("Todos");

  // Adjust Balance Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustInv, setAdjustInv] = useState<any>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustType, setAdjustType] = useState<"add" | "remove">("add");
  const [transferToBalance, setTransferToBalance] = useState(true);

  // Monthly Goals State
  const currentYearStr = new Date().getFullYear().toString();
  const currentMonthStr = (new Date().getMonth() + 1).toString();
  const [goalFilterYear, setGoalFilterYear] = useState(currentYearStr);
  const [goalFilterMonth, setGoalFilterMonth] = useState(currentMonthStr);

  // Goals Bulk Selection
  const [selectedGoals, setSelectedGoals] = useState<number[]>([]);
  const [showBulkDeleteGoalsModal, setShowBulkDeleteGoalsModal] = useState(false);
  const [isBulkDeletingGoals, setIsBulkDeletingGoals] = useState(false);

  // Goal Modal State
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalType, setGoalType] = useState<"investment_deposit" | "expense_ceiling" | "savings_rate" | "net_savings">("investment_deposit");
  const [goalTargetAmount, setGoalTargetAmount] = useState("");
  const [goalCategoryId, setGoalCategoryId] = useState<string>("");
  const [goalInvestmentId, setGoalInvestmentId] = useState<string>("");
  const [isSavingGoal, setIsSavingGoal] = useState(false);

  // Delete Confirmation Modals
  const [goalToDelete, setGoalToDelete] = useState<GoalItem | null>(null);
  const [investmentToDelete, setInvestmentToDelete] = useState<any | null>(null);
  const [isDeletingGoal, setIsDeletingGoal] = useState(false);
  const [isDeletingInvestment, setIsDeletingInvestment] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filterYear, filterMonth, filterDay]);

  useEffect(() => {
    setSelectedGoals([]);
    fetchGoalsData();
  }, [goalFilterYear, goalFilterMonth]);

  async function fetchData() {
    try {
      const query = new URLSearchParams();
      if (filterYear && filterYear !== "Todos") query.append("year", filterYear);
      if (filterMonth && filterMonth !== "Todos") query.append("month", filterMonth);
      if (filterDay && filterDay !== "Todos") query.append("day", filterDay);

      const [invRes, histRes, catRes] = await Promise.all([
        api.get("/investments"),
        api.get(`/investments/history?${query.toString()}`),
        api.get("/categories")
      ]);
      setInvestments(invRes.data);
      setChartData(histRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchGoalsData() {
    try {
      const isAllYears = !goalFilterYear || goalFilterYear === "Todos";
      const isAllMonths = !goalFilterMonth || goalFilterMonth === "Todos" || goalFilterMonth === "todos";

      const query = new URLSearchParams();
      if (!isAllYears) {
        query.append("year", goalFilterYear);
      }
      if (!isAllMonths) {
        query.append("month", goalFilterMonth);
      }

      const [goalsRes, transRes] = await Promise.all([
        api.get(`/goals?${query.toString()}`).catch(() => ({ data: [] })),
        api.get(`/transactions?${query.toString()}`).catch(() => ({ data: [] }))
      ]);

      const fetchedGoals: GoalItem[] = Array.isArray(goalsRes.data) ? goalsRes.data : [];
      
      // Coletar todas as metas guardadas localmente de forma inteligente
      const allLocalGoals: GoalItem[] = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("pl_goals_") && !key.includes("Todos") && !key.includes("todos")) {
            try {
              const items = JSON.parse(localStorage.getItem(key) || "[]");
              if (Array.isArray(items)) {
                items.forEach((g: any) => {
                  if (g && g.id && !allLocalGoals.some(ex => ex.id === g.id)) {
                    allLocalGoals.push(g);
                  }
                });
              }
            } catch {}
          }
        }
      } catch {}

      // Combinar metas do backend e do localStorage sem duplicar
      const combinedMap = new Map<number | string, GoalItem>();
      
      fetchedGoals.forEach(g => {
        if (g && g.id) combinedMap.set(g.id, g);
      });
      
      allLocalGoals.forEach(g => {
        if (g && g.id && !combinedMap.has(g.id)) {
          combinedMap.set(g.id, g);
        }
      });

      const combinedList = Array.from(combinedMap.values());

      // Filtrar a lista combinada pelos filtros ativos de Ano e Mês
      const filteredGoals = combinedList.filter(g => {
        const goalYearStr = g.year ? String(g.year) : "";
        const goalMonthStr = g.month ? String(g.month) : "";
        const matchYear = isAllYears || goalYearStr === String(goalFilterYear);
        const matchMonth = isAllMonths || goalMonthStr === String(goalFilterMonth);
        return matchYear && matchMonth;
      });

      setGoals(filteredGoals);
      setTransactions(Array.isArray(transRes.data) ? transRes.data : []);
    } catch (err) {
      console.error("Erro ao carregar metas:", err);
    }
  }

  const STANDARD_ASSET_TYPES = ["Ações", "Criptomoedas", "Imobiliário", "Obrigações", "Numerário"];

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustInv) return;
    const amount = parseFloat(adjustAmount.replace(",", "."));
    if (isNaN(amount) || amount <= 0) return;

    if (adjustType === "remove" && amount > adjustInv.balance) {
      toast.error("Saldo insuficiente no ativo selecionado.");
      return;
    }

    try {
      if (adjustType === "remove") {
        try {
          // Tentar endpoint atómico de retirada
          await api.post(`/investments/${adjustInv.id}/withdraw`, {
            amount: amount,
            transfer_to_balance: transferToBalance
          });
        } catch (withdrawErr) {
          console.warn("Endpoint /withdraw não respondeu, a executar fluxo de fallback de saldo e movimento:", withdrawErr);
          
          // 1. Atualizar saldo do investimento
          const newBal = parseFloat(adjustInv.balance) - amount;
          await api.put(`/investments/${adjustInv.id}`, {
            name: adjustInv.name,
            asset_type: adjustInv.asset_type,
            balance: newBal,
            target: adjustInv.target
          });

          // 2. Se transferToBalance estiver ativo, criar categoria (se inexistente) e criar movimento
          if (transferToBalance) {
            let catId: number | null = null;
            try {
              const catRes = await api.get("/categories");
              const cats = catRes.data || [];
              const foundCat = cats.find((c: any) => c.name === "Investimento - Saída");
              if (foundCat) {
                catId = foundCat.id;
              } else {
                const newCat = await api.post("/categories", {
                  name: "Investimento - Saída",
                  color: "#3b82f6",
                  type: "income"
                });
                catId = newCat.data.id;
              }
            } catch {}

            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const day = String(now.getDate()).padStart(2, "0");
            const dateStr = `${year}-${month}-${day}`;

            await api.post("/transactions", {
              description: `Investimento - Saída (${adjustInv.name})`,
              amount: amount,
              type: "income",
              category_id: catId,
              date: dateStr,
              is_transfer: true
            });
          }
        }

        toast.success(
          transferToBalance 
            ? "Retirada efetuada e creditada no Saldo Atual!" 
            : "Saldo do ativo atualizado com sucesso!"
        );
        window.dispatchEvent(new Event("transactions-updated"));
      } else {
        const newBalance = parseFloat(adjustInv.balance) + amount;
        await api.put(`/investments/${adjustInv.id}`, {
          name: adjustInv.name,
          asset_type: adjustInv.asset_type,
          balance: newBalance,
          target: adjustInv.target
        });
        toast.success("Saldo adicionado com sucesso!");
      }

      setAdjustModalOpen(false);
      setAdjustAmount("");
      fetchData();
      fetchGoalsData();
    } catch(err: any) {
      console.error("Erro no ajuste de saldo:", err);
      toast.error(err?.response?.data?.detail || "Erro ao atualizar o saldo.");
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

  const confirmDeleteInvestment = async () => {
    if (!investmentToDelete) return;
    setIsDeletingInvestment(true);
    try {
      await api.delete(`/investments/${investmentToDelete.id}`);
      toast.success("Investimento eliminado com sucesso.");
      setInvestmentToDelete(null);
      fetchData();
      fetchGoalsData();
    } catch (err) {
      toast.error("Erro ao eliminar investimento");
    } finally {
      setIsDeletingInvestment(false);
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
        toast.success("Ativo atualizado com sucesso!");
      } else {
        toast.success("Ativo adicionado com sucesso!");
      }
      fetchData();
      fetchGoalsData();
    } catch (err) {
      console.error("Failed to save investment");
      toast.error("Erro ao guardar ativo.");
    }
  };

  // ==========================================
  // METAS MENSAIS CRUD & ADVISOR LOGIC
  // ==========================================
  const handleOpenNewGoalModal = () => {
    setEditingGoalId(null);
    setGoalTitle("");
    setGoalType("investment_deposit");
    setGoalTargetAmount("");
    setGoalCategoryId("");
    setGoalInvestmentId(investments[0] ? String(investments[0].id) : "");
    setGoalModalOpen(true);
  };

  const handleOpenEditGoalModal = (goal: GoalItem) => {
    setEditingGoalId(goal.id);
    setGoalTitle(goal.title);
    setGoalType(goal.goal_type);
    setGoalTargetAmount(goal.target_amount.toString());
    setGoalCategoryId(goal.category_id ? String(goal.category_id) : "");
    setGoalInvestmentId(goal.investment_id ? String(goal.investment_id) : "");
    setGoalModalOpen(true);
  };

  const confirmDeleteGoal = async () => {
    if (!goalToDelete) return;
    setIsDeletingGoal(true);
    const goalId = goalToDelete.id;
    try {
      await api.delete(`/goals/${goalId}`).catch(() => {});
      toast.success("Meta eliminada com sucesso!");
    } catch (err) {
      console.warn("Backend /goals delete fallback to local:", err);
      toast.success("Meta eliminada com sucesso!");
    }

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("pl_goals_")) {
          try {
            const existing: GoalItem[] = JSON.parse(localStorage.getItem(key) || "[]");
            if (Array.isArray(existing)) {
              const updated = existing.filter(g => g.id !== goalId);
              localStorage.setItem(key, JSON.stringify(updated));
            }
          } catch {}
        }
      }
    } catch {}

    setGoalToDelete(null);
    setIsDeletingGoal(false);
    fetchGoalsData();
  };

  const toggleSelectAllGoals = () => {
    if (selectedGoals.length === goalCalculations.computedGoals.length && goalCalculations.computedGoals.length > 0) {
      setSelectedGoals([]);
    } else {
      setSelectedGoals(goalCalculations.computedGoals.map((g: any) => g.id));
    }
  };

  const toggleSelectGoal = (id: number) => {
    if (selectedGoals.includes(id)) {
      setSelectedGoals(selectedGoals.filter(gid => gid !== id));
    } else {
      setSelectedGoals([...selectedGoals, id]);
    }
  };

  const handleBulkDeleteGoals = async () => {
    if (selectedGoals.length === 0) return;
    setIsBulkDeletingGoals(true);
    try {
      await Promise.all(selectedGoals.map(id => api.delete(`/goals/${id}`).catch(() => {})));
      
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("pl_goals_")) {
            try {
              const existing: GoalItem[] = JSON.parse(localStorage.getItem(key) || "[]");
              if (Array.isArray(existing)) {
                const updated = existing.filter(g => !selectedGoals.includes(g.id));
                localStorage.setItem(key, JSON.stringify(updated));
              }
            } catch {}
          }
        }
      } catch {}

      toast.success(`${selectedGoals.length} ${selectedGoals.length === 1 ? 'meta eliminada' : 'metas eliminadas'} com sucesso.`);
      setSelectedGoals([]);
      setShowBulkDeleteGoalsModal(false);
      fetchGoalsData();
    } catch (err) {
      toast.error("Erro ao eliminar metas.");
    } finally {
      setIsBulkDeletingGoals(false);
    }
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(goalTargetAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Por favor insere um valor numérico positivo.");
      return;
    }

    if (!goalTitle.trim()) {
      toast.error("Por favor dá um título à tua meta.");
      return;
    }

    setIsSavingGoal(true);
    const targetMonth = (!goalFilterMonth || goalFilterMonth === "Todos" || goalFilterMonth === "todos")
      ? (new Date().getMonth() + 1)
      : parseInt(goalFilterMonth);
    const targetYear = (!goalFilterYear || goalFilterYear === "Todos")
      ? new Date().getFullYear()
      : parseInt(goalFilterYear);

    const localKey = `pl_goals_${targetYear}_${targetMonth}`;
    const payload = {
      title: goalTitle.trim(),
      goal_type: goalType,
      target_amount: amount,
      category_id: goalType === "expense_ceiling" && goalCategoryId ? parseInt(goalCategoryId) : null,
      investment_id: goalType === "investment_deposit" && goalInvestmentId ? parseInt(goalInvestmentId) : null,
      month: targetMonth,
      year: targetYear
    };

    try {
      if (editingGoalId) {
        await api.put(`/goals/${editingGoalId}`, payload);
        toast.success("Meta mensal atualizada com sucesso!");
      } else {
        await api.post("/goals", payload);
        toast.success("Nova meta mensal criada com sucesso!");
      }
    } catch (err) {
      console.warn("Backend /goals save fallback to local storage:", err);
      try {
        const category_name = categories.find(c => c.id === payload.category_id)?.name;
        const investment_name = investments.find(i => i.id === payload.investment_id)?.name;

        if (editingGoalId) {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("pl_goals_")) {
              try {
                const existing: GoalItem[] = JSON.parse(localStorage.getItem(key) || "[]");
                if (Array.isArray(existing) && existing.some(g => g.id === editingGoalId)) {
                  const updated = existing.map(g => g.id === editingGoalId ? { ...g, ...payload, category_name, investment_name, id: editingGoalId } : g);
                  localStorage.setItem(key, JSON.stringify(updated));
                }
              } catch {}
            }
          }
          toast.success("Meta mensal atualizada com sucesso!");
        } else {
          const newGoal: GoalItem = {
            id: Date.now(),
            user_id: 1,
            ...payload,
            category_name,
            investment_name,
            created_at: new Date().toISOString()
          };
          const existing: GoalItem[] = JSON.parse(localStorage.getItem(localKey) || "[]");
          const updated = [newGoal, ...existing.filter(g => g.id !== newGoal.id)];
          localStorage.setItem(localKey, JSON.stringify(updated));
          toast.success("Nova meta mensal criada com sucesso!");
        }
      } catch (localErr) {
        toast.error("Erro ao guardar a meta.");
      }
    } finally {
      setIsSavingGoal(false);
      setGoalModalOpen(false);
      fetchGoalsData();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  // Cálculos de Cruzamento para o Painel de Metas
  const goalCalculations = useMemo(() => {
    const isAllMonths = goalFilterMonth === "Todos" || goalFilterMonth === "todos" || !goalFilterMonth;
    const selectedYear = parseInt(goalFilterYear) || new Date().getFullYear();
    const selectedMonth = parseInt(goalFilterMonth) || (new Date().getMonth() + 1);
    const now = new Date();
    
    let isCurrentMonth = false;
    let daysInMonth = 30;
    let currentDay = now.getDate();
    let remainingDays = 0;

    if (!isAllMonths) {
      isCurrentMonth = now.getFullYear() === selectedYear && (now.getMonth() + 1) === selectedMonth;
      daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
      currentDay = isCurrentMonth ? now.getDate() : (now > new Date(selectedYear, selectedMonth - 1, daysInMonth) ? daysInMonth : 1);
      remainingDays = isCurrentMonth ? Math.max(1, daysInMonth - currentDay) : 0;
    } else {
      const isCurrentYear = now.getFullYear() === selectedYear;
      if (isCurrentYear) {
        const endOfYear = new Date(selectedYear, 11, 31);
        remainingDays = Math.max(0, Math.ceil((endOfYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      }
    }

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + (t.amount || 0), 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + (t.amount || 0), 0);
    const netSavings = totalIncome - totalExpense;
    const currentSavingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

    // Despesas por Categoria
    const categorySpending: Record<number, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      if (t.category_id) {
        categorySpending[t.category_id] = (categorySpending[t.category_id] || 0) + (t.amount || 0);
      }
    });

    let completedGoalsCount = 0;
    let totalSuccessScoreSum = 0;

    const computedGoals = goals.map(goal => {
      let currentVal = 0;
      let progress = 0;
      let successScore = 0;
      let remainingDistance = 0;
      let dailyPace = 0;
      let status: 'completed' | 'on_track' | 'behind' | 'exceeded' = 'on_track';
      let advisorMessage = "";

      if (goal.goal_type === "investment_deposit") {
        if (goal.investment_id) {
          const inv = investments.find(i => i.id === goal.investment_id);
          currentVal = inv ? inv.balance : 0;
        } else {
          currentVal = investments.reduce((acc, i) => acc + (i.balance || 0), 0);
        }
        progress = goal.target_amount > 0 ? (currentVal / goal.target_amount) * 100 : 0;
        successScore = Math.min(100, Math.max(0, progress));
        remainingDistance = Math.max(0, goal.target_amount - currentVal);
        dailyPace = remainingDays > 0 ? remainingDistance / remainingDays : 0;

        if (progress >= 100) {
          status = "completed";
          completedGoalsCount++;
          advisorMessage = `🎉 Meta alcançada! Atingiste o objetivo de ${formatCurrency(goal.target_amount)} em património investido.`;
        } else if (isCurrentMonth && (progress >= (currentDay / daysInMonth) * 100)) {
          status = "on_track";
          advisorMessage = `🚀 Ritmo excelente! Faltam ${formatCurrency(remainingDistance)} em ${remainingDays} dias (${formatCurrency(dailyPace)}/dia).`;
        } else {
          status = "behind";
          advisorMessage = `⚠️ Atraso no ritmo: poupa ${formatCurrency(dailyPace)}/dia nos ${remainingDays} dias restantes para cumprir a meta.`;
        }
      } 
      else if (goal.goal_type === "expense_ceiling") {
        if (goal.category_id) {
          currentVal = categorySpending[goal.category_id] || 0;
        } else {
          currentVal = totalExpense;
        }
        progress = goal.target_amount > 0 ? (currentVal / goal.target_amount) * 100 : 0;
        const marginRemaining = goal.target_amount - currentVal;
        dailyPace = remainingDays > 0 && marginRemaining > 0 ? marginRemaining / remainingDays : 0;

        if (currentVal > goal.target_amount) {
          status = "exceeded";
          successScore = 0; // Teto estourado: 0% de conformidade/sucesso
          advisorMessage = `🚨 Teto ultrapassado em ${formatCurrency(currentVal - goal.target_amount)} (${Math.round(progress)}% do teto consumido)! Congela gastos supérfluos nesta categoria.`;
        } else {
          if (!isCurrentMonth) {
            status = "completed";
            completedGoalsCount++;
            successScore = 100;
            advisorMessage = `🛡️ Meta cumprida! Fechaste o mês abaixo do teto com ${formatCurrency(marginRemaining)} poupados.`;
          } else {
            const expectedConsumptionRatio = currentDay / daysInMonth;
            const actualConsumptionRatio = currentVal / goal.target_amount;
            
            if (actualConsumptionRatio <= expectedConsumptionRatio) {
              status = "on_track";
              successScore = 100;
              advisorMessage = `🛡️ Gastos controlados! Tens ${formatCurrency(marginRemaining)} de margem disponível (${formatCurrency(dailyPace)}/dia).`;
            } else {
              status = "behind";
              successScore = Math.max(10, Math.round((marginRemaining / goal.target_amount) * 100));
              advisorMessage = `⚠️ Ritmo acelerado: limita os gastos a no máximo ${formatCurrency(dailyPace)}/dia para não estourar o teto.`;
            }
          }
        }
      }
      else if (goal.goal_type === "net_savings") {
        currentVal = netSavings;
        progress = goal.target_amount > 0 ? (netSavings / goal.target_amount) * 100 : 0;
        successScore = Math.min(100, Math.max(0, progress));
        remainingDistance = Math.max(0, goal.target_amount - netSavings);
        dailyPace = remainingDays > 0 ? remainingDistance / remainingDays : 0;

        if (netSavings >= goal.target_amount) {
          status = "completed";
          completedGoalsCount++;
          advisorMessage = `🎉 Meta superada! Poupaste ${formatCurrency(netSavings)} líquidos neste mês.`;
        } else if (isCurrentMonth && (progress >= (currentDay / daysInMonth) * 100)) {
          status = "on_track";
          advisorMessage = `🚀 No rumo certo! Retém mais ${formatCurrency(remainingDistance)} (${formatCurrency(dailyPace)}/dia) para fechar o mês com chave de ouro.`;
        } else {
          status = "behind";
          advisorMessage = `💡 Precisas de conter despesas supérfluas: faltam ${formatCurrency(remainingDistance)} para bater a tua meta de poupança líquida.`;
        }
      }
      else if (goal.goal_type === "savings_rate") {
        currentVal = currentSavingsRate;
        progress = goal.target_amount > 0 ? (currentSavingsRate / goal.target_amount) * 100 : 0;
        successScore = Math.min(100, Math.max(0, progress));
        const diffRate = Math.max(0, goal.target_amount - currentSavingsRate);

        if (currentSavingsRate >= goal.target_amount) {
          status = "completed";
          completedGoalsCount++;
          advisorMessage = `🎉 Incrível! Atingiste uma taxa de poupança de ${currentSavingsRate}% sobre as tuas receitas.`;
        } else if (currentSavingsRate >= goal.target_amount * 0.75) {
          status = "on_track";
          advisorMessage = `🚀 Taxa atual em ${currentSavingsRate}%. Estás a apenas ${diffRate}% de bater o objetivo estipulado.`;
        } else {
          status = "behind";
          advisorMessage = `💡 Taxa atual em ${currentSavingsRate}%. Cortar 15% nos maiores gastos variáveis permite alcançar os ${goal.target_amount}% pretendidos.`;
        }
      }

      totalSuccessScoreSum += successScore;

      return {
        ...goal,
        currentVal,
        progress,
        successScore,
        remainingDistance,
        dailyPace,
        status,
        advisorMessage
      };
    });

    const averageProgress = goals.length > 0 ? Math.round(totalSuccessScoreSum / goals.length) : 0;

    return {
      computedGoals,
      completedGoalsCount,
      totalGoalsCount: goals.length,
      averageProgress,
      remainingDays,
      isAllMonths
    };
  }, [goals, transactions, investments, goalFilterYear, goalFilterMonth]);

  if (loading) return <div className="animate-pulse p-8">A carregar investimentos e metas...</div>;

  const totalInvested = investments.reduce((acc: number, curr: any) => acc + curr.balance, 0);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* ========================================================================= */}
      {/* SECÇÃO 1: INVESTIMENTOS & EVOLUÇÃO PATRIMONIAL */}
      {/* ========================================================================= */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-primary" /> Investimentos
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Acompanha a valorização e a composição do teu património.</p>
          </div>
          <div className="glass-card px-6 py-4 flex items-center gap-4 bg-primary/5 border-primary/20">
            <div className="p-3 bg-primary rounded-xl"><PiggyBank className="w-6 h-6 text-white" /></div>
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase">Total Património</p>
              <p className="text-2xl font-black text-primary">{formatCurrency(totalInvested)}</p>
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
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" placeholder="Ex: S&P 500, Fundo Imobiliário..." />
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

          <div className="lg:col-span-2 space-y-8">
            {/* Chart Section */}
            <div className="glass-card p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" /> Evolução Patrimonial
                </h3>
                <div className="flex flex-wrap gap-2">
                  <div className="w-24 sm:w-28">
                    <CustomSelect value={filterYear} onChange={setFilterYear as any} options={[{value:"Todos",label:"Todos"},{value:"2025",label:"2025"},{value:"2026",label:"2026"}]} />
                  </div>
                  <div className="w-24 sm:w-28">
                    <CustomSelect value={filterMonth} onChange={setFilterMonth as any} options={[{value:"Todos",label:"Todos"},{value:"1",label:"Jan"},{value:"2",label:"Fev"},{value:"3",label:"Mar"},{value:"4",label:"Abr"},{value:"5",label:"Mai"},{value:"6",label:"Jun"},{value:"7",label:"Jul"},{value:"8",label:"Ago"},{value:"9",label:"Set"},{value:"10",label:"Out"},{value:"11",label:"Nov"},{value:"12",label:"Dez"}]} />
                  </div>
                  <div className="w-24 sm:w-28">
                    <CustomSelect value={filterDay} onChange={setFilterDay as any} options={[{value:"Todos",label:"Todos"},{value:"1",label:"01"},{value:"5",label:"05"},{value:"10",label:"10"},{value:"15",label:"15"},{value:"20",label:"20"},{value:"25",label:"25"}]} />
                  </div>
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

            {/* Asset Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {investments.length === 0 ? (
                <div className="col-span-full glass-card p-8 text-center text-slate-500 dark:text-slate-400">
                  Nenhum investimento registado. Adiciona o teu primeiro ativo para começares a acompanhar.
                </div>
              ) : (
                investments.map((inv: any) => {
                  const progress = inv.target ? Math.min((inv.balance / inv.target) * 100, 100) : 0;
                  
                  return (
                    <div key={inv.id} className="glass-card p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                      <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-24 h-24 text-primary" />
                      </div>
                      
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-md mb-2">{inv.asset_type}</span>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{inv.name}</h3>
                          </div>
                          <div className="flex flex-wrap justify-end gap-1.5 relative z-20">
                            <button onClick={() => { setAdjustInv(inv); setAdjustType("add"); setAdjustModalOpen(true); }} className="p-2 text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-500 rounded-lg transition-colors" title="Adicionar Valor"><Plus className="w-4 h-4" /></button>
                            <button onClick={() => { setAdjustInv(inv); setAdjustType("remove"); setAdjustModalOpen(true); }} className="p-2 text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-500 rounded-lg transition-colors" title="Retirar Valor"><Minus className="w-4 h-4" /></button>
                            <button onClick={() => handleEdit(inv)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary rounded-lg transition-colors" title="Editar Ativo"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => setInvestmentToDelete(inv)} className="p-2 text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 rounded-lg transition-colors" title="Eliminar Ativo"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <p className="text-3xl font-black text-primary">{formatCurrency(inv.balance)}</p>
                        </div>

                        {inv.target && (
                          <div className="mt-6">
                            <div className="flex justify-between text-sm mb-2 font-medium">
                              <span className="text-slate-500 flex items-center gap-1"><Target className="w-4 h-4" /> Meta</span>
                              <span className="text-slate-900 dark:text-white font-bold">{formatCurrency(inv.target)}</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                              <div className="bg-primary h-2.5 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                            </div>
                            <p className="text-right text-xs font-bold text-primary mt-1">{progress.toFixed(1)}% alcançado</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECÇÃO 2: SISTEMA DE METAS MENSAIS INTELIGENTES (CRUZAMENTO DE DADOS) */}
      {/* ========================================================================= */}
      <div className="pt-8 border-t border-slate-200/80 dark:border-slate-800/80 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20 shrink-0">
                <Target className="w-5 h-5 sm:w-6 sm:h-6" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Metas Mensais & Inteligência Financeira
              </h2>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-2xl">
              Estipula e acompanha os teus objetivos com aconselhamento em tempo real cruzado com os teus movimentos, orçamentos e investimentos.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-28 sm:w-32">
                <CustomSelect 
                  value={goalFilterYear} 
                  onChange={setGoalFilterYear as any} 
                  options={[{value:"Todos",label:"Todos"},{value:"2025",label:"2025"},{value:"2026",label:"2026"}]} 
                />
              </div>
              <div className="w-28 sm:w-32">
                <CustomSelect 
                  value={goalFilterMonth} 
                  onChange={setGoalFilterMonth as any} 
                  options={[
                    {value:"Todos",label:"Todos"},
                    {value:"1",label:"Jan"},
                    {value:"2",label:"Fev"},
                    {value:"3",label:"Mar"},
                    {value:"4",label:"Abr"},
                    {value:"5",label:"Mai"},
                    {value:"6",label:"Jun"},
                    {value:"7",label:"Jul"},
                    {value:"8",label:"Ago"},
                    {value:"9",label:"Set"},
                    {value:"10",label:"Out"},
                    {value:"11",label:"Nov"},
                    {value:"12",label:"Dez"}
                  ]} 
                />
              </div>
            </div>
            <button
              onClick={handleOpenNewGoalModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-md shadow-primary/25 transition-all active:scale-95 text-xs sm:text-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0" /> Nova Meta
            </button>
          </div>
        </div>

        {/* Resumo de Indicadores de Metas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="glass-card p-5 flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Metas Ativas</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{goalCalculations.totalGoalsCount}</p>
            </div>
          </div>

          <div className="glass-card p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Concluídas</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {goalCalculations.completedGoalsCount} de {goalCalculations.totalGoalsCount}
              </p>
            </div>
          </div>

          <div className="glass-card p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl shrink-0">
              <Flame className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Progresso Global</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-2xl font-black text-slate-900 dark:text-white">{goalCalculations.averageProgress}%</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 text-cyan-500 rounded-xl shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dias Restantes</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {goalCalculations.isAllMonths 
                  ? (goalCalculations.remainingDays > 0 ? `${goalCalculations.remainingDays} dias no ano` : "Ano Encerrado")
                  : (goalCalculations.remainingDays > 0 ? `${goalCalculations.remainingDays} dias` : "Mês Fechado")
                }
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar de Selecionar Todas */}
        {goalCalculations.computedGoals.length > 0 && (
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
            <label className="inline-flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedGoals.length === goalCalculations.computedGoals.length && goalCalculations.computedGoals.length > 0}
                onChange={toggleSelectAllGoals}
                className="w-4 h-4 text-primary rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-primary accent-primary cursor-pointer"
              />
              <span>Selecionar Todas ({goalCalculations.computedGoals.length})</span>
            </label>
            {selectedGoals.length > 0 && (
              <span className="text-xs font-bold text-primary animate-in fade-in">
                {selectedGoals.length} {selectedGoals.length === 1 ? 'meta selecionada' : 'metas selecionadas'}
              </span>
            )}
          </div>
        )}

        {/* Grid de Cards de Metas Inteligentes */}
        {goalCalculations.computedGoals.length === 0 ? (
          <div className="glass-card p-12 text-center flex flex-col items-center justify-center">
            <Sparkles className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Sem metas definidas para este mês</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6 text-sm">
              Cria metas inteligentes de aportes, controlo de despesas ou taxa de poupança para receberes acompanhamento detalhado e aconselhamento financeiro.
            </p>
            <button
              onClick={handleOpenNewGoalModal}
              className="flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-95 text-sm"
            >
              <Plus className="w-4 h-4" /> Criar Primeira Meta Mensal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {goalCalculations.computedGoals.map((g: any) => {
              let badgeBg = "bg-primary/10 text-primary border-primary/20";
              let badgeLabel = "Aporte Mensal";
              let icon = <PiggyBank className="w-4 h-4" />;
              let progressColor = "bg-primary";

              if (g.goal_type === "expense_ceiling") {
                badgeBg = "bg-rose-500/10 text-rose-500 border-rose-500/20";
                badgeLabel = "Teto de Despesa";
                icon = <ShieldCheck className="w-4 h-4" />;
                progressColor = g.status === "exceeded" ? "bg-rose-500" : "bg-amber-500";
              } else if (g.goal_type === "net_savings") {
                badgeBg = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
                badgeLabel = "Poupança Líquida";
                icon = <Wallet className="w-4 h-4" />;
                progressColor = "bg-emerald-500";
              } else if (g.goal_type === "savings_rate") {
                badgeBg = "bg-violet-500/10 text-violet-500 border-violet-500/20";
                badgeLabel = "Taxa de Poupança";
                icon = <Percent className="w-4 h-4" />;
                progressColor = "bg-violet-500";
              }

              return (
                <div key={g.id} className="glass-card p-6 flex flex-col justify-between hover:-translate-y-1 active:scale-[0.99] transition-all duration-300 border border-slate-200/80 dark:border-slate-800/80">
                  <div>
                    {/* Top Header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={selectedGoals.includes(g.id)}
                          onChange={() => toggleSelectGoal(g.id)}
                          className="mt-1 w-4 h-4 text-primary rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-primary accent-primary shrink-0 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${badgeBg}`}>
                              {icon} {badgeLabel}
                            </span>
                            {g.category_name && (
                              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                {g.category_name}
                              </span>
                            )}
                            {g.investment_name && (
                              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                {g.investment_name}
                              </span>
                            )}
                            {goalCalculations.isAllMonths && g.month && (
                              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md">
                                Mês {g.month}
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                            {g.title}
                          </h3>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEditGoalModal(g)}
                          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Editar Meta"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setGoalToDelete(g)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Eliminar Meta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Metric Values */}
                    <div className="flex items-baseline justify-between mb-3 mt-4">
                      <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Atual / Objetivo</span>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-2xl font-black text-slate-900 dark:text-white">
                            {g.goal_type === "savings_rate" ? `${g.currentVal}%` : formatCurrency(g.currentVal)}
                          </span>
                          <span className="text-sm font-bold text-slate-400">
                            / {g.goal_type === "savings_rate" ? `${g.target_amount}%` : formatCurrency(g.target_amount)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold ${
                          g.status === 'completed'
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                            : g.status === 'exceeded'
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                            : g.status === 'on_track'
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}>
                          {g.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {g.status === 'exceeded' && <AlertTriangle className="w-3.5 h-3.5" />}
                          {g.status === 'on_track' && <Flame className="w-3.5 h-3.5" />}
                          {g.status === 'completed' ? "Concluída" : g.status === 'exceeded' ? "Ultrapassada" : g.status === 'on_track' ? "No Caminho" : "Atenção ao Ritmo"}
                        </span>
                        <p className="text-xs font-black text-slate-500 mt-1">{g.progress.toFixed(0)}%</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-5">
                      <div 
                        className={`h-full rounded-full ${progressColor} transition-all duration-1000 ease-out`}
                        style={{ width: `${Math.min(100, Math.max(0, g.progress))}%` }}
                      />
                    </div>
                  </div>

                  {/* AI Smart Advisory Box */}
                  <div className="p-3.5 rounded-xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-white flex items-start gap-3 mt-2 shadow-sm">
                    <div className="p-1.5 bg-amber-500/20 text-amber-500 dark:text-amber-400 rounded-lg shrink-0 mt-0.5">
                      <Lightbulb className="w-4 h-4" />
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                      {g.advisorMessage}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: AJUSTAR SALDO DE ATIVO */}
      {/* ========================================================================= */}
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

              {adjustType === "remove" && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={transferToBalance}
                      onChange={(e) => setTransferToBalance(e.target.checked)}
                      className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary accent-primary"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Creditar diretamente no &quot;Saldo Atual&quot;
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-6 leading-tight">
                    Cria automaticamente o movimento <strong>&quot;Investimento - Saída&quot;</strong> creditado na tua conta sem inflacionar as receitas operacionais do mês.
                  </p>
                </div>
              )}

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

      {/* ========================================================================= */}
      {/* MODAL: CRIAR / EDITAR META MENSAL */}
      {/* ========================================================================= */}
      {goalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setGoalModalOpen(false)} 
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Target className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingGoalId ? "Editar Meta Mensal" : "Nova Meta Mensal"}
              </h2>
            </div>

            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
              Define um objetivo para o mês de <strong className="text-slate-700 dark:text-slate-200">{goalFilterMonth}/{goalFilterYear}</strong> com monitorização inteligente.
            </p>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Título da Meta</label>
                <input 
                  type="text" 
                  required 
                  autoFocus
                  value={goalTitle} 
                  onChange={e => setGoalTitle(e.target.value)} 
                  className="w-full px-4 py-2.5 text-sm font-semibold border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all" 
                  placeholder="Ex: Aporte no S&P500, Reduzir Alimentação..." 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo de Meta</label>
                <CustomSelect
                  value={goalType}
                  onChange={(val) => setGoalType(val as any)}
                  options={[
                    { value: "investment_deposit", label: "Aporte em Investimento (€)" },
                    { value: "expense_ceiling", label: "Teto de Despesa (€)" },
                    { value: "net_savings", label: "Poupança Líquida do Mês (€)" },
                    { value: "savings_rate", label: "Taxa de Poupança (% da Receita)" }
                  ]}
                />
              </div>

              {goalType === "investment_deposit" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Ativo de Investimento (Opcional)</label>
                  <CustomSelect
                    value={goalInvestmentId}
                    onChange={(val) => setGoalInvestmentId(val as string)}
                    options={[
                      { value: "", label: "Todos os Investimentos (Total)" },
                      ...investments.map(i => ({ value: String(i.id), label: `${i.name} (${i.asset_type})` }))
                    ]}
                  />
                </div>
              )}

              {goalType === "expense_ceiling" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Categoria de Despesa (Opcional)</label>
                  <CustomSelect
                    value={goalCategoryId}
                    onChange={(val) => setGoalCategoryId(val as string)}
                    options={[
                      { value: "", label: "Todas as Despesas (Total)" },
                      ...categories.filter(c => c.type === 'expense').map(c => ({ value: String(c.id), label: c.name }))
                    ]}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {goalType === "savings_rate" ? "Taxa Alvo (%)" : "Valor Alvo (€)"}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    {goalType === "savings_rate" ? "%" : "€"}
                  </span>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0.01"
                    required 
                    value={goalTargetAmount} 
                    onChange={e => setGoalTargetAmount(e.target.value)} 
                    className="w-full pl-10 pr-4 py-2.5 text-base font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all" 
                    placeholder={goalType === "savings_rate" ? "30" : "500.00"} 
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setGoalModalOpen(false)}
                  className="w-1/2 py-3 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-sm"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSavingGoal}
                  className="w-1/2 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/30 transition-all disabled:opacity-50 text-sm"
                >
                  {isSavingGoal ? "A guardar..." : "Guardar Meta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FLOATING ACTION BAR FOR GOALS BULK SELECTION COM TRANSIÇÃO SUAVE */}
      <div 
        className={`fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm sm:max-w-md px-4 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          selectedGoals.length > 0
            ? "translate-y-0 opacity-100 scale-100 pointer-events-auto"
            : "translate-y-8 opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="glass-panel border border-slate-200/50 dark:border-slate-800 rounded-full p-2.5 shadow-2xl flex items-center justify-between gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
          <div className="flex items-center gap-2 px-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
              {selectedGoals.length}
            </div>
            <span className="text-sm font-semibold text-slate-900 dark:text-white whitespace-nowrap hidden sm:block">
              {selectedGoals.length === 1 ? 'Meta selecionada' : 'Metas selecionadas'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedGoals([])}
              className="text-xs px-3 py-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-full transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => setShowBulkDeleteGoalsModal(true)}
              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/20 text-xs px-4 py-2 rounded-full font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir</span>
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRM MODAL: ELIMINAR META */}
      <ConfirmModal
        isOpen={!!goalToDelete}
        title="Eliminar Meta Mensal"
        description={`Tens a certeza que queres eliminar a meta "${goalToDelete?.title}"? Esta ação removerá o acompanhamento inteligente deste objetivo.`}
        confirmText="Eliminar Meta"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeletingGoal}
        onConfirm={confirmDeleteGoal}
        onCancel={() => setGoalToDelete(null)}
      />

      {/* CONFIRM MODAL: ELIMINAÇÃO EM MASSA DE METAS */}
      <ConfirmModal
        isOpen={showBulkDeleteGoalsModal}
        title={`Excluir ${selectedGoals.length} Metas`}
        description={`Tem a certeza de que deseja eliminar permanentemente as ${selectedGoals.length} metas selecionadas? Esta ação não pode ser desfeita.`}
        confirmText={`Excluir ${selectedGoals.length} Metas`}
        cancelText="Cancelar"
        variant="danger"
        isLoading={isBulkDeletingGoals}
        onConfirm={handleBulkDeleteGoals}
        onCancel={() => setShowBulkDeleteGoalsModal(false)}
      />

      {/* CONFIRM MODAL: ELIMINAR ATIVO DE INVESTIMENTO */}
      <ConfirmModal
        isOpen={!!investmentToDelete}
        title="Eliminar Investimento"
        description={`Tens a certeza que queres eliminar o ativo "${investmentToDelete?.name}"? O histórico e o valor associado a este investimento serão removidos.`}
        confirmText="Eliminar Ativo"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeletingInvestment}
        onConfirm={confirmDeleteInvestment}
        onCancel={() => setInvestmentToDelete(null)}
      />

    </div>
  );
}
