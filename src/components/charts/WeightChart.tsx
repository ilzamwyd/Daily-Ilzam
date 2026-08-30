"use client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { DailyLog } from "@/lib/types";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MICROCOPY } from "@/lib/constants";

function movingAverage(values: (number | null)[], window = 7) {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1).filter((v): v is number => v != null);
    if (!slice.length) return null;
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

export function WeightChart({ logs }: { logs: DailyLog[] }) {
  const withWeight = logs.filter((l) => l.weight != null);
  if (withWeight.length < 2) return <EmptyState message={MICROCOPY.emptyChart} />;

  const weights = logs.map((l) => l.weight);
  const avg = movingAverage(weights);
  const data = logs.map((l, i) => ({
    date: l.date.slice(5),
    weight: l.weight,
    avg: avg[i] ? Math.round((avg[i] as number) * 10) / 10 : null,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="weightAvg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={["dataMin - 1", "dataMax + 1"]} />
        <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid hsl(var(--border))" }} />
        <Area type="monotone" dataKey="weight" stroke="#a7f3d0" fill="none" strokeWidth={1} dot={false} />
        <Area type="monotone" dataKey="avg" stroke="#10b981" fill="url(#weightAvg)" strokeWidth={3} dot={false} name="7-day average" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
