/**
 * lib/supabaseClient.ts
 *
 * Single shared Supabase client for ThinkTok. Uses the public anon key,
 * which is safe to expose to the browser (Row Level Security should be
 * enabled on all three tables in Supabase before going to production).
 *
 * Required env vars (add to .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
 */

import {
  StudentSessionRow,
  StudentVideoViewRow,
  VideoRow,
  ActionType,
  QuizQuestionRow,
} from "./types";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[ThinkTok] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
    "Add them to .env.local before hitting the database."
  );
}

export const supabase = createBrowserClient<Database>(
  supabaseUrl ?? "",
  supabaseAnonKey ?? ""
);

// ---------------------------------------------------------------------------
// Thin helper functions used by store/components. Kept here (instead of
// scattering `.from(...)` calls everywhere) so RLS/query shape only needs
// to change in one place.
// ---------------------------------------------------------------------------

import { MOCK_VIDEOS } from "./mockVideos";

/** Fetch the full video feed, ordered for the swipe feed.
 *  Falls back to MOCK_VIDEOS when Supabase is not configured or errors. */
export async function fetchVideoFeed() {
  // No credentials → use local mock data so the prototype works offline.
  if (!supabaseUrl || !supabaseAnonKey) {
    return MOCK_VIDEOS;
  }

  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    // eslint-disable-next-line no-console
    console.warn("[ThinkTok] DB fetch failed, falling back to mock data:", error.message);
    return MOCK_VIDEOS;
  }
  return data ?? MOCK_VIDEOS;
}


/** Create a new game_sessions row when a player starts a run. */
export async function createGameSession(difficulty: "NORMAL" | "HARD") {
  const { data, error } = await supabase
    .from("game_sessions")
    .insert({
      difficulty,
      current_focus_battery: 100,
      current_fact_score: 0,
      is_completed: false,
      check_quota_left: difficulty === "NORMAL" ? -1 : 5,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Append one row to interactions_log (the source of truth for locking). */
export async function logInteraction(
  sessionId: string,
  videoId: string,
  actionType: Database["public"]["Tables"]["interactions_log"]["Row"]["action_type"],
  pointsEarned: number
) {
  const { data, error } = await supabase
    .from("interactions_log")
    .insert({
      session_id: sessionId,
      video_id: videoId,
      action_type: actionType,
      points_earned: pointsEarned,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Persist the latest battery/score/quota snapshot for a session. */
export async function updateGameSession(
  sessionId: string,
  patch: Partial<Database["public"]["Tables"]["game_sessions"]["Row"]>
) {
  const { data, error } = await supabase
    .from("game_sessions")
    .update(patch)
    .eq("session_id", sessionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Validate a class code: checks it exists in `classes` and is currently active.
 * Returns the class row if valid, null if not found or expired.
 */
export async function validateClassCode(code: string) {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("class_code", code.toUpperCase())
    .lte("active_from", now)
    .or(`active_until.is.null,active_until.gte.${now}`)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

/**
 * Phase 1: Insert a placeholder session row as soon as the student starts playing.
 * This makes them visible on the teacher's live dashboard immediately.
 * Returns the new session ID, which must be stored in the game store and used
 * later to UPDATE the row with final stats.
 */
export async function checkStudentNameExists(classCode: string, studentName: string): Promise<boolean> {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  const { data, error } = await supabase
    .from("student_sessions")
    .select("id")
    .eq("class_code", classCode.toUpperCase())
    .ilike("student_name", studentName)
    .limit(1)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

export async function createStudentSessionInitial(payload: {
  student_name: string;
  class_code: string;
  game_mode: string;
}) {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  const newId = crypto.randomUUID();
  const { error } = await supabase
    .from("student_sessions")
    .insert({
      id: newId,
      student_name: payload.student_name,
      class_code: payload.class_code,
      game_mode: payload.game_mode,
      focus_battery_final: 100,
      fact_score_final: 0,
      shares_count: 0,
      shares_correct: 0,
      shares_incorrect: 0,
      likes_count: 0,
      likes_correct: 0,
      likes_incorrect: 0,
      ai_reports_count: 0,
      ai_reports_correct: 0,
      ai_reports_incorrect: 0,
      hoax_reports_count: 0,
      hoax_reports_correct: 0,
      hoax_reports_incorrect: 0,
      total_correct_actions: 0,
      total_incorrect_actions: 0,
      most_watched_video_id: null,
      most_watched_seconds: 0,
      quiz_score: 0,
      quiz_correct_count: 0,
      total_score: 0,
    } as never);
    
  if (error) {
    console.error("[ThinkTok] Failed to create initial session:", error.message);
    return null;
  }
  return { id: newId };
}

/**
 * Phase 2: Update an existing session row with the final stats after the quiz.
 * Called instead of INSERT when a sessionId was stored at game start.
 */
export async function updateStudentSessionFinal(
  sessionId: string,
  payload: {
    focus_battery_final: number;
    fact_score_final: number;
    shares_count: number;
    shares_correct: number;
    shares_incorrect: number;
    likes_count: number;
    likes_correct: number;
    likes_incorrect: number;
    ai_reports_count: number;
    ai_reports_correct: number;
    ai_reports_incorrect: number;
    hoax_reports_count: number;
    hoax_reports_correct: number;
    hoax_reports_incorrect: number;
    total_correct_actions: number;
    total_incorrect_actions: number;
    most_watched_video_id: string | null;
    most_watched_seconds: number;
    quiz_score: number;
    quiz_correct_count: number;
    total_score: number;
  }
) {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  const { error } = await supabase
    .from("student_sessions")
    .update({ ...payload, completed_at: new Date().toISOString() } as never)
    .eq("id", sessionId);

  if (error) {
    console.error("[ThinkTok] Failed to update session:", error.message);
    return null;
  }
  return { id: sessionId };
}

/**
 * @deprecated Use createStudentSessionInitial + updateStudentSessionFinal instead.
 * Kept for backwards compatibility.
 */
export async function saveStudentSession(payload: {
  student_name: string;
  class_code: string;
  game_mode: string;
  focus_battery_final: number;
  fact_score_final: number;
  shares_count: number;
  shares_correct: number;
  shares_incorrect: number;
  likes_count: number;
  likes_correct: number;
  likes_incorrect: number;
  ai_reports_count: number;
  ai_reports_correct: number;
  ai_reports_incorrect: number;
  hoax_reports_count: number;
  hoax_reports_correct: number;
  hoax_reports_incorrect: number;
  total_correct_actions: number;
  total_incorrect_actions: number;
  most_watched_video_id: string | null;
  most_watched_seconds: number;
  quiz_score: number;
  quiz_correct_count: number;
  total_score: number;
}) {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  const newId = crypto.randomUUID();
  const { error } = await supabase
    .from("student_sessions")
    .insert({ id: newId, ...payload } as never);

  if (error) {
    console.error("[ThinkTok] Failed to save student session:", error.message);
    return null;
  }
  return { id: newId };
}



export async function fetchQuizQuestions(): Promise<QuizQuestionRow[]> {
  if (!supabaseUrl || !supabaseAnonKey) return [];
  const { data, error } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("is_active", true)
    .order("id", { ascending: true });

  if (error) {
    console.error("[ThinkTok] fetchQuizQuestions error:", error.message);
    return [];
  }
  return (data as QuizQuestionRow[]) || [];
}

/**
 * Save per-video watch times for a completed session.
 * Called after saveStudentSession returns a session ID.
 */
export async function saveStudentVideoViews(
  sessionId: string,
  classCode: string,
  views: { video_id: string; watched_secs: number; is_liked: boolean; is_shared: boolean; report_type: string | null }[]
) {
  if (!supabaseUrl || !supabaseAnonKey || !views.length) return;
  const rows = views.map((v) => ({
    session_id: sessionId,
    class_code: classCode,
    video_id: v.video_id,
    watched_secs: v.watched_secs,
    is_liked: v.is_liked,
    is_shared: v.is_shared,
    report_type: v.report_type,
  }));
  const { error } = await supabase.from("student_video_views").insert(rows as never);
  if (error) {
    console.error("[ThinkTok] Failed to save video views:", error.message);
  }
}

/**
 * Save per-question correct/incorrect status for a completed quiz.
 */
export async function saveStudentQuizAnswers(
  sessionId: string,
  classCode: string,
  answers: { question_id: number; is_correct: boolean; selected_index: number }[]
) {
  if (!supabaseUrl || !supabaseAnonKey || !answers.length) return;
  const rows = answers.map((a) => ({
    session_id: sessionId,
    class_code: classCode,
    question_id: a.question_id,
    is_correct: a.is_correct,
    selected_index: a.selected_index,
  }));
  const { error } = await supabase.from("student_quiz_answers").insert(rows as never);
  if (error) {
    console.error("[ThinkTok] Failed to save quiz answers:", error.message);
  }
}
