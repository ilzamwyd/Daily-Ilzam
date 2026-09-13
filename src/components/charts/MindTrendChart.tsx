"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { DailyLog } from "@/lib/types";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MICROCOPY } from "@/lib/constants";
import { fillDateGaps } from "@/lib/utils";

export function MindTrendChart({ logs }: { logs: DailyLog[] }) {
  const withData = logs.filter((l) => l.mood != null || l.stress != null || l.energy != null);
  if (withData.length < 2) return <EmptyState message={MICROCOPY.emptyChart} />;

  const filled = fillDateGaps(logs, (date) => ({ date } as DailyLog));
  const data = filled.map((l) => ({
    date: l.date.slice(5),
    mood: l.notLogged ? null : l.mood,
    stress: l.notLogged ? null : l.stress,
    energy: l.notLogged ? null : l.energy,
    notLogged: !!l.notLogged,
  }));

  const notLoggedFormatter = (value: number | null, name: string, item: { payload?: { notLogged?: boolean } }) =>
    [item?.payload?.notLogged ? "Not logged" : value, name] as [string | number, string];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={[1, 10]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid hsl(var(--border))" }} formatter={notLoggedFormatter} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {/* connectNulls intentionally off so skipped days show as a real break,
            not a smoothed-over gap. */}
        <Line type="monotone" dataKey="mood" stroke="#6366f1" strokeWidth={2.5} dot={false} name="Mood" />
        <Line type="monotone" dataKey="stress" stroke="#fb923c" strokeWidth={2.5} dot={false} name="Stress" />
        <Line type="monotone" dataKey="energy" stroke="#10b981" strokeWidth={2.5} dot={false} name="Energy" />
      </LineChart>
    </ResponsiveContainer>
  );
}
