-- Migration: English session tracking by aspect (Listening/Reading/Speaking/
-- Writing/Grammar/Vocabulary/Evaluation), replacing the flat Y/N toggle.
-- Run after migration_008_health_expansion.sql.

create table if not exists english_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  aspect text not null check (aspect in ('Listening','Reading','Speaking','Writing','Grammar','Vocabulary','Evaluation')),
  duration_minutes numeric,
  notes text,
  created_at timestamptz not null default now()
);
alter table english_sessions enable row level security;
create policy "Users manage their own english sessions" on english_sessions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists english_sessions_user_date_idx on english_sessions (user_id, date);

-- Give english_vocab a plain date column (like the other daily logs) so "today's
-- words" can be filtered without timezone ambiguity from created_at comparisons.
alter table english_vocab add column if not exists date date not null default current_date;
