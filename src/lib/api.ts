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
  const mock = new MockAdapter(api, { delayResponse: 500 }); // simulate network delay

  const DB_KEY = 'finance_mock_db';
  const TTL = 10 * 60 * 1000; // 10 minutes

  const defaultData = {
    timestamp: Date.now(),
    categories: [
      { id: 1, name: "Salário", color: "#10b981", budget: 0, is_income: true },
      { id: 2, name: "Casa", color: "#ef4444", budget: 800, is_income: false },
      { id: 3, name: "Alimentação", color: "#f59e0b", budget: 400, is_income: false },
      { id: 4, name: "Lazer", color: "#6366f1", budget: 200, is_income: false },
    ],
    transactions: [
      { id: 1, amount: 3000, description: "Salário Mensal", type: "income", date: new Date().toISOString(), category_id: 1 },
      { id: 2, amount: 800, description: "Renda", type: "expense", date: new Date().toISOString(), category_id: 2 },
      { id: 3, amount: 150, description: "Supermercado", type: "expense", date: new Date().toISOString(), category_id: 3 },
      { id: 4, amount: 50, description: "Jantar", type: "expense", date: new Date().toISOString(), category_id: 4 },
      // March Data for testing filters
      { id: 5, amount: 3000, description: "Salário Mensal", type: "income", date: new Date(new Date().getFullYear(), 2, 10).toISOString(), category_id: 1 },
      { id: 6, amount: 800, description: "Renda", type: "expense", date: new Date(new Date().getFullYear(), 2, 5).toISOString(), category_id: 2 },
      { id: 7, amount: 300, description: "Compras Mês", type: "expense", date: new Date(new Date().getFullYear(), 2, 15).toISOString(), category_id: 3 },
    ],
    investments: [
      { id: 1, name: "S&P 500", type: "Ações", current_value: 5000, invested_amount: 4500, return_rate: 11.11, date: new Date().toISOString() }
    ]
  };

  const getDB = () => {
    const dataStr = localStorage.getItem(DB_KEY);
    if (!dataStr) return defaultData;
    try {
      const data = JSON.parse(dataStr);
      if (Date.now() - data.timestamp > TTL) {
        return defaultData; // Reset if expired
      }
      return data;
    } catch (e) {
      return defaultData;
    }
  };

  const saveDB = (data: any) => {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  };

  // Initialize DB if needed
  saveDB(getDB());

  let currentId = 100; // Start new IDs from 100

  // Auth Mocks
  mock.onPost('/register').reply(200, { message: "User registered" });
  mock.onPost('/token').reply(200, { access_token: "demo-token" });

  // Summary Mock
  mock.onGet(/\/summary.*/).reply((config) => {
    const db = getDB();
    const url = new URL(config.url!, API_URL);
    const filterYear = url.searchParams.get('year');
    const filterMonth = url.searchParams.get('month');

    let income = 0;
    let expense = 0;
    let investments = 0;
    
    // Filter transactions if needed
    let txs = db.transactions;
    if (filterYear && filterYear !== "Todos") {
      txs = txs.filter((t: any) => new Date(t.date).getFullYear().toString() === filterYear);
    }
    if (filterMonth && filterMonth !== "Todos") {
      txs = txs.filter((t: any) => (new Date(t.date).getMonth() + 1).toString() === filterMonth);
    }

    txs.forEach((t: any) => {
      if (t.type.toLowerCase() === 'income') income += t.amount;
      else expense += t.amount;
    });

    db.investments.forEach((i: any) => investments += i.current_value);

    // Generate some dummy chart data for visuals
    let chartData = [];
    if (filterMonth) {
      // Daily data mock
      chartData = [
        { name: '01', receitas: income * 0.1, despesas: expense * 0.05 },
        { name: '10', receitas: income * 0.4, despesas: expense * 0.3 },
        { name: '20', receitas: income * 0.2, despesas: expense * 0.4 },
        { name: '30', receitas: income * 0.3, despesas: expense * 0.25 },
      ];
    } else {
      // Monthly data mock
      chartData = [
        { name: 'Jan', receitas: income * 0.05, despesas: expense * 0.08 },
        { name: 'Fev', receitas: income * 0.08, despesas: expense * 0.07 },
        { name: 'Mar', receitas: income * 0.1, despesas: expense * 0.05 },
        { name: 'Abr', receitas: income * 0.12, despesas: expense * 0.1 },
        { name: 'Mai', receitas: income * 0.09, despesas: expense * 0.11 },
        { name: 'Jun', receitas: income * 0.15, despesas: expense * 0.09 },
        { name: 'Jul', receitas: income * 0.1, despesas: expense * 0.12 },
        { name: 'Ago', receitas: income * 0.11, despesas: expense * 0.08 },
        { name: 'Set', receitas: income * 0.05, despesas: expense * 0.06 },
        { name: 'Out', receitas: income * 0.05, despesas: expense * 0.09 },
        { name: 'Nov', receitas: income * 0.05, despesas: expense * 0.05 },
        { name: 'Dez', receitas: income * 0.05, despesas: expense * 0.1 },
      ];
    }

    return [200, {
      balance: income - expense,
      income,
      expense,
      investments,
      chartData
    }];
  });

  // Categories Mocks
  mock.onGet('/categories').reply(() => [200, getDB().categories]);
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
    db.categories = db.categories.filter((c: any) => c.id !== id);
    saveDB(db);
    return [200, { message: "Deleted" }];
  });
  mock.onPut(/\/categories\/\d+/).reply((config) => {
    const id = parseInt(config.url!.split('/').pop()!);
    const data = JSON.parse(config.data);
    const db = getDB();
    const idx = db.categories.findIndex((c: any) => c.id === id);
    if (idx >= 0) {
      db.categories[idx] = { ...db.categories[idx], ...data };
      saveDB(db);
      return [200, db.categories[idx]];
    }
    return [404, {}];
  });

  // Transactions Mocks
  mock.onGet(/\/transactions.*/).reply((config) => {
    const db = getDB();
    // Parse query params if needed, for simplicity we return all
    // Or filter by month/year if they exist in query
    const url = new URL(config.url!, API_URL);
    const year = url.searchParams.get('year');
    const month = url.searchParams.get('month');
    const type = url.searchParams.get('type');
    const category_id = url.searchParams.get('category_id');
    
    let txs = db.transactions;
    
    if (year && year !== "Todos") {
      txs = txs.filter((t: any) => new Date(t.date).getFullYear().toString() === year);
    }
    if (month && month !== "Todos") {
      txs = txs.filter((t: any) => (new Date(t.date).getMonth() + 1).toString() === month);
    }
    if (type && type !== "Ambos") {
      const typeStr = type === "Receitas" ? "income" : "expense";
      txs = txs.filter((t: any) => t.type === typeStr);
    }
    if (category_id && category_id !== "Todas") {
      txs = txs.filter((t: any) => t.category_id.toString() === category_id);
    }

    return [200, txs];
  });
  mock.onPost('/transactions').reply((config) => {
    const data = JSON.parse(config.data);
    const db = getDB();
    const newTx = { ...data, id: ++currentId, date: data.date || new Date().toISOString() };
    db.transactions.push(newTx);
    saveDB(db);
    return [200, newTx];
  });
  mock.onDelete(/\/transactions\/\d+/).reply((config) => {
    const id = parseInt(config.url!.split('/').pop()!);
    const db = getDB();
    db.transactions = db.transactions.filter((t: any) => t.id !== id);
    saveDB(db);
    return [200, { message: "Deleted" }];
  });

  // Investments Mocks
  mock.onGet('/investments').reply(() => [200, getDB().investments]);
  mock.onPost('/investments').reply((config) => {
    const data = JSON.parse(config.data);
    const db = getDB();
    const newInv = { ...data, id: ++currentId };
    db.investments.push(newInv);
    saveDB(db);
    return [200, newInv];
  });
  mock.onPut(/\/investments\/\d+/).reply((config) => {
    const id = parseInt(config.url!.split('/').pop()!);
    const data = JSON.parse(config.data);
    const db = getDB();
    const idx = db.investments.findIndex((i: any) => i.id === id);
    if (idx >= 0) {
      db.investments[idx] = { ...db.investments[idx], ...data };
      saveDB(db);
      return [200, db.investments[idx]];
    }
    return [404, {}];
  });
  mock.onDelete(/\/investments\/\d+/).reply((config) => {
    const id = parseInt(config.url!.split('/').pop()!);
    const db = getDB();
    db.investments = db.investments.filter((i: any) => i.id !== id);
    saveDB(db);
    return [200, { message: "Deleted" }];
  });
}
