import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Only ever import this from server-only code (API routes, cron jobs) — the
// service role key bypasses Row Level Security entirely.
export function createAdminClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
