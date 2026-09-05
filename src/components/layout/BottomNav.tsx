"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Icons from "lucide-react";
import { BOTTOM_NAV_ITEMS, NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-card/95 px-2 py-2 backdrop-blur md:hidden">
        {BOTTOM_NAV_ITEMS.map((item) => {
          if (item.href === "__more__") {
            const Icon = (Icons as unknown as Record<string, React.ElementType>)[item.icon];
            return (
              <button
                key="more"
                onClick={() => setDrawerOpen(true)}
                className="flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-medium text-muted-foreground"
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          }
          const Icon = (Icons as unknown as Record<string, React.ElementType>)[item.icon];
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative z-10 max-h-[75vh] w-full overflow-y-auto rounded-t-3xl bg-card p-4 pb-8 shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between px-2">
              <p className="font-display text-base font-semibold">All Pages</p>
              <button onClick={() => setDrawerOpen(false)} className="rounded-full p-1.5 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {NAV_ITEMS.flatMap((item) => ("children" in item ? item.children : [item]))
                .filter((item) => item.href !== "/health" && item.href !== "/career")
                .map((item) => {
                const Icon = (Icons as unknown as Record<string, React.ElementType>)[item.icon];
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 text-center text-xs font-medium",
                      active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
