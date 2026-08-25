"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Wallet, 
  TrendingUp, 
  LogOut, 
  Settings, 
  X, 
  Moon, 
  Sun, 
  Monitor, 
  PieChart, 
  Download, 
  FileText, 
  LineChart, 
  Lightbulb, 
  User,
  Palette,
  Layers,
  Sparkles,
  RotateCcw,
  Check,
  ChevronLeft, 
  ChevronRight,
  FolderKanban,
  Plus,
  Trash2,
  Edit2
} from "lucide-react";
import { useTheme } from "next-themes";
import { 
  useSettings, 
  PALETTE_PRESETS, 
  CARD_ACCENT_OPTIONS 
} from "@/lib/SettingsContext";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { SmartAdvisorToastManager } from "@/components/SmartAdvisorToast";
import { ConfirmModal } from "@/components/ConfirmModal";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  
  const { theme, setTheme } = useTheme();
  const { 
    itemsPerPage, 
    setItemsPerPage,
    palette,
    setPalette,
    customPrimary,
    setCustomPrimary,
    customSecondary,
    setCustomSecondary,
    historyCardAccent,
    setHistoryCardAccent,
    historyCustomColor,
    setHistoryCustomColor,
    resetToDefaults
  } = useSettings();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<"general" | "palette" | "cards" | "groups">("general");
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState("PL Finance");
  const [displayName, setDisplayName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getInitials = (nameStr: string) => {
    if (!nameStr) return "U";
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nameStr.charAt(0).toUpperCase();
  };

  // Category Colors Management in Settings
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "expense" | "income">("all");
  const [updatingCatId, setUpdatingCatId] = useState<number | null>(null);

  // Category Groups Management in Settings
  const [groupsList, setGroupsList] = useState<any[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [groupFormName, setGroupFormName] = useState("");
  const [groupFormColor, setGroupFormColor] = useState("#6366f1");
  const [groupFormType, setGroupFormType] = useState<"expense" | "income">("expense");
  const [groupFormSelectedCatIds, setGroupFormSelectedCatIds] = useState<number[]>([]);
  const [savingGroup, setSavingGroup] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<{ id: number; name: string } | null>(null);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);

  const fetchCategoriesAndGroups = async () => {
    try {
      const [catsRes, groupsRes] = await Promise.all([
        api.get("/categories"),
        api.get("/category-groups")
      ]);
      setCategoriesList(catsRes.data);
      setGroupsList(groupsRes.data);
    } catch (err) {
      console.error("Erro ao buscar categorias e grupos", err);
    }
  };

  useEffect(() => {
    if (isSettingsOpen) {
      fetchCategoriesAndGroups();
    }
  }, [isSettingsOpen]);

  const handleCategoryColorChange = async (category: any, newColor: string) => {
    setCategoriesList(prev => prev.map(c => c.id === category.id ? { ...c, color: newColor } : c));
    setUpdatingCatId(category.id);
    try {
      await api.put(`/categories/${category.id}`, {
        name: category.name,
        color: newColor,
        type: category.type,
        budget_limit: category.budget_limit,
        group_id: category.group_id
      });
      window.dispatchEvent(new CustomEvent("categories-updated"));
    } catch (err) {
      console.error("Erro ao atualizar cor da categoria", err);
    } finally {
      setUpdatingCatId(null);
    }
  };

  const handleOpenCreateGroup = () => {
    setEditingGroupId(null);
    setGroupFormName("");
    setGroupFormColor("#6366f1");
    setGroupFormType("expense");
    setGroupFormSelectedCatIds([]);
    setIsCreatingGroup(true);
  };

  const handleOpenEditGroup = (group: any) => {
    setEditingGroupId(group.id);
    setGroupFormName(group.name);
    setGroupFormColor(group.color || "#6366f1");
    setGroupFormType(group.type);
    setGroupFormSelectedCatIds(group.category_ids || []);
    setIsCreatingGroup(true);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupFormName.trim()) return;
    setSavingGroup(true);
    try {
      const payload = {
        name: groupFormName.trim(),
        color: groupFormColor,
        type: groupFormType,
        category_ids: groupFormSelectedCatIds
      };

      if (editingGroupId) {
        await api.put(`/category-groups/${editingGroupId}`, payload);
      } else {
        await api.post("/category-groups", payload);
      }

      await fetchCategoriesAndGroups();
      setIsCreatingGroup(false);
      setEditingGroupId(null);
      window.dispatchEvent(new CustomEvent("categories-updated"));
      window.dispatchEvent(new CustomEvent("groups-updated"));
    } catch (err) {
      console.error("Erro ao salvar grupo de categorias", err);
    } finally {
      setSavingGroup(false);
    }
  };

  const confirmDeleteGroup = async () => {
    if (!groupToDelete) return;
    setIsDeletingGroup(true);
    try {
      await api.delete(`/category-groups/${groupToDelete.id}`);
      await fetchCategoriesAndGroups();
      window.dispatchEvent(new CustomEvent("categories-updated"));
      window.dispatchEvent(new CustomEvent("groups-updated"));
      toast.success("Grupo eliminado com sucesso.");
      setGroupToDelete(null);
    } catch (err) {
      console.error("Erro ao eliminar grupo", err);
      toast.error("Erro ao eliminar grupo.");
    } finally {
      setIsDeletingGroup(false);
    }
  };

  const handleSaveDisplayName = async () => {
    const trimmed = displayName.trim();
    if (!trimmed) {
      toast.error("Por favor, introduz um nome válido.");
      return;
    }
    setSavingName(true);
    try {
      const res = await api.put("/users/me/profile", { name: trimmed });
      const finalName = res.data.name || trimmed;
      setUsername(finalName);
      setDisplayName(finalName);
      localStorage.setItem("username", finalName);
      window.dispatchEvent(new CustomEvent("user-updated", { detail: { name: finalName } }));
      toast.success("Nome de exibição atualizado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao atualizar nome:", err);
      toast.error("Não foi possível atualizar o nome.");
    } finally {
      setSavingName(false);
    }
  };

  useEffect(() => {
    const handleUserUpdate = (e: any) => {
      const newName = e.detail?.name || localStorage.getItem("username");
      if (newName) {
        setUsername(newName);
        setDisplayName(newName);
      }
    };
    window.addEventListener("user-updated", handleUserUpdate);
    return () => {
      window.removeEventListener("user-updated", handleUserUpdate);
    };
  }, []);

  useEffect(() => {
    setMounted(true);
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      router.push("/");
    } else {
      setLoading(false);
      const storedName = localStorage.getItem("username");
      if (storedName) {
        setUsername(storedName.charAt(0).toUpperCase() + storedName.slice(1));
        setDisplayName(storedName);
      }
      api.get("/users/me").then(res => {
        if (res.data.name && res.data.name.trim()) {
          setUsername(res.data.name.trim());
          setDisplayName(res.data.name.trim());
          localStorage.setItem("username", res.data.name.trim());
        } else if (res.data.username) {
          if (!storedName) {
            setUsername(res.data.username);
            setDisplayName(res.data.username);
          }
        }
        if (res.data.profile_image) {
          setProfileImage(res.data.profile_image);
        } else {
          const storedImage = localStorage.getItem("profileImage");
          if (storedImage) setProfileImage(storedImage);
        }
      }).catch(err => {
        console.error("Erro ao buscar dados do utilizador", err);
        const storedImage = localStorage.getItem("profileImage");
        if (storedImage) setProfileImage(storedImage);
      });

      // Auto-logout after 15 minutes of inactivity
      let timeoutId: NodeJS.Timeout;
      const resetTimer = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          try {
            await fetch('/api/auth/logout', { method: 'POST' });
          } catch(e) {}
          localStorage.removeItem("isAuthenticated");
          localStorage.removeItem("username");
          router.push("/");
        }, 900 * 1000); // 15 minutes
      };

      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      events.forEach(event => {
        document.addEventListener(event, resetTimer);
      });

      resetTimer();

      return () => {
        clearTimeout(timeoutId);
        events.forEach(event => {
          document.removeEventListener(event, resetTimer);
        });
      };
    }
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch(e) {}
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("username");
    router.push("/");
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-600 dark:text-slate-400 font-medium">A carregar...</div>;
  }

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, mobileLabel: "Início" },
    { name: "Gestão", href: "/dashboard/gestao", icon: Wallet, mobileLabel: "Gestão" },
    { name: "Investir", href: "/dashboard/investimentos", icon: TrendingUp, mobileLabel: "Investir" },
    { name: "Previsão", href: "/dashboard/previsao", icon: LineChart, mobileLabel: "Previsão" },
    { name: "Simular", href: "/dashboard/simulacao", icon: Lightbulb, mobileLabel: "Simular" },
    { name: "Orçamentos", href: "/dashboard/orcamentos", icon: PieChart, mobileLabel: "Orçamentos" },
    { name: "Relatórios", href: "/dashboard/relatorios", icon: FileText, mobileLabel: "Relatórios" },
  ];

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row relative overflow-hidden transition-colors duration-300">
      {/* Background aesthetics dynamically adapting to selected palette */}
      <div 
        className="absolute top-[-10%] right-[-5%] w-[42%] h-[42%] rounded-full blur-[130px] pointer-events-none transition-all duration-700" 
        style={{ backgroundColor: 'var(--bg-glow-1, var(--primary-glow))' }}
      />
      <div 
        className="absolute bottom-[-10%] left-[-5%] w-[42%] h-[42%] rounded-full blur-[130px] pointer-events-none transition-all duration-700" 
        style={{ backgroundColor: 'var(--bg-glow-2, var(--secondary-glow))' }}
      />
      <div 
        className="absolute top-[35%] left-[25%] w-[25%] h-[25%] rounded-full blur-[110px] pointer-events-none transition-all duration-700 opacity-60" 
        style={{ backgroundColor: 'var(--bg-glow-3, var(--primary-glow))' }}
      />

      {/* Top Mobile Bar & Desktop Sidebar Navigation */}
      <nav className={`w-full ${isCollapsed ? 'md:w-20' : 'md:w-64'} bg-white dark:bg-slate-900 md:h-screen md:rounded-none md:border-r border-b md:border-b-0 border-slate-200/50 dark:border-slate-800/50 flex flex-col z-20 transition-all duration-300 relative shrink-0`}>
        {/* Header User profile */}
        <div className={`p-3.5 sm:p-5 flex items-center justify-between md:block ${isCollapsed ? 'md:px-0 md:text-center md:flex md:flex-col md:items-center' : ''}`}>
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              {!profileImage && (
                <div 
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold border-2 shadow-sm transition-all duration-500 text-xs sm:text-sm"
                  style={{
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    borderColor: 'var(--primary)'
                  }}
                >
                  {getInitials(username)}
                </div>
              )}
              {profileImage && (
                <img src={profileImage} alt="Profile" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-primary shadow-sm" />
              )}
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-slate-900 dark:text-white leading-tight truncate text-sm sm:text-base">{username}</span>
                <span className="text-[11px] sm:text-xs text-emerald-500 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Online
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-primary shadow-sm" />
              ) : (
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold border-2 shadow-sm transition-all duration-500 text-xs sm:text-sm"
                  style={{
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    borderColor: 'var(--primary)'
                  }}
                >
                  {getInitials(username)}
                </div>
              )}
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
          )}

          {/* Quick Actions in Mobile Top Bar */}
          <div className="flex items-center gap-2 md:hidden">
            <button 
              onClick={() => setIsSettingsOpen(true)} 
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary rounded-xl bg-slate-100 dark:bg-slate-800 transition-colors" 
              title="Configurações"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button 
              onClick={handleLogout} 
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-xl bg-slate-100 dark:bg-slate-800 transition-colors" 
              title="Terminar Sessão"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Desktop Navigation list (Hidden on mobile) */}
        <div className="hidden md:flex flex-1 px-3 pb-3 md:px-4 md:pb-4 md:pt-2 flex-col gap-1.5 overflow-y-auto min-h-0 [scrollbar-width:none]">
          {navItems.map((item) => {
            const normalizedPathname = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
            const isActive = normalizedPathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 transition-all shrink-0 ${
                  isCollapsed ? 'justify-center w-12 h-12 mx-auto rounded-2xl' : 'py-2.5 px-3.5 sm:py-3 sm:px-4 rounded-xl'
                } font-medium ${
                  isActive 
                  ? "bg-primary text-white border border-white/10 dark:border-white/5 font-semibold" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-transparent"
                }`}
                style={{
                  boxShadow: isActive ? '0 0 22px var(--primary-glow)' : undefined
                }}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-slate-400 dark:text-slate-500"}`} />
                {!isCollapsed && <span className="whitespace-nowrap transition-all duration-300 text-sm sm:text-base">{item.name}</span>}
              </Link>
            );
          })}
        </div>
        
        {/* Desktop Sidebar Footer */}
        <div className="hidden md:flex flex-col p-4 space-y-2 relative border-t border-slate-100 dark:border-slate-800/50">
          <button 
            onClick={() => setIsSettingsOpen(true)} 
            className={`w-full flex items-center gap-3 py-3 text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary-foreground hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all font-medium ${isCollapsed ? 'justify-center px-0' : 'px-4'}`}
            title={isCollapsed ? "Configurações" : undefined}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>Configurações</span>}
          </button>
          <button 
            onClick={handleLogout} 
            className={`w-full flex items-center gap-3 py-3 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all font-medium ${isCollapsed ? 'justify-center px-0' : 'px-4'}`}
            title={isCollapsed ? "Terminar Sessão" : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>Terminar Sessão</span>}
          </button>
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 text-slate-500 hover:text-primary shadow-sm z-50 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* Main Content Area with Bottom Padding for Mobile Nav */}
      <main className="flex-1 p-3.5 sm:p-6 md:p-8 pb-28 md:pb-8 z-10 overflow-y-auto flex flex-col">
        <div className="flex-1 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>

      {/* 📱 Mobile Fixed Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1.5 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] flex items-center justify-around">
        {navItems.map((item) => {
          const normalizedPathname = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
          const isActive = normalizedPathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all relative ${
                isActive 
                  ? "text-primary font-bold" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${
                isActive 
                  ? "bg-primary text-white shadow-sm ring-2 ring-primary/20 scale-105" 
                  : "bg-transparent"
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? "font-bold text-primary dark:text-primary" : "font-medium text-slate-500 dark:text-slate-400"}`}>
                {item.mobileLabel}
              </span>
              {isActive && (
                <span className="absolute -top-1 w-1 h-1 rounded-full bg-primary animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Enhanced Tabbed Settings Modal */}
      {isSettingsOpen && mounted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    Configurações
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Personaliza a tua experiência e preferências
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)} 
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 px-4 sm:px-6 bg-slate-50/30 dark:bg-slate-900/30 shrink-0 overflow-x-auto [scrollbar-width:none]">
              <button
                onClick={() => setActiveSettingsTab("general")}
                className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeSettingsTab === "general"
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                }`}
              >
                <User className="w-4 h-4" /> Geral
              </button>
              <button
                onClick={() => setActiveSettingsTab("palette")}
                className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeSettingsTab === "palette"
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                }`}
              >
                <Palette className="w-4 h-4" /> Paleta de Cores
              </button>
              <button
                onClick={() => setActiveSettingsTab("cards")}
                className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeSettingsTab === "cards"
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                }`}
              >
                <Layers className="w-4 h-4" /> Personalizar Cards
              </button>
              <button
                onClick={() => setActiveSettingsTab("groups")}
                className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeSettingsTab === "groups"
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                }`}
              >
                <FolderKanban className="w-4 h-4" /> Grupos de Categorias
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* TAB 1: GERAL */}
              {activeSettingsTab === "general" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Theme Settings */}
                  <div>
                    <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2.5">
                      Modo de Visualização
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button 
                        onClick={() => setTheme('light')} 
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                          theme === 'light' 
                            ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm' 
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/40 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <Sun className="w-5 h-5 mb-1.5" />
                        <span className="text-xs">Claro</span>
                      </button>
                      <button 
                        onClick={() => setTheme('dark')} 
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                          theme === 'dark' 
                            ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm' 
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/40 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <Moon className="w-5 h-5 mb-1.5" />
                        <span className="text-xs">Escuro</span>
                      </button>
                      <button 
                        onClick={() => setTheme('system')} 
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                          theme === 'system' 
                            ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm' 
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/40 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <Monitor className="w-5 h-5 mb-1.5" />
                        <span className="text-xs">Sistema</span>
                      </button>
                    </div>
                  </div>

                  {/* Pagination Settings */}
                  <div>
                    <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2.5">
                      Itens por Página (Tabelas e Listas)
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[10, 25, 50, 100].map(val => (
                        <button
                          key={val}
                          onClick={() => setItemsPerPage(val)}
                          className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl border-2 transition-all ${
                            itemsPerPage === val 
                              ? 'border-primary bg-primary text-white shadow-sm' 
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary/40 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Display Name Setting */}
                  <div>
                    <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Nome de Exibição (Perfil)
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2.5">
                      Personaliza como queres ser chamado(a) nas saudações e em todo o painel interno.
                    </p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSaveDisplayName();
                            }
                          }}
                          placeholder="Ex: Davi Placco"
                          className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
                        />
                      </div>
                      <button
                        onClick={handleSaveDisplayName}
                        disabled={savingName || !displayName.trim()}
                        className="px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0"
                      >
                        {savingName ? (
                          <span>A guardar...</span>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Guardar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Profile Image Setting */}
                  <div>
                    <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2.5">
                      Foto de Perfil
                    </label>
                    <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/70 dark:border-slate-800">
                      {profileImage ? (
                        <img src={profileImage} alt="Preview" className="w-14 h-14 rounded-full object-cover border-2 border-primary shadow-md shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-700 shrink-0">
                          <User className="w-6 h-6" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <label className="cursor-pointer inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm rounded-xl transition-colors border border-slate-200 dark:border-slate-700 shadow-sm">
                          <span>Carregar Nova Imagem</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = async () => {
                                  const base64String = reader.result as string;
                                  setProfileImage(base64String);
                                  localStorage.setItem("profileImage", base64String);
                                  try {
                                    await api.put("/users/me/profile-image", { profile_image: base64String });
                                  } catch(err) {
                                    console.error("Erro ao salvar imagem no backend", err);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }} 
                          />
                        </label>
                        {profileImage && (
                          <button 
                            onClick={async () => {
                              setProfileImage(null);
                              localStorage.removeItem("profileImage");
                              try {
                                await api.put("/users/me/profile-image", { profile_image: "" });
                              } catch(err) {
                                console.error("Erro ao remover imagem", err);
                              }
                            }}
                            className="text-xs text-rose-500 hover:text-rose-600 font-semibold mt-2 block w-full text-center"
                          >
                            Remover foto
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Export Data Settings */}
                  <div>
                    <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2.5">
                      Exportar Dados da Conta
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={exportToCSV} 
                        className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all font-bold text-xs sm:text-sm bg-white dark:bg-slate-800/60 shadow-sm"
                      >
                        <FileText className="w-4 h-4 text-emerald-500" />
                        Exportar CSV
                      </button>
                      <button 
                        onClick={exportToPDF} 
                        className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-rose-500/50 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all font-bold text-xs sm:text-sm bg-white dark:bg-slate-800/60 shadow-sm"
                      >
                        <Download className="w-4 h-4 text-rose-500" />
                        Exportar PDF
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PALETA DE CORES DA PLATAFORMA */}
              {activeSettingsTab === "palette" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Temas de Cores Premium
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Altera o aspeto visual e os tons de destaque em toda a plataforma
                      </p>
                    </div>
                    <button
                      onClick={resetToDefaults}
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-primary font-semibold transition-colors"
                      title="Restaurar cor padrão"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Padrão
                    </button>
                  </div>

                  {/* Presets Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PALETTE_PRESETS.map((p) => {
                      const isSelected = palette === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPalette(p.id)}
                          className={`p-3.5 rounded-xl border-2 text-left transition-all relative flex flex-col gap-2 ${
                            isSelected
                              ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-md ring-2 ring-primary/20"
                              : "border-slate-200 dark:border-slate-800 hover:border-primary/40 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              {p.preview.map((color, i) => (
                                <span
                                  key={i}
                                  className="w-4 h-4 rounded-full border border-black/10 dark:border-white/10 shadow-sm"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                            {isSelected && (
                              <span className="p-1 bg-primary text-white rounded-full">
                                <Check className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                              {p.name} {p.id === "default" && <span className="text-[10px] text-primary font-extrabold uppercase ml-1">(Padrão)</span>}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {p.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Palette Option */}
                  <div className={`p-4 rounded-xl border-2 transition-all space-y-4 ${
                    palette === "custom"
                      ? "border-primary bg-primary/5 dark:bg-primary/10 ring-2 ring-primary/20"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                          Personalização Livre (Custom Hex)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPalette("custom")}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                          palette === "custom"
                            ? "bg-primary text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                        }`}
                      >
                        {palette === "custom" ? "Ativo" : "Usar Customizado"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                          Cor Primária
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customPrimary}
                            onChange={(e) => {
                              setCustomPrimary(e.target.value);
                              if (palette !== "custom") setPalette("custom");
                            }}
                            className="w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5 bg-transparent"
                          />
                          <input
                            type="text"
                            value={customPrimary}
                            onChange={(e) => {
                              setCustomPrimary(e.target.value);
                              if (palette !== "custom") setPalette("custom");
                            }}
                            placeholder="#8b5cf6"
                            className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary uppercase"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                          Cor Secundária (Gradientes)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customSecondary}
                            onChange={(e) => {
                              setCustomSecondary(e.target.value);
                              if (palette !== "custom") setPalette("custom");
                            }}
                            className="w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5 bg-transparent"
                          />
                          <input
                            type="text"
                            value={customSecondary}
                            onChange={(e) => {
                              setCustomSecondary(e.target.value);
                              if (palette !== "custom") setPalette("custom");
                            }}
                            placeholder="#4f46e5"
                            className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary uppercase"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PERSONALIZAR CARDS & CATEGORIAS */}
              {activeSettingsTab === "cards" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Personalização de Cards e Categorias
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Ajusta o brilho atmosférico dos cards e personaliza a cor individual de cada categoria.
                    </p>
                  </div>

                  {/* Card Histórico de Transações */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-primary" />
                        <div>
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                            Brilho do Carrossel (Últimos Movimentos)
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Efeito de elevação e brilho suave ao passar o cursor (sem linhas de borda)
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                        {historyCardAccent === "default" ? "Paleta Ativa" : historyCardAccent}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                      {CARD_ACCENT_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setHistoryCardAccent(opt.id)}
                          className={`p-2 rounded-lg text-left text-xs font-bold border transition-all flex items-center gap-2 ${
                            historyCardAccent === opt.id
                              ? "border-primary bg-primary/10 text-primary shadow-sm"
                              : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary/40 bg-white dark:bg-slate-800"
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: opt.id === 'default' ? 'var(--primary)' : opt.color }}
                          />
                          <span className="truncate">{opt.name}</span>
                        </button>
                      ))}
                    </div>

                    {historyCardAccent === "custom" && (
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="color"
                          value={historyCustomColor}
                          onChange={(e) => setHistoryCustomColor(e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-slate-300 dark:border-slate-700"
                        />
                        <input
                          type="text"
                          value={historyCustomColor}
                          onChange={(e) => setHistoryCustomColor(e.target.value)}
                          className="px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 uppercase"
                        />
                        <span className="text-xs text-slate-500">Cor personalizada do brilho</span>
                      </div>
                    )}
                  </div>

                  {/* Cores Individuais por Categoria */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-rose-500" />
                        <div>
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                            Cores Individuais das Categorias
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Cada categoria utiliza a sua cor no destaque, barra e brilho de hover nos Maiores Gastos
                          </span>
                        </div>
                      </div>

                      {/* Filter tabs */}
                      <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-900/60 p-1 rounded-lg">
                        {(["all", "expense", "income"] as const).map((filterType) => (
                          <button
                            key={filterType}
                            type="button"
                            onClick={() => setCategoryFilter(filterType)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                              categoryFilter === filterType
                                ? "bg-white dark:bg-slate-800 text-primary shadow-xs"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                          >
                            {filterType === "all" ? "Todas" : filterType === "expense" ? "Despesas" : "Receitas"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Category list */}
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1 pt-2 [scrollbar-width:thin]">
                      {categoriesList.length === 0 ? (
                        <div className="text-center py-6 text-xs text-slate-400">
                          A carregar categorias...
                        </div>
                      ) : (
                        categoriesList
                          .filter(cat => categoryFilter === "all" || cat.type === categoryFilter)
                          .map((cat) => (
                            <div
                              key={cat.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 gap-2.5 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs border border-white/20"
                                  style={{ backgroundColor: cat.color }}
                                />
                                <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                                  {cat.name}
                                </span>
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                                  cat.type === "income" 
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                }`}>
                                  {cat.type === "income" ? "Receita" : "Despesa"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                <div className="flex items-center gap-1">
                                  {["#ef4444", "#f97316", "#f59e0b", "#10b981", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"].map((presetHex) => (
                                    <button
                                      key={presetHex}
                                      type="button"
                                      onClick={() => handleCategoryColorChange(cat, presetHex)}
                                      title={presetHex}
                                      className={`w-3.5 h-3.5 rounded-full border transition-transform hover:scale-125 ${
                                        cat.color === presetHex ? "ring-2 ring-primary scale-110 border-white" : "border-black/10"
                                      }`}
                                      style={{ backgroundColor: presetHex }}
                                    />
                                  ))}
                                </div>

                                <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200 dark:border-slate-700">
                                  <input
                                    type="color"
                                    value={cat.color || "#6366f1"}
                                    onChange={(e) => handleCategoryColorChange(cat, e.target.value)}
                                    className="w-6 h-6 rounded-md cursor-pointer bg-transparent border-0 p-0"
                                    title="Escolher cor personalizada"
                                  />
                                  <span className="font-mono text-[11px] font-bold text-slate-500 uppercase">
                                    {cat.color}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: GRUPOS DE CATEGORIAS */}
              {activeSettingsTab === "groups" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex items-start sm:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Grupos de Categorias
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Agrupa categorias semelhantes (ex: Supermercado + Luz + Renda = &quot;Casa&quot;) para visualização unificada no Dashboard
                      </p>
                    </div>
                    {!isCreatingGroup && (
                      <button
                        onClick={handleOpenCreateGroup}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-sm shadow-primary/20 hover:bg-primary/90 transition-all shrink-0 whitespace-nowrap active:scale-95"
                      >
                        <Plus className="w-4 h-4 shrink-0" /> Novo Grupo
                      </button>
                    )}
                  </div>

                  {/* Create / Edit Form */}
                  {isCreatingGroup && (
                    <form onSubmit={handleSaveGroup} className="p-4 rounded-xl border border-primary/30 bg-primary/5 dark:bg-primary/10 space-y-4 animate-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <FolderKanban className="w-4 h-4 text-primary" />
                          {editingGroupId ? "Editar Grupo" : "Criar Novo Grupo"}
                        </span>
                        <button
                          type="button"
                          onClick={() => { setIsCreatingGroup(false); setEditingGroupId(null); }}
                          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          Cancelar
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Nome do Grupo
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Casa, Alimentação, Trabalho..."
                            value={groupFormName}
                            onChange={(e) => setGroupFormName(e.target.value)}
                            className="w-full px-3 py-2 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Tipo de Movimento
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setGroupFormType("expense");
                                setGroupFormSelectedCatIds([]);
                              }}
                              className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                groupFormType === "expense"
                                  ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                              }`}
                            >
                              Despesa
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setGroupFormType("income");
                                setGroupFormSelectedCatIds([]);
                              }}
                              className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                groupFormType === "income"
                                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                              }`}
                            >
                              Receita
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Color Picker for Group */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Cor do Grupo
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={groupFormColor}
                            onChange={(e) => setGroupFormColor(e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-slate-300 dark:border-slate-700"
                          />
                          <div className="flex items-center gap-1.5">
                            {["#6366f1", "#f43f5e", "#10b981", "#f59e0b", "#06b6d4", "#ec4899", "#8b5cf6"].map((hex) => (
                              <button
                                key={hex}
                                type="button"
                                onClick={() => setGroupFormColor(hex)}
                                className={`w-4 h-4 rounded-full border transition-transform ${
                                  groupFormColor === hex ? "ring-2 ring-primary scale-110" : "border-black/10"
                                }`}
                                style={{ backgroundColor: hex }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Category Selection */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Seleciona as Categorias que compõem este grupo:
                        </label>
                        <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                          {categoriesList.filter(c => c.type === groupFormType).length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-2">Sem categorias deste tipo disponíveis.</p>
                          ) : (
                            categoriesList
                              .filter(c => c.type === groupFormType)
                              .map(cat => {
                                const isChecked = groupFormSelectedCatIds.includes(cat.id);
                                return (
                                  <label
                                    key={cat.id}
                                    className="flex items-center justify-between p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer text-xs"
                                  >
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setGroupFormSelectedCatIds(prev => [...prev, cat.id]);
                                          } else {
                                            setGroupFormSelectedCatIds(prev => prev.filter(id => id !== cat.id));
                                          }
                                        }}
                                        className="rounded border-slate-300 text-primary focus:ring-primary"
                                      />
                                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                      <span className="font-medium text-slate-800 dark:text-slate-200">{cat.name}</span>
                                    </div>
                                    {cat.group_name && cat.group_id !== editingGroupId && (
                                      <span className="text-[10px] text-slate-400">Em: {cat.group_name}</span>
                                    )}
                                  </label>
                                );
                              })
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => { setIsCreatingGroup(false); setEditingGroupId(null); }}
                          className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={savingGroup}
                          className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg shadow-sm hover:opacity-90 transition-all disabled:opacity-50"
                        >
                          {savingGroup ? "A guardar..." : "Guardar Grupo"}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Existing Groups List */}
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 [scrollbar-width:thin]">
                    {groupsList.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                        Nenhum grupo de categorias criado ainda. Clica em &quot;Novo Grupo&quot; para juntar categorias!
                      </div>
                    ) : (
                      groupsList.map(group => {
                        const assignedCats = categoriesList.filter(c => group.category_ids?.includes(c.id));
                        return (
                          <div
                            key={group.id}
                            className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 flex flex-col gap-2 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                                  style={{ backgroundColor: group.color }}
                                />
                                <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">
                                  {group.name}
                                </span>
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                                  group.type === "income" 
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                }`}>
                                  {group.type === "income" ? "Receita" : "Despesa"}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditGroup(group)}
                                  className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                  title="Editar grupo"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setGroupToDelete({ id: group.id, name: group.name })}
                                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                                  title="Eliminar grupo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Subcategories tags */}
                            <div className="flex flex-wrap gap-1.5 items-center pt-1 border-t border-slate-100 dark:border-slate-700/50">
                              <span className="text-[10px] text-slate-400 font-medium">Categorias:</span>
                              {assignedCats.length === 0 ? (
                                <span className="text-[10px] text-slate-400 italic">Nenhuma categoria associada</span>
                              ) : (
                                assignedCats.map(cat => (
                                  <span
                                    key={cat.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-[10px] font-medium text-slate-700 dark:text-slate-300"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                    {cat.name}
                                  </span>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex justify-end shrink-0">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-6 py-2.5 bg-primary text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-0.5 active:scale-95"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💡 Gestor de Toasts Inteligentes (de 10 em 10 min com cruzamento de dados) */}
      <SmartAdvisorToastManager />

      {/* Confirmação de Eliminar Grupo */}
      <ConfirmModal
        isOpen={!!groupToDelete}
        title="Eliminar Grupo de Categorias"
        description={`Tens a certeza que desejas eliminar o grupo "${groupToDelete?.name}"? As categorias associadas serão mantidas.`}
        confirmText="Eliminar Grupo"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeletingGroup}
        onConfirm={confirmDeleteGroup}
        onCancel={() => setGroupToDelete(null)}
      />
    </div>
  );
}
