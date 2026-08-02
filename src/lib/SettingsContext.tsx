"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type PaletteId = "default" | "emerald" | "gold" | "sapphire" | "neon" | "ruby" | "obsidian" | "custom";

export interface PalettePreset {
  id: PaletteId;
  name: string;
  description: string;
  preview: string[];
  cardGradient: string;
  cardOrb: string;
  light: {
    primary: string;
    secondary: string;
    glow: string;
    bgGlow1: string;
    bgGlow2: string;
    bgGlow3: string;
  };
  dark: {
    primary: string;
    secondary: string;
    glow: string;
    bgGlow1: string;
    bgGlow2: string;
    bgGlow3: string;
  };
}

export const PALETTE_PRESETS: PalettePreset[] = [
  {
    id: "default",
    name: "Default Violet & Indigo",
    description: "O visual clássico e sofisticado original da plataforma",
    preview: ["#8b5cf6", "#4f46e5"],
    cardGradient: "linear-gradient(135deg, #6d28d9 0%, #4338ca 50%, #312e81 100%)",
    cardOrb: "rgba(217, 70, 239, 0.45)",
    light: {
      primary: "#2e1065",
      secondary: "#4f46e5",
      glow: "rgba(139, 92, 246, 0.35)",
      bgGlow1: "rgba(79, 70, 229, 0.15)",
      bgGlow2: "rgba(139, 92, 246, 0.15)",
      bgGlow3: "rgba(192, 38, 211, 0.10)"
    },
    dark: {
      primary: "#8b5cf6",
      secondary: "#818cf8",
      glow: "rgba(139, 92, 246, 0.45)",
      bgGlow1: "rgba(79, 70, 229, 0.18)",
      bgGlow2: "rgba(139, 92, 246, 0.18)",
      bgGlow3: "rgba(192, 38, 211, 0.12)"
    }
  },
  {
    id: "emerald",
    name: "Emerald Wealth",
    description: "Tons esmeralda e menta voltados para prosperidade e crescimento",
    preview: ["#10b981", "#059669"],
    cardGradient: "linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)",
    cardOrb: "rgba(52, 211, 153, 0.45)",
    light: {
      primary: "#064e3b",
      secondary: "#059669",
      glow: "rgba(16, 185, 129, 0.35)",
      bgGlow1: "rgba(5, 150, 105, 0.15)",
      bgGlow2: "rgba(16, 185, 129, 0.15)",
      bgGlow3: "rgba(20, 184, 166, 0.10)"
    },
    dark: {
      primary: "#10b981",
      secondary: "#34d399",
      glow: "rgba(16, 185, 129, 0.45)",
      bgGlow1: "rgba(5, 150, 105, 0.18)",
      bgGlow2: "rgba(16, 185, 129, 0.18)",
      bgGlow3: "rgba(20, 184, 166, 0.12)"
    }
  },
  {
    id: "gold",
    name: "Royal Amber & Gold",
    description: "Dourado luxuoso e tons quentes de âmbar refinado",
    preview: ["#f59e0b", "#d97706"],
    cardGradient: "linear-gradient(135deg, #d97706 0%, #b45309 50%, #78350f 100%)",
    cardOrb: "rgba(251, 191, 36, 0.45)",
    light: {
      primary: "#78350f",
      secondary: "#d97706",
      glow: "rgba(245, 158, 11, 0.35)",
      bgGlow1: "rgba(217, 119, 6, 0.15)",
      bgGlow2: "rgba(245, 158, 11, 0.15)",
      bgGlow3: "rgba(251, 191, 36, 0.10)"
    },
    dark: {
      primary: "#f59e0b",
      secondary: "#fbbf24",
      glow: "rgba(245, 158, 11, 0.45)",
      bgGlow1: "rgba(217, 119, 6, 0.18)",
      bgGlow2: "rgba(245, 158, 11, 0.18)",
      bgGlow3: "rgba(251, 191, 36, 0.12)"
    }
  },
  {
    id: "sapphire",
    name: "Ocean Sapphire",
    description: "Azul marinho profundo com safira tecnológica de alta clareza",
    preview: ["#3b82f6", "#2563eb"],
    cardGradient: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e3a8a 100%)",
    cardOrb: "rgba(96, 165, 250, 0.45)",
    light: {
      primary: "#1e3a8a",
      secondary: "#2563eb",
      glow: "rgba(59, 130, 246, 0.35)",
      bgGlow1: "rgba(37, 99, 235, 0.15)",
      bgGlow2: "rgba(59, 130, 246, 0.15)",
      bgGlow3: "rgba(96, 165, 250, 0.10)"
    },
    dark: {
      primary: "#3b82f6",
      secondary: "#60a5fa",
      glow: "rgba(59, 130, 246, 0.45)",
      bgGlow1: "rgba(37, 99, 235, 0.18)",
      bgGlow2: "rgba(59, 130, 246, 0.18)",
      bgGlow3: "rgba(96, 165, 250, 0.12)"
    }
  },
  {
    id: "neon",
    name: "Cyberpunk Neon",
    description: "Ciano elétrico vibrante com toques fúcsia futuristas",
    preview: ["#06b6d4", "#d946ef"],
    cardGradient: "linear-gradient(135deg, #0891b2 0%, #0e7490 40%, #581c87 100%)",
    cardOrb: "rgba(217, 70, 239, 0.5)",
    light: {
      primary: "#164e63",
      secondary: "#0891b2",
      glow: "rgba(6, 182, 212, 0.35)",
      bgGlow1: "rgba(8, 145, 178, 0.15)",
      bgGlow2: "rgba(217, 70, 239, 0.15)",
      bgGlow3: "rgba(6, 182, 212, 0.10)"
    },
    dark: {
      primary: "#06b6d4",
      secondary: "#d946ef",
      glow: "rgba(6, 182, 212, 0.45)",
      bgGlow1: "rgba(8, 145, 178, 0.18)",
      bgGlow2: "rgba(217, 70, 239, 0.18)",
      bgGlow3: "rgba(6, 182, 212, 0.12)"
    }
  },
  {
    id: "ruby",
    name: "Ruby Crimson",
    description: "Rubi elegante e carmesim aveludado de alto impacto visual",
    preview: ["#f43f5e", "#e11d48"],
    cardGradient: "linear-gradient(135deg, #e11d48 0%, #be123c 50%, #881337 100%)",
    cardOrb: "rgba(251, 113, 133, 0.45)",
    light: {
      primary: "#881337",
      secondary: "#e11d48",
      glow: "rgba(244, 63, 94, 0.35)",
      bgGlow1: "rgba(225, 29, 72, 0.15)",
      bgGlow2: "rgba(244, 63, 94, 0.15)",
      bgGlow3: "rgba(251, 113, 133, 0.10)"
    },
    dark: {
      primary: "#f43f5e",
      secondary: "#fb7185",
      glow: "rgba(244, 63, 94, 0.45)",
      bgGlow1: "rgba(225, 29, 72, 0.18)",
      bgGlow2: "rgba(244, 63, 94, 0.18)",
      bgGlow3: "rgba(251, 113, 133, 0.12)"
    }
  },
  {
    id: "obsidian",
    name: "Obsidian Titanium",
    description: "Titânio minimalista, preto obsidiana e prata espacial moderna",
    preview: ["#94a3b8", "#475569"],
    cardGradient: "linear-gradient(135deg, #334155 0%, #1e293b 50%, #0f172a 100%)",
    cardOrb: "rgba(148, 163, 184, 0.35)",
    light: {
      primary: "#0f172a",
      secondary: "#475569",
      glow: "rgba(148, 163, 184, 0.35)",
      bgGlow1: "rgba(71, 85, 105, 0.12)",
      bgGlow2: "rgba(148, 163, 184, 0.12)",
      bgGlow3: "rgba(100, 116, 139, 0.08)"
    },
    dark: {
      primary: "#94a3b8",
      secondary: "#cbd5e1",
      glow: "rgba(203, 213, 225, 0.35)",
      bgGlow1: "rgba(71, 85, 105, 0.18)",
      bgGlow2: "rgba(148, 163, 184, 0.18)",
      bgGlow3: "rgba(203, 213, 225, 0.10)"
    }
  }
];

export type CardAccentId = "default" | "violet" | "emerald" | "amber" | "sapphire" | "ruby" | "cyan" | "custom";

export interface CardAccentOption {
  id: CardAccentId;
  name: string;
  color: string;
  glow: string;
}

export const CARD_ACCENT_OPTIONS: CardAccentOption[] = [
  { id: "default", name: "Cor da Paleta Ativa", color: "var(--primary)", glow: "var(--primary-glow)" },
  { id: "violet", name: "Violeta / Roxo", color: "#8b5cf6", glow: "rgba(139, 92, 246, 0.4)" },
  { id: "emerald", name: "Esmeralda / Verde", color: "#10b981", glow: "rgba(16, 185, 129, 0.4)" },
  { id: "amber", name: "Âmbar / Ouro", color: "#f59e0b", glow: "rgba(245, 158, 11, 0.4)" },
  { id: "sapphire", name: "Safira / Azul", color: "#3b82f6", glow: "rgba(59, 130, 246, 0.4)" },
  { id: "ruby", name: "Rubi / Rosa", color: "#f43f5e", glow: "rgba(244, 63, 94, 0.4)" },
  { id: "cyan", name: "Ciano / Neon", color: "#06b6d4", glow: "rgba(6, 182, 212, 0.4)" }
];

type SettingsContextType = {
  itemsPerPage: number;
  setItemsPerPage: (val: number) => void;
  palette: PaletteId;
  setPalette: (val: PaletteId) => void;
  customPrimary: string;
  setCustomPrimary: (val: string) => void;
  customSecondary: string;
  setCustomSecondary: (val: string) => void;
  historyCardAccent: CardAccentId;
  setHistoryCardAccent: (val: CardAccentId) => void;
  historyCustomColor: string;
  setHistoryCustomColor: (val: string) => void;
  topExpensesCardAccent: CardAccentId;
  setTopExpensesCardAccent: (val: CardAccentId) => void;
  topExpensesCustomColor: string;
  setTopExpensesCustomColor: (val: string) => void;
  resetToDefaults: () => void;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [itemsPerPage, setItemsPerPageState] = useState(10);
  const [palette, setPaletteState] = useState<PaletteId>("default");
  const [customPrimary, setCustomPrimaryState] = useState("#8b5cf6");
  const [customSecondary, setCustomSecondaryState] = useState("#4f46e5");
  const [historyCardAccent, setHistoryCardAccentState] = useState<CardAccentId>("default");
  const [historyCustomColor, setHistoryCustomColorState] = useState("#8b5cf6");
  const [topExpensesCardAccent, setTopExpensesCardAccentState] = useState<CardAccentId>("default");
  const [topExpensesCustomColor, setTopExpensesCustomColorState] = useState("#f43f5e");
  const [mounted, setMounted] = useState(false);
  const [isDarkState, setIsDarkState] = useState(true);

  useEffect(() => {
    setMounted(true);
    const storedItems = localStorage.getItem("df_itemsPerPage");
    if (storedItems) setItemsPerPageState(parseInt(storedItems));

    const storedPalette = localStorage.getItem("df_palette") as PaletteId;
    if (storedPalette) setPaletteState(storedPalette);

    const storedCustPrim = localStorage.getItem("df_customPrimary");
    if (storedCustPrim) setCustomPrimaryState(storedCustPrim);

    const storedCustSec = localStorage.getItem("df_customSecondary");
    if (storedCustSec) setCustomSecondaryState(storedCustSec);

    const storedHistAcc = localStorage.getItem("df_historyCardAccent") as CardAccentId;
    if (storedHistAcc) setHistoryCardAccentState(storedHistAcc);

    const storedHistCust = localStorage.getItem("df_historyCustomColor");
    if (storedHistCust) setHistoryCustomColorState(storedHistCust);

    const storedExpAcc = localStorage.getItem("df_topExpensesCardAccent") as CardAccentId;
    if (storedExpAcc) setTopExpensesCardAccentState(storedExpAcc);

    const storedExpCust = localStorage.getItem("df_topExpensesCustomColor");
    if (storedExpCust) setTopExpensesCustomColorState(storedExpCust);

    if (typeof window !== "undefined") {
      const root = document.documentElement;
      setIsDarkState(root.classList.contains("dark") || (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches));
    }
  }, []);

  // Compute active colors
  const activePreset = PALETTE_PRESETS.find((p) => p.id === palette) || PALETTE_PRESETS[0];
  const activeColors = isDarkState ? activePreset.dark : activePreset.light;

  const resolvedPrimary = palette === "custom" ? customPrimary : activeColors.primary;
  const resolvedSecondary = palette === "custom" ? customSecondary : activeColors.secondary;
  const resolvedGlow = palette === "custom" ? `${customPrimary}55` : activeColors.glow;

  // Apply CSS Variables dynamically based on palette and dark mode
  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    const isDark = root.classList.contains("dark") || (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDarkState(isDark);

    // Apply Palette Colors & Ambient Background Glows
    if (palette === "custom") {
      root.style.setProperty("--primary", customPrimary);
      root.style.setProperty("--secondary", customSecondary);
      root.style.setProperty("--primary-glow", `${customPrimary}55`);
      root.style.setProperty("--secondary-glow", `${customSecondary}55`);
      root.style.setProperty("--card-hero-gradient", `linear-gradient(135deg, ${customPrimary} 0%, ${customSecondary} 100%)`);
      root.style.setProperty("--card-hero-orb", `${customPrimary}70`);
      root.style.setProperty("--bg-glow-1", `${customPrimary}26`);
      root.style.setProperty("--bg-glow-2", `${customSecondary}26`);
      root.style.setProperty("--bg-glow-3", `${customPrimary}1a`);
    } else {
      const preset = PALETTE_PRESETS.find((p) => p.id === palette) || PALETTE_PRESETS[0];
      const colors = isDark ? preset.dark : preset.light;
      root.style.setProperty("--primary", colors.primary);
      root.style.setProperty("--secondary", colors.secondary);
      root.style.setProperty("--primary-glow", colors.glow);
      root.style.setProperty("--secondary-glow", colors.glow);
      root.style.setProperty("--card-hero-gradient", preset.cardGradient);
      root.style.setProperty("--card-hero-orb", preset.cardOrb);
      root.style.setProperty("--bg-glow-1", colors.bgGlow1);
      root.style.setProperty("--bg-glow-2", colors.bgGlow2);
      root.style.setProperty("--bg-glow-3", colors.bgGlow3);
    }

    // Apply History Card Accent
    if (historyCardAccent === "custom") {
      root.style.setProperty("--card-history-accent", historyCustomColor);
      root.style.setProperty("--card-history-glow", `${historyCustomColor}44`);
    } else if (historyCardAccent !== "default") {
      const opt = CARD_ACCENT_OPTIONS.find((o) => o.id === historyCardAccent);
      if (opt) {
        root.style.setProperty("--card-history-accent", opt.color);
        root.style.setProperty("--card-history-glow", opt.glow);
      }
    } else {
      root.style.setProperty("--card-history-accent", "var(--primary)");
      root.style.setProperty("--card-history-glow", "var(--primary-glow)");
    }

    // Apply Top Expenses Card Accent
    if (topExpensesCardAccent === "custom") {
      root.style.setProperty("--card-expenses-accent", topExpensesCustomColor);
      root.style.setProperty("--card-expenses-glow", `${topExpensesCustomColor}44`);
    } else if (topExpensesCardAccent !== "default") {
      const opt = CARD_ACCENT_OPTIONS.find((o) => o.id === topExpensesCardAccent);
      if (opt) {
        root.style.setProperty("--card-expenses-accent", opt.color);
        root.style.setProperty("--card-expenses-glow", opt.glow);
      }
    } else {
      root.style.setProperty("--card-expenses-accent", "var(--primary)");
      root.style.setProperty("--card-expenses-glow", "var(--primary-glow)");
    }

    // Observer for dark mode class toggles on html tag
    const observer = new MutationObserver(() => {
      const currentlyDark = root.classList.contains("dark");
      setIsDarkState(currentlyDark);
      if (palette !== "custom") {
        const preset = PALETTE_PRESETS.find((p) => p.id === palette) || PALETTE_PRESETS[0];
        const colors = currentlyDark ? preset.dark : preset.light;
        root.style.setProperty("--primary", colors.primary);
        root.style.setProperty("--secondary", colors.secondary);
        root.style.setProperty("--primary-glow", colors.glow);
        root.style.setProperty("--secondary-glow", colors.glow);
        root.style.setProperty("--card-hero-gradient", preset.cardGradient);
        root.style.setProperty("--card-hero-orb", preset.cardOrb);
        root.style.setProperty("--bg-glow-1", colors.bgGlow1);
        root.style.setProperty("--bg-glow-2", colors.bgGlow2);
        root.style.setProperty("--bg-glow-3", colors.bgGlow3);
      }
    });

    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [palette, customPrimary, customSecondary, historyCardAccent, historyCustomColor, topExpensesCardAccent, topExpensesCustomColor]);

  const setItemsPerPage = (val: number) => {
    setItemsPerPageState(val);
    localStorage.setItem("df_itemsPerPage", val.toString());
  };

  const setPalette = (val: PaletteId) => {
    setPaletteState(val);
    localStorage.setItem("df_palette", val);
  };

  const setCustomPrimary = (val: string) => {
    setCustomPrimaryState(val);
    localStorage.setItem("df_customPrimary", val);
  };

  const setCustomSecondary = (val: string) => {
    setCustomSecondaryState(val);
    localStorage.setItem("df_customSecondary", val);
  };

  const setHistoryCardAccent = (val: CardAccentId) => {
    setHistoryCardAccentState(val);
    localStorage.setItem("df_historyCardAccent", val);
  };

  const setHistoryCustomColor = (val: string) => {
    setHistoryCustomColorState(val);
    localStorage.setItem("df_historyCustomColor", val);
  };

  const setTopExpensesCardAccent = (val: CardAccentId) => {
    setTopExpensesCardAccentState(val);
    localStorage.setItem("df_topExpensesCardAccent", val);
  };

  const setTopExpensesCustomColor = (val: string) => {
    setTopExpensesCustomColorState(val);
    localStorage.setItem("df_topExpensesCustomColor", val);
  };

  const resetToDefaults = () => {
    setPaletteState("default");
    setHistoryCardAccentState("default");
    setTopExpensesCardAccentState("default");
    localStorage.removeItem("df_palette");
    localStorage.removeItem("df_customPrimary");
    localStorage.removeItem("df_customSecondary");
    localStorage.removeItem("df_historyCardAccent");
    localStorage.removeItem("df_historyCustomColor");
    localStorage.removeItem("df_topExpensesCardAccent");
    localStorage.removeItem("df_topExpensesCustomColor");
  };

  return (
    <SettingsContext.Provider
      value={{
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
        topExpensesCardAccent,
        setTopExpensesCardAccent,
        topExpensesCustomColor,
        setTopExpensesCustomColor,
        resetToDefaults,
        primaryColor: resolvedPrimary,
        secondaryColor: resolvedSecondary,
        glowColor: resolvedGlow
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
