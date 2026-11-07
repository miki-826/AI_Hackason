/**
 * HTTP contract between the browser and /api/v1 (spec 9).
 * Shared by route handlers (server) and the client gateway. No secrets here.
 */
import { z } from "zod";
import type { EndingContent, MemoryStory, PublicClue, PublicSession } from "@/game-core/types";

export const API_BASE = "/api/v1";
export const SESSION_COOKIE = "ts_session";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "VERSION_MISMATCH"
  | "CLUES_MISSING"
  | "ALREADY_SOLVED"
  | "NOT_SOLVED"
  | "INTERNAL";

/** Error body for every non-2xx response. */
export type ApiErrorBody = {
  error: { code: ApiErrorCode; message: string; requestId: string };
  retryable: boolean;
};

// ---- request bodies ------------------------------------------------------

export const createSessionBody = z.object({ chapterId: z.string().max(64).optional() }).strict();

export const completeMemoryBody = z
  .object({
    observedEventIds: z.array(z.string().max(64)).max(16),
    foundClueIds: z.array(z.string().max(64)).max(4),
  })
  .strict();

export const decodeClueBody = z.object({ relatedClueIds: z.array(z.string().max(64)).max(8) }).strict();

export const solveSealBody = z
  .object({
    answer: z.string().max(16),
    revision: z.number().int().nonnegative(),
  })
  .strict();

const finite = z.number().finite();
export const checkpointBody = z
  .object({
    position: z.tuple([finite, finite, finite]),
    yaw: finite,
    phase: z.string().max(32).optional(),
    revision: z.number().int().nonnegative().optional(),
  })
  .strict();

export const endingBody = z.object({ revision: z.number().int().nonnegative() }).strict();

// ---- response bodies -----------------------------------------------------

/** POST /sessions (201), GET /sessions/current, GET /sessions/:id */
export type SessionResponse = { session: PublicSession };

/** GET /sessions/:id/furniture/:furnitureId */
export type FurnitureDetailResponse = {
  furnitureId: string;
  name: string;
  description: string;
  examineText: string;
  memoryStatus: "none" | "ready";
  visited: boolean;
};

/** POST /sessions/:id/memories/:furnitureId/generate and GET /memories/:furnitureId */
export type MemoryResponse = {
  status: "ready";
  source: "ai" | "fallback";
  memory: MemoryStory;
};

/** POST /memories/:furnitureId/complete */
export type CompleteMemoryResponse = { session: PublicSession; newClueIds: string[] };

/** GET /sessions/:id/clues */
export type CluesResponse = { clues: PublicClue[] };

/** POST /clues/:clueId/decode */
export type DecodeClueResponse = { decoded: boolean; session: PublicSession };

/** POST /puzzles/seal/solve */
export type SolveSealResponse = {
  correct: boolean;
  unlocked: boolean;
  revision: number;
  session: PublicSession;
};

/** PATCH /checkpoint */
export type CheckpointResponse = { savedAt: string; revision: number };

/** POST /ending */
export type EndingResponse = {
  endingId: EndingContent["endingId"];
  completedAt: string;
  ending: EndingContent;
  session: PublicSession;
};

/** GET /api/health */
export type HealthResponse = {
  status: "ok";
  version: string;
  ai: "enabled" | "disabled";
  /** server-side neural TTS (OpenAI) availability; browser speech is used otherwise */
  tts: "enabled" | "disabled";
  time: string;
};

/** POST /sessions/:id/tts — body; response is audio/mpeg bytes */
export const ttsBody = z.object({ text: z.string().min(1).max(240) }).strict();
