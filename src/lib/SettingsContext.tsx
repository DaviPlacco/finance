"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type SettingsContextType = {
  itemsPerPage: number;
  setItemsPerPage: (val: number) => void;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [itemsPerPage, setItemsPerPageState] = useState(10);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("df_itemsPerPage");
    if (stored) {
      setItemsPerPageState(parseInt(stored));
    }
  }, []);

  const setItemsPerPage = (val: number) => {
    setItemsPerPageState(val);
    localStorage.setItem("df_itemsPerPage", val.toString());
  };

  // Previne erros de hydration renderizando as children de forma transparente ou com defaults até o mount estar concluído
  return (
    <SettingsContext.Provider value={{ itemsPerPage, setItemsPerPage }}>
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
