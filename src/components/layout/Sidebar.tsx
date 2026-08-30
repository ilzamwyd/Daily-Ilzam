"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Icons from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/50 px-4 py-6 md:flex">
      <div className="mb-8 px-2">
        <h1 className="font-display text-xl font-bold tracking-tight">Comeback OS</h1>
        <p className="mt-1 text-xs text-muted-foreground">Sustainable Ambition</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = Icons[item.icon] as React.ElementType;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="rounded-2xl bg-muted p-4">
        <p className="text-xs font-medium leading-relaxed text-muted-foreground">
          70–80% consistency is a win. Never restart — just continue.
        </p>
      </div>
    </aside>
  );
}
