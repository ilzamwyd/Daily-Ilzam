import * as Icons from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  sub,
  icon,
  colorClass,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: keyof typeof Icons;
  colorClass: string;
}) {
  const Icon = (Icons as Record<string, React.ElementType>)[icon];
  return (
    <Card className="animate-fade-up p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold tracking-tight">{value}</p>
          {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", colorClass)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </Card>
  );
}
