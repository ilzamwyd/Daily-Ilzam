"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Meeting, ActionItem } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { VoiceDictationButton } from "@/components/mom/VoiceDictationButton";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Sparkles, Save, Trash2, Plus, Loader2 } from "lucide-react";

type DraftAction = { description: string; assignee: string; deadline: string };

const ROLE_CONTEXTS = ["Main Role", "Expanded Role", "Other"] as const;

export default function MomPage() {
  const supabase = createClient();
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

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      await loadHistory(user.id);
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
        meeting_date: new Date().toISOString().slice(0, 10),
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
          status: "todo",
        }));
      if (rows.length > 0) await supabase.from("action_items").insert(rows);
      // reset form
      setTitle("");
      setRawNotes("");
      setSummary("");
      setDraftActions([]);
      await loadHistory(userId);
    }
    setSaving(false);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">MoM — Minutes of Meeting</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Capture fast during the meeting, then let it turn into a summary and follow-up actions — no more post-its.
        </p>
      </div>

      <Card className="flex flex-col gap-4 p-6">
        <Input placeholder="Meeting title — e.g. Sync with Kak Shella" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Context</label>
          <Segmented options={ROLE_CONTEXTS} value={roleContext} onChange={setRoleContext} activeClassName="bg-career text-white" />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Notes</label>
          <VoiceDictationButton onTranscript={(t) => setRawNotes((prev) => (prev ? `${prev} ${t}` : t))} />
        </div>
        <Textarea
          rows={8}
          placeholder="Type or dictate as the meeting happens — current condition, next plan, who owns what, any deadlines mentioned..."
          value={rawNotes}
          onChange={(e) => setRawNotes(e.target.value)}
        />

        <Button
          type="button"
          className="gap-2 self-start"
          onClick={handleSummarize}
          disabled={summarizing || rawNotes.trim().length < 5}
        >
          {summarizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {summarizing ? "Summarizing…" : "Generate Summary & Actions"}
        </Button>
        {summarizeError && <p className="text-sm text-critical">{summarizeError}</p>}

        {(summary || draftActions.length > 0) && (
          <div className="flex flex-col gap-4 rounded-2xl border border-career/30 bg-career-light/40 p-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Summary</label>
              <Textarea rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Follow-Up Actions</label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="gap-1"
                  onClick={() => setDraftActions((prev) => [...prev, { description: "", assignee: "", deadline: "" }])}
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </div>
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
            </div>
          </div>
        )}

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
                {m.summary && <p className="mt-2 text-sm text-muted-foreground">{m.summary}</p>}
                {m.action_items.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-1 text-sm">
                    {m.action_items.map((a) => (
                      <li key={a.id} className="flex items-center gap-2">
                        <span className={a.status === "done" ? "text-muted-foreground line-through" : ""}>{a.description}</span>
                        {a.assignee && <span className="text-xs text-career">· {a.assignee}</span>}
                        {a.deadline && <span className="text-xs text-muted-foreground">· DL {a.deadline}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
