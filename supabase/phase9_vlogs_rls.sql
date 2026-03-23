-- Fix vlogs RLS if inserts are failing (run in Supabase SQL editor)

ALTER TABLE vlogs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert own vlogs" ON vlogs;
DROP POLICY IF EXISTS "Users can insert vlogs" ON vlogs;

-- Allow authenticated users to insert vlogs
CREATE POLICY "Users can insert own vlogs" ON vlogs
FOR INSERT TO authenticated
WITH CHECK (true);

-- Drop and recreate read policy
DROP POLICY IF EXISTS "Users can read vlogs" ON vlogs;
DROP POLICY IF EXISTS "Users can read challenge vlogs" ON vlogs;

CREATE POLICY "Users can read vlogs" ON vlogs
FOR SELECT TO authenticated
USING (true);
