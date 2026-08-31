"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TrendingUp, AlertTriangle, PiggyBank, Target, X, Lightbulb, ChevronRight, BarChart3 } from "lucide-react";
import { generateSmartInsights, SmartInsight } from "@/lib/smartAdvisor";
import { NOTIFICATIONS_CATALOG } from "@/lib/notificationsData";

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
      
      // Combinar os insights dinâmicos com as 100+ notificações do catálogo
      const catalogInsights: SmartInsight[] = NOTIFICATIONS_CATALOG.map(n => ({
        id: n.id,
        title: n.title,
        message: n.summary,
        type: n.category === "investimentos" ? "compound" : n.category === "reserva" ? "runway" : n.category === "poupanca" ? "savings_rate" : "goal",
        iconType: n.iconType === "trending_up" ? "trending_up" : n.iconType === "shield" || n.iconType === "piggy" ? "piggy" : n.iconType === "alert" ? "alert" : "target"
      }));

      // Intercalar os dinâmicos prioritários com o catálogo completo
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
        let icon = <Lightbulb className="w-5 h-5 text-amber-500" />;
        let iconBg = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
        let badgeText = "DICA INTELIGENTE";

        if (insight.iconType === "target") {
          icon = <Target className="w-5 h-5 text-primary" />;
          iconBg = "bg-primary/10 text-primary border-primary/20";
          badgeText = "META & OBJETIVO";
        } else if (insight.iconType === "trending_up") {
          icon = <TrendingUp className="w-5 h-5 text-emerald-500" />;
          iconBg = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
          badgeText = "PROJEÇÃO FINANCEIRA";
        } else if (insight.iconType === "alert") {
          icon = <AlertTriangle className="w-5 h-5 text-rose-500" />;
          iconBg = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
          badgeText = "AVISO DE ORÇAMENTO";
        } else if (insight.iconType === "piggy") {
          icon = <PiggyBank className="w-5 h-5 text-cyan-500" />;
          iconBg = "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20";
          badgeText = "PATRIMÓNIO & RESERVA";
        }

        const targetUrl = insight.id && insight.id.startsWith("notif_") 
          ? `/dashboard/notificacoes?id=${insight.id}`
          : "/dashboard/notificacoes";

        return (
          <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white border border-slate-200/90 dark:border-slate-800/80 backdrop-blur-xl rounded-2xl p-4 sm:p-5 shadow-xl shadow-slate-900/10 dark:shadow-2xl dark:shadow-black/50 relative flex gap-4 items-start animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Ícone com Badge */}
            <div className={`p-3 rounded-xl border shrink-0 ${iconBg}`}>
              {icon}
            </div>

            {/* Conteúdo */}
            <div className="flex-1 pr-6">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-white/5">
                  {badgeText}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                {insight.title}
              </h4>
              <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {insight.message}
              </p>

              {/* Ações: Ver Análise Completa + Próxima Dica */}
              <div className="mt-3.5 flex items-center justify-between gap-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  onClick={() => {
                    toast.dismiss(t);
                    router.push(targetUrl);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:opacity-80 transition-all active:scale-95"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Ver Análise & Gráfico →
                </button>

                <button
                  onClick={() => {
                    toast.dismiss(t);
                    setTimeout(() => showNextInsight(), 200);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  Outra dica <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Botão Fechar */}
            <button
              onClick={() => toast.dismiss(t)}
              className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
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
