-- SessionStack: Row Level Security
-- Run this in Supabase SQL Editor after schema.sql

-- Enable RLS on both tables
alter table public.sessions enable row level security;
alter table public.transactions enable row level security;
alter table public.user_settings enable row level security;

-- Sessions: user can only access their own rows
create policy "Users can select own sessions"
  on public.sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on public.sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on public.sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own sessions"
  on public.sessions for delete
  using (auth.uid() = user_id);

-- Transactions: user can only access their own rows
create policy "Users can select own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- User settings: user can only access their own row
create policy "Users can select own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.user_settings for update
  using (auth.uid() = user_id);

create policy "Users can delete own settings"
  on public.user_settings for delete
  using (auth.uid() = user_id);
