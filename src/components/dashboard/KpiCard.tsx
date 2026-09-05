import * as Icons from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  sub,
  icon,
  colorClass,
  onClick,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: keyof typeof Icons;
  colorClass: string;
  onClick?: () => void;
}) {
  const Icon = (Icons as unknown as Record<string, React.ElementType>)[icon];
  const content = (
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
  );

  if (onClick) {
    return (
      <Card
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onClick();
        }}
        className="animate-fade-up w-full cursor-pointer p-5 text-left transition-transform hover:-translate-y-0.5"
      >
        {content}
      </Card>
    );
  }

  return <Card className="animate-fade-up p-5">{content}</Card>;
}
