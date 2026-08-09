-- ============================================================
-- ThinkTok — Supabase Migration
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Table: classes (teacher-created class codes)
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_code TEXT UNIQUE NOT NULL CHECK (class_code ~ '^[A-Z0-9]+$'),
  class_name TEXT NOT NULL,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  active_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: student_sessions (one row per completed student session)
CREATE TABLE IF NOT EXISTS student_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name TEXT NOT NULL,
  class_code TEXT NOT NULL REFERENCES classes(class_code) ON DELETE CASCADE,
  game_mode TEXT NOT NULL,
  focus_battery_final INTEGER NOT NULL DEFAULT 0,
  fact_score_final INTEGER NOT NULL DEFAULT 0,
  correct_guesses INTEGER NOT NULL DEFAULT 0,
  incorrect_guesses INTEGER NOT NULL DEFAULT 0,
  total_likes INTEGER NOT NULL DEFAULT 0,
  total_shares INTEGER NOT NULL DEFAULT 0,
  hoax_reports INTEGER NOT NULL DEFAULT 0,
  ai_reports INTEGER NOT NULL DEFAULT 0,
  most_watched_video_id TEXT,
  most_watched_seconds INTEGER DEFAULT 0,
  quiz_score INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  true_positives INTEGER NOT NULL DEFAULT 0,
  false_positives INTEGER NOT NULL DEFAULT 0,
  true_negatives INTEGER NOT NULL DEFAULT 0,
  false_negatives INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: student_video_views (per-video watch time per session)
CREATE TABLE IF NOT EXISTS student_video_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES student_sessions(id) ON DELETE CASCADE,
  class_code TEXT NOT NULL REFERENCES classes(class_code) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  watched_secs INTEGER NOT NULL DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_video_views ENABLE ROW LEVEL SECURITY;

-- Classes: teachers can only see and manage their own classes
CREATE POLICY "Teachers manage own classes" ON classes
  FOR ALL USING (teacher_id = auth.uid());

-- Student sessions: anyone can insert (students don't log in)
CREATE POLICY "Students can insert sessions" ON student_sessions
  FOR INSERT WITH CHECK (true);

-- Student sessions: teachers can only read sessions for their classes
CREATE POLICY "Teachers read own class sessions" ON student_sessions
  FOR SELECT USING (
    class_code IN (
      SELECT class_code FROM classes WHERE teacher_id = auth.uid()
    )
  );

-- Anyone can read active classes (for class code validation)
CREATE POLICY "Anyone can read active classes" ON classes
  FOR SELECT USING (true);

-- Student video views RLS
CREATE POLICY "Students insert video views" ON student_video_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Teachers read video views" ON student_video_views
  FOR SELECT USING (
    class_code IN (
      SELECT class_code FROM classes WHERE teacher_id = auth.uid()
    )
  );
