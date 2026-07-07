-- Run this in Supabase Dashboard > SQL Editor for project:
-- https://zrpxxurqjetawiuyggdb.supabase.co
--
-- Also enable anonymous auth in:
-- Authentication > Sign In / Providers > Anonymous

create table if not exists public.sync_profiles (
  sync_id text primary key check (sync_id ~ '^NG-[A-Z2-9]{4}-[A-Z2-9]{4}$'),
  settings jsonb not null default '{}'::jsonb,
  hair_last text,
  gum_dates_index text[] not null default '{}'::text[],
  todos jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.day_logs (
  sync_id text not null references public.sync_profiles(sync_id) on delete cascade,
  date_str date not null,
  log jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (sync_id, date_str)
);

create table if not exists public.gum_photos (
  sync_id text not null references public.sync_profiles(sync_id) on delete cascade,
  date_str date not null,
  image text not null,
  note text not null default '',
  updated_at timestamptz not null default now(),
  primary key (sync_id, date_str)
);

create table if not exists public.sync_members (
  sync_id text not null references public.sync_profiles(sync_id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (sync_id, user_id)
);

create index if not exists day_logs_sync_id_date_idx
  on public.day_logs (sync_id, date_str desc);

create index if not exists gum_photos_sync_id_date_idx
  on public.gum_photos (sync_id, date_str desc);

alter table public.sync_profiles enable row level security;
alter table public.day_logs enable row level security;
alter table public.gum_photos enable row level security;
alter table public.sync_members enable row level security;

drop policy if exists "Authenticated app users can use sync profiles" on public.sync_profiles;
drop policy if exists "Authenticated app users can use day logs" on public.day_logs;
drop policy if exists "Authenticated app users can use gum photos" on public.gum_photos;
drop policy if exists "Authenticated users can create sync profiles" on public.sync_profiles;
drop policy if exists "Sync members can read sync profiles" on public.sync_profiles;
drop policy if exists "Sync members can update sync profiles" on public.sync_profiles;
drop policy if exists "Sync members can delete sync profiles" on public.sync_profiles;
drop policy if exists "Users can join existing sync profiles" on public.sync_members;
drop policy if exists "Users can read their own sync memberships" on public.sync_members;
drop policy if exists "Users can leave their own sync memberships" on public.sync_members;
drop policy if exists "Sync members can use day logs" on public.day_logs;
drop policy if exists "Sync members can use gum photos" on public.gum_photos;

create policy "Authenticated users can create sync profiles"
  on public.sync_profiles
  for insert
  to authenticated
  with check (true);

create policy "Sync members can read sync profiles"
  on public.sync_profiles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.sync_members m
      where m.sync_id = sync_profiles.sync_id
        and m.user_id = auth.uid()
    )
  );

create policy "Sync members can update sync profiles"
  on public.sync_profiles
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.sync_members m
      where m.sync_id = sync_profiles.sync_id
        and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.sync_members m
      where m.sync_id = sync_profiles.sync_id
        and m.user_id = auth.uid()
    )
  );

create policy "Sync members can delete sync profiles"
  on public.sync_profiles
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.sync_members m
      where m.sync_id = sync_profiles.sync_id
        and m.user_id = auth.uid()
    )
  );

create policy "Users can join existing sync profiles"
  on public.sync_members
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can read their own sync memberships"
  on public.sync_members
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can leave their own sync memberships"
  on public.sync_members
  for delete
  to authenticated
  using (user_id = auth.uid());

create policy "Sync members can use day logs"
  on public.day_logs
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.sync_members m
      where m.sync_id = day_logs.sync_id
        and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.sync_members m
      where m.sync_id = day_logs.sync_id
        and m.user_id = auth.uid()
    )
  );

create policy "Sync members can use gum photos"
  on public.gum_photos
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.sync_members m
      where m.sync_id = gum_photos.sync_id
        and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.sync_members m
      where m.sync_id = gum_photos.sync_id
        and m.user_id = auth.uid()
    )
  );

-- Connection test: run after the tables/policies above.
-- This proves inserts, updates, reads, and deletes are working.
insert into public.sync_profiles (sync_id, settings, hair_last, gum_dates_index, todos)
values (
  'NG-TEST-2222',
  '{"calorieBudget":1800,"waterGoalMl":2000,"weightKg":55,"hairWashIntervalDays":2}'::jsonb,
  null,
  '{}',
  '[]'::jsonb
)
on conflict (sync_id) do update
set settings = excluded.settings,
    updated_at = now();

insert into public.day_logs (sync_id, date_str, log)
values (
  'NG-TEST-2222',
  current_date,
  '{"food":[],"exercise":[],"waterMl":250,"waterLogs":[{"time":"12:00","ml":250}]}'::jsonb
)
on conflict (sync_id, date_str) do update
set log = excluded.log,
    updated_at = now();

insert into public.gum_photos (sync_id, date_str, image, note)
values ('NG-TEST-2222', current_date, 'data:image/png;base64,test', 'connection test')
on conflict (sync_id, date_str) do update
set image = excluded.image,
    note = excluded.note,
    updated_at = now();

select
  p.sync_id,
  p.settings->>'calorieBudget' as calorie_budget,
  d.log->>'waterMl' as water_ml,
  g.note as gum_photo_note
from public.sync_profiles p
join public.day_logs d on d.sync_id = p.sync_id
join public.gum_photos g on g.sync_id = p.sync_id and g.date_str = d.date_str
where p.sync_id = 'NG-TEST-2222';

-- Optional cleanup after the test succeeds:
-- delete from public.sync_profiles where sync_id = 'NG-TEST-2222';
