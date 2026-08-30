"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ActionItem } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Plus, Check, RotateCcw, Trash2 } from "lucide-react";

type ItemWithMeeting = ActionItem & { meetings?: { title: string } | null };

export default function TodoPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<ItemWithMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDesc, setNewDesc] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [newDeadline, setNewDeadline] = useState("");

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      await load(user.id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(uid: string) {
    setLoading(true);
    const { data } = await supabase
      .from("action_items")
      .select("*, meetings(title)")
      .eq("user_id", uid)
      .order("deadline", { ascending: true, nullsFirst: false });
    setItems((data ?? []) as ItemWithMeeting[]);
    setLoading(false);
  }

  async function addTodo() {
    if (!userId || !newDesc.trim()) return;
    await supabase.from("action_items").insert({
      user_id: userId,
      description: newDesc.trim(),
      assignee: newAssignee.trim() || null,
      deadline: newDeadline || null,
      status: "todo",
    });
    setNewDesc("");
    setNewAssignee("");
    setNewDeadline("");
    await load(userId);
  }

  async function toggleStatus(item: ItemWithMeeting) {
    const next = item.status === "todo" ? "done" : "todo";
    await supabase.from("action_items").update({ status: next }).eq("id", item.id);
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: next } : i)));
  }

  async function remove(id?: string) {
    if (!id) return;
    await supabase.from("action_items").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const todos = items.filter((i) => i.status === "todo");
  const done = items.filter((i) => i.status === "done");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">To-Do</h1>
        <p className="mt-1 text-sm text-muted-foreground">Follow-ups from your meetings, plus anything you add yourself.</p>
      </div>

      <Card className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center">
        <Input placeholder="Add a task…" className="sm:flex-1" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
        <Input placeholder="Assignee (optional)" className="sm:w-40" value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)} />
        <Input type="date" className="sm:w-40" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} />
        <Button type="button" size="icon" onClick={addTodo} disabled={!newDesc.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </Card>

      {loading ? null : items.length === 0 ? (
        <EmptyState message="Nothing here yet. Add a task, or generate one from a meeting in MoM." />
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {todos.map((item) => {
              const overdue = item.deadline && item.deadline < today;
              return (
                <Card key={item.id} className="flex items-center gap-3 p-4">
                  <button
                    onClick={() => toggleStatus(item)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-border hover:border-career"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.assignee && <>PIC {item.assignee} · </>}
                      {item.deadline && <span className={overdue ? "text-critical" : ""}>DL {item.deadline} · </span>}
                      {item.meetings?.title && <>from &quot;{item.meetings.title}&quot;</>}
                    </p>
                  </div>
                  <button onClick={() => remove(item.id)} className="text-muted-foreground hover:text-critical">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Card>
              );
            })}
          </div>

          {done.length > 0 && (
            <div>
              <h2 className="mb-2 mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Done</h2>
              <div className="flex flex-col gap-2">
                {done.map((item) => (
                  <Card key={item.id} className="flex items-center gap-3 p-4 opacity-60">
                    <button
                      onClick={() => toggleStatus(item)}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-finance text-white"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <p className="flex-1 text-sm line-through">{item.description}</p>
                    <button onClick={() => toggleStatus(item)} className="text-muted-foreground hover:text-foreground">
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
