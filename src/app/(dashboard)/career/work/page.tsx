"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DailyLog, CareerReview } from "@/lib/types";
import { average, formatDateISO, daysAgo, round1 } from "@/lib/utils";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Briefcase, TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MICROCOPY } from "@/lib/constants";
import { Tabs } from "@/components/ui/tabs";
import { MomSection } from "@/components/career/MomSection";
import { CareerCalendar } from "@/components/career/CareerCalendar";
import { computeCareerSignals, CareerSignal } from "@/lib/career";
import { Activity } from "lucide-react";

export default function WorkPage() {
  const supabase = createClient();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [reviews, setReviews] = useState<CareerReview[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const since = formatDateISO(daysAgo(60));
    const [{ data: logData }, { data: reviewData }] = await Promise.all([
      supabase.from("daily_logs").select("*").eq("user_id", user.id).gte("date", since).order("date", { ascending: true }),
      supabase.from("career_reviews").select("*").eq("user_id", user.id).order("week_start", { ascending: true }),
    ]);
    setLogs((logData as DailyLog[]) ?? []);
    setReviews((reviewData as CareerReview[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const last7 = logs.slice(-7);
  const avgMainWorkload = average(last7.map((l) => l.main_role_workload));
  const avgDataWorkload = average(last7.map((l) => l.data_role_workload));
  const afterNine = last7.filter((l) => l.worked_after_9).length;
  const recoveryAfterIntense = useMemo(() => {
    const intenseDays = logs.filter((l) => (l.main_role_workload ?? 0) >= 8 || (l.data_role_workload ?? 0) >= 8);
    if (!intenseDays.length) return null;
    const withRecoveryNextDay = intenseDays.filter((l) => {
      const idx = logs.findIndex((x) => x.date === l.date);
      const next = logs[idx + 1];
      return next?.recovery;
    });
    return Math.round((withRecoveryNextDay.length / intenseDays.length) * 100);
  }, [logs]);

  const latestMainReview = [...reviews].reverse().find((r) => r.role === "main");
  const latestExpandedReview = [...reviews].reverse().find((r) => r.role === "expanded");

  const matrixData = useMemo(() => {
    const byRole = (role: "main" | "expanded") => {
      const rows = reviews.filter((r) => r.role === role);
      if (!rows.length) return null;
      const enjoyment = average(rows.map((r) => r.enjoyment));
      const learning = average(rows.map((r) => r.learning));
      if (enjoyment == null || learning == null) return null;
      return { x: round1(enjoyment), y: round1(learning), z: rows.length, name: role === "main" ? "Main Role" : "Expanded Role" };
    };
    return [byRole("main"), byRole("expanded")].filter((d): d is NonNullable<typeof d> => d != null);
  }, [reviews]);

  const signals = useMemo(() => computeCareerSignals(reviews), [reviews]);

  if (loading) return <div className="flex h-64 items-center justify-center text-muted-foreground">Loading…</div>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Sustainable Ambition</h1>
        <p className="text-sm text-muted-foreground">Be highly ambitious without sacrificing health and life.</p>
      </div>

      <Tabs
        tabs={[
          {
            key: "overview",
            label: "Overview",
            content: (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <StatCard label="Main Role Workload" value={avgMainWorkload ? `${round1(avgMainWorkload)}/10` : "—"} />
                  <StatCard label="Data Role Workload" value={avgDataWorkload ? `${round1(avgDataWorkload)}/10` : "—"} />
                  <StatCard label="Worked after 9 PM" value={`${afterNine}/7 days`} />
                  <StatCard label="Recovery after intense days" value={recoveryAfterIntense != null ? `${recoveryAfterIntense}%` : "—"} />
                </div>

                <Card>
                  <CardHeader className="flex-row items-center gap-3 space-y-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-career-light text-career">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>Career Energy vs Career Drain</CardTitle>
                      <CardDescription>
                        This week's snapshot — fill it in from your Daily Check-In. This is the analysis, not the form.
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <RoleRecap title="Main Role" subtitle="Brand Acceleration / Livestreaming Strategy" review={latestMainReview} />
                      <RoleRecap title="Expanded Role" subtitle="Data / Analytics" review={latestExpandedReview} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex-row items-center gap-3 space-y-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-career-light text-career">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>Career Signal</CardTitle>
                      <CardDescription>Last 4 weekly snapshots — is one role wearing you down, or are you okay overall?</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <SignalRow signal={signals.main} />
                    <SignalRow signal={signals.expanded} />
                    <SignalRow signal={signals.combined} emphasized />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex-row items-center gap-3 space-y-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-career-light text-career">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>Career Value Matrix</CardTitle>
                      <CardDescription>Energy/Enjoyment (x) vs Growth/Learning (y) — a lens, not a verdict on which role to drop.</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {matrixData.length === 0 ? (
                      <EmptyState message={MICROCOPY.emptyChart} />
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <ScatterChart>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" dataKey="x" domain={[1, 10]} name="Enjoyment" tick={{ fontSize: 11 }} label={{ value: "Energy / Enjoyment", position: "insideBottom", offset: -5, fontSize: 11 }} />
                          <YAxis type="number" dataKey="y" domain={[1, 10]} name="Learning" tick={{ fontSize: 11 }} label={{ value: "Growth / Learning", angle: -90, position: "insideLeft", fontSize: 11 }} />
                          <ZAxis type="number" dataKey="z" range={[200, 500]} />
                          <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ borderRadius: 16, border: "1px solid hsl(var(--border))" }} formatter={(v: number, n: string) => [v, n]} labelFormatter={() => ""} />
                          <Scatter data={matrixData} fill="#3b82f6" />
                        </ScatterChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            ),
          },
          {
            key: "meetings",
            label: "Meetings (MoM)",
            content: <MomSection />,
          },
          {
            key: "calendar",
            label: "Calendar",
            content: <CareerCalendar />,
          },
        ]}
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-xl font-bold">{value}</p>
    </div>
  );
}

function SignalRow({ signal, emphasized }: { signal: CareerSignal; emphasized?: boolean }) {
  const toneStyles: Record<CareerSignal["tone"], string> = {
    good: "bg-health-light text-health",
    watch: "bg-warn-light text-warn",
    strain: "bg-critical-light text-critical",
    unknown: "bg-muted text-muted-foreground",
  };
  return (
    <div className={`rounded-2xl p-4 ${emphasized ? "border-2 border-career/30" : "bg-muted"}`}>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="font-display text-sm font-semibold">{signal.label}</p>
        {signal.avgStress != null && signal.avgEnjoyment != null && (
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${toneStyles[signal.tone]}`}>
            Stress {round1(signal.avgStress)}/10 · Enjoyment {round1(signal.avgEnjoyment)}/10
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{signal.text}</p>
    </div>
  );
}

function RoleRecap({ title, subtitle, review }: { title: string; subtitle: string; review: CareerReview | undefined }) {
  const fields: { key: keyof CareerReview; label: string }[] = [
    { key: "workload", label: "Workload" },
    { key: "enjoyment", label: "Enjoyment" },
    { key: "learning", label: "Learning" },
    { key: "impact", label: "Impact" },
    { key: "stress", label: "Stress" },
  ];
  return (
    <div className="rounded-2xl bg-muted p-4">
      <p className="font-display text-sm font-semibold">{title}</p>
      <p className="mb-3 text-xs text-muted-foreground">{subtitle}</p>
      {!review ? (
        <p className="text-xs text-muted-foreground">No snapshot yet this week — fill it in from Daily Check-In.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {fields.map((f) => {
            const val = review[f.key] as number | null;
            return (
              <div key={f.key} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{f.label}</span>
                <span className="font-medium">{val ?? "—"}/10</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
