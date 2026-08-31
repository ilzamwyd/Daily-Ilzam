import { createClient } from "@/lib/supabase/server";
import { getRecentLogs, getTargets } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MindTrendChart } from "@/components/charts/MindTrendChart";
import { SleepTrendChart } from "@/components/charts/SleepTrendChart";
import { generatePatterns } from "@/lib/insights";
import { Lightbulb } from "lucide-react";

export default async function MindPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const logs = await getRecentLogs(supabase, user.id, 90);
  const targets = await getTargets(supabase, user.id);
  const patterns = generatePatterns(logs);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Mind &amp; Energy</h1>
        <p className="text-sm text-muted-foreground">Mood, stress, energy and sleep — read as trends, not verdicts.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mood, Stress &amp; Energy</CardTitle>
        </CardHeader>
        <CardContent>
          <MindTrendChart logs={logs} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sleep</CardTitle>
          <CardDescription>Shaded band shows your target range ({targets.sleep_target_min}–{targets.sleep_target_max}h).</CardDescription>
        </CardHeader>
        <CardContent>
          <SleepTrendChart logs={logs} min={targets.sleep_target_min} max={targets.sleep_target_max} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Possible Patterns</CardTitle>
          <CardDescription>Correlations only — never a diagnosis.</CardDescription>
        </CardHeader>
        <CardContent>
          {patterns.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keep logging — patterns need a couple weeks of data to surface.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {patterns.map((p, i) => (
                <li key={i} className="flex items-start gap-3 rounded-2xl bg-mental-light px-4 py-3 text-sm text-mental">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{p.text}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
