import { SupabaseClient } from "@supabase/supabase-js";
import { DailyLog, UserTargets, DEFAULT_TARGETS, Transaction, MonthlyBudget } from "./types";
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

export async function getTransactionsForMonth(
  supabase: SupabaseClient,
  userId: string,
  month: string // YYYY-MM-01
): Promise<Transaction[]> {
  const [y, m] = month.split("-").map(Number);
  const start = `${y}-${String(m).padStart(2, "0")}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false })
    .order("time", { ascending: false });

  if (error) {
    console.error("getTransactionsForMonth error", error.message);
    return [];
  }
  return (data ?? []) as Transaction[];
}

export async function getBudgetsForMonth(
  supabase: SupabaseClient,
  userId: string,
  month: string
): Promise<MonthlyBudget[]> {
  const { data, error } = await supabase
    .from("monthly_budgets")
    .select("*")
    .eq("user_id", userId)
    .eq("month", month);

  if (error) {
    console.error("getBudgetsForMonth error", error.message);
    return [];
  }
  return (data ?? []) as MonthlyBudget[];
}

export async function getTransactionsForRange(
  supabase: SupabaseClient,
  userId: string,
  start: string,
  end: string
): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false })
    .order("time", { ascending: false });

  if (error) {
    console.error("getTransactionsForRange error", error.message);
    return [];
  }
  return (data ?? []) as Transaction[];
}

export async function getBudgetsForMonths(
  supabase: SupabaseClient,
  userId: string,
  monthKeys: string[]
): Promise<MonthlyBudget[]> {
  const { data, error } = await supabase.from("monthly_budgets").select("*").eq("user_id", userId).in("month", monthKeys);

  if (error) {
    console.error("getBudgetsForMonths error", error.message);
    return [];
  }
  return (data ?? []) as MonthlyBudget[];
}
