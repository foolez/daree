-- Daree Phase 2 tables (run in Supabase SQL editor)

-- Enable uuid generation if needed
create extension if not exists "uuid-ossp";

-- challenges
create table if not exists public.challenges (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  goal_type text,
  duration_days int,
  start_date date,
  end_date date,
  created_by uuid references public.users(id),
  invite_code text unique,
  created_at timestamptz default now()
);

-- challenge_members
create table if not exists public.challenge_members (
  id uuid primary key default uuid_generate_v4(),
  challenge_id uuid references public.challenges(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  role text default 'member',
  current_streak int default 0,
  longest_streak int default 0,
  total_vlogs int default 0,
  joined_at timestamptz default now(),
  unique (challenge_id, user_id)
);

