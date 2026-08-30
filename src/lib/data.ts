import { SupabaseClient } from "@supabase/supabase-js";
import { DailyLog, UserTargets, DEFAULT_TARGETS } from "./types";
import { formatDateISO, daysAgo } from "./utils";

export async function getRecentLogs(
  supabase: SupabaseClient,
  userId: string,
  days = 60
): Promise<DailyLog[]> {
  const since = formatDateISO(daysAgo(days));
  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("date", since)
    .order("date", { ascending: true });

  if (error) {
    console.error("getRecentLogs error", error.message);
    return [];
  }
  return (data ?? []) as DailyLog[];
}

export async function getLogForDate(
  supabase: SupabaseClient,
  userId: string,
  date: string
): Promise<DailyLog | null> {
  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (error) {
    console.error("getLogForDate error", error.message);
    return null;
  }
  return (data as DailyLog) ?? null;
}

export async function getTargets(supabase: SupabaseClient, userId: string): Promise<UserTargets> {
  const { data, error } = await supabase
    .from("user_targets")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("getTargets error", error.message);
    return DEFAULT_TARGETS;
  }
  if (!data) return DEFAULT_TARGETS;
  return data as UserTargets;
}
