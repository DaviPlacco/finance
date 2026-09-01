import { api } from "@/lib/api";

export interface CategorySpendingProfile {
  id: string | number;
  name: string;
  amount: number;
  budgetLimit: number;
  isOverBudget: boolean;
  excessAmount: number;
  percentageUsed: number;
  color?: string;
  icon?: string;
}

export interface InvestmentAssetProfile {
  id: string | number;
  name: string;
  balance: number;
  target: number;
  remainingTarget: number;
  progressPercentage: number;
  type?: string;
}

export interface UserFinancialProfile {
  year: number;
  month: number;
  currentBalance: number;
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  savingsRate: number; // ex: 25 (%)
  transactionsCount: number;
  averageExpenseTicket: number;
  microExpensesCount: number; // despesas < 15 €
  microExpensesTotal: number;
  topExpenseCategory: CategorySpendingProfile | null;
  secondExpenseCategory: CategorySpendingProfile | null;
  thirdExpenseCategory: CategorySpendingProfile | null;
  allExpenseCategories: CategorySpendingProfile[];
  overBudgetCategories: CategorySpendingProfile[];
  totalInvested: number;
  investments: InvestmentAssetProfile[];
  topInvestmentWithTarget: InvestmentAssetProfile | null;
  runwayMonths: number;
  fireNumber: number; // 25x despesas anuais
  hourlyWage: number; // rendimento líquido estimado por hora (160h/mês)
}

/**
 * Retorna valores padrão realistas e seguros caso o utilizador ainda não tenha histórico
 */
export function getDefaultFinancialProfile(year: number = new Date().getFullYear(), month: number = new Date().getMonth() + 1): UserFinancialProfile {
  return {
    year,
    month,
    currentBalance: 1500,
    totalIncome: 2200,
    totalExpense: 1450,
    netCashFlow: 750,
    savingsRate: 34,
    transactionsCount: 28,
    averageExpenseTicket: 35.5,
    microExpensesCount: 12,
    microExpensesTotal: 85,
    topExpenseCategory: {
      id: "alimentacao",
      name: "Alimentação & Supermercado",
      amount: 450,
      budgetLimit: 400,
      isOverBudget: true,
      excessAmount: 50,
      percentageUsed: 112.5
    },
    secondExpenseCategory: {
      id: "habitacao",
      name: "Habitação & Contas",
      amount: 650,
      budgetLimit: 700,
      isOverBudget: false,
      excessAmount: 0,
      percentageUsed: 92.8
    },
    thirdExpenseCategory: {
      id: "lazer",
      name: "Lazer & Restaurantes",
      amount: 180,
      budgetLimit: 150,
      isOverBudget: true,
      excessAmount: 30,
      percentageUsed: 120
    },
    allExpenseCategories: [],
    overBudgetCategories: [],
    totalInvested: 5400,
    investments: [
      {
        id: "1",
        name: "Fundo Global ETF / S&P500",
        balance: 3200,
        target: 10000,
        remainingTarget: 6800,
        progressPercentage: 32
      },
      {
        id: "2",
        name: "PPR Reforma Ativa",
        balance: 2200,
        target: 5000,
        remainingTarget: 2800,
        progressPercentage: 44
      }
    ],
    topInvestmentWithTarget: {
      id: "1",
      name: "Fundo Global ETF / S&P500",
      balance: 3200,
      target: 10000,
      remainingTarget: 6800,
      progressPercentage: 32
    },
    runwayMonths: 1.03,
    fireNumber: 435000,
    hourlyWage: 13.75
  };
}

/**
 * Lê o perfil financeiro armazenado localmente em cache para renderização síncrona instantânea
 */
export function getCachedFinancialProfile(targetYear?: number, targetMonth?: number): UserFinancialProfile {
  const now = new Date();
  const year = targetYear || now.getFullYear();
  const month = targetMonth || (now.getMonth() + 1);

  if (typeof window === "undefined") {
    return getDefaultFinancialProfile(year, month);
  }

  try {
    const cached = localStorage.getItem("pl_financial_profile_cache");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed.totalIncome === "number") {
        return {
          ...parsed,
          year,
          month
        };
      }
    }
  } catch {}

  return getDefaultFinancialProfile(year, month);
}

/**
 * Reconstrói o perfil financeiro em tempo real a partir dos dados do backend ou de dados em cache
 */
export async function refreshUserFinancialProfile(targetYear?: number, targetMonth?: number): Promise<UserFinancialProfile> {
  const now = new Date();
  const year = targetYear || now.getFullYear();
  const month = targetMonth || (now.getMonth() + 1);

  try {
    const query = new URLSearchParams();
    query.append("year", year.toString());
    query.append("month", month.toString());

    const [sumRes, transRes, catRes, invRes] = await Promise.all([
      api.get(`/summary?${query.toString()}`).catch(() => null),
      api.get(`/transactions?${query.toString()}`).catch(() => null),
      api.get("/categories").catch(() => null),
      api.get("/investments").catch(() => null)
    ]);

    const summary = sumRes?.data || {};
    const transactions: any[] = transRes?.data || [];
    const categories: any[] = catRes?.data || [];
    const investmentsData: any[] = invRes?.data || [];

    const expenses = transactions.filter((t) => t.type === "expense");
    const incomes = transactions.filter((t) => t.type === "income" && !t.is_transfer);

    const totalIncome = typeof summary.income === "number" && summary.income > 0 
      ? summary.income 
      : incomes.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    
    const totalExpense = typeof summary.expense === "number" && summary.expense > 0 
      ? summary.expense 
      : expenses.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

    const currentBalance = typeof summary.balance === "number" ? summary.balance : 0;
    const netCashFlow = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netCashFlow / totalIncome) * 100)) : 0;

    // Agrupamento por categoria
    const categoryMap: Record<string, CategorySpendingProfile> = {};
    expenses.forEach((t) => {
      const catId = String(t.category_id || "outros");
      const cat = categories.find((c) => String(c.id) === catId);
      const catName = cat ? cat.name : "Outros Gastos";
      const budgetLimit = Number(cat?.budget_limit) || 0;

      if (!categoryMap[catId]) {
        categoryMap[catId] = {
          id: catId,
          name: catName,
          amount: 0,
          budgetLimit,
          isOverBudget: false,
          excessAmount: 0,
          percentageUsed: 0,
          color: cat?.color,
          icon: cat?.icon
        };
      }
      categoryMap[catId].amount += Number(t.amount) || 0;
    });

    const allExpenseCategories = Object.values(categoryMap).map((cat) => {
      const isOverBudget = cat.budgetLimit > 0 && cat.amount > cat.budgetLimit;
      const excessAmount = isOverBudget ? cat.amount - cat.budgetLimit : 0;
      const percentageUsed = cat.budgetLimit > 0 ? Math.round((cat.amount / cat.budgetLimit) * 100) : 0;
      return {
        ...cat,
        isOverBudget,
        excessAmount,
        percentageUsed
      };
    }).sort((a, b) => b.amount - a.amount);

    const topExpenseCategory = allExpenseCategories[0] || null;
    const secondExpenseCategory = allExpenseCategories[1] || null;
    const thirdExpenseCategory = allExpenseCategories[2] || null;
    const overBudgetCategories = allExpenseCategories.filter((c) => c.isOverBudget);

    // Microgastos (< 15 €)
    const microExpenses = expenses.filter((t) => Number(t.amount) > 0 && Number(t.amount) <= 15);
    const microExpensesCount = microExpenses.length;
    const microExpensesTotal = microExpenses.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const averageExpenseTicket = expenses.length > 0 ? totalExpense / expenses.length : 0;

    // Investimentos
    const investments: InvestmentAssetProfile[] = investmentsData.map((inv: any) => {
      const balance = Number(inv.balance) || 0;
      const target = Number(inv.target) || 0;
      const remainingTarget = Math.max(0, target - balance);
      const progressPercentage = target > 0 ? Math.min(100, Math.round((balance / target) * 100)) : 0;
      return {
        id: inv.id,
        name: inv.name,
        balance,
        target,
        remainingTarget,
        progressPercentage,
        type: inv.type
      };
    });

    const totalInvested = investments.reduce((acc, i) => acc + i.balance, 0);
    const investmentsWithTarget = investments.filter((i) => i.target > i.balance);
    const topInvestmentWithTarget = investmentsWithTarget[0] || investments[0] || null;

    // Métricas calculadas
    const monthlyBurn = totalExpense > 0 ? totalExpense : 1000;
    const runwayMonths = Math.round((currentBalance / monthlyBurn) * 10) / 10;
    const fireNumber = monthlyBurn * 12 * 25;
    const hourlyWage = totalIncome > 0 ? Math.round((totalIncome / 160) * 100) / 100 : 12.5;

    const profile: UserFinancialProfile = {
      year,
      month,
      currentBalance,
      totalIncome: totalIncome || 2000,
      totalExpense: totalExpense || 1200,
      netCashFlow,
      savingsRate,
      transactionsCount: expenses.length,
      averageExpenseTicket,
      microExpensesCount,
      microExpensesTotal,
      topExpenseCategory,
      secondExpenseCategory,
      thirdExpenseCategory,
      allExpenseCategories,
      overBudgetCategories,
      totalInvested,
      investments,
      topInvestmentWithTarget,
      runwayMonths: runwayMonths > 0 ? runwayMonths : 0.5,
      fireNumber,
      hourlyWage
    };

    try {
      localStorage.setItem("pl_financial_profile_cache", JSON.stringify(profile));
      window.dispatchEvent(new CustomEvent("financial-profile-updated", { detail: profile }));
    } catch {}

    return profile;
  } catch (err) {
    console.warn("Erro ao gerar perfil financeiro em tempo real:", err);
    return getCachedFinancialProfile(year, month);
  }
}
