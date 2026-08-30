import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  // Vercel signs cron requests with this header automatically — verify it so
  // nobody else can trigger notification spam by hitting this URL.
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:hello@example.com";
  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json({ error: "VAPID keys not configured." }, { status: 500 });
  }
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  const supabase = createAdminClient();
  const { data: subs, error } = await supabase.from("push_subscriptions").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const payload = JSON.stringify({
    title: "Hard stop — time to log off",
    body: "One rough day doesn't erase your progress. Rest is part of the plan.",
    url: "/overview",
  });

  const results = await Promise.allSettled(
    (subs ?? []).map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      )
    )
  );

  // Clean up subscriptions the browser has since revoked (410 Gone / 404).
  const toRemove: string[] = [];
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      const statusCode = (r.reason as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) toRemove.push(subs![i].endpoint);
    }
  });
  if (toRemove.length > 0) {
    await supabase.from("push_subscriptions").delete().in("endpoint", toRemove);
  }

  return NextResponse.json({ sent: results.filter((r) => r.status === "fulfilled").length, total: results.length });
}
