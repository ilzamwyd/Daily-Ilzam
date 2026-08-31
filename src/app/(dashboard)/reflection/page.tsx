"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { WeeklyReview, DailyLog } from "@/lib/types";
import { formatDateISO, startOfWeek, daysAgo } from "@/lib/utils";
import { generateInsights } from "@/lib/insights";
import { NotebookPen, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";

const QUESTIONS: { key: keyof WeeklyReview; label: string }[] = [
  { key: "went_well", label: "What went well?" },
  { key: "drained_me", label: "What drained me?" },
  { key: "gave_energy", label: "What gave me energy?" },
  { key: "stress_eating_trigger", label: "What triggered stress eating?" },
  { key: "stop_doing", label: "What should I stop doing?" },
  { key: "grateful_for", label: "What am I grateful for?" },
  { key: "one_priority", label: "What is ONE priority next week?" },
];

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

export default function ReflectionPage() {
  const supabase = createClient();
  const [weekOffset, setWeekOffset] = useState(0); // 0 = this week, -1 = last week, etc.
  const [review, setReview] = useState<Partial<WeeklyReview>>({});
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const viewedMonday = addDays(startOfWeek(new Date()), weekOffset * 7);
  const weekStart = formatDateISO(viewedMonday);
  const weekEnd = formatDateISO(addDays(viewedMonday, 6));
  const isCurrentWeek = weekOffset === 0;

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const since = formatDateISO(daysAgo(14));
      const [{ data: existing }, { data: logData }] = await Promise.all([
        supabase.from("weekly_reviews").select("*").eq("user_id", user.id).eq("week_start", weekStart).maybeSingle(),
        supabase.from("daily_logs").select("*").eq("user_id", user.id).gte("date", since).order("date", { ascending: true }),
      ]);
      setReview(existing ? (existing as WeeklyReview) : {});
      setLogs((logData as DailyLog[]) ?? []);
      setSaved(false);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  async function handleSave() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSaving(true);
    await supabase.from("weekly_reviews").upsert({ ...review, user_id: user.id, week_start: weekStart }, { onConflict: "user_id,week_start" });
    setSaving(false);
    setSaved(true);
  }

  const insights = generateInsights(logs);
  const wins = insights.filter((i) => i.category === "maintain");
  const watch = insights.filter((i) => i.category === "watch");
  const reset = insights.filter((i) => i.category === "fix");

  if (loading) return <div className="flex h-64 items-center justify-center text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Weekly Review</h1>
          <p className="text-sm text-muted-foreground">A short Sunday reflection — not a report card.</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setWeekOffset((o) => o - 1)} className="rounded-xl border border-border p-2 hover:bg-muted">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setWeekOffset((o) => Math.min(0, o + 1))}
            disabled={isCurrentWeek}
            className="rounded-xl border border-border p-2 hover:bg-muted disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="-mt-4 text-xs text-muted-foreground">
        {isCurrentWeek ? "This week" : "Past week"} · {weekStart} to {weekEnd}
      </p>

      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-foreground">
            <NotebookPen className="h-5 w-5" />
          </div>
          <CardTitle>{isCurrentWeek ? "This week's questions" : "That week's questions"}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {QUESTIONS.map((q) => (
            <div key={q.key}>
              <label className="mb-1.5 block text-sm font-medium">{q.label}</label>
              <Textarea
                rows={2}
                value={(review[q.key] as string) ?? ""}
                onChange={(e) => {
                  setReview({ ...review, [q.key]: e.target.value });
                  setSaved(false);
                }}
              />
            </div>
          ))}
          <Button onClick={handleSave} disabled={saving} className="mt-2">
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save reflection"}
          </Button>
        </CardContent>
      </Card>

      {isCurrentWeek && (
        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <CardTitle>This Week — auto-generated summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <SummaryBlock title="Wins" items={wins.map((w) => w.text)} colorClass="text-health bg-health-light" />
            <SummaryBlock title="Watch" items={watch.map((w) => w.text)} colorClass="text-warn bg-warn-light" />
            <SummaryBlock title="Reset" items={reset.map((w) => w.text)} colorClass="text-critical bg-critical-light" />
            <SummaryBlock title="One Focus Next Week" items={review.one_priority ? [review.one_priority] : []} colorClass="text-career bg-career-light" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryBlock({ title, items, colorClass }: { title: string; items: string[]; colorClass: string }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{title}</p>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nothing here yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((t, i) => (
            <li key={i} className={`rounded-2xl px-3 py-2 text-xs leading-relaxed ${colorClass}`}>
              {t}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
