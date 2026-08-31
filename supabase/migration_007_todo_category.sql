-- Migration: add category to action_items (To-Do grouping/filtering).
-- Run after migration_006_calories.sql.

alter table action_items add column if not exists category text;
