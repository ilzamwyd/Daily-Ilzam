-- Migration: split Fitness into Gym (with duration + insight note) and a
-- separate activity_log for other sports (Running/Badminton/Walking/Other)
-- with distance/pace, Strava-style.
-- Run after migration_009_english_sessions.sql.

alter table daily_logs add column if not exists gym_duration_minutes numeric;
alter table daily_logs add column if not exists gym_notes text;

create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  activity_type text not null check (activity_type in ('Running', 'Badminton', 'Walking', 'Other')),
  duration_minutes numeric,
  distance_km numeric,
  notes text,
  created_at timestamptz not null default now()
);
alter table activity_log enable row level security;
create policy "Users manage their own activity log" on activity_log for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists activity_log_user_date_idx on activity_log (user_id, date);
