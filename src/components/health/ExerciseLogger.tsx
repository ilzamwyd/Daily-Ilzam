"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { WorkoutLogEntry } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

export function ExerciseLogger({ date }: { date: string }) {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [pastNames, setPastNames] = useState<string[]>([]);
  const [entries, setEntries] = useState<WorkoutLogEntry[]>([]);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const [{ data: all }, { data: today }] = await Promise.all([
        supabase.from("workout_log").select("exercise_name").eq("user_id", user.id),
        supabase.from("workout_log").select("*").eq("user_id", user.id).eq("date", date).order("created_at"),
      ]);
      setPastNames(Array.from(new Set((all ?? []).map((r) => r.exercise_name))).sort());
      setEntries((today as WorkoutLogEntry[]) ?? []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function handleAdd() {
    if (!userId || !name.trim()) return;
    setError(null);
    const { data, error: err } = await supabase
      .from("workout_log")
      .insert({ user_id: userId, date, exercise_name: name.trim(), duration_minutes: duration ? Number(duration) : null })
      .select()
      .single();
    if (err) {
      setError(err.message);
      return;
    }
    if (data) {
      setEntries((prev) => [...prev, data as WorkoutLogEntry]);
      setPastNames((prev) => Array.from(new Set([...prev, name.trim()])).sort());
    }
    setName("");
    setDuration("");
  }

  async function remove(id?: string) {
    if (!id) return;
    await supabase.from("workout_log").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium">Exercises done today</label>
      <datalist id="exercise-options">
        {pastNames.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      {entries.length > 0 && (
        <div className="mb-2 flex flex-col gap-1">
          {entries.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-xl bg-muted px-3 py-1.5 text-sm">
              <span>
                {e.exercise_name}
                {e.duration_minutes ? ` · ${e.duration_minutes} min` : ""}
              </span>
              <button onClick={() => remove(e.id)} className="text-muted-foreground hover:text-critical">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input list="exercise-options" placeholder="e.g. Bench Press" className="flex-1" value={name} onChange={(e) => setName(e.target.value)} />
        <Input inputMode="numeric" placeholder="min" className="w-20" value={duration} onChange={(e) => setDuration(e.target.value)} />
        <Button type="button" size="icon" onClick={handleAdd} disabled={!name.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {error && <p className="mt-1 text-xs text-critical">{error}</p>}
    </div>
  );
}
