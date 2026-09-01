"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EnglishVocab } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { formatDateISO } from "@/lib/utils";
import { RotateCcw, Check, Sparkles } from "lucide-react";

// Simple Leitner-style intervals: index by review_count, capped at the last value.
const INTERVALS_DAYS = [1, 3, 7, 14, 30, 60];

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return formatDateISO(d);
}

export function VocabReview() {
  const supabase = createClient();
  const [due, setDue] = useState<EnglishVocab[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [doneCount, setDoneCount] = useState(0);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const today = formatDateISO(new Date());
      const { data } = await supabase
        .from("english_vocab")
        .select("*")
        .eq("user_id", user.id)
        .lte("next_review_date", today)
        .order("next_review_date", { ascending: true })
        .limit(15);
      setDue((data as EnglishVocab[]) ?? []);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function grade(gotIt: boolean) {
    const word = due[index];
    if (!word?.id) return;
    const today = formatDateISO(new Date());
    const nextCount = gotIt ? (word.review_count ?? 0) + 1 : 0;
    const interval = INTERVALS_DAYS[Math.min(nextCount, INTERVALS_DAYS.length - 1)];
    const next_review_date = gotIt ? addDays(today, interval) : addDays(today, 1);

    await supabase
      .from("english_vocab")
      .update({ review_count: nextCount, next_review_date, last_reviewed_at: new Date().toISOString() })
      .eq("id", word.id);

    setDoneCount((c) => c + 1);
    setRevealed(false);
    setIndex((i) => i + 1);
  }

  if (loading) return null;
  if (due.length === 0) {
    return (
      <div className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
        No vocabulary due for review today — nice and caught up.
      </div>
    );
  }

  if (index >= due.length) {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-growth-light p-4 text-sm text-growth">
        <Sparkles className="h-4 w-4" /> Reviewed {doneCount} word{doneCount === 1 ? "" : "s"} today. Nice.
      </div>
    );
  }

  const current = due[index];

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        Vocabulary review — {index + 1} of {due.length} due today
      </p>
      <button
        onClick={() => setRevealed((r) => !r)}
        className="flex min-h-24 w-full flex-col items-center justify-center gap-1 rounded-2xl bg-growth-light p-6 text-center"
      >
        <span className="font-display text-2xl font-bold text-growth">{current.word}</span>
        {revealed ? (
          <span className="mt-1 text-sm text-muted-foreground">{current.note || "No note saved for this word."}</span>
        ) : (
          <span className="mt-1 text-xs text-muted-foreground">Tap to reveal meaning</span>
        )}
      </button>
      {revealed && (
        <div className="mt-3 flex gap-2">
          <Button type="button" variant="soft" className="flex-1 gap-1.5" onClick={() => grade(false)}>
            <RotateCcw className="h-4 w-4" /> Still learning
          </Button>
          <Button type="button" className="flex-1 gap-1.5" onClick={() => grade(true)}>
            <Check className="h-4 w-4" /> Got it
          </Button>
        </div>
      )}
    </div>
  );
}
