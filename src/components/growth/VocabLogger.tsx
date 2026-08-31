"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EnglishVocab } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

export function VocabLogger({ date }: { date: string }) {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [todaysWords, setTodaysWords] = useState<EnglishVocab[]>([]);
  const [word, setWord] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase
        .from("english_vocab")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", date);
      setTodaysWords((data as EnglishVocab[]) ?? []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function handleAdd() {
    if (!userId || !word.trim()) return;
    const { data } = await supabase
      .from("english_vocab")
      .insert({ user_id: userId, word: word.trim(), note: note.trim() || null, date })
      .select()
      .single();
    if (data) setTodaysWords((prev) => [...prev, data as EnglishVocab]);
    setWord("");
    setNote("");
  }

  async function remove(id?: string) {
    if (!id) return;
    await supabase.from("english_vocab").delete().eq("id", id);
    setTodaysWords((prev) => prev.filter((w) => w.id !== id));
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">New vocabulary today (goal: 5–7 words)</label>
      {todaysWords.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {todaysWords.map((w) => (
            <span key={w.id} title={w.note ?? ""} className="flex items-center gap-1 rounded-full bg-growth-light px-2.5 py-1 text-xs font-medium text-growth">
              {w.word}
              <button onClick={() => remove(w.id)} className="hover:text-critical">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input placeholder="Word" className="sm:w-40" value={word} onChange={(e) => setWord(e.target.value)} />
        <Input
          placeholder="Meaning / note (optional)"
          className="sm:flex-1"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button type="button" size="icon" onClick={handleAdd} disabled={!word.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
