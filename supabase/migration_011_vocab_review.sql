-- Migration: spaced-repetition fields for vocabulary review.
-- Run after migration_010_fitness_split.sql.

alter table english_vocab add column if not exists review_count integer not null default 0;
alter table english_vocab add column if not exists next_review_date date not null default (current_date + 1);
alter table english_vocab add column if not exists last_reviewed_at timestamptz;

create index if not exists english_vocab_user_review_idx on english_vocab (user_id, next_review_date);
