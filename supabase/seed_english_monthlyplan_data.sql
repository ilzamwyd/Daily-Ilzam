-- Seed script: English roadmap + vocab log, and September priorities, from your spreadsheet.
-- Replace YOUR_EMAIL_HERE below, then run in the Supabase SQL Editor.

do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'YOUR_EMAIL_HERE' limit 1;
  if v_user_id is null then
    raise exception 'No user found with that email. Sign up first, then update the email above.';
  end if;

  -- English roadmap
  insert into english_goals (user_id, target_date, level_label, achieved) values (v_user_id, '2026-05-14', 'Test Penempatan Setting Goals & Timeline', false);
  insert into english_goals (user_id, target_date, level_label, achieved) values (v_user_id, '2026-06-14', 'Checkpoint & Evaluate the study progress > identify what have been my diffulity', false);
  insert into english_goals (user_id, target_date, level_label, achieved) values (v_user_id, '2026-07-14', 'Pre-Intermediate 2', false);
  insert into english_goals (user_id, target_date, level_label, achieved) values (v_user_id, '2026-09-14', 'Pre-Intermediate 3', false);
  insert into english_goals (user_id, target_date, level_label, achieved) values (v_user_id, '2026-11-14', 'Pre-Intermediate 4', false);
  insert into english_goals (user_id, target_date, level_label, achieved) values (v_user_id, '2027-01-14', 'Intermediate 1', false);
  insert into english_goals (user_id, target_date, level_label, achieved) values (v_user_id, '2027-03-14', 'Intermediate 2', false);
  insert into english_goals (user_id, target_date, level_label, achieved) values (v_user_id, '2027-05-14', 'Intermediate 3', false);
  insert into english_goals (user_id, target_date, level_label, achieved) values (v_user_id, '2027-07-14', 'Intermediate 4', false);
  insert into english_goals (user_id, target_date, level_label, achieved) values (v_user_id, '2027-09-14', 'Upper Intermediate 1', false);
  insert into english_goals (user_id, target_date, level_label, achieved) values (v_user_id, '2027-11-14', 'Upper Intermediate 2', false);
  insert into english_goals (user_id, target_date, level_label, achieved) values (v_user_id, '2028-01-14', 'Upper Intermediate 3', false);

  -- Vocabulary already logged
  insert into english_vocab (user_id, word) values (v_user_id, 'pout');
  insert into english_vocab (user_id, word) values (v_user_id, 'panting');
  insert into english_vocab (user_id, word) values (v_user_id, 'realm');
  insert into english_vocab (user_id, word) values (v_user_id, 'cane');
  insert into english_vocab (user_id, word) values (v_user_id, 'tinsel');
  insert into english_vocab (user_id, word) values (v_user_id, 'jagger');
  insert into english_vocab (user_id, word) values (v_user_id, 'grunting');
  insert into english_vocab (user_id, word) values (v_user_id, 'bask in');
  insert into english_vocab (user_id, word) values (v_user_id, 'impeccable');
  insert into english_vocab (user_id, word) values (v_user_id, 'fabricated');
  insert into english_vocab (user_id, word) values (v_user_id, 'refracting');
  insert into english_vocab (user_id, word) values (v_user_id, 'exquisite');
  insert into english_vocab (user_id, word) values (v_user_id, 'used to');
  insert into english_vocab (user_id, word) values (v_user_id, 'physical word');
  insert into english_vocab (user_id, word) values (v_user_id, 'giggling');
  insert into english_vocab (user_id, word) values (v_user_id, 'envious');
  insert into english_vocab (user_id, word) values (v_user_id, 'owe');
  insert into english_vocab (user_id, word) values (v_user_id, 'slack off');
  insert into english_vocab (user_id, word) values (v_user_id, 'clenches up');
  insert into english_vocab (user_id, word) values (v_user_id, 'quintuple');
  insert into english_vocab (user_id, word) values (v_user_id, 'galactic confluence');
  insert into english_vocab (user_id, word) values (v_user_id, 'adjourned');
  insert into english_vocab (user_id, word) values (v_user_id, 'indisticnt');
  insert into english_vocab (user_id, word) values (v_user_id, 'scracthes');
  insert into english_vocab (user_id, word) values (v_user_id, 'creep');
  insert into english_vocab (user_id, word) values (v_user_id, 'oblterated');

  -- September 2026 priorities (from your Monthly Plan sheet)
  insert into monthly_priorities (user_id, month, priority_text, done) values
    (v_user_id, '2026-09-01', 'Buy new iPad for career support', false),
    (v_user_id, '2026-09-01', 'Tes Penempatan Bahasa Inggris — must reach Pre-Intermediate 3', false);

end $$;