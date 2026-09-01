"use client";
import { Segmented } from "@/components/ui/segmented";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type PeriodMode = "month" | "range";
export interface Period {
  mode: PeriodMode;
  month: string; // YYYY-MM
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
}

export function resolvePeriod(p: Period): { start: string; end: string; label: string } {
  if (p.mode === "month") {
    const [y, m] = p.month.split("-").map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    const start = `${p.month}-01`;
    const end = `${p.month}-${String(lastDay).padStart(2, "0")}`;
    const label = new Date(start).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    return { start, end, label };
  }
  return { start: p.start, end: p.end, label: `${p.start} → ${p.end}` };
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function PeriodPicker({ period, onChange, label }: { period: Period; onChange: (p: Period) => void; label?: string }) {
  return (
    <div className="flex flex-col gap-2">
      {label && <p className="text-xs font-medium text-muted-foreground">{label}</p>}
      <Segmented
        options={["month", "range"] as const}
        value={period.mode}
        onChange={(mode) => onChange({ ...period, mode })}
        activeClassName="bg-finance text-white border-finance"
      />
      {period.mode === "month" ? (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onChange({ ...period, month: shiftMonth(period.month, -1) })}
            className="rounded-xl border border-border p-2 hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-32 text-center text-sm font-medium">
            {new Date(`${period.month}-01`).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
          <button
            onClick={() => onChange({ ...period, month: shiftMonth(period.month, 1) })}
            className="rounded-xl border border-border p-2 hover:bg-muted"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input type="date" className="w-40" value={period.start} onChange={(e) => onChange({ ...period, start: e.target.value })} />
          <Input type="date" className="w-40" value={period.end} onChange={(e) => onChange({ ...period, end: e.target.value })} />
        </div>
      )}
    </div>
  );
}
