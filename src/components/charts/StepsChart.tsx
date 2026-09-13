"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid, Cell } from "recharts";
import { DailyLog } from "@/lib/types";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MICROCOPY } from "@/lib/constants";
import { fillDateGaps } from "@/lib/utils";

export function StepsChart({ logs, target }: { logs: DailyLog[]; target: number }) {
  const withSteps = logs.filter((l) => l.steps != null);
  if (withSteps.length < 2) return <EmptyState message={MICROCOPY.emptyChart} />;

  // Fill calendar gaps so skipped days show up as a visible gap on the
  // timeline instead of silently disappearing — but never as a 0 bar.
  const filled = fillDateGaps(logs, (date) => ({ date } as DailyLog));
  const data = filled.map((l) => ({
    date: l.date.slice(5),
    steps: l.notLogged ? null : l.steps ?? null,
    notLogged: !!l.notLogged,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: 16, border: "1px solid hsl(var(--border))" }}
          formatter={(value: unknown, _name: unknown, item: unknown) => {
            const payload = (item as { payload?: { notLogged?: boolean } })?.payload;
            return [payload?.notLogged ? "Not logged" : value, "Steps"] as [string | number, string];
          }}
        />
        <ReferenceLine y={target} stroke="#3b82f6" strokeDasharray="4 4" />
        <Bar dataKey="steps" radius={[6, 6, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.notLogged ? "transparent" : "#22c55e"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
