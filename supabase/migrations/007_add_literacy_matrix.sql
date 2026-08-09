-- =============================================================================
-- ThinkTok — Add Literacy Matrix Columns (007)
-- =============================================================================

ALTER TABLE student_sessions
ADD COLUMN IF NOT EXISTS true_positives INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS false_positives INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS true_negatives INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS false_negatives INTEGER NOT NULL DEFAULT 0;
