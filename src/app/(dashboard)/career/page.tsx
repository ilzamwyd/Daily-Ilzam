import Link from "next/link";
import * as Icons from "lucide-react";
import { Card } from "@/components/ui/card";

const SECTIONS = [
  { href: "/career/work", label: "Work", desc: "Sustainable Ambition, role reviews, and Meetings (MoM)", icon: "Briefcase", color: "bg-career-light text-career" },
  { href: "/career/english", label: "English", desc: "Practice sessions by aspect, roadmap, vocabulary", icon: "Languages", color: "bg-growth-light text-growth" },
  { href: "/career/content", label: "Content", desc: "Idea → started → editing → published", icon: "Sprout", color: "bg-growth-light text-growth" },
  { href: "/career/business", label: "Business", desc: "Setup checklist and daily sales", icon: "Store", color: "bg-finance-light text-finance" },
  { href: "/career/finance", label: "Finance", desc: "Budget, transactions, monthly reports", icon: "Wallet", color: "bg-finance-light text-finance" },
] as const;

export default function CareerHubPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Career</h1>
        <p className="text-sm text-muted-foreground">Everything about work, growth, and money, in one place.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
