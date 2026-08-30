-- Migration: English tracker, Monthly Plan + curhat, Business tracker,
-- and richer Content pipeline. Run after migration_003_mom_todo.sql.

-- Enrich the existing content_progress table (idea -> started -> editing -> published)
-- with which account it's for, how it performed, and what's next.
alter table content_progress add column if not exists account text;
alter table content_progress add column if not exists result_notes text;
alter table content_progress add column if not exists next_action text;

-- English: long-term level roadmap (from your course plan) and a running vocab log.
create table if not exists english_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_date date not null,
  level_label text not null,
  achieved boolean not null default false,
  created_at timestamptz not null default now()
);
alter table english_goals enable row level security;
create policy "Users manage their own english goals" on english_goals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists english_vocab (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word text not null,
  note text,
  created_at timestamptz not null default now()
);
alter table english_vocab enable row level security;
create policy "Users manage their own vocab" on english_vocab for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Monthly Plan: this month's priorities (a reminder list) + a private curhat/journal entry
-- with an optional AI reflection.
create table if not exists monthly_priorities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null, -- first of month
  priority_text text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
alter table monthly_priorities enable row level security;
create policy "Users manage their own monthly priorities" on monthly_priorities for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists monthly_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  entry_text text,
  ai_reflection text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month)
);
alter table monthly_reflections enable row level security;
create policy "Users manage their own monthly reflections" on monthly_reflections for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Business tracker: a setup checklist + daily sales log.
create table if not exists business_checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_text text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
alter table business_checklist_items enable row level security;
create policy "Users manage their own business checklist" on business_checklist_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists business_sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  revenue numeric not null default 0,
  cost numeric not null default 0,
  note text,
  created_at timestamptz not null default now()
);
alter table business_sales enable row level security;
create policy "Users manage their own business sales" on business_sales for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists business_sales_user_date_idx on business_sales (user_id, date);
