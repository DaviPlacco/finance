"use client";

import { useEffect, useState, useMemo } from "react";
import { useMonthFilter } from "@/hooks/useMonthFilter";
import { api } from "@/lib/api";
import { 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight, 
  Receipt,
  Sparkles,
  PieChart,
  Camera,
  Image as ImageIcon,
  X,
  Download,
  Eye,
  Pencil,
  CreditCard,
  FileText,
  Filter,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useSettings } from "@/lib/SettingsContext";
import { CategoryIcon, getStoredCategoryIcons } from "@/components/CategoryIcon";
import { ModalPortal } from "@/components/ModalPortal";
import { toast } from "sonner";

export const isPdfDocument = (dataOrUrl?: string | null) => {
  if (!dataOrUrl) return false;
  return dataOrUrl.startsWith("data:application/pdf") || dataOrUrl.toLowerCase().includes(".pdf");
};

export const isCreditPayment = (pm?: string | null) => {
  if (!pm) return false;
  const lower = pm.toLowerCase();
  return lower.includes("crédito") || lower.includes("credito");
};

export const isTransactionPendingCredit = (t: any) => {
  if (!t || t.type !== 'expense') return false;
  if (!isCreditPayment(t.payment_method)) return false;
  return t.is_paid === false || t.is_paid === 0 || t.is_paid === "0" || t.is_paid === "false" || t.is_paid === null || t.is_paid === undefined;
};

export const isTransactionPaid = (t: any) => {
  return !isTransactionPendingCredit(t);
};

export const PAYMENT_METHODS = [
  { id: "Cartão de Crédito", label: "Cartão de Crédito", icon: "💳", color: "#8b5cf6" },
  { id: "Cartão de Débito", label: "Cartão de Débito", icon: "💳", color: "#3b82f6" },
  { id: "Transferência / MB WAY", label: "Transferência / MB WAY", icon: "📱", color: "#10b981" },
  { id: "Dinheiro / Numerário", label: "Dinheiro / Numerário", icon: "💶", color: "#f59e0b" },
  { id: "Débito Direto", label: "Débito Direto", icon: "📄", color: "#06b6d4" },
  { id: "Outro", label: "Outro", icon: "🔄", color: "#64748b" },
];

export default function GestaoPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [type, setType] = useState("expense");
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  // Edit Transaction State
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editType, setEditType] = useState("expense");
  const [editPaymentMethod, setEditPaymentMethod] = useState("");
  const [editReceiptImage, setEditReceiptImage] = useState<string | null>(null);
  const [editIsPaid, setEditIsPaid] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  // Settle Credit State & Modals
  const [showSettleCreditModal, setShowSettleCreditModal] = useState(false);
  const [creditTxToSettle, setCreditTxToSettle] = useState<any | null>(null);
  const [settlingCredit, setSettlingCredit] = useState(false);

  // Budget state
  const [budgetCategoryId, setBudgetCategoryId] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");

  // Receipt Modal State
  const [viewingReceipt, setViewingReceipt] = useState<any | null>(null);

  const { itemsPerPage } = useSettings();
  const [currentPage, setCurrentPage] = useState(1);

  // Filter state
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterMonth, setFilterMonth] = useMonthFilter('all');
  const [filterType, setFilterType] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("");
  const [filterStatus, setFilterStatus] = useState(""); // "" | "pending_credit" | "paid"

  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
    fetchData();
  }, [filterYear, filterMonth, filterType, filterCategoryId, filterPaymentMethod, filterStatus]);

  useEffect(() => {
    const handleCategoriesUpdate = () => {
      fetchData();
    };
    window.addEventListener("categories-updated", handleCategoriesUpdate);
    return () => window.removeEventListener("categories-updated", handleCategoriesUpdate);
  }, []);

  async function fetchData() {
    try {
      const query = new URLSearchParams();
      if (filterYear) query.append("year", filterYear);
      if (filterMonth) query.append("month", filterMonth);
      if (filterType) query.append("type", filterType);
      if (filterCategoryId) query.append("category_id", filterCategoryId);
      if (filterPaymentMethod) query.append("payment_method", filterPaymentMethod);
      if (filterStatus === "pending_credit") query.append("is_paid", "false");
      if (filterStatus === "paid") query.append("is_paid", "true");

      const [transRes, catRes] = await Promise.all([
        api.get(`/transactions?${query.toString()}`).catch(() => ({ data: [] })),
        api.get("/categories").catch(() => ({ data: [] }))
      ]);
      const storedIcons = getStoredCategoryIcons();
      const rawTx = Array.isArray(transRes?.data) ? transRes.data : [];
      const rawCats = Array.isArray(catRes?.data) ? catRes.data : [];

      setTransactions(rawTx);
      setCategories(rawCats.map((c: any) => ({
        ...c,
        icon: c.icon || storedIcons[String(c.id)] || null
      })));
    } catch (err) {
      console.error("Erro ao carregar dados na gestão:", err);
      setTransactions([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      if (file.size > 15 * 1024 * 1024) {
        toast.error("O ficheiro PDF não pode ter mais de 15 MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setReceiptImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
        setReceiptImage(compressedBase64);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isCreditExpense = type === "expense" && isCreditPayment(paymentMethod);
      await api.post("/transactions", {
        amount: parseFloat(amount),
        type,
        category_id: parseInt(categoryId),
        payment_method: paymentMethod || null,
        description,
        date,
        receipt_image: receiptImage,
        is_paid: isCreditExpense ? false : true
      });
      setAmount("");
      setDescription("");
      setPaymentMethod("");
      setReceiptImage(null);
      fetchData();
      if (isCreditExpense) {
        toast.success("Despesa em Crédito registada! Ficou pendente e será debitada ao fechar a fatura.");
      } else {
        toast.success("Registo adicionado com sucesso!");
      }
      window.dispatchEvent(new CustomEvent("transactions-updated"));
      window.dispatchEvent(new CustomEvent("summary-updated"));
    } catch (err) {
      console.error("Failed to add transaction", err);
      toast.error("Erro ao adicionar registo");
    }
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      if (file.size > 15 * 1024 * 1024) {
        toast.error("O ficheiro PDF não pode ter mais de 15 MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditReceiptImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
        setEditReceiptImage(compressedBase64);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleOpenEdit = (t: any) => {
    setEditingTransaction(t);
    setEditAmount(t.amount ? String(t.amount) : "");
    setEditDate(t.date ? String(t.date).split("T")[0] : new Date().toISOString().split("T")[0]);
    setEditDescription(t.description || "");
    setEditCategoryId(t.category_id ? String(t.category_id) : "");
    setEditType(t.type || "expense");
    setEditPaymentMethod(t.payment_method || "");
    setEditReceiptImage(t.receipt_image || null);
    setEditIsPaid(t.is_paid !== false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;
    if (!editAmount || parseFloat(editAmount) <= 0) {
      toast.error("Por favor, insere um valor válido.");
      return;
    }
    if (!editCategoryId) {
      toast.error("Por favor, seleciona uma categoria.");
      return;
    }

    setSavingEdit(true);
    try {
      await api.put(`/transactions/${editingTransaction.id}`, {
        amount: parseFloat(editAmount),
        type: editType,
        category_id: parseInt(editCategoryId),
        description: editDescription,
        date: editDate,
        payment_method: editPaymentMethod || null,
        receipt_image: editReceiptImage,
        is_paid: editIsPaid
      });

      toast.success("Transação atualizada com sucesso!");
      setEditingTransaction(null);
      fetchData();
      window.dispatchEvent(new CustomEvent("transactions-updated"));
      window.dispatchEvent(new CustomEvent("summary-updated"));
    } catch (err: any) {
      console.error("Erro ao atualizar transação:", err);
      toast.error(err?.response?.data?.detail || "Erro ao atualizar transação");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSettleCredit = async (txIds?: number[]) => {
    setSettlingCredit(true);
    try {
      const payload = txIds && txIds.length > 0 
        ? { transaction_ids: txIds } 
        : { 
            year: filterYear ? parseInt(filterYear) : undefined, 
            month: filterMonth && filterMonth !== 'all' ? parseInt(filterMonth) : undefined 
          };
      
      let success = false;
      try {
        const res = await api.post("/transactions/settle-credit", payload);
        toast.success(res.data?.message || "Pagamentos de crédito liquidados com sucesso! O valor foi debitado do teu Saldo Atual.");
        success = true;
      } catch (postErr) {
        // Fallback imediato: atualizar as transações pendentes individualmente via PUT /transactions/{id}
        const idsToUpdate = txIds && txIds.length > 0 
          ? txIds 
          : pendingCreditTransactions.map((t: any) => t.id);

        if (idsToUpdate.length > 0) {
          await Promise.all(
            idsToUpdate.map(async (id: number) => {
              const tx = safeTransactions.find((t: any) => t && t.id === id);
              if (tx) {
                return api.put(`/transactions/${id}`, {
                  amount: tx.amount,
                  type: tx.type,
                  category_id: tx.category_id,
                  payment_method: tx.payment_method,
                  description: tx.description,
                  date: tx.date,
                  receipt_image: tx.receipt_image,
                  is_paid: true
                });
              }
            })
          );
          toast.success("Pagamentos de crédito liquidados com sucesso! O valor foi debitado do teu Saldo Atual.");
          success = true;
        } else {
          throw postErr;
        }
      }

      if (success) {
        setShowSettleCreditModal(false);
        setCreditTxToSettle(null);
        fetchData();
        window.dispatchEvent(new CustomEvent("transactions-updated"));
        window.dispatchEvent(new CustomEvent("dashboard-updated"));
        window.dispatchEvent(new CustomEvent("summary-updated"));
      }
    } catch (err: any) {
      console.error("Erro ao fechar pagamentos de crédito:", err);
      toast.error(err?.response?.data?.detail || "Erro ao fechar pagamentos de crédito.");
    } finally {
      setSettlingCredit(false);
    }
  };

  const handleAddNewCategory = () => {
    setIsAddingCategory(true);
  };

  const confirmAddCategory = async () => {
    const trimmed = newCatName.trim();
    if (!trimmed) {
      toast.error("Por favor, insere um nome para a categoria.");
      return;
    }

    // Verificar se já existe categoria de mesmo nome e tipo
    const existing = categories.find(
      c => c.name.trim().toLowerCase() === trimmed.toLowerCase() && c.type === type
    );
    if (existing) {
      setCategoryId(existing.id.toString());
      setIsAddingCategory(false);
      setNewCatName("");
      toast.info(`A categoria "${existing.name}" já existe e foi selecionada.`);
      return;
    }

    try {
      const res = await api.post("/categories", {
        name: trimmed,
        type: type,
        color: "#" + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
      });
      const storedIcons = getStoredCategoryIcons();
      const newCat = {
        ...res.data,
        icon: res.data.icon || storedIcons[String(res.data.id)] || null
      };
      setCategories([...categories, newCat]);
      setCategoryId(newCat.id.toString());
      setIsAddingCategory(false);
      setNewCatName("");
      toast.success("Categoria criada com sucesso!");
      window.dispatchEvent(new CustomEvent("categories-updated"));
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Erro ao criar categoria";
      toast.error(msg);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/transactions/${id}`);
      fetchData();
      toast.error("Transação eliminada.");
    } catch (err) {
      console.error("Failed to delete transaction");
      toast.error("Erro ao eliminar transação.");
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedTransactions.map(id => api.delete(`/transactions/${id}`)));
      setSelectedTransactions([]);
      setShowBulkDeleteModal(false);
      fetchData();
      toast.error("Transações eliminadas com sucesso.");
    } catch (err) {
      toast.error("Erro ao eliminar transações.");
    }
  };

  const handleDeleteCategory = async (id: string | number) => {
    const cat = categories.find(c => c.id.toString() === id.toString());
    setCatToDelete(cat);
    setShowDeleteCatModal(true);
  };

  const confirmDeleteCategory = async () => {
    if (!catToDelete) return;
    try {
      await api.delete(`/categories/${catToDelete.id}`);
      fetchData();
      if (categoryId === catToDelete.id.toString()) setCategoryId("");
      if (filterCategoryId === catToDelete.id.toString()) setFilterCategoryId("");
      toast.error("Categoria eliminada com sucesso.");
      setShowDeleteCatModal(false);
      setCatToDelete(null);
    } catch (err) {
      toast.error("Erro ao eliminar a categoria.");
    }
  };

  const toggleSelectAll = () => {
    if (selectedTransactions.length === paginatedTransactions.length && paginatedTransactions.length > 0) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(paginatedTransactions.map((t: any) => t.id));
    }
  };

  const toggleSelectTransaction = (id: number) => {
    if (selectedTransactions.includes(id)) {
      setSelectedTransactions(selectedTransactions.filter(tid => tid !== id));
    } else {
      setSelectedTransactions([...selectedTransactions, id]);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT');
  };

  const safeTransactions = useMemo(() => Array.isArray(transactions) ? transactions : [], [transactions]);
  const safeCategories = useMemo(() => Array.isArray(categories) ? categories : [], [categories]);

  const totalPages = Math.max(1, Math.ceil(safeTransactions.length / (itemsPerPage || 10)));
  const paginatedTransactions = safeTransactions.slice((currentPage - 1) * (itemsPerPage || 10), currentPage * (itemsPerPage || 10));

  // Limpeza de todos os filtros ativos
  const handleClearFilters = () => {
    setFilterYear("");
    setFilterMonth("");
    setFilterType("");
    setFilterCategoryId("");
    setFilterPaymentMethod("");
    setFilterStatus("");
  };

  // Verificação e nomes dos filtros ativos
  const isFilterActive = Boolean(
    filterYear || filterMonth || filterType || filterCategoryId || filterPaymentMethod || filterStatus
  );

  const activeFilterName = useMemo(() => {
    const parts: string[] = [];
    if (filterStatus) {
      parts.push(filterStatus === "pending_credit" ? "💳 Apenas Pendentes (Crédito)" : "✅ Apenas Liquidados");
    }
    if (filterPaymentMethod) {
      const pm = PAYMENT_METHODS.find(p => p.id === filterPaymentMethod);
      parts.push(pm ? `${pm.icon} ${pm.label}` : filterPaymentMethod);
    }
    if (filterCategoryId) {
      const cat = safeCategories.find((c: any) => c && String(c.id) === String(filterCategoryId));
      parts.push(cat ? cat.name : "Categoria");
    }
    if (filterType) {
      parts.push(filterType === "income" ? "Receitas" : "Despesas");
    }
    if (filterMonth) {
      const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
      parts.push(monthNames[parseInt(filterMonth) - 1] || `Mês ${filterMonth}`);
    }
    if (filterYear) {
      parts.push(filterYear);
    }
    return parts.join(" • ");
  }, [filterStatus, filterPaymentMethod, filterCategoryId, filterType, filterMonth, filterYear, safeCategories]);

  // Transações de Crédito Pendentes (não descontadas do Saldo Atual)
  const pendingCreditTransactions = useMemo(() => {
    return safeTransactions.filter((t: any) => isTransactionPendingCredit(t));
  }, [safeTransactions]);

  const pendingCreditTotal = useMemo(() => {
    return pendingCreditTransactions.reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);
  }, [pendingCreditTransactions]);

  // Totais das Transações Filtradas Atualmente na Tabela
  const filteredIncomeTotal = useMemo(() => {
    return safeTransactions.filter((t: any) => t && t.type === "income").reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);
  }, [safeTransactions]);

  // Apenas despesas que foram liquidadas entram no total de despesas debitadas
  const filteredPaidExpenseTotal = useMemo(() => {
    return safeTransactions.filter((t: any) => t && t.type === "expense" && !isTransactionPendingCredit(t)).reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);
  }, [safeTransactions]);

  const filteredPendingCreditExpenseTotal = useMemo(() => {
    return safeTransactions.filter((t: any) => isTransactionPendingCredit(t)).reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);
  }, [safeTransactions]);

  const filteredExpenseTotal = filteredPaidExpenseTotal;
  const filteredNetTotal = filteredIncomeTotal - filteredPaidExpenseTotal;

  // Totais das Transações Selecionadas via Checkbox
  const selectedTransactionsList = useMemo(() => {
    return safeTransactions.filter((t: any) => t && Array.isArray(selectedTransactions) && selectedTransactions.includes(t.id));
  }, [safeTransactions, selectedTransactions]);

  const selectedIncomeTotal = useMemo(() => {
    return selectedTransactionsList.filter((t: any) => t && t.type === "income").reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);
  }, [selectedTransactionsList]);

  const selectedExpenseTotal = useMemo(() => {
    return selectedTransactionsList.filter((t: any) => t && t.type === "expense").reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);
  }, [selectedTransactionsList]);

  const selectedNetTotal = selectedIncomeTotal - selectedExpenseTotal;

  const handleSetBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetCategoryId || !budgetAmount) return;
    try {
      const cat: any = safeCategories.find((c: any) => c && String(c.id) === String(budgetCategoryId));
      if (cat) {
        await api.put(`/categories/${budgetCategoryId}`, {
          name: cat.name,
          color: cat.color,
          type: cat.type,
          budget_limit: parseFloat(budgetAmount),
          group_id: cat.group_id
        });
        setBudgetAmount("");
        fetchData();
        toast("Previsão de gastos atualizada com sucesso!", { style: { background: '#ffffff', color: '#000000', border: '1px solid #e2e8f0' } });
      }
    } catch (err) {
      console.error("Failed to set budget");
      toast.error("Erro ao definir previsão.");
    }
  };

  const expensesByCategory = useMemo(() => {
    const expenses = safeTransactions.filter((t: any) => t && t.type === 'expense');
    
    const grouped = expenses.reduce((acc: any, t: any) => {
      const cid = t.category_id || "outros";
      acc[cid] = (acc[cid] || 0) + (Number(t.amount) || 0);
      return acc;
    }, {});

    return Object.keys(grouped).map(catId => {
      const category = safeCategories.find((c: any) => c && String(c.id) === String(catId));
      return {
        id: catId,
        name: category ? category.name : "Sem Categoria",
        color: category ? category.color : "#94a3b8",
        amount: grouped[catId]
      };
    }).sort((a, b) => b.amount - a.amount);
  }, [safeTransactions, safeCategories]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">A carregar dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Gestão Financeira</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-3 h-3" /> Controlo Ativo
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gere as tuas entradas, despesas, comprovativos e planeamento futuro.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Novo Registo Card */}
          <div className="glass-card p-5 sm:p-6 relative border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-900/5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Plus className="w-5 h-5" />
                </div>
                Novo Registo
              </h3>
            </div>
            
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
                <button
                  type="button"
                  onClick={() => setType("income")}
                  className={`py-2 px-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                    type === 'income' 
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" /> Receita
                </button>
                <button
                  type="button"
                  onClick={() => setType("expense")}
                  className={`py-2 px-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                    type === 'expense' 
                      ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" /> Despesa
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Valor (€)
                </label>
                <input 
                  type="number" 
                  step="0.01" 
                  required 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-white/70 dark:bg-slate-800/60 text-slate-900 dark:text-white text-base font-semibold focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400" 
                  placeholder="0.00" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Data de Execução
                </label>
                <input 
                  type="date" 
                  required 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-white/70 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" 
                />
                {new Date(date) > new Date() && (
                  <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Esta transação ficará &quot;Em Espera&quot; até à data indicada.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Categoria
                </label>
                <CustomSelect 
                  required
                  value={categoryId} 
                  onChange={val => setCategoryId(val as string)} 
                  options={categories.filter((c: any) => c.type === type).map((cat: any) => ({ value: cat.id, label: cat.name, color: cat.color, icon: cat.icon }))}
                  placeholder="Selecione uma categoria"
                  onAddNew={handleAddNewCategory}
                  addNewLabel="Nova Categoria"
                  onDeleteOption={handleDeleteCategory}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Método de Pagamento
                </label>
                <CustomSelect 
                  value={paymentMethod} 
                  onChange={val => setPaymentMethod(val as string)} 
                  options={[
                    { value: "", label: "Selecione o método..." },
                    ...PAYMENT_METHODS.map(pm => ({
                      value: pm.id,
                      label: `${pm.icon} ${pm.label}`
                    }))
                  ]}
                  placeholder="Selecione o método de pagamento"
                />
              </div>

              {/* 💳 Alerta Informativo para Compras no Crédito */}
              {type === "expense" && isCreditPayment(paymentMethod) && (
                <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/25 text-primary text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                  <CreditCard className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-slate-900 dark:text-white">Pagamento no Crédito (Pendente)</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      Esta despesa ficará registada como <strong>Pagamento Pendente</strong> e <span className="underline decoration-primary/50 underline-offset-2 font-semibold">não será descontada</span> do teu <strong>Saldo Atual</strong> até fechares a fatura.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Descrição (Opcional)
                </label>
                <input 
                  type="text" 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-white/70 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400" 
                  placeholder="Ex: Supermercado, Salário, etc." 
                />
              </div>

              {/* 📸 Anexar Foto de Talão / Fatura ou Documento PDF */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Comprovativo / Fatura (Imagem ou PDF)
                </label>
                {receiptImage ? (
                  <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-2 flex items-center gap-3">
                    {isPdfDocument(receiptImage) ? (
                      <div className="w-14 h-14 rounded-lg bg-rose-500/10 border border-rose-500/20 flex flex-col items-center justify-center text-rose-500 shrink-0">
                        <FileText className="w-6 h-6" />
                        <span className="text-[9px] font-extrabold uppercase mt-0.5">PDF</span>
                      </div>
                    ) : (
                      <img src={receiptImage} alt="Comprovativo" className="w-14 h-14 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {isPdfDocument(receiptImage) ? "Documento PDF Anexado" : "Comprovativo anexado"}
                      </p>
                      <p className="text-[11px] text-emerald-500 font-semibold">Pronto para guardar</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReceiptImage(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Remover anexo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-dashed border-slate-300 dark:border-slate-700 hover:border-primary/60 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 hover:bg-primary/5 transition-all text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-primary">
                    <FileText className="w-4 h-4 text-primary" />
                    <span>Anexar Talão, Fatura ou PDF</span>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf" 
                      className="hidden" 
                      onChange={handleFileChange} 
                    />
                  </label>
                )}
              </div>

              {/* 📌 Mobile Sticky Submit Button */}
              <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pt-3 pb-1 border-t border-slate-100 dark:border-slate-800 z-20 md:relative md:bg-transparent md:pt-0 md:pb-0 md:border-0">
                <button 
                  type="submit" 
                  className="w-full py-3.5 md:py-3 bg-gradient-to-r from-primary to-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all text-sm uppercase tracking-wider"
                >
                  Guardar Registo
                </button>
              </div>
            </form>
          </div>

          {/* Previsão de Gastos Card */}
          <div className="glass-card p-5 sm:p-6 relative overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-900/5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <TrendingUp className="w-5 h-5" />
                </div>
                Previsão de Gastos
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Define um limite mensal de gastos para as tuas categorias de despesa.
            </p>
            <form onSubmit={handleSetBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Categoria
                </label>
                <CustomSelect 
                  required
                  value={budgetCategoryId} 
                  onChange={val => setBudgetCategoryId(String(val))} 
                  options={categories.filter((c: any) => c.type === 'expense').map((cat: any) => ({ value: cat.id, label: cat.name, color: cat.color, icon: cat.icon }))}
                  placeholder="Selecione a categoria"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Limite Mensal (€)
                </label>
                <input 
                  type="number" 
                  step="0.01" 
                  required 
                  value={budgetAmount} 
                  onChange={e => setBudgetAmount(e.target.value)} 
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-white/70 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400" 
                  placeholder="0.00" 
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-3 bg-primary hover:brightness-110 text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all text-sm uppercase tracking-wider mt-2"
              >
                Guardar Previsão
              </button>
            </form>
          </div>
        </div>

        {/* Table & History Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* 💳 BANNER DE ALERTA: FECHAR PAGAMENTOS PENDENTES NO CRÉDITO */}
          {pendingCreditTransactions.length > 0 && (
            <div 
              className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 border border-primary/30 dark:border-primary/25 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300"
              style={{
                boxShadow: '0 12px 36px -12px var(--primary-glow, rgba(16, 185, 129, 0.2))'
              }}
            >
              <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                <div className="w-11 h-11 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0 shadow-inner">
                  <CreditCard className="w-6 h-6 animate-pulse" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-black text-slate-900 dark:text-white">
                      Fechar Pagamentos Pendentes
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      {pendingCreditTransactions.length} {pendingCreditTransactions.length === 1 ? 'despesa no crédito' : 'despesas no crédito'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Tens <strong className="text-primary font-extrabold">{formatCurrency(pendingCreditTotal)}</strong> em pagamentos no crédito que <span className="underline decoration-primary underline-offset-2 font-semibold">ainda não foram debitados</span> do teu <strong>Saldo Atual</strong>.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCreditTxToSettle(null);
                  setShowSettleCreditModal(true);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary hover:brightness-110 text-white font-black text-xs sm:text-sm shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all shrink-0 uppercase tracking-wider whitespace-nowrap"
                style={{
                  boxShadow: '0 8px 24px -6px var(--primary-glow, rgba(16, 185, 129, 0.4))'
                }}
              >
                <CreditCard className="w-4 h-4" />
                <span>Fechar Pagamento ({formatCurrency(pendingCreditTotal)})</span>
              </button>
            </div>
          )}

          {/* Filters Bar */}
          <div className="glass-card p-4 border border-slate-200/80 dark:border-slate-800 shadow-md">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 w-full min-w-0">
              <div className="min-w-0">
                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Ano</label>
                <CustomSelect 
                  value={filterYear}
                  onChange={val => setFilterYear(val as string)}
                  options={[
                    { value: "", label: "Todos" },
                    { value: "2024", label: "2024" },
                    { value: "2025", label: "2025" },
                    { value: "2026", label: "2026" }
                  ]}
                />
              </div>
              <div className="min-w-0">
                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Mês</label>
                <CustomSelect 
                  value={filterMonth}
                  onChange={val => setFilterMonth(val as string)}
                  options={[
                    { value: "", label: "Todos" },
                    { value: "1", label: "Janeiro" }, { value: "2", label: "Fevereiro" },
                    { value: "3", label: "Março" }, { value: "4", label: "Abril" },
                    { value: "5", label: "Maio" }, { value: "6", label: "Junho" },
                    { value: "7", label: "Julho" }, { value: "8", label: "Agosto" },
                    { value: "9", label: "Setembro" }, { value: "10", label: "Outubro" },
                    { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" }
                  ]}
                />
              </div>
              <div className="min-w-0">
                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Tipo</label>
                <CustomSelect 
                  value={filterType}
                  onChange={val => setFilterType(val as string)}
                  options={[
                    { value: "", label: "Ambos" },
                    { value: "income", label: "Receitas" },
                    { value: "expense", label: "Despesas" }
                  ]}
                />
              </div>
              <div className="min-w-0">
                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Categoria</label>
                <CustomSelect 
                  value={filterCategoryId} 
                  onChange={val => setFilterCategoryId(val as string)} 
                  options={[
                    { value: "", label: "Todas" },
                    ...categories.map((c: any) => ({ value: c.id, label: c.name, color: c.color, icon: c.icon }))
                  ]}
                />
              </div>
              <div className="min-w-0">
                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Método</label>
                <CustomSelect 
                  value={filterPaymentMethod} 
                  onChange={val => setFilterPaymentMethod(val as string)} 
                  options={[
                    { value: "", label: "Todos" },
                    ...PAYMENT_METHODS.map(pm => ({
                      value: pm.id,
                      label: `${pm.icon} ${pm.label}`
                    }))
                  ]}
                />
              </div>
              <div className="min-w-0">
                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Estado</label>
                <CustomSelect 
                  value={filterStatus} 
                  onChange={val => setFilterStatus(val as string)} 
                  options={[
                    { value: "", label: "Todos" },
                    { value: "pending_credit", label: "🟡 Pendentes (Crédito)" },
                    { value: "paid", label: "🟢 Liquidados" }
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Premium History Container */}
          <div 
            className="glass-card overflow-hidden border border-slate-200/80 dark:border-slate-800/80 shadow-2xl relative transition-all duration-300"
            style={{
              boxShadow: '0 10px 40px -10px var(--card-history-glow, rgba(139, 92, 246, 0.15))'
            }}
          >
            {/* Header */}
            <div 
              className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md relative"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md shadow-primary/20"
                  style={{ backgroundColor: 'var(--card-history-accent, var(--primary))' }}
                >
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                    Histórico de Transações
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {transactions.length} {transactions.length === 1 ? 'registo encontrado' : 'registos encontrados'}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Sincronizado
                </span>
              </div>
            </div>
            
            {/* DESKTOP TABLE VIEW (MD+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800">
                    <th className="p-4 w-12 text-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-primary focus:ring-primary/30 w-4 h-4 cursor-pointer"
                        checked={selectedTransactions.length === paginatedTransactions.length && paginatedTransactions.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Data</th>
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Valor</th>
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Categoria</th>
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Método</th>
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Descrição</th>
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Talão</th>
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center sticky right-0 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm z-10">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {paginatedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-slate-500 dark:text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Receipt className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                          <p className="font-semibold text-sm">Não existem transações para os filtros selecionados.</p>
                          <p className="text-xs text-slate-400">Tenta alterar o ano, mês, tipo ou método de pagamento.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedTransactions.map((t: any) => {
                      const isIncome = t.type === 'income';
                      const isFuture = new Date(t.date) > new Date();
                      const category = categories.find((c: any) => c.id === t.category_id);
                      const pm = PAYMENT_METHODS.find(p => p.id === t.payment_method);
                      return (
                        <tr 
                          key={t.id} 
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                          onClick={() => toggleSelectTransaction(t.id)}
                        >
                          <td className="p-4 text-center">
                            <input 
                              type="checkbox" 
                              className="rounded border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-primary focus:ring-primary/30 w-4 h-4 cursor-pointer"
                              checked={selectedTransactions.includes(t.id)}
                              onChange={() => toggleSelectTransaction(t.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="p-4 text-slate-600 dark:text-slate-300 text-sm font-medium whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span>{formatDate(t.date)}</span>
                              {isFuture && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100/80 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300/40 dark:border-amber-700/50">
                                  <Clock className="w-2.5 h-2.5" /> Em Espera
                                </span>
                              )}
                            </div>
                          </td>
                          <td className={`p-4 text-right font-extrabold text-sm whitespace-nowrap ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
                            {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span 
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{ 
                                backgroundColor: `${category?.color || '#94a3b8'}15`, 
                                color: category?.color || '#94a3b8',
                                border: `1px solid ${category?.color || '#94a3b8'}30`
                              }}
                            >
                              <CategoryIcon color={category?.color || '#94a3b8'} icon={category?.icon} size="xs" showBackground={false} />
                              <span className="truncate max-w-[120px]">{category?.name || 'Sem Categoria'}</span>
                            </span>
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <div className="flex flex-col items-start gap-1">
                              {t.payment_method ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
                                  <span>{pm?.icon || '💳'}</span>
                                  <span className="truncate max-w-[130px]">{t.payment_method}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-600 text-xs italic">Não definido</span>
                              )}

                              {isTransactionPendingCredit(t) ? (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                                    <Clock className="w-2.5 h-2.5" /> Pendente (Crédito)
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCreditTxToSettle(t);
                                    }}
                                    className="text-[10px] font-black text-primary hover:underline px-1.5 py-0.5 rounded bg-primary/10 hover:bg-primary/20 transition-all cursor-pointer"
                                    title="Fechar e debitar este pagamento do Saldo Atual"
                                  >
                                    Fechar
                                  </button>
                                </div>
                              ) : isCreditPayment(t.payment_method) ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 mt-0.5">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> Liquidado
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="p-4 text-slate-900 dark:text-slate-100 font-semibold text-sm max-w-[200px] truncate" title={t.description || '-'}>
                            {t.description || '-'}
                          </td>
                          <td className="p-4 text-center whitespace-nowrap">
                            {t.receipt_image ? (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setViewingReceipt(t); }}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-xs ${
                                  isPdfDocument(t.receipt_image)
                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20'
                                    : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                                }`}
                                title={isPdfDocument(t.receipt_image) ? "Ver Documento PDF" : "Ver Comprovativo"}
                              >
                                {isPdfDocument(t.receipt_image) ? <FileText className="w-3.5 h-3.5" /> : <Receipt className="w-3.5 h-3.5" />}
                                <span>{isPdfDocument(t.receipt_image) ? "PDF" : "Ver"}</span>
                              </button>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-700 text-xs">-</span>
                            )}
                          </td>
                          <td className="p-4 text-center sticky right-0 bg-white/90 dark:bg-[#0b1120]/90 backdrop-blur-sm z-10 whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleOpenEdit(t); }} 
                                className="text-slate-400 hover:text-primary dark:hover:text-primary p-2 rounded-xl hover:bg-primary/10 transition-colors"
                                title="Editar Transação"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} 
                                className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                title="Eliminar Transação"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARD LIST VIEW (SM / XS) */}
            <div className="block md:hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-primary focus:ring-primary/30 w-4 h-4"
                    checked={selectedTransactions.length === paginatedTransactions.length && paginatedTransactions.length > 0}
                    onChange={toggleSelectAll}
                  />
                  Selecionar Todos
                </label>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {paginatedTransactions.length === 0 ? (
                <div className="py-12 px-4 text-center text-slate-500 dark:text-slate-400">
                  <Receipt className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="font-semibold text-sm">Sem registos encontrados</p>
                </div>
              ) : (
                paginatedTransactions.map((t: any) => {
                  const isIncome = t.type === 'income';
                  const isFuture = new Date(t.date) > new Date();
                  const category = categories.find((c: any) => c.id === t.category_id);
                  return (
                    <div 
                      key={t.id} 
                      className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors flex items-start justify-between gap-3 cursor-pointer"
                      onClick={() => toggleSelectTransaction(t.id)}
                    >
                      <div className="mt-1 shrink-0">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-primary focus:ring-primary/30 w-4 h-4 cursor-pointer"
                          checked={selectedTransactions.includes(t.id)}
                          onChange={() => toggleSelectTransaction(t.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
                            {formatDate(t.date)}
                          </span>
                          {isFuture && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100/80 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300/40 whitespace-nowrap shrink-0">
                              <Clock className="w-2.5 h-2.5 shrink-0" /> Em Espera
                            </span>
                          )}
                          {t.payment_method && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap shrink-0">
                              <span className="shrink-0">{PAYMENT_METHODS.find(p => p.id === t.payment_method)?.icon || '💳'}</span>
                              <span className="whitespace-nowrap">{t.payment_method}</span>
                            </span>
                          )}
                          {isTransactionPendingCredit(t) ? (
                            <div className="flex items-center gap-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 whitespace-nowrap shrink-0">
                                <Clock className="w-2.5 h-2.5" /> Pendente
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCreditTxToSettle(t);
                                }}
                                className="text-[10px] font-black text-primary hover:underline px-1.5 py-0.5 rounded bg-primary/10 hover:bg-primary/20 transition-all cursor-pointer"
                              >
                                Fechar
                              </button>
                            </div>
                          ) : isCreditPayment(t.payment_method) ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 whitespace-nowrap shrink-0">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Liquidado
                            </span>
                          ) : null}
                          {t.receipt_image && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setViewingReceipt(t); }}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap shrink-0 ${
                                isPdfDocument(t.receipt_image)
                                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                  : 'bg-primary/10 text-primary'
                              }`}
                            >
                              {isPdfDocument(t.receipt_image) ? <FileText className="w-2.5 h-2.5 shrink-0" /> : <Receipt className="w-2.5 h-2.5 shrink-0" />}
                              <span className="whitespace-nowrap">{isPdfDocument(t.receipt_image) ? "PDF" : "Talão"}</span>
                            </button>
                          )}
                        </div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {t.description || 'Sem descrição'}
                        </p>
                        <div>
                          <span 
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap shrink-0"
                            style={{ 
                              backgroundColor: `${category?.color || '#94a3b8'}15`, 
                              color: category?.color || '#94a3b8' 
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: category?.color || '#94a3b8' }} />
                            <span className="whitespace-nowrap">{category?.name || 'Sem Categoria'}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span className={`text-base font-black ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                            {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                          </span>
                        </div>
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleOpenEdit(t); }} 
                          className="text-slate-400 hover:text-primary p-2 rounded-lg hover:bg-primary/10 transition-colors"
                          title="Editar Transação"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} 
                          className="text-slate-400 hover:text-rose-500 p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Eliminar Transação"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            </div>

            {/* 🌟 BARRA DE TOTAIS E RESUMO DESKTOP & MOBILE (100% VISÍVEL, FORA DO SCROLL LATERAL) */}
            {transactions.length > 0 && (
              <div className="border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-wrap">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Filter className="w-4 h-4" />
                  </div>
                  <span className="uppercase tracking-wider text-[11px] font-black text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    Total {isFilterActive ? "Filtrado" : "Geral"}:
                  </span>
                  <span className="font-black text-sm whitespace-nowrap">
                    {filteredIncomeTotal > 0 && filteredPaidExpenseTotal > 0 ? (
                      <span className="text-slate-900 dark:text-white">
                        Saldo: {formatCurrency(filteredNetTotal)}{" "}
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 ml-1.5">+{formatCurrency(filteredIncomeTotal)}</span>
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 ml-1.5">-{formatCurrency(filteredPaidExpenseTotal)}</span>
                      </span>
                    ) : filteredIncomeTotal > 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm">+{formatCurrency(filteredIncomeTotal)}</span>
                    ) : filteredPaidExpenseTotal > 0 ? (
                      <span className="text-rose-600 dark:text-rose-400 font-black text-sm">-{formatCurrency(filteredPaidExpenseTotal)}</span>
                    ) : (
                      <span className="text-slate-600 dark:text-slate-400 font-black text-sm">0,00 €</span>
                    )}
                    {filteredPendingCreditExpenseTotal > 0 && (
                      <span className="ml-2 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        {formatCurrency(filteredPendingCreditExpenseTotal)} pendente
                      </span>
                    )}
                  </span>
                  {isFilterActive && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs shrink-0">
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[180px] sm:max-w-[260px]">{activeFilterName}</span>
                    </span>
                  )}
                </div>

                <div className="text-right text-slate-500 dark:text-slate-400 font-bold shrink-0">
                  <span className="font-extrabold text-slate-900 dark:text-white">{transactions.length}</span> {transactions.length === 1 ? "transação encontrada" : "transações encontradas"}
                </div>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-4 gap-3 bg-slate-50/50 dark:bg-slate-900/40">
                <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 text-center sm:text-left">
                  A mostrar {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, transactions.length)} de {transactions.length} registos
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                      if (totalPages > 5 && Math.abs(currentPage - page) > 1 && page !== 1 && page !== totalPages) {
                        if (page === 2 || page === totalPages - 1) return <span key={page} className="px-1 text-slate-400 text-xs">...</span>;
                        return null;
                      }
                      
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                            currentPage === page 
                              ? 'bg-primary text-white shadow-md shadow-primary/25' 
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Nova Categoria */}
        {isAddingCategory && (
          <ModalPortal>
            <div className="fixed inset-0 z-[150] w-screen h-screen flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Nova Categoria</h3>
                <input 
                  type="text" 
                  value={newCatName} 
                  onChange={e => setNewCatName(e.target.value)} 
                  placeholder="Ex: Streaming, Ginásio..." 
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none mb-6 text-sm font-medium" 
                  autoFocus
                />
                <div className="flex gap-3">
                  <button 
                    onClick={() => { setIsAddingCategory(false); setNewCatName(""); }} 
                    className="flex-1 py-2.5 font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={confirmAddCategory}
                    disabled={!newCatName.trim()}
                    className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm shadow-lg shadow-primary/20"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* 🖼️ Modal Lightbox do Comprovativo / Talão / PDF */}
        {viewingReceipt && (
          <ModalPortal>
            <div className="fixed inset-0 z-[150] w-screen h-screen flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${isPdfDocument(viewingReceipt.receipt_image) ? 'bg-rose-500/10 text-rose-500' : 'bg-primary/10 text-primary'}`}>
                    {isPdfDocument(viewingReceipt.receipt_image) ? <FileText className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                      {viewingReceipt.description || (isPdfDocument(viewingReceipt.receipt_image) ? "Documento PDF da Transação" : "Comprovativo da Transação")}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {formatDate(viewingReceipt.date)} • {formatCurrency(viewingReceipt.amount)}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingReceipt(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Preview Container */}
              <div className="p-4 overflow-y-auto flex items-center justify-center bg-slate-950/20 max-h-[60vh] min-h-[220px]">
                {isPdfDocument(viewingReceipt.receipt_image) ? (
                  <div className="w-full flex flex-col items-center justify-center py-6 px-4 text-center space-y-4">
                    <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col items-center justify-center text-rose-500 shadow-lg shadow-rose-500/5">
                      <FileText className="w-10 h-10" />
                      <span className="text-[10px] font-black uppercase mt-1">PDF</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">Documento PDF Anexado</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                        Podes abrir o documento PDF numa nova aba ou descarregar diretamente para o teu dispositivo.
                      </p>
                    </div>
                    <a
                      href={viewingReceipt.receipt_image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Abrir PDF em Nova Aba</span>
                    </a>
                  </div>
                ) : (
                  <img 
                    src={viewingReceipt.receipt_image} 
                    alt="Talão da Transação" 
                    className="max-h-[55vh] w-auto max-w-full rounded-xl object-contain shadow-md border border-slate-200/20"
                  />
                )}
              </div>

              {/* Actions Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <a 
                  href={viewingReceipt.receipt_image} 
                  download={isPdfDocument(viewingReceipt.receipt_image) ? `documento-${viewingReceipt.id}.pdf` : `comprovativo-${viewingReceipt.id}.jpg`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-primary" />
                  <span>{isPdfDocument(viewingReceipt.receipt_image) ? "Descarregar PDF" : "Descarregar Imagem"}</span>
                </a>
                <button 
                  onClick={() => setViewingReceipt(null)}
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:opacity-90 transition-all"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
        )}
      </div>

      {/* Category Expenses Summary - Styled with Expenses Card Accent */}
      {expensesByCategory.length > 0 && (
        <div className="mt-8 space-y-4 animate-in slide-in-from-bottom-5 fade-in duration-500 delay-150">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-rose-500" /> 
              Top Categorias de Gastos
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {expensesByCategory.map((cat, idx) => {
              const maxAmount = expensesByCategory[0].amount;
              const percent = maxAmount > 0 ? (cat.amount / maxAmount) * 100 : 0;
              
              return (
                <div 
                  key={cat.id} 
                  className="glass-card p-5 relative overflow-hidden group hover:-translate-y-1.5 transition-all duration-300 border border-slate-200/80 dark:border-slate-800/80"
                  style={{
                    boxShadow: '0 8px 30px -10px var(--card-expenses-glow, rgba(244, 63, 94, 0.15))'
                  }}
                >
                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate" title={cat.name}>
                        {cat.name}
                      </span>
                    </div>
                    <span className="font-extrabold text-sm text-rose-600 dark:text-rose-400 shrink-0">
                      -{formatCurrency(cat.amount)}
                    </span>
                  </div>
                  
                  {/* Progress bar background */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-2 rounded-full overflow-hidden relative z-10">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${percent}%`, 
                        backgroundColor: cat.color 
                      }} 
                    />
                  </div>
                  
                  {/* Ranking Number */}
                  <div className="absolute -right-2 -bottom-4 text-6xl font-black text-slate-900/5 dark:text-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-300">
                    #{idx + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FLOATING ACTION & SUMMARY BAR (PARA SELEÇÃO EM LOTE OU FILTROS ATIVOS) */}
      <div 
        className={`fixed bottom-[74px] left-3 right-[70px] md:bottom-6 md:left-1/2 md:right-auto md:-translate-x-1/2 z-40 md:w-auto md:max-w-lg transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          selectedTransactions.length > 0 || isFilterActive
            ? "translate-y-0 opacity-100 scale-100 pointer-events-auto"
            : "translate-y-8 opacity-0 scale-95 pointer-events-none"
        }`}
      >
        {selectedTransactions.length > 0 ? (
          // Modo 1: Seleção em Lote Ativa via Checkbox
          <div className="glass-panel border border-slate-200/80 dark:border-slate-800 rounded-full p-2 sm:p-2.5 sm:px-4 shadow-2xl flex items-center justify-between gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-black shrink-0">
                {selectedTransactions.length}
              </div>
              <div className="flex items-center gap-1 truncate">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">Total:</span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                  {selectedExpenseTotal > 0 && selectedIncomeTotal === 0 ? (
                    <span className="text-rose-600 dark:text-rose-400">-{formatCurrency(selectedExpenseTotal)}</span>
                  ) : selectedIncomeTotal > 0 && selectedExpenseTotal === 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400">+{formatCurrency(selectedIncomeTotal)}</span>
                  ) : (
                    <span>{formatCurrency(selectedNetTotal)}</span>
                  )}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              {selectedTransactionsList.some((t: any) => isTransactionPendingCredit(t)) && (
                <button
                  type="button"
                  onClick={() => {
                    setCreditTxToSettle(null);
                    setShowSettleCreditModal(true);
                  }}
                  className="bg-primary hover:brightness-110 text-white text-xs px-2.5 sm:px-3 py-1 rounded-full font-bold transition-all flex items-center gap-1 whitespace-nowrap shadow-sm active:scale-95"
                  title="Fechar pagamentos de crédito selecionados"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Fechar Crédito ({selectedTransactionsList.filter((t: any) => isTransactionPendingCredit(t)).length})</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedTransactions([])}
                className="text-xs px-2 sm:px-3 py-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-full transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(true)}
                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs px-2.5 sm:px-3.5 py-1 rounded-full font-bold transition-colors flex items-center gap-1 whitespace-nowrap shadow-sm active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        ) : isFilterActive ? (
          // Modo 2: Resumo Toast Premium do Filtro Ativo
          <div className="glass-panel border border-slate-200/80 dark:border-slate-800 rounded-full p-2 sm:px-4 shadow-2xl flex items-center justify-between gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs shrink-0">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[100px] sm:max-w-[180px]" title={activeFilterName}>
                  {activeFilterName}
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-xs sm:text-sm font-black whitespace-nowrap">
                  {filteredExpenseTotal > 0 && filteredIncomeTotal === 0 ? (
                    <span className="text-rose-600 dark:text-rose-400">-{formatCurrency(filteredExpenseTotal)}</span>
                  ) : filteredIncomeTotal > 0 && filteredExpenseTotal === 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400">+{formatCurrency(filteredIncomeTotal)}</span>
                  ) : (
                    <span className="text-slate-900 dark:text-white">Saldo: {formatCurrency(filteredNetTotal)}</span>
                  )}
                </span>
                <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
                  ({transactions.length} {transactions.length === 1 ? "registo" : "registos"})
                </span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs px-2.5 sm:px-3 py-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center gap-1 font-semibold shrink-0"
              title="Limpar todos os filtros"
            >
              <X className="w-3 h-3" />
              <span>Limpar</span>
            </button>
          </div>
        ) : null}
      </div>

      {/* ✏️ Modal de Edição de Transação */}
      {editingTransaction && (
        <ModalPortal>
          <div className="fixed inset-0 z-[150] w-screen h-screen flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary">
                    <Pencil className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">
                      Editar Transação
                    </h3>
                    <p className="text-xs text-slate-500">
                      Atualiza os detalhes, categoria ou método de pagamento.
                    </p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setEditingTransaction(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveEdit} className="p-5 overflow-y-auto space-y-4 max-h-[70vh]">
                {/* Tipo Switcher */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setEditType("income")}
                    className={`py-2 px-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                      editType === 'income' 
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" /> Receita
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditType("expense")}
                    className={`py-2 px-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                      editType === 'expense' 
                        ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" /> Despesa
                  </button>
                </div>

                {/* Valor e Data */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                      Valor (€)
                    </label>
                    <input 
                      type="number" 
                      step="0.01" 
                      required 
                      value={editAmount} 
                      onChange={e => setEditAmount(e.target.value)} 
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-white/70 dark:bg-slate-800/60 text-slate-900 dark:text-white text-base font-semibold focus:ring-2 focus:ring-primary outline-none" 
                      placeholder="0.00" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                      Data de Execução
                    </label>
                    <input 
                      type="date" 
                      required 
                      value={editDate} 
                      onChange={e => setEditDate(e.target.value)} 
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-white/70 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary outline-none" 
                    />
                  </div>
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Categoria
                  </label>
                  <CustomSelect 
                    required
                    value={editCategoryId} 
                    onChange={val => setEditCategoryId(val as string)} 
                    options={categories.filter((c: any) => c.type === editType).map((cat: any) => ({ value: cat.id, label: cat.name, color: cat.color, icon: cat.icon }))}
                    placeholder="Selecione uma categoria"
                    onAddNew={handleAddNewCategory}
                    addNewLabel="Nova Categoria"
                  />
                </div>

                {/* Método de Pagamento */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Método de Pagamento
                  </label>
                  <CustomSelect 
                    value={editPaymentMethod} 
                    onChange={val => setEditPaymentMethod(val as string)} 
                    options={[
                      { value: "", label: "Selecione o método..." },
                      ...PAYMENT_METHODS.map(pm => ({
                        value: pm.id,
                        label: `${pm.icon} ${pm.label}`
                      }))
                    ]}
                    placeholder="Selecione o método de pagamento"
                  />
                </div>

                {/* 💳 Switcher de Estado de Pagamento no Crédito */}
                {editType === "expense" && isCreditPayment(editPaymentMethod) && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Estado da Fatura / Débito no Saldo
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEditIsPaid(false)}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                          !editIsPaid 
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 shadow-xs' 
                            : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" /> Pendente no Crédito
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditIsPaid(true)}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                          editIsPaid 
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 shadow-xs' 
                            : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Liquidado / Pago
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {!editIsPaid 
                        ? "Este valor NÃO está descontado do teu Saldo Atual." 
                        : "Este valor está DEBITADO do teu Saldo Atual."}
                    </p>
                  </div>
                )}

                {/* Descrição */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Descrição (Opcional)
                  </label>
                  <input 
                    type="text" 
                    value={editDescription} 
                    onChange={e => setEditDescription(e.target.value)} 
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-white/70 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary outline-none" 
                    placeholder="Ex: Supermercado, Salário, etc." 
                  />
                </div>

                {/* Comprovativo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Comprovativo / Fatura (Imagem ou PDF)
                  </label>
                  {editReceiptImage ? (
                    <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-2 flex items-center gap-3">
                      {isPdfDocument(editReceiptImage) ? (
                        <div className="w-14 h-14 rounded-lg bg-rose-500/10 border border-rose-500/20 flex flex-col items-center justify-center text-rose-500 shrink-0">
                          <FileText className="w-6 h-6" />
                          <span className="text-[9px] font-extrabold uppercase mt-0.5">PDF</span>
                        </div>
                      ) : (
                        <img src={editReceiptImage} alt="Comprovativo" className="w-14 h-14 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {isPdfDocument(editReceiptImage) ? "Documento PDF Anexado" : "Comprovativo anexado"}
                        </p>
                        <p className="text-[11px] text-emerald-500 font-semibold">Guardado</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditReceiptImage(null)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Remover anexo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-dashed border-slate-300 dark:border-slate-700 hover:border-primary/60 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 hover:bg-primary/5 transition-all text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-primary">
                      <FileText className="w-4 h-4 text-primary" />
                      <span>Anexar Talão, Fatura ou PDF</span>
                      <input 
                        type="file" 
                        accept="image/*,application/pdf" 
                        className="hidden" 
                        onChange={handleEditFileChange} 
                      />
                    </label>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    type="button"
                    onClick={() => setEditingTransaction(null)}
                    className="px-4 py-2.5 font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={savingEdit}
                    className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary/90 text-white font-bold rounded-xl shadow-md hover:opacity-95 transition-all disabled:opacity-50 text-sm flex items-center gap-2"
                  >
                    {savingEdit ? "A guardar..." : "Guardar Alterações"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* 💳 MODAL DE CONFIRMAÇÃO DE FECHAR PAGAMENTOS NO CRÉDITO */}
      <ConfirmModal
        isOpen={showSettleCreditModal || Boolean(creditTxToSettle)}
        title="Fechar Pagamentos de Crédito"
        description={
          creditTxToSettle
            ? `Tens a certeza de que desejas fechar o pagamento de "${creditTxToSettle.description || 'Despesa no Crédito'}" no valor de ${formatCurrency(creditTxToSettle.amount)}? Este valor será debitado imediatamente do teu Saldo Atual.`
            : selectedTransactions.length > 0 && selectedTransactionsList.some((t: any) => isTransactionPendingCredit(t))
            ? `Tens a certeza de que desejas fechar ${selectedTransactionsList.filter((t: any) => isTransactionPendingCredit(t)).length} pagamentos pendentes selecionados no valor de ${formatCurrency(selectedTransactionsList.filter((t: any) => isTransactionPendingCredit(t)).reduce((acc: number, t: any) => acc + (t.amount || 0), 0))}? Este valor será debitado imediatamente do teu Saldo Atual.`
            : `Tens a certeza de que desejas fechar e liquidar ${pendingCreditTransactions.length} ${pendingCreditTransactions.length === 1 ? 'pagamento pendente' : 'pagamentos pendentes'} no valor total de ${formatCurrency(pendingCreditTotal)}? Este valor será debitado imediatamente do teu Saldo Atual.`
        }
        confirmText={creditTxToSettle ? "Fechar Pagamento" : "Fechar Pagamentos"}
        cancelText="Cancelar"
        variant="primary"
        isLoading={settlingCredit}
        onConfirm={() => {
          if (creditTxToSettle) {
            handleSettleCredit([creditTxToSettle.id]);
          } else if (selectedTransactions.length > 0 && selectedTransactionsList.some((t: any) => isTransactionPendingCredit(t))) {
            const ids = selectedTransactionsList.filter((t: any) => isTransactionPendingCredit(t)).map((t: any) => t.id);
            handleSettleCredit(ids);
            setSelectedTransactions([]);
          } else {
            handleSettleCredit(pendingCreditTransactions.map((t: any) => t.id));
          }
        }}
        onCancel={() => {
          setShowSettleCreditModal(false);
          setCreditTxToSettle(null);
        }}
      />

      {/* MODAL DE EXCLUSÃO EM MASSA */}
      <ConfirmModal
        isOpen={showBulkDeleteModal}
        title={`Excluir ${selectedTransactions.length} Transações`}
        description={`Tem a certeza de que deseja excluir permanentemente as ${selectedTransactions.length} transações selecionadas? Esta ação não pode ser desfeita.`}
        confirmText={`Excluir ${selectedTransactions.length} Transações`}
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDeleteModal(false)}
      />
    </div>
  );
}
