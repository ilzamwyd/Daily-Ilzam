"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FoodLogEntry } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from "recharts";
import { startOfWeek, formatDateISO } from "@/lib/utils";
import { Flame } from "lucide-react";

type Mode = "daily" | "weekly" | "custom";
const SLOT_LABELS: Record<string, string> = { breakfast: "Breakfast", lunch: "Lunch", snack: "Snack", dinner: "Dinner" };

function todayStr() {
  return formatDateISO(new Date());
}

export function CalorieRecap({ calorieMin, calorieMax }: { calorieMin: number | null; calorieMax: number | null }) {
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>("daily");
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [customStart, setCustomStart] = useState(todayStr());
  const [customEnd, setCustomEnd] = useState(todayStr());
  const [entries, setEntries] = useState<FoodLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const { start, end } = useMemo(() => {
    if (mode === "daily") return { start: selectedDate, end: selectedDate };
    if (mode === "weekly") {
      const s = startOfWeek(new Date(selectedDate));
      const e = new Date(s);
      e.setDate(e.getDate() + 6);
      return { start: formatDateISO(s), end: formatDateISO(e) };
    }
    return { start: customStart, end: customEnd };
  }, [mode, selectedDate, customStart, customEnd]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("food_log")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", start)
        .lte("date", end)
        .order("date");
      setEntries((data as FoodLogEntry[]) ?? []);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end]);

  const numDays = Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1);
  const total = entries.reduce((s, e) => s + Number(e.total_calories), 0);
  const avgPerDay = total / numDays;

  const bySlot = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of entries) {
      const slot = e.meal_slot ?? "unspecified";
      map[slot] = (map[slot] ?? 0) + Number(e.total_calories);
    }
    return map;
  }, [entries]);

  const byDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) map.set(e.date, (map.get(e.date) ?? 0) + Number(e.total_calories));
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, kcal]) => ({ date: date.slice(5), kcal }));
  }, [entries]);

  const hasTarget = calorieMin != null || calorieMax != null;
  const refValue = mode === "daily" ? total : avgPerDay;
  let targetNote: string | null = null;
  if (hasTarget) {
    if (calorieMin != null && refValue < calorieMin) targetNote = `Below your ${calorieMin} kcal reference`;
    else if (calorieMax != null && refValue > calorieMax) targetNote = `Above your ${calorieMax} kcal reference`;
    else targetNote = "Within your reference range";
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-warn-light text-warn">
          <Flame className="h-5 w-5" />
        </div>
        <div>
          <CardTitle>Calories</CardTitle>
          <CardDescription>Logged from your Daily Check-In, by meal.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Segmented options={["daily", "weekly", "custom"] as const} value={mode} onChange={setMode} activeClassName="bg-warn text-white border-warn" />

        {mode === "daily" && (
          <Input type="date" className="w-44" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        )}
        {mode === "weekly" && (
          <Input type="date" className="w-44" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        )}
        {mode === "custom" && (
          <div className="flex gap-2">
            <Input type="date" className="w-44" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
            <Input type="date" className="w-44" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
          </div>
        )}

        {loading ? null : entries.length === 0 ? (
          <EmptyState message="No calories logged for this range yet — add meals from the Daily Check-In." />
        ) : (
          <>
            <div>
              <p className="font-display text-3xl font-bold">
                {Math.round(mode === "daily" ? total : avgPerDay)}{" "}
                <span className="text-base font-medium text-muted-foreground">
                  kcal {mode === "daily" ? "that day" : "/ day avg"}
                </span>
              </p>
              {targetNote && <p className="text-sm text-muted-foreground">{targetNote}</p>}
            </div>

            {byDay.length > 1 && (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byDay}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid hsl(var(--border))" }} />
                  {calorieMin != null && <ReferenceLine y={calorieMin} stroke="#0891b2" strokeDasharray="4 4" />}
                  {calorieMax != null && <ReferenceLine y={calorieMax} stroke="#fb923c" strokeDasharray="4 4" />}
                  <Bar dataKey="kcal" fill="#fb923c" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">By meal</p>
              <div className="flex flex-col gap-1.5">
                {Object.entries(bySlot).map(([slot, kcal]) => (
                  <div key={slot} className="flex items-center justify-between text-sm">
                    <span>{SLOT_LABELS[slot] ?? "Other"}</span>
                    <span className="font-medium">{Math.round(kcal)} kcal</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
