"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TrendingUp, AlertTriangle, PiggyBank, Target, X, Lightbulb, ChevronRight, BarChart3, Sparkles } from "lucide-react";
import { generateSmartInsights, SmartInsight } from "@/lib/smartAdvisor";
import { getMonthlyProgressiveNotifications } from "@/lib/notificationsData";

export function SmartAdvisorToastManager() {
  const router = useRouter();
  const insightsCacheRef = useRef<SmartInsight[]>([]);

  const showNextInsight = async () => {
    // 1. Verificação rigorosa de autenticação e rota ativa
    if (typeof window === "undefined") return;
    const isAuth = localStorage.getItem("isAuthenticated") === "true";
    const isDashboard = window.location.pathname.startsWith("/dashboard");
    if (!isAuth || !isDashboard) {
      toast.dismiss();
      insightsCacheRef.current = [];
      return;
    }

    // Atualizar lista de insights caso o cache esteja vazio
    if (insightsCacheRef.current.length === 0) {
      const dynamicList = await generateSmartInsights();
      
      // Obter apenas as notificações desbloqueadas até ao dia de hoje no mês corrente
      const { unlockedNotifications } = getMonthlyProgressiveNotifications();
      
      const catalogInsights: SmartInsight[] = unlockedNotifications.map(n => ({
        id: n.id,
        title: n.title,
        message: n.summary,
        type: n.category === "investimentos" ? "compound" : n.category === "reserva" ? "runway" : n.category === "poupanca" ? "savings_rate" : "goal",
        iconType: n.iconType === "trending_up" ? "trending_up" : n.iconType === "shield" || n.iconType === "piggy" ? "piggy" : n.iconType === "alert" ? "alert" : "target"
      }));

      // Intercalar os dinâmicos com os desbloqueados do mês
      insightsCacheRef.current = [...dynamicList, ...catalogInsights];
    }

    const list = insightsCacheRef.current;
    if (list.length === 0) return;

    // Obter e incrementar índice persistido no localStorage para alternar entre dicas mesmo após recarregar
    let currentIndex = 0;
    try {
      const savedIndex = localStorage.getItem("pl_advisor_last_index");
      if (savedIndex !== null) {
        currentIndex = (parseInt(savedIndex, 10) + 1) % list.length;
      } else {
        currentIndex = Math.floor(Math.random() * list.length);
      }
      localStorage.setItem("pl_advisor_last_index", String(currentIndex));
    } catch {
      currentIndex = Math.floor(Math.random() * list.length);
    }

    const insight = list[currentIndex];

    // Re-checar autenticação antes de disparar o toast na UI
    if (localStorage.getItem("isAuthenticated") !== "true" || !window.location.pathname.startsWith("/dashboard")) {
      toast.dismiss();
      return;
    }

    // Renderizar o Toast Inteligente adaptável a Temas Light/Dark e Paleta de Cores
    toast.custom(
      (t) => {
        let icon = <Lightbulb className="w-4 h-4 text-amber-500" />;
        let iconBg = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
        let badgeText = "DICA DO DIA";

        if (insight.iconType === "target") {
          icon = <Target className="w-4 h-4 text-primary" />;
          iconBg = "bg-primary/10 text-primary border-primary/20";
          badgeText = "META & OBJETIVO";
        } else if (insight.iconType === "trending_up") {
          icon = <TrendingUp className="w-4 h-4 text-emerald-500" />;
          iconBg = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
          badgeText = "PROJEÇÃO FINANCEIRA";
        } else if (insight.iconType === "alert") {
          icon = <AlertTriangle className="w-4 h-4 text-rose-500" />;
          iconBg = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
          badgeText = "AVISO DE ORÇAMENTO";
        } else if (insight.iconType === "piggy") {
          icon = <PiggyBank className="w-4 h-4 text-cyan-500" />;
          iconBg = "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20";
          badgeText = "PATRIMÓNIO & RESERVA";
        }

        const targetId = insight.id && insight.id.startsWith("notif_") 
          ? insight.id 
          : (insight.relatedNotifId || "notif_001");
        const targetUrl = `/dashboard/notificacoes?id=${targetId}`;

        const handleNavigateToNotification = () => {
          toast.dismiss(t);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("open-notification", { detail: { id: targetId } }));
          }
          router.push(targetUrl);
        };

        return (
          <div className="w-[380px] sm:w-[440px] max-w-[94vw] bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200/90 dark:border-slate-800/90 backdrop-blur-xl rounded-2xl p-4 sm:p-5 shadow-2xl shadow-slate-900/15 dark:shadow-black/60 relative flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Linha Superior: Ícone, Badge e Botão Fechar */}
            <div className="flex items-center justify-between gap-2 pr-6">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl border shrink-0 ${iconBg}`}>
                  {icon}
                </div>
                <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-white/5">
                  {badgeText}
                </span>
              </div>
            </div>

            {/* Conteúdo Central */}
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                {insight.title}
              </h4>
              <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {insight.message}
              </p>
            </div>

            {/* Rodapé com Botões Espaçosos e Descomprimidos */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
              <button
                onClick={handleNavigateToNotification}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white hover:opacity-90 font-bold text-xs shadow-md shadow-primary/20 transition-all active:scale-95 shrink-0"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Ver Análise & Gráfico →
              </button>

              <button
                onClick={() => {
                  toast.dismiss(t);
                  setTimeout(() => showNextInsight(), 200);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              >
                Outra dica <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Botão Fechar no Canto Superior */}
            <button
              onClick={() => toast.dismiss(t)}
              className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Fechar dica"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      },
      {
        duration: 16000 // 16 segundos visível para leitura confortável
      }
    );
  };

  useEffect(() => {
    // 1. Mostrar primeira dica inteligente 12 segundos após carregar o dashboard
    const initialTimer = setTimeout(() => {
      showNextInsight();
    }, 12000);

    // 2. Repetir a cada 10 minutos (10 * 60 * 1000 ms)
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    const intervalTimer = setInterval(() => {
      showNextInsight();
    }, TEN_MINUTES_MS);

    // 3. Listener para logout global e purga de toasts
    const handleLogoutEvent = () => {
      toast.dismiss();
      insightsCacheRef.current = [];
    };
    window.addEventListener("auth-logout", handleLogoutEvent);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
      window.removeEventListener("auth-logout", handleLogoutEvent);
      toast.dismiss();
      insightsCacheRef.current = [];
    };
  }, []);

  return null;
}
