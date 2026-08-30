"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea, CartesianGrid } from "recharts";
import { DailyLog } from "@/lib/types";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MICROCOPY } from "@/lib/constants";

export function SleepTrendChart({ logs, min, max }: { logs: DailyLog[]; min: number; max: number }) {
  const withData = logs.filter((l) => l.sleep_hours != null);
  if (withData.length < 2) return <EmptyState message={MICROCOPY.emptyChart} />;

  const data = logs.map((l) => ({ date: l.date.slice(5), sleep: l.sleep_hours }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid hsl(var(--border))" }} />
        <ReferenceArea y1={min} y2={max} fill="#6366f1" fillOpacity={0.08} />
        <Line type="monotone" dataKey="sleep" stroke="#6366f1" strokeWidth={2.5} dot={false} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}
