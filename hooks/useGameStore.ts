/**
 * hooks/useGameStore.ts
 *
 * Global Zustand store for ThinkTok gameplay.
 *
 * Per-button locking model (v3):
 *   - LIKE disables only the LIKE button after clicking.
 *   - SHARE disables only the SHARE button after clicking.
 *   - LAPORKAN (REPORT_HOAX / REPORT_AI) disables only LAPORKAN after submitting.
 *   - CEK is gated by quota (HARD mode) but never permanently locked.
 *
 * Timer is stopped when the LAPORKAN classification is submitted (the
 * definitive "verdict" on a video). LIKE/SHARE alone do not stop the timer.
 *
 * Bug fixes retained from v2:
 *   1. Battery race condition: viewHistory written in startVideoTimer AFTER the
 *      rewatch-check, so first visits always start the timer.
 *   2. CEK quota atomic: single set() callback prevents double-consume.
 *   3. Strict Mode safe: all guards inside set() callbacks.
 */

import { create } from "zustand";
import type { ActionType, GameMode, VideoCategory, VideoInteractionState } from "@/lib/types";
import type { ReportOption } from "@/lib/types";

// ---------------------------------------------------------------------------
// Module-level (non-reactive) timer bookkeeping
// ---------------------------------------------------------------------------

const activeIntervals = new Map<string, ReturnType<typeof setInterval>>();
const watchedSeconds = new Map<string, number>();
const deductedThresholds = new Map<string, Set<number>>();

export function getWatchedSecondsMap() {
  return watchedSeconds;
}

// ---------------------------------------------------------------------------
// Scoring matrix (Section 4)
// ---------------------------------------------------------------------------

export function calculatePoints(category: VideoCategory, action: ActionType): number {
  switch (category) {
    case "Real News":
      if (action === "SHARE") return 20;
      if (action === "LIKE") return 10;
      if (action === "REPORT_AI" || action === "REPORT_HOAX") return -10;
      return 0;

    case "Entertainment Non AI":
      if (action === "REPORT_AI") return -10;
      return 0;

    case "Entertainment AI":
      if (action === "REPORT_AI") return 20;
      return 0;

    case "AI Hoax":
      if (action === "REPORT_AI") return 20;
      if (action === "REPORT_HOAX") return 20;
      if (action === "LIKE") return -5;
      if (action === "SHARE") return -10;
      return 0;

    case "Hoax":
      if (action === "REPORT_HOAX") return 20;
      if (action === "LIKE") return -5;
      if (action === "SHARE") return -10;
      return 0;

    default:
      return 0;
  }
}

/** Whether an interaction should trigger the Reveal overlay (Section 5). */
export function shouldTriggerReveal(category: VideoCategory, action: ActionType): boolean {
  const isFakeCategory = category === "AI Hoax" || category === "Hoax";
  if (!isFakeCategory) return false;
  const isFatalMistake = action === "LIKE" || action === "SHARE";
  const isCorrectReport =
    (category === "AI Hoax" && action === "REPORT_AI") ||
    (category === "AI Hoax" && action === "REPORT_HOAX") ||
    (category === "Hoax" && action === "REPORT_HOAX");
  return isFatalMistake || isCorrectReport;
}

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

interface RevealState {
  isOpen: boolean;
  videoId: string | null;
  tone: "correct" | "error";
}

const DEFAULT_VIDEO_STATE: VideoInteractionState = {
  hasChecked: false,
  likedAt: false,
  sharedAt: false,
  reportAction: null,
};

interface GameState {
  gameMode: GameMode;
  currentVideoId: string | null;
  viewHistory: Set<string>;
  currentFocusBattery: number;
  currentFactScore: number;
  checkQuotaLeft: number;
  videoStates: Record<string, VideoInteractionState>;
  reveal: RevealState;
  isSessionEnded: boolean;
  studentName: string | null;
  classCode: string | null;
  sessionId: string | null;

  setGameMode: (mode: GameMode) => void;
  setCurrentVideoId: (videoId: string) => void;
  setStudentName: (name: string | null) => void;
  setClassCode: (code: string | null) => void;
  setSessionId: (id: string | null) => void;
  startVideoTimer: (videoId: string, category: VideoCategory, durasiTotal: number) => void;
  stopVideoTimer: (videoId: string) => void;
  deductFocusTimer: (videoId: string, category: VideoCategory, durasiTotal: number, elapsedSeconds: number) => void;
  handleCekInteraction: (videoId: string) => void;
  handleInteraction: (videoId: string, category: VideoCategory, action: ActionType) => void;
  closeReveal: () => void;
  endSession: () => void;
  resetSession: () => void;
}

// ---------------------------------------------------------------------------
// Centralized Stats Calculation
// ---------------------------------------------------------------------------
export function calculateStats(videoStates: Record<string, VideoInteractionState>, videos: any[]) {
  let shares_count = 0, shares_correct = 0, shares_incorrect = 0;
  let ai_reports_count = 0, ai_reports_correct = 0, ai_reports_incorrect = 0;
  let hoax_reports_count = 0, hoax_reports_correct = 0, hoax_reports_incorrect = 0;
  let likes_count = 0, likes_correct = 0, likes_incorrect = 0;
  let total_correct_actions = 0, total_incorrect_actions = 0;

  (videos || []).forEach(v => {
    const state = videoStates[v.id];
    if (!state) return;

    if (state.likedAt) {
      likes_count++;
      const pts = calculatePoints(v.category, "LIKE");
      if (pts > 0) { likes_correct++; total_correct_actions++; }
      if (pts < 0) { likes_incorrect++; total_incorrect_actions++; }
    }

    if (state.sharedAt) {
      shares_count++;
      const pts = calculatePoints(v.category, "SHARE");
      if (pts > 0) { shares_correct++; total_correct_actions++; }
      if (pts < 0) { shares_incorrect++; total_incorrect_actions++; }
    }

    if (state.reportAction === "REPORT_AI") {
      ai_reports_count++;
      const pts = calculatePoints(v.category, "REPORT_AI");
      if (pts > 0) { ai_reports_correct++; total_correct_actions++; }
      if (pts < 0) { ai_reports_incorrect++; total_incorrect_actions++; }
    }

    if (state.reportAction === "REPORT_HOAX") {
      hoax_reports_count++;
      const pts = calculatePoints(v.category, "REPORT_HOAX");
      if (pts > 0) { hoax_reports_correct++; total_correct_actions++; }
      if (pts < 0) { hoax_reports_incorrect++; total_incorrect_actions++; }
    }
  });

  const true_positives = hoax_reports_correct + ai_reports_correct;
  const true_negatives = likes_correct + shares_correct;
  const false_positives = hoax_reports_incorrect + ai_reports_incorrect;
  const false_negatives = likes_incorrect + shares_incorrect;

  return {
    shares_count, shares_correct, shares_incorrect,
    ai_reports_count, ai_reports_correct, ai_reports_incorrect,
    hoax_reports_count, hoax_reports_correct, hoax_reports_incorrect,
    likes_count, likes_correct, likes_incorrect,
    total_correct_actions, total_incorrect_actions,
    true_positives, false_positives, true_negatives, false_negatives
  };
}

// ---------------------------------------------------------------------------
// Store implementation
// ---------------------------------------------------------------------------

export const useGameStore = create<GameState>((set, get) => ({
  gameMode: "NORMAL",
  currentVideoId: null,
  viewHistory: new Set<string>(),
  currentFocusBattery: 100,
  currentFactScore: 0,
  checkQuotaLeft: -1,
  videoStates: {},
  reveal: { isOpen: false, videoId: null, tone: "correct" },
  isSessionEnded: false,
  studentName: null,
  classCode: null,
  sessionId: null,

  setGameMode: (mode) =>
    set({ gameMode: mode, checkQuotaLeft: mode === "HARD" ? 5 : -1 }),

  setStudentName: (name) => set({ studentName: name }),
  setClassCode: (code) => set({ classCode: code }),
  setSessionId: (id) => set({ sessionId: id }),

  // Does NOT touch viewHistory — that is handled inside startVideoTimer
  // so the rewatch-check can run before we mark the video as seen.
  setCurrentVideoId: (videoId) => set({ currentVideoId: videoId }),

  // -----------------------------------------------------------------
  startVideoTimer: (videoId, category, durasiTotal) => {
    const { gameMode, viewHistory } = get();

    // Check BEFORE adding: first visit → false → timer starts.
    // Scroll-back in NORMAL → true → return early (battery safe).
    const isRewatchInNORMALMode = gameMode === "NORMAL" && viewHistory.has(videoId);

    // Mark visited AFTER the check.
    set((state) => {
      const next = new Set(state.viewHistory);
      next.add(videoId);
      return { viewHistory: next };
    });

    if (isRewatchInNORMALMode) return;

    if (gameMode === "HARD") {
      watchedSeconds.set(videoId, 0);
      deductedThresholds.set(videoId, new Set());
    } else {
      if (!watchedSeconds.has(videoId)) watchedSeconds.set(videoId, 0);
      if (!deductedThresholds.has(videoId)) deductedThresholds.set(videoId, new Set());
    }

    get().stopVideoTimer(videoId);

    const intervalId = setInterval(() => {
      const elapsed = (watchedSeconds.get(videoId) ?? 0) + 1;
      watchedSeconds.set(videoId, elapsed);
      get().deductFocusTimer(videoId, category, durasiTotal, elapsed);
    }, 1000);

    activeIntervals.set(videoId, intervalId);
  },

  stopVideoTimer: (videoId) => {
    const existing = activeIntervals.get(videoId);
    if (existing) {
      clearInterval(existing);
      activeIntervals.delete(videoId);
    }
  },

  // -----------------------------------------------------------------
  deductFocusTimer: (videoId, category, durasiTotal, elapsedSeconds) => {
    const already = deductedThresholds.get(videoId) ?? new Set<number>();
    const isSetA = category === "Real News" || category === "AI Hoax" || category === "Hoax";
    const isSetB = category === "Entertainment Non AI" || category === "Entertainment AI";

    let deduction = 0;
    const newlyHit: number[] = [];

    if (isSetA) {
      // Set A: News/Hoax/AI Hoax. -3 every 10 seconds, up to 30s.
      if (elapsedSeconds >= 10 && !already.has(10)) { deduction += 3; newlyHit.push(10); }
      if (elapsedSeconds >= 20 && !already.has(20)) { deduction += 3; newlyHit.push(20); }
      if (elapsedSeconds >= 30 && !already.has(30)) { deduction += 3; newlyHit.push(30); }
    } else if (isSetB) {
      // Set B: Entertainment. -5 every 8 seconds (8, 16, 24, 32, 40, etc.)
      for (let t = 8; t <= elapsedSeconds; t += 8) {
        if (!already.has(t)) {
          deduction += 5;
          newlyHit.push(t);
        }
      }
      if (elapsedSeconds >= durasiTotal && !already.has(-1)) { deduction += 5; newlyHit.push(-1); }
    }

    if (deduction === 0) return;

    newlyHit.forEach((t) => already.add(t));
    deductedThresholds.set(videoId, already);

    set((state) => {
      const nextBattery = Math.max(0, state.currentFocusBattery - deduction);
      if (nextBattery === 0) {
        get().stopVideoTimer(videoId);
        return { currentFocusBattery: 0, isSessionEnded: true };
      }
      return { currentFocusBattery: nextBattery };
    });
  },

  // -----------------------------------------------------------------
  // Single atomic set() to prevent double-quota on multiple CEK clicks.
  handleCekInteraction: (videoId) => {
    set((state) => {
      const prev = state.videoStates[videoId] ?? { ...DEFAULT_VIDEO_STATE };

      // Already checked — no-op (prevents double-quota charge when user
      // clicks both CEK options in one sheet session).
      if (prev.hasChecked) return {};

      let nextQuota = state.checkQuotaLeft;
      if (state.gameMode === "HARD") {
        if (nextQuota <= 0) return {};
        nextQuota -= 1;
      }

      return {
        checkQuotaLeft: nextQuota,
        videoStates: {
          ...state.videoStates,
          [videoId]: { ...prev, hasChecked: true },
        },
      };
    });
  },

  // -----------------------------------------------------------------
  /**
   * Per-button locking:
   *   LIKE    → sets likedAt = true   (only LIKE button disabled)
   *   SHARE   → sets sharedAt = true  (only SHARE button disabled)
   *   REPORT  → sets reportAction     (LAPORKAN disabled) + stops timer
   *
   * Points are awarded for each action independently.
   * Reveal overlay fires for dangerous content (LIKE/SHARE on Hoax/AI Fake,
   * or correctly identifying them via REPORT).
   */
  handleInteraction: (videoId, category, action) => {
    const isReport = action === "REPORT_HOAX" || action === "REPORT_AI";

    set((state) => {
      const prev = state.videoStates[videoId] ?? { ...DEFAULT_VIDEO_STATE };

      // Per-button idempotency guards (inside set() for Strict Mode safety)
      if (action === "LIKE" && prev.likedAt) return {};
      if (action === "SHARE" && prev.sharedAt) return {};
      if (isReport && prev.reportAction !== null) return {};

      const points = calculatePoints(category, action);
      const triggerReveal = shouldTriggerReveal(category, action);

      const next: VideoInteractionState = { ...prev };
      if (action === "LIKE") next.likedAt = true;
      if (action === "SHARE") next.sharedAt = true;
      if (isReport) next.reportAction = action as ReportOption;

      return {
        currentFactScore: state.currentFactScore + points,
        videoStates: { ...state.videoStates, [videoId]: next },
        reveal: triggerReveal
          ? {
            isOpen: true,
            videoId,
            tone: action === "REPORT_AI" || action === "REPORT_HOAX" ? "correct" : "error",
          }
          : state.reveal,
      };
    });

    // Stop the battery timer only when the player submits their verdict (REPORT).
    // LIKE / SHARE don't end the timer — the video keeps draining battery.
    if (isReport) get().stopVideoTimer(videoId);
  },

  closeReveal: () => set({ reveal: { isOpen: false, videoId: null, tone: "correct" } }),

  endSession: () => {
    activeIntervals.forEach((id) => clearInterval(id));
    activeIntervals.clear();
    set({ isSessionEnded: true });
  },

  resetSession: () => {
    activeIntervals.forEach((id) => clearInterval(id));
    activeIntervals.clear();
    watchedSeconds.clear();
    deductedThresholds.clear();
    set((state) => ({
      currentVideoId: null,
      viewHistory: new Set<string>(),
      currentFocusBattery: 100,
      currentFactScore: 0,
      checkQuotaLeft: state.gameMode === "HARD" ? 5 : -1,
      videoStates: {},
      reveal: { isOpen: false, videoId: null, tone: "correct" },
      isSessionEnded: false,
      sessionId: null,
    }));
  },
}));
