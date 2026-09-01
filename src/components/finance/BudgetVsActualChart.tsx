"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { CategorySpend, formatIDR } from "@/lib/finance";

export function BudgetVsActualChart({ data }: { data: CategorySpend[] }) {
  const chartData = data.map((c) => ({ code: c.code, Budgeted: Math.round(c.budgeted), Actual: Math.round(c.spent) }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="code" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
        <Tooltip
          contentStyle={{ borderRadius: 16, border: "1px solid hsl(var(--border))" }}
          formatter={(v: number) => formatIDR(v)}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Budgeted" fill="#0891b2" radius={[6, 6, 0, 0]} />
        <Bar dataKey="Actual" fill="#fb923c" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
