-- =============================================================================
-- ThinkTok — Update Insight Matrix (005)
-- Run this in the Supabase SQL Editor.
-- =============================================================================

-- 1. Modify student_sessions columns
ALTER TABLE student_sessions
DROP COLUMN IF EXISTS correct_guesses,
DROP COLUMN IF EXISTS incorrect_guesses,
DROP COLUMN IF EXISTS true_positives,
DROP COLUMN IF EXISTS false_positives,
DROP COLUMN IF EXISTS true_negatives,
DROP COLUMN IF EXISTS false_negatives,
DROP COLUMN IF EXISTS total_shares,
DROP COLUMN IF EXISTS hoax_reports,
DROP COLUMN IF EXISTS ai_reports;

ALTER TABLE student_sessions
ADD COLUMN IF NOT EXISTS shares_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS shares_correct INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS shares_incorrect INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_reports_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_reports_correct INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_reports_incorrect INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS hoax_reports_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS hoax_reports_correct INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS hoax_reports_incorrect INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_correct_actions INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_incorrect_actions INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS quiz_correct_count INTEGER NOT NULL DEFAULT 0;

-- 2. Modify student_video_views to add detailed interaction types
ALTER TABLE student_video_views
ADD COLUMN IF NOT EXISTS is_liked BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS report_type TEXT;

-- 3. Create student_quiz_answers for per-question tracking
CREATE TABLE IF NOT EXISTS student_quiz_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES student_sessions(id) ON DELETE CASCADE,
  class_code TEXT NOT NULL REFERENCES classes(class_code) ON DELETE CASCADE,
  question_id INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL
);

-- Enable RLS for student_quiz_answers
ALTER TABLE student_quiz_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students insert quiz answers" ON student_quiz_answers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Teachers read quiz answers" ON student_quiz_answers
  FOR SELECT USING (
    class_code IN (
      SELECT class_code FROM classes WHERE teacher_id = auth.uid()
    )
  );

-- Ensure student_quiz_answers is published if needed for real-time
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'student_quiz_answers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE student_quiz_answers;
  END IF;
END $$;
