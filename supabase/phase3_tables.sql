-- Daree Phase 3 tables + storage policies (run in Supabase SQL editor)

create extension if not exists "uuid-ossp";

-- vlogs
create table if not exists public.vlogs (
  id uuid primary key default uuid_generate_v4(),
  challenge_id uuid references public.challenges(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  video_url text not null,
  thumbnail_url text,
  caption text,
  duration_seconds int,
  day_number int,
  created_at timestamptz default now()
);

-- reactions
create table if not exists public.reactions (
  id uuid primary key default uuid_generate_v4(),
  vlog_id uuid references public.vlogs(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz default now(),
  unique (vlog_id, user_id, emoji)
);

-- Storage policies (requires RLS enabled on storage.objects in your project)
-- Bucket "vlogs" must exist and be public.
create policy if not exists "Anyone can upload vlogs"
on storage.objects for insert
with check (bucket_id = 'vlogs');

create policy if not exists "Anyone can view vlogs"
on storage.objects for select
using (bucket_id = 'vlogs');

