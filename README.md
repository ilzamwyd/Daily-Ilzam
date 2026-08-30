# Comeback OS

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
3. In **Authentication → Providers**, Email is enabled by default. Optionally enable Google OAuth.
4. In **Authentication → URL Configuration**, add your local and deployed URLs
   (e.g. `http://localhost:3000/auth/callback` and `https://your-app.vercel.app/auth/callback`)
   to the redirect allow-list.
5. Copy your **Project URL** and **anon public key** from Project Settings → API.

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
