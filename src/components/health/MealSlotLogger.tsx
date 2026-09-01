"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FoodLibraryItem, FoodLogEntry } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAiEnabled } from "@/lib/useAiEnabled";
import { Plus, Sparkles, Loader2, X } from "lucide-react";

type Slot = "breakfast" | "lunch" | "snack" | "dinner";

export function MealSlotLogger({ date, slot, label }: { date: string; slot: Slot; label: string }) {
  const supabase = createClient();
  const aiEnabled = useAiEnabled();
  const [userId, setUserId] = useState<string | null>(null);
  const [library, setLibrary] = useState<FoodLibraryItem[]>([]);
  const [entries, setEntries] = useState<FoodLogEntry[]>([]);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [estimating, setEstimating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const [{ data: lib }, { data: log }] = await Promise.all([
        supabase.from("food_library").select("*").eq("user_id", user.id).order("name"),
        supabase.from("food_log").select("*").eq("user_id", user.id).eq("date", date).eq("meal_slot", slot).order("created_at"),
      ]);
      setLibrary((lib as FoodLibraryItem[]) ?? []);
      setEntries((log as FoodLogEntry[]) ?? []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const matchedFood = useMemo(() => library.find((f) => f.name.toLowerCase() === name.trim().toLowerCase()), [library, name]);
  useEffect(() => {
    if (matchedFood) setCalories(String(matchedFood.calories));
  }, [matchedFood]);

  async function handleEstimate() {
    if (!name.trim()) return;
    setEstimating(true);
    try {
      const res = await fetch("/api/nutrition/estimate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ description: name }),
      });
      const data = await res.json();
      if (res.ok) setCalories(String(data.calories));
    } finally {
      setEstimating(false);
    }
  }

  async function handleAdd() {
    if (!userId || !name.trim() || !calories) return;
    setError(null);
    const cal = Number(calories);

    let libraryId = matchedFood?.id;
    if (!matchedFood) {
      const { data, error: libErr } = await supabase
        .from("food_library")
        .upsert({ user_id: userId, name: name.trim(), calories: cal, serving_label: "1 portion", source: "manual" }, { onConflict: "user_id,name" })
        .select()
        .single();
      if (libErr) {
        setError(libErr.message);
        return;
      }
      libraryId = data?.id;
      if (data) setLibrary((prev) => [...prev, data as FoodLibraryItem]);
    }

    const { data: entry, error: logErr } = await supabase
      .from("food_log")
      .insert({
        user_id: userId,
        date,
        meal_slot: slot,
        food_name: name.trim(),
        calories_per_serving: cal,
        servings: 1,
        total_calories: cal,
        food_library_id: libraryId ?? null,
      })
      .select()
      .single();
    if (logErr) {
      setError(logErr.message);
      return;
    }
    if (entry) setEntries((prev) => [...prev, entry as FoodLogEntry]);
    setName("");
    setCalories("");
  }

  async function removeEntry(id?: string) {
    if (!id) return;
    await supabase.from("food_log").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  const total = entries.reduce((s, e) => s + Number(e.total_calories), 0);

  return (
    <div className="rounded-2xl bg-muted p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        {total > 0 && <span className="text-xs text-muted-foreground">{Math.round(total)} kcal</span>}
      </div>

      <datalist id={`food-options-${slot}`}>
        {library.map((f) => (
          <option key={f.id} value={f.name} />
        ))}
      </datalist>

      {entries.length > 0 && (
        <div className="mb-2 flex flex-col gap-1">
          {entries.map((e) => (
            <div key={e.id} className="flex items-center justify-between text-xs">
              <span>{e.food_name}</span>
              <span className="flex items-center gap-2 text-muted-foreground">
                {Math.round(e.total_calories)} kcal
                <button onClick={() => removeEntry(e.id)} className="hover:text-critical">
                  <X className="h-3 w-3" />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1.5">
        <Input
          list={`food-options-${slot}`}
          placeholder="What did you eat?"
          className="h-9 flex-1 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          inputMode="numeric"
          placeholder="kcal"
          className="h-9 w-16 text-sm"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
        />
        {!calories && name.trim() && aiEnabled && (
          <Button type="button" size="icon" variant="soft" className="h-9 w-9 shrink-0" onClick={handleEstimate} disabled={estimating}>
            {estimating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          </Button>
        )}
        <Button type="button" size="icon" className="h-9 w-9 shrink-0" onClick={handleAdd} disabled={!name.trim() || !calories}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {error && <p className="mt-1 text-xs text-critical">{error}</p>}
    </div>
  );
}
