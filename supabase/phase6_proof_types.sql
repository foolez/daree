-- Daree Phase 6: Three-tier proof system
-- Run in Supabase SQL editor after phase2, phase3

-- Add proof_type to vlogs (vlog=3pts, selfie=2pts, checkin=0pts)
ALTER TABLE public.vlogs ADD COLUMN IF NOT EXISTS proof_type text DEFAULT 'vlog';
-- Values: 'vlog', 'selfie', 'checkin'

-- Make video_url nullable (check-ins have no media)
ALTER TABLE public.vlogs ALTER COLUMN video_url DROP NOT NULL;

-- Add total_points to challenge_members for ranking
ALTER TABLE public.challenge_members ADD COLUMN IF NOT EXISTS total_points int DEFAULT 0;

-- Backfill total_points from existing vlogs (vlog=3, selfie=2, checkin=0)
UPDATE public.challenge_members cm
SET total_points = COALESCE(
  (SELECT SUM(CASE WHEN v.proof_type = 'vlog' THEN 3 WHEN v.proof_type = 'selfie' THEN 2 ELSE 0 END)
   FROM public.vlogs v WHERE v.challenge_id = cm.challenge_id AND v.user_id = cm.user_id),
  0
)
WHERE total_points = 0 OR total_points IS NULL;
