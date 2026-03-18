-- Friend System (MVP)

create extension if not exists "uuid-ossp";

create table if not exists public.friend_requests (
  id uuid primary key default uuid_generate_v4(),
  from_user_id uuid references public.users(id) on delete cascade,
  to_user_id uuid references public.users(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz default now(),
  unique (from_user_id, to_user_id)
);

create index if not exists idx_friend_requests_to on public.friend_requests(to_user_id, status, created_at desc);

-- RLS
alter table public.friend_requests enable row level security;

create policy if not exists "Users can insert own requests"
on public.friend_requests
for insert
with check (auth.uid() = from_user_id);

create policy if not exists "Users can read incoming requests"
on public.friend_requests
for select
using (auth.uid() = to_user_id);

create policy if not exists "Users can respond to incoming requests"
on public.friend_requests
for update
using (auth.uid() = to_user_id);

