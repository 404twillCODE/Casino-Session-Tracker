-- SessionStack: tables and indexes
-- Run this in Supabase SQL Editor before rls.sql

-- Sessions: one per casino visit
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz null,
  casino_name text null,
  notes text null,
  budget_cents int null check (budget_cents > 0),
  created_at timestamptz not null default now()
);

-- Transactions: cash in / cash out per session
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('cash_in', 'cash_out')),
  amount_cents int not null check (amount_cents > 0),
  occurred_at timestamptz not null default now(),
  note text null,
  game text null,
  created_at timestamptz not null default now()
);

-- Per-user settings (global budget, etc.)
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  global_budget_cents int null check (global_budget_cents > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for common queries
create index if not exists idx_sessions_user_started
  on public.sessions (user_id, started_at desc);

create index if not exists idx_transactions_session_occurred
  on public.transactions (session_id, occurred_at desc);

create index if not exists idx_transactions_user_occurred
  on public.transactions (user_id, occurred_at desc);

create index if not exists idx_user_settings_user
  on public.user_settings (user_id);
