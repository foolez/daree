-- Daree Phase 7: Public/Private, Comments, Join Requests, Rematch, Status
-- Run in Supabase SQL editor after phase6

-- Challenges: public/private, status, parent for rematch
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
-- status: 'active', 'completed'
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS parent_challenge_id uuid REFERENCES public.challenges(id);

-- Join requests for public challenges
CREATE TABLE IF NOT EXISTS public.join_requests (
  id uuid primary key default uuid_generate_v4(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status text default 'pending',
  created_at timestamptz default now(),
  unique(challenge_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_join_requests_challenge ON public.join_requests(challenge_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_user ON public.join_requests(user_id);

-- Comments on vlogs
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid primary key default uuid_generate_v4(),
  vlog_id uuid not null references public.vlogs(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  text text not null,
  created_at timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_comments_vlog ON public.comments(vlog_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON public.comments(created_at desc);

-- Add title to notifications if missing
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title text;
