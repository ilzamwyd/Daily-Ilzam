"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { DailyLog } from "@/lib/types";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MICROCOPY } from "@/lib/constants";
import { startOfWeek, formatDateISO } from "@/lib/utils";

export function GymWeekChart({ logs }: { logs: DailyLog[] }) {
  if (logs.length < 3) return <EmptyState message={MICROCOPY.emptyChart} />;

  const weekMap = new Map<string, number>();
  logs.forEach((l) => {
    const wk = formatDateISO(startOfWeek(new Date(l.date)));
    if (l.gym) weekMap.set(wk, (weekMap.get(wk) ?? 0) + 1);
    else if (!weekMap.has(wk)) weekMap.set(wk, 0);
  });

  const data = Array.from(weekMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, sessions]) => ({ week: week.slice(5), sessions }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid hsl(var(--border))" }} />
        <Bar dataKey="sessions" fill="#22c55e" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
