import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getRecentLogs, getTargets } from "@/lib/data";
import { computeWeeklyBalanceScore } from "@/lib/score";
import { generateInsights } from "@/lib/insights";
import { average, formatDateISO, round1 } from "@/lib/utils";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { WeeklyBalanceRing } from "@/components/dashboard/WeeklyBalanceRing";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WeightChart } from "@/components/charts/WeightChart";
import { StepsChart } from "@/components/charts/StepsChart";
import { MICROCOPY } from "@/lib/constants";
import { ArrowRight, Moon, Smile, Zap, Footprints, BatteryCharging } from "lucide-react";

export default async function OverviewPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const logs = await getRecentLogs(supabase, user.id, 60);
  const targets = await getTargets(supabase, user.id);
  const today = formatDateISO(new Date());
  const todayLog = logs.find((l) => l.date === today) ?? null;
  const last7 = logs.slice(-7);
  const last14 = logs.slice(-14, -7);

  const since7 = last7[0]?.date ?? today;
  const { count: englishSessionCount } = await supabase
    .from("english_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("date", since7);

  const balance = computeWeeklyBalanceScore(last7, targets, englishSessionCount ?? undefined);
  const insights = generateInsights(logs);

  const avgSteps = average(last7.map((l) => l.steps));
  const avgSleep = average(last7.map((l) => l.sleep_hours));
  const avgMood = average(last7.map((l) => l.mood));
  const avgStress = average(last7.map((l) => l.stress));
  const gymCount = last7.filter((l) => l.gym).length;
  const recoveryCount = last7.filter((l) => l.recovery).length;

  const currentWeight = [...logs].reverse().find((l) => l.weight != null)?.weight ?? null;
  const weightChange =
    currentWeight != null && targets.starting_weight != null
      ? round1(currentWeight - targets.starting_weight)
      : null;

  if (logs.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl font-bold tracking-tight">Daily Ilzam</h1>
        <p className="mt-2 text-muted-foreground">{MICROCOPY.greeting}</p>
        <div className="mt-8">
          <EmptyState message={MICROCOPY.emptyStory} />
        </div>
        <div className="mt-6 flex justify-center">
          <Link href="/checkin">
            <Button size="lg" className="gap-2">
              Complete Today's Check-In <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="gradient-aurora rounded-3xl p-6 md:p-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">Daily Ilzam</h1>
        <p className="mt-2 text-muted-foreground">{MICROCOPY.greeting}</p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <TodayStat icon={Moon} label="Sleep" value={todayLog?.sleep_hours ? `${todayLog.sleep_hours}h` : "—"} />
          <TodayStat icon={Smile} label="Mood" value={todayLog?.mood ? `${todayLog.mood}/10` : "—"} />
          <TodayStat icon={Zap} label="Stress" value={todayLog?.stress ? `${todayLog.stress}/10` : "—"} />
          <TodayStat icon={Footprints} label="Steps" value={todayLog?.steps ? `${todayLog.steps}` : "—"} />
          <TodayStat icon={BatteryCharging} label="Recovery" value={todayLog ? (todayLog.recovery ? "Yes" : "Not yet") : "—"} />
        </div>

        <div className="mt-6">
          <Link href="/checkin">
            <Button size="lg" className="gap-2">
              {todayLog ? "Update Today's Check-In" : "Complete Today's Check-In"} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Current Weight" value={currentWeight != null ? `${currentWeight} kg` : "—"} sub={weightChange != null ? `${weightChange > 0 ? "+" : ""}${weightChange} kg vs start` : undefined} icon="Scale" colorClass="bg-health-light text-health" />
        <KpiCard label="Gym Sessions" value={`${gymCount}/${targets.gym_weekly_target}`} sub="this week" icon="Dumbbell" colorClass="bg-fitness-light text-fitness" />
        <KpiCard label="Avg Sleep" value={avgSleep ? `${round1(avgSleep)}h` : "—"} sub="this week" icon="Moon" colorClass="bg-mental-light text-mental" />
        <KpiCard label="Avg Steps" value={avgSteps ? `${Math.round(avgSteps)}` : "—"} sub="this week" icon="Footprints" colorClass="bg-fitness-light text-fitness" />
        <KpiCard label="Avg Mood" value={avgMood ? `${round1(avgMood)}/10` : "—"} sub="this week" icon="Smile" colorClass="bg-mental-light text-mental" />
        <KpiCard label="Avg Stress" value={avgStress ? `${round1(avgStress)}/10` : "—"} sub="this week" icon="Activity" colorClass="bg-mental-light text-mental" />
        <KpiCard label="Recovery Days" value={`${recoveryCount}/7`} sub="this week" icon="BatteryCharging" colorClass="bg-recovery-light text-recovery" />
        <KpiCard label="Social Activities" value={`${last7.filter((l) => l.social_activity).length}`} sub="this week" icon="Users" colorClass="bg-social-light text-social" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Weekly Balance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyBalanceRing score={balance?.overall ?? null} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weight Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <WeightChart logs={logs} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <StepsChart logs={logs} target={targets.step_target} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <InsightsPanel insights={insights} />
        </CardContent>
      </Card>
    </div>
  );
}

function TodayStat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card/70 p-3 text-center backdrop-blur">
      <Icon className="mx-auto h-4 w-4 text-muted-foreground" />
      <p className="mt-1 font-display text-lg font-semibold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
