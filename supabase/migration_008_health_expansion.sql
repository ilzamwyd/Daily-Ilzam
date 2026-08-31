-- Migration: move calorie logging into meal slots (breakfast/lunch/snack/dinner),
-- add calorie target range, a detailed exercise log, and a water intake log.
-- Run after migration_007_todo_category.sql.

alter table food_log add column if not exists meal_slot text check (meal_slot in ('breakfast','lunch','snack','dinner'));

alter table user_targets add column if not exists calorie_min numeric;
alter table user_targets add column if not exists calorie_max numeric;

create table if not exists workout_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  exercise_name text not null,
  duration_minutes numeric,
  created_at timestamptz not null default now()
);
alter table workout_log enable row level security;
create policy "Users manage their own workout log" on workout_log for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists workout_log_user_date_idx on workout_log (user_id, date);

create table if not exists water_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  amount_ml numeric not null,
  logged_at timestamptz not null default now()
);
alter table water_log enable row level security;
create policy "Users manage their own water log" on water_log for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists water_log_user_date_idx on water_log (user_id, date);
