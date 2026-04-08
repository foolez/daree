-- Daree Phase 10: ensure rematch parent column + wrapped views

ALTER TABLE public.challenges
ADD COLUMN IF NOT EXISTS parent_challenge_id uuid REFERENCES public.challenges(id);

CREATE TABLE IF NOT EXISTS public.wrapped_views (
  id uuid primary key default uuid_generate_v4(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  viewed_at timestamptz default now(),
  unique(challenge_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_wrapped_views_challenge_user
  ON public.wrapped_views(challenge_id, user_id);

ALTER TABLE public.wrapped_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wrapped views" ON public.wrapped_views;
CREATE POLICY "Users can view own wrapped views"
ON public.wrapped_views
FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own wrapped views" ON public.wrapped_views;
CREATE POLICY "Users can insert own wrapped views"
ON public.wrapped_views
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
