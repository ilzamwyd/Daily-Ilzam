import { createClient } from "@/lib/supabase/server";
import { getTransactionsForMonth, getBudgetsForMonth } from "@/lib/data";
import { summarizeByCode, needsWantsSave, formatIDR, EXPENSE_GROUPS } from "@/lib/finance";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/EmptyState";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export default async function FinanceReportPage({ searchParams }: { searchParams: { month?: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Default to last month — a completed month is what you actually validate against.
  const now = new Date();
  const defaultMonth = shiftMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`, -1);
  const month = searchParams.month ?? defaultMonth;

  const [transactions, budgets] = await Promise.all([
    getTransactionsForMonth(supabase, user.id, month),
    getBudgetsForMonth(supabase, user.id, month),
  ]);

  const monthLabel = new Date(month).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const expenseSummary = summarizeByCode(transactions, budgets, month, "expense");
  const nws = needsWantsSave(transactions, totalIncome);

  // Subcategory-level breakdown, sorted by spend descending.
  const subSpend: Record<string, number> = {};
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    subSpend[t.category] = (subSpend[t.category] ?? 0) + Number(t.amount);
  }
  const topSubcats = Object.entries(subSpend)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const daysInMonth = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();
  const dailyAvg = totalExpense / daysInMonth;

  // Recommendations: flag categories consistently over/under budget.
  const overBudget = expenseSummary.filter((c) => c.budgeted > 0 && c.spent > c.budgeted);
  const underBudget = expenseSummary.filter((c) => c.budgeted > 0 && c.spent < c.budgeted * 0.7);

  const nextMonth = shiftMonth(month, 1);
  const nextMonthLabel = new Date(nextMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Monthly Report</h1>
          <p className="mt-1 text-sm text-muted-foreground">{monthLabel} — a look back, to plan {nextMonthLabel} better.</p>
        </div>
        <div className="flex gap-1">
          <Link href={`/finance/report?month=${shiftMonth(month, -1)}`}>
            <button className="rounded-xl border border-border p-2 hover:bg-muted">
              <ChevronLeft className="h-4 w-4" />
            </button>
          </Link>
          <Link href={`/finance/report?month=${shiftMonth(month, 1)}`}>
            <button className="rounded-xl border border-border p-2 hover:bg-muted">
              <ChevronRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>

      {transactions.length === 0 ? (
        <EmptyState message={`No transactions logged for ${monthLabel} yet.`} />
      ) : (
        <>
          <Card className="p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Income</p>
                <p className="font-display text-lg font-bold text-finance">{formatIDR(totalIncome)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Expense</p>
                <p className="font-display text-lg font-bold">{formatIDR(totalExpense)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Daily Avg Spend</p>
                <p className="font-display text-lg font-bold">{formatIDR(Math.round(dailyAvg))}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-base font-semibold">Needs / Wants / Save — Actual</h2>
            <div className="mt-3 flex flex-col gap-1.5 text-sm">
              <p>Needs: {(nws.needsPct * 100).toFixed(0)}% ({formatIDR(nws.needsAmt)})</p>
              <p>Wants: {(nws.wantsPct * 100).toFixed(0)}% ({formatIDR(nws.wantsAmt)})</p>
              <p>Save: {(nws.savePct * 100).toFixed(0)}% ({formatIDR(nws.saveAmt)})</p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-base font-semibold">Top Spending Categories</h2>
            <div className="mt-3 flex flex-col divide-y divide-border">
              {topSubcats.map(([cat, amt]) => (
                <div key={cat} className="flex items-center justify-between py-2 text-sm">
                  <span>{cat}</span>
                  <span className="font-medium">{formatIDR(amt)}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-base font-semibold">Budget vs Actual by Group</h2>
            <div className="mt-3 flex flex-col gap-3 text-sm">
              {expenseSummary
                .filter((c) => c.budgeted > 0)
                .map((c) => (
                  <div key={c.code} className="flex items-center justify-between">
                    <span>{c.code}</span>
                    <span className={c.spent > c.budgeted ? "font-medium text-critical" : "font-medium text-finance"}>
                      {formatIDR(c.spent)} / {formatIDR(c.budgeted)} ({((c.spent / c.budgeted) * 100).toFixed(0)}%)
                    </span>
                  </div>
                ))}
            </div>
          </Card>

          <Card className="border-2 border-finance/30 bg-finance-light/40 p-6">
            <h2 className="font-display text-base font-semibold">
              Possible Pattern — for {nextMonthLabel}&apos;s budget
            </h2>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              {overBudget.length === 0 && underBudget.length === 0 && (
                <p className="text-muted-foreground">Spending tracked close to plan across the board — no major adjustment needed.</p>
              )}
              {overBudget.map((c) => (
                <p key={c.code}>
                  <strong>{c.code}</strong> ran {formatIDR(c.spent - c.budgeted)} over budget. Consider raising next
                  month&apos;s budget closer to {formatIDR(Math.round(c.spent))}, or watch this category more closely.
                </p>
              ))}
              {underBudget.map((c) => (
                <p key={c.code}>
                  <strong>{c.code}</strong> came in well under budget ({formatIDR(c.spent)} of {formatIDR(c.budgeted)}). You
                  could shift some of that budget elsewhere.
                </p>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
