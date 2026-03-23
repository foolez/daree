-- Daree Phase 8: Profile settings and feedback (run in Supabase SQL editor)

-- Add users columns for profile settings
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{"vlogs": true, "reactions": true, "comments": true, "nudges": true, "streaks": true, "weekly_recap": true}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_profile_public boolean DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_in_leaderboard boolean DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS allow_friend_requests boolean DEFAULT true;

-- Feedback table for bug reports
CREATE TABLE IF NOT EXISTS feedback (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete set null,
  type text default 'bug',
  message text not null,
  created_at timestamptz default now()
);

-- RLS for feedback
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback" ON feedback
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own feedback" ON feedback
FOR SELECT TO authenticated
USING (user_id = auth.uid());
