"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from "recharts";
import { EnglishSession } from "@/lib/types";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MICROCOPY } from "@/lib/constants";
import { startOfWeek, formatDateISO } from "@/lib/utils";

export function EnglishSessionsChart({ sessions, target }: { sessions: EnglishSession[]; target: number }) {
  if (sessions.length < 3) return <EmptyState message={MICROCOPY.emptyChart} />;

  const sorted = [...sessions].sort((a, b) => (a.date < b.date ? -1 : 1));

  const byWeek = new Map<string, number>();
  for (const s of sorted) {
    const weekStart = startOfWeek(new Date(s.date));
    const key = formatDateISO(weekStart);
    byWeek.set(key, (byWeek.get(key) ?? 0) + 1);
  }

  // Build a continuous run of weeks so gaps show as zero, not missing bars.
  const firstWeek = startOfWeek(new Date(sorted[0].date));
  const lastWeek = startOfWeek(new Date(sorted[sorted.length - 1].date));
  const data: { week: string; sessions: number }[] = [];
  for (let d = new Date(firstWeek); d <= lastWeek; d.setDate(d.getDate() + 7)) {
    const key = formatDateISO(d);
    data.push({ week: key.slice(5), sessions: byWeek.get(key) ?? 0 });
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid hsl(var(--border))" }} />
        <ReferenceLine y={target} stroke="#a855f7" strokeDasharray="4 4" />
        <Bar dataKey="sessions" fill="#a855f7" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
