"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Bell, 
  Search, 
  Star, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  TrendingUp, 
  Target, 
  Shield, 
  Flame, 
  Wallet, 
  Coins, 
  Scale, 
  AlertTriangle, 
  Sliders, 
  Copy, 
  X, 
  ChevronRight, 
  BookOpen, 
  Calendar,
  Unlock,
  Lock
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from "recharts";
import { 
  FinancialNotification, 
  calculateNotificationProjection, 
  getMonthlyProgressiveNotifications,
  getStoredReadIds,
  saveStoredReadIds,
  getStoredFavoriteIds,
  saveStoredFavoriteIds,
  TOTAL_NOTIFICATIONS_COUNT 
} from "@/lib/notificationsData";
import { 
  UserFinancialProfile, 
  getCachedFinancialProfile, 
  refreshUserFinancialProfile 
} from "@/lib/financialContext";
import { toast } from "sonner";

function NotificationsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialId = searchParams.get("id");

  // Perfil Financeiro Real do Utilizador
  const [profile, setProfile] = useState<UserFinancialProfile>(() => getCachedFinancialProfile());

  // Atualizar perfil financeiro ao carregar a página
  useEffect(() => {
    refreshUserFinancialProfile().then((p) => {
      setProfile(p);
    }).catch(() => {});
  }, []);

  // Informações de progressão mensal com base nos dados reais
  const monthlyInfo = useMemo(() => getMonthlyProgressiveNotifications(new Date(), profile), [profile]);

  // Visualização: apenas desbloqueadas no mês corrente vs catálogo completo
  const [showFullCatalog, setShowFullCatalog] = useState(false);

  // Estado de persistência de lidas por mês e ano
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    return getStoredReadIds(monthlyInfo.year, monthlyInfo.month);
  });

  // Sincronizar readIds quando o mês muda
  useEffect(() => {
    setReadIds(getStoredReadIds(monthlyInfo.year, monthlyInfo.month));
  }, [monthlyInfo.year, monthlyInfo.month]);

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    return getStoredFavoriteIds();
  });

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "unread" | "favorites">("all");

  // Lista base ativa (desbloqueadas ou catálogo completo)
  const activePool = useMemo(() => {
    return showFullCatalog ? monthlyInfo.allNotifications : monthlyInfo.unlockedNotifications;
  }, [showFullCatalog, monthlyInfo]);

  // Notificação selecionada para leitura e simulação
  const [selectedNotification, setSelectedNotification] = useState<FinancialNotification>(() => {
    if (initialId) {
      const found = monthlyInfo.allNotifications.find((n) => n.id === initialId);
      if (found) return found;
    }
    return activePool[0] || monthlyInfo.allNotifications[0];
  });

  // Valor personalizado do simulador
  const [customMonthlyValue, setCustomMonthlyValue] = useState<number>(() => {
    return selectedNotification ? selectedNotification.defaultMonthlyValue : 100;
  });

  // Atualizar a notificação selecionada se a lista mudar e a atual não existir
  useEffect(() => {
    if (selectedNotification) {
      const updated = monthlyInfo.allNotifications.find(n => n.id === selectedNotification.id);
      if (updated) {
        setSelectedNotification(updated);
      } else if (activePool.length > 0) {
        setSelectedNotification(activePool[0]);
        setCustomMonthlyValue(activePool[0].defaultMonthlyValue);
      }
    }
  }, [monthlyInfo]);

  // Modal mobile de detalhe
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  // Função para selecionar notificação por ID (com abertura garantida, reset de filtros se necessário e scroll suave)
  const selectNotificationById = (id: string) => {
    const found = monthlyInfo.allNotifications.find((n) => n.id === id);
    if (found) {
      setSelectedNotification(found);
      setCustomMonthlyValue(found.defaultMonthlyValue);
      markAsRead(found.id);

      // Se a notificação for de um dia futuro do mês, ativa a visualização do catálogo completo
      const isInUnlocked = monthlyInfo.unlockedNotifications.some((n) => n.id === id);
      if (!isInUnlocked) {
        setShowFullCatalog(true);
      }

      // Limpar busca e filtros de categoria para que o card selecionado fique visível na lista
      setSearchQuery("");
      setSelectedCategory("all");
      setFilterStatus("all");

      setIsMobileDetailOpen(true);

      // Scroll suave até ao card na coluna esquerda
      setTimeout(() => {
        const el = document.getElementById(`notif-card-${id}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 150);
    }
  };

  // Sincronizar com query param da URL
  useEffect(() => {
    if (initialId) {
      selectNotificationById(initialId);
    }
  }, [initialId, monthlyInfo]);

  // Listener para o evento global 'open-notification' disparado pelo Toast Inteligente
  useEffect(() => {
    const handleOpenNotif = (e: any) => {
      const targetId = e?.detail?.id;
      if (targetId) {
        selectNotificationById(targetId);
      }
    };
    window.addEventListener("open-notification", handleOpenNotif);
    return () => {
      window.removeEventListener("open-notification", handleOpenNotif);
    };
  }, [monthlyInfo]);

  // Atualizar valor customizado ao trocar de notificação
  const handleSelectNotification = (notif: FinancialNotification) => {
    setSelectedNotification(notif);
    setCustomMonthlyValue(notif.defaultMonthlyValue);
    markAsRead(notif.id);
    setIsMobileDetailOpen(true);
  };

  const markAsRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveStoredReadIds(monthlyInfo.year, monthlyInfo.month, next);
      return next;
    });
  };

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      const isFav = next.has(id);
      if (isFav) {
        next.delete(id);
        toast.info("Removido dos favoritos.");
      } else {
        next.add(id);
        toast.success("Adicionado aos favoritos!");
      }
      saveStoredFavoriteIds(next);
      return next;
    });
  };

  const markAllAsRead = () => {
    const allUnlockedIds = new Set(activePool.map((n) => n.id));
    setReadIds((prev) => {
      const next = new Set([...Array.from(prev), ...Array.from(allUnlockedIds)]);
      saveStoredReadIds(monthlyInfo.year, monthlyInfo.month, next);
      toast.success("Todas as notificações ativas foram marcadas como lidas!");
      return next;
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(val);
  };

  const copyAdvice = () => {
    if (!selectedNotification) return;
    const text = `💡 ${selectedNotification.title}\n\n${selectedNotification.summary}\n\n${selectedNotification.fullDescription}`;
    navigator.clipboard.writeText(text);
    toast.success("Dica financeira copiada para a área de transferência!");
  };

  // Filtragem da lista
  const filteredNotifications = useMemo(() => {
    return activePool.filter((notif) => {
      // Filtro de texto
      const matchesSearch =
        searchQuery.trim() === "" ||
        notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notif.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notif.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());

      // Filtro de categoria
      const matchesCategory = selectedCategory === "all" || notif.category === selectedCategory;

      // Filtro de status
      let matchesStatus = true;
      if (filterStatus === "unread") {
        matchesStatus = !readIds.has(notif.id);
      } else if (filterStatus === "favorites") {
        matchesStatus = favoriteIds.has(notif.id);
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [activePool, searchQuery, selectedCategory, filterStatus, readIds, favoriteIds]);

  // Projeção calculada para a notificação ativa
  const projectionData = useMemo(() => {
    return calculateNotificationProjection(
      selectedNotification,
      customMonthlyValue,
      selectedNotification.defaultHorizonYears,
      selectedNotification.annualRate
    );
  }, [selectedNotification, customMonthlyValue]);

  // Tooltip customizado com alto contraste em Dark Mode e Light Mode
  const renderCustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const semVal = payload.find((p: any) => p.dataKey === "semEstrategia")?.value;
      const comVal = payload.find((p: any) => p.dataKey === "comEstrategia")?.value;
      const diff = comVal !== undefined && semVal !== undefined ? comVal - semVal : 0;

      return (
        <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 dark:border-slate-800 p-3.5 rounded-xl shadow-2xl text-white text-xs min-w-[220px] space-y-2">
          <div className="font-extrabold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Projeção</span>
          </div>
          <div className="space-y-1.5">
            {comVal !== undefined && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Com Estratégia:
                </span>
                <span className="font-extrabold text-white">
                  {formatCurrency(comVal)}
                </span>
              </div>
            )}

            {semVal !== undefined && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  Sem Estratégia:
                </span>
                <span className="font-semibold text-slate-300">
                  {formatCurrency(semVal)}
                </span>
              </div>
            )}

            {diff !== 0 && (
              <div className="flex items-center justify-between gap-3 pt-1.5 border-t border-slate-800 text-[11px]">
                <span className="text-emerald-400 font-bold">Ganho Líquido:</span>
                <span className="font-extrabold text-emerald-400">
                  +{formatCurrency(diff)}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Estatísticas Rápidas do Pool Ativo
  const unreadCount = useMemo(() => {
    return activePool.filter((n) => !readIds.has(n.id)).length;
  }, [activePool, readIds]);

  const favoritesCount = favoriteIds.size;

  const totalSimulatedSavings5Years = useMemo(() => {
    const monthlyRate = 0.08 / 12;
    const months = 60;
    const totalMonthly = activePool.slice(0, 10).reduce((acc, n) => acc + n.defaultMonthlyValue, 0);
    return Math.round(totalMonthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate));
  }, [activePool]);

  const getCategoryIcon = (iconType: string) => {
    switch (iconType) {
      case "target":
        return <Target className="w-5 h-5" />;
      case "trending_up":
        return <TrendingUp className="w-5 h-5" />;
      case "piggy":
        return <Coins className="w-5 h-5" />;
      case "shield":
        return <Shield className="w-5 h-5" />;
      case "flame":
        return <Flame className="w-5 h-5" />;
      case "wallet":
        return <Wallet className="w-5 h-5" />;
      case "scale":
        return <Scale className="w-5 h-5" />;
      case "alert":
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  const getBadgeStyle = (category: string) => {
    switch (category) {
      case "poupanca":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "investimentos":
        return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20";
      case "reserva":
        return "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20";
      case "liberdade":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "dividas":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      default:
        return "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20";
    }
  };

  const progressPercentage = Math.round((monthlyInfo.dayOfMonth / monthlyInfo.daysInMonth) * 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 🌟 Cabeçalho da Página com Contexto Mensal Dinâmico */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2.5 sm:gap-3 mb-1">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm shrink-0">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Notificações & Insights de {monthlyInfo.monthName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Desbloqueio progressivo de dicas diárias ao longo do mês com análises completas e simulações.
              </p>
            </div>
          </div>
        </div>

        {/* Ação rápida para marcar todas como lidas */}
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-xs font-bold shrink-0 self-start md:self-auto border border-slate-200/80 dark:border-slate-700/80"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Marcar visíveis como lidas
          </button>
        )}
      </div>

      {/* 📅 Banner de Calendário & Desbloqueio Diário */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border border-primary/20 text-primary shadow-sm shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-primary">
                Dia {monthlyInfo.dayOfMonth} de {monthlyInfo.daysInMonth} • {monthlyInfo.monthName} {monthlyInfo.year}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                +{monthlyInfo.todayNewCount} novas hoje
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              {showFullCatalog 
                ? `A visualizar o catálogo completo com todas as ${TOTAL_NOTIFICATIONS_COUNT} estratégias financeiras.`
                : `${monthlyInfo.unlockedCount} de ${TOTAL_NOTIFICATIONS_COUNT} dicas desbloqueadas até ao dia de hoje (libertação de ~3 a 4 por dia).`
              }
            </p>
          </div>
        </div>

        {/* Alternador de Visualização */}
        <div className="w-full sm:w-auto grid grid-cols-2 sm:flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm shrink-0">
          <button
            onClick={() => setShowFullCatalog(false)}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              !showFullCatalog
                ? "bg-primary text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Deste Mês ({monthlyInfo.unlockedCount})</span>
          </button>

          <button
            onClick={() => setShowFullCatalog(true)}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              showFullCatalog
                ? "bg-primary text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Unlock className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Catálogo ({TOTAL_NOTIFICATIONS_COUNT})</span>
          </button>
        </div>
      </div>

      {/* 📊 KPI Cards de Visão Geral */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">
              {showFullCatalog ? "Total de Dicas" : "Desbloqueadas"}
            </span>
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0 ml-1" />
          </div>
          <p className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white truncate">
            {showFullCatalog ? TOTAL_NOTIFICATIONS_COUNT : `${monthlyInfo.unlockedCount}`}
            <span className="text-xs font-semibold text-slate-400 ml-1">/ 105</span>
          </p>
        </div>

        <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">Não Lidas</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0 ml-1" />
          </div>
          <p className="text-lg sm:text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400 truncate">
            {unreadCount}
          </p>
        </div>

        <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">Favoritas</span>
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-500 shrink-0 ml-1" />
          </div>
          <p className="text-lg sm:text-2xl md:text-3xl font-black text-amber-500 truncate">
            {favoritesCount}
          </p>
        </div>

        <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">Potencial Acumulado</span>
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0 ml-1" />
          </div>
          <p className="text-sm sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white truncate" title={formatCurrency(totalSimulatedSavings5Years)}>
            {formatCurrency(totalSimulatedSavings5Years)}
          </p>
        </div>
      </div>

      {/* 🔍 Barra de Pesquisa e Filtros */}
      <div className="flex flex-col gap-3 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          {/* Input de Busca */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar estratégias, conceitos (50/30/20, juros, café)..."
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Abas de Status */}
          <div className="w-full sm:w-auto grid grid-cols-3 sm:flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shrink-0">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all text-center truncate ${
                filterStatus === "all"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Todas ({activePool.length})
            </button>
            <button
              onClick={() => setFilterStatus("unread")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all text-center truncate ${
                filterStatus === "unread"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Não Lidas ({unreadCount})
            </button>
            <button
              onClick={() => setFilterStatus("favorites")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all text-center truncate ${
                filterStatus === "favorites"
                  ? "bg-white dark:bg-slate-900 text-amber-500 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Favoritas ({favoritesCount})
            </button>
          </div>
        </div>

        {/* Pílulas de Categoria */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {[
            { key: "all", label: "Todas as Categorias" },
            { key: "poupanca", label: "Poupança & Orçamentos" },
            { key: "investimentos", label: "Investimentos & Juros" },
            { key: "reserva", label: "Reserva & Runway" },
            { key: "liberdade", label: "Liberdade Financeira (FIRE)" },
            { key: "dividas", label: "Eliminação de Dívidas" },
            { key: "habitos", label: "Psicologia & Hábitos" },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                selectedCategory === cat.key
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700/80"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 📱💻 Layout Dividido Master-Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUNA ESQUERDA: Lista de Notificações */}
        <div className="lg:col-span-5 flex flex-col gap-3 max-h-[780px] overflow-y-auto pr-1">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Nenhuma notificação encontrada
              </h4>
              <p className="text-xs">Tenta ajustar a tua pesquisa ou filtros.</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isSelected = selectedNotification.id === notif.id;
              const isRead = readIds.has(notif.id);
              const isFav = favoriteIds.has(notif.id);

              return (
                <div
                  key={notif.id}
                  id={`notif-card-${notif.id}`}
                  onClick={() => handleSelectNotification(notif)}
                  className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative group ${
                    isSelected
                      ? "bg-white dark:bg-slate-900 border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/20"
                      : "bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md"
                  }`}
                >
                  {/* Linha de topo: Categoria, Tempo e Favorito */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${getBadgeStyle(notif.category)}`}>
                        {notif.categoryLabel}
                      </span>
                      {notif.isCustomized && (
                        <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> Dados Reais
                        </span>
                      )}
                      {!isRead && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Nova Dica Não Lida" />
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                        {notif.publishedAt}
                      </span>
                      <button
                        onClick={(e) => toggleFavorite(notif.id, e)}
                        className={`p-1 rounded-lg transition-colors ${
                          isFav
                            ? "text-amber-500 hover:text-amber-600"
                            : "text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400"
                        }`}
                        title={isFav ? "Remover dos favoritos" : "Guardar nos favoritos"}
                      >
                        <Star className={`w-4 h-4 ${isFav ? "fill-amber-500" : ""}`} />
                      </button>
                    </div>
                  </div>

                  {/* Título e Resumo */}
                  <h3 className={`text-sm sm:text-[15px] font-bold mb-1.5 line-clamp-1 ${
                    isSelected ? "text-primary" : "text-slate-900 dark:text-white group-hover:text-primary transition-colors"
                  }`}>
                    {notif.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {notif.summary}
                  </p>

                  {/* Rodapé do Card */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {notif.metricLabel}: <strong className="text-primary font-extrabold">{formatCurrency(notif.defaultMonthlyValue)}</strong>
                    </span>
                    <span className="flex items-center gap-1 text-primary font-bold group-hover:translate-x-0.5 transition-transform">
                      Ver análise <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* COLUNA DIREITA: Painel de Leitura Aprofundada & Gráfico Interativo */}
        <div className="hidden lg:flex lg:col-span-7 flex-col gap-6 p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-900/5">
          {/* Header da Notificação Ativa */}
          <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-start gap-3.5">
              <div className={`p-3 rounded-2xl border shrink-0 ${getBadgeStyle(selectedNotification.category)}`}>
                {getCategoryIcon(selectedNotification.iconType)}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${getBadgeStyle(selectedNotification.category)}`}>
                    {selectedNotification.categoryLabel}
                  </span>
                  {selectedNotification.isCustomized && (
                    <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Gerado com os Teus Dados Reais
                    </span>
                  )}
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    • {selectedNotification.publishedAt}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                  {selectedNotification.title}
                </h2>
              </div>
            </div>

            {/* Ações: Favorito e Copiar */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => toggleFavorite(selectedNotification.id)}
                className={`p-2.5 rounded-xl border transition-all ${
                  favoriteIds.has(selectedNotification.id)
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white border-slate-200/80 dark:border-slate-700/80"
                }`}
                title="Favoritar"
              >
                <Star className={`w-4 h-4 ${favoriteIds.has(selectedNotification.id) ? "fill-amber-500" : ""}`} />
              </button>
              <button
                onClick={copyAdvice}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white border border-slate-200/80 dark:border-slate-700/80 transition-all"
                title="Copiar Notificação"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Diagnóstico Detalhado */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Diagnóstico & Análise Financeira
            </h4>
            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-normal bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              {selectedNotification.fullDescription}
            </p>
          </div>

          {/* Cartões de Métricas de Impacto */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                Aporte Simulado
              </span>
              <span className="text-base sm:text-lg font-black text-primary">
                {formatCurrency(customMonthlyValue)}/mês
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-500/20 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                Acumulado 5 Anos
              </span>
              <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(projectionData[Math.min(5, projectionData.length - 1)]?.comEstrategia || 0)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-500/20 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
                Acumulado 10 Anos
              </span>
              <span className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400">
                {formatCurrency(projectionData[Math.min(10, projectionData.length - 1)]?.comEstrategia || 0)}
              </span>
            </div>
          </div>

          {/* Gráfico de Projeção Interativo (Recharts) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                {selectedNotification.chartTitle}
              </h4>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Ganho Líquido: +{formatCurrency(projectionData[projectionData.length - 1]?.diferenca || 0)}
              </span>
            </div>

            <div className="h-64 w-full rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 p-2.5 sm:p-3.5 border border-slate-200/80 dark:border-slate-800/80 shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                {selectedNotification.chartType === "bar" ? (
                  <BarChart data={projectionData} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
                    <XAxis dataKey="period" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }} />
                    <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k€`} tickLine={false} axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }} />
                    <Tooltip content={renderCustomChartTooltip} cursor={{ fill: 'rgba(255, 255, 255, 0.06)', radius: 6 }} />
                    <Legend 
                      wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} 
                      formatter={(val) => <span className="text-slate-700 dark:text-slate-300 font-semibold">{val}</span>} 
                    />
                    <Bar dataKey="semEstrategia" name="Sem a Estratégia" fill="#64748b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="comEstrategia" name="Aplicando a Estratégia" fill="var(--primary, #6366f1)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <AreaChart data={projectionData} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorWithStrategy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary, #6366f1)" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="var(--primary, #6366f1)" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorWithoutStrategy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
                    <XAxis dataKey="period" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }} />
                    <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k€`} tickLine={false} axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }} />
                    <Tooltip 
                      content={renderCustomChartTooltip} 
                      cursor={{ stroke: 'var(--primary, #6366f1)', strokeWidth: 1.5, strokeDasharray: '4 4' }} 
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} 
                      formatter={(val) => <span className="text-slate-700 dark:text-slate-300 font-semibold">{val}</span>} 
                    />
                    <Area
                      type="monotone"
                      dataKey="semEstrategia"
                      name="Sem a Estratégia"
                      stroke="#94a3b8"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#colorWithoutStrategy)"
                    />
                    <Area
                      type="monotone"
                      dataKey="comEstrategia"
                      name="Aplicando a Estratégia"
                      stroke="var(--primary, #6366f1)"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorWithStrategy)"
                      activeDot={{ r: 6, strokeWidth: 2, stroke: '#ffffff', fill: 'var(--primary, #6366f1)' }}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mini-Simulador Interativo com Slider */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-primary" />
                Simulador Dinâmico: Ajusta o teu aporte mensal
              </span>
              <span className="text-sm font-black text-primary">
                {formatCurrency(customMonthlyValue)}/mês
              </span>
            </div>
            <input
              type="range"
              min={selectedNotification.minMonthlyValue}
              max={selectedNotification.maxMonthlyValue}
              step={selectedNotification.stepValue}
              value={customMonthlyValue}
              onChange={(e) => setCustomMonthlyValue(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] font-semibold text-slate-400">
              <span>{formatCurrency(selectedNotification.minMonthlyValue)}</span>
              <span>Arrasta para ver o impacto nos teus números</span>
              <span>{formatCurrency(selectedNotification.maxMonthlyValue)}</span>
            </div>
          </div>

          {/* Checklist de Ação Prática */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Plano de Ação Imediato
            </h4>
            <div className="space-y-2">
              {selectedNotification.actionSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium"
                >
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Atalho para a Aba Recomendada */}
          <div className="pt-2">
            <button
              onClick={() => router.push(selectedNotification.recommendedTab)}
              className="w-full py-3.5 px-5 rounded-2xl bg-primary text-white hover:opacity-90 font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
            >
              <span>{selectedNotification.recommendedTabLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 📱 Modal / Gaveta Mobile para leitura completa da notificação */}
      {isMobileDetailOpen && (
        <div className="lg:hidden fixed inset-0 z-[160] w-screen h-screen flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-200">
            {/* Header Mobile */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850 shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${getBadgeStyle(selectedNotification.category)}`}>
                  {selectedNotification.categoryLabel}
                </span>
                {selectedNotification.isCustomized && (
                  <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Dados Reais
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsMobileDetailOpen(false)}
                className="p-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo com Scroll no Mobile */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-left">
              <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                {selectedNotification.title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                {selectedNotification.fullDescription}
              </p>

              {/* Gráfico Mobile */}
              <div className="h-56 w-full rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 p-2 border border-slate-200/80 dark:border-slate-800/80 shadow-inner">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorWithStrategyMobile" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary, #6366f1)" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="var(--primary, #6366f1)" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorWithoutStrategyMobile" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
                    <XAxis dataKey="period" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }} />
                    <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(v) => `${Math.round(v / 1000)}k€`} tickLine={false} axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }} />
                    <Tooltip content={renderCustomChartTooltip} cursor={{ stroke: 'var(--primary, #6366f1)', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
                    <Area type="monotone" dataKey="semEstrategia" name="Sem Estratégia" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="3 3" fill="url(#colorWithoutStrategyMobile)" fillOpacity={1} />
                    <Area type="monotone" dataKey="comEstrategia" name="Com Estratégia" stroke="var(--primary, #6366f1)" strokeWidth={2.5} fill="url(#colorWithStrategyMobile)" fillOpacity={1} activeDot={{ r: 5, strokeWidth: 2, stroke: '#ffffff', fill: 'var(--primary, #6366f1)' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Mini Simulador Mobile */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Simular Aporte:</span>
                  <span className="text-primary font-black">{formatCurrency(customMonthlyValue)}/mês</span>
                </div>
                <input
                  type="range"
                  min={selectedNotification.minMonthlyValue}
                  max={selectedNotification.maxMonthlyValue}
                  step={selectedNotification.stepValue}
                  value={customMonthlyValue}
                  onChange={(e) => setCustomMonthlyValue(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Checklist de Passos */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Passos Práticos</h4>
                {selectedNotification.actionSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium">
                    <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>

              {/* Botão de Ação */}
              <button
                onClick={() => {
                  setIsMobileDetailOpen(false);
                  router.push(selectedNotification.recommendedTab);
                }}
                className="w-full py-3 px-4 rounded-xl bg-primary text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                <span>{selectedNotification.recommendedTabLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">A carregar notificações...</div>}>
      <NotificationsContent />
    </Suspense>
  );
}
