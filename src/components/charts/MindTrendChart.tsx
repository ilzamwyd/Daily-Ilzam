"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { DailyLog } from "@/lib/types";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MICROCOPY } from "@/lib/constants";

export function MindTrendChart({ logs }: { logs: DailyLog[] }) {
  const withData = logs.filter((l) => l.mood != null || l.stress != null || l.energy != null);
  if (withData.length < 2) return <EmptyState message={MICROCOPY.emptyChart} />;

  const data = logs.map((l) => ({
    date: l.date.slice(5),
    mood: l.mood,
    stress: l.stress,
    energy: l.energy,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={[1, 10]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid hsl(var(--border))" }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="mood" stroke="#6366f1" strokeWidth={2.5} dot={false} name="Mood" connectNulls />
        <Line type="monotone" dataKey="stress" stroke="#fb923c" strokeWidth={2.5} dot={false} name="Stress" connectNulls />
        <Line type="monotone" dataKey="energy" stroke="#10b981" strokeWidth={2.5} dot={false} name="Energy" connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}
