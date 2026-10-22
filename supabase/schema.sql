-- Staffly prototype: one table for saved bookings, locked to each signed-in user.
-- Paste this into Supabase: SQL Editor -> New query -> Run.

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  reference text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, reference)
);

-- Row Level Security: a user can only ever see and change their own rows.
alter table public.bookings enable row level security;

drop policy if exists "bookings_select_own" on public.bookings;
create policy "bookings_select_own" on public.bookings
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "bookings_insert_own" on public.bookings;
create policy "bookings_insert_own" on public.bookings
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "bookings_update_own" on public.bookings;
create policy "bookings_update_own" on public.bookings
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- No delete policy on purpose: the prototype never deletes bookings.
