-- Daree Phase 11: delete + leave RLS policies

DROP POLICY IF EXISTS "Users can delete own challenges" ON challenges;
CREATE POLICY "Users can delete own challenges" ON challenges
FOR DELETE TO authenticated
USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can leave challenges" ON challenge_members;
CREATE POLICY "Users can leave challenges" ON challenge_members
FOR DELETE TO authenticated
USING (user_id = auth.uid());
