"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserTargets, DEFAULT_TARGETS } from "@/lib/types";
import { Settings as SettingsIcon } from "lucide-react";
import { WorkHourAlarm } from "@/components/settings/WorkHourAlarm";

const FIELDS: { key: keyof UserTargets; label: string; type: string; step?: string }[] = [
  { key: "starting_weight", label: "Starting weight (kg)", type: "number", step: "0.1" },
  { key: "step_target", label: "Daily step target", type: "number" },
  { key: "gym_weekly_target", label: "Gym sessions / week", type: "number" },
  { key: "sleep_target_min", label: "Sleep target — min (hours)", type: "number", step: "0.5" },
  { key: "sleep_target_max", label: "Sleep target — max (hours)", type: "number", step: "0.5" },
  { key: "english_weekly_target", label: "English sessions / week", type: "number" },
  { key: "content_weekly_target", label: "Content published / week", type: "number" },
  { key: "social_weekly_target", label: "Social activities / week", type: "number" },
  { key: "family_contact_weekly_target", label: "Family contacts / week", type: "number", step: "0.5" },
  { key: "preferred_finish_time", label: "Preferred work finish time", type: "time" },
  { key: "hard_stop_time", label: "Hard stop work time", type: "time" },
  { key: "recovery_daily_min_minutes", label: "Recovery — min minutes/day", type: "number" },
  { key: "recovery_daily_max_minutes", label: "Recovery — max minutes/day", type: "number" },
];

export default function SettingsPage() {
  const supabase = createClient();
  const [targets, setTargets] = useState<UserTargets>(DEFAULT_TARGETS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("user_targets").select("*").eq("user_id", user.id).maybeSingle();
      if (data) setTargets(data as UserTargets);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update<K extends keyof UserTargets>(key: K, value: UserTargets[K]) {
    setTargets((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSaving(true);
    await supabase.from("user_targets").upsert({ ...targets, user_id: user.id }, { onConflict: "user_id" });
    setSaving(false);
    setSaved(true);
  }

  if (loading) return <div className="flex h-64 items-center justify-center text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 pb-10">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Your targets, your pace. Nothing here is permanent.</p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-foreground">
            <SettingsIcon className="h-5 w-5" />
          </div>
          <CardTitle>Targets &amp; Preferences</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="mb-1.5 block text-sm font-medium">{f.label}</label>
              <Input
                type={f.type}
                step={f.step}
                value={(targets[f.key] as number | string) ?? ""}
                onChange={(e) =>
                  update(f.key, (f.type === "number" ? (e.target.value ? Number(e.target.value) : null) : e.target.value) as UserTargets[typeof f.key])
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <WorkHourAlarm hardStopTime={targets.hard_stop_time} />

      <Button size="lg" onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save settings"}
      </Button>
    </div>
  );
}
