"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EnglishGoal, EnglishVocab, EnglishSession } from "@/lib/types";
import { ENGLISH_ASPECTS, ASPECT_GUIDANCE } from "@/lib/english";
import { Languages, Check, Circle } from "lucide-react";
import { formatDateISO, daysAgo } from "@/lib/utils";
import { EnglishSessionsChart } from "@/components/charts/EnglishSessionsChart";

export default function EnglishPage() {
  const supabase = createClient();
  const [goals, setGoals] = useState<EnglishGoal[]>([]);
  const [vocab, setVocab] = useState<EnglishVocab[]>([]);
  const [sessions, setSessions] = useState<EnglishSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [englishTarget, setEnglishTarget] = useState(3);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const since = formatDateISO(daysAgo(56));
      const [{ data: targetData }, { data: goalData }, { data: vocabData }, { data: sessionData }] = await Promise.all([
        supabase.from("user_targets").select("english_weekly_target").eq("user_id", user.id).maybeSingle(),
        supabase.from("english_goals").select("*").eq("user_id", user.id).order("target_date", { ascending: true }),
        supabase.from("english_vocab").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
        supabase.from("english_sessions").select("*").eq("user_id", user.id).gte("date", since).order("date", { ascending: false }),
      ]);

      setGoals((goalData as EnglishGoal[]) ?? []);
      setVocab((vocabData as EnglishVocab[]) ?? []);
      setSessions((sessionData as EnglishSession[]) ?? []);
      if (targetData) setEnglishTarget(targetData.english_weekly_target ?? 3);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const today = formatDateISO(new Date());
  const weekAgo = formatDateISO(daysAgo(6));
  const sessionsThisWeek = sessions.filter((s) => s.date >= weekAgo).length;

  const nextGoal = goals.find((g) => !g.achieved && g.target_date >= today) ?? goals.find((g) => !g.achieved);
  const daysToNextGoal = nextGoal
    ? Math.ceil((new Date(nextGoal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const aspectStats = ENGLISH_ASPECTS.map((aspect) => {
    const aspectSessions = sessions.filter((s) => s.aspect === aspect);
    const last = aspectSessions[0];
    return { aspect, count: aspectSessions.length, lastDate: last?.date ?? null };
  });

  async function toggleGoal(goal: EnglishGoal) {
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? { ...g, achieved: !g.achieved } : g)));
    await supabase.from("english_goals").update({ achieved: !goal.achieved }).eq("id", goal.id);
  }

  if (loading) return <div className="flex h-64 items-center justify-center text-muted-foreground">Loading…</div>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">English</h1>
        <p className="text-sm text-muted-foreground">Log sessions from your Daily Check-In — this page is a recap.</p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-growth-light text-growth">
            <Languages className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Practice Consistency</CardTitle>
            <CardDescription>No streaks, just steady reps.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <p className="font-display text-3xl font-bold text-growth">
            {sessionsThisWeek} / {englishTarget} <span className="text-base font-medium text-muted-foreground">sessions this week</span>
          </p>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Weekly consistency (last 8 weeks)</p>
            <EnglishSessionsChart sessions={sessions} target={englishTarget} />
          </div>

          {nextGoal && (
            <div className="rounded-2xl bg-growth-light/50 p-4">
              <p className="text-xs font-medium text-muted-foreground">Next milestone</p>
              <p className="font-display text-lg font-semibold">{nextGoal.level_label}</p>
              <p className="text-sm text-muted-foreground">
                Target: {nextGoal.target_date}
                {daysToNextGoal !== null && daysToNextGoal >= 0 ? ` · ${daysToNextGoal} days away` : ""}
              </p>
            </div>
          )}

          {goals.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Roadmap</p>
              <ul className="flex flex-col gap-1.5">
                {goals.map((g) => (
                  <li key={g.id} className="flex items-center gap-2 text-sm">
                    <button onClick={() => toggleGoal(g)} className="text-growth">
                      {g.achieved ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    <span className={g.achieved ? "text-muted-foreground line-through" : ""}>{g.level_label}</span>
                    <span className="text-xs text-muted-foreground">— {g.target_date}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Progress by Aspect</CardTitle>
          <CardDescription>Last 8 weeks.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {aspectStats.map(({ aspect, count, lastDate }) => (
              <div key={aspect} className="rounded-2xl bg-muted p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{aspect}</p>
                  <span className="text-xs text-muted-foreground">{count} session{count === 1 ? "" : "s"}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{ASPECT_GUIDANCE[aspect]}</p>
                {lastDate && <p className="mt-1 text-xs text-growth">Last practiced: {lastDate}</p>}
              </div>
            ))}
          </div>

          {sessions.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Recent sessions</p>
              <div className="flex flex-col divide-y divide-border">
                {sessions.slice(0, 10).map((s) => (
                  <div key={s.id} className="py-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{s.aspect}</span>
                      <span className="text-xs text-muted-foreground">
                        {s.date}
                        {s.duration_minutes ? ` · ${s.duration_minutes} min` : ""}
                      </span>
                    </div>
                    {s.notes && <p className="mt-0.5 text-xs text-muted-foreground">{s.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vocabulary Recap</CardTitle>
          <CardDescription>Add new words from your Daily Check-In — this is just the list.</CardDescription>
        </CardHeader>
        <CardContent>
          {vocab.length === 0 ? (
            <p className="text-sm text-muted-foreground">No words logged yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {vocab.map((v) => (
                <span key={v.id} title={v.note ?? ""} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                  {v.word}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
