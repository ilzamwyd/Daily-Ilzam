"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ContentEngagement } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDateISO, startOfWeek } from "@/lib/utils";
import { Plus, Flame } from "lucide-react";

function engagementRate(e: ContentEngagement): string {
  if (!e.views) return "—";
  const interactions = (e.likes ?? 0) + (e.comments ?? 0) + (e.shares ?? 0);
  return `${((interactions / e.views) * 100).toFixed(1)}%`;
}

export function ContentEngagementPanel({ contentId }: { contentId: string }) {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [entries, setEntries] = useState<ContentEngagement[]>([]);
  const [views, setViews] = useState("");
  const [likes, setLikes] = useState("");
  const [comments, setComments] = useState("");
  const [shares, setShares] = useState("");
  const [loading, setLoading] = useState(true);

  const weekStart = formatDateISO(startOfWeek());

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase
        .from("content_engagement")
        .select("*")
        .eq("content_id", contentId)
        .order("week_start", { ascending: false });
      const rows = (data as ContentEngagement[]) ?? [];
      setEntries(rows);
      const thisWeek = rows.find((r) => r.week_start === weekStart);
      if (thisWeek) {
        setViews(thisWeek.views != null ? String(thisWeek.views) : "");
        setLikes(thisWeek.likes != null ? String(thisWeek.likes) : "");
        setComments(thisWeek.comments != null ? String(thisWeek.comments) : "");
        setShares(thisWeek.shares != null ? String(thisWeek.shares) : "");
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId]);

  async function save() {
    if (!userId) return;
    const payload = {
      user_id: userId,
      content_id: contentId,
      week_start: weekStart,
      views: views ? Number(views) : null,
      likes: likes ? Number(likes) : null,
      comments: comments ? Number(comments) : null,
      shares: shares ? Number(shares) : null,
    };
    const { data } = await supabase
      .from("content_engagement")
      .upsert(payload, { onConflict: "content_id,week_start" })
      .select()
      .single();
    if (data) {
      setEntries((prev) => [data as ContentEngagement, ...prev.filter((e) => e.week_start !== weekStart)]);
    }
  }

  const maxViews = Math.max(0, ...entries.map((e) => e.views ?? 0));
  const isHighPerformer = maxViews >= 1000;

  if (loading) return null;

  return (
    <div className="rounded-2xl bg-muted p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Weekly engagement — week of {weekStart}</p>
        {isHighPerformer && (
          <span className="flex items-center gap-1 rounded-full bg-warn-light px-2 py-0.5 text-[11px] font-medium text-warn">
            <Flame className="h-3 w-3" /> 1000+ views
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Input inputMode="numeric" placeholder="Views" value={views} onChange={(e) => setViews(e.target.value)} />
        <Input inputMode="numeric" placeholder="Likes" value={likes} onChange={(e) => setLikes(e.target.value)} />
        <Input inputMode="numeric" placeholder="Comments" value={comments} onChange={(e) => setComments(e.target.value)} />
        <Input inputMode="numeric" placeholder="Shares" value={shares} onChange={(e) => setShares(e.target.value)} />
      </div>
      <Button type="button" size="sm" className="mt-2 gap-1.5" onClick={save}>
        <Plus className="h-3.5 w-3.5" /> Save this week
      </Button>

      {entries.length > 0 && (
        <div className="mt-3 flex flex-col divide-y divide-border">
          {entries.map((e) => (
            <div key={e.id} className="flex items-center justify-between py-1.5 text-xs">
              <span className="text-muted-foreground">{e.week_start}</span>
              <span>
                {e.views ?? 0} views · {e.likes ?? 0}♥ {e.comments ?? 0}💬 {e.shares ?? 0}↗ · {engagementRate(e)} eng.
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
