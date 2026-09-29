export const buildYearOptions = (includeAll = true, allValue = "Todos") => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, index) => String(currentYear + 1 - index));
  const options = years.map((year) => ({ value: year, label: year }));

  return includeAll ? [{ value: allValue, label: "Todos" }, ...options] : options;
};
