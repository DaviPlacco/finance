import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Setup Mock Adapter only on client side
if (typeof window !== 'undefined') {
  const mock = new MockAdapter(api, { delayResponse: 300 }); // simulate light network delay

  const DB_KEY = 'finance_mock_db_v2';
  const TTL = 24 * 60 * 60 * 1000; // 24 hours

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth(); // 0-indexed

  const defaultData = {
    timestamp: Date.now(),
    user: {
      username: "Finance",
      email: "admin@finance.app",
      profile_image: null
    },
    categories: [
      { id: 1, name: "Salário & Rendimentos", color: "#10b981", type: "income", budget_limit: null },
      { id: 2, name: "Habitação & Renda", color: "#ef4444", type: "expense", budget_limit: 850 },
      { id: 3, name: "Supermercado & Alimentação", color: "#f59e0b", type: "expense", budget_limit: 450 },
      { id: 4, name: "Lazer & Restaurantes", color: "#8b5cf6", type: "expense", budget_limit: 250 },
      { id: 5, name: "Transportes & Carro", color: "#06b6d4", type: "expense", budget_limit: 150 },
      { id: 6, name: "Investimentos & Poupança", color: "#3b82f6", type: "income", budget_limit: null },
    ],
    transactions: [
      // Current month transactions
      { id: 1, amount: 3200, description: "Salário Empresa", type: "income", date: new Date(curYear, curMonth, 2, 10, 0).toISOString(), category_id: 1 },
      { id: 2, amount: 800, description: "Renda Apartamento", type: "expense", date: new Date(curYear, curMonth, 4, 12, 0).toISOString(), category_id: 2 },
      { id: 3, amount: 185.50, description: "Supermercado Continente", type: "expense", date: new Date(curYear, curMonth, 8, 16, 30).toISOString(), category_id: 3 },
      { id: 4, amount: 65.00, description: "Jantar Amigos", type: "expense", date: new Date(curYear, curMonth, 12, 20, 15).toISOString(), category_id: 4 },
      { id: 5, amount: 75.00, description: "Combustível BP", type: "expense", date: new Date(curYear, curMonth, 15, 9, 0).toISOString(), category_id: 5 },
      // Future scheduled transaction this month
      { id: 6, amount: 45.00, description: "Ginásio Mensalidade", type: "expense", date: new Date(curYear, curMonth, 28, 8, 0).toISOString(), category_id: 4 },
      
      // Previous month transactions
      { id: 7, amount: 3200, description: "Salário Empresa", type: "income", date: new Date(curYear, curMonth - 1, 2, 10, 0).toISOString(), category_id: 1 },
      { id: 8, amount: 800, description: "Renda Apartamento", type: "expense", date: new Date(curYear, curMonth - 1, 4, 12, 0).toISOString(), category_id: 2 },
      { id: 9, amount: 390.00, description: "Compras Mês", type: "expense", date: new Date(curYear, curMonth - 1, 14, 15, 0).toISOString(), category_id: 3 },
      { id: 10, amount: 140.00, description: "Jantares e Cinema", type: "expense", date: new Date(curYear, curMonth - 1, 20, 21, 0).toISOString(), category_id: 4 },
      
      // 2 months ago
      { id: 11, amount: 3200, description: "Salário Empresa", type: "income", date: new Date(curYear, curMonth - 2, 2, 10, 0).toISOString(), category_id: 1 },
      { id: 12, amount: 800, description: "Renda Apartamento", type: "expense", date: new Date(curYear, curMonth - 2, 4, 12, 0).toISOString(), category_id: 2 },
      { id: 13, amount: 420.00, description: "Compras Mês", type: "expense", date: new Date(curYear, curMonth - 2, 12, 18, 0).toISOString(), category_id: 3 },
    ],
    investments: [
      { id: 1, name: "S&P 500 ETF (VUAA)", asset_type: "ETF", balance: 8500, target: 15000, date: new Date().toISOString() },
      { id: 2, name: "Bitcoin (BTC)", asset_type: "Cripto", balance: 3200, target: 5000, date: new Date().toISOString() },
      { id: 3, name: "Certificados de Aforro", asset_type: "Renda Fixa", balance: 5000, target: 10000, date: new Date().toISOString() },
    ],
    simulations: [
      {
        id: 1,
        name: "Cenário Otimista 2026",
        incomes_data: JSON.stringify([
          { name: "Salário Principal", amount: 3500 },
          { name: "Projetos Freelance", amount: 800 }
        ]),
        expenses_data: JSON.stringify([
          { name: "Casa & Renda", amount: 850 },
          { name: "Supermercado", amount: 400 },
          { name: "Lazer e Viagens", amount: 300 }
        ]),
        created_at: new Date().toISOString()
      }
    ]
  };

  const getDB = () => {
    const dataStr = localStorage.getItem(DB_KEY);
    if (!dataStr) return defaultData;
    try {
      const data = JSON.parse(dataStr);
      if (Date.now() - data.timestamp > TTL) {
        return defaultData;
      }
      return data;
    } catch (e) {
      return defaultData;
    }
  };

  const saveDB = (data: any) => {
    data.timestamp = Date.now();
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  };

  // Initialize DB if needed
  saveDB(getDB());

  let currentId = 500;

  // Auth Mocks
  mock.onPost('/register').reply(200, { message: "User registered" });
  mock.onPost('/token').reply(200, { access_token: "mock-jwt-token" });

  // Users Me Mocks
  mock.onGet('/users/me').reply(() => {
    const db = getDB();
    const storedUsername = localStorage.getItem('username') || db.user?.username || "Finance";
    const storedImage = localStorage.getItem('profileImage') || db.user?.profile_image || null;
    return [200, {
      username: storedUsername,
      email: db.user?.email || "admin@finance.app",
      profile_image: storedImage
    }];
  });

  mock.onPut('/users/me/profile-image').reply((config) => {
    const data = JSON.parse(config.data);
    const db = getDB();
    if (!db.user) db.user = {};
    db.user.profile_image = data.profile_image;
    saveDB(db);
    if (data.profile_image) {
      localStorage.setItem('profileImage', data.profile_image);
    }
    return [200, db.user];
  });

  // Summary Mock (matching cumulative logic)
  mock.onGet(/\/summary.*/).reply((config) => {
    const db = getDB();
    const url = new URL(config.url!, API_URL);
    const filterYear = url.searchParams.get('year');
    const filterMonth = url.searchParams.get('month');

    const yearNum = filterYear && filterYear !== "Todos" ? parseInt(filterYear) : null;
    const monthNum = filterMonth && filterMonth !== "Todos" ? parseInt(filterMonth) : null;

    const allTransactions = db.transactions || [];
    const currentDate = new Date();

    // Selected period transactions
    const selectedTransactions = allTransactions.filter((t: any) => {
      const tDate = new Date(t.date);
      if (yearNum && tDate.getFullYear() !== yearNum) return false;
      if (monthNum && (tDate.getMonth() + 1) !== monthNum) return false;
      return true;
    });

    // Effective transactions (date <= now)
    const effectiveSelected = selectedTransactions.filter((t: any) => new Date(t.date) <= currentDate);

    const totalIncome = effectiveSelected
      .filter((t: any) => t.type?.toLowerCase() === 'income')
      .reduce((acc: number, t: any) => acc + t.amount, 0);

    const totalExpense = effectiveSelected
      .filter((t: any) => t.type?.toLowerCase() === 'expense')
      .reduce((acc: number, t: any) => acc + t.amount, 0);

    const totalInvestments = (db.investments || []).reduce((acc: number, i: any) => acc + (i.balance || 0), 0);

    // Cumulative Balance Calculation
    let balanceCutoff = currentDate;
    if (yearNum && monthNum) {
      const lastDay = new Date(yearNum, monthNum, 0).getDate();
      const endOfPeriod = new Date(yearNum, monthNum - 1, lastDay, 23, 59, 59);
      balanceCutoff = endOfPeriod < currentDate ? endOfPeriod : currentDate;
    } else if (yearNum) {
      const endOfYear = new Date(yearNum, 11, 31, 23, 59, 59);
      balanceCutoff = endOfYear < currentDate ? endOfYear : currentDate;
    }

    const cumulativeIncome = allTransactions
      .filter((t: any) => t.type?.toLowerCase() === 'income' && new Date(t.date) <= balanceCutoff)
      .reduce((acc: number, t: any) => acc + t.amount, 0);

    const cumulativeExpense = allTransactions
      .filter((t: any) => t.type?.toLowerCase() === 'expense' && new Date(t.date) <= balanceCutoff)
      .reduce((acc: number, t: any) => acc + t.amount, 0);

    const cumulativeBalance = cumulativeIncome - cumulativeExpense;

    // Chart Data
    let chartData = [];
    if (yearNum && monthNum) {
      const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const dayIncome = effectiveSelected
          .filter((t: any) => new Date(t.date).getDate() === d && t.type?.toLowerCase() === 'income')
          .reduce((acc: number, t: any) => acc + t.amount, 0);
        const dayExpense = effectiveSelected
          .filter((t: any) => new Date(t.date).getDate() === d && t.type?.toLowerCase() === 'expense')
          .reduce((acc: number, t: any) => acc + t.amount, 0);

        chartData.push({
          name: d.toString(),
          receitas: dayIncome,
          despesas: dayExpense
        });
      }
    } else {
      const monthsAbbr = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      for (let m = 1; m <= 12; m++) {
        const mIncome = effectiveSelected
          .filter((t: any) => (new Date(t.date).getMonth() + 1) === m && t.type?.toLowerCase() === 'income')
          .reduce((acc: number, t: any) => acc + t.amount, 0);
        const mExpense = effectiveSelected
          .filter((t: any) => (new Date(t.date).getMonth() + 1) === m && t.type?.toLowerCase() === 'expense')
          .reduce((acc: number, t: any) => acc + t.amount, 0);

        chartData.push({
          name: monthsAbbr[m - 1],
          receitas: mIncome,
          despesas: mExpense
        });
      }
    }

    return [200, {
      balance: cumulativeBalance,
      income: totalIncome,
      expense: totalExpense,
      investments: totalInvestments,
      chartData
    }];
  });

  // Reports History Mock
  mock.onGet('/reports/history').reply(() => {
    const db = getDB();
    const txs = db.transactions || [];
    const historyMap: Record<string, { year: number; month: number; income: number; expense: number; balance: number }> = {};
    
    txs.forEach((t: any) => {
      const d = new Date(t.date);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const key = `${year}-${month.toString().padStart(2, '0')}`;
      if (!historyMap[key]) {
        historyMap[key] = { year, month, income: 0, expense: 0, balance: 0 };
      }
      if (t.type?.toLowerCase() === 'income') {
        historyMap[key].income += t.amount;
      } else {
        historyMap[key].expense += t.amount;
      }
    });

    const historyList = Object.values(historyMap).map(v => ({
      ...v,
      balance: v.income - v.expense
    }));

    historyList.sort((a, b) => (b.year !== a.year ? b.year - a.year : b.month - a.month));
    return [200, historyList];
  });

  // Categories Mocks
  mock.onGet('/categories').reply(() => [200, getDB().categories || []]);
  
  mock.onPost('/categories').reply((config) => {
    const data = JSON.parse(config.data);
    const db = getDB();
    const newCat = { ...data, id: ++currentId };
    db.categories.push(newCat);
    saveDB(db);
    return [200, newCat];
  });

  mock.onDelete(/\/categories\/\d+/).reply((config) => {
    const id = parseInt(config.url!.split('/').pop()!);
    const db = getDB();
    db.categories = (db.categories || []).filter((c: any) => c.id !== id);
    saveDB(db);
    return [200, { message: "Deleted" }];
  });

  mock.onPut(/\/categories\/\d+/).reply((config) => {
    const id = parseInt(config.url!.split('/').pop()!);
    const data = JSON.parse(config.data);
    const db = getDB();
    const idx = (db.categories || []).findIndex((c: any) => c.id === id);
    if (idx >= 0) {
      db.categories[idx] = { ...db.categories[idx], ...data };
      saveDB(db);
      return [200, db.categories[idx]];
    }
    return [404, { message: "Not found" }];
  });

  // Transactions Mocks
  mock.onGet(/\/transactions.*/).reply((config) => {
    const db = getDB();
    const url = new URL(config.url!, API_URL);
    const year = url.searchParams.get('year');
    const month = url.searchParams.get('month');
    const type = url.searchParams.get('type');
    const category_id = url.searchParams.get('category_id');
    
    let txs = db.transactions || [];
    
    if (year && year !== "Todos") {
      txs = txs.filter((t: any) => new Date(t.date).getFullYear().toString() === year);
    }
    if (month && month !== "Todos") {
      txs = txs.filter((t: any) => (new Date(t.date).getMonth() + 1).toString() === month);
    }
    if (type && type !== "Ambos") {
      const typeStr = type === "Receitas" || type === "income" ? "income" : "expense";
      txs = txs.filter((t: any) => t.type?.toLowerCase() === typeStr);
    }
    if (category_id && category_id !== "Todas") {
      txs = txs.filter((t: any) => t.category_id?.toString() === category_id);
    }

    return [200, txs];
  });

  mock.onPost('/transactions').reply((config) => {
    const data = JSON.parse(config.data);
    const db = getDB();
    const newTx = { ...data, id: ++currentId, date: data.date || new Date().toISOString() };
    if (!db.transactions) db.transactions = [];
    db.transactions.unshift(newTx);
    saveDB(db);
    return [200, newTx];
  });

  mock.onDelete(/\/transactions\/\d+/).reply((config) => {
    const id = parseInt(config.url!.split('/').pop()!);
    const db = getDB();
    db.transactions = (db.transactions || []).filter((t: any) => t.id !== id);
    saveDB(db);
    return [200, { message: "Deleted" }];
  });

  // Investments History Mock
  mock.onGet(/\/investments\/history.*/).reply((config) => {
    const db = getDB();
    const url = new URL(config.url!, API_URL);
    const filterYear = url.searchParams.get('year');
    const filterMonth = url.searchParams.get('month');
    const filterDay = url.searchParams.get('day');

    let totalPatrimony = (db.investments || []).reduce((acc: number, i: any) => acc + (i.balance || 0), 0);

    let chartData = [];
    if (filterDay && filterDay !== "Todos") {
      for (let i = 8; i <= 18; i += 2) {
        chartData.push({ name: `${i}:00`, valor: totalPatrimony * (0.98 + (i % 3) * 0.01) });
      }
    } else if (filterMonth && filterMonth !== "Todos") {
      chartData = [
        { name: '01', valor: totalPatrimony * 0.92 },
        { name: '05', valor: totalPatrimony * 0.94 },
        { name: '10', valor: totalPatrimony * 0.95 },
        { name: '15', valor: totalPatrimony * 0.97 },
        { name: '20', valor: totalPatrimony * 0.98 },
        { name: '25', valor: totalPatrimony * 0.99 },
        { name: '30', valor: totalPatrimony * 1.00 },
      ];
    } else {
      chartData = [
        { name: 'Jan', valor: totalPatrimony * 0.72 },
        { name: 'Fev', valor: totalPatrimony * 0.76 },
        { name: 'Mar', valor: totalPatrimony * 0.80 },
        { name: 'Abr', valor: totalPatrimony * 0.83 },
        { name: 'Mai', valor: totalPatrimony * 0.86 },
        { name: 'Jun', valor: totalPatrimony * 0.89 },
        { name: 'Jul', valor: totalPatrimony * 0.91 },
        { name: 'Ago', valor: totalPatrimony * 0.93 },
        { name: 'Set', valor: totalPatrimony * 0.95 },
        { name: 'Out', valor: totalPatrimony * 0.97 },
        { name: 'Nov', valor: totalPatrimony * 0.99 },
        { name: 'Dez', valor: totalPatrimony * 1.00 },
      ];
    }

    return [200, chartData];
  });

  // Investments Mocks
  mock.onGet('/investments').reply(() => [200, getDB().investments || []]);

  mock.onPost('/investments').reply((config) => {
    const data = JSON.parse(config.data);
    const db = getDB();
    const newInv = { ...data, id: ++currentId };
    if (!db.investments) db.investments = [];
    db.investments.push(newInv);
    saveDB(db);
    return [200, newInv];
  });

  mock.onPut(/\/investments\/\d+/).reply((config) => {
    const id = parseInt(config.url!.split('/').pop()!);
    const data = JSON.parse(config.data);
    const db = getDB();
    const idx = (db.investments || []).findIndex((i: any) => i.id === id);
    if (idx >= 0) {
      db.investments[idx] = { ...db.investments[idx], ...data };
      saveDB(db);
      return [200, db.investments[idx]];
    }
    return [404, { message: "Not found" }];
  });

  mock.onDelete(/\/investments\/\d+/).reply((config) => {
    const id = parseInt(config.url!.split('/').pop()!);
    const db = getDB();
    db.investments = (db.investments || []).filter((i: any) => i.id !== id);
    saveDB(db);
    return [200, { message: "Deleted" }];
  });

  // Simulations Mocks
  mock.onGet('/simulations').reply(() => [200, getDB().simulations || []]);

  mock.onPost('/simulations').reply((config) => {
    const data = JSON.parse(config.data);
    const db = getDB();
    if (!db.simulations) db.simulations = [];
    const newSim = {
      ...data,
      id: ++currentId,
      created_at: new Date().toISOString()
    };
    db.simulations.unshift(newSim);
    saveDB(db);
    return [200, newSim];
  });

  mock.onDelete(/\/simulations\/\d+/).reply((config) => {
    const id = parseInt(config.url!.split('/').pop()!);
    const db = getDB();
    db.simulations = (db.simulations || []).filter((s: any) => s.id !== id);
    saveDB(db);
    return [200, { message: "Deleted" }];
  });
}
