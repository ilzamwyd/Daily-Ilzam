-- Migration: MoM (Minutes of Meeting) + To-Do List
-- Run this in the Supabase SQL Editor after migration_002_finance.sql.

create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  meeting_date date not null default current_date,
  role_context text, -- 'Main Role' | 'Expanded Role' | 'Other'
  raw_notes text,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table meetings enable row level security;

create policy "Users manage their own meetings"
  on meetings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists meetings_user_date_idx on meetings (user_id, meeting_date desc);

create table if not exists action_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meeting_id uuid references meetings(id) on delete set null,
  description text not null,
  assignee text,       -- PIC / person delegated to
  deadline date,
  status text not null default 'todo' check (status in ('todo', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table action_items enable row level security;

create policy "Users manage their own action items"
  on action_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists action_items_user_status_idx on action_items (user_id, status);
