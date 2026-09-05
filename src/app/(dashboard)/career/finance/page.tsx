"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getTransactionsForRange, getBudgetsForMonths } from "@/lib/data";
import {
  summarizeByCodeForPeriod,
  prorateBudgetsForRange,
  monthKeysForRange,
  daysRemainingInRange,
  needsWantsSave,
  formatIDR,
} from "@/lib/finance";
import { Transaction, MonthlyBudget } from "@/lib/types";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { QuickAddTransaction } from "@/components/finance/QuickAddTransaction";
import { PeriodPicker, Period, resolvePeriod } from "@/components/finance/PeriodPicker";
import { BudgetVsActualChart } from "@/components/finance/BudgetVsActualChart";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Settings2, FileBarChart, GitCompare } from "lucide-react";
import { formatDateISO } from "@/lib/utils";

function defaultPeriod(): Period {
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return { mode: "month", month: monthStr, start: `${monthStr}-01`, end: formatDateISO(now) };
}

function usePeriodData(period: Period) {
  const supabase = createClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);
  const { start, end, label } = resolvePeriod(period);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const monthKeys = monthKeysForRange(start, end);
      const [tx, allBudgets] = await Promise.all([
        getTransactionsForRange(supabase, user.id, start, end),
        getBudgetsForMonths(supabase, user.id, monthKeys),
      ]);
      setTransactions(tx);
      setBudgets(prorateBudgetsForRange(allBudgets, start, end));
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end, refreshTick]);

  const reload = () => setRefreshTick((t) => t + 1);

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const daysLeft = daysRemainingInRange(end);
  const expenseSummary = summarizeByCodeForPeriod(transactions, budgets, daysLeft, "expense");
  const nws = needsWantsSave(transactions, totalIncome);

  return { transactions, budgets, loading, start, end, label, totalIncome, totalExpense, expenseSummary, nws, reload };
}

export default function FinancePage() {
  const [period, setPeriod] = useState<Period>(defaultPeriod());
  const [compareOn, setCompareOn] = useState(false);
  const [comparePeriod, setComparePeriod] = useState<Period>(() => {
    const p = defaultPeriod();
    const [y, m] = p.month.split("-").map(Number);
    const prev = new Date(y, m - 2, 1);
    const prevMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
    const lastDay = new Date(prev.getFullYear(), prev.getMonth() + 1, 0).getDate();
    return { mode: "month", month: prevMonth, start: `${prevMonth}-01`, end: `${prevMonth}-${String(lastDay).padStart(2, "0")}` };
  });

  const a = usePeriodData(period);
  const b = usePeriodData(compareOn ? comparePeriod : period);

  const remaining = a.totalIncome - a.totalExpense;

  if (a.loading) return <div className="flex h-64 items-center justify-center text-muted-foreground">Loading…</div>;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Finance</h1>
          <p className="mt-1 text-sm text-muted-foreground">{a.label} — cashflow, budget, and where you stand.</p>
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

      <Card className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <PeriodPicker period={period} onChange={setPeriod} label="Period" />
          <Button
            type="button"
            variant={compareOn ? "default" : "soft"}
            size="sm"
            className="gap-2"
            onClick={() => setCompareOn((v) => !v)}
          >
            <GitCompare className="h-4 w-4" /> {compareOn ? "Comparing" : "Compare periods"}
          </Button>
        </div>
        {compareOn && <PeriodPicker period={comparePeriod} onChange={setComparePeriod} label="Compare against" />}
      </Card>

      {a.budgets.length === 0 && (
        <EmptyState message="No budget set for this period yet. Set your category budgets first, then log expenses as you go." />
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiCard label="Income" value={formatIDR(a.totalIncome)} icon="TrendingUp" colorClass="bg-finance-light text-finance" />
        <KpiCard label="Expense" value={formatIDR(a.totalExpense)} icon="TrendingDown" colorClass="bg-warn-light text-warn" />
        <KpiCard
          label="Remaining"
          value={formatIDR(remaining)}
          sub={remaining >= 0 ? "You're in the green" : "Over this period"}
          icon="Wallet"
          colorClass={remaining >= 0 ? "bg-finance-light text-finance" : "bg-critical-light text-critical"}
        />
      </div>

      {compareOn && (
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold">Comparison</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {a.label} vs {b.label}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <CompareStat label="Income" valA={a.totalIncome} valB={b.totalIncome} />
            <CompareStat label="Expense" valA={a.totalExpense} valB={b.totalExpense} inverse />
            <CompareStat label="Remaining" valA={a.totalIncome - a.totalExpense} valB={b.totalIncome - b.totalExpense} />
          </div>
          <div className="mt-6">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Spend by category — {a.label} vs {b.label}</p>
            <CompareChart aData={a.expenseSummary} bData={b.expenseSummary} labelA={a.label} labelB={b.label} />
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold">Budget vs Actual</h2>
          <p className="mt-1 text-sm text-muted-foreground">By category group, run-rate budget for {a.label}.</p>
          <div className="mt-4">
            <BudgetVsActualChart data={a.expenseSummary} />
          </div>
          <div className="mt-5 flex flex-col gap-4">
            {a.expenseSummary.map((c) => (
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
                      ? `Sisa ${formatIDR(c.remaining)}${
                          c.dailyRec > 0
                            ? ` → ~${formatIDR(Math.round(c.dailyRec))}/day or ${formatIDR(Math.round(c.weeklyRec))}/week to stay on budget`
                            : ""
                        }`
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
            <p className="mt-1 text-sm text-muted-foreground">Based on income received in {a.label}.</p>
            <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-career" style={{ width: `${Math.max(0, a.nws.needsPct) * 100}%` }} />
              <div className="h-full bg-social" style={{ width: `${Math.max(0, a.nws.wantsPct) * 100}%` }} />
              <div className="h-full bg-finance" style={{ width: `${Math.max(0, a.nws.savePct) * 100}%` }} />
            </div>
            <div className="mt-4 flex flex-col gap-2 text-sm">
              <LegendRow color="bg-career" label="Needs" pct={a.nws.needsPct} amt={a.nws.needsAmt} />
              <LegendRow color="bg-social" label="Wants" pct={a.nws.wantsPct} amt={a.nws.wantsAmt} />
              <LegendRow color="bg-finance" label="Save" pct={a.nws.savePct} amt={a.nws.saveAmt} />
            </div>
          </Card>

          <QuickAddTransaction onSaved={a.reload} />
        </div>
      </div>

      {a.transactions.length > 0 && (
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold">Transactions — {a.label}</h2>
          <div className="mt-4 flex flex-col divide-y divide-border">
            {a.transactions.slice(0, 20).map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium">{t.category}</p>
                  <p className="text-xs text-muted-foreground">
                    Input on {t.date} · {t.source}
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

function CompareStat({ label, valA, valB, inverse }: { label: string; valA: number; valB: number; inverse?: boolean }) {
  const diff = valA - valB;
  const better = inverse ? diff < 0 : diff > 0;
  const pctChange = valB !== 0 ? (diff / Math.abs(valB)) * 100 : 0;
  return (
    <div className="rounded-2xl bg-muted p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-lg font-bold">{formatIDR(valA)}</p>
      <p className={`text-xs font-medium ${diff === 0 ? "text-muted-foreground" : better ? "text-finance" : "text-critical"}`}>
        {diff >= 0 ? "+" : ""}
        {formatIDR(diff)} ({pctChange >= 0 ? "+" : ""}
        {pctChange.toFixed(0)}%) vs {formatIDR(valB)}
      </p>
    </div>
  );
}

function CompareChart({
  aData,
  bData,
  labelA,
  labelB,
}: {
  aData: { code: string; spent: number }[];
  bData: { code: string; spent: number }[];
  labelA: string;
  labelB: string;
}) {
  const codes = Array.from(new Set([...aData.map((d) => d.code), ...bData.map((d) => d.code)]));
  const chartData = codes.map((code) => ({
    code,
    [labelA]: Math.round(aData.find((d) => d.code === code)?.spent ?? 0),
    [labelB]: Math.round(bData.find((d) => d.code === code)?.spent ?? 0),
  }));

  return (
    <div className="grid grid-cols-1 gap-2">
      {chartData.map((row) => {
        const valA = row[labelA] as number;
        const valB = row[labelB] as number;
        const max = Math.max(valA, valB, 1);
        return (
          <div key={row.code} className="text-xs">
            <div className="mb-0.5 flex justify-between">
              <span className="font-medium">{row.code}</span>
              <span className="text-muted-foreground">
                {formatIDR(valA)} vs {formatIDR(valB)}
              </span>
            </div>
            <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-finance" style={{ width: `${(valA / max) * 50}%` }} />
              <div className="h-full bg-warn" style={{ width: `${(valB / max) * 50}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
