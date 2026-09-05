import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getRecentLogs, getTargets } from "@/lib/data";
import { computeWeeklyBalanceScore } from "@/lib/score";
import { generateInsights, generateCalorieInsights } from "@/lib/insights";
import { average, formatDateISO, round1, daysAgo } from "@/lib/utils";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { WeeklyBalanceRing } from "@/components/dashboard/WeeklyBalanceRing";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WeightChart } from "@/components/charts/WeightChart";
import { StepsChart } from "@/components/charts/StepsChart";
import { MindTrendChart } from "@/components/charts/MindTrendChart";
import { MICROCOPY } from "@/lib/constants";
import { ArrowRight, Moon, Smile, Zap, Footprints, BatteryCharging, Brain, Wallet, Flame } from "lucide-react";
import { getTransactionsForMonth, getBudgetsForMonth } from "@/lib/data";
import { monthStr, summarizeByCode, formatIDR } from "@/lib/finance";

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

  const since14 = formatDateISO(daysAgo(13));
  const { data: foodRows } = await supabase
    .from("food_log")
    .select("date, total_calories")
    .eq("user_id", user.id)
    .gte("date", since14);
  const calorieByDate = new Map<string, number>();
  for (const row of (foodRows as { date: string; total_calories: number }[]) ?? []) {
    calorieByDate.set(row.date, (calorieByDate.get(row.date) ?? 0) + Number(row.total_calories));
  }
  const dailyCalorieTotals = Array.from(calorieByDate.entries())
    .map(([date, kcal]) => ({ date, kcal }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const todayCalories = calorieByDate.get(today) ?? 0;
  const overLimitDays = targets.calorie_max
    ? dailyCalorieTotals.filter((d) => d.kcal > (targets.calorie_max as number)).slice(-7).reverse()
    : [];

  const insights = [...generateInsights(logs), ...generateCalorieInsights(dailyCalorieTotals, targets.calorie_max)];

  const avgMainWorkload = average(last7.map((l) => l.main_role_workload));
  const avgDataWorkload = average(last7.map((l) => l.data_role_workload));
  const afterNine = last7.filter((l) => l.worked_after_9).length;
  const intenseDays = logs.filter((l) => (l.main_role_workload ?? 0) >= 8 || (l.data_role_workload ?? 0) >= 8);
  const recoveryAfterIntense =
    intenseDays.length === 0
      ? null
      : Math.round(
          (intenseDays.filter((l) => {
            const idx = logs.findIndex((x) => x.date === l.date);
            return logs[idx + 1]?.recovery;
          }).length /
            intenseDays.length) *
            100
        );

  const currentMonth = monthStr();
  const [monthTransactions, monthBudgets] = await Promise.all([
    getTransactionsForMonth(supabase, user.id, currentMonth),
    getBudgetsForMonth(supabase, user.id, currentMonth),
  ]);
  const monthIncome = monthTransactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const monthExpense = monthTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const expenseSummary = summarizeByCode(monthTransactions, monthBudgets, currentMonth, "expense");
  const totalBudgeted = expenseSummary.reduce((s, c) => s + c.budgeted, 0);
  const budgetUsedPct = totalBudgeted > 0 ? Math.round((monthExpense / totalBudgeted) * 100) : null;

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

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-career-light text-career">
              <Zap className="h-5 w-5" />
            </div>
            <CardTitle>Workload &amp; Stress Management</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <StatRow label="Main Role Workload" value={avgMainWorkload ? `${round1(avgMainWorkload)}/10` : "—"} />
            <StatRow label="Expanded Role Workload" value={avgDataWorkload ? `${round1(avgDataWorkload)}/10` : "—"} />
            <StatRow label="Worked after 9 PM" value={`${afterNine}/7 days`} />
            <StatRow label="Recovered after intense days" value={recoveryAfterIntense != null ? `${recoveryAfterIntense}%` : "—"} />
            <Link href="/career/work" className="mt-1 text-xs font-medium text-career hover:underline">
              See full Career Signal →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-mental-light text-mental">
              <Brain className="h-5 w-5" />
            </div>
            <CardTitle>Mood, Stress &amp; Energy</CardTitle>
          </CardHeader>
          <CardContent>
            <MindTrendChart logs={last7} />
            <Link href="/health/mind" className="mt-2 inline-block text-xs font-medium text-mental hover:underline">
              See patterns on Mind →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-finance-light text-finance">
              <Wallet className="h-5 w-5" />
            </div>
            <CardTitle>Finance vs Budgeting</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <StatRow label="Income (this month)" value={formatIDR(monthIncome)} />
            <StatRow label="Expense (this month)" value={formatIDR(monthExpense)} />
            <StatRow
              label="Remaining"
              value={formatIDR(monthIncome - monthExpense)}
              valueClass={monthIncome - monthExpense >= 0 ? "text-finance" : "text-critical"}
            />
            {budgetUsedPct != null && <StatRow label="Budget used" value={`${budgetUsedPct}%`} />}
            <Link href="/career/finance" className="mt-1 text-xs font-medium text-finance hover:underline">
              See full Finance →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-warn-light text-warn">
              <Flame className="h-5 w-5" />
            </div>
            <CardTitle>Calories</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <StatRow
              label="Today"
              value={targets.calorie_max ? `${Math.round(todayCalories)} / ${targets.calorie_max} kcal` : `${Math.round(todayCalories)} kcal`}
              valueClass={targets.calorie_max && todayCalories > targets.calorie_max ? "text-critical" : undefined}
            />
            {overLimitDays.length > 0 ? (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Went over limit on:</p>
                <ul className="flex flex-col gap-1">
                  {overLimitDays.map((d) => (
                    <li key={d.date} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{d.date}</span>
                      <span className="font-medium text-critical">{Math.round(d.kcal)} kcal</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {targets.calorie_max ? "No days over your limit recently." : "Set a calorie reference in Settings to track this."}
              </p>
            )}
            <Link href="/health/fit" className="mt-1 text-xs font-medium text-warn hover:underline">
              See full Calorie Recap →
            </Link>
          </CardContent>
        </Card>
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

function StatRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${valueClass ?? ""}`}>{value}</span>
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
