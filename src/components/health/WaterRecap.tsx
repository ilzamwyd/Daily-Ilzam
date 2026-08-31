"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { WaterLogEntry } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Droplet } from "lucide-react";
import { formatDateISO } from "@/lib/utils";

function daysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return formatDateISO(d);
}

export function WaterRecap() {
  const supabase = createClient();
  const [entries, setEntries] = useState<WaterLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("water_log")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", daysAgoStr(6))
        .order("date");
      setEntries((data as WaterLogEntry[]) ?? []);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const today = formatDateISO(new Date());
  const todayEntries = entries.filter((e) => e.date === today);
  const todayMl = todayEntries.reduce((s, e) => s + Number(e.amount_ml), 0);

  const byDay: { date: string; liters: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = daysAgoStr(i);
    const ml = entries.filter((e) => e.date === d).reduce((s, e) => s + Number(e.amount_ml), 0);
    byDay.push({ date: d.slice(5), liters: Math.round((ml / 1000) * 100) / 100 });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-career-light text-career">
          <Droplet className="h-5 w-5" />
        </div>
        <div>
          <CardTitle>Water Intake</CardTitle>
          <CardDescription>Logged from your Daily Check-In.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="font-display text-3xl font-bold text-career">
          {(todayMl / 1000).toFixed(2)} L <span className="text-base font-medium text-muted-foreground">today · {todayEntries.length}x</span>
        </p>

        {loading ? null : entries.length === 0 ? (
          <EmptyState message="No water logged yet this week." />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byDay}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="liters" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
