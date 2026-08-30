-- Migration: Finance module (transactions + monthly budgets)
-- Run this in the Supabase SQL Editor after the original schema.sql.

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  time time not null default current_time,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null check (amount >= 0),
  source text not null default 'Cash',
  code text not null,      -- group: Foodies / Transportation / Accomodation / Shopping / Others / Income
  category text not null,  -- subcategory, or income category when type = 'income'
  note text,
  created_at timestamptz not null default now()
);

alter table transactions enable row level security;

create policy "Users manage their own transactions"
  on transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists transactions_user_date_idx on transactions (user_id, date);

create table if not exists monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,     -- first day of the month, e.g. 2026-09-01
  type text not null check (type in ('income', 'expense')),
  code text not null,
  category text not null,
  budgeted_amount numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month, type, code, category)
);

alter table monthly_budgets enable row level security;

create policy "Users manage their own budgets"
  on monthly_budgets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists monthly_budgets_user_month_idx on monthly_budgets (user_id, month);
