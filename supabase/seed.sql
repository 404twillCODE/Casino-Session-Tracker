-- SessionStack: optional seed data for debugging
-- Run only in dev. Replace YOUR_USER_ID with a real auth.users(id) from Supabase Auth.
-- To get a user id: create a user in Authentication → Users, then copy the UUID.

/*
-- Example: one session and two transactions
insert into public.sessions (id, user_id, started_at, casino_name, notes, budget_cents)
values (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'YOUR_USER_ID',
  now() - interval '2 hours',
  'Example Casino',
  'Seed session for testing',
  50000
);

insert into public.transactions (session_id, user_id, type, amount_cents, note, game)
values
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'YOUR_USER_ID', 'cash_in', 10000, 'Buy-in', 'Blackjack'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'YOUR_USER_ID', 'cash_out', 15000, 'Cash out', 'Blackjack');

insert into public.user_settings (user_id, global_budget_cents)
values ('YOUR_USER_ID', 50000);
*/
