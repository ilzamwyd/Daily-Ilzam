"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { ContentProgressItem } from "@/lib/types";
import { Plus, Sprout } from "lucide-react";

const STAGES = ["idea", "started", "editing", "published"] as const;
const ACCOUNTS = ["ilzamwyd", "zzamallll", "Other"] as const;

export default function ContentPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<ContentProgressItem[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [contentTarget, setContentTarget] = useState(1);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const [{ data: contentData }, { data: targetData }] = await Promise.all([
        supabase.from("content_progress").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("user_targets").select("content_weekly_target").eq("user_id", user.id).maybeSingle(),
      ]);
      setItems((contentData as ContentProgressItem[]) ?? []);
      if (targetData) setContentTarget(targetData.content_weekly_target ?? 1);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <h1 className="font-display text-2xl font-bold tracking-tight">Content</h1>
        <p className="text-sm text-muted-foreground">Idea → started → editing → published. Kept lightweight on purpose.</p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-growth-light text-growth">
            <Sprout className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Content Pipeline</CardTitle>
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
