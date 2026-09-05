import { createClient } from "@/lib/supabase/server";
import { getTransactionsForMonth, getBudgetsForMonth } from "@/lib/data";
import { summarizeByCode, summarizeSubcategoriesForPeriod, needsWantsSave, remainingBySource, formatIDR, EXPENSE_CODES } from "@/lib/finance";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { BudgetVsActualChart } from "@/components/finance/BudgetVsActualChart";
import { NeedsWantsSaveDonut } from "@/components/finance/NeedsWantsSaveDonut";
import { BudgetUsageRing } from "@/components/finance/BudgetUsageRing";
import { PrintReportButton } from "@/components/finance/PrintReportButton";
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
  const sourceBreakdown = remainingBySource(transactions);

  const totalBudgeted = expenseSummary.reduce((s, c) => s + c.budgeted, 0);
  const totalSpentForBudget = expenseSummary.reduce((s, c) => s + c.spent, 0);
  const budgetRemaining = expenseSummary.reduce((s, c) => s + c.remaining, 0);

  const daysInMonth = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();
  const dailyAvg = totalExpense / daysInMonth;

  const overBudget = expenseSummary.filter((c) => c.budgeted > 0 && c.spent > c.budgeted);
  const underBudget = expenseSummary.filter((c) => c.budgeted > 0 && c.spent < c.budgeted * 0.7);

  const nextMonth = shiftMonth(month, 1);
  const nextMonthLabel = new Date(nextMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const sortedTransactions = [...transactions].sort((a, b) => (a.date === b.date ? (a.time < b.time ? 1 : -1) : a.date < b.date ? 1 : -1));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 print:max-w-none">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Monthly Report</h1>
          <p className="mt-1 text-sm text-muted-foreground">{monthLabel} — a look back, to plan {nextMonthLabel} better.</p>
        </div>
        <div className="flex items-center gap-2">
          <PrintReportButton />
          <div className="flex gap-1">
            <Link href={`/career/finance/report?month=${shiftMonth(month, -1)}`}>
              <button className="rounded-xl border border-border p-2 hover:bg-muted">
                <ChevronLeft className="h-4 w-4" />
              </button>
            </Link>
            <Link href={`/career/finance/report?month=${shiftMonth(month, 1)}`}>
              <button className="rounded-xl border border-border p-2 hover:bg-muted">
                <ChevronRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="hidden print:block">
        <h1 className="font-display text-2xl font-bold">Daily Ilzam — Finance Report</h1>
        <p className="text-sm text-muted-foreground">{monthLabel}</p>
      </div>

      {transactions.length === 0 ? (
        <EmptyState message={`No transactions logged for ${monthLabel} yet.`} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 print:grid-cols-4">
            <Card className="p-5 text-center">
              <p className="text-xs text-muted-foreground">Income</p>
              <p className="mt-1 font-display text-xl font-bold text-finance">{formatIDR(totalIncome)}</p>
            </Card>
            <Card className="p-5 text-center">
              <p className="text-xs text-muted-foreground">Expense</p>
              <p className="mt-1 font-display text-xl font-bold">{formatIDR(totalExpense)}</p>
            </Card>
            <Card className="p-5 text-center">
              <p className="text-xs text-muted-foreground">Daily Avg Spend</p>
              <p className="mt-1 font-display text-xl font-bold">{formatIDR(Math.round(dailyAvg))}</p>
            </Card>
            <Card className={`p-5 text-center ${totalIncome - totalExpense >= 0 ? "" : "border-critical/40"}`}>
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className={`mt-1 font-display text-xl font-bold ${totalIncome - totalExpense >= 0 ? "text-finance" : "text-critical"}`}>
                {formatIDR(totalIncome - totalExpense)}
              </p>
            </Card>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 print:grid-cols-2">
            <Card className="p-6">
              <h2 className="font-display text-base font-semibold">Budget vs Actual</h2>
              <BudgetVsActualChart data={expenseSummary} />
            </Card>
            <Card className="flex flex-col items-center p-6">
              <h2 className="self-start font-display text-base font-semibold">Needs / Wants / Save</h2>
              <NeedsWantsSaveDonut needsAmt={nws.needsAmt} wantsAmt={nws.wantsAmt} saveAmt={nws.saveAmt} />
            </Card>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 print:grid-cols-2">
            <Card className="p-6">
              <BudgetUsageRing totalBudgeted={totalBudgeted} totalSpent={totalSpentForBudget} remaining={budgetRemaining} />
            </Card>
            <Card className="p-6">
              <h2 className="font-display text-base font-semibold">Remaining by Source</h2>
              <div className="mt-3 flex flex-col divide-y divide-border">
                {sourceBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No transactions logged.</p>
                ) : (
                  sourceBreakdown.map((s) => (
                    <div key={s.source} className="flex items-center justify-between py-2 text-sm">
                      <span className="font-medium">{s.source}</span>
                      <span className={s.remaining >= 0 ? "font-semibold text-finance" : "font-semibold text-critical"}>
                        {formatIDR(s.remaining)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="font-display text-base font-semibold">Budget vs Actual — Full Breakdown</h2>
            <div className="mt-4 flex flex-col gap-5">
              {EXPENSE_CODES.map((code) => {
                const groupSummary = expenseSummary.find((c) => c.code === code);
                const subcats = summarizeSubcategoriesForPeriod(transactions, budgets, code);
                if (!groupSummary || (groupSummary.budgeted === 0 && groupSummary.spent === 0)) return null;
                return (
                  <div key={code}>
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span>{code}</span>
                      <span className={groupSummary.spent > groupSummary.budgeted ? "text-critical" : "text-finance"}>
                        {formatIDR(groupSummary.spent)} / {formatIDR(groupSummary.budgeted)}
                      </span>
                    </div>
                    {subcats.length > 0 && (
                      <div className="mt-2 flex flex-col gap-1 pl-3">
                        {subcats.map((s) => (
                          <div key={s.category} className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{s.category}</span>
                            <span>
                              {formatIDR(s.spent)} / {formatIDR(s.budgeted)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
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

          <Card className="p-6 print:break-inside-avoid-page">
            <h2 className="font-display text-base font-semibold">All Transactions — {monthLabel} ({transactions.length})</h2>
            <div className="mt-3 flex flex-col divide-y divide-border text-sm">
              {sortedTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 print:break-inside-avoid">
                  <div>
                    <p className="font-medium">{t.category}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.date} {t.time} · {t.source}
                      {t.note ? ` · ${t.note}` : ""}
                    </p>
                  </div>
                  <p className={t.type === "income" ? "font-semibold text-finance" : "font-semibold"}>
                    {t.type === "income" ? "+" : "-"}
                    {formatIDR(Number(t.amount))}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
