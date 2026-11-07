import type { GamePhase } from "../types";

/** Events that move the client-side phase machine (spec 4.2 / 7.4). */
export type GameEvent =
  | "START"
  | "READY"
  | "FAIL"
  | "INVESTIGATE"
  | "BACK"
  | "REPLAY"
  | "FADE_COMPLETE"
  | "EXPLORATION_EVENT"
  | "CLUE_EVENT"
  | "INTERACTION_COMPLETE"
  | "CLUE_FOUND"
  | "ACKNOWLEDGED"
  | "TIMELINE_END"
  | "RETURN"
  | "OPEN_PUZZLE"
  | "CLOSE_PUZZLE"
  | "SOLVED"
  | "ESCAPED"
  | "RESTART";

const TABLE: Partial<Record<GamePhase, Partial<Record<GameEvent, GamePhase>>>> = {
  TITLE: { START: "INITIALIZING" },
  INITIALIZING: { READY: "EXPLORING", FAIL: "ERROR" },
  ERROR: { START: "INITIALIZING", RESTART: "TITLE" },
  EXPLORING: { INVESTIGATE: "INSPECTING", OPEN_PUZZLE: "PUZZLE", ESCAPED: "ENDING" },
  INSPECTING: { BACK: "EXPLORING", REPLAY: "MEMORY_TRANSITION_IN" },
  MEMORY_TRANSITION_IN: { FADE_COMPLETE: "MEMORY_OBSERVE", BACK: "MEMORY_TRANSITION_OUT" },
  MEMORY_OBSERVE: {
    EXPLORATION_EVENT: "MEMORY_EXPLORE",
    CLUE_EVENT: "MEMORY_CLUE",
    TIMELINE_END: "MEMORY_REVIEW",
    BACK: "MEMORY_TRANSITION_OUT",
  },
  MEMORY_EXPLORE: {
    INTERACTION_COMPLETE: "MEMORY_OBSERVE",
    CLUE_FOUND: "MEMORY_CLUE",
    BACK: "MEMORY_TRANSITION_OUT",
  },
  MEMORY_CLUE: { ACKNOWLEDGED: "MEMORY_OBSERVE" },
  MEMORY_REVIEW: { RETURN: "MEMORY_TRANSITION_OUT", REPLAY: "MEMORY_TRANSITION_IN" },
  MEMORY_TRANSITION_OUT: { FADE_COMPLETE: "EXPLORING" },
  PUZZLE: { CLOSE_PUZZLE: "EXPLORING", SOLVED: "ESCAPE" },
  ESCAPE: { ESCAPED: "ENDING" },
  ENDING: { RESTART: "TITLE" },
};

/**
 * Pure transition function. Returns the next phase, or null when the event
 * is not allowed in the current phase (invalid transitions are rejected,
 * duplicated events are harmless).
 *
 * Note: the spec's MEMORY_CLUE --acknowledged--> MEMORY_REVIEW is relaxed to
 * return to MEMORY_OBSERVE so the remaining timeline can finish; the
 * timeline end then leads to MEMORY_REVIEW as before.
 */
export function transition(phase: GamePhase, event: GameEvent): GamePhase | null {
  return TABLE[phase]?.[event] ?? null;
}

/** Phases in which the pause menu may open (pointer-lock gameplay phases). */
export const PAUSABLE_PHASES: ReadonlySet<GamePhase> = new Set([
  "EXPLORING",
  "MEMORY_OBSERVE",
  "MEMORY_EXPLORE",
  "ESCAPE",
]);

export const MEMORY_PHASES: ReadonlySet<GamePhase> = new Set([
  "MEMORY_TRANSITION_IN",
  "MEMORY_OBSERVE",
  "MEMORY_EXPLORE",
  "MEMORY_CLUE",
  "MEMORY_REVIEW",
  "MEMORY_TRANSITION_OUT",
]);
