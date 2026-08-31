import Link from "next/link";
import * as Icons from "lucide-react";
import { Card } from "@/components/ui/card";

const SECTIONS = [
  { href: "/health/fit", label: "Fit", desc: "Body, gym, calories, water — physical health.", icon: "HeartPulse", color: "bg-health-light text-health" },
  { href: "/health/mind", label: "Mind", desc: "Mood, stress, energy, and possible patterns.", icon: "Brain", color: "bg-indigo-100 text-indigo-600" },
  { href: "/health/social", label: "Social", desc: "Family, friends, and recovery — connection.", icon: "Users", color: "bg-social-light text-social" },
] as const;

export default function HealthHubPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Health</h1>
        <p className="text-sm text-muted-foreground">Body, mind, and connection — the whole picture, not just one number.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {SECTIONS.map((s) => {
          const Icon = (Icons as unknown as Record<string, React.ElementType>)[s.icon];
          return (
            <Link key={s.href} href={s.href}>
              <Card className="flex h-full flex-col gap-3 p-5 transition-transform hover:-translate-y-0.5">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${s.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-base font-semibold">{s.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
