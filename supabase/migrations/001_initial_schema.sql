-- =============================================================================
-- ThinkTok — Initial Schema Migration
-- Run this in the Supabase SQL editor (or via supabase db push).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Enum types (mirror lib/types.ts)
-- ---------------------------------------------------------------------------

CREATE TYPE video_category AS ENUM (
  'Real News',
  'Entertainment Non AI',
  'Entertainment AI',
  'AI Hoax',
  'Hoax'
);

CREATE TYPE game_difficulty AS ENUM (
  'NORMAL',
  'HARD'
);

CREATE TYPE interaction_action_type AS ENUM (
  'LIKE',
  'SHARE',
  'REPORT_REAL',
  'REPORT_ENT',
  'REPORT_HOAX',
  'REPORT_AI',
  'CEK_AI',
  'CEK_FAKTA'
);

-- ---------------------------------------------------------------------------
-- 2. videos — master content table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS videos (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_username  text        NOT NULL,
  video_url        text        NOT NULL DEFAULT '',
  caption          text        NOT NULL,
  category         video_category NOT NULL,
  ai_clue          text        NOT NULL DEFAULT '',
  real_fact        text        NOT NULL DEFAULT '',
  reveal_message   text        NOT NULL DEFAULT '',
  durasi_total     integer     NOT NULL DEFAULT 30,  -- seconds
  initial_likes    integer     NOT NULL DEFAULT 0,
  initial_shares   integer     NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3. game_sessions — one row per player run
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS game_sessions (
  session_id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name            text,
  difficulty             game_difficulty NOT NULL,
  current_focus_battery  integer NOT NULL DEFAULT 100,
  current_fact_score     integer NOT NULL DEFAULT 0,
  is_completed           boolean NOT NULL DEFAULT false,
  -- -1 means unlimited (NORMAL mode), 5 = HARD mode quota
  check_quota_left       integer NOT NULL DEFAULT 5,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at on every write
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER game_sessions_updated_at
BEFORE UPDATE ON game_sessions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 4. interactions_log — append-only action ledger (drives action locking)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS interactions_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid NOT NULL REFERENCES game_sessions(session_id) ON DELETE CASCADE,
  video_id     uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  action_type  interaction_action_type NOT NULL,
  points_earned integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Index to quickly check whether a (session, video) pair is locked
CREATE INDEX IF NOT EXISTS idx_interactions_log_session_video
  ON interactions_log (session_id, video_id);

-- ---------------------------------------------------------------------------
-- 5. Row Level Security
-- ---------------------------------------------------------------------------

-- videos: public read, no client writes (content is managed via Supabase Studio)
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "videos_public_read" ON videos
  FOR SELECT USING (true);

-- game_sessions: anyone can insert their own session and read/update it
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "game_sessions_insert" ON game_sessions
  FOR INSERT WITH CHECK (true);
CREATE POLICY "game_sessions_select" ON game_sessions
  FOR SELECT USING (true);
CREATE POLICY "game_sessions_update" ON game_sessions
  FOR UPDATE USING (true);

-- interactions_log: anyone can insert and read logs
ALTER TABLE interactions_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "interactions_log_insert" ON interactions_log
  FOR INSERT WITH CHECK (true);
CREATE POLICY "interactions_log_select" ON interactions_log
  FOR SELECT USING (true);
