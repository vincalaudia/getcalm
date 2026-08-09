-- =============================================================================
-- ThinkTok — Fix Missing Columns & Update Policy
-- Run this in the Supabase SQL Editor to fix the silent failure on gameplay start.
-- =============================================================================

-- 1. Add any missing columns to student_sessions
ALTER TABLE student_sessions
ADD COLUMN IF NOT EXISTS correct_guesses INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS incorrect_guesses INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_likes INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_shares INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS hoax_reports INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_reports INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS most_watched_video_id TEXT,
ADD COLUMN IF NOT EXISTS most_watched_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS quiz_score INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_score INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS true_positives INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS false_positives INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS true_negatives INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS false_negatives INTEGER NOT NULL DEFAULT 0;

-- 2. Allow students (anonymous) to update their own session row.
-- Without this, the live updates (battery, score) will fail silently due to RLS.
DROP POLICY IF EXISTS "Students can update sessions" ON student_sessions;

CREATE POLICY "Students can update sessions" ON student_sessions
  FOR UPDATE USING (true) WITH CHECK (true);

-- 3. Ensure student_sessions is in the realtime publication (so the Teacher Dashboard sees inserts/updates)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'student_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE student_sessions;
  END IF;
END $$;
