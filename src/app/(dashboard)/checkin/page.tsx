"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DailyLog, emptyDailyLog } from "@/lib/types";
import { formatDateISO } from "@/lib/utils";
import { SectionCard } from "@/components/checkin/SectionCard";
import { ToggleRow } from "@/components/checkin/ToggleRow";
import { Slider } from "@/components/ui/slider";
import { Segmented } from "@/components/ui/segmented";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { EXERCISE_TYPES, SOCIAL_TYPES, RECOVERY_TYPES } from "@/lib/constants";
import { CheckCircle2, Calendar } from "lucide-react";
import { MealSlotLogger } from "@/components/health/MealSlotLogger";
import { ExerciseLogger } from "@/components/health/ExerciseLogger";
import { WaterLogger } from "@/components/health/WaterLogger";
import { EnglishSessionLogger } from "@/components/growth/EnglishSessionLogger";
import { VocabLogger } from "@/components/growth/VocabLogger";

export default function CheckInPage() {
  const supabase = createClient();
  const [date, setDate] = useState(formatDateISO(new Date()));
  const [log, setLog] = useState<DailyLog>(emptyDailyLog(date));
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", date)
        .maybeSingle();

      setLog(data ? (data as DailyLog) : emptyDailyLog(date));
      setLoading(false);
      setSaved(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  function update<K extends keyof DailyLog>(key: K, value: DailyLog[K]) {
    setLog((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    const payload = { ...log, user_id: userId, date };
    const { error } = await supabase.from("daily_logs").upsert(payload, { onConflict: "user_id,date" });
    setSaving(false);
    if (!error) setSaved(true);
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">Loading today…</div>;
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Daily Check-In</h1>
          <p className="text-sm text-muted-foreground">Under 2 minutes. That's the whole point.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={date}
            max={formatDateISO(new Date())}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent text-sm focus:outline-none"
          />
        </div>
      </div>

      <SectionCard title="Body" icon="Scale" colorClass="bg-health-light text-health">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Weight (kg)</label>
            <Input type="number" step="0.1" value={log.weight ?? ""} onChange={(e) => update("weight", e.target.value ? Number(e.target.value) : null)} placeholder="Optional" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Waist (cm)</label>
            <Input type="number" step="0.1" value={log.waist ?? ""} onChange={(e) => update("waist", e.target.value ? Number(e.target.value) : null)} placeholder="Usually weekly" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Sleep (hours)</label>
            <Input type="number" step="0.1" value={log.sleep_hours ?? ""} onChange={(e) => update("sleep_hours", e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 7.5" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Steps</label>
            <Input type="number" value={log.steps ?? ""} onChange={(e) => update("steps", e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 7500" />
          </div>
        </div>
        <div className="mt-4">
          <WaterLogger date={date} />
        </div>
      </SectionCard>

      <SectionCard title="Fitness" icon="Dumbbell" colorClass="bg-fitness-light text-fitness">
        <ToggleRow label="Gym completed?" checked={log.gym} onChange={(v) => update("gym", v)} activeClassName="bg-fitness" />
        <ToggleRow label="PT session?" checked={log.pt_session} onChange={(v) => update("pt_session", v)} activeClassName="bg-fitness" />
        <div>
          <label className="mb-2 block text-sm font-medium">Exercise type</label>
          <Segmented options={EXERCISE_TYPES} value={log.exercise_type} onChange={(v) => update("exercise_type", v)} activeClassName="bg-fitness text-white border-fitness" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Duration (minutes, optional)</label>
          <Input type="number" value={log.exercise_duration ?? ""} onChange={(e) => update("exercise_duration", e.target.value ? Number(e.target.value) : null)} />
        </div>
        <ExerciseLogger date={date} />
      </SectionCard>

      <SectionCard title="Nutrition" icon="Apple" colorClass="bg-health-light text-health">
        <ToggleRow label="HealthyGo meal completed?" checked={log.healthygo} onChange={(v) => update("healthygo", v)} activeClassName="bg-health" />
        <ToggleRow label="Other meals controlled?" checked={log.other_meals_controlled} onChange={(v) => update("other_meals_controlled", v)} activeClassName="bg-health" />
        <div>
          <label className="mb-2 block text-sm font-medium">Stress eating?</label>
          <Segmented options={["no", "small", "significant"] as const} value={log.stress_eating} onChange={(v) => update("stress_eating", v)} activeClassName="bg-warn text-white border-warn" />
        </div>
        {log.stress_eating !== "no" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium">What triggered it?</label>
            <Textarea rows={2} value={log.stress_eating_trigger ?? ""} onChange={(e) => update("stress_eating_trigger", e.target.value)} />
          </div>
        )}
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MealSlotLogger date={date} slot="breakfast" label="Breakfast" />
          <MealSlotLogger date={date} slot="lunch" label="Lunch" />
          <MealSlotLogger date={date} slot="snack" label="Snack" />
          <MealSlotLogger date={date} slot="dinner" label="Dinner" />
        </div>
        <p className="text-xs text-muted-foreground">Full calorie recap, targets, and trends live on the Health page.</p>
      </SectionCard>

      <SectionCard title="Spiritual" description="For reflection only — never scored." icon="Moon" colorClass="bg-spiritual-light text-spiritual">
        <Slider value={log.prayers_completed} onChange={(v) => update("prayers_completed", v)} min={0} max={5} accentClassName="accent-spiritual" labels={["0", "5"]} />
      </SectionCard>

      <SectionCard title="Mind" icon="Brain" colorClass="bg-mental-light text-mental">
        <div>
          <label className="mb-1 block text-sm font-medium">Mood</label>
          <Slider value={log.mood} onChange={(v) => update("mood", v)} accentClassName="accent-mental" labels={["Low", "Great"]} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Stress</label>
          <Slider value={log.stress} onChange={(v) => update("stress", v)} accentClassName="accent-mental" labels={["Calm", "High"]} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Energy</label>
          <Slider value={log.energy} onChange={(v) => update("energy", v)} accentClassName="accent-mental" labels={["Depleted", "Full"]} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">How are you feeling today? (optional)</label>
          <Textarea rows={2} value={log.mind_note ?? ""} onChange={(e) => update("mind_note", e.target.value)} />
        </div>
      </SectionCard>

      <SectionCard title="Connection" icon="Users" colorClass="bg-social-light text-social">
        <ToggleRow label="Family contact?" checked={log.family_contact} onChange={(v) => update("family_contact", v)} activeClassName="bg-social" />
        <ToggleRow label="Family call?" checked={log.family_call} onChange={(v) => update("family_call", v)} activeClassName="bg-social" />
        <ToggleRow label="Social activity?" checked={log.social_activity} onChange={(v) => update("social_activity", v)} activeClassName="bg-social" />
        {log.social_activity && (
          <div>
            <label className="mb-2 block text-sm font-medium">Social activity type</label>
            <Segmented options={SOCIAL_TYPES} value={log.social_type} onChange={(v) => update("social_type", v)} activeClassName="bg-social text-white border-social" />
          </div>
        )}
      </SectionCard>

      <SectionCard title="Personal Growth" icon="Sprout" colorClass="bg-growth-light text-growth">
        <div>
          <label className="mb-1.5 block text-sm font-medium">English practice</label>
          <EnglishSessionLogger date={date} />
        </div>
        <div className="border-t border-border pt-4">
          <VocabLogger date={date} />
        </div>
        <ToggleRow label="Content worked on?" checked={log.content_worked} onChange={(v) => update("content_worked", v)} activeClassName="bg-growth" />
        <ToggleRow label="Content published?" checked={log.content_published} onChange={(v) => update("content_published", v)} activeClassName="bg-growth" />
      </SectionCard>

      <SectionCard title="Work" icon="Briefcase" colorClass="bg-career-light text-career">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Work finish time</label>
          <Input type="time" value={log.work_finish_time ?? ""} onChange={(e) => update("work_finish_time", e.target.value)} />
        </div>
        <ToggleRow label="Worked after 9 PM?" checked={log.worked_after_9} onChange={(v) => update("worked_after_9", v)} activeClassName="bg-warn" />
        <div>
          <label className="mb-1 block text-sm font-medium">Main role workload</label>
          <Slider value={log.main_role_workload} onChange={(v) => update("main_role_workload", v)} accentClassName="accent-career" labels={["Light", "Heavy"]} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Expanded data role workload</label>
          <Slider value={log.data_role_workload} onChange={(v) => update("data_role_workload", v)} accentClassName="accent-career" labels={["Light", "Heavy"]} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Today's biggest work pressure (optional)</label>
          <Textarea rows={2} value={log.work_pressure_note ?? ""} onChange={(e) => update("work_pressure_note", e.target.value)} />
        </div>
      </SectionCard>

      <SectionCard title="Recovery" description="Rest is part of the system." icon="BatteryCharging" colorClass="bg-recovery-light text-recovery">
        <ToggleRow label="Intentional do-nothing time?" checked={log.recovery} onChange={(v) => update("recovery", v)} activeClassName="bg-recovery" />
        {log.recovery && (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Duration (minutes)</label>
              <Input type="number" value={log.recovery_minutes ?? ""} onChange={(e) => update("recovery_minutes", e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Recovery activity</label>
              <Segmented options={RECOVERY_TYPES} value={log.recovery_type} onChange={(v) => update("recovery_type", v)} activeClassName="bg-recovery text-white border-recovery" />
            </div>
          </>
        )}
      </SectionCard>

      <SectionCard title="Anything else" icon="NotebookPen" colorClass="bg-muted text-foreground">
        <Textarea rows={3} value={log.notes ?? ""} onChange={(e) => update("notes", e.target.value)} placeholder="Optional notes for the day" />
      </SectionCard>

      <div className="sticky bottom-20 md:bottom-4">
        <Button size="lg" className="w-full gap-2" onClick={handleSave} disabled={saving}>
          <CheckCircle2 className="h-5 w-5" />
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save today's check-in"}
        </Button>
      </div>
    </div>
  );
}
