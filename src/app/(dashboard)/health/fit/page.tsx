import { createClient } from "@/lib/supabase/server";
import { getRecentLogs, getTargets } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { WeightChart } from "@/components/charts/WeightChart";
import { StepsChart } from "@/components/charts/StepsChart";
import { GymWeekChart } from "@/components/charts/GymWeekChart";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { CalorieRecap } from "@/components/health/CalorieRecap";
import { WaterRecap } from "@/components/health/WaterRecap";
import { MICROCOPY } from "@/lib/constants";
import { average, round1, formatDateISO } from "@/lib/utils";

export default async function FitPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const logs = await getRecentLogs(supabase, user.id, 90);
  const targets = await getTargets(supabase, user.id);
  const waistLogs = logs.filter((l) => l.waist != null);
  const ptCount = logs.filter((l) => l.pt_session).length;
  const avgSteps = average(logs.slice(-7).map((l) => l.steps));

  const since = new Date();
  since.setDate(since.getDate() - 13);
  const { data: recentExercises } = await supabase
    .from("workout_log")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", formatDateISO(since))
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(15);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Fit</h1>
        <p className="text-sm text-muted-foreground">Body and fitness, trending over time — not judged day by day.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weight Trend</CardTitle>
            <CardDescription>Daily weight with a 7-day moving average. The average is what matters.</CardDescription>
          </CardHeader>
          <CardContent>
            <WeightChart logs={logs} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Waist Trend</CardTitle>
            <CardDescription>Weekly or as-recorded measurements.</CardDescription>
          </CardHeader>
          <CardContent>
            {waistLogs.length < 2 ? (
              <EmptyState message={MICROCOPY.emptyChart} />
            ) : (
              <ul className="flex flex-col gap-2">
                {waistLogs.slice(-8).map((l) => (
                  <li key={l.date} className="flex items-center justify-between rounded-2xl bg-muted px-4 py-2 text-sm">
                    <span className="text-muted-foreground">{l.date}</span>
                    <span className="font-medium">{l.waist} cm</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Steps</CardTitle>
          <CardDescription>Target: {targets.step_target.toLocaleString()} / day · 7-day average: {avgSteps ? Math.round(avgSteps) : "—"}</CardDescription>
        </CardHeader>
        <CardContent>
          <StepsChart logs={logs} target={targets.step_target} />
        </CardContent>
      </Card>

      <CalorieRecap calorieMin={targets.calorie_min} calorieMax={targets.calorie_max} />

      <WaterRecap />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gym</CardTitle>
            <CardDescription>Target: {targets.gym_weekly_target} sessions/week</CardDescription>
          </CardHeader>
          <CardContent>
            <GymWeekChart logs={logs} />
            {recentExercises && recentExercises.length > 0 && (
              <div className="mt-4 flex flex-col divide-y divide-border">
                {recentExercises.map((ex) => (
                  <div key={ex.id} className="flex items-center justify-between py-2 text-sm">
                    <span>{ex.exercise_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {ex.date}
                      {ex.duration_minutes ? ` · ${ex.duration_minutes} min` : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PT Sessions</CardTitle>
            <CardDescription>Target: 5 sessions in the first month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-full flex-col items-center justify-center gap-2 py-8">
              <span className="font-display text-4xl font-bold">{ptCount} / 5</span>
              <p className="text-sm text-muted-foreground">completed so far</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
