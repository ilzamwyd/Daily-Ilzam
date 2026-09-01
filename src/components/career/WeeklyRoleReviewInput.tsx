"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CareerReview } from "@/lib/types";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { formatDateISO, startOfWeek } from "@/lib/utils";
import { Check } from "lucide-react";

const FIELDS: { key: keyof CareerReview; label: string }[] = [
  { key: "workload", label: "Workload" },
  { key: "enjoyment", label: "Enjoyment" },
  { key: "learning", label: "Learning" },
  { key: "impact", label: "Impact" },
  { key: "stress", label: "Stress" },
];

function RoleCard({
  title,
  subtitle,
  review,
  setReview,
  onSave,
  saving,
  saved,
}: {
  title: string;
  subtitle: string;
  review: Partial<CareerReview>;
  setReview: (v: Partial<CareerReview>) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  return (
    <div className="rounded-2xl bg-muted p-4">
      <p className="font-display text-sm font-semibold">{title}</p>
      <p className="mb-3 text-xs text-muted-foreground">{subtitle}</p>
      <div className="flex flex-col gap-3">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="mb-0.5 block text-xs font-medium text-muted-foreground">{f.label}</label>
            <Slider value={(review[f.key] as number) ?? null} onChange={(v) => setReview({ ...review, [f.key]: v })} accentClassName="accent-career" />
          </div>
        ))}
        <Button size="sm" onClick={onSave} disabled={saving} variant="soft" className="gap-1.5">
          {saved && <Check className="h-3.5 w-3.5" />}
          {saving ? "Saving…" : saved ? "Saved for today" : "Save today"}
        </Button>
      </div>
    </div>
  );
}

export function WeeklyRoleReviewInput() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [mainReview, setMainReview] = useState<Partial<CareerReview>>({ role: "main" });
  const [expandedReview, setExpandedReview] = useState<Partial<CareerReview>>({ role: "expanded" });
  const [saving, setSaving] = useState(false);
  const [savedRole, setSavedRole] = useState<"main" | "expanded" | null>(null);
  const [loading, setLoading] = useState(true);

  const today = formatDateISO(new Date());

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase
        .from("career_reviews")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today);
      const rows = (data as CareerReview[]) ?? [];
      const main = rows.find((r) => r.role === "main");
      const expanded = rows.find((r) => r.role === "expanded");
      if (main) setMainReview(main);
      if (expanded) setExpandedReview(expanded);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveReview(role: "main" | "expanded") {
    if (!userId) return;
    setSaving(true);
    setSavedRole(null);
    const payload = role === "main" ? mainReview : expandedReview;
    const { data } = await supabase
      .from("career_reviews")
      .upsert({ ...payload, role, date: today, week_start: formatDateISO(startOfWeek(new Date())), user_id: userId }, { onConflict: "user_id,date,role" })
      .select()
      .single();
    if (data) {
      if (role === "main") setMainReview(data as CareerReview);
      else setExpandedReview(data as CareerReview);
      setSavedRole(role);
    }
    setSaving(false);
  }

  if (loading) return null;

  return (
    <div>
      <p className="mb-3 text-xs text-muted-foreground">
        Today's snapshot ({today}) — one quick rating per role, per day. The Work page averages your days into a weekly recap automatically.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <RoleCard
          title="Main Role"
          subtitle="Brand Acceleration / Livestreaming Strategy"
          review={mainReview}
          setReview={setMainReview}
          onSave={() => saveReview("main")}
          saving={saving}
          saved={savedRole === "main"}
        />
        <RoleCard
          title="Expanded Role"
          subtitle="Data / Analytics"
          review={expandedReview}
          setReview={setExpandedReview}
          onSave={() => saveReview("expanded")}
          saving={saving}
          saved={savedRole === "expanded"}
        />
      </div>
    </div>
  );
}
