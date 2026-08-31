"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ActionItem } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Plus, Check, RotateCcw, Trash2, Pencil, X, Save } from "lucide-react";
import { formatDateISO } from "@/lib/utils";

type ItemWithMeeting = ActionItem & { meetings?: { title: string } | null };
type Draft = { description: string; assignee: string; deadline: string; category: string };

const emptyDraft = (): Draft => ({ description: "", assignee: "", deadline: "", category: "" });

export default function TodoPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<ItemWithMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState<Draft>(emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

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

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category).filter((c): c is string => !!c))).sort(),
    [items]
  );
  const assignees = useMemo(
    () => Array.from(new Set(items.map((i) => i.assignee).filter((a): a is string => !!a))).sort(),
    [items]
  );

  async function addTodo() {
    if (!userId || !newItem.description.trim()) return;
    await supabase.from("action_items").insert({
      user_id: userId,
      description: newItem.description.trim(),
      assignee: newItem.assignee.trim() || null,
      deadline: newItem.deadline || null,
      category: newItem.category.trim() || null,
      status: "todo",
    });
    setNewItem(emptyDraft());
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

  function startEdit(item: ItemWithMeeting) {
    setEditingId(item.id!);
    setEditDraft({
      description: item.description,
      assignee: item.assignee ?? "",
      deadline: item.deadline ?? "",
      category: item.category ?? "",
    });
  }

  async function saveEdit(id: string) {
    if (!editDraft.description.trim()) return;
    const patch = {
      description: editDraft.description.trim(),
      assignee: editDraft.assignee.trim() || null,
      deadline: editDraft.deadline || null,
      category: editDraft.category.trim() || null,
    };
    await supabase.from("action_items").update(patch).eq("id", id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    setEditingId(null);
  }

  const filtered = activeCategory ? items.filter((i) => i.category === activeCategory) : items;
  const todos = filtered.filter((i) => i.status === "todo");
  const done = filtered.filter((i) => i.status === "done");
  const today = formatDateISO(new Date());

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <datalist id="category-options">
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <datalist id="assignee-options">
        {assignees.map((a) => (
          <option key={a} value={a} />
        ))}
      </datalist>

      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">To-Do</h1>
        <p className="mt-1 text-sm text-muted-foreground">Follow-ups from your meetings, plus anything you add yourself.</p>
      </div>

      <Card className="flex flex-col gap-2 p-5">
        <Input placeholder="Add a task…" value={newItem.description} onChange={(e) => setNewItem((p) => ({ ...p, description: e.target.value }))} />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            list="category-options"
            placeholder="Category — e.g. Expanded Role, Streamverse"
            className="sm:flex-1"
            value={newItem.category}
            onChange={(e) => setNewItem((p) => ({ ...p, category: e.target.value }))}
          />
          <Input
            list="assignee-options"
            placeholder="Assignee (optional)"
            className="sm:w-40"
            value={newItem.assignee}
            onChange={(e) => setNewItem((p) => ({ ...p, assignee: e.target.value }))}
          />
          <Input type="date" className="sm:w-40" value={newItem.deadline} onChange={(e) => setNewItem((p) => ({ ...p, deadline: e.target.value }))} />
          <Button type="button" size="icon" onClick={addTodo} disabled={!newItem.description.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${!activeCategory ? "bg-career text-white" : "bg-muted text-muted-foreground"}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${activeCategory === c ? "bg-career text-white" : "bg-muted text-muted-foreground"}`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {loading ? null : items.length === 0 ? (
        <EmptyState message="Nothing here yet. Add a task, or generate one from a meeting in MoM." />
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {todos.map((item) => {
              const overdue = item.deadline && item.deadline < today;
              const isEditing = editingId === item.id;

              if (isEditing) {
                return (
                  <Card key={item.id} className="flex flex-col gap-2 p-4">
                    <Input value={editDraft.description} onChange={(e) => setEditDraft((p) => ({ ...p, description: e.target.value }))} />
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        list="category-options"
                        placeholder="Category"
                        className="sm:flex-1"
                        value={editDraft.category}
                        onChange={(e) => setEditDraft((p) => ({ ...p, category: e.target.value }))}
                      />
                      <Input
                        list="assignee-options"
                        placeholder="Assignee"
                        className="sm:w-40"
                        value={editDraft.assignee}
                        onChange={(e) => setEditDraft((p) => ({ ...p, assignee: e.target.value }))}
                      />
                      <Input
                        type="date"
                        className="sm:w-40"
                        value={editDraft.deadline}
                        onChange={(e) => setEditDraft((p) => ({ ...p, deadline: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" className="gap-1.5" onClick={() => saveEdit(item.id!)}>
                        <Save className="h-3.5 w-3.5" /> Save
                      </Button>
                      <Button type="button" size="sm" variant="ghost" className="gap-1.5" onClick={() => setEditingId(null)}>
                        <X className="h-3.5 w-3.5" /> Cancel
                      </Button>
                    </div>
                  </Card>
                );
              }

              return (
                <Card key={item.id} className="flex items-center gap-3 p-4">
                  <button
                    onClick={() => toggleStatus(item)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-border hover:border-career"
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{item.description}</p>
                      {item.category && (
                        <span className="rounded-full bg-career-light px-2 py-0.5 text-[11px] font-medium text-career">{item.category}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.assignee && <>PIC {item.assignee} · </>}
                      {item.deadline && <span className={overdue ? "text-critical" : ""}>DL {item.deadline} · </span>}
                      {item.meetings?.title && <>from &quot;{item.meetings.title}&quot;</>}
                    </p>
                  </div>
                  <button onClick={() => startEdit(item)} className="text-muted-foreground hover:text-career">
                    <Pencil className="h-4 w-4" />
                  </button>
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
