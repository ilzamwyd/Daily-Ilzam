"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { ContentProgressItem, DailyLog } from "@/lib/types";
import { Plus, Sprout, Languages } from "lucide-react";
import { formatDateISO, daysAgo } from "@/lib/utils";

const STAGES = ["idea", "started", "editing", "published"] as const;

export default function GrowthPage() {
  const supabase = createClient();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [items, setItems] = useState<ContentProgressItem[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [englishTarget, setEnglishTarget] = useState(3);
  const [contentTarget, setContentTarget] = useState(1);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const since = formatDateISO(daysAgo(14));
    const [{ data: logData }, { data: contentData }, { data: targetData }] = await Promise.all([
      supabase.from("daily_logs").select("*").eq("user_id", user.id).gte("date", since).order("date", { ascending: true }),
      supabase.from("content_progress").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("user_targets").select("english_weekly_target, content_weekly_target").eq("user_id", user.id).maybeSingle(),
    ]);

    setLogs((logData as DailyLog[]) ?? []);
    setItems((contentData as ContentProgressItem[]) ?? []);
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

  const last7 = logs.slice(-7);
  const englishSessions = last7.filter((l) => l.english_practice).length;
  const published = last7.filter((l) => l.content_published).length;

  async function addItem() {
    if (!newTitle.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("content_progress")
      .insert({ user_id: user.id, title: newTitle.trim(), stage: "idea" })
      .select()
      .single();
    if (data) setItems((prev) => [data as ContentProgressItem, ...prev]);
    setNewTitle("");
  }

  async function updateStage(id: string, stage: (typeof STAGES)[number]) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, stage } : i)));
    await supabase.from("content_progress").update({ stage }).eq("id", id);
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
            <CardDescription>10–20 minute sessions, {englishTarget}/week</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="font-display text-3xl font-bold text-growth">
            {englishSessions} / {englishTarget} <span className="text-base font-medium text-muted-foreground">sessions this week</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-growth-light text-growth">
            <Sprout className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Content Creation</CardTitle>
            <CardDescription>Target: {contentTarget} published/week · {published} published this week</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Input placeholder="New content idea…" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addItem()} />
            <Button onClick={addItem} size="icon" aria-label="Add">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing in the pipeline yet — add your first idea above.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <li key={item.id} className="flex flex-col gap-2 rounded-2xl bg-muted p-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm font-medium">{item.title}</span>
                  <Segmented options={STAGES} value={item.stage} onChange={(s) => updateStage(item.id!, s)} activeClassName="bg-growth text-white border-growth" />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
