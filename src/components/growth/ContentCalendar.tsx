"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ContentProgressItem } from "@/lib/types";
import { formatDateISO } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function ContentCalendar() {
  const supabase = createClient();
  const [items, setItems] = useState<ContentProgressItem[]>([]);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("content_progress").select("*").eq("user_id", user.id).not("published_date", "is", null);
      setItems((data as ContentProgressItem[]) ?? []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const byDate = useMemo(() => {
    const map = new Map<string, ContentProgressItem[]>();
    for (const item of items) {
      if (!item.published_date) continue;
      const list = map.get(item.published_date) ?? [];
      list.push(item);
      map.set(item.published_date, list);
    }
    return map;
  }, [items]);

  const year = month.getFullYear();
  const monthIdx = month.getMonth();
  const firstDayOfWeek = new Date(year, monthIdx, 1).getDay();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const monthPrefix = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
  const publishedThisMonth = items.filter((i) => (i.published_date ?? "").startsWith(monthPrefix)).length;

  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(formatDateISO(new Date(year, monthIdx, d)));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-display text-base font-semibold">{month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
          <p className="text-xs text-muted-foreground">{publishedThisMonth} published this month</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setMonth(new Date(year, monthIdx - 1, 1))} className="rounded-xl border border-border p-2 hover:bg-muted">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => setMonth(new Date(year, monthIdx + 1, 1))} className="rounded-xl border border-border p-2 hover:bg-muted">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const dayItems = byDate.get(date) ?? [];
          return (
            <div
              key={date}
              title={dayItems.map((it) => it.title).join(", ")}
              className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl text-sm ${
                dayItems.length > 0 ? "bg-growth text-white" : "hover:bg-muted"
              }`}
            >
              <span>{Number(date.slice(-2))}</span>
              {dayItems.length > 1 && <span className="text-[10px]">×{dayItems.length}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
