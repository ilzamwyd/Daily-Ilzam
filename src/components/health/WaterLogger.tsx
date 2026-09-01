"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { WaterLogEntry } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, Droplet } from "lucide-react";

const QUICK_AMOUNTS = [250, 500, 750];

export function WaterLogger({ date }: { date: string }) {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [entries, setEntries] = useState<WaterLogEntry[]>([]);
  const [customAmount, setCustomAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase
        .from("water_log")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", date)
        .order("logged_at");
      setEntries((data as WaterLogEntry[]) ?? []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function addWater(ml: number) {
    if (!userId || ml <= 0) return;
    setError(null);
    const { data, error: err } = await supabase.from("water_log").insert({ user_id: userId, date, amount_ml: ml }).select().single();
    if (err) {
      setError(err.message);
      return;
    }
    if (data) setEntries((prev) => [...prev, data as WaterLogEntry]);
  }

  async function remove(id?: string) {
    if (!id) return;
    await supabase.from("water_log").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  const totalMl = entries.reduce((s, e) => s + Number(e.amount_ml), 0);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium">Water intake</label>
        <span className="flex items-center gap-1 text-sm font-medium text-career">
          <Droplet className="h-3.5 w-3.5" />
          {(totalMl / 1000).toFixed(2)} L · {entries.length}x
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map((ml) => (
          <Button key={ml} type="button" size="sm" variant="soft" className="gap-1" onClick={() => addWater(ml)}>
            <Plus className="h-3.5 w-3.5" /> {ml} ml
          </Button>
        ))}
        <Input
          inputMode="numeric"
          placeholder="Custom ml"
          className="h-9 w-28 text-sm"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
        />
        <Button
          type="button"
          size="sm"
          onClick={() => {
            addWater(Number(customAmount));
            setCustomAmount("");
          }}
          disabled={!customAmount}
        >
          Add
        </Button>
      </div>

      {error && <p className="mt-1.5 text-xs text-critical">{error}</p>}

      {entries.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {entries.map((e) => (
            <span key={e.id} className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">
              {e.amount_ml} ml
              <button onClick={() => remove(e.id)} className="text-muted-foreground hover:text-critical">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
