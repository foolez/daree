-- Notifications table (supports nudge + app events)

create extension if not exists "uuid-ossp";

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  sender_id uuid references public.users(id) on delete set null,
  type text not null,
  message text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_created
  on public.notifications(user_id, created_at desc);

create index if not exists idx_notifications_user_unread
  on public.notifications(user_id, is_read);

alter table public.notifications enable row level security;

create policy if not exists "Users can read own notifications"
on public.notifications
for select
using (auth.uid() = user_id);

create policy if not exists "Users can insert notifications they send"
on public.notifications
for insert
with check (auth.uid() = sender_id);

create policy if not exists "Users can update own notifications"
on public.notifications
for update
using (auth.uid() = user_id);

