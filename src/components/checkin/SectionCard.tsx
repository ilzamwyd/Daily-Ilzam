import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";

interface SectionCardProps {
  title: string;
  description?: string;
  icon: keyof typeof Icons;
  colorClass: string; // e.g. text-health, bg-health/10
  children: React.ReactNode;
}

export function SectionCard({ title, description, icon, colorClass, children }: SectionCardProps) {
  const Icon = (Icons as Record<string, React.ElementType>)[icon];
  return (
    <Card className="animate-fade-up">
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", colorClass)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">{children}</CardContent>
    </Card>
  );
}
