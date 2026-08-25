import { api } from "@/lib/api";

export interface SmartInsight {
  id: string;
  title: string;
  message: string;
  type: "goal" | "budget" | "compound" | "runway" | "savings_rate" | "milestone";
  iconType: "sparkles" | "trending_up" | "alert" | "piggy" | "target";
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);
};

/**
 * Motor de Inteligência Financeira - Cruze de dados entre Transações, Orçamentos, Metas e Investimentos
 */
export async function generateSmartInsights(): Promise<SmartInsight[]> {
  try {
    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const currentMonth = (now.getMonth() + 1).toString();

    const query = new URLSearchParams();
    query.append("year", currentYear);
    query.append("month", currentMonth);

    const [transRes, catRes, invRes] = await Promise.all([
      api.get(`/transactions?${query.toString()}`).catch(() => ({ data: [] })),
      api.get("/categories").catch(() => ({ data: [] })),
      api.get("/investments").catch(() => ({ data: [] }))
    ]);

    const transactions: any[] = transRes.data || [];
    const categories: any[] = catRes.data || [];
    const investments: any[] = invRes.data || [];

    const insights: SmartInsight[] = [];

    // 1. Cálculos de Despesas e Receitas
    const expenses = transactions.filter((t) => t.type === "expense");
    const incomes = transactions.filter((t) => t.type === "income" && !t.is_transfer);

    const totalIncome = incomes.reduce((acc, t) => acc + (t.amount || 0), 0);
    const totalExpense = expenses.reduce((acc, t) => acc + (t.amount || 0), 0);
    const totalInvested = investments.reduce((acc, i) => acc + (i.balance || 0), 0);

    // Agrupar despesas por categoria
    const categorySpending: Record<string, { name: string; amount: number; budget_limit?: number }> = {};
    expenses.forEach((t) => {
      const cat = categories.find((c) => c.id === t.category_id);
      const catId = String(t.category_id || "outros");
      const catName = cat ? cat.name : "Geral";
      if (!categorySpending[catId]) {
        categorySpending[catId] = {
          name: catName,
          amount: 0,
          budget_limit: cat?.budget_limit
        };
      }
      categorySpending[catId].amount += t.amount || 0;
    });

    const sortedExpenses = Object.values(categorySpending).sort((a, b) => b.amount - a.amount);
    const topExpense = sortedExpenses[0];
    const secondExpense = sortedExpenses[1];

    // Investimentos com meta definida
    const investmentsWithTarget = investments.filter((i) => i.target && i.target > i.balance);

    // =========================================================================
    // INSIGHT 1: Aceleração de Meta Cruzando Maior Categoria com Investimento 1
    // =========================================================================
    if (topExpense && topExpense.amount >= 30 && investmentsWithTarget.length > 0) {
      const targetInv = investmentsWithTarget[0];
      const remainingTarget = targetInv.target - targetInv.balance;
      
      const suggestedSaving = Math.max(10, Math.round(topExpense.amount * 0.20));
      const currentMonthlySavings = Math.max(50, totalIncome - totalExpense > 0 ? totalIncome - totalExpense : 100);
      
      const normalMonths = Math.ceil(remainingTarget / currentMonthlySavings);
      const acceleratedMonths = Math.ceil(remainingTarget / (currentMonthlySavings + suggestedSaving));
      const monthsSaved = Math.max(1, normalMonths - acceleratedMonths);

      insights.push({
        id: "goal_acceleration_1",
        title: "Aceleração de Meta Financeira",
        message: `Se poupares ${formatCurrency(suggestedSaving)} no próximo mês em ${topExpense.name}, poderás atingir a tua meta de ${formatCurrency(targetInv.target)} no investimento "${targetInv.name}" ${monthsSaved} ${monthsSaved === 1 ? "mês" : "meses"} mais cedo (em aprox. ${acceleratedMonths} meses)!`,
        type: "goal",
        iconType: "target"
      });
    }

    // =========================================================================
    // INSIGHT 2: Aceleração com Segunda Maior Despesa
    // =========================================================================
    if (secondExpense && secondExpense.amount >= 25 && investmentsWithTarget.length > 0) {
      const targetInv = investmentsWithTarget[1] || investmentsWithTarget[0];
      const remainingTarget = targetInv.target - targetInv.balance;
      const suggestedSaving = Math.max(10, Math.round(secondExpense.amount * 0.15));
      const currentMonthlySavings = Math.max(50, totalIncome - totalExpense > 0 ? totalIncome - totalExpense : 100);
      const normalMonths = Math.ceil(remainingTarget / currentMonthlySavings);
      const acceleratedMonths = Math.ceil(remainingTarget / (currentMonthlySavings + suggestedSaving));
      const monthsSaved = Math.max(1, normalMonths - acceleratedMonths);

      insights.push({
        id: "goal_acceleration_2",
        title: "Otimização de Gastos Secundários",
        message: `Ao reduzires apenas 15% (${formatCurrency(suggestedSaving)}) em ${secondExpense.name}, aceleras a tua meta no ativo "${targetInv.name}" em cerca de ${monthsSaved} ${monthsSaved === 1 ? "mês" : "meses"}!`,
        type: "goal",
        iconType: "target"
      });
    }

    // =========================================================================
    // INSIGHT 3: Alerta / Otimização de Categoria Próxima do Orçamento
    // =========================================================================
    const budgetExceeded = sortedExpenses.find(
      (c) => c.budget_limit && c.budget_limit > 0 && c.amount >= c.budget_limit * 0.75
    );

    if (budgetExceeded && budgetExceeded.budget_limit) {
      const pct = Math.round((budgetExceeded.amount / budgetExceeded.budget_limit) * 100);
      const remainingLimit = Math.max(0, budgetExceeded.budget_limit - budgetExceeded.amount);

      insights.push({
        id: "budget_optimization",
        title: "Otimização de Orçamento",
        message: `A categoria ${budgetExceeded.name} já consumiu ${pct}% do teto mensal estipulado. Mantendo os gastos controlados, proteges ${formatCurrency(remainingLimit > 0 ? remainingLimit : 30)} para os teus investimentos!`,
        type: "budget",
        iconType: "alert"
      });
    }

    // =========================================================================
    // INSIGHT 4: Projeção de Juros Compostos a 3 Anos (7%/ano)
    // =========================================================================
    const potentialMonthlyExtra = topExpense ? Math.max(25, Math.round(topExpense.amount * 0.15)) : 50;
    const monthlyRate = 0.07 / 12;
    const futureValue3Years = Math.round(
      potentialMonthlyExtra * ((Math.pow(1 + monthlyRate, 36) - 1) / monthlyRate)
    );

    insights.push({
      id: "compound_growth_3y",
      title: "Poder dos Juros Compostos (3 Anos)",
      message: `Ao poupares ${formatCurrency(potentialMonthlyExtra)}/mês e reinvestires a 7% ao ano, acumularás ${formatCurrency(futureValue3Years)} adicionais em apenas 3 anos!`,
      type: "compound",
      iconType: "trending_up"
    });

    // =========================================================================
    // INSIGHT 5: Projeção de Juros Compostos a 5 Anos (8%/ano)
    // =========================================================================
    const monthlyRate5y = 0.08 / 12;
    const futureValue5Years = Math.round(
      potentialMonthlyExtra * ((Math.pow(1 + monthlyRate5y, 60) - 1) / monthlyRate5y)
    );

    insights.push({
      id: "compound_growth_5y",
      title: "Horizonte a 5 Anos",
      message: `Mantendo um aporte extra constante de ${formatCurrency(potentialMonthlyExtra)}/mês a 8% ao ano, terás ${formatCurrency(futureValue5Years)} de capital acumulado em 5 anos!`,
      type: "compound",
      iconType: "trending_up"
    });

    // =========================================================================
    // INSIGHT 6: Runway / Cobertura da Reserva de Emergência
    // =========================================================================
    if (totalInvested > 0 && totalExpense > 0) {
      const runwayMonths = (totalInvested / totalExpense).toFixed(1);
      insights.push({
        id: "financial_runway",
        title: "Segurança e Liberdade Financeira",
        message: `O teu património investido total (${formatCurrency(totalInvested)}) cobre aproximadamente ${runwayMonths} meses do teu custo de vida mensal atual!`,
        type: "runway",
        iconType: "piggy"
      });
    }

    // =========================================================================
    // INSIGHT 7: Taxa de Poupança (Savings Rate)
    // =========================================================================
    if (totalIncome > 0) {
      const savingsRate = Math.round(((totalIncome - totalExpense) / totalIncome) * 100);
      const boostAmount = Math.round(totalIncome * 0.05);

      if (savingsRate > 0) {
        insights.push({
          id: "savings_rate",
          title: "Taxa de Poupança Ativa",
          message: `A tua taxa de poupança este mês está em ${savingsRate}%. Aumentando apenas 5% (cerca de ${formatCurrency(boostAmount)}), atinges a tua independência financeira muito mais rapidamente.`,
          type: "savings_rate",
          iconType: "sparkles"
        });
      }
    }

    // Fallback padrão se houver poucos dados
    if (insights.length === 0) {
      insights.push({
        id: "default_tip",
        title: "Dica de Gestão Financeira",
        message: "Regista regularmente as tuas despesas e estipula metas nos teus Investimentos para receberes projeções inteligentes e personalizadas!",
        type: "goal",
        iconType: "sparkles"
      });
    }

    return insights;
  } catch (error) {
    console.error("Erro ao gerar insights inteligentes:", error);
    return [];
  }
}
