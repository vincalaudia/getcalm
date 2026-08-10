/**
 * lib/types.ts
 *
 * Shared TypeScript types for ThinkTok, generated from the Supabase schema
 * defined in Section 6 of the architecture spec. These types are used by
 * the Zustand store, the Supabase client helpers, and all /components/play
 * components.
 */

// ---------------------------------------------------------------------------
// Enums (mirror Postgres enum types 1:1)
// ---------------------------------------------------------------------------

/** Ground-truth content category for a video. Drives battery + score rules. */
export type VideoCategory =
  | "Real News"
  | "Entertainment Non AI"
  | "Entertainment AI"
  | "AI Hoax"
  | "Hoax";

/** Gameplay difficulty selected on the welcome screen. */
export type GameMode = "NORMAL" | "HARD";

/**
 * Every possible logged interaction. Maps 1:1 to interactions_log.action_type.
 * REPORT_REAL and REPORT_ENT have been intentionally removed — kids only
 * report content that is genuinely problematic (Hoax or AI Hoax).
 */
export type ActionType =
  | "LIKE"
  | "SHARE"
  | "REPORT_HOAX"
  | "REPORT_AI"
  | "CEK_AI"
  | "CEK_FAKTA";

/** The two sub-options inside the "CEK" bottom sheet (Section 3.B). */
export type CekOption = "CEK_AI" | "CEK_FAKTA";

/**
 * The two reportable choices inside the "LAPORKAN" bottom sheet.
 * Real News and Entertainment are not reportable — only dangerous content is.
 */
export type ReportOption = "REPORT_HOAX" | "REPORT_AI";

// ---------------------------------------------------------------------------
// Supabase table row types
// ---------------------------------------------------------------------------

export interface QuizQuestionRow {
  id: number;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  is_active: boolean;
}

/** Row shape for `videos` (master content table). */
export type VideoRow = {
  id: string; // uuid
  author_username: string;
  video_url: string;
  caption: string;
  category: VideoCategory;
  ai_clue: string;
  /** Optional 3:4 portrait image shown in the CEK "Deteksi Jejak AI" explanation panel. */
  ai_clue_image_url: string | null;
  real_fact: string;
  /** Optional 3:4 portrait image shown in the CEK "Intip Fakta Aslinya" explanation panel. */
  real_fact_image_url: string | null;
  reveal_message: string;
  durasi_total: number; // seconds
  initial_likes: number;
  initial_shares: number;
};

/** Row shape for `game_sessions` (one row per player session). */
export type GameSessionRow = {
  session_id: string; // uuid
  player_name: string | null;
  difficulty: GameMode;
  current_focus_battery: number; // default 100
  current_fact_score: number; // default 0
  is_completed: boolean; // default false
  /** -1 is used to represent "unlimited" (NORMAL mode). */
  check_quota_left: number; // default 5
};

/** Row shape for `interactions_log` (append-only interaction/action log). */
export type InteractionLogRow = {
  id: string; // uuid
  session_id: string; // uuid, FK -> game_sessions.session_id
  video_id: string; // uuid, FK -> videos.id
  action_type: ActionType;
  points_earned: number;
};

/**
 * Supabase generated-style `Database` type, structured the way the
 * official `supabase gen types typescript` CLI output looks. Swap this
 * for the CLI-generated file once the project is linked to a live
 * Supabase project; the shape below is hand-written to match Section 6
 * exactly so the app can be built against it immediately.
 *
 * NOTE: every type in this Table graph (Row/Insert/Update, and Database
 * itself) is deliberately a `type` alias rather than an `interface`.
 * supabase-js's generic overload resolution for `.insert()` / `.update()`
 * silently collapses to `never` when these are declared as `interface`s
 * instead of `type`s — verified empirically against supabase-js 2.111.
 * Keep this as `type` if you regenerate or extend this file by hand.
 */
/** Row shape for `classes` (teacher-created class codes). */
export type ClassRow = {
  id: string;
  class_code: string;      // e.g. "KELAS2A" — uppercase letters/numbers only
  class_name: string;
  teacher_id: string;      // uuid → auth.users.id
  active_from: string;     // ISO timestamp
  active_until: string | null; // null = no expiry
  created_at: string;
};

/** Row shape for `student_sessions` (one row per completed student session). */
export type StudentSessionRow = {
  id: string;
  student_name: string;
  class_code: string;
  game_mode: GameMode;
  focus_battery_final: number;
  fact_score_final: number;
  likes_count: number;
  likes_correct: number;
  likes_incorrect: number;
  shares_count: number;
  shares_correct: number;
  shares_incorrect: number;
  ai_reports_count: number;
  ai_reports_correct: number;
  ai_reports_incorrect: number;
  hoax_reports_count: number;
  hoax_reports_correct: number;
  hoax_reports_incorrect: number;
  total_correct_actions: number;
  total_incorrect_actions: number;
  true_positives: number;
  false_positives: number;
  true_negatives: number;
  false_negatives: number;
  most_watched_video_id: string | null;
  most_watched_seconds: number;
  quiz_score: number;
  total_score: number;
  completed_at: string;
  quiz_correct_count: number;
};

/** Row shape for `student_video_views` (per-video watch time per session). */
export type StudentVideoViewRow = {
  id: string;
  session_id: string;    // FK → student_sessions.id
  video_id: string;
  class_code: string;
  watched_secs: number;
  is_liked: boolean;
  is_shared: boolean;
  report_type: ReportOption | null;
};

/** Row shape for `student_quiz_answers` (per-question correctness). */
export type StudentQuizAnswerRow = {
  id: string;
  session_id: string;    // FK → student_sessions.id
  class_code: string;
  question_id: number;
  is_correct: boolean;
  selected_index: number | null;
};

export type Database = {
  public: {
    Tables: {
      videos: {
        Row: VideoRow;
        Insert: Partial<VideoRow> & Pick<VideoRow, "author_username" | "video_url" | "category">;
        Update: Partial<VideoRow>;
        Relationships: [];
      };
      game_sessions: {
        Row: GameSessionRow;
        Insert: Partial<GameSessionRow> & Pick<GameSessionRow, "difficulty">;
        Update: Partial<GameSessionRow>;
        Relationships: [];
      };
      interactions_log: {
        Row: InteractionLogRow;
        Insert: Partial<InteractionLogRow> &
        Pick<InteractionLogRow, "session_id" | "video_id" | "action_type" | "points_earned">;
        Update: Partial<InteractionLogRow>;
        Relationships: [];
      };
      classes: {
        Row: ClassRow;
        Insert: Omit<ClassRow, "id" | "created_at">;
        Update: Partial<Omit<ClassRow, "id" | "teacher_id">>;
        Relationships: [];
      };
      student_sessions: {
        Row: StudentSessionRow;
        Insert: Omit<StudentSessionRow, "id" | "completed_at">;
        Update: Partial<StudentSessionRow>;
        Relationships: [];
      };
      student_video_views: {
        Row: StudentVideoViewRow;
        Insert: Omit<StudentVideoViewRow, "id">;
        Update: Partial<StudentVideoViewRow>;
        Relationships: [];
      };
      student_quiz_answers: {
        Row: StudentQuizAnswerRow;
        Insert: Omit<StudentQuizAnswerRow, "id">;
        Update: Partial<StudentQuizAnswerRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// ---------------------------------------------------------------------------
// Client-side / gameplay-only types (not persisted 1:1 in Supabase)
// ---------------------------------------------------------------------------

/**
 * Per-video interaction state, keyed by videoId in the store.
 * Each button has its own independent lock — clicking LIKE only disables LIKE,
 * clicking SHARE only disables SHARE, and submitting LAPORKAN only disables
 * LAPORKAN. CEK is gated by quota (HARD) but never permanently disabled.
 */
export interface VideoInteractionState {
  hasChecked: boolean;           // true once user engaged with >= 1 CEK option
  likedAt: boolean;              // true once LIKE was clicked (button disabled)
  sharedAt: boolean;             // true once SHARE was clicked (button disabled)
  reportAction: ReportOption | null; // set when a LAPORKAN choice is submitted
}

/** Payload passed to the RevealOverlay component when a reveal is triggered. */
export interface RevealPayload {
  videoId: string;
  title: string;
  message: string; // sourced from videos.reveal_message
  tone: "correct" | "error"; // drives copy + color per Section 5
}
