import { useState, useEffect } from 'react';

export function useMonthFilter(defaultMode: 'current' | 'all' | 'todos' = 'all') {
  const [filterMonth, setFilterMonthState] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem('davi_finance_month');
    if (cached !== null && cached !== undefined) {
      setFilterMonthState(cached);
    } else {
      if (defaultMode === 'current') {
        setFilterMonthState(String(new Date().getMonth() + 1));
      } else if (defaultMode === 'todos') {
        setFilterMonthState("Todos");
      } else {
        setFilterMonthState("");
      }
    }
    setIsLoaded(true);
  }, [defaultMode]);

  const setFilterMonth = (val: string) => {
    setFilterMonthState(val);
    localStorage.setItem('davi_finance_month', val);
  };

  return [filterMonth, setFilterMonth, isLoaded] as const;
}
