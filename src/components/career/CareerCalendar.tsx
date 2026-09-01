"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ActionItem } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { formatDateISO } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Check, Circle } from "lucide-react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CareerCalendar() {
  const supabase = createClient();
  const [items, setItems] = useState<ActionItem[]>([]);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("action_items").select("*").eq("user_id", user.id).not("deadline", "is", null);
      setItems((data as ActionItem[]) ?? []);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const byDate = useMemo(() => {
    const map = new Map<string, ActionItem[]>();
    for (const item of items) {
      if (!item.deadline) continue;
      const list = map.get(item.deadline) ?? [];
      list.push(item);
      map.set(item.deadline, list);
    }
    return map;
  }, [items]);

  const today = formatDateISO(new Date());
  const year = month.getFullYear();
  const monthIdx = month.getMonth();
  const firstDayOfWeek = new Date(year, monthIdx, 1).getDay();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(formatDateISO(new Date(year, monthIdx, d)));
  }

  async function toggleStatus(item: ActionItem) {
    const next = item.status === "todo" ? "done" : "todo";
    await supabase.from("action_items").update({ status: next }).eq("id", item.id);
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: next } : i)));
  }

  const selectedItems = selectedDate ? byDate.get(selectedDate) ?? [] : [];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-display text-base font-semibold">
            {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setMonth(new Date(year, monthIdx - 1, 1))}
              className="rounded-xl border border-border p-2 hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setMonth(new Date(year, monthIdx + 1, 1))}
              className="rounded-xl border border-border p-2 hover:bg-muted"
            >
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
            const isToday = date === today;
            const isSelected = date === selectedDate;
            const hasOverdue = dayItems.some((it) => it.status === "todo" && date < today);
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl text-sm transition-colors ${
                  isSelected ? "bg-primary text-primary-foreground" : isToday ? "bg-career-light text-career" : "hover:bg-muted"
                }`}
              >
                <span>{Number(date.slice(-2))}</span>
                {dayItems.length > 0 && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isSelected ? "bg-white" : hasOverdue ? "bg-critical" : "bg-career"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <p className="mb-3 font-display text-base font-semibold">{selectedDate ?? "Pick a day"}</p>
        {!selectedDate ? (
          <p className="text-sm text-muted-foreground">Tap a day with a dot to see what's due.</p>
        ) : selectedItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing due this day.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {selectedItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2 rounded-xl bg-muted p-3 text-sm">
                <button onClick={() => toggleStatus(item)} className="text-career">
                  {item.status === "done" ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                </button>
                <div className="flex-1">
                  <p className={item.status === "done" ? "text-muted-foreground line-through" : ""}>{item.description}</p>
                  {(item.assignee || item.category) && (
                    <p className="text-xs text-muted-foreground">
                      {item.category && <>{item.category}</>}
                      {item.category && item.assignee && " · "}
                      {item.assignee && <>PIC {item.assignee}</>}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && items.length === 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            No tasks with deadlines yet — add one from the To-Do page and it'll show up here.
          </p>
        )}
      </Card>
    </div>
  );
}
