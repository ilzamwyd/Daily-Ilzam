import { Insight } from "@/lib/insights";
import { cn } from "@/lib/utils";
import { CheckCircle2, Eye, AlertTriangle } from "lucide-react";

const GROUPS: { key: Insight["category"]; label: string; icon: React.ElementType; colorClass: string }[] = [
  { key: "maintain", label: "Maintain", icon: CheckCircle2, colorClass: "text-health bg-health-light" },
  { key: "watch", label: "Watch", icon: Eye, colorClass: "text-warn bg-warn-light" },
  { key: "fix", label: "Fix Now", icon: AlertTriangle, colorClass: "text-critical bg-critical-light" },
];

export function InsightsPanel({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        A few more days of check-ins will help reveal your patterns.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {GROUPS.map((group) => {
        const items = insights.filter((i) => i.category === group.key);
        return (
          <div key={group.key} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className={cn("flex h-6 w-6 items-center justify-center rounded-full", group.colorClass)}>
                <group.icon className="h-3.5 w-3.5" />
              </span>
              <span className="text-sm font-semibold">{group.label}</span>
            </div>
            {items.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nothing here right now.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {items.map((item, i) => (
                  <li key={i} className="rounded-2xl bg-muted px-3 py-2 text-xs leading-relaxed">
                    {item.text}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
