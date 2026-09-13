"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea, CartesianGrid } from "recharts";
import { DailyLog } from "@/lib/types";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MICROCOPY } from "@/lib/constants";
import { fillDateGaps } from "@/lib/utils";

export function SleepTrendChart({ logs, min, max }: { logs: DailyLog[]; min: number; max: number }) {
  const withData = logs.filter((l) => l.sleep_hours != null);
  if (withData.length < 2) return <EmptyState message={MICROCOPY.emptyChart} />;

  const filled = fillDateGaps(logs, (date) => ({ date } as DailyLog));
  const data = filled.map((l) => ({
    date: l.date.slice(5),
    sleep: l.notLogged ? null : l.sleep_hours,
    notLogged: !!l.notLogged,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: 16, border: "1px solid hsl(var(--border))" }}
          formatter={(value: number | null, name, item) => [item?.payload?.notLogged ? "Not logged" : value, name]}
        />
        <ReferenceArea y1={min} y2={max} fill="#6366f1" fillOpacity={0.08} />
        {/* connectNulls intentionally left off (default false) so a skipped day
            shows as a real break in the line, not a smoothed-over gap. */}
        <Line type="monotone" dataKey="sleep" stroke="#6366f1" strokeWidth={2.5} dot={false} name="Sleep" />
      </LineChart>
    </ResponsiveContainer>
  );
}
