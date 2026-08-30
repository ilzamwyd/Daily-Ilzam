"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from "recharts";
import { DailyLog } from "@/lib/types";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MICROCOPY } from "@/lib/constants";

export function StepsChart({ logs, target }: { logs: DailyLog[]; target: number }) {
  const withSteps = logs.filter((l) => l.steps != null);
  if (withSteps.length < 2) return <EmptyState message={MICROCOPY.emptyChart} />;

  const data = logs.map((l) => ({ date: l.date.slice(5), steps: l.steps ?? 0 }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid hsl(var(--border))" }} />
        <ReferenceLine y={target} stroke="#3b82f6" strokeDasharray="4 4" />
        <Bar dataKey="steps" fill="#22c55e" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
