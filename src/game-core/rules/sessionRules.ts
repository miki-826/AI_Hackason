/**
 * Authoritative session rules (spec 6.2 / 7.3 / 9.2).
 *
 * Pure functions over a compact SessionRecord. The server persists the record
 * (signed cookie) and calls these functions; the optional offline demo
 * gateway reuses them in the browser. Contains spoilers — see content/README.
 */
import { CLUE_BY_ID } from "../content/clues";
import { buildEnding, endingIdFor } from "../content/endings";
import { MAX_SEAL_ATTEMPTS, STORY_BIBLE } from "../content/storyBible";
import { ROOM } from "../definitions/room";
import { generateGamePlan, type GamePlan } from "../generation/generateGamePlan";
import { checkSeal } from "../puzzle/validateAnswer";
import type { Checkpoint, EndingContent, EndingId, PublicClue, PublicSession, Vec3 } from "../types";

export type FoundClue = { clueId: string; at: string; sourceEventId: string | null };

export type SessionRecord = {
  v: 1;
  id: string;
  seed: string;
  chapterId: string;
  storyVersion: string;
  puzzleVersion: string;
  placementVersion: string;
  createdAt: string;
  updatedAt: string;
  revision: number;
  found: FoundClue[];
  decoded: string[];
  visited: string[];
  attemptsUsed: number;
  solvedAt: string | null;
  completedAt: string | null;
  endingId: EndingId | null;
  checkpoint: Checkpoint | null;
  aiGenerations: number;
};

export type RuleError =
  | "FURNITURE_NOT_FOUND"
  | "CLUE_NOT_ALLOWED"
  | "CLUE_NOT_FOUND"
  | "REVISION_CONFLICT"
  | "INVALID_FORMAT"
  | "CLUES_MISSING"
  | "ALREADY_SOLVED"
  | "NO_ATTEMPTS_LEFT"
  | "NOT_SOLVED"
  | "VERSION_MISMATCH";

export type RuleResult<T> = ({ ok: true } & T) | { ok: false; error: RuleError };

export function createSessionRecord(params: { id: string; seed: string; now: string }): SessionRecord {
  return {
    v: 1,
    id: params.id,
    seed: params.seed,
    chapterId: STORY_BIBLE.chapterId,
    storyVersion: STORY_BIBLE.version,
    puzzleVersion: STORY_BIBLE.puzzleVersion,
    placementVersion: STORY_BIBLE.placementVersion,
    createdAt: params.now,
    updatedAt: params.now,
    revision: 1,
    found: [],
    decoded: [],
    visited: [],
    attemptsUsed: 0,
    solvedAt: null,
    completedAt: null,
    endingId: null,
    checkpoint: null,
    aiGenerations: 0,
  };
}

/** Rebuild the immutable plan for a record. Rejects records from incompatible versions. */
export function planForRecord(record: SessionRecord): RuleResult<{ plan: GamePlan }> {
  if (
    record.storyVersion !== STORY_BIBLE.version ||
    record.puzzleVersion !== STORY_BIBLE.puzzleVersion ||
    record.placementVersion !== STORY_BIBLE.placementVersion
  ) {
    return { ok: false, error: "VERSION_MISMATCH" };
  }
  return { ok: true, plan: generateGamePlan(record.seed) };
}

const foundIds = (r: SessionRecord) => r.found.map((f) => f.clueId);

function bump(record: SessionRecord, now: string, patch: Partial<SessionRecord>): SessionRecord {
  return { ...record, ...patch, revision: record.revision + 1, updatedAt: now };
}

/**
 * Record a finished memory. Only the clue that the plan assigns to this
 * furniture may be granted; anything else is rejected. Re-sending is a no-op.
 */
export function completeMemory(
  record: SessionRecord,
  plan: GamePlan,
  params: { furnitureId: string; observedEventIds: string[]; foundClueIds: string[]; now: string },
): RuleResult<{ record: SessionRecord; newClueIds: string[] }> {
  const furniture = plan.furniture.find((f) => f.id === params.furnitureId);
  if (!furniture) return { ok: false, error: "FURNITURE_NOT_FOUND" };
  const allowedClue = Object.entries(plan.clueSources).find(([, fid]) => fid === furniture.id)?.[0] ?? null;
  for (const id of params.foundClueIds) {
    if (id !== allowedClue) return { ok: false, error: "CLUE_NOT_ALLOWED" };
  }
  const already = new Set(foundIds(record));
  const newClueIds = allowedClue && params.foundClueIds.includes(allowedClue) && !already.has(allowedClue) ? [allowedClue] : [];
  const visitedChanged = !record.visited.includes(furniture.id);
  if (newClueIds.length === 0 && !visitedChanged) return { ok: true, record, newClueIds };
  const sourceEventId = params.observedEventIds.find((e) => /^[a-z0-9-]{1,64}$/i.test(e)) ?? null;
  return {
    ok: true,
    newClueIds,
    record: bump(record, params.now, {
      visited: visitedChanged ? [...record.visited, furniture.id] : record.visited,
      found: [...record.found, ...newClueIds.map((clueId) => ({ clueId, at: params.now, sourceEventId }))],
    }),
  };
}

/**
 * Decode (link) a found clue. Succeeds when the clue was found and the
 * submitted related ids cover every clue it depends on (all of which must be
 * found). A wrong link returns decoded=false without changing state.
 */
export function decodeClue(
  record: SessionRecord,
  params: { clueId: string; relatedClueIds: string[]; now: string },
): RuleResult<{ record: SessionRecord; decoded: boolean }> {
  const def = CLUE_BY_ID.get(params.clueId);
  const have = new Set(foundIds(record));
  if (!def || !have.has(def.id)) return { ok: false, error: "CLUE_NOT_FOUND" };
  if (record.decoded.includes(def.id)) return { ok: true, record, decoded: true };
  const submitted = new Set(params.relatedClueIds);
  const correct = def.relatedClueIds.every((id) => have.has(id) && submitted.has(id));
  if (!correct) return { ok: true, record, decoded: false };
  return { ok: true, decoded: true, record: bump(record, params.now, { decoded: [...record.decoded, def.id] }) };
}

export function solveSeal(
  record: SessionRecord,
  plan: GamePlan,
  params: { answer: unknown; revision: number; now: string },
): RuleResult<{ record: SessionRecord; correct: boolean; attemptsLeft: number }> {
  if (params.revision !== record.revision) return { ok: false, error: "REVISION_CONFLICT" };
  const attemptsLeft = MAX_SEAL_ATTEMPTS - record.attemptsUsed;
  const check = checkSeal({
    input: params.answer,
    expectedAnswer: STORY_BIBLE.answer,
    requiredClueIds: plan.requiredClueIds,
    collectedClueIds: foundIds(record),
    solved: record.solvedAt !== null,
    attemptsLeft,
  });
  if (!check.ok) return { ok: false, error: check.reason };
  if (check.correct) {
    return { ok: true, correct: true, attemptsLeft, record: bump(record, params.now, { solvedAt: params.now }) };
  }
  const next = bump(record, params.now, { attemptsUsed: record.attemptsUsed + 1 });
  return { ok: true, correct: false, attemptsLeft: attemptsLeft - 1, record: next };
}

function clampToRoom(p: Vec3): Vec3 {
  const m = 0.35;
  const x = Math.min(ROOM.maxX - m, Math.max(ROOM.minX + m, p[0]));
  const z = Math.min(ROOM.maxZ - m, Math.max(ROOM.minZ + m, p[2]));
  return [x, 1.65, z];
}

/** Position saves never bump the revision, so they can't conflict with progress writes. */
export function saveCheckpoint(record: SessionRecord, params: { checkpoint: Checkpoint; now: string }): SessionRecord {
  const yaw = Number.isFinite(params.checkpoint.yaw) ? params.checkpoint.yaw : 0;
  return { ...record, checkpoint: { position: clampToRoom(params.checkpoint.position), yaw }, updatedAt: params.now };
}

export function finishEnding(
  record: SessionRecord,
  plan: GamePlan,
  params: { revision: number; now: string },
): RuleResult<{ record: SessionRecord; ending: EndingContent }> {
  if (!record.solvedAt) return { ok: false, error: "NOT_SOLVED" };
  const have = new Set(foundIds(record));
  const extra = plan.optionalClueIds.filter((id) => have.has(id)).length;
  if (record.endingId && record.completedAt) {
    return { ok: true, record, ending: buildEnding(record.endingId, extra) };
  }
  if (params.revision !== record.revision) return { ok: false, error: "REVISION_CONFLICT" };
  const endingId = endingIdFor(extra, plan.optionalClueIds.length);
  return {
    ok: true,
    ending: buildEnding(endingId, extra),
    record: bump(record, params.now, { endingId, completedAt: params.now }),
  };
}

export function toPublicSession(record: SessionRecord, plan: GamePlan): PublicSession {
  const have = new Set(foundIds(record));
  const decoded = new Set(record.decoded);
  const clues: PublicClue[] = record.found.flatMap((f, i) => {
    const def = CLUE_BY_ID.get(f.clueId);
    if (!def) return [];
    const isDecoded = decoded.has(def.id);
    return [
      {
        id: def.id,
        furnitureId: plan.clueSources[def.id] ?? "",
        furnitureType: def.furnitureType,
        required: def.required,
        title: def.title,
        content: def.content,
        order: i + 1,
        foundAt: f.at,
        decoded: isDecoded,
        decodedContent: isDecoded ? def.decodedContent : null,
        relatedClueIds: def.relatedClueIds.filter((id) => have.has(id)),
        decodable: def.relatedClueIds.every((id) => have.has(id)),
      },
    ];
  });
  const requiredCollected = plan.requiredClueIds.filter((id) => have.has(id)).length;
  const optionalCollected = plan.optionalClueIds.filter((id) => have.has(id)).length;
  return {
    sessionId: record.id,
    seed: record.seed,
    chapterId: record.chapterId,
    storyVersion: record.storyVersion,
    puzzleVersion: record.puzzleVersion,
    cast: plan.cast,
    furniture: plan.furniture,
    progress: {
      collectedClueIds: [...have],
      decodedClueIds: [...record.decoded],
      visitedFurnitureIds: [...record.visited],
      requiredClueCount: plan.requiredClueIds.length,
      requiredCollectedCount: requiredCollected,
      optionalClueCount: plan.optionalClueIds.length,
      optionalCollectedCount: optionalCollected,
      puzzleUnlocked: requiredCollected === plan.requiredClueIds.length,
      solved: record.solvedAt !== null,
      attemptsLeft: MAX_SEAL_ATTEMPTS - record.attemptsUsed,
      completedAt: record.completedAt,
      endingId: record.endingId,
    },
    clues,
    checkpoint: record.checkpoint,
    revision: record.revision,
    createdAt: record.createdAt,
  };
}
