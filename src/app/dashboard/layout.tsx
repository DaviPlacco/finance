"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, TrendingUp, LogOut, Settings, X, Moon, Sun, Monitor, PieChart, Download, FileText, LineChart, Lightbulb, User } from "lucide-react";
import { useTheme } from "next-themes";
import { useSettings } from "@/lib/SettingsContext";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  
  const { theme, setTheme } = useTheme();
  const { itemsPerPage, setItemsPerPage } = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState("Finance");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
    } else {
      setLoading(false);
      const storedName = localStorage.getItem("username");
      if (storedName) {
        // capitalize first letter
        setUsername(storedName.charAt(0).toUpperCase() + storedName.slice(1));
      }
      const storedImage = localStorage.getItem("profileImage");
      if (storedImage) {
        setProfileImage(storedImage);
      }

      // Auto-logout after 15 minutes of inactivity
      let timeoutId: NodeJS.Timeout;
      const resetTimer = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          localStorage.removeItem("token");
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    router.push("/");
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">A carregar...</div>;
  }

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Gestão", href: "/dashboard/gestao", icon: Wallet },
    { name: "Investimentos", href: "/dashboard/investimentos", icon: TrendingUp },
    { name: "Previsão", href: "/dashboard/previsao", icon: LineChart },
    { name: "Simulação", href: "/dashboard/simulacao", icon: Lightbulb },
    { name: "Orçamentos", href: "/dashboard/orcamentos", icon: PieChart },
    { name: "Relatórios", href: "/dashboard/relatorios", icon: FileText },
  ];

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row relative overflow-hidden transition-colors duration-300">
      {/* Background aesthetics */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-indigo-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-violet-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[30%] w-[20%] h-[20%] rounded-full bg-fuchsia-600/10 blur-[100px] pointer-events-none" />

      {/* Sidebar Navigation */}
      <nav className={`w-full ${isCollapsed ? 'md:w-20' : 'md:w-64'} bg-white dark:bg-slate-900 md:h-screen md:rounded-none md:border-r border-b md:border-b-0 border-slate-200/50 dark:border-slate-800/50 flex flex-col z-10 transition-all duration-300 relative`}>
        <div className={`p-6 flex items-center justify-between md:block ${isCollapsed ? 'md:px-0 md:text-center md:flex md:flex-col md:items-center' : ''}`}>
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-primary shadow-sm" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold border-2 border-primary shadow-sm">
                  {username.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 dark:text-white leading-tight truncate">{username}</span>
                <span className="text-xs text-emerald-500 font-medium">Online</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-primary shadow-sm" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold border-2 border-primary shadow-sm">
                  {username.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
          )}
          <div className="flex items-center gap-4 md:hidden">
            <button onClick={() => setIsSettingsOpen(true)} className="text-slate-500 hover:text-primary transition-colors">
              <Settings className="w-6 h-6" />
            </button>
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-500 transition-colors">
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 px-4 pb-4 md:pt-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto min-h-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => {
            // Strip trailing slash from pathname for comparison, except for root '/'
            const normalizedPathname = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
            const isActive = normalizedPathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 transition-all ${
                  isCollapsed ? 'justify-center w-12 h-12 mx-auto rounded-2xl' : 'py-3 px-4 rounded-xl'
                } font-medium ${
                  isActive 
                  ? "bg-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.5)] border border-white/10 dark:border-white/5" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-transparent"
                }`}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-slate-400 dark:text-slate-500"}`} />
                {!isCollapsed && <span className="whitespace-nowrap transition-all duration-300">{item.name}</span>}
              </Link>
            );
          })}
        </div>
        
        <div className="hidden md:flex flex-col p-4 space-y-2 relative">
          <button 
            onClick={() => setIsSettingsOpen(true)} 
            className={`w-full flex items-center gap-3 py-3 text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary-foreground hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all font-medium ${isCollapsed ? 'justify-center px-0' : 'px-4'}`}
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

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 z-10 overflow-y-auto flex flex-col">
        <div className="flex-1">
          {children}
        </div>
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && mounted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" /> Configurações
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Theme Settings */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Tema da Plataforma</label>
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => setTheme('light')} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                    <Sun className="w-6 h-6 mb-2" />
                    <span className="text-xs font-bold">Claro</span>
                  </button>
                  <button onClick={() => setTheme('dark')} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                    <Moon className="w-6 h-6 mb-2" />
                    <span className="text-xs font-bold">Escuro</span>
                  </button>
                  <button onClick={() => setTheme('system')} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${theme === 'system' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                    <Monitor className="w-6 h-6 mb-2" />
                    <span className="text-xs font-bold">Sistema</span>
                  </button>
                </div>
              </div>

              {/* Pagination Settings */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Itens por Página (Tabelas)</label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 25, 50, 100].map(val => (
                    <button
                      key={val}
                      onClick={() => setItemsPerPage(val)}
                      className={`py-2 text-sm font-semibold rounded-lg border-2 transition-all ${itemsPerPage === val ? 'border-primary bg-primary text-white' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary/50'}`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
              {/* Profile Image Setting */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Imagem de Perfil</label>
                <div className="flex items-center gap-4">
                  {profileImage ? (
                    <img src={profileImage} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-primary" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-700">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="cursor-pointer flex items-center justify-center gap-2 w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-colors border border-slate-200 dark:border-slate-700">
                      <span>Carregar Imagem</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const base64String = reader.result as string;
                              setProfileImage(base64String);
                              localStorage.setItem("profileImage", base64String);
                            };
                            reader.readAsDataURL(file);
                          }
                        }} 
                      />
                    </label>
                    {profileImage && (
                      <button 
                        onClick={() => {
                          setProfileImage(null);
                          localStorage.removeItem("profileImage");
                        }}
                        className="text-xs text-rose-500 hover:text-rose-600 font-medium mt-2 w-full text-center"
                      >
                        Remover imagem
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Export Data Settings */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Exportar Dados</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={exportToCSV} className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-semibold text-sm">
                    <FileText className="w-5 h-5 text-emerald-500" />
                    Exportar CSV
                  </button>
                  <button onClick={exportToPDF} className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-semibold text-sm">
                    <Download className="w-5 h-5 text-rose-500" />
                    Exportar PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
