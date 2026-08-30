-- COMEBACK OS — Supabase schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- Assumes auth.users already exists (Supabase Auth).

-- ============================================================
-- daily_logs
-- ============================================================
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,

  weight numeric,
  waist numeric,
  sleep_hours numeric,
  steps integer,

  gym boolean not null default false,
  pt_session boolean not null default false,
  exercise_type text check (exercise_type in ('gym','badminton','running','walking','other')),
  exercise_duration integer,

  healthygo boolean not null default false,
  other_meals_controlled boolean not null default false,
  stress_eating text not null default 'no' check (stress_eating in ('no','small','significant')),
  stress_eating_trigger text,

  prayers_completed smallint not null default 0 check (prayers_completed between 0 and 5),

  mood smallint check (mood between 1 and 10),
  stress smallint check (stress between 1 and 10),
  energy smallint check (energy between 1 and 10),
  mind_note text,

  family_contact boolean not null default false,
  family_call boolean not null default false,
  social_activity boolean not null default false,
  social_type text check (social_type in ('friends','coworkers','sport','community','family','other')),

  english_practice boolean not null default false,
  english_duration integer,
  content_worked boolean not null default false,
  content_published boolean not null default false,

  work_finish_time time,
  worked_after_9 boolean not null default false,
  main_role_workload smallint check (main_role_workload between 1 and 10),
  data_role_workload smallint check (data_role_workload between 1 and 10),
  work_pressure_note text,

  recovery boolean not null default false,
  recovery_minutes integer,
  recovery_type text check (recovery_type in ('nothing','music','movie','gaming','walking','coffee','sleep','socializing','other')),

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, date)
);

create index if not exists daily_logs_user_date_idx on public.daily_logs (user_id, date desc);

-- ============================================================
-- user_targets  (one row per user)
-- ============================================================
create table if not exists public.user_targets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  starting_weight numeric,
  step_target integer not null default 7000,
  gym_weekly_target smallint not null default 3,
  sleep_target_min numeric not null default 7,
  sleep_target_max numeric not null default 8,
  english_weekly_target smallint not null default 3,
  content_weekly_target smallint not null default 1,
  social_weekly_target smallint not null default 1,
  family_contact_weekly_target numeric not null default 2.5,
  preferred_finish_time time not null default '18:30',
  hard_stop_time time not null default '21:00',
  recovery_daily_min_minutes integer not null default 30,
  recovery_daily_max_minutes integer not null default 60,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- weekly_reviews
-- ============================================================
create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  went_well text,
  drained_me text,
  gave_energy text,
  stress_eating_trigger text,
  stop_doing text,
  grateful_for text,
  one_priority text,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

-- ============================================================
-- content_progress
-- ============================================================
create table if not exists public.content_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  stage text not null default 'idea' check (stage in ('idea','started','editing','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- career_reviews  (weekly, per role)
-- ============================================================
create table if not exists public.career_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  role text not null check (role in ('main','expanded')),
  workload smallint check (workload between 1 and 10),
  enjoyment smallint check (enjoyment between 1 and 10),
  learning smallint check (learning between 1 and 10),
  impact smallint check (impact between 1 and 10),
  stress smallint check (stress between 1 and 10),
  created_at timestamptz not null default now(),
  unique (user_id, week_start, role)
);

-- ============================================================
-- Row Level Security — each user only sees their own rows
-- ============================================================
alter table public.daily_logs enable row level security;
alter table public.user_targets enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.content_progress enable row level security;
alter table public.career_reviews enable row level security;

create policy "daily_logs_select_own" on public.daily_logs for select using (auth.uid() = user_id);
create policy "daily_logs_insert_own" on public.daily_logs for insert with check (auth.uid() = user_id);
create policy "daily_logs_update_own" on public.daily_logs for update using (auth.uid() = user_id);
create policy "daily_logs_delete_own" on public.daily_logs for delete using (auth.uid() = user_id);

create policy "user_targets_select_own" on public.user_targets for select using (auth.uid() = user_id);
create policy "user_targets_insert_own" on public.user_targets for insert with check (auth.uid() = user_id);
create policy "user_targets_update_own" on public.user_targets for update using (auth.uid() = user_id);

create policy "weekly_reviews_select_own" on public.weekly_reviews for select using (auth.uid() = user_id);
create policy "weekly_reviews_insert_own" on public.weekly_reviews for insert with check (auth.uid() = user_id);
create policy "weekly_reviews_update_own" on public.weekly_reviews for update using (auth.uid() = user_id);
create policy "weekly_reviews_delete_own" on public.weekly_reviews for delete using (auth.uid() = user_id);

create policy "content_progress_select_own" on public.content_progress for select using (auth.uid() = user_id);
create policy "content_progress_insert_own" on public.content_progress for insert with check (auth.uid() = user_id);
create policy "content_progress_update_own" on public.content_progress for update using (auth.uid() = user_id);
create policy "content_progress_delete_own" on public.content_progress for delete using (auth.uid() = user_id);

create policy "career_reviews_select_own" on public.career_reviews for select using (auth.uid() = user_id);
create policy "career_reviews_insert_own" on public.career_reviews for insert with check (auth.uid() = user_id);
create policy "career_reviews_update_own" on public.career_reviews for update using (auth.uid() = user_id);
create policy "career_reviews_delete_own" on public.career_reviews for delete using (auth.uid() = user_id);

-- Keep updated_at fresh on daily_logs
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists daily_logs_set_updated_at on public.daily_logs;
create trigger daily_logs_set_updated_at
  before update on public.daily_logs
  for each row execute procedure public.set_updated_at();

drop trigger if exists content_progress_set_updated_at on public.content_progress;
create trigger content_progress_set_updated_at
  before update on public.content_progress
  for each row execute procedure public.set_updated_at();
