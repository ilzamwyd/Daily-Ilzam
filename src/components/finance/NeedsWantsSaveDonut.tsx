"use client";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatIDR } from "@/lib/finance";

export function NeedsWantsSaveDonut({ needsAmt, wantsAmt, saveAmt }: { needsAmt: number; wantsAmt: number; saveAmt: number }) {
  const data = [
    { name: "Needs", value: Math.max(0, needsAmt), color: "#3b82f6" },
    { name: "Wants", value: Math.max(0, wantsAmt), color: "#ec4899" },
    { name: "Save", value: Math.max(0, saveAmt), color: "#0891b2" },
  ];

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => formatIDR(v)} contentStyle={{ borderRadius: 16, border: "1px solid hsl(var(--border))" }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
