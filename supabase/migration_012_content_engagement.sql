-- Migration: content publishing calendar + weekly engagement tracking
-- (views/likes/comments/shares, auto engagement rate, >1000 views classification).
-- Run after migration_011_vocab_review.sql.

alter table content_progress add column if not exists published_date date;

create table if not exists content_engagement (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id uuid not null references content_progress(id) on delete cascade,
  week_start date not null default current_date,
  views numeric,
  likes numeric,
  comments numeric,
  shares numeric,
  created_at timestamptz not null default now(),
  unique (content_id, week_start)
);
alter table content_engagement enable row level security;
create policy "Users manage their own content engagement" on content_engagement for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists content_engagement_content_idx on content_engagement (content_id, week_start);
