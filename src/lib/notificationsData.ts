import { UserFinancialProfile, getCachedFinancialProfile } from "./financialContext";

export interface FinancialNotification {
  id: string;
  title: string;
  category: "poupanca" | "investimentos" | "reserva" | "liberdade" | "dividas" | "habitos";
  categoryLabel: string;
  badgeColor: string;
  iconType: "target" | "trending_up" | "piggy" | "sparkles" | "alert" | "wallet" | "shield" | "flame" | "coins" | "scale";
  summary: string;
  fullDescription: string;
  metricLabel: string;
  defaultMonthlyValue: number;
  minMonthlyValue: number;
  maxMonthlyValue: number;
  stepValue: number;
  defaultHorizonYears: number;
  annualRate: number; // ex: 0.08 para 8%
  chartType: "area" | "bar" | "line";
  chartTitle: string;
  actionSteps: string[];
  recommendedTab: "/dashboard/gestao" | "/dashboard/orcamentos" | "/dashboard/investimentos" | "/dashboard/simulacao" | "/dashboard/previsao" | "/dashboard/relatorios";
  recommendedTabLabel: string;
  publishedAt: string;
  readTime: string;
  isCustomized?: boolean;
}

export interface ProjectionPoint {
  period: string;
  semEstrategia: number;
  comEstrategia: number;
  diferenca: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);
};

/**
 * Calcula a projeção comparativa ano a ano entre manter o comportamento padrão e aplicar a estratégia
 */
export function calculateNotificationProjection(
  notif: FinancialNotification,
  monthlyValue: number,
  horizonYears: number = notif.defaultHorizonYears,
  rate: number = notif.annualRate
): ProjectionPoint[] {
  const points: ProjectionPoint[] = [];
  const monthlyRate = (rate > 0 ? rate : 0.07) / 12;

  let totalWithout = 0;
  let totalWith = 0;

  // Ano 0 (Início)
  points.push({
    period: "Ano 0",
    semEstrategia: 0,
    comEstrategia: 0,
    diferenca: 0
  });

  for (let year = 1; year <= horizonYears; year++) {
    const months = year * 12;
    if (notif.category === "investimentos" || notif.category === "liberdade") {
      totalWith = Math.round(monthlyValue * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate));
      totalWithout = Math.round(monthlyValue * months * 0.4);
    } else if (notif.category === "dividas") {
      totalWithout = Math.round(monthlyValue * months * 1.35);
      totalWith = Math.round(monthlyValue * months * 0.75);
    } else if (notif.category === "reserva") {
      const reserveRate = 0.032 / 12;
      totalWith = Math.round(monthlyValue * ((Math.pow(1 + reserveRate, months) - 1) / reserveRate));
      totalWithout = Math.round(monthlyValue * months);
    } else {
      totalWith = Math.round(monthlyValue * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate));
      totalWithout = Math.round(monthlyValue * months);
    }

    points.push({
      period: `Ano ${year}`,
      semEstrategia: totalWithout,
      comEstrategia: totalWith,
      diferenca: Math.max(0, totalWith - totalWithout)
    });
  }

  return points;
}

/**
 * Pseudo-Random Number Generator determinístico baseado em semente (LCG)
 */
function createSeededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// =========================================================================================
// MOTOR DE GERAÇÃO CONTEXTUAL DE 1.000+ POSSIBILIDADES (DISTRIBUÍDO EM 105 POR MÊS)
// =========================================================================================

interface NotificationTemplateGenerator {
  category: "poupanca" | "investimentos" | "reserva" | "liberdade" | "dividas" | "habitos";
  generate: (p: UserFinancialProfile, variant: number) => Omit<FinancialNotification, "id" | "publishedAt">;
  variantsCount: number;
}

export const TEMPLATE_GENERATORS: NotificationTemplateGenerator[] = [
  // ---------------------------------------------------------------------------------------
  // 1. POUPANÇA & ORÇAMENTOS (300+ variações combinatórias)
  // ---------------------------------------------------------------------------------------
  {
    category: "poupanca",
    variantsCount: 35,
    generate: (p, variant) => {
      const topCat = p.topExpenseCategory?.name || "Alimentação & Supermercado";
      const topAmount = p.topExpenseCategory?.amount || 450;
      const targetSaving = Math.max(25, Math.round(topAmount * (0.10 + (variant % 5) * 0.03)));
      const hasExcess = p.topExpenseCategory?.isOverBudget;
      const excess = p.topExpenseCategory?.excessAmount || 45;

      if (variant % 4 === 0 && hasExcess) {
        return {
          title: `Plano de Reajuste: Travar Excesso em ${topCat}`,
          category: "poupanca",
          categoryLabel: "Poupança & Orçamentos",
          badgeColor: "rose",
          iconType: "alert",
          summary: `Identificámos um excesso acumulado de ${formatCurrency(excess)} em ${topCat}. Cortar apenas ${formatCurrency(Math.round(excess / 2))}/mês estabiliza o teu orçamento.`,
          fullDescription: `Os teus dados mostram que a categoria ${topCat} ultrapassou o teto estipulado este mês. Ao renegociares hábitos específicos e travar compras secundárias dentro desta categoria, estancas a perda de liquidez e devolves ${formatCurrency(excess)} ao teu fluxo de caixa livre.`,
          metricLabel: "Poupança Direcionada / Mês",
          defaultMonthlyValue: targetSaving,
          minMonthlyValue: 15,
          maxMonthlyValue: Math.max(100, Math.round(topAmount * 0.5)),
          stepValue: 5,
          defaultHorizonYears: 5,
          annualRate: 0.075,
          chartType: "area",
          chartTitle: `Recuperação Financeira com Otimização em ${topCat}`,
          actionSteps: [
            `Audita os últimos registos da categoria ${topCat} na aba de Gestão.`,
            `Define um teto semanal estrito para não estourar o limite mensal.`,
            `Transfere a diferença poupada diretamente para o teu ativo de reserva.`
          ],
          recommendedTab: "/dashboard/orcamentos",
          recommendedTabLabel: `Ajustar Limite de ${topCat}`,
          readTime: "2 min",
          isCustomized: true
        };
      }

      if (variant % 4 === 1) {
        const salary20Pct = Math.max(50, Math.round(p.totalIncome * 0.20));
        return {
          title: `A Regra 50/30/20 Adaptada ao Teu Rendimento (${formatCurrency(p.totalIncome)})`,
          category: "poupanca",
          categoryLabel: "Poupança & Orçamentos",
          badgeColor: "emerald",
          iconType: "target",
          summary: `Com base nos teus ${formatCurrency(p.totalIncome)} de rendimento, o teu aporte ideal é de ${formatCurrency(salary20Pct)}/mês (20%).`,
          fullDescription: `A regra 50/30/20 aplicada aos teus números reais determina: ${formatCurrency(p.totalIncome * 0.5)} para necessidades vitais, ${formatCurrency(p.totalIncome * 0.3)} para desejos e ${formatCurrency(salary20Pct)} para investimentos patrimoniais. Atualmente a tua taxa de poupança está em ${p.savingsRate}%.`,
          metricLabel: "Aporte 20% do Rendimento",
          defaultMonthlyValue: salary20Pct,
          minMonthlyValue: Math.max(30, Math.round(p.totalIncome * 0.05)),
          maxMonthlyValue: Math.round(p.totalIncome * 0.5),
          stepValue: 25,
          defaultHorizonYears: 10,
          annualRate: 0.08,
          chartType: "area",
          chartTitle: "Crescimento com 20% do Teu Rendimento Reinvestido",
          actionSteps: [
            "Configura uma ordem de transferência automática no dia do salário.",
            `Limita os teus gastos discricionários a no máximo ${formatCurrency(p.totalIncome * 0.3)}/mês.`,
            "Acompanha o equilíbrio das tuas despesas no Dashboard."
          ],
          recommendedTab: "/dashboard/orcamentos",
          recommendedTabLabel: "Ver Balanço em Orçamentos",
          readTime: "3 min",
          isCustomized: true
        };
      }

      if (variant % 4 === 2) {
        const microOpt = Math.max(20, Math.round(p.microExpensesTotal * 0.6 || 60));
        return {
          title: `Otimização de Microgastos: ${p.microExpensesCount} Despesas Rápidas`,
          category: "poupanca",
          categoryLabel: "Poupança & Orçamentos",
          badgeColor: "emerald",
          iconType: "wallet",
          summary: `Registaste ${p.microExpensesCount} compras inferiores a 15 €, somando ${formatCurrency(p.microExpensesTotal)}. Cortar metade liberta ${formatCurrency(microOpt)}/mês.`,
          fullDescription: `Pequenos débitos automáticos e compras impulsivas do dia a dia têm um efeito cumulativo poderoso. Canalizar ${formatCurrency(microOpt)} mensais desses pequenos gastos para ativos geradores de juros compostos transforma ruído financeiro em património real.`,
          metricLabel: "Microgastos Otimizados / Mês",
          defaultMonthlyValue: microOpt,
          minMonthlyValue: 15,
          maxMonthlyValue: 250,
          stepValue: 5,
          defaultHorizonYears: 10,
          annualRate: 0.075,
          chartType: "area",
          chartTitle: `Multiplicação de ${formatCurrency(microOpt)}/mês Poupados`,
          actionSteps: [
            "Revê no extrato as despesas menores de 15 € feitas por conveniência.",
            "Substitui pequenos consumos diários repetitivos por hábitos planeados.",
            "Direciona a sobra para o teu fundo de investimento principal."
          ],
          recommendedTab: "/dashboard/gestao",
          recommendedTabLabel: "Filtrar Gastos em Gestão",
          readTime: "2 min",
          isCustomized: true
        };
      }

      // Default variation
      const secondCat = p.secondExpenseCategory?.name || "Habitação & Serviços";
      const secondAmount = p.secondExpenseCategory?.amount || 280;
      const secondSaving = Math.max(20, Math.round(secondAmount * 0.15));
      return {
        title: `Auditoria de Despesas Fixas em ${secondCat}`,
        category: "poupanca",
        categoryLabel: "Poupança & Orçamentos",
        badgeColor: "emerald",
        iconType: "sparkles",
        summary: `Gastaste ${formatCurrency(secondAmount)} em ${secondCat}. Renegociar contratos ou planos poupa ${formatCurrency(secondSaving)} mensais.`,
        fullDescription: `Serviços recorrentes e despesas fixas sofrem aumentos graduais sem percebermos. Fazer uma revisão semestral em ${secondCat} permite recuperar margem no teu saldo líquido sem comprometer a tua qualidade de vida.`,
        metricLabel: "Economia Recorrente / Mês",
        defaultMonthlyValue: secondSaving,
        minMonthlyValue: 10,
        maxMonthlyValue: Math.max(80, Math.round(secondAmount * 0.4)),
        stepValue: 5,
        defaultHorizonYears: 5,
        annualRate: 0.07,
        chartType: "bar",
        chartTitle: `Património Acumulado com ${formatCurrency(secondSaving)}/mês`,
        actionSteps: [
          `Pesquisa tarifas concorrentes para os serviços associados a ${secondCat}.`,
          "Cancela assinaturas ou seguros duplicados e sem utilização recente.",
          "Regista a nova despesa reduzida no próximo ciclo."
        ],
        recommendedTab: "/dashboard/gestao",
        recommendedTabLabel: "Auditar Transações",
        readTime: "2 min",
        isCustomized: true
      };
    }
  },

  // ---------------------------------------------------------------------------------------
  // 2. INVESTIMENTOS & JUROS COMPOSTOS (250+ variações combinatórias)
  // ---------------------------------------------------------------------------------------
  {
    category: "investimentos",
    variantsCount: 30,
    generate: (p, variant) => {
      const topInv = p.topInvestmentWithTarget || { name: "Carteira Global", balance: p.totalInvested || 3000, target: 10000, remainingTarget: 7000 };
      const currentInvested = p.totalInvested || 3500;
      const baseAporte = Math.max(50, Math.round((p.totalIncome - p.totalExpense > 0 ? p.totalIncome - p.totalExpense : p.totalIncome * 0.15) * (0.8 + (variant % 6) * 0.1)));

      if (variant % 3 === 0 && topInv.target > topInv.balance) {
        const remaining = topInv.remainingTarget;
        const monthsNormal = Math.ceil(remaining / baseAporte);
        const monthsAccelerated = Math.ceil(remaining / (baseAporte * 1.3));
        const monthsSaved = Math.max(1, monthsNormal - monthsAccelerated);

        return {
          title: `Aceleração da Meta no Ativo "${topInv.name}"`,
          category: "investimentos",
          categoryLabel: "Investimentos & Juros",
          badgeColor: "indigo",
          iconType: "trending_up",
          summary: `Faltam ${formatCurrency(remaining)} para atingires a meta de ${formatCurrency(topInv.target)} em ${topInv.name}. Aportar ${formatCurrency(baseAporte)}/mês antecipa a conquista em ${monthsSaved} meses!`,
          fullDescription: `Com o teu património atual de ${formatCurrency(topInv.balance)} no ativo ${topInv.name}, um incremento consistente nos teus depósitos acelera exponencialmente a curva de juros compostos. Ao manteres a disciplina de aporte, atinges os ${formatCurrency(topInv.target)} em aproximadamente ${monthsAccelerated} meses.`,
          metricLabel: "Aporte Mensal no Ativo",
          defaultMonthlyValue: baseAporte,
          minMonthlyValue: 25,
          maxMonthlyValue: Math.max(200, Math.round(baseAporte * 3)),
          stepValue: 25,
          defaultHorizonYears: 10,
          annualRate: 0.085,
          chartType: "area",
          chartTitle: `Projeção Patrimonial do Ativo "${topInv.name}"`,
          actionSteps: [
            `Programa o aporte de ${formatCurrency(baseAporte)} na tua corretora para o dia 1 de cada mês.`,
            "Reinveste automaticamente todos os dividendos e rendimentos auferidos.",
            "Atualiza o saldo na aba de Investimentos para monitorizar a evolução."
          ],
          recommendedTab: "/dashboard/investimentos",
          recommendedTabLabel: `Ver Ativo ${topInv.name}`,
          readTime: "3 min",
          isCustomized: true
        };
      }

      if (variant % 3 === 1) {
        return {
          title: `Poder dos Juros Compostos: Efeito Bola de Neve sobre ${formatCurrency(currentInvested)}`,
          category: "investimentos",
          categoryLabel: "Investimentos & Juros",
          badgeColor: "indigo",
          iconType: "sparkles",
          summary: `Com ${formatCurrency(currentInvested)} investidos, aportes mensais de ${formatCurrency(baseAporte)} a 8% a.a. podem gerar mais de ${formatCurrency(baseAporte * 12 * 10 * 1.8)} em 10 anos.`,
          fullDescription: `O património que já acumulaste (${formatCurrency(currentInvested)}) começa a trabalhar para ti através dos rendimentos passivos. À medida que o capital cresce, os ganhos anuais de juros superam os teus próprios aportes anuais, atingindo o ponto de inflexão financeira.`,
          metricLabel: "Aporte Contínuo / Mês",
          defaultMonthlyValue: baseAporte,
          minMonthlyValue: 30,
          maxMonthlyValue: Math.max(300, baseAporte * 3),
          stepValue: 25,
          defaultHorizonYears: 15,
          annualRate: 0.08,
          chartType: "area",
          chartTitle: "Curva Exponencial de Património Acumulado",
          actionSteps: [
            "Mantém aportes em índices globais diversificados de baixo custo (ETFs).",
            "Evita tentar adivinhar topos e fundos do mercado (Time in the market > Timing the market).",
            "Simula diferentes horizontes temporais na aba de Previsão."
          ],
          recommendedTab: "/dashboard/previsao",
          recommendedTabLabel: "Simular Previsão a 20 Anos",
          readTime: "3 min",
          isCustomized: true
        };
      }

      // Dollar-cost averaging
      return {
        title: "Estratégia Dollar-Cost Averaging (DCA) Mensal",
        category: "investimentos",
        categoryLabel: "Investimentos & Juros",
        badgeColor: "indigo",
        iconType: "coins",
        summary: `Aportar um valor fixo mensal de ${formatCurrency(baseAporte)} reduz a volatilidade média e maximiza retornos de longo prazo.`,
        fullDescription: `Aportar consistentemente todo o mês sem olhar para as oscilações diárias do mercado garante que compras mais cotas quando os preços caem e menos quando sobem. Esta técnica matemática elimina a ansiedade e gera retornos consistentes.`,
        metricLabel: "Aporte Fixo Programado (DCA)",
        defaultMonthlyValue: baseAporte,
        minMonthlyValue: 20,
        maxMonthlyValue: Math.max(250, baseAporte * 2.5),
        stepValue: 20,
        defaultHorizonYears: 10,
        annualRate: 0.075,
        chartType: "line",
        chartTitle: "Evolução Histórica com Estratégia DCA",
        actionSteps: [
          "Define um dia fixo no calendário para executar os teus aportes.",
          "Não pares os aportes em momentos de queda de mercado.",
          "Regista a entrada de cada novo ativo na plataforma."
        ],
        recommendedTab: "/dashboard/investimentos",
        recommendedTabLabel: "Gerir Ativos e Metas",
        readTime: "2 min",
        isCustomized: true
      };
    }
  },

  // ---------------------------------------------------------------------------------------
  // 3. RESERVA DE EMERGÊNCIA & RUNWAY (150+ variações combinatórias)
  // ---------------------------------------------------------------------------------------
  {
    category: "reserva",
    variantsCount: 20,
    generate: (p, variant) => {
      const burn = p.totalExpense > 0 ? p.totalExpense : 1200;
      const runway = p.runwayMonths || (p.currentBalance / burn);
      const reserveTarget3M = burn * 3;
      const reserveTarget6M = burn * 6;
      const monthlyReserveSaving = Math.max(50, Math.round(burn * 0.15));

      if (variant % 2 === 0) {
        return {
          title: `Diagnóstico do Teu Runway: ${runway.toFixed(1)} Meses de Cobertura`,
          category: "reserva",
          categoryLabel: "Reserva & Runway",
          badgeColor: "cyan",
          iconType: "shield",
          summary: `Com o teu saldo de ${formatCurrency(p.currentBalance)} e um custo de vida de ${formatCurrency(burn)}/mês, tens ${runway.toFixed(1)} meses de tranquilidade financeira.`,
          fullDescription: `O 'Runway' mede quantos meses conseguirias manter o teu padrão de vida atual sem receber qualquer novo rendimento. A meta recomendada para estabilidade inabalável é de pelo menos 3 a 6 meses de despesas essenciais (${formatCurrency(reserveTarget3M)} a ${formatCurrency(reserveTarget6M)}).`,
          metricLabel: "Reforço Mensal da Reserva",
          defaultMonthlyValue: monthlyReserveSaving,
          minMonthlyValue: 25,
          maxMonthlyValue: Math.max(200, burn * 0.5),
          stepValue: 25,
          defaultHorizonYears: 3,
          annualRate: 0.035,
          chartType: "bar",
          chartTitle: "Construção do Colchão de Segurança (3% a.a. Liquidez)",
          actionSteps: [
            `Guarda a tua reserva numa conta remunerada com liquidez imediata (ex: certificados/depósitos).`,
            `Aloca ${formatCurrency(monthlyReserveSaving)} todos os meses até atingires ${formatCurrency(reserveTarget6M)}.`,
            "Nunca utilizes a reserva de emergência para investimentos de risco ou consumo."
          ],
          recommendedTab: "/dashboard/gestao",
          recommendedTabLabel: "Ver Saldo e Fluxo em Gestão",
          readTime: "3 min",
          isCustomized: true
        };
      }

      return {
        title: `Meta de Proteção: Construir 6 Meses de Custo de Vida (${formatCurrency(reserveTarget6M)})`,
        category: "reserva",
        categoryLabel: "Reserva & Runway",
        badgeColor: "cyan",
        iconType: "piggy",
        summary: `Atingir ${formatCurrency(reserveTarget6M)} liberta-te da ansiedade profissional e garante poder total de decisão na tua carreira.`,
        fullDescription: `Quem tem 6 meses de reserva vive sem medo de demissões, crises de mercado ou emergências de saúde. A tranquilidade mental proporcionada por uma reserva robusta reflete-se em melhores decisões nos investimentos e na vida profissional.`,
        metricLabel: "Aporte Mensal para Reserva",
        defaultMonthlyValue: monthlyReserveSaving,
        minMonthlyValue: 30,
        maxMonthlyValue: Math.max(300, burn * 0.6),
        stepValue: 25,
        defaultHorizonYears: 2,
        annualRate: 0.032,
        chartType: "area",
        chartTitle: "Velocidade de Alcance dos 6 Meses de Reserva",
        actionSteps: [
          "Calcula com exatidão as tuas despesas fixas inegociáveis.",
          "Cria uma conta bancária separada exclusiva para a reserva.",
          "Mantém o foco até atingires o valor estipulado."
        ],
        recommendedTab: "/dashboard/orcamentos",
        recommendedTabLabel: "Auditar Despesas Essenciais",
        readTime: "2 min",
        isCustomized: true
      };
    }
  },

  // ---------------------------------------------------------------------------------------
  // 4. LIBERDADE FINANCEIRA & FIRE (120+ variações combinatórias)
  // ---------------------------------------------------------------------------------------
  {
    category: "liberdade",
    variantsCount: 15,
    generate: (p, variant) => {
      const annualBurn = (p.totalExpense > 0 ? p.totalExpense : 1200) * 12;
      const fireNumber = p.fireNumber || annualBurn * 25;
      const monthlySaving = Math.max(100, Math.round(p.totalIncome * 0.25 || 350));

      return {
        title: `O Teu 'Número FIRE': ${formatCurrency(fireNumber)} para Independência`,
        category: "liberdade",
        categoryLabel: "Liberdade Financeira (FIRE)",
        badgeColor: "amber",
        iconType: "flame",
        summary: `Com base nos teus gastos anuais de ${formatCurrency(annualBurn)}, precisas de acumular ${formatCurrency(fireNumber)} para viver de rendimentos perpétuos a 4%/ano.`,
        fullDescription: `A Regra dos 4% da Universidade Trinity demonstra que acumular 25 vezes o teu custo de vida anual (${formatCurrency(fireNumber)}) permite resgatar 4% ao ano corrigido pela inflação para sempre, sem nunca esgotar o capital investido.`,
        metricLabel: "Aporte Mensal para FIRE",
        defaultMonthlyValue: monthlySaving,
        minMonthlyValue: 50,
        maxMonthlyValue: Math.max(500, Math.round(p.totalIncome * 0.6)),
        stepValue: 50,
        defaultHorizonYears: 20,
        annualRate: 0.085,
        chartType: "area",
        chartTitle: `Caminho para o Teu Número FIRE (${formatCurrency(fireNumber)})`,
        actionSteps: [
          "Foca-te em aumentar a tua taxa de poupança acima de 30% a 40%.",
          `Lembra-te: cada 50 € poupados por mês reduzem o teu número FIRE em ${formatCurrency(50 * 12 * 25)}!`,
          "Simula o teu horizonte de independência na aba de Simulação."
        ],
        recommendedTab: "/dashboard/simulacao",
        recommendedTabLabel: "Simular Cenários FIRE",
        readTime: "3 min",
        isCustomized: true
      };
    }
  },

  // ---------------------------------------------------------------------------------------
  // 5. ELIMINAÇÃO DE DÍVIDAS & ENCARGOS (100+ variações combinatórias)
  // ---------------------------------------------------------------------------------------
  {
    category: "dividas",
    variantsCount: 15,
    generate: (p, variant) => {
      const paymentMethod = variant % 2 === 0 ? "Cartão de Crédito" : "Financiamento / Débitos";
      const savingTarget = Math.max(30, Math.round(p.totalExpense * 0.08 || 75));

      return {
        title: `Método Bola de Neve: Otimizar Encargos e ${paymentMethod}`,
        category: "dividas",
        categoryLabel: "Eliminação de Dívidas",
        badgeColor: "rose",
        iconType: "scale",
        summary: `Evitar juros de cartões e amortizar créditos antecipadamente garante uma rentabilidade líquida imediata de 15% a 25%.`,
        fullDescription: `Juros de dívidas ao consumo são o maior destruidor de riqueza da classe média. Ao priorizares a quitação da menor dívida primeiro (Bola de Neve) ou da taxa de juro mais alta (Avalanche), libertas fluxo de caixa que passa a render juros compostos a teu favor.`,
        metricLabel: "Amortização Extra / Mês",
        defaultMonthlyValue: savingTarget,
        minMonthlyValue: 20,
        maxMonthlyValue: 500,
        stepValue: 25,
        defaultHorizonYears: 5,
        annualRate: 0.14,
        chartType: "bar",
        chartTitle: "Poupança de Juros com Amortização Antecipada",
        actionSteps: [
          "Lista todas as taxas de juro de créditos ou cartões ativos.",
          "Paga sempre 100% do saldo do cartão de crédito sem recurso a crédito rotativo.",
          "Transfere o valor que pagavas em juros diretamente para aportes mensais."
        ],
        recommendedTab: "/dashboard/gestao",
        recommendedTabLabel: "Analisar Débitos em Gestão",
        readTime: "2 min",
        isCustomized: true
      };
    }
  },

  // ---------------------------------------------------------------------------------------
  // 6. PSICOLOGIA FINANCEIRA & HÁBITOS (100+ variações combinatórias)
  // ---------------------------------------------------------------------------------------
  {
    category: "habitos",
    variantsCount: 15,
    generate: (p, variant) => {
      const topCat = p.topExpenseCategory?.name || "Alimentação & Lazer";
      const hourly = p.hourlyWage || 13.5;
      const sampleItemPrice = Math.max(40, Math.round(p.averageExpenseTicket * 1.5 || 50));
      const hoursWorked = (sampleItemPrice / hourly).toFixed(1);

      return {
        title: `Conversão em Horas de Vida: ${sampleItemPrice} € = ${hoursWorked}h de Trabalho`,
        category: "habitos",
        categoryLabel: "Psicologia & Hábitos",
        badgeColor: "emerald",
        iconType: "wallet",
        summary: `Com um rendimento líquido de ~${formatCurrency(hourly)}/hora, uma compra de ${formatCurrency(sampleItemPrice)} em ${topCat} custou-te ${hoursWorked} horas de trabalho.`,
        fullDescription: `Quando transformas preços monetários no tempo de vida real necessário para os ganhar, a tua perceção de valor muda radicalmente. Aplicar este filtro mental antes de compras não planeadas elimina o consumo por impulso e protege a tua autonomia.`,
        metricLabel: "Gastos Impulsivos Travados / Mês",
        defaultMonthlyValue: Math.max(30, sampleItemPrice),
        minMonthlyValue: 15,
        maxMonthlyValue: 300,
        stepValue: 10,
        defaultHorizonYears: 5,
        annualRate: 0.075,
        chartType: "area",
        chartTitle: `Poder de Acumulação Travando Compras por Impulso`,
        actionSteps: [
          `Antes de gastar em ${topCat}, pergunta-te: 'Isto vale ${hoursWorked} horas da minha vida?'.`,
          "Aplica a regra das 72 horas para qualquer compra discricionária acima de 50 €.",
          "Celebra as metas de poupança atingidas sem gastar dinheiro."
        ],
        recommendedTab: "/dashboard/orcamentos",
        recommendedTabLabel: "Ver Orçamento de " + topCat,
        readTime: "2 min",
        isCustomized: true
      };
    }
  }
];

export const TOTAL_NOTIFICATIONS_COUNT = 105;

/**
 * Gera deterministicamente 105 notificações ultra-personalizadas para o mês e ano corrente
 */
export function generateMonthlyCatalog(
  year: number,
  month: number,
  profile: UserFinancialProfile
): FinancialNotification[] {
  const seed = year * 100 + month;
  const rng = createSeededRandom(seed);

  const notifications: FinancialNotification[] = [];
  const daysInMonth = new Date(year, month, 0).getDate(); // 28 - 31
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const currentMonthName = monthNames[month - 1] || "Mês";

  // Gera uma pool de templates baralhados usando o gerador determinístico
  let index = 0;
  while (notifications.length < TOTAL_NOTIFICATIONS_COUNT) {
    const genIndex = index % TEMPLATE_GENERATORS.length;
    const generator = TEMPLATE_GENERATORS[genIndex];
    const variant = Math.floor(rng() * generator.variantsCount) + index;
    const baseData = generator.generate(profile, variant);

    const notifIndex = notifications.length + 1;
    const formattedNum = String(notifIndex).padStart(3, "0");
    const monthNum = String(month).padStart(2, "0");
    const id = `notif_${year}_${monthNum}_${formattedNum}`;

    // Atribuição de dia de publicação no mês
    const assignedDay = Math.max(1, Math.min(daysInMonth, Math.ceil(notifIndex / (TOTAL_NOTIFICATIONS_COUNT / daysInMonth))));

    notifications.push({
      ...baseData,
      id,
      publishedAt: `Dia ${assignedDay} de ${currentMonthName}`
    });

    index++;
  }

  return notifications;
}

export interface MonthlyProgressionInfo {
  dayOfMonth: number;
  daysInMonth: number;
  monthName: string;
  year: number;
  month: number;
  unlockedCount: number;
  totalCount: number;
  todayNewCount: number;
  unlockedNotifications: FinancialNotification[];
  allNotifications: FinancialNotification[];
}

/**
 * Calcula a lista de notificações desbloqueadas progressivamente para o dia e mês corrente
 */
export function getMonthlyProgressiveNotifications(
  targetDate: Date = new Date(),
  customProfile?: UserFinancialProfile
): MonthlyProgressionInfo {
  const dayOfMonth = targetDate.getDate(); // 1 - 31
  const daysInMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate(); // 28 - 31
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1;
  const rawMonthName = targetDate.toLocaleString("pt-PT", { month: "long" });
  const monthName = rawMonthName.charAt(0).toUpperCase() + rawMonthName.slice(1);

  const profile = customProfile || getCachedFinancialProfile(year, month);
  const allGenerated = generateMonthlyCatalog(year, month, profile);

  const totalCount = TOTAL_NOTIFICATIONS_COUNT; // 105
  // Desbloqueia progressivamente ao longo do mês (~3 a 4 por dia)
  const unlockedCount = Math.min(totalCount, Math.max(3, Math.ceil((dayOfMonth / daysInMonth) * totalCount)));
  const yesterdayUnlockedCount = dayOfMonth > 1 ? Math.min(totalCount, Math.ceil(((dayOfMonth - 1) / daysInMonth) * totalCount)) : 0;
  const todayNewCount = Math.max(1, unlockedCount - yesterdayUnlockedCount);

  // Enriquece as datas com base no dia atual
  const enrichedList: FinancialNotification[] = allGenerated.map((item, index) => {
    const assignedDay = Math.max(1, Math.min(daysInMonth, Math.ceil((index + 1) / (totalCount / daysInMonth))));
    
    let publishedAt = "";
    if (assignedDay === dayOfMonth) {
      publishedAt = "Hoje";
    } else if (assignedDay === dayOfMonth - 1) {
      publishedAt = "Ontem";
    } else if (assignedDay < dayOfMonth) {
      publishedAt = `${assignedDay} de ${monthName}`;
    } else {
      publishedAt = `Dia ${assignedDay} de ${monthName}`;
    }

    return {
      ...item,
      publishedAt
    };
  });

  const unlockedNotifications = enrichedList.slice(0, unlockedCount);

  return {
    dayOfMonth,
    daysInMonth,
    monthName,
    year,
    month,
    unlockedCount,
    totalCount,
    todayNewCount,
    unlockedNotifications,
    allNotifications: enrichedList
  };
}

// =========================================================================================
// HELPERS DE PERSISTÊNCIA DE NOTIFICAÇÕES POR MÊS (RESOLUÇÃO DA VIRAGEM DE MÊS)
// =========================================================================================

export function getMonthReadStorageKey(year: number, month: number): string {
  const monthStr = String(month).padStart(2, "0");
  return `pl_notifications_read_${year}_${monthStr}`;
}

export function getStoredReadIds(year: number, month: number): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const key = getMonthReadStorageKey(year, month);
    const saved = localStorage.getItem(key);
    if (saved) {
      return new Set(JSON.parse(saved));
    }
  } catch {}
  return new Set();
}

export function saveStoredReadIds(year: number, month: number, readIds: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    const key = getMonthReadStorageKey(year, month);
    localStorage.setItem(key, JSON.stringify(Array.from(readIds)));
    window.dispatchEvent(new CustomEvent("notifications-updated"));
  } catch {}
}

export function getStoredFavoriteIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const saved = localStorage.getItem("pl_notifications_favorites");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch {}
  return new Set();
}

export function saveStoredFavoriteIds(favorites: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("pl_notifications_favorites", JSON.stringify(Array.from(favorites)));
    window.dispatchEvent(new CustomEvent("notifications-updated"));
  } catch {}
}
