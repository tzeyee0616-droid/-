-- Run this in Supabase Dashboard > SQL Editor to drop old sync-code tables
-- and create the simplified user-centric database structure.

-- 1. Drop old tables if they exist
drop table if exists public.sync_members cascade;
drop table if exists public.day_logs cascade;
drop table if exists public.gum_photos cascade;
drop table if exists public.sync_profiles cascade;

drop table if exists public.profiles cascade;

-- 2. Create profiles table (directly linked to auth.users)
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  hair_last text,
  gum_dates_index text[] not null default '{}'::text[],
  todos jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- 3. Create day logs table (directly linked to auth.users)
create table public.day_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  date_str date not null,
  log jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, date_str)
);

-- 4. Create gum photos table (directly linked to auth.users)
create table public.gum_photos (
  user_id uuid not null references auth.users(id) on delete cascade,
  date_str date not null,
  image text not null,
  note text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, date_str)
);

-- 5. Create performance indexes
create index if not exists day_logs_user_id_date_idx
  on public.day_logs (user_id, date_str desc);

create index if not exists gum_photos_user_id_date_idx
  on public.gum_photos (user_id, date_str desc);

-- 6. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.day_logs enable row level security;
alter table public.gum_photos enable row level security;

-- 7. Create straightforward policies checking: user_id = auth.uid()
create policy "Users can manage their own profile"
  on public.profiles
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can manage their own day logs"
  on public.day_logs
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can manage their own gum photos"
  on public.gum_photos
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
