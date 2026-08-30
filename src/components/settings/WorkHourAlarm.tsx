"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { urlBase64ToUint8Array } from "@/lib/push";
import { AlarmClock, BellRing } from "lucide-react";

const INAPP_KEY = "daily-ilzam-inapp-alarm-enabled";
const LAST_FIRED_KEY = "daily-ilzam-inapp-alarm-last-fired";

export function WorkHourAlarm({ hardStopTime }: { hardStopTime: string }) {
  const supabase = createClient();
  const [inAppEnabled, setInAppEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);

  useEffect(() => {
    setInAppEnabled(localStorage.getItem(INAPP_KEY) === "true");
    setPushSupported("serviceWorker" in navigator && "PushManager" in window);
    (async () => {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready.catch(() => null);
        const sub = await reg?.pushManager.getSubscription();
        setPushSubscribed(!!sub);
      }
    })();
  }, []);

  // Foreground check: while this tab is open, fire a browser notification once
  // per day at the hard stop time. This does NOT work if the tab/app is fully
  // closed — for that, use the push alarm below.
  useEffect(() => {
    if (!inAppEnabled) return;
    const interval = setInterval(() => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const today = now.toISOString().slice(0, 10);
      if (hhmm === hardStopTime.slice(0, 5) && localStorage.getItem(LAST_FIRED_KEY) !== today) {
        localStorage.setItem(LAST_FIRED_KEY, today);
        if (Notification.permission === "granted") {
          new Notification("Hard stop — time to log off", {
            body: "One rough day doesn't erase your progress. Rest is part of the plan.",
            icon: "/icons/icon-192.png",
          });
        }
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [inAppEnabled, hardStopTime]);

  async function toggleInApp() {
    if (!inAppEnabled) {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return;
    }
    const next = !inAppEnabled;
    localStorage.setItem(INAPP_KEY, String(next));
    setInAppEnabled(next);
  }

  async function subscribePush() {
    setPushError(null);
    setPushBusy(true);
    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setPushError("Push isn't configured yet — VAPID_PUBLIC_KEY is missing on this deployment.");
        return;
      }
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setPushError("Notification permission was not granted.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(sub),
      });
      if (!res.ok) {
        const d = await res.json();
        setPushError(d.error ?? "Could not save subscription.");
        return;
      }
      setPushSubscribed(true);
    } catch (err) {
      setPushError((err as Error).message);
    } finally {
      setPushBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-warn-light text-warn">
          <AlarmClock className="h-5 w-5" />
        </div>
        <div>
          <CardTitle>Work Hour Alarm</CardTitle>
          <CardDescription>Reminds you at your hard stop time ({hardStopTime || "21:00"}).</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-2xl bg-muted p-4">
          <div>
            <p className="text-sm font-medium">In-app reminder</p>
            <p className="text-xs text-muted-foreground">Works while this tab/app is open in your browser.</p>
          </div>
          <Button size="sm" variant={inAppEnabled ? "default" : "soft"} onClick={toggleInApp}>
            {inAppEnabled ? "Enabled" : "Enable"}
          </Button>
        </div>

        <div className="rounded-2xl bg-muted p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <BellRing className="h-3.5 w-3.5" /> Push alarm (works even when closed)
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                On iPhone: first tap Share → <strong>Add to Home Screen</strong>, open Daily Ilzam from that icon, then
                subscribe below. Regular Safari tabs can't receive push on iOS.
              </p>
            </div>
          </div>
          {pushSupported ? (
            <Button size="sm" variant={pushSubscribed ? "default" : "soft"} className="mt-3" onClick={subscribePush} disabled={pushBusy || pushSubscribed}>
              {pushSubscribed ? "Subscribed ✓" : pushBusy ? "Subscribing…" : "Enable push alarm"}
            </Button>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">Push isn't supported in this browser/mode yet.</p>
          )}
          {pushError && <p className="mt-2 text-xs text-critical">{pushError}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
