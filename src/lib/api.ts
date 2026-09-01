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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("username");
        localStorage.removeItem("token");
        localStorage.removeItem("pl_advisor_last_index");
        window.dispatchEvent(new Event("auth-logout"));
        if (!window.location.pathname.startsWith("/login") && window.location.pathname !== "/") {
          window.location.href = "/";
        }
      }
    }
    return Promise.reject(error);
  }
);

// Setup Mock Adapter only on client side for GitHub Pages Static Demo
if (typeof window !== 'undefined') {
  const mock = new MockAdapter(api, { delayResponse: 100 });

  const DB_KEY = 'davi_finance_standalone_db_v4';

  const now = new Date();
  const curY = now.getFullYear();
  const curM = String(now.getMonth() + 1).padStart(2, '0');

  const defaultData = {
    timestamp: Date.now(),
    user: {
      id: 1,
      username: "Davi Placco",
      name: "Davi Placco",
      profile_image: null,
    },
    categoryGroups: [
      { id: 1, name: "Custos Fixos", color: "#6366f1", icon: "🏠", type: "expense", category_ids: [2, 5] },
      { id: 2, name: "Alimentação & Dia a Dia", color: "#f59e0b", icon: "🍕", type: "expense", category_ids: [3] },
      { id: 3, name: "Estilo de Vida & Lazer", color: "#ec4899", icon: "🎉", type: "expense", category_ids: [4] }
    ],
    categories: [
      { id: 1, name: "Salário & Rendimentos", color: "#10b981", icon: "💰", type: "income", budget_limit: null, group_id: null },
      { id: 2, name: "Habitação & Renda", color: "#ef4444", icon: "🏠", type: "expense", budget_limit: 850, group_id: 1 },
      { id: 3, name: "Supermercado & Alimentação", color: "#f59e0b", icon: "🛒", type: "expense", budget_limit: 450, group_id: 2 },
      { id: 4, name: "Lazer & Restaurantes", color: "#8b5cf6", icon: "🍔", type: "expense", budget_limit: 250, group_id: 3 },
      { id: 5, name: "Transportes & Carro", color: "#06b6d4", icon: "🚗", type: "expense", budget_limit: 150, group_id: 1 },
      { id: 6, name: "Investimentos & Poupança", color: "#3b82f6", icon: "📈", type: "expense", budget_limit: 500, group_id: null }
    ],
    transactions: [
      { id: 1, amount: 3200, description: "Salário Empresa", type: "income", date: `${curY}-${curM}-02`, category_id: 1, payment_method: "Transferência / MB WAY" },
      { id: 2, amount: 800, description: "Renda Apartamento", type: "expense", date: `${curY}-${curM}-04`, category_id: 2, payment_method: "Débito Direto" },
      { id: 3, amount: 185.50, description: "Supermercado Continente", type: "expense", date: `${curY}-${curM}-08`, category_id: 3, payment_method: "Cartão de Débito" },
      { id: 4, amount: 110.00, description: "Ginásio Mensalidade", type: "expense", date: `${curY}-${curM}-15`, category_id: 4, payment_method: "Cartão de Crédito" },
      { id: 5, amount: 75.00, description: "Combustível BP", type: "expense", date: `${curY}-${curM}-22`, category_id: 5, payment_method: "Cartão de Débito" },
      { id: 6, amount: 65.00, description: "Jantar Fora", type: "expense", date: `${curY}-${curM}-25`, category_id: 4, payment_method: "Cartão de Crédito" }
    ],
    investments: [
      { id: 1, name: "S&P 500 ETF (VUAA)", asset_type: "Ações", balance: 8500, target: 15000 },
      { id: 2, name: "Bitcoin (BTC)", asset_type: "Criptomoedas", balance: 3200, target: 5000 },
      { id: 3, name: "Certificados de Aforro", asset_type: "Numerário", balance: 5000, target: 10000 }
    ],
    goals: [
      { id: 1, title: "Aporte S&P 500", goal_type: "investment_deposit", target_amount: 500, month: now.getMonth() + 1, year: curY, investment_id: 1, category_id: null },
      { id: 2, title: "Teto Supermercado", goal_type: "expense_ceiling", target_amount: 450, month: now.getMonth() + 1, year: curY, investment_id: null, category_id: 3 },
      { id: 3, title: "Taxa de Poupança 30%", goal_type: "savings_rate", target_amount: 30, month: now.getMonth() + 1, year: curY, investment_id: null, category_id: null }
    ],
    simulations: []
  };

  const getDB = () => {
    try {
      const dataStr = localStorage.getItem(DB_KEY);
      if (!dataStr) {
        localStorage.setItem(DB_KEY, JSON.stringify(defaultData));
        return defaultData;
      }
      return JSON.parse(dataStr);
    } catch {
      return defaultData;
    }
  };

  const saveDB = (data: any) => {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(data));
    } catch {}
  };

  let currentId = 500;

  // Auth Mocks
  mock.onPost('/register').reply(200, { message: "User registered" });
  mock.onPost('/token').reply(200, { access_token: "demo-token-davi-finance", token_type: "bearer" });
  mock.onPost('/api/auth/login').reply(200, { success: true });
  mock.onPost('/api/auth/logout').reply(200, { success: true });

  // User Profile Mocks
  mock.onGet('/users/me').reply(() => {
    const db = getDB();
    const storedName = localStorage.getItem("username") || db.user.name;
    const storedImage = localStorage.getItem("profileImage") || db.user.profile_image;
    return [200, { ...db.user, name: storedName, profile_image: storedImage }];
  });

  mock.onPut('/users/me/profile').reply((config) => {
    const data = JSON.parse(config.data || '{}');
    const db = getDB();
    if (data.name) {
      db.user.name = data.name;
      localStorage.setItem("username", data.name);
    }
    if (data.profile_image) {
      db.user.profile_image = data.profile_image;
      localStorage.setItem("profileImage", data.profile_image);
    }
    saveDB(db);
    return [200, db.user];
  });

  mock.onPut('/users/me/profile-image').reply((config) => {
    const data = JSON.parse(config.data || '{}');
    const db = getDB();
    if (data.profile_image) {
      db.user.profile_image = data.profile_image;
      localStorage.setItem("profileImage", data.profile_image);
    }
    saveDB(db);
    return [200, db.user];
  });

  // Summary Mock — Identical response schema to backend/main.py
  mock.onGet(/\/summary.*/).reply((config) => {
    const db = getDB();
    const url = new URL(config.url!, 'http://localhost');
    const filterYear = url.searchParams.get('year') || String(curY);
    const filterMonth = url.searchParams.get('month') || String(Number(curM));

    const transactions: any[] = db.transactions || [];
    const investments: any[] = db.investments || [];

    // Filter transactions for current period
    const selectedTransactions = transactions.filter((t: any) => {
      const d = new Date(t.date);
      const y = String(d.getFullYear());
      const m = String(d.getMonth() + 1);
      if (filterYear && filterYear !== "Todos" && filterYear !== "" && y !== filterYear) return false;
      if (filterMonth && filterMonth !== "Todos" && filterMonth !== "" && m !== filterMonth) return false;
      return true;
    });

    let totalIncome = 0;
    let totalExpense = 0;
    selectedTransactions.forEach((t: any) => {
      const type = String(t.type || '').toLowerCase();
      if (type === 'income' || type === 'receita') {
        if (!t.is_transfer) totalIncome += Number(t.amount) || 0;
      } else {
        const pm = (t.payment_method || '').toLowerCase();
        const isCredit = pm.includes('crédito') || pm.includes('credito');
        const isPaid = t.is_paid === true || t.is_paid === 1 || t.is_paid === "1" || t.is_paid === "true";
        if (isCredit && !isPaid) return;
        totalExpense += Number(t.amount) || 0;
      }
    });

    const totalInvested = investments.reduce((acc: number, i: any) => acc + (Number(i.balance) || 0), 0);

    // Calcular cutoffDate com base no período filtrado
    const now = new Date();
    let cutoffDate: Date = now;
    if (filterYear && filterYear !== "Todos" && filterYear !== "" && filterMonth && filterMonth !== "Todos" && filterMonth !== "") {
      const y = parseInt(filterYear);
      const m = parseInt(filterMonth);
      const lastDay = new Date(y, m, 0).getDate();
      const endOfPeriod = new Date(y, m - 1, lastDay, 23, 59, 59, 999);
      cutoffDate = endOfPeriod < now ? endOfPeriod : now;
    } else if (filterYear && filterYear !== "Todos" && filterYear !== "") {
      const y = parseInt(filterYear);
      const endOfYear = new Date(y, 11, 31, 23, 59, 59, 999);
      cutoffDate = endOfYear < now ? endOfYear : now;
    }

    // Cumulative balance of all transactions up to the end of the selected period (cutoffDate)
    let cumulativeIncome = 0;
    let cumulativeExpense = 0;
    transactions.forEach((t: any) => {
      const tDate = new Date(t.date);
      if (tDate > cutoffDate) return;
      const type = String(t.type || '').toLowerCase();
      if (type === 'income' || type === 'receita') {
        if (!t.is_transfer) cumulativeIncome += Number(t.amount) || 0;
      } else {
        const pm = (t.payment_method || '').toLowerCase();
        const isCredit = pm.includes('crédito') || pm.includes('credito');
        const isPaid = t.is_paid === true || t.is_paid === 1 || t.is_paid === "1" || t.is_paid === "true";
        if (isCredit && !isPaid) return;
        cumulativeExpense += Number(t.amount) || 0;
      }
    });
    const cumulativeBalance = cumulativeIncome - cumulativeExpense;

    const chartData: any[] = [];
    if (filterMonth && filterMonth !== "Todos" && filterMonth !== "") {
      const numDays = 31;
      let runningPatrimony = Math.max(1200, cumulativeBalance - totalIncome + totalExpense);
      for (let day = 1; day <= numDays; day++) {
        let dailyIncome = 0;
        let dailyExpense = 0;
        selectedTransactions.forEach((t: any) => {
          const d = new Date(t.date);
          if (d.getDate() === day) {
            const type = String(t.type || '').toLowerCase();
            if (type === 'income' || type === 'receita') {
              if (!t.is_transfer) dailyIncome += Number(t.amount) || 0;
            } else {
              const pm = (t.payment_method || '').toLowerCase();
              const isCredit = pm.includes('crédito') || pm.includes('credito');
              const isPaid = t.is_paid === true || t.is_paid === 1 || t.is_paid === "1" || t.is_paid === "true";
              if (isCredit && !isPaid) return;
              dailyExpense += Number(t.amount) || 0;
            }
          }
        });
        runningPatrimony += (dailyIncome - dailyExpense);
        chartData.push({
          name: String(day),
          receitas: dailyIncome,
          despesas: dailyExpense,
          saldo: Math.round(runningPatrimony * 100) / 100,
          poupanca: Math.round(Math.max(0, dailyIncome - dailyExpense) * 100) / 100
        });
      }
    } else {
      const monthsAbbr = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      let runningPatrimony = 1000;
      for (let m = 1; m <= 12; m++) {
        let monthlyIncome = 0;
        let monthlyExpense = 0;
        transactions.forEach((t: any) => {
          const d = new Date(t.date);
          const y = String(d.getFullYear());
          if ((!filterYear || filterYear === "Todos" || y === filterYear) && (d.getMonth() + 1) === m) {
            const type = String(t.type || '').toLowerCase();
            if (type === 'income' || type === 'receita') {
              if (!t.is_transfer) monthlyIncome += Number(t.amount) || 0;
            } else {
              monthlyExpense += Number(t.amount) || 0;
            }
          }
        });
        runningPatrimony += (monthlyIncome - monthlyExpense);
        chartData.push({
          name: monthsAbbr[m - 1],
          receitas: monthlyIncome,
          despesas: monthlyExpense,
          saldo: Math.round(runningPatrimony * 100) / 100,
          poupanca: Math.round(Math.max(0, monthlyIncome - monthlyExpense) * 100) / 100
        });
      }
    }

    return [200, {
      balance: cumulativeBalance,
      income: totalIncome,
      expense: totalExpense,
      investments: totalInvested,
      chartData: chartData
    }];
  });

  // Categories Mocks
  mock.onGet('/categories').reply(() => {
    const db = getDB();
    return [200, db.categories || []];
  });

  mock.onPost('/categories/merge-duplicates').reply(() => {
    const db = getDB();
    const cats: any[] = db.categories || [];
    const groupsMap: Record<string, any[]> = {};
    cats.forEach(c => {
      const key = `${(c.name || '').trim().toLowerCase()}_${(c.type || '').toLowerCase()}`;
      if (!groupsMap[key]) groupsMap[key] = [];
      groupsMap[key].push(c);
    });

    const finalCats: any[] = [];
    Object.values(groupsMap).forEach(list => {
      if (list.length === 1) {
        finalCats.push(list[0]);
      } else {
        const canonical = list.sort((a, b) => (a.icon ? 0 : 1) - (b.icon ? 0 : 1) || a.id - b.id)[0];
        const duplicateIds = list.filter(c => c.id !== canonical.id).map(c => c.id);
        
        // Reatribuir transações
        (db.transactions || []).forEach((t: any) => {
          if (duplicateIds.includes(t.category_id)) t.category_id = canonical.id;
        });

        // Reatribuir metas
        (db.goals || []).forEach((g: any) => {
          if (duplicateIds.includes(g.category_id)) g.category_id = canonical.id;
        });

        finalCats.push(canonical);
      }
    });

    db.categories = finalCats;
    saveDB(db);
    return [200, finalCats];
  });

  mock.onPost('/categories').reply((config) => {
    const data = JSON.parse(config.data || '{}');
    const db = getDB();
    const trimmed = (data.name || '').trim();
    const existing = (db.categories || []).find((c: any) => 
      c.name.trim().toLowerCase() === trimmed.toLowerCase() && c.type === data.type
    );
    if (existing) {
      return [400, { detail: `Já existe uma categoria de ${data.type} com o nome '${trimmed}'.` }];
    }
    const newCat = { ...data, name: trimmed, id: ++currentId };
    if (!db.categories) db.categories = [];
    db.categories.push(newCat);
    saveDB(db);
    return [200, newCat];
  });

  const extractId = (url?: string) => {
    if (!url) return 0;
    const clean = url.split('?')[0].replace(/\/+$/, '');
    const parts = clean.split('/');
    return parseInt(parts[parts.length - 1] || '0');
  };

  mock.onDelete(/\/categories\/\d+/).reply((config) => {
    const id = extractId(config.url);
    const db = getDB();
    db.categories = (db.categories || []).filter((c: any) => c.id !== id);
    saveDB(db);
    return [200, { message: "Deleted" }];
  });

  mock.onPut(/\/categories\/\d+/).reply((config) => {
    const id = extractId(config.url);
    const data = JSON.parse(config.data || '{}');
    const db = getDB();
    const idx = (db.categories || []).findIndex((c: any) => c.id === id);
    if (idx >= 0) {
      db.categories[idx] = { ...db.categories[idx], ...data };
      saveDB(db);
      return [200, db.categories[idx]];
    }
    return [404, { message: "Category not found" }];
  });

  // Category Groups Mocks
  mock.onGet('/category-groups').reply(() => [200, getDB().categoryGroups || []]);

  mock.onPost('/category-groups').reply((config) => {
    const data = JSON.parse(config.data || '{}');
    const db = getDB();
    const newGroup = { ...data, id: ++currentId, created_at: new Date().toISOString() };
    if (!db.categoryGroups) db.categoryGroups = [];
    db.categoryGroups.push(newGroup);
    saveDB(db);
    return [200, newGroup];
  });

  mock.onPut(/\/category-groups\/\d+/).reply((config) => {
    const id = extractId(config.url);
    const data = JSON.parse(config.data || '{}');
    const db = getDB();
    const idx = (db.categoryGroups || []).findIndex((g: any) => g.id === id);
    if (idx >= 0) {
      db.categoryGroups[idx] = { ...db.categoryGroups[idx], ...data };
      saveDB(db);
      return [200, db.categoryGroups[idx]];
    }
    return [404, { message: "Group not found" }];
  });

  mock.onDelete(/\/category-groups\/\d+/).reply((config) => {
    const id = extractId(config.url);
    const db = getDB();
    db.categoryGroups = (db.categoryGroups || []).filter((g: any) => g.id !== id);
    saveDB(db);
    return [200, { message: "Group deleted" }];
  });

  // Transactions Mocks
  mock.onGet(/\/transactions.*/).reply((config) => {
    const db = getDB();
    const url = new URL(config.url!, 'http://localhost');
    const year = url.searchParams.get('year');
    const month = url.searchParams.get('month');
    const type = url.searchParams.get('type');
    const category_id = url.searchParams.get('category_id');
    const payment_method = url.searchParams.get('payment_method');
    
    let txs: any[] = db.transactions || [];
    
    if (year && year !== "Todos" && year !== "") {
      txs = txs.filter((t: any) => new Date(t.date).getFullYear().toString() === year);
    }
    if (month && month !== "Todos" && month !== "") {
      txs = txs.filter((t: any) => (new Date(t.date).getMonth() + 1).toString() === month);
    }
    if (type && type !== "Ambos") {
      const typeStr = type === "Receitas" || type === "income" ? "income" : "expense";
      txs = txs.filter((t: any) => t.type?.toLowerCase() === typeStr);
    }
    if (category_id && category_id !== "Todas") {
      txs = txs.filter((t: any) => t.category_id?.toString() === category_id);
    }
    if (payment_method && payment_method !== "Todos" && payment_method !== "") {
      txs = txs.filter((t: any) => t.payment_method === payment_method);
    }

    return [200, txs];
  });

  mock.onPost(/\/transactions\/settle-credit.*/).reply((config) => {
    const data = JSON.parse(config.data || '{}');
    const db = getDB();
    const txIds = data.transaction_ids ? data.transaction_ids.map(Number) : null;
    let count = 0;
    let totalAmount = 0;
    (db.transactions || []).forEach((t: any) => {
      const pm = (t.payment_method || '').toLowerCase();
      const isCredit = pm.includes('crédito') || pm.includes('credito');
      const isPending = t.type === 'expense' && isCredit && (t.is_paid === false || t.is_paid === 0 || t.is_paid === '0' || t.is_paid === 'false' || t.is_paid === null || t.is_paid === undefined);
      
      if (isPending || (txIds && txIds.includes(Number(t.id)))) {
        if (!txIds || txIds.length === 0 || txIds.includes(Number(t.id))) {
          t.is_paid = true;
          count++;
          totalAmount += Number(t.amount) || 0;
        }
      }
    });
    saveDB(db);
    return [200, { message: "Pagamentos de crédito liquidados com sucesso!", count, total_amount: totalAmount }];
  });

  mock.onPost('/transactions').reply((config) => {
    const data = JSON.parse(config.data || '{}');
    const db = getDB();
    const newTx = { ...data, id: ++currentId, date: data.date || new Date().toISOString().split('T')[0] };
    if (!db.transactions) db.transactions = [];
    db.transactions.unshift(newTx);
    saveDB(db);
    return [200, newTx];
  });

  mock.onPut(/\/transactions\/\d+/).reply((config) => {
    const id = extractId(config.url);
    const data = JSON.parse(config.data || '{}');
    const db = getDB();
    const idx = (db.transactions || []).findIndex((t: any) => Number(t.id) === Number(id));
    if (idx >= 0) {
      db.transactions[idx] = { ...db.transactions[idx], ...data };
      saveDB(db);
      return [200, db.transactions[idx]];
    }
    return [404, { message: "Not found" }];
  });

  mock.onDelete(/\/transactions\/\d+/).reply((config) => {
    const id = extractId(config.url);
    const db = getDB();
    db.transactions = (db.transactions || []).filter((t: any) => Number(t.id) !== Number(id));
    saveDB(db);
    return [200, { message: "Deleted" }];
  });

  // Investments History Mock
  mock.onGet(/\/investments\/history.*/).reply(() => {
    const db = getDB();
    const totalPatrimony = (db.investments || []).reduce((acc: number, i: any) => acc + (Number(i.balance) || 0), 0);
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const chartData = months.map((m, idx) => ({
      name: m,
      valor: Math.round(totalPatrimony * (0.75 + (idx * 0.025)))
    }));
    return [200, chartData];
  });

  // Investments Mocks
  mock.onGet('/investments').reply(() => [200, getDB().investments || []]);

  mock.onPost('/investments').reply((config) => {
    const data = JSON.parse(config.data || '{}');
    const db = getDB();
    const newInv = { ...data, id: ++currentId };
    if (!db.investments) db.investments = [];
    db.investments.push(newInv);
    saveDB(db);
    return [200, newInv];
  });

  mock.onPut(/\/investments\/\d+/).reply((config) => {
    const id = extractId(config.url);
    const data = JSON.parse(config.data || '{}');
    const db = getDB();
    const idx = (db.investments || []).findIndex((i: any) => Number(i.id) === Number(id));
    if (idx >= 0) {
      db.investments[idx] = { ...db.investments[idx], ...data };
      saveDB(db);
      return [200, db.investments[idx]];
    }
    return [404, { message: "Not found" }];
  });

  mock.onDelete(/\/investments\/\d+/).reply((config) => {
    const id = extractId(config.url);
    const db = getDB();
    db.investments = (db.investments || []).filter((i: any) => Number(i.id) !== Number(id));
    saveDB(db);
    return [200, { message: "Deleted" }];
  });

  // Withdraw Investment Mock
  mock.onPost(/\/investments\/\d+\/withdraw.*/).reply((config) => {
    const id = extractId(config.url?.replace(/\/withdraw.*/, ''));
    const data = JSON.parse(config.data || '{}');
    const db = getDB();
    const inv = (db.investments || []).find((i: any) => Number(i.id) === Number(id));
    if (!inv) return [404, { detail: "Investment not found" }];
    const amount = Number(data.amount) || 0;
    if (amount <= 0) return [400, { detail: "Montante inválido" }];
    if (amount > inv.balance) return [400, { detail: "Saldo insuficiente" }];
    
    inv.balance -= amount;
    if (data.transfer_to_balance) {
      db.transactions.unshift({
        id: ++currentId,
        amount: amount,
        description: `Investimento - Saída (${inv.name})`,
        type: "income",
        date: new Date().toISOString().split('T')[0],
        category_id: 1,
        is_transfer: true
      });
    }
    saveDB(db);
    return [200, { message: "Retirada efetuada com sucesso", balance: inv.balance }];
  });

  // Goals Mocks
  mock.onGet(/\/goals.*/).reply(() => [200, getDB().goals || []]);

  mock.onPost('/goals').reply((config) => {
    const data = JSON.parse(config.data || '{}');
    const db = getDB();
    const newGoal = { ...data, id: ++currentId, created_at: new Date().toISOString() };
    if (!db.goals) db.goals = [];
    db.goals.push(newGoal);
    saveDB(db);
    return [200, newGoal];
  });

  mock.onPut(/\/goals\/\d+/).reply((config) => {
    const id = extractId(config.url);
    const data = JSON.parse(config.data || '{}');
    const db = getDB();
    const idx = (db.goals || []).findIndex((g: any) => Number(g.id) === Number(id));
    if (idx >= 0) {
      db.goals[idx] = { ...db.goals[idx], ...data };
      saveDB(db);
      return [200, db.goals[idx]];
    }
    return [404, { message: "Goal not found" }];
  });

  mock.onDelete(/\/goals\/\d+/).reply((config) => {
    const id = extractId(config.url);
    const db = getDB();
    db.goals = (db.goals || []).filter((g: any) => Number(g.id) !== Number(id));
    saveDB(db);
    return [200, { message: "Deleted" }];
  });

  // Simulations Mocks
  mock.onGet('/simulations').reply(() => [200, getDB().simulations || []]);

  mock.onPost('/simulations').reply((config) => {
    const data = JSON.parse(config.data || '{}');
    const db = getDB();
    if (!db.simulations) db.simulations = [];
    const newSim = { ...data, id: ++currentId, created_at: new Date().toISOString() };
    db.simulations.unshift(newSim);
    saveDB(db);
    return [200, newSim];
  });

  mock.onDelete(/\/simulations\/\d+/).reply((config) => {
    const id = extractId(config.url);
    const db = getDB();
    db.simulations = (db.simulations || []).filter((s: any) => Number(s.id) !== Number(id));
    saveDB(db);
    return [200, { message: "Deleted" }];
  });
}
