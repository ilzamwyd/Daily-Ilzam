"use client";
import { formatIDR } from "@/lib/finance";

export function BudgetUsageRing({ totalBudgeted, totalSpent, remaining }: { totalBudgeted: number; totalSpent: number; remaining: number }) {
  const pct = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  const displayPct = Math.round(pct);
  const color = pct > 100 ? "#b91c1c" : pct > 80 ? "#fb923c" : "#0891b2";

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(pct, 100) / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1 rounded-3xl border border-border bg-card p-5 text-center shadow-soft">
      <p className="self-start text-xs font-medium text-muted-foreground">Budget Used</p>
      <div className="relative h-28 w-28">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="9" className="text-muted" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold" style={{ color: totalBudgeted > 0 ? color : undefined }}>
            {totalBudgeted > 0 ? `${displayPct}%` : "—"}
          </span>
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">of {formatIDR(totalBudgeted)} planned</p>
      <p className={`font-display text-xl font-bold ${remaining >= 0 ? "text-finance" : "text-critical"}`}>{formatIDR(remaining)}</p>
      <p className="text-[11px] text-muted-foreground">left to spend this period</p>
    </div>
  );
}
