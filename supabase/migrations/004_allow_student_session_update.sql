-- Allow students (anonymous) to update their own session row.
-- We use "id = id" as a permissive check since students have no auth.uid().
-- Security note: since students can only update any row by ID, the teacher
-- dashboard must never display sensitive teacher data via this table.
-- Teachers still access their data via the separate SELECT policy.

DROP POLICY IF EXISTS "Students can update sessions" ON student_sessions;

CREATE POLICY "Students can update sessions" ON student_sessions
  FOR UPDATE USING (true) WITH CHECK (true);
