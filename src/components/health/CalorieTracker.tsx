"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FoodLibraryItem, FoodLogEntry } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Loader2, Trash2, Flame } from "lucide-react";
import { useAiEnabled } from "@/lib/useAiEnabled";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function CalorieTracker() {
  const supabase = createClient();
  const aiEnabled = useAiEnabled();
  const [userId, setUserId] = useState<string | null>(null);
  const [library, setLibrary] = useState<FoodLibraryItem[]>([]);
  const [todayLog, setTodayLog] = useState<FoodLogEntry[]>([]);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [servings, setServings] = useState("1");
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const [{ data: lib }, { data: log }] = await Promise.all([
      supabase.from("food_library").select("*").eq("user_id", user.id).order("name"),
      supabase.from("food_log").select("*").eq("user_id", user.id).eq("date", todayStr()).order("created_at"),
    ]);
    setLibrary((lib as FoodLibraryItem[]) ?? []);
    setTodayLog((log as FoodLogEntry[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const matchedFood = useMemo(
    () => library.find((f) => f.name.toLowerCase() === name.trim().toLowerCase()),
    [library, name]
  );

  useEffect(() => {
    if (matchedFood) setCalories(String(matchedFood.calories));
  }, [matchedFood]);

  async function handleEstimate() {
    if (!name.trim()) return;
    setEstimateError(null);
    setEstimating(true);
    try {
      const res = await fetch("/api/nutrition/estimate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ description: name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEstimateError(data.error ?? "Couldn't estimate — enter calories manually.");
        return;
      }
      setCalories(String(data.calories));
    } finally {
      setEstimating(false);
    }
  }

  async function handleAdd() {
    if (!userId || !name.trim() || !calories) return;
    const cal = Number(calories);
    const srv = Number(servings) || 1;
    const total = cal * srv;

    let libraryId = matchedFood?.id;
    if (!matchedFood) {
      const { data } = await supabase
        .from("food_library")
        .upsert(
          { user_id: userId, name: name.trim(), calories: cal, serving_label: "1 portion", source: "manual" },
          { onConflict: "user_id,name" }
        )
        .select()
        .single();
      libraryId = data?.id;
      if (data) setLibrary((prev) => [...prev, data as FoodLibraryItem]);
    }

    const { data: entry } = await supabase
      .from("food_log")
      .insert({
        user_id: userId,
        date: todayStr(),
        food_name: name.trim(),
        calories_per_serving: cal,
        servings: srv,
        total_calories: total,
        food_library_id: libraryId ?? null,
      })
      .select()
      .single();
    if (entry) setTodayLog((prev) => [...prev, entry as FoodLogEntry]);

    setName("");
    setCalories("");
    setServings("1");
    setEstimateError(null);
  }

  async function removeEntry(id?: string) {
    if (!id) return;
    await supabase.from("food_log").delete().eq("id", id);
    setTodayLog((prev) => prev.filter((e) => e.id !== id));
  }

  const todayTotal = todayLog.reduce((s, e) => s + Number(e.total_calories), 0);

  if (loading) return null;

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-warn-light text-warn">
          <Flame className="h-5 w-5" />
        </div>
        <div>
          <CardTitle>Calories</CardTitle>
          <CardDescription>Awareness, not a scoreboard — log what you ate, no judgment either way.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="font-display text-3xl font-bold">
          {Math.round(todayTotal)} <span className="text-base font-medium text-muted-foreground">kcal today</span>
        </p>

        <datalist id="food-options">
          {library.map((f) => (
            <option key={f.id} value={f.name} />
          ))}
        </datalist>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            list="food-options"
            placeholder="What did you eat? e.g. Nasi Padang rendang"
            className="sm:flex-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            inputMode="decimal"
            placeholder="Servings"
            className="sm:w-24"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
          />
          <Input
            inputMode="numeric"
            placeholder="kcal"
            className="sm:w-28"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!calories && name.trim() && aiEnabled && (
            <Button type="button" size="sm" variant="soft" className="gap-1.5" onClick={handleEstimate} disabled={estimating}>
              {estimating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {estimating ? "Estimating…" : "Estimate with AI"}
            </Button>
          )}
          <Button type="button" size="sm" className="gap-1.5" onClick={handleAdd} disabled={!name.trim() || !calories}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
          {matchedFood && <span className="text-xs text-muted-foreground">Loaded from your food library</span>}
        </div>
        {estimateError && <p className="text-xs text-critical">{estimateError}</p>}

        {todayLog.length > 0 && (
          <div className="flex flex-col divide-y divide-border">
            {todayLog.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium">{e.food_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.servings} × {e.calories_per_serving} kcal
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{Math.round(e.total_calories)} kcal</span>
                  <button onClick={() => removeEntry(e.id)} className="text-muted-foreground hover:text-critical">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
