"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ActivityLog } from "@/lib/types";
import { Segmented } from "@/components/ui/segmented";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

const ACTIVITY_TYPES = ["Running", "Badminton", "Walking", "Other"] as const;
const SHOWS_DISTANCE = new Set(["Running", "Walking"]);

function formatPace(durationMin: number, distanceKm: number): string {
  if (!durationMin || !distanceKm) return "—";
  const paceMinPerKm = durationMin / distanceKm;
  const min = Math.floor(paceMinPerKm);
  const sec = Math.round((paceMinPerKm - min) * 60);
  return `${min}:${String(sec).padStart(2, "0")} /km`;
}

export function ActivityLogger({ date }: { date: string }) {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [entries, setEntries] = useState<ActivityLog[]>([]);
  const [type, setType] = useState<(typeof ACTIVITY_TYPES)[number]>("Running");
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase.from("activity_log").select("*").eq("user_id", user.id).eq("date", date).order("created_at");
      setEntries((data as ActivityLog[]) ?? []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function handleAdd() {
    if (!userId || !duration) return;
    setError(null);
    const { data, error: err } = await supabase
      .from("activity_log")
      .insert({
        user_id: userId,
        date,
        activity_type: type,
        duration_minutes: Number(duration),
        distance_km: distance ? Number(distance) : null,
        notes: notes.trim() || null,
      })
      .select()
      .single();
    if (err) {
      setError(err.message);
      return;
    }
    if (data) setEntries((prev) => [...prev, data as ActivityLog]);
    setDuration("");
    setDistance("");
    setNotes("");
  }

  async function remove(id?: string) {
    if (!id) return;
    await supabase.from("activity_log").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  const showDistance = SHOWS_DISTANCE.has(type);

  return (
    <div className="flex flex-col gap-3">
      {entries.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {entries.map((e) => (
            <div key={e.id} className="flex items-start justify-between gap-2 rounded-xl bg-muted px-3 py-2 text-sm">
              <div>
                <span className="font-medium">{e.activity_type}</span>
                {e.duration_minutes ? <span className="text-muted-foreground"> · {e.duration_minutes} min</span> : null}
                {e.distance_km ? <span className="text-muted-foreground"> · {e.distance_km} km</span> : null}
                {e.distance_km && e.duration_minutes ? (
                  <span className="text-muted-foreground"> · {formatPace(e.duration_minutes, e.distance_km)}</span>
                ) : null}
                {e.notes && <p className="mt-0.5 text-xs text-muted-foreground">{e.notes}</p>}
              </div>
              <button onClick={() => remove(e.id)} className="shrink-0 text-muted-foreground hover:text-critical">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Segmented options={ACTIVITY_TYPES} value={type} onChange={setType} activeClassName="bg-fitness text-white border-fitness" />

      <div className="flex flex-wrap gap-2">
        <Input inputMode="numeric" placeholder="Duration (min)" className="w-36" value={duration} onChange={(e) => setDuration(e.target.value)} />
        {showDistance && (
          <Input inputMode="decimal" placeholder="Distance (km)" className="w-36" value={distance} onChange={(e) => setDistance(e.target.value)} />
        )}
        {showDistance && duration && distance && (
          <span className="flex items-center rounded-2xl bg-muted px-3 text-sm text-muted-foreground">
            Pace: {formatPace(Number(duration), Number(distance))}
          </span>
        )}
      </div>
      <Input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <Button type="button" className="gap-1.5 self-start" onClick={handleAdd} disabled={!duration}>
        <Plus className="h-4 w-4" /> Log activity
      </Button>
      {error && <p className="text-xs text-critical">{error}</p>}
    </div>
  );
}
