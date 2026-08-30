-- Migration: Calorie tracker (personal food library + daily log).
-- Run after migration_005_push.sql.

create table if not exists food_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  calories numeric not null,       -- calories per one serving
  serving_label text not null default '1 portion',
  source text not null default 'manual' check (source in ('manual', 'ai_estimate')),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
alter table food_library enable row level security;
create policy "Users manage their own food library" on food_library for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists food_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  food_name text not null,
  calories_per_serving numeric not null,
  servings numeric not null default 1,
  total_calories numeric not null,
  food_library_id uuid references food_library(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table food_log enable row level security;
create policy "Users manage their own food log" on food_log for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists food_log_user_date_idx on food_log (user_id, date);
