export interface AccountTransaction {
  id?: number | string | null;
  amount?: number | string | null;
  type?: string | null;
  payment_method?: string | null;
  is_paid?: boolean | number | string | null;
  is_transfer?: boolean | null;
  category_id?: number | string | null;
}

export interface ExpenseCategory {
  id?: number | string | null;
  name?: string | null;
  type?: string | null;
  exclude_from_expenses?: boolean | null;
}

const legacyInvestmentCategoryNames = new Set(["investimento", "investimentos"]);

export const isExcludedExpenseCategory = (category?: ExpenseCategory | null) => {
  if (!category) return false;
  if (typeof category.exclude_from_expenses === "boolean") {
    return category.exclude_from_expenses;
  }

  const normalizedType = String(category.type || "expense").trim().toLocaleLowerCase("pt-PT");
  const normalizedName = String(category.name || "").trim().toLocaleLowerCase("pt-PT");
  return normalizedType === "expense" && legacyInvestmentCategoryNames.has(normalizedName);
};

const isExplicitlyTrue = (value: AccountTransaction["is_paid"]) =>
  value === true || value === 1 || String(value).toLowerCase() === "true" || String(value) === "1";

const isExplicitlyFalse = (value: AccountTransaction["is_paid"]) =>
  value === false || value === 0 || String(value).toLowerCase() === "false" || String(value) === "0";

export const isCreditPayment = (paymentMethod?: string | null) => {
  const normalized = String(paymentMethod || "").toLocaleLowerCase("pt-PT");
  return normalized.includes("crédito") || normalized.includes("credito");
};

export const getSettledTransactionIds = (): number[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem("pl_settled_tx_ids");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(Number).filter(Number.isFinite) : [];
  } catch {
    return [];
  }
};

export const markTransactionsAsSettledLocally = (ids: number[]) => {
  if (typeof window === "undefined" || ids.length === 0) return;

  try {
    const updated = Array.from(new Set([...getSettledTransactionIds(), ...ids.map(Number)]));
    localStorage.setItem("pl_settled_tx_ids", JSON.stringify(updated));
  } catch {
    // O backend continua a ser a fonte de verdade quando o armazenamento local está indisponível.
  }
};

export const isTransactionPendingCredit = (
  transaction: AccountTransaction,
  settledIds: number[] = getSettledTransactionIds(),
) => {
  if (transaction?.type !== "expense" || !isCreditPayment(transaction.payment_method)) return false;
  if (isExplicitlyTrue(transaction.is_paid)) return false;

  const transactionId = Number(transaction.id);
  return !Number.isFinite(transactionId) || !settledIds.includes(transactionId);
};

export const isTransactionPaid = (
  transaction: AccountTransaction,
  settledIds: number[] = getSettledTransactionIds(),
) => {
  if (transaction?.type !== "expense") return true;
  if (isCreditPayment(transaction.payment_method)) {
    return !isTransactionPendingCredit(transaction, settledIds);
  }
  return !isExplicitlyFalse(transaction.is_paid);
};

export const getExcludedExpenseCategoryIds = (categories: ExpenseCategory[]) =>
  new Set(
    categories
      .filter(isExcludedExpenseCategory)
      .map((category) => String(category.id)),
  );

export const calculateTransactionTotals = (
  transactions: AccountTransaction[],
  settledIds: number[] = getSettledTransactionIds(),
  excludedExpenseCategoryIds: ReadonlySet<string> = new Set(),
) => {
  let income = 0;
  let accountCredits = 0;
  let accountDebits = 0;
  let paidExpense = 0;
  let pendingCreditExpense = 0;

  transactions.forEach((transaction) => {
    const amount = Number(transaction.amount) || 0;

    if (transaction.type === "income") {
      accountCredits += amount;
      if (!transaction.is_transfer) income += amount;
      return;
    }

    if (transaction.type !== "expense") return;

    const isExcludedExpense = excludedExpenseCategoryIds.has(String(transaction.category_id));

    if (isTransactionPendingCredit(transaction, settledIds)) {
      if (!isExcludedExpense) pendingCreditExpense += amount;
    } else if (isTransactionPaid(transaction, settledIds)) {
      accountDebits += amount;
      if (!isExcludedExpense) paidExpense += amount;
    }
  });

  return {
    income,
    accountCredits,
    accountDebits,
    paidExpense,
    pendingCreditExpense,
    netSavings: income - paidExpense,
    accountBalance: accountCredits - accountDebits,
  };
};

export const calculateSavingsGoalProgress = (netSavings: number, targetAmount: number) => {
  const currentValue = Math.max(0, netSavings);
  const progress = targetAmount > 0 ? (currentValue / targetAmount) * 100 : 0;

  return {
    currentValue,
    progress,
    remainingDistance: Math.max(0, targetAmount - currentValue),
    hasDeficit: netSavings < 0,
    deficitAmount: Math.max(0, -netSavings),
  };
};
