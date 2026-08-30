import { Transaction, MonthlyBudget, TransactionType } from "./types";

export const BANK_SOURCES = ["Cash", "Mandiri", "BRI", "BNI", "BCA"] as const;

export const INCOME_CATEGORIES = ["Wages", "Sales", "Gifts", "Refunds", "Other"] as const;

// Code (group) -> subcategories, exactly matching the user's spreadsheet structure.
export const EXPENSE_GROUPS: Record<string, readonly string[]> = {
  Foodies: ["Restaurant", "Snack", "Groceries", "Cafe"],
  Transportation: ["Long Distance", "Online Transportation", "Oil & Gas", "Public Transportation"],
  Accomodation: ["Rent", "Energy & Utilities", "Internet", "Laundry", "Home & Living"],
  Shopping: [
    "Beauty & Personal Care",
    "Health & Wellness",
    "Entertainment",
    "Education",
    "Fashion",
    "Office & Stationery",
    "Gadget & Electronic",
    "Automotive",
    "Gifts & Joy",
    "Subscription",
    "Others",
  ],
  Others: ["Admin Fee", "Emergency"],
};

export const EXPENSE_CODES = Object.keys(EXPENSE_GROUPS);

// Needs vs Wants classification, taken from the exact formula in the user's sheet:
// Needs = Foodies(Restaurant+Snack+Groceries) + all Transportation + all Accomodation + Others(Admin Fee+Emergency)
// Wants = Foodies(Cafe) + all Shopping
const NEEDS_SUBCATS = new Set([
  "Restaurant",
  "Snack",
  "Groceries",
  ...EXPENSE_GROUPS.Transportation,
  ...EXPENSE_GROUPS.Accomodation,
  ...EXPENSE_GROUPS.Others,
]);
const WANTS_SUBCATS = new Set(["Cafe", ...EXPENSE_GROUPS.Shopping]);

export function classifyNeedsWants(category: string): "needs" | "wants" {
  if (NEEDS_SUBCATS.has(category)) return "needs";
  if (WANTS_SUBCATS.has(category)) return "wants";
  return "wants";
}

export function subcategoriesFor(code: string): readonly string[] {
  return EXPENSE_GROUPS[code] ?? [];
}

export function monthStr(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function nowTimeStr(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function daysRemainingInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  const lastDay = new Date(y, m, 0);
  const now = new Date();
  const diff = Math.ceil((lastDay.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff);
}

export interface CategorySpend {
  code: string;
  budgeted: number;
  spent: number;
  remaining: number;
  pctUsed: number;
  dailyRec: number;
  weeklyRec: number;
}

export function summarizeByCode(
  transactions: Transaction[],
  budgets: MonthlyBudget[],
  month: string,
  type: TransactionType = "expense"
): CategorySpend[] {
  const daysLeft = daysRemainingInMonth(month);
  const codes = type === "expense" ? EXPENSE_CODES : ["Income"];
  return codes.map((code) => {
    const budgeted = budgets
      .filter((b) => b.type === type && b.code === code)
      .reduce((s, b) => s + Number(b.budgeted_amount), 0);
    const spent = transactions
      .filter((t) => t.type === type && t.code === code)
      .reduce((s, t) => s + Number(t.amount), 0);
    const remaining = budgeted - spent;
    return {
      code,
      budgeted,
      spent,
      remaining,
      pctUsed: budgeted > 0 ? spent / budgeted : 0,
      dailyRec: remaining > 0 ? remaining / daysLeft : 0,
      weeklyRec: remaining > 0 ? (remaining / daysLeft) * 7 : 0,
    };
  });
}

export interface NeedsWantsSave {
  needsPct: number;
  wantsPct: number;
  savePct: number;
  needsAmt: number;
  wantsAmt: number;
  saveAmt: number;
}

export function needsWantsSave(transactions: Transaction[], totalIncome: number): NeedsWantsSave {
  let needsAmt = 0;
  let wantsAmt = 0;
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    if (classifyNeedsWants(t.category) === "needs") needsAmt += Number(t.amount);
    else wantsAmt += Number(t.amount);
  }
  const saveAmt = totalIncome - needsAmt - wantsAmt;
  const base = totalIncome > 0 ? totalIncome : 1;
  return {
    needsAmt,
    wantsAmt,
    saveAmt,
    needsPct: needsAmt / base,
    wantsPct: wantsAmt / base,
    savePct: saveAmt / base,
  };
}

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    amount
  );
}
