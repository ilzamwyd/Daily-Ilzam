# Daily Ilzam

**Sustainable Ambition — Health × Career × Life**

A personal life operating system: a fast daily check-in (under 2 minutes) plus a
dashboard that turns it into trends, a Weekly Balance Score, and gentle
rule-based insights. Built with Next.js (App Router), TypeScript, Tailwind,
Recharts, and Supabase.

> 70–80% consistency is a win. Never restart — just continue.

## Tech stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + hand-rolled shadcn-style UI primitives
- Recharts for charts
- Supabase (Postgres + Auth + Row Level Security)
- lucide-react icons, next-themes for dark mode

## 1. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run everything in `supabase/schema.sql`. This creates:
   - `daily_logs`, `user_targets`, `weekly_reviews`, `content_progress`, `career_reviews`
   - Row Level Security policies so each user only ever sees their own rows.
2b. Run `supabase/migration_002_finance.sql` too — it adds the `transactions` and
   `monthly_budgets` tables that power the Finance section.
2c. Optional but recommended: after you sign up once in the app, run
   `supabase/seed_finance_data.sql` (replace `YOUR_EMAIL_HERE` with your login email first)
   to import your real August & September budget/transaction history from your old
   spreadsheet, so the Finance dashboard isn't empty on day one.
2d. Run `supabase/migration_003_mom_todo.sql` too — it adds the `meetings` and
   `action_items` tables that power MoM and the To-Do list.
2e. Run `supabase/migration_004_expansion.sql` — adds English tracker tables, Monthly
   Plan/curhat tables, Business tracker tables, and richer Content pipeline columns.
2f. Optional: run `supabase/seed_english_monthlyplan_data.sql` (replace `YOUR_EMAIL_HERE`
   first) to import your English roadmap, vocab list, and September priorities from your
   spreadsheet.
2g. Run `supabase/migration_005_push.sql` if you're setting up the push alarm (see
   section 1c below) — skip it otherwise, the in-app reminder doesn't need it.
2h. Run `supabase/migration_006_calories.sql` — adds the food library + daily food
   log tables behind the new Calories tracker on the Health page. The "Estimate with
   AI" button there reuses the same `ANTHROPIC_API_KEY` you already set up for MoM —
   no new key needed.
3. In **Authentication → Providers**, Email is enabled by default. Optionally enable Google OAuth.
4. In **Authentication → URL Configuration**, add your local and deployed URLs
   (e.g. `http://localhost:3000/auth/callback` and `https://your-app.vercel.app/auth/callback`)
   to the redirect allow-list.
5. Copy your **Project URL** and **anon public key** from Project Settings → API.

## 1b. Anthropic API key (for MoM summarization)

The MoM page turns your raw meeting notes into a summary + follow-up actions using
Claude. This calls the Anthropic API directly from a server route in this app — using
your own key, billed to your own account (pay-as-you-go, typically a few cents per
meeting summarized).

1. Go to [console.anthropic.com](https://console.anthropic.com), sign up/log in.
2. Go to **API Keys** → **Create Key**. Copy it (you won't see it again).
3. Add it as `ANTHROPIC_API_KEY` — locally in `.env.local`, and in Vercel under
   Project Settings → Environment Variables. **Do not** prefix it with `NEXT_PUBLIC_` —
   it must stay server-only, since it's a secret.
4. If you skip this step, every other page still works fine — only the "Generate
   Summary & Actions" button on the MoM page will show an error until it's set.

## 1c. Work-hour alarm & "install on iPhone" (read this before expecting a widget)

Two different things are bundled under this feature — worth being precise about what
each actually does:

**Add to Home Screen (what iOS actually supports for web apps.)** iPhone does not let
web apps create a true system Widget (the small live glanceable box you see in the
Today View / Home Screen gallery) — that requires a native Swift app with WidgetKit,
which is outside what a Next.js web app can do. What you *can* get, and what this app
sets up for you, is an **app icon on your Home Screen**: open the site in Safari, tap
Share → "Add to Home Screen". It'll launch full-screen with no browser bar, like a real
app — just not a native "widget."

**In-app reminder (works now, no setup).** In Settings → Work Hour Alarm → "Enable",
the app will fire a browser notification at your hard stop time — but only while the
tab (or installed app) is actually open somewhere.

**Push alarm (fires even when the app is fully closed) — optional, more setup:**
1. Generate a VAPID keypair (run this once, locally, with Node — no install needed):
   ```bash
   node -e "
   const crypto = require('crypto');
   const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
   const b64url = b => b.toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
   const pub = publicKey.export({ format: 'jwk' });
   const priv = privateKey.export({ format: 'jwk' });
   const point = Buffer.concat([Buffer.from([4]), Buffer.from(pub.x,'base64'), Buffer.from(pub.y,'base64')]);
   console.log('VAPID_PUBLIC_KEY=' + b64url(point));
   console.log('VAPID_PRIVATE_KEY=' + b64url(Buffer.from(priv.d,'base64')));
   "
   ```
2. Add `VAPID_PUBLIC_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (same value as
   `VAPID_PUBLIC_KEY`), `VAPID_PRIVATE_KEY` (secret), and `VAPID_SUBJECT`
   (e.g. `mailto:you@example.com`) to Vercel's Environment Variables.
3. Add `SUPABASE_SERVICE_ROLE_KEY` (from Project Settings → API — this is a secret,
   it bypasses Row Level Security, never expose it to the browser) to Vercel too.
4. Run `supabase/migration_005_push.sql`.
5. **On iPhone specifically**: this only works from an installed Home Screen app
   (step above), requires **iOS 16.4+**, and you must open the app from its Home
   Screen icon (not a regular Safari tab) before the "Enable push alarm" button in
   Settings will do anything.
6. The actual alarm *time* is set once in `vercel.json`'s cron schedule (in UTC,
   default `0 14 * * *` = 21:00 WIB) — Vercel's free Hobby plan only allows
   once-a-day cron schedules, and only guarantees firing sometime within that UTC
   hour, not to the exact minute. If you change your hard-stop time in Settings,
   you need to also update the schedule in `vercel.json` and redeploy — Settings
   alone won't move the push alarm's time. Upgrading to Vercel Pro removes the
   once-a-day and to-the-hour limits if you want tighter precision later.

## 2. Local development

```bash
npm install
cp .env.example .env.local
# paste your Supabase URL + anon key into .env.local
npm run dev
```

Visit `http://localhost:3000`, create an account, and complete your first check-in.

## 3. Deploy to Vercel

```bash
vercel deploy
```

Or connect the repo in the Vercel dashboard. Either way, set these environment
variables in the Vercel project settings (Production + Preview):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Then redeploy. Update the Supabase redirect URL list with your final
`https://<your-domain>/auth/callback` once you have it.

## Project structure

```
src/
  app/
    login/, signup/, auth/callback/     — auth
    (dashboard)/                        — protected routes (auth-guarded layout)
      overview/    — home dashboard: today status, KPIs, Weekly Balance Score, insights
      checkin/     — the daily check-in form
      health/      — weight, waist, steps, gym, PT
      mind/        — mood/stress/energy/sleep trends + possible-pattern callouts
      life/        — connection, recovery, spiritual reflection
      growth/      — English practice + lightweight content pipeline
      work/        — Sustainable Ambition: workload, Career Value Matrix
      reflection/  — weekly review questions + auto-generated summary
      settings/    — editable targets
  components/
    ui/            — Button, Card, Slider, Switch, Segmented, Input, Textarea, Badge
    layout/        — Sidebar (desktop), BottomNav (mobile), TopBar
    charts/        — Recharts wrappers (weight, steps, mood/stress/energy, sleep, gym)
    dashboard/     — KpiCard, WeeklyBalanceRing, InsightsPanel, EmptyState
    checkin/       — SectionCard, ToggleRow
  lib/
    supabase/      — browser client, server client, middleware session refresh
    types.ts       — DailyLog, UserTargets, WeeklyReview, etc.
    score.ts        — Weekly Balance Score calculation (excludes spiritual practice)
    insights.ts     — rule-based Maintain / Watch / Fix Now engine + "possible pattern" correlations
    constants.ts    — microcopy, nav items, balance-score bands
    data.ts         — server-side data fetch helpers
supabase/
  schema.sql        — tables + RLS policies
```

## Design notes

- The Weekly Balance Score deliberately **excludes spiritual practice** — that
  section is for personal reflection only, with no shame styling and no score.
- The insight engine is simple, transparent, rule-based logic — no ML, no
  diagnoses. Patterns are phrased as "Possible Pattern," never "Cause."
- Domain color-coding follows the brief: Health → emerald, Fitness → green,
  Career → blue, Growth → purple, Social → pink, Spiritual → teal,
  Recovery → amber, Mental Health → indigo, Warnings → soft orange,
  Critical → muted red. Both light and dark mode are implemented.
- Empty states are written as invitations ("Your story starts here"), not
  errors, and one bad or unlogged day never resets anything.

## What's intentionally not built yet

Per the brief, these are structured for later but not implemented in this MVP:
PWA/offline support, push notifications, AI-generated weekly insights, CSV
export, Google Fit / Apple Health / wearable integrations, calendar
integration, and detailed calorie tracking. The codebase is organized so any
of these can be added without restructuring existing pages.
