"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Meeting, ActionItem } from "@/lib/types";
import { useAiEnabled } from "@/lib/useAiEnabled";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { VoiceDictationButton } from "@/components/mom/VoiceDictationButton";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Sparkles, Save, Trash2, Plus, Loader2 } from "lucide-react";
import { formatDateISO } from "@/lib/utils";

type DraftAction = { description: string; assignee: string; deadline: string; category: string };

const ROLE_CONTEXTS = ["Main Role", "Expanded Role", "Other"] as const;
const emptyDraft = (): DraftAction => ({ description: "", assignee: "", deadline: "", category: "" });

export function MomSection() {
  const supabase = createClient();
  const aiEnabled = useAiEnabled();
  const [userId, setUserId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [roleContext, setRoleContext] = useState<(typeof ROLE_CONTEXTS)[number]>("Main Role");
  const [rawNotes, setRawNotes] = useState("");
  const [summary, setSummary] = useState("");
  const [draftActions, setDraftActions] = useState<DraftAction[]>([]);
  const [summarizing, setSummarizing] = useState(false);
  const [summarizeError, setSummarizeError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [history, setHistory] = useState<(Meeting & { action_items: ActionItem[] })[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [addingToMeeting, setAddingToMeeting] = useState<string | null>(null);
  const [newActionDraft, setNewActionDraft] = useState<DraftAction>(emptyDraft());
  const [categories, setCategories] = useState<string[]>([]);
  const [assignees, setAssignees] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      await loadHistory(user.id);
      const { data: tags } = await supabase.from("action_items").select("category, assignee").eq("user_id", user.id);
      setCategories(Array.from(new Set((tags ?? []).map((t) => t.category).filter((c): c is string => !!c))).sort());
      setAssignees(Array.from(new Set((tags ?? []).map((t) => t.assignee).filter((a): a is string => !!a))).sort());
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadHistory(uid: string) {
    setLoadingHistory(true);
    const { data: meetings } = await supabase
      .from("meetings")
      .select("*")
      .eq("user_id", uid)
      .order("meeting_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20);
    const meetingIds = (meetings ?? []).map((m) => m.id);
    let items: ActionItem[] = [];
    if (meetingIds.length > 0) {
      const { data } = await supabase.from("action_items").select("*").in("meeting_id", meetingIds);
      items = (data ?? []) as ActionItem[];
    }
    setHistory(
      ((meetings ?? []) as Meeting[]).map((m) => ({
        ...m,
        action_items: items.filter((i) => i.meeting_id === m.id),
      }))
    );
    setLoadingHistory(false);
  }

  async function handleRetrySummarize(meeting: Meeting & { action_items: ActionItem[] }) {
    if (!userId || !meeting.id || !meeting.raw_notes) return;
    setRetryingId(meeting.id);
    try {
      const res = await fetch("/api/mom/summarize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rawNotes: meeting.raw_notes, title: meeting.title }),
      });
      const data = await res.json();
      if (!res.ok) return;
      await supabase.from("meetings").update({ summary: data.summary ?? "" }).eq("id", meeting.id);
      const rows = (data.action_items ?? [])
        .filter((a: { description: string }) => a.description?.trim())
        .map((a: { description: string; assignee: string | null; deadline: string | null }) => ({
          user_id: userId,
          meeting_id: meeting.id,
          description: a.description.trim(),
          assignee: a.assignee ?? null,
          deadline: a.deadline ?? null,
          status: "todo",
        }));
      let inserted: ActionItem[] = [];
      if (rows.length > 0) {
        const { data: newItems } = await supabase.from("action_items").insert(rows).select();
        inserted = (newItems ?? []) as ActionItem[];
      }
      setHistory((prev) =>
        prev.map((m) =>
          m.id === meeting.id ? { ...m, summary: data.summary ?? "", action_items: [...m.action_items, ...inserted] } : m
        )
      );
    } finally {
      setRetryingId(null);
    }
  }

  async function handleSummarize() {
    setSummarizeError(null);
    setSummarizing(true);
    try {
      const res = await fetch("/api/mom/summarize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rawNotes, title }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSummarizeError(data.error ?? "Something went wrong.");
        return;
      }
      setSummary(data.summary ?? "");
      setDraftActions(
        (data.action_items ?? []).map((a: { description: string; assignee: string | null; deadline: string | null }) => ({
          description: a.description,
          assignee: a.assignee ?? "",
          deadline: a.deadline ?? "",
        }))
      );
    } finally {
      setSummarizing(false);
    }
  }

  function updateAction(i: number, patch: Partial<DraftAction>) {
    setDraftActions((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  }
  function removeAction(i: number) {
    setDraftActions((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSaveMeeting() {
    if (!userId || !title.trim()) return;
    setSaving(true);
    const { data: meeting, error } = await supabase
      .from("meetings")
      .insert({
        user_id: userId,
        title: title.trim(),
        meeting_date: formatDateISO(new Date()),
        role_context: roleContext,
        raw_notes: rawNotes || null,
        summary: summary || null,
      })
      .select()
      .single();

    if (!error && meeting) {
      const rows = draftActions
        .filter((a) => a.description.trim())
        .map((a) => ({
          user_id: userId,
          meeting_id: meeting.id,
          description: a.description.trim(),
          assignee: a.assignee.trim() || null,
          deadline: a.deadline || null,
          category: a.category.trim() || null,
          status: "todo",
        }));
      if (rows.length > 0) await supabase.from("action_items").insert(rows);
      setTitle("");
      setRawNotes("");
      setSummary("");
      setDraftActions([]);
      await loadHistory(userId);
    }
    setSaving(false);
  }

  async function addActionToExistingMeeting(meetingId: string) {
    if (!userId || !newActionDraft.description.trim()) return;
    const { data } = await supabase
      .from("action_items")
      .insert({
        user_id: userId,
        meeting_id: meetingId,
        description: newActionDraft.description.trim(),
        assignee: newActionDraft.assignee.trim() || null,
        deadline: newActionDraft.deadline || null,
        category: newActionDraft.category.trim() || null,
        status: "todo",
      })
      .select()
      .single();
    if (data) {
      setHistory((prev) =>
        prev.map((m) => (m.id === meetingId ? { ...m, action_items: [...m.action_items, data as ActionItem] } : m))
      );
    }
    setNewActionDraft(emptyDraft());
    setAddingToMeeting(null);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <datalist id="mom-category-options">
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <datalist id="mom-assignee-options">
        {assignees.map((a) => (
          <option key={a} value={a} />
        ))}
      </datalist>
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">MoM — Minutes of Meeting</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Capture fast during the meeting — type it, dictate it, or just jot down follow-ups. No more post-its.
        </p>
      </div>

      <Card className="flex flex-col gap-4 p-6">
        <Input placeholder="Meeting title — e.g. Sync with Kak Shella" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Context</label>
          <Segmented options={ROLE_CONTEXTS} value={roleContext} onChange={setRoleContext} activeClassName="bg-career text-white" />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
          <VoiceDictationButton onTranscript={(t) => setRawNotes((prev) => (prev ? `${prev} ${t}` : t))} />
        </div>
        <Textarea
          rows={6}
          placeholder="Type or dictate as the meeting happens — current condition, next plan, who owns what..."
          value={rawNotes}
          onChange={(e) => setRawNotes(e.target.value)}
        />

        {aiEnabled && (
          <>
            <Button
              type="button"
              className="gap-2 self-start"
              onClick={handleSummarize}
              disabled={summarizing || rawNotes.trim().length < 5}
            >
              {summarizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {summarizing ? "Summarizing…" : "Generate Summary & Actions with AI"}
            </Button>
            {summarizeError && <p className="text-sm text-critical">{summarizeError}</p>}
          </>
        )}

        {summary && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Summary</label>
            <Textarea rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />
          </div>
        )}

        <div className="flex flex-col gap-4 rounded-2xl border border-career/30 bg-career-light/40 p-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Follow-Up Actions → goes to your To-Do list</label>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="gap-1"
              onClick={() => setDraftActions((prev) => [...prev, emptyDraft()])}
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
          {draftActions.length === 0 ? (
            <p className="text-xs text-muted-foreground">No follow-ups added yet — add one manually, or generate them with AI above.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {draftActions.map((a, i) => (
                <div key={i} className="flex flex-col gap-2 rounded-xl bg-card p-3 sm:flex-row sm:items-center">
                  <Input
                    className="sm:flex-1"
                    placeholder="Action"
                    value={a.description}
                    onChange={(e) => updateAction(i, { description: e.target.value })}
                  />
                  <Input
                    list="mom-category-options"
                    className="sm:w-40"
                    placeholder="Category"
                    value={a.category}
                    onChange={(e) => updateAction(i, { category: e.target.value })}
                  />
                  <Input
                    list="mom-assignee-options"
                    className="sm:w-40"
                    placeholder="PIC / assignee"
                    value={a.assignee}
                    onChange={(e) => updateAction(i, { assignee: e.target.value })}
                  />
                  <Input
                    className="sm:w-40"
                    type="date"
                    value={a.deadline}
                    onChange={(e) => updateAction(i, { deadline: e.target.value })}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeAction(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="soft"
          className="gap-2 self-start"
          onClick={handleSaveMeeting}
          disabled={saving || !title.trim()}
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save Meeting & Push Actions to To-Do"}
        </Button>
      </Card>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold">Recent Meetings</h2>
        {loadingHistory ? null : history.length === 0 ? (
          <EmptyState message="No meetings logged yet. Your first MoM will show up here." />
        ) : (
          <div className="flex flex-col gap-4">
            {history.map((m) => (
              <Card key={m.id} className="p-5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{m.title}</p>
                  <span className="text-xs text-muted-foreground">
                    {m.meeting_date} · {m.role_context}
                  </span>
                </div>
                {m.summary ? (
                  <p className="mt-2 text-sm text-muted-foreground">{m.summary}</p>
                ) : m.raw_notes ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{m.raw_notes}</p>
                ) : (
                  <p className="mt-2 text-sm italic text-muted-foreground">No notes were saved for this meeting.</p>
                )}
                {!m.summary && aiEnabled && m.raw_notes && (
                  <Button
                    type="button"
                    size="sm"
                    variant="soft"
                    className="mt-2 gap-1.5"
                    onClick={() => handleRetrySummarize(m)}
                    disabled={retryingId === m.id}
                  >
                    {retryingId === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {retryingId === m.id ? "Summarizing…" : "Generate Summary"}
                  </Button>
                )}

                {m.action_items.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-1 text-sm">
                    {m.action_items.map((a) => (
                      <li key={a.id} className="flex items-center gap-2">
                        <span className={a.status === "done" ? "text-muted-foreground line-through" : ""}>{a.description}</span>
                        {a.category && <span className="rounded-full bg-career-light px-2 py-0.5 text-[11px] font-medium text-career">{a.category}</span>}
                        {a.assignee && <span className="text-xs text-career">· {a.assignee}</span>}
                        {a.deadline && <span className="text-xs text-muted-foreground">· DL {a.deadline}</span>}
                      </li>
                    ))}
                  </ul>
                )}

                {addingToMeeting === m.id ? (
                  <div className="mt-3 flex flex-col gap-2 rounded-xl bg-muted p-3 sm:flex-row sm:items-center">
                    <Input
                      className="sm:flex-1"
                      placeholder="Follow-up action"
                      autoFocus
                      value={newActionDraft.description}
                      onChange={(e) => setNewActionDraft((prev) => ({ ...prev, description: e.target.value }))}
                    />
                    <Input
                      list="mom-category-options"
                      className="sm:w-32"
                      placeholder="Category"
                      value={newActionDraft.category}
                      onChange={(e) => setNewActionDraft((prev) => ({ ...prev, category: e.target.value }))}
                    />
                    <Input
                      list="mom-assignee-options"
                      className="sm:w-32"
                      placeholder="PIC"
                      value={newActionDraft.assignee}
                      onChange={(e) => setNewActionDraft((prev) => ({ ...prev, assignee: e.target.value }))}
                    />
                    <Input
                      className="sm:w-36"
                      type="date"
                      value={newActionDraft.deadline}
                      onChange={(e) => setNewActionDraft((prev) => ({ ...prev, deadline: e.target.value }))}
                    />
                    <Button type="button" size="sm" onClick={() => addActionToExistingMeeting(m.id!)} disabled={!newActionDraft.description.trim()}>
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="mt-2 gap-1 text-muted-foreground"
                    onClick={() => setAddingToMeeting(m.id!)}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add follow-up action
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
