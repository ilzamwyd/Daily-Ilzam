import { createClient } from "@/lib/supabase/server";
import { getTransactionsForMonth, getBudgetsForMonth } from "@/lib/data";
import { monthStr, summarizeByCode, needsWantsSave, formatIDR, EXPENSE_CODES } from "@/lib/finance";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { QuickAddTransaction } from "@/components/finance/QuickAddTransaction";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Settings2, FileBarChart } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const month = monthStr();
  const [transactions, budgets] = await Promise.all([
    getTransactionsForMonth(supabase, user.id, month),
    getBudgetsForMonth(supabase, user.id, month),
  ]);

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const remaining = totalIncome - totalExpense;

  const expenseSummary = summarizeByCode(transactions, budgets, month, "expense");
  const nws = needsWantsSave(transactions, totalIncome);
  const monthLabel = new Date(month).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Finance</h1>
          <p className="mt-1 text-sm text-muted-foreground">{monthLabel} — cashflow, budget, and where you stand.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/career/finance/budget">
            <Button variant="soft" size="sm" className="gap-2">
              <Settings2 className="h-4 w-4" /> Set Budget
            </Button>
          </Link>
          <Link href="/career/finance/report">
            <Button variant="soft" size="sm" className="gap-2">
              <FileBarChart className="h-4 w-4" /> Monthly Report
            </Button>
          </Link>
        </div>
      </div>

      {budgets.length === 0 && (
        <EmptyState message="No budget set for this month yet. Set your category budgets first, then log expenses as you go." />
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiCard label="Income" value={formatIDR(totalIncome)} icon="TrendingUp" colorClass="bg-finance-light text-finance" />
        <KpiCard label="Expense" value={formatIDR(totalExpense)} icon="TrendingDown" colorClass="bg-warn-light text-warn" />
        <KpiCard
          label="Remaining"
          value={formatIDR(remaining)}
          sub={remaining >= 0 ? "You're in the green" : "Over this month"}
          icon="Wallet"
          colorClass={remaining >= 0 ? "bg-finance-light text-finance" : "bg-critical-light text-critical"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold">Budget vs Actual</h2>
          <p className="mt-1 text-sm text-muted-foreground">By category group, this month.</p>
          <div className="mt-5 flex flex-col gap-4">
            {expenseSummary.map((c) => (
              <div key={c.code}>
                <div className="mb-1.5 flex items-baseline justify-between text-sm">
                  <span className="font-medium">{c.code}</span>
                  <span className="text-muted-foreground">
                    {formatIDR(c.spent)} / {formatIDR(c.budgeted)}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, c.pctUsed * 100)}%`,
                      backgroundColor: c.pctUsed > 1 ? "#b91c1c" : c.pctUsed > 0.8 ? "#fb923c" : "#0891b2",
                    }}
                  />
                </div>
                {c.budgeted > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.remaining >= 0
                      ? `Sisa ${formatIDR(c.remaining)} → ~${formatIDR(Math.round(c.dailyRec))}/day or ${formatIDR(
                          Math.round(c.weeklyRec)
                        )}/week to stay on budget`
                      : `Over budget by ${formatIDR(Math.abs(c.remaining))}`}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <h2 className="font-display text-lg font-semibold">Needs / Wants / Save</h2>
            <p className="mt-1 text-sm text-muted-foreground">Based on income received this month.</p>
            <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-career" style={{ width: `${Math.max(0, nws.needsPct) * 100}%` }} />
              <div className="h-full bg-social" style={{ width: `${Math.max(0, nws.wantsPct) * 100}%` }} />
              <div className="h-full bg-finance" style={{ width: `${Math.max(0, nws.savePct) * 100}%` }} />
            </div>
            <div className="mt-4 flex flex-col gap-2 text-sm">
              <LegendRow color="bg-career" label="Needs" pct={nws.needsPct} amt={nws.needsAmt} />
              <LegendRow color="bg-social" label="Wants" pct={nws.wantsPct} amt={nws.wantsAmt} />
              <LegendRow color="bg-finance" label="Save" pct={nws.savePct} amt={nws.saveAmt} />
            </div>
          </Card>

          <QuickAddTransaction />
        </div>
      </div>

      {transactions.length > 0 && (
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold">Recent Transactions</h2>
          <div className="mt-4 flex flex-col divide-y divide-border">
            {transactions.slice(0, 12).map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium">{t.category}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.date} · {t.source}
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
      )}
    </div>
  );
}

function LegendRow({ color, label, pct, amt }: { color: string; label: string; pct: number; amt: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        {label}
      </span>
      <span className="text-muted-foreground">
        {(pct * 100).toFixed(0)}% · {formatIDR(Math.round(amt))}
      </span>
    </div>
  );
}
