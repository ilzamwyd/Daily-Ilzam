"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Icons from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const isOnCareerPage = pathname?.startsWith("/career");
  const [careerOpen, setCareerOpen] = useState(isOnCareerPage);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/50 px-4 py-6 md:flex">
      <div className="mb-8 px-2">
        <h1 className="font-display text-xl font-bold tracking-tight">Daily Ilzam</h1>
        <p className="mt-1 text-xs text-muted-foreground">Sustainable Ambition</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          if ("children" in item) {
            const Icon = (Icons as Record<string, React.ElementType>)[item.icon];
            const open = careerOpen;
            return (
              <div key={item.label}>
                <button
                  onClick={() => setCareerOpen((o) => !o)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isOnCareerPage ? "bg-career-light text-career" : "text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open ? "rotate-180" : "")} />
                </button>
                {open && (
                  <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-border pl-3">
                    {item.children.map((child) => {
                      const ChildIcon = (Icons as Record<string, React.ElementType>)[child.icon];
                      const active = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors",
                            active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <ChildIcon className="h-3.5 w-3.5" />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const Icon = (Icons as Record<string, React.ElementType>)[item.icon];
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
