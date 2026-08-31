"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EnglishSession } from "@/lib/types";
import { ENGLISH_ASPECTS, ASPECT_GUIDANCE, EnglishAspect } from "@/lib/english";
import { Segmented } from "@/components/ui/segmented";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

export function EnglishSessionLogger({ date }: { date: string }) {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [entries, setEntries] = useState<EnglishSession[]>([]);
  const [aspect, setAspect] = useState<EnglishAspect>("Listening");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase
        .from("english_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", date)
        .order("created_at");
      setEntries((data as EnglishSession[]) ?? []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function handleAdd() {
    if (!userId) return;
    const { data } = await supabase
      .from("english_sessions")
      .insert({
        user_id: userId,
        date,
        aspect,
        duration_minutes: duration ? Number(duration) : null,
        notes: notes.trim() || null,
      })
      .select()
      .single();
    if (data) setEntries((prev) => [...prev, data as EnglishSession]);
    setDuration("");
    setNotes("");
  }

  async function remove(id?: string) {
    if (!id) return;
    await supabase.from("english_sessions").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="flex flex-col gap-3">
      {entries.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {entries.map((e) => (
            <div key={e.id} className="flex items-start justify-between gap-2 rounded-xl bg-muted px-3 py-2 text-sm">
              <div>
                <span className="font-medium">{e.aspect}</span>
                {e.duration_minutes ? <span className="text-muted-foreground"> · {e.duration_minutes} min</span> : null}
                {e.notes && <p className="mt-0.5 text-xs text-muted-foreground">{e.notes}</p>}
              </div>
              <button onClick={() => remove(e.id)} className="shrink-0 text-muted-foreground hover:text-critical">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Which aspect did you focus on?</label>
        <Segmented options={ENGLISH_ASPECTS} value={aspect} onChange={setAspect} activeClassName="bg-growth text-white border-growth" />
        <p className="mt-1.5 text-xs italic text-muted-foreground">{ASPECT_GUIDANCE[aspect]}</p>
      </div>

      <div className="flex gap-2">
        <Input inputMode="numeric" placeholder="Duration (min)" className="w-32" value={duration} onChange={(e) => setDuration(e.target.value)} />
      </div>
      <Textarea rows={2} placeholder="How did it go? What did you focus on specifically?" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <Button type="button" className="gap-1.5 self-start" onClick={handleAdd}>
        <Plus className="h-4 w-4" /> Log this session
      </Button>
    </div>
  );
}
