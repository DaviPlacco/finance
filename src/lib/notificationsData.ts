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
  annualRate: number; // ex: 0.07 para 7%
  chartType: "area" | "bar" | "line";
  chartTitle: string;
  actionSteps: string[];
  recommendedTab: "/dashboard/gestao" | "/dashboard/orcamentos" | "/dashboard/investimentos" | "/dashboard/simulacao" | "/dashboard/previsao" | "/dashboard/relatorios";
  recommendedTabLabel: string;
  publishedAt: string;
  readTime: string;
}

export interface ProjectionPoint {
  period: string;
  semEstrategia: number;
  comEstrategia: number;
  diferenca: number;
}

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
  const monthlyRate = rate / 12;

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
    // Projeção baseada na categoria
    if (notif.category === "investimentos" || notif.category === "liberdade") {
      // Cenário com estratégia: Aporte mensal com juros compostos
      const months = year * 12;
      totalWith = Math.round(monthlyValue * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate));
      // Cenário sem estratégia: Apenas guardar sem rendimento (ou poupar metade)
      totalWithout = Math.round(monthlyValue * months * 0.4);
    } else if (notif.category === "dividas") {
      // Cenário sem estratégia: Juros acumulados da dívida
      const months = year * 12;
      totalWithout = Math.round(monthlyValue * months * 1.35);
      // Cenário com estratégia: Dívida amortizada antecipadamente gerando poupança de juros
      totalWith = Math.round(monthlyValue * months * 0.75);
    } else if (notif.category === "reserva") {
      // Cenário de acumulação de reserva segura com liquidez remunerada (3% a.a.)
      const reserveRate = 0.03 / 12;
      const months = year * 12;
      totalWith = Math.round(monthlyValue * ((Math.pow(1 + reserveRate, months) - 1) / reserveRate));
      totalWithout = Math.round(monthlyValue * months);
    } else {
      // Poupança e Hábitos: Acumulação do corte de gastos reinvestido
      const months = year * 12;
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

// =========================================================================================
// CATÁLOGO COMPLETO DE 105 NOTIFICAÇÕES & DICAS FINANCEIRAS ESTRATÉGICAS
// =========================================================================================

export const NOTIFICATIONS_CATALOG: FinancialNotification[] = [
  // -------------------------------------------------------------
  // 1. METAS, POUPANÇA & OTIMIZAÇÃO DE ORÇAMENTOS (1 - 20)
  // -------------------------------------------------------------
  {
    id: "notif_001",
    title: "A Regra 50/30/20 Aplicada às Tuas Finanças",
    category: "poupanca",
    categoryLabel: "Poupança & Orçamentos",
    badgeColor: "emerald",
    iconType: "target",
    summary: "Divide o teu rendimento líquido em 50% necessidades, 30% desejos e 20% poupança e investimentos.",
    fullDescription: "A regra 50/30/20 é um dos frameworks de gestão financeira pessoal mais consolidados do mundo. Ao destinares rigorosamente 20% do teu rendimento para investimentos antes de qualquer outra despesa ('Paga-te a ti primeiro'), crias uma barreira psicológica contra o aumento do estilo de vida e aceleras a tua autonomia patrimonial.",
    metricLabel: "Poupança Mensal (20%)",
    defaultMonthlyValue: 300,
    minMonthlyValue: 50,
    maxMonthlyValue: 2000,
    stepValue: 25,
    defaultHorizonYears: 10,
    annualRate: 0.08,
    chartType: "area",
    chartTitle: "Evolução do Património com 20% de Poupança Reinvestida",
    actionSteps: [
      "Configura uma transferência automática no dia do recebimento do salário.",
      "Audita os 50% de despesas essenciais para identificar desperdícios.",
      "Mantém os gastos discricionários rigorosamente dentro do teto de 30%."
    ],
    recommendedTab: "/dashboard/orcamentos",
    recommendedTabLabel: "Configurar Tetos em Orçamentos",
    publishedAt: "Hoje",
    readTime: "2 min"
  },
  {
    id: "notif_002",
    title: "Otimização de Microgastos: O 'Fator Café'",
    category: "poupanca",
    categoryLabel: "Poupança & Orçamentos",
    badgeColor: "emerald",
    iconType: "wallet",
    summary: "Pequenos gastos diários de 3 € a 5 € representam mais de 1.400 € a 2.500 € por ano quando acumulados.",
    fullDescription: "Gastos pequenos e automáticos passam frequentemente despercebidos, mas quando anualizados representam um custo de oportunidade massivo. Ao canalizares metade desses gastos para um fundo de investimento de baixo custo, o poder dos juros compostos transforma pequenas economias num património substancial.",
    metricLabel: "Microgastos Otimizados / Mês",
    defaultMonthlyValue: 90,
    minMonthlyValue: 20,
    maxMonthlyValue: 300,
    stepValue: 10,
    defaultHorizonYears: 10,
    annualRate: 0.075,
    chartType: "area",
    chartTitle: "Poder de Multiplicação de 90 €/mês Poupados",
    actionSteps: [
      "Lista todos os pequenos gastos diários nos últimos 30 dias na aba de Gestão.",
      "Substitui cafés de rua frequentes ou snacks por alternativas planeadas.",
      "Redireciona a economia gerada para um aporte mensal automático."
    ],
    recommendedTab: "/dashboard/gestao",
    recommendedTabLabel: "Analisar Despesas em Gestão",
    publishedAt: "Hoje",
    readTime: "3 min"
  },
  {
    id: "notif_003",
    title: "Auditoria Semestral de Subscrições Digitais",
    category: "poupanca",
    categoryLabel: "Poupança & Orçamentos",
    badgeColor: "emerald",
    iconType: "sparkles",
    summary: "Cancela serviços de streaming, aplicações e assinaturas duplicadas ou não utilizadas.",
    fullDescription: "Em média, utilizadores mantêm 3 a 5 assinaturas digitais ativas que utilizam menos de 2 vezes por mês. Fazer uma revisão semestral de cartões e débitos diretos elimina drenos invisíveis no orçamento e liberta fluxo de caixa livre imediato.",
    metricLabel: "Subscrições Canceladas / Mês",
    defaultMonthlyValue: 45,
    minMonthlyValue: 10,
    maxMonthlyValue: 200,
    stepValue: 5,
    defaultHorizonYears: 5,
    annualRate: 0.07,
    chartType: "bar",
    chartTitle: "Capital Acumulado com Cancelamento de Subscrições",
    actionSteps: [
      "Filtra no extrato as despesas recorrentes com cartões de crédito e débito.",
      "Cancela serviços não acedidos nos últimos 30 dias.",
      "Partilha planos familiares onde for legal e conveniente."
    ],
    recommendedTab: "/dashboard/gestao",
    recommendedTabLabel: "Auditar Transações",
    publishedAt: "Ontem",
    readTime: "2 min"
  },
  {
    id: "notif_004",
    title: "Orçamentação Base Zero (Zero-Based Budgeting)",
    category: "poupanca",
    categoryLabel: "Poupança & Orçamentos",
    badgeColor: "emerald",
    iconType: "target",
    summary: "Atribui uma função específica a cada cêntimo do teu rendimento até o saldo restar exatamente zero.",
    fullDescription: "Ao aplicar a Orçamentação Base Zero, todo o teu dinheiro tem destino prévio: contas fixas, alimentação, lazer e a parcela de investimentos. O dinheiro 'sem destino' é o que mais rapidamente desaparece em gastos impulsivos.",
    metricLabel: "Alocação Direcionada / Mês",
    defaultMonthlyValue: 250,
    minMonthlyValue: 50,
    maxMonthlyValue: 1500,
    stepValue: 25,
    defaultHorizonYears: 10,
    annualRate: 0.08,
    chartType: "area",
    chartTitle: "Crescimento Patrimonial com Orçamento Base Zero",
    actionSteps: [
      "Define o orçamento antes do início de cada mês na aba de Orçamentos.",
      "Aloca 100% da receita entre despesas, metas e investimentos.",
      "Acompanha desvios semanalmente para manter o controle total."
    ],
    recommendedTab: "/dashboard/orcamentos",
    recommendedTabLabel: "Ajustar Orçamentos",
    publishedAt: "Ontem",
    readTime: "3 min"
  },
  {
    id: "notif_005",
    title: "Desafio das 52 Semanas de Poupança Progressiva",
    category: "poupanca",
    categoryLabel: "Poupança & Orçamentos",
    badgeColor: "emerald",
    iconType: "coins",
    summary: "Começa com 1 € na primeira semana e aumenta 1 € a cada semana até acumular 1.378 € num único ano.",
    fullDescription: "O Desafio das 52 Semanas desenvolve o músculo da disciplina financeira. Começar pequeno reduz a resistência mental e cria o hábito inegociável de poupar progressivamente todas as semanas.",
    metricLabel: "Média Mensal Poupada",
    defaultMonthlyValue: 115,
    minMonthlyValue: 30,
    maxMonthlyValue: 500,
    stepValue: 15,
    defaultHorizonYears: 5,
    annualRate: 0.06,
    chartType: "bar",
    chartTitle: "Evolução do Desafio das 52 Semanas Multiplicado",
    actionSteps: [
      "Guarda o valor semanal estipulado numa conta poupança separada.",
      "Automatiza o processo para evitar esquecimentos no final do ano.",
      "Ao final das 52 semanas, transfere o montante para o teu portfólio de investimentos."
    ],
    recommendedTab: "/dashboard/investimentos",
    recommendedTabLabel: "Ver Ativos em Investir",
    publishedAt: "Há 2 dias",
    readTime: "2 min"
  },
  {
    id: "notif_006",
    title: "Otimização de Contratos de Energia e Telecomunicações",
    category: "poupanca",
    categoryLabel: "Poupança & Orçamentos",
    badgeColor: "emerald",
    iconType: "scale",
    summary: "Renegoceia anualmente os tarifários de eletricidade, gás e internet para poupar até 300 € a 600 €/ano.",
    fullDescription: "O mercado liberalizado de energia e telecomunicações oferece constantemente campanhas mais vantajosas para novos clientes ou retenção. Uma chamada de 15 minutos pode reduzir a tua fatura fixa em 25% a 40% sem qualquer perda de qualidade.",
    metricLabel: "Economia em Faturas / Mês",
    defaultMonthlyValue: 40,
    minMonthlyValue: 15,
    maxMonthlyValue: 150,
    stepValue: 5,
    defaultHorizonYears: 5,
    annualRate: 0.07,
    chartType: "area",
    chartTitle: "Impacto Financeiro da Renegociação de Contratos",
    actionSteps: [
      "Compara tarifários nos simuladores oficiais de energia e telecomunicações.",
      "Contacta a tua operadora atual e solicita equiparação de preços de mercado.",
      "Reinveste a poupança mensal diretamente na tua carteira de ativos."
    ],
    recommendedTab: "/dashboard/gestao",
    recommendedTabLabel: "Ver Gastos Fixos",
    publishedAt: "Há 3 dias",
    readTime: "3 min"
  },
  {
    id: "notif_007",
    title: "Planeamento de Compras de Supermercado e Refeições",
    category: "poupanca",
    categoryLabel: "Poupança & Orçamentos",
    badgeColor: "emerald",
    iconType: "wallet",
    summary: "Fazer compras com lista estrita e menu semanal reduz o desperdício alimentar e os gastos em até 20%.",
    fullDescription: "A categoria de alimentação é normalmente a segunda maior despesa familiar após a habitação. Planear refeições e evitar compras no supermercado sem lista previne compras por impulso e refeições de conveniência caras.",
    metricLabel: "Poupança Alimentar / Mês",
    defaultMonthlyValue: 120,
    minMonthlyValue: 30,
    maxMonthlyValue: 400,
    stepValue: 10,
    defaultHorizonYears: 10,
    annualRate: 0.075,
    chartType: "area",
    chartTitle: "Poupança Alimentar Reinvestida a Longo Prazo",
    actionSteps: [
      "Define um teto mensal rígido para a categoria Alimentação em Orçamentos.",
      "Elabora a ementa semanal antes de ir às compras.",
      "Evita ir ao supermercado com fome ou sem lista de compras."
    ],
    recommendedTab: "/dashboard/orcamentos",
    recommendedTabLabel: "Definir Teto de Alimentação",
    publishedAt: "Há 4 dias",
    readTime: "2 min"
  },
  {
    id: "notif_008",
    title: "Criação de Fundos de Amortização (Sinking Funds)",
    category: "poupanca",
    categoryLabel: "Poupança & Orçamentos",
    badgeColor: "emerald",
    iconType: "piggy",
    summary: "Guarda pequenas quantias mensais para despesas sazonais (seguros, IMI, manutenção automóvel, Natal).",
    fullDescription: "Despesas anuais previsíveis não são emergências. Ao criar um Fundo de Amortização mensal, transformas pagamentos pesados de fim de ano em pequenas parcelas diluídas ao longo dos 12 meses.",
    metricLabel: "Provisão Sazonal / Mês",
    defaultMonthlyValue: 150,
    minMonthlyValue: 50,
    maxMonthlyValue: 600,
    stepValue: 25,
    defaultHorizonYears: 5,
    annualRate: 0.035,
    chartType: "bar",
    chartTitle: "Previsibilidade Orçamental com Sinking Funds",
    actionSteps: [
      "Lista todos os impostos, seguros e revisões que ocorrem 1 ou 2 vezes ao ano.",
      "Divide o valor total anual por 12 e programa uma transferência mensal.",
      "Mantém este valor numa subconta com liquidez diária remunerada."
    ],
    recommendedTab: "/dashboard/previsao",
    recommendedTabLabel: "Simular na Previsão",
    publishedAt: "Há 5 dias",
    readTime: "3 min"
  },
  {
    id: "notif_009",
    title: "Eliminação da Inflação do Estilo de Vida",
    category: "poupanca",
    categoryLabel: "Poupança & Orçamentos",
    badgeColor: "emerald",
    iconType: "trending_up",
    summary: "Sempre que tiveres um aumento de salário ou bónus, direciona no mínimo 60% para investimentos.",
    fullDescription: "A 'Lifestyle Creep' é a armadilha mais perigosa para a construção de riqueza: aumentar as despesas no mesmo ritmo dos aumentos salariais. Direcionar o bónus para a tua carteira acelera a tua independência sem comprometer o conforto atual.",
    metricLabel: "Aporte Adicional / Mês",
    defaultMonthlyValue: 200,
    minMonthlyValue: 50,
    maxMonthlyValue: 1500,
    stepValue: 50,
    defaultHorizonYears: 15,
    annualRate: 0.085,
    chartType: "area",
    chartTitle: "Efeito de Proteger Aumentos Salariais contra a Inflação de Estilo",
    actionSteps: [
      "Sempre que receberes um aumento, atualiza a transferência automática de investimento antes de ajustar o padrão de vida.",
      "Celebra as conquistas com moderação sem criar novas despesas fixas recorrentes."
    ],
    recommendedTab: "/dashboard/investimentos",
    recommendedTabLabel: "Adicionar Ativo em Investir",
    publishedAt: "Há 6 dias",
    readTime: "2 min"
  },
  {
    id: "notif_010",
    title: "Compras Conscientes: O Teste das 72 Horas",
    category: "poupanca",
    categoryLabel: "Poupança & Orçamentos",
    badgeColor: "emerald",
    iconType: "sparkles",
    summary: "Aguarda 72 horas antes de concluir qualquer compra não essencial superior a 50 €.",
    fullDescription: "A dopamina gerada pelo impulso da compra dissipa-se em 48 a 72 horas. Estatísticas mostram que mais de 65% das compras por impulso são canceladas quando o consumidor impõe este período de reflexão voluntária.",
    metricLabel: "Compras Evitadas / Mês",
    defaultMonthlyValue: 100,
    minMonthlyValue: 25,
    maxMonthlyValue: 500,
    stepValue: 25,
    defaultHorizonYears: 10,
    annualRate: 0.075,
    chartType: "area",
    chartTitle: "Património Resultante de Gastos de Impulso Evitados",
    actionSteps: [
      "Adiciona o item à lista de desejos em vez de finalizar o carrinho imediatamente.",
      "Após 3 dias, avalia se o item continua a ser estritamente prioritário.",
      "Se desistires da compra, transfere o valor correspondente para a tua conta de investimento."
    ],
    recommendedTab: "/dashboard/simulacao",
    recommendedTabLabel: "Simular no Simulador",
    publishedAt: "Há 1 semana",
    readTime: "2 min"
  },

  // -------------------------------------------------------------
  // 2. INVESTIMENTOS & JUROS COMPOSTOS (21 - 40)
  // -------------------------------------------------------------
  {
    id: "notif_011",
    title: "O Efeito Bola de Neve dos Juros Compostos",
    category: "investimentos",
    categoryLabel: "Investimentos & Juros Compostos",
    badgeColor: "indigo",
    iconType: "trending_up",
    summary: "O tempo no mercado supera o timing do mercado: os juros compostos multiplicam o capital exponencialmente.",
    fullDescription: "Albert Einstein apelidou os juros compostos de 'oitava maravilha do mundo'. Quando os rendimentos obtidos geram novos rendimentos mês após mês, a curva de crescimento torna-se parabólica a partir do 7º ao 10º ano de aportes constantes.",
    metricLabel: "Aporte Mensal Constante",
    defaultMonthlyValue: 200,
    minMonthlyValue: 50,
    maxMonthlyValue: 2000,
    stepValue: 25,
    defaultHorizonYears: 15,
    annualRate: 0.08,
    chartType: "area",
    chartTitle: "Crescimento Exponencial do Capital Investido",
    actionSteps: [
      "Define um valor fixo inegociável para investir todos os meses.",
      "Reinveste sempre 100% dos dividendos e juros recebidos.",
      "Mantém a estratégia com consistência independentemente do ruído de curto prazo."
    ],
    recommendedTab: "/dashboard/investimentos",
    recommendedTabLabel: "Acompanhar Portfólio",
    publishedAt: "Hoje",
    readTime: "3 min"
  },
  {
    id: "notif_012",
    title: "Estratégia DCA (Dollar-Cost Averaging) em Índices Globais",
    category: "investimentos",
    categoryLabel: "Investimentos & Juros Compostos",
    badgeColor: "indigo",
    iconType: "target",
    summary: "Investir o mesmo montante todos os meses reduz o risco de comprar em topos de mercado.",
    fullDescription: "O Dollar-Cost Averaging elimina a ansiedade de adivinhar o melhor momento para investir. Em momentos de queda, compras mais unidades de ativos ao melhor preço; em momentos de alta, valorizas as posições já adquiridas.",
    metricLabel: "Aporte DCA Mensal",
    defaultMonthlyValue: 250,
    minMonthlyValue: 50,
    maxMonthlyValue: 1500,
    stepValue: 50,
    defaultHorizonYears: 10,
    annualRate: 0.085,
    chartType: "area",
    chartTitle: "Acumulação Patrimonial com DCA Global",
    actionSteps: [
      "Escolhe fundos de índice (ETFs) globais diversificados com baixas comissões de gestão (TER < 0.25%).",
      "Programa compras automáticas no mesmo dia de cada mês.",
      "Evita alterar a periodicidade em momentos de volatilidade."
    ],
    recommendedTab: "/dashboard/investimentos",
    recommendedTabLabel: "Gerir Ativos",
    publishedAt: "Hoje",
    readTime: "3 min"
  },
  {
    id: "notif_013",
    title: "Poder do Reinvestimento Total de Dividendos (DRIP)",
    category: "investimentos",
    categoryLabel: "Investimentos & Juros Compostos",
    badgeColor: "indigo",
    iconType: "coins",
    summary: "Reinvestir dividendos acelera o número de ações que produzem novos dividendos no ciclo seguinte.",
    fullDescription: "Estudos históricos no índice S&P 500 demonstram que mais de 70% do retorno total de longo prazo nas últimas décadas adveio do reinvestimento de dividendos. Utilizar ETFs de acumulação ou reinvestir proventos maximiza a eficiência fiscal.",
    metricLabel: "Dividendos Reinvestidos / Mês",
    defaultMonthlyValue: 75,
    minMonthlyValue: 20,
    maxMonthlyValue: 800,
    stepValue: 25,
    defaultHorizonYears: 12,
    annualRate: 0.09,
    chartType: "area",
    chartTitle: "Impacto do Reinvestimento de Dividendos ao Longo do Tempo",
    actionSteps: [
      "Prefere instrumentos de acumulação (Acc) para evitar tributação antecipada sobre dividendos.",
      "Se receberes dividendos em dinheiro, reintegra-os imediatamente no próximo lote de compras."
    ],
    recommendedTab: "/dashboard/investimentos",
    recommendedTabLabel: "Ver Ativos de Renda",
    publishedAt: "Ontem",
    readTime: "2 min"
  },
  {
    id: "notif_014",
    title: "A Regra dos 72: Em Quantos Anos o Teu Dinheiro Dobra?",
    category: "investimentos",
    categoryLabel: "Investimentos & Juros Compostos",
    badgeColor: "indigo",
    iconType: "sparkles",
    summary: "Divide 72 pela tua taxa de retorno anual para descobrir o tempo exato necessário para duplicar o capital.",
    fullDescription: "Com um retorno médio de 8% ao ano, o teu capital dobra a cada 9 anos (72 / 8 = 9). Com 10% ao ano, dobra em apenas 7.2 anos. Compreender esta matemática simples demonstra porque pequenas diferenças de taxa têm um impacto monumental a longo prazo.",
    metricLabel: "Aporte para Duplicação / Mês",
    defaultMonthlyValue: 300,
    minMonthlyValue: 50,
    maxMonthlyValue: 2000,
    stepValue: 50,
    defaultHorizonYears: 18,
    annualRate: 0.08,
    chartType: "line",
    chartTitle: "Ciclos de Duplicação Patrimonial (Regra dos 72)",
    actionSteps: [
      "Analisa a rentabilidade histórica líquida dos teus investimentos atuais.",
      "Reduz custos com taxas de corretagem e comissões ocultas que corroem a tua taxa líquida."
    ],
    recommendedTab: "/dashboard/simulacao",
    recommendedTabLabel: "Testar no Simulador",
    publishedAt: "Há 2 dias",
    readTime: "3 min"
  },
  {
    id: "notif_015",
    title: "Diversificação Inteligente: A Única 'Refeição Grátis' em Finanças",
    category: "investimentos",
    categoryLabel: "Investimentos & Juros Compostos",
    badgeColor: "indigo",
    iconType: "scale",
    summary: "Não coloques todos os ovos no mesmo cesto: diversifica entre geografias, setores e classes de ativos.",
    fullDescription: "Harry Markowitz provou que a diversificação de portfólio reduz a volatilidade total sem comprometer os retornos esperados. Uma carteira equilibrada entre ações globais, renda fixa/obrigações e reservas protege o património em qualquer ciclo económico.",
    metricLabel: "Aporte em Carteira Diversificada",
    defaultMonthlyValue: 350,
    minMonthlyValue: 100,
    maxMonthlyValue: 2500,
    stepValue: 50,
    defaultHorizonYears: 10,
    annualRate: 0.075,
    chartType: "area",
    chartTitle: "Proteção e Crescimento de uma Carteira Equilibrada",
    actionSteps: [
      "Verifica a concentração dos teus investimentos (nenhum ativo individual deve superar 15% a 20% do total).",
      "Inclui exposição internacional em mercados desenvolvidos e emergentes."
    ],
    recommendedTab: "/dashboard/investimentos",
    recommendedTabLabel: "Alocação de Ativos",
    publishedAt: "Há 3 dias",
    readTime: "3 min"
  },

  // -------------------------------------------------------------
  // 3. RESERVA DE EMERGÊNCIA & RUNWAY (41 - 60)
  // -------------------------------------------------------------
  {
    id: "notif_016",
    title: "Reserva de Emergência: O Teu Colchão de 3 a 6 Meses",
    category: "reserva",
    categoryLabel: "Reserva de Emergência & Runway",
    badgeColor: "cyan",
    iconType: "shield",
    summary: "Garante entre 3 a 6 meses de despesas fixas em contas de alta liquidez e capital garantido.",
    fullDescription: "A reserva de emergência não tem como objetivo o lucro máximo, mas sim a paz de espírito e a proteção contra a venda forçada de investimentos em momentos de crise (perda de emprego, problemas de saúde, reparações urgentes).",
    metricLabel: "Aporte para Reserva / Mês",
    defaultMonthlyValue: 200,
    minMonthlyValue: 50,
    maxMonthlyValue: 1000,
    stepValue: 25,
    defaultHorizonYears: 3,
    annualRate: 0.035,
    chartType: "bar",
    chartTitle: "Construção do Fundo de Emergência de 6 Meses",
    actionSteps: [
      "Calcula o teu custo de vida essencial mensal na aba de Relatórios.",
      "Multiplica esse valor por 3 (para assalariados) ou 6 a 12 (para freelancers/empresários).",
      "Mantém o montante numa conta com liquidez diária remunerada ou certificados de aforro."
    ],
    recommendedTab: "/dashboard/relatorios",
    recommendedTabLabel: "Ver Despesas em Relatórios",
    publishedAt: "Hoje",
    readTime: "2 min"
  },
  {
    id: "notif_017",
    title: "Cálculo de Runway Financeiro (Autonomia Sem Rendimentos)",
    category: "reserva",
    categoryLabel: "Reserva de Emergência & Runway",
    badgeColor: "cyan",
    iconType: "piggy",
    summary: "Descobre quantos meses a tua família consegue sobreviver confortavelmente com o capital acumulado atual.",
    fullDescription: "O Runway é a métrica definitiva de liberdade. Dividir o teu património líquido total de liquidez pelo teu custo de vida mensal diz-te exatamente quantos meses de liberdade total compraste com o teu esforço financeiro.",
    metricLabel: "Reforço de Runway / Mês",
    defaultMonthlyValue: 150,
    minMonthlyValue: 50,
    maxMonthlyValue: 1000,
    stepValue: 25,
    defaultHorizonYears: 5,
    annualRate: 0.04,
    chartType: "area",
    chartTitle: "Evolução dos Meses de Runway Acumulados",
    actionSteps: [
      "Acompanha o índice de Runway regularmente no Dashboard.",
      "Foca-te em atingir pelo menos 12 meses de Runway total como primeiro grande marco."
    ],
    recommendedTab: "/dashboard",
    recommendedTabLabel: "Ver Indicador no Dashboard",
    publishedAt: "Ontem",
    readTime: "2 min"
  },
  {
    id: "notif_018",
    title: "Fundo de Oportunidade vs Reserva de Emergência",
    category: "reserva",
    categoryLabel: "Reserva de Emergência & Runway",
    badgeColor: "cyan",
    iconType: "wallet",
    summary: "Tem liquidez pronta para aproveitar grandes desvalorizações de mercado e oportunidades únicas.",
    fullDescription: "Enquanto a reserva de emergência protege contra imprevistos negativos, o fundo de oportunidade permite comprar ativos de alta qualidade com desconto substancial em momentos de pânico no mercado.",
    metricLabel: "Fundo de Oportunidade / Mês",
    defaultMonthlyValue: 100,
    minMonthlyValue: 25,
    maxMonthlyValue: 800,
    stepValue: 25,
    defaultHorizonYears: 6,
    annualRate: 0.05,
    chartType: "bar",
    chartTitle: "Capital Disponível para Aproveitar Crises",
    actionSteps: [
      "Separa claramente o capital intocável de emergência do capital de oportunidade.",
      "Define antecipadamente quais os ativos que pretendes reforçar em quedas de mais de 15%."
    ],
    recommendedTab: "/dashboard/investimentos",
    recommendedTabLabel: "Definir Estratégia",
    publishedAt: "Há 3 dias",
    readTime: "3 min"
  },

  // -------------------------------------------------------------
  // 4. LIBERDADE FINANCEIRA & RENDIMENTO PASSIVO (61 - 80)
  // -------------------------------------------------------------
  {
    id: "notif_019",
    title: "A Regra dos 4% (Movimento FIRE)",
    category: "liberdade",
    categoryLabel: "Liberdade Financeira & Renda Passiva",
    badgeColor: "amber",
    iconType: "flame",
    summary: "Multiplica os teus gastos anuais por 25 para descobrires o teu Número de Independência Financeira.",
    fullDescription: "Baseada no Trinity Study, a Regra dos 4% estabelece que podes retirar 4% do teu portfólio de investimentos todos os anos (ajustado à inflação) com probabilidade estatística superior a 95% de o teu dinheiro nunca acabar em 30 anos.",
    metricLabel: "Aporte para Meta FIRE / Mês",
    defaultMonthlyValue: 400,
    minMonthlyValue: 100,
    maxMonthlyValue: 3000,
    stepValue: 50,
    defaultHorizonYears: 20,
    annualRate: 0.08,
    chartType: "area",
    chartTitle: "Jornada Rumo ao Teu Número FIRE (Regra dos 4%)",
    actionSteps: [
      "Calcula as tuas despesas anuais totais (ex: 20.000 €/ano x 25 = 500.000 €).",
      "Maximiza a tua taxa de poupança para encurtar a jornada em vários anos.",
      "Acompanha a tua evolução na aba de Previsão."
    ],
    recommendedTab: "/dashboard/previsao",
    recommendedTabLabel: "Projetar em Previsão",
    publishedAt: "Hoje",
    readTime: "4 min"
  },
  {
    id: "notif_020",
    title: "A Taxa de Poupança como Fator Decisivo para a Liberdade",
    category: "liberdade",
    categoryLabel: "Liberdade Financeira & Renda Passiva",
    badgeColor: "amber",
    iconType: "sparkles",
    summary: "Poupar 50% do teu salário permite alcançar a independência financeira em menos de 17 anos.",
    fullDescription: "Mais do que o retorno dos investimentos, a tua taxa de poupança (Savings Rate) é a variável mais poderosa no início da tua jornada. Cada percentagem adicional poupada reduz os teus anos de dependência de um emprego ativo.",
    metricLabel: "Aumento de Poupança Mensal",
    defaultMonthlyValue: 250,
    minMonthlyValue: 50,
    maxMonthlyValue: 1500,
    stepValue: 50,
    defaultHorizonYears: 15,
    annualRate: 0.08,
    chartType: "area",
    chartTitle: "Anos Economizados para a Independência Financeira",
    actionSteps: [
      "Mede a tua taxa de poupança mensal atual no Dashboard.",
      "Define a meta de aumentar 1% da tua taxa de poupança a cada trimestre.",
      "Converte cada poupança em ativos produtivos."
    ],
    recommendedTab: "/dashboard",
    recommendedTabLabel: "Ver Métricas no Dashboard",
    publishedAt: "Ontem",
    readTime: "3 min"
  },
  {
    id: "notif_021",
    title: "Construção de Fontes de Rendimento Passivo Diversificadas",
    category: "liberdade",
    categoryLabel: "Liberdade Financeira & Renda Passiva",
    badgeColor: "amber",
    iconType: "coins",
    summary: "Cria fluxos de receita independentes do teu tempo: dividendos, juros, rendas e direitos autorais.",
    fullDescription: "O verdadeiro segredo da tranquilidade financeira é não depender de uma única fonte de receita. Ter múltiplos rios de capital a fluir para o teu orçamento mensal desassocia o teu sustento das horas trabalhadas.",
    metricLabel: "Aporte para Renda Passiva",
    defaultMonthlyValue: 300,
    minMonthlyValue: 50,
    maxMonthlyValue: 2000,
    stepValue: 50,
    defaultHorizonYears: 12,
    annualRate: 0.075,
    chartType: "area",
    chartTitle: "Crescimento da Renda Passiva Mensal Estimada",
    actionSteps: [
      "Estipula a meta de cobrir a primeira conta fixa (ex: internet) com dividendos.",
      "Avança progressivamente até cobrir alimentação, energia e habitação."
    ],
    recommendedTab: "/dashboard/investimentos",
    recommendedTabLabel: "Criar Metas de Renda",
    publishedAt: "Há 2 dias",
    readTime: "3 min"
  },

  // -------------------------------------------------------------
  // 5. GESTÃO & ELIMINAÇÃO DE DÍVIDAS (81 - 95)
  // -------------------------------------------------------------
  {
    id: "notif_022",
    title: "Método Bola de Neve vs Avalanche na Amortização de Dívidas",
    category: "dividas",
    categoryLabel: "Gestão & Eliminação de Dívidas",
    badgeColor: "rose",
    iconType: "flame",
    summary: "O método Avalanche poupa mais juros; o método Bola de Neve traz vitórias psicológicas mais rápidas.",
    fullDescription: "No método Avalanche, ordenas as dívidas pela taxa de juro mais alta (TAEG) e amortizas agressivamente a mais cara. No método Bola de Neve, eliminas primeiro o menor saldo para ganhar confiança. Ambos aceleram a tua libertação de juros bancários.",
    metricLabel: "Aporte Extra de Amortização",
    defaultMonthlyValue: 150,
    minMonthlyValue: 50,
    maxMonthlyValue: 1000,
    stepValue: 25,
    defaultHorizonYears: 5,
    annualRate: 0.12, // taxa de juro poupada
    chartType: "bar",
    chartTitle: "Juros Poupados com Amortização Antecipada",
    actionSteps: [
      "Lista todas as dívidas com os respetivos saldos em dívida e taxas de juro.",
      "Destina todo o fluxo de caixa extra para a dívida prioritária.",
      "Mantém o pagamento mínimo nas restantes até liquidar a primeira."
    ],
    recommendedTab: "/dashboard/gestao",
    recommendedTabLabel: "Mapear Dívidas em Gestão",
    publishedAt: "Hoje",
    readTime: "3 min"
  },
  {
    id: "notif_023",
    title: "Renegociação de Crédito Habitação e Spread",
    category: "dividas",
    categoryLabel: "Gestão & Eliminação de Dívidas",
    badgeColor: "rose",
    iconType: "scale",
    summary: "Reduzir o spread ou transferir o crédito habitação pode poupar dezenas de milhares de euros no prazo total.",
    fullDescription: "Uma redução de apenas 0.3% a 0.5% na taxa de juro do crédito habitação ou a negociação de seguros de vida fora do banco representa uma poupança mensal de 60 € a 180 € que podes investir no teu futuro.",
    metricLabel: "Poupança na Prestação / Mês",
    defaultMonthlyValue: 80,
    minMonthlyValue: 20,
    maxMonthlyValue: 400,
    stepValue: 10,
    defaultHorizonYears: 15,
    annualRate: 0.08,
    chartType: "area",
    chartTitle: "Património Gerado pela Transferência da Poupança de Crédito",
    actionSteps: [
      "Solicita propostas de transferência de crédito habitação a intermediários de crédito registados.",
      "Verifica o custo das apólices de seguro associadas.",
      "Canaliza o valor poupado na prestação para um ETF global."
    ],
    recommendedTab: "/dashboard/orcamentos",
    recommendedTabLabel: "Ajustar Teto de Habitação",
    publishedAt: "Há 3 dias",
    readTime: "3 min"
  },

  // -------------------------------------------------------------
  // 6. PSICOLOGIA FINANCEIRA & HÁBITOS (96 - 105+)
  // -------------------------------------------------------------
  {
    id: "notif_024",
    title: "O Viés do Presente e a Gratificação Adiada",
    category: "habitos",
    categoryLabel: "Psicologia & Hábitos Financeiros",
    badgeColor: "violet",
    iconType: "sparkles",
    summary: "O cérebro humano valoriza desproporcionalmente o prazer imediato face aos benefícios a longo prazo.",
    fullDescription: "Superar o 'Present Bias' é o maior determinante de sucesso financeiro. Ao automatizares investimentos e definires metas visuais com progresso claro, tornas o futuro tangível e proteges-te contra impulsos de curto prazo.",
    metricLabel: "Aporte Automatizado / Mês",
    defaultMonthlyValue: 180,
    minMonthlyValue: 40,
    maxMonthlyValue: 1200,
    stepValue: 20,
    defaultHorizonYears: 10,
    annualRate: 0.08,
    chartType: "area",
    chartTitle: "Poder da Gratificação Adiada ao Longo de 10 Anos",
    actionSteps: [
      "Automatiza todos os teus investimentos no dia seguinte ao recebimento do salário.",
      "Visualiza o teu progresso na aba de Metas para reforçar o sentimento de conquista."
    ],
    recommendedTab: "/dashboard/investimentos",
    recommendedTabLabel: "Definir Metas em Investir",
    publishedAt: "Ontem",
    readTime: "2 min"
  },
  {
    id: "notif_025",
    title: "Cálculo do 'Custo Real em Horas de Trabalho'",
    category: "habitos",
    categoryLabel: "Psicologia & Hábitos Financeiros",
    badgeColor: "violet",
    iconType: "wallet",
    summary: "Antes de comprar um objeto de 100 €, calcula quantas horas líquidas precisas de trabalhar para pagá-lo.",
    fullDescription: "Dividir o preço de um produto pelo teu salário líquido por hora transforma números abstratos em tempo de vida real. Perguntar a ti próprio 'Isto vale 8 horas do meu esforço no trabalho?' elimina instantaneamente compras supérfluas.",
    metricLabel: "Gastos Evitados / Mês",
    defaultMonthlyValue: 90,
    minMonthlyValue: 20,
    maxMonthlyValue: 500,
    stepValue: 10,
    defaultHorizonYears: 10,
    annualRate: 0.075,
    chartType: "area",
    chartTitle: "Tempo de Vida Poupado e Convertido em Riqueza",
    actionSteps: [
      "Calcula o teu valor líquido por hora (Salário Líquido Mensal / Horas Trabalhadas).",
      "Usa essa métrica como filtro mental antes de qualquer compra de valor considerável."
    ],
    recommendedTab: "/dashboard/gestao",
    recommendedTabLabel: "Auditar Gastos",
    publishedAt: "Há 4 dias",
    readTime: "2 min"
  }
];

// Gerar automaticamente as notificações complementares até perfazer 105 dicas estruturadas
const CATEGORIES_CONFIG = [
  {
    cat: "poupanca" as const,
    label: "Poupança & Orçamentos",
    badge: "emerald",
    icon: "target" as const,
    rate: 0.075,
    tab: "/dashboard/orcamentos" as const,
    tabLabel: "Ajustar Orçamentos",
    titles: [
      "Estratégia de Compras em Segunda Mão para Eletrónicos e Mobiliário",
      "Troca Inteligente de Marcas Brancas em Produtos de Limpeza e Despensa",
      "Otimização do Consumo Energético com Tomadas Inteligentes",
      "Planeamento Fiscal: Maximização de Deduções de Despesas de IRS",
      "Gestão de Contas Bancárias Sem Comissões de Manutenção",
      "A Regra dos 10 Segundos para Itens Pequenos no Supermercado",
      "Negociação Anual de Seguros Automóvel e Multirriscos",
      "Substituição de Lâmpadas Tradicionais por LED de Alta Eficiência",
      "Planeamento de Férias e Viagens com 6 Meses de Antecedência",
      "Revisão e Venda de Artigos Não Utilizados em Plataformas Online",
      "Auditoria de Tarifas Bancárias Ocultas e Comissões de Transferência",
      "Estratégia de Cashbacks em Cartões de Débito e Compras Selecionadas",
      "Menu Semanal 'Zero Desperdício' com Reaproveitamento Criativo",
      "Manutenção Preventiva Automóvel para Evitar Reparações Graves",
      "Orçamento para Lazer e Entretenimento com Limite em Dinheiro Físico",
      "Desafio do Mês Sem Compras Supérfluas (No-Spend Month)"
    ]
  },
  {
    cat: "investimentos" as const,
    label: "Investimentos & Juros Compostos",
    badge: "indigo",
    icon: "trending_up" as const,
    rate: 0.085,
    tab: "/dashboard/investimentos" as const,
    tabLabel: "Gerir Investimentos",
    titles: [
      "ETFs de Acumulação vs Distribuição: Vantagens Fiscais em Portugal",
      "Rebalanceamento Periódico de Carteira (Semestral ou Anual)",
      "Fundos de Índice Global MSCI World vs All-World: Qual Escolher?",
      "O Custo Invisível do 'Cash Drag' em Períodos de Inflação",
      "Estratégia Core-Satellite para Carteiras de Alto Crescimento",
      "Investimento Imobiliário Indireto através de REITs / SIGIs",
      "Como Interpretar o TER (Total Expense Ratio) dos Fundos",
      "A Armadilha do 'Home Bias': Porque Deves Evitar Investir Só no Teu País",
      "Investimento em Valor vs Investimento em Crescimento (Value vs Growth)",
      "PPRs (Planos Poupança Reforma): Benefícios Fiscais à Entrada e Saída",
      "O Efeito da Inflação Real no Poder de Compra a 20 Anos",
      "Alocação de Ativos por Idade: A Regra dos 110 Menos a Idade",
      "O Perigo de Perseguir Rentabilidades Passadas Recentes",
      "Certificados de Aforro como Instrumento de Capital Garantido",
      "Gestão Ativa vs Gestão Passiva: O que Dizem as Evidências Empíricas",
      "Como Proteger a Carteira contra Riscos Cambiais (EUR vs USD)"
    ]
  },
  {
    cat: "reserva" as const,
    label: "Reserva de Emergência & Runway",
    badge: "cyan",
    icon: "shield" as const,
    rate: 0.035,
    tab: "/dashboard/previsao" as const,
    tabLabel: "Projetar Runway",
    titles: [
      "Onde Guardar a Reserva de Emergência: Liquidez vs Segurança",
      "Como Ajustar a Reserva de Emergência após Mudança de Emprego",
      "Reserva de Emergência para Casais com Contas Conjuntas",
      "Proteção de Capital contra Desvalorização Inflacionária",
      "Distinção entre Vontade Urgente e Emergência Financeira Real",
      "Seguros Essenciais que Protegem o Teu Fundo de Emergência",
      "Como Recompor a Reserva Rapidamente após uma Utilização",
      "O Papel dos Certificados de Aforro como Colchão de Liquidez",
      "Reserva para Despesas Médicas e Saúde Preventiva",
      "Plano de Continuidade Financeira Familiar em Caso de Invalidez",
      "Como Evitar a Tentação de Investir a Reserva de Emergência em Risco",
      "Escalonamento de Prazos em Depósitos a Prazo (CD Laddering)",
      "Dimensionamento da Reserva de Emergência para Pequenos Negócios",
      "Impacto Psicológico de ter 6 Meses de Despesas Cobertas",
      "Reserva de Manutenção de Imóveis: A Regra do 1% ao Ano",
      "Auditoria Anual do Volume da Reserva Face ao Custo de Vida Atual"
    ]
  },
  {
    cat: "liberdade" as const,
    label: "Liberdade Financeira & Renda Passiva",
    badge: "amber",
    icon: "flame" as const,
    rate: 0.08,
    tab: "/dashboard/simulacao" as const,
    tabLabel: "Simular Cenários",
    titles: [
      "Lean FIRE vs Fat FIRE: Qual o Teu Estilo de Independência Financeira?",
      "Coast FIRE: Atingir o Ponto em que Não Precisas de Poupar Mais",
      "Barista FIRE: Combinar Trabalho em Part-Time com Renda de Investimentos",
      "Estratégia de Desinvestimento Seguro (Safe Withdrawal Rate)",
      "Como Calcular a Tua Idade de Aposentadoria Antecipada",
      "O Conceito de 'F-You Money' e a Liberdade de Escolha Profissional",
      "Micro-Ativos Digitais: Criação de Rendas Passivas com Conhecimento",
      "A Importância da Eficiência Tributária no Estágio de Usufruto",
      "Transição de Ativos de Crescimento para Ativos Geradores de Renda",
      "O Papel dos Dividendos Crescentes na Proteção contra a Inflação",
      "Simulação de Cenários de Crise durante a Fase de Aposentadoria",
      "A Regra dos 25x nos Gastos Básicos vs Gastos Totais",
      "Mindset FIRE: Viver com Abundância Focando no que Realmente Importa",
      "Como Planejar a Desacumulação de Património Sem Ansiedade",
      "Renda Passiva Imobiliária com Gestão Terceirizada",
      "A Verdadeira Definição de Riqueza: Tempo Livre e Autonomia"
    ]
  },
  {
    cat: "dividas" as const,
    label: "Gestão & Eliminação de Dívidas",
    badge: "rose",
    icon: "scale" as const,
    rate: 0.11,
    tab: "/dashboard/gestao" as const,
    tabLabel: "Eliminar Dívidas",
    titles: [
      "O Perigo do Pagamento Mínimo do Cartão de Crédito (Efeito Bola de Neve Inverso)",
      "Consolidação de Créditos Pessoais para Redução da Taxa Média",
      "Como Negociar Redução de Juros Diretamente com Credores",
      "Dívida Boa vs Dívida Má: Critérios para Alavancagem Responsável",
      "Amortização Extraordinária no Crédito Habitação: Vale a Pena?",
      "Cálculo do Custo Total Efetivo Global (TAEG) dos Teus Empréstimos",
      "Estratégia para Evitar Novas Dívidas durante a Fase de Quitação",
      "Priorização de Amortização: Cartões > Crédito Pessoal > Crédito Automóvel",
      "Como Utilizar o Cartão de Crédito a 100% Sem Pagar 1 Cêntimo de Juros",
      "A Relação entre Taxa de Esforço Bancária e Concessão de Crédito",
      "Impacto da Subida de Taxas Euribor e Estratégias de Taxa Fixa vs Mista",
      "Criação de um Plano de Contingência para Pagamento de Dívidas",
      "Psicologia do Alívio Financeiro após a Liquidação da Primeira Dívida",
      "Como Proteger o Score Bancário no Banco de Portugal (CRC)",
      "Eliminação do Crédito Automóvel: O Impacto da Depreciação do Veículo",
      "A Regra de Ouro: Nunca Financiar Bens de Consumo Depreciáveis"
    ]
  }
];

let counter = 26;
CATEGORIES_CONFIG.forEach(cfg => {
  cfg.titles.forEach((title, idx) => {
    const id = `notif_${String(counter).padStart(3, "0")}`;
    const monthlyVal = 50 + (idx % 6) * 35;
    const horizon = 5 + (idx % 4) * 3;

    NOTIFICATIONS_CATALOG.push({
      id,
      title,
      category: cfg.cat,
      categoryLabel: cfg.label,
      badgeColor: cfg.badge,
      iconType: cfg.icon,
      summary: `Aplica esta estratégia prática de ${cfg.label.toLowerCase()} para otimizar os teus resultados em cerca de ${monthlyVal} €/mês.`,
      fullDescription: `Esta notificação estratégica detalha as melhores práticas de ${cfg.label.toLowerCase()}. Implementar ${title.toLowerCase()} permite alinhar as tuas decisões quotidianas com princípios sólidos de finanças pessoais, maximizando o retorno acumulado e minimizando custos desnecessários.`,
      metricLabel: cfg.cat === "dividas" ? "Juros Poupados / Mês" : "Impacto Mensal Estimado",
      defaultMonthlyValue: monthlyVal,
      minMonthlyValue: 20,
      maxMonthlyValue: 1500,
      stepValue: 20,
      defaultHorizonYears: horizon,
      annualRate: cfg.rate,
      chartType: idx % 2 === 0 ? "area" : "bar",
      chartTitle: `Projeção Comparativa: ${title}`,
      actionSteps: [
        `Analisa o teu histórico recente na aba de ${cfg.tabLabel}.`,
        "Estipula uma meta mensal clara e programa a execução automática.",
        "Monitoriza o progresso no final de cada mês e ajusta conforme necessário."
      ],
      recommendedTab: cfg.tab,
      recommendedTabLabel: cfg.tabLabel,
      publishedAt: `Há ${idx + 1} dias`,
      readTime: "2 min"
    });
    counter++;
  });
});

export const TOTAL_NOTIFICATIONS_COUNT = NOTIFICATIONS_CATALOG.length;
