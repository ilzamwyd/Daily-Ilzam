"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { ContentProgressItem, EnglishGoal, EnglishVocab, EnglishSession } from "@/lib/types";
import { ENGLISH_ASPECTS, ASPECT_GUIDANCE, EnglishAspect } from "@/lib/english";
import { Plus, Sprout, Languages, Check, Circle } from "lucide-react";
import { formatDateISO, daysAgo } from "@/lib/utils";
import { EnglishSessionsChart } from "@/components/charts/EnglishSessionsChart";

const STAGES = ["idea", "started", "editing", "published"] as const;
const ACCOUNTS = ["ilzamwyd", "zzamallll", "Other"] as const;

export default function GrowthPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<ContentProgressItem[]>([]);
  const [goals, setGoals] = useState<EnglishGoal[]>([]);
  const [vocab, setVocab] = useState<EnglishVocab[]>([]);
  const [sessions, setSessions] = useState<EnglishSession[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [englishTarget, setEnglishTarget] = useState(3);
  const [contentTarget, setContentTarget] = useState(1);

  async function load() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const since = formatDateISO(daysAgo(56));
    const [{ data: contentData }, { data: targetData }, { data: goalData }, { data: vocabData }, { data: sessionData }] =
      await Promise.all([
        supabase.from("content_progress").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("user_targets").select("english_weekly_target, content_weekly_target").eq("user_id", user.id).maybeSingle(),
        supabase.from("english_goals").select("*").eq("user_id", user.id).order("target_date", { ascending: true }),
        supabase.from("english_vocab").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
        supabase.from("english_sessions").select("*").eq("user_id", user.id).gte("date", since).order("date", { ascending: false }),
      ]);

    setItems((contentData as ContentProgressItem[]) ?? []);
    setGoals((goalData as EnglishGoal[]) ?? []);
    setVocab((vocabData as EnglishVocab[]) ?? []);
    setSessions((sessionData as EnglishSession[]) ?? []);
    if (targetData) {
      setEnglishTarget(targetData.english_weekly_target ?? 3);
      setContentTarget(targetData.content_weekly_target ?? 1);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
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
    const last = aspectSessions[0]; // sessions already sorted date desc
    return { aspect, count: aspectSessions.length, lastDate: last?.date ?? null };
  });

  async function toggleGoal(goal: EnglishGoal) {
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? { ...g, achieved: !g.achieved } : g)));
    await supabase.from("english_goals").update({ achieved: !goal.achieved }).eq("id", goal.id);
  }

  async function addItem() {
    if (!newTitle.trim() || !userId) return;
    const { data } = await supabase
      .from("content_progress")
      .insert({ user_id: userId, title: newTitle.trim(), stage: "idea" })
      .select()
      .single();
    if (data) setItems((prev) => [data as ContentProgressItem, ...prev]);
    setNewTitle("");
  }

  function patchItem(id: string, patch: Partial<ContentProgressItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }
  async function saveItem(id: string, patch: Partial<ContentProgressItem>) {
    await supabase.from("content_progress").update(patch).eq("id", id);
  }

  if (loading) return <div className="flex h-64 items-center justify-center text-muted-foreground">Loading…</div>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Growth</h1>
        <p className="text-sm text-muted-foreground">English practice and content creation — no streaks, just steady reps.</p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-growth-light text-growth">
            <Languages className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>English</CardTitle>
            <CardDescription>Log sessions from your Daily Check-In — this is a recap.</CardDescription>
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

          <div>
            <p className="mb-3 text-xs font-medium text-muted-foreground">Progress by aspect (last 8 weeks)</p>
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
          </div>

          {sessions.length > 0 && (
            <div>
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

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Vocabulary recap (add new words from your Daily Check-In)</p>
            {vocab.length === 0 ? (
              <p className="text-xs text-muted-foreground">No words logged yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {vocab.map((v) => (
                  <span key={v.id} title={v.note ?? ""} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                    {v.word}
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-growth-light text-growth">
            <Sprout className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Content Creation</CardTitle>
            <CardDescription>Target: {contentTarget} published/week</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Input
              placeholder="New content idea…"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
            />
            <Button onClick={addItem} size="icon" aria-label="Add">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing in the pipeline yet — add your first idea above.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <li key={item.id} className="flex flex-col gap-3 rounded-2xl bg-muted p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm font-medium">{item.title}</span>
                    <Segmented
                      options={STAGES}
                      value={item.stage}
                      onChange={(s) => {
                        patchItem(item.id!, { stage: s });
                        saveItem(item.id!, { stage: s });
                      }}
                      activeClassName="bg-growth text-white border-growth"
                    />
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Segmented
                      options={ACCOUNTS}
                      value={item.account as (typeof ACCOUNTS)[number] | null}
                      onChange={(a) => {
                        patchItem(item.id!, { account: a });
                        saveItem(item.id!, { account: a });
                      }}
                    />
                  </div>
                  <Input
                    placeholder="Result — e.g. views, comments, what happened after publishing"
                    value={item.result_notes ?? ""}
                    onChange={(e) => patchItem(item.id!, { result_notes: e.target.value })}
                    onBlur={(e) => saveItem(item.id!, { result_notes: e.target.value })}
                  />
                  <Input
                    placeholder="Next action"
                    value={item.next_action ?? ""}
                    onChange={(e) => patchItem(item.id!, { next_action: e.target.value })}
                    onBlur={(e) => saveItem(item.id!, { next_action: e.target.value })}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
