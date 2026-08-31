import { createClient } from "@/lib/supabase/server";
import { getRecentLogs, getTargets } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { average, round1 } from "@/lib/utils";
import { Heart, Phone, Users2, Moon } from "lucide-react";

export default async function SocialPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const logs = await getRecentLogs(supabase, user.id, 60);
  const targets = await getTargets(supabase, user.id);
  const last7 = logs.slice(-7);
  const prev7 = logs.slice(-14, -7);

  const social = last7.filter((l) => l.social_activity).length;
  const prevSocial = prev7.filter((l) => l.social_activity).length;
  const familyContact = last7.filter((l) => l.family_contact).length;
  const familyCall = last7.filter((l) => l.family_call).length;
  const noSocialDays = last7.filter((l) => !l.social_activity).length;

  const recoveryDays = last7.filter((l) => l.recovery).length;
  const avgRecoveryMinutes = average(last7.filter((l) => l.recovery).map((l) => l.recovery_minutes));
  const friday = last7.find((l) => new Date(l.date).getDay() === 5);
  const sunday = last7.find((l) => new Date(l.date).getDay() === 0);

  const prayerLogs = logs.filter((l) => l.prayers_completed != null);
  const avgPrayers = average(last7.map((l) => l.prayers_completed));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Social</h1>
        <p className="text-sm text-muted-foreground">Social, family, recovery, and quiet reflection.</p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-social-light text-social">
            <Users2 className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Connection</CardTitle>
            <CardDescription>Social target: {targets.social_weekly_target}/week · Family: {targets.family_contact_weekly_target}/week</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat icon={Users2} label="Social activities" value={`${social}`} colorClass="text-social" />
            <Stat icon={Phone} label="Family calls" value={`${familyCall}`} colorClass="text-social" />
            <Stat icon={Heart} label="Family contact" value={`${familyContact}`} colorClass="text-social" />
            <Stat icon={Users2} label="Days without social interaction" value={`${noSocialDays}`} colorClass="text-social" />
          </div>
          {social > prevSocial && (
            <p className="mt-4 rounded-2xl bg-social-light px-4 py-3 text-sm text-social">
              You had more social connection this week than last week.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-recovery-light text-recovery">
            <Moon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Recovery</CardTitle>
            <CardDescription>Rest is not wasted time — it's a core KPI.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat icon={Moon} label="Recovery days" value={`${recoveryDays}/7`} colorClass="text-recovery" />
            <Stat icon={Moon} label="Avg minutes" value={avgRecoveryMinutes ? `${Math.round(avgRecoveryMinutes)}` : "—"} colorClass="text-recovery" />
            <Stat icon={Moon} label="No Productivity Night" value={friday?.recovery ? "Done" : "—"} colorClass="text-recovery" />
            <Stat icon={Moon} label="Slow Sunday" value={sunday?.recovery ? "Done" : "—"} colorClass="text-recovery" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Rest is part of the system.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-spiritual-light text-spiritual">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Spiritual</CardTitle>
            <CardDescription>For reconnection and awareness — never scored or judged.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {prayerLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">A few more check-ins will show your prayer consistency trend.</p>
          ) : (
            <div className="flex items-center gap-6">
              <span className="font-display text-3xl font-bold text-spiritual">
                {avgPrayers != null ? round1(avgPrayers) : "—"} / 5
              </span>
              <p className="text-sm text-muted-foreground">weekly average — this is only for you to see.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value, colorClass }: { icon: React.ElementType; label: string; value: string; colorClass: string }) {
  return (
    <div className="rounded-2xl bg-muted p-4">
      <Icon className={`h-4 w-4 ${colorClass}`} />
      <p className="mt-2 font-display text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
