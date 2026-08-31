"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonthlyPriority } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Plus, Check, Circle, Sparkles, Loader2 } from "lucide-react";

function monthStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export default function MonthlyPlanPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [month] = useState(monthStr());
  const [priorities, setPriorities] = useState<MonthlyPriority[]>([]);
  const [newPriority, setNewPriority] = useState("");
  const [entryText, setEntryText] = useState("");
  const [reflection, setReflection] = useState<string | null>(null);
  const [reflecting, setReflecting] = useState(false);
  const [reflectError, setReflectError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [{ data: pri }, { data: refl }] = await Promise.all([
        supabase.from("monthly_priorities").select("*").eq("user_id", user.id).eq("month", month).order("created_at"),
        supabase.from("monthly_reflections").select("*").eq("user_id", user.id).eq("month", month).maybeSingle(),
      ]);
      setPriorities((pri as MonthlyPriority[]) ?? []);
      if (refl) {
        setEntryText(refl.entry_text ?? "");
        setReflection(refl.ai_reflection ?? null);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addPriority() {
    if (!userId || !newPriority.trim()) return;
    const { data } = await supabase
      .from("monthly_priorities")
      .insert({ user_id: userId, month, priority_text: newPriority.trim(), done: false })
      .select()
      .single();
    if (data) setPriorities((prev) => [...prev, data as MonthlyPriority]);
    setNewPriority("");
  }

  async function toggle(p: MonthlyPriority) {
    setPriorities((prev) => prev.map((x) => (x.id === p.id ? { ...x, done: !x.done } : x)));
    await supabase.from("monthly_priorities").update({ done: !p.done }).eq("id", p.id);
  }

  async function saveEntry() {
    if (!userId) return;
    setSaving(true);
    await supabase
      .from("monthly_reflections")
      .upsert({ user_id: userId, month, entry_text: entryText }, { onConflict: "user_id,month" });
    setSaving(false);
  }

  async function handleReflect() {
    setReflectError(null);
    setReflecting(true);
    try {
      await saveEntry();
      const res = await fetch("/api/monthly-plan/reflect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ entryText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReflectError(data.error ?? "Something went wrong.");
        return;
      }
      setReflection(data.reflection);
      if (userId) {
        await supabase
          .from("monthly_reflections")
          .upsert({ user_id: userId, month, entry_text: entryText, ai_reflection: data.reflection }, { onConflict: "user_id,month" });
      }
    } finally {
      setReflecting(false);
    }
  }

  const monthLabel = new Date(month).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const doneCount = priorities.filter((p) => p.done).length;

  if (loading) return null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Monthly Plan</h1>
        <p className="mt-1 text-sm text-muted-foreground">{monthLabel} — what matters most, and how you're really doing.</p>
      </div>

      <Card className="p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">This Month's Priorities</h2>
          {priorities.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {doneCount}/{priorities.length} done
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add a priority for this month…"
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPriority()}
          />
          <Button size="icon" onClick={addPriority} disabled={!newPriority.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {priorities.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nothing set yet — what's the one thing this month needs to go well?</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {priorities.map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                <button onClick={() => toggle(p)} className="text-career">
                  {p.done ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                </button>
                <span className={`text-sm ${p.done ? "text-muted-foreground line-through" : ""}`}>{p.priority_text}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-base font-semibold">Curhat Session</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A private space for what's actually on your mind this month. Only you can see this.
        </p>
        <Textarea
          rows={7}
          className="mt-3"
          placeholder="What's been weighing on you? What's been good? Write freely…"
          value={entryText}
          onChange={(e) => setEntryText(e.target.value)}
          onBlur={saveEntry}
        />
        <div className="mt-3 flex items-center gap-2">
          <Button type="button" className="gap-2" onClick={handleReflect} disabled={reflecting || entryText.trim().length < 10}>
            {reflecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {reflecting ? "Reading…" : "Get a Reflection"}
          </Button>
          {saving && <span className="text-xs text-muted-foreground">Saving…</span>}
        </div>
        {reflectError && <p className="mt-2 text-sm text-critical">{reflectError}</p>}
        {reflection && (
          <div className="mt-4 rounded-2xl border border-social/30 bg-social-light/40 p-4">
            <p className="text-sm leading-relaxed">{reflection}</p>
          </div>
        )}
        {!reflection && !reflectError && <EmptyState message="Write a bit about your month, then ask for a reflection." />}
      </Card>
    </div>
  );
}
