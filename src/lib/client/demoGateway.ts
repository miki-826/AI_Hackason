/**
 * Offline demo gateway (spec 7.3: ネットワーク不通でもデモシナリオが遊べる).
 *
 * Loaded ONLY through a dynamic import guarded by
 * NEXT_PUBLIC_ENABLE_DEMO === "true". It runs the same pure rules as the
 * server, but its progress is stored separately from official progress and
 * is never sent to the server.
 */
import { buildFallbackStory } from "@/game-core/content/fallbackStories";
import { FURNITURE_DEFINITIONS } from "@/game-core/definitions/furniture";
import {
  completeMemory,
  createSessionRecord,
  decodeClue,
  finishEnding,
  planForRecord,
  saveCheckpoint,
  solveSeal,
  toPublicSession,
  type RuleError,
  type SessionRecord,
} from "@/game-core/rules/sessionRules";
import type { GameGateway } from "./gateway";
import { GatewayError } from "./gateway";

const KEY = "ts:demo-session:v1";

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

function load(): SessionRecord | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SessionRecord) : null;
  } catch {
    return null;
  }
}

function store(record: SessionRecord) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(record));
  } catch {
    /* demo progress is best-effort */
  }
}

function fail(error: RuleError): never {
  const status = error === "REVISION_CONFLICT" ? 409 : error === "FURNITURE_NOT_FOUND" || error === "CLUE_NOT_FOUND" ? 404 : 400;
  throw new GatewayError(error, status, error === "REVISION_CONFLICT" ? "CONFLICT" : "BAD_REQUEST", false);
}

function current(sessionId: string) {
  const record = load();
  if (!record || record.id !== sessionId) throw new GatewayError("デモのセッションが見つかりません。", 404, "NOT_FOUND", false);
  const planned = planForRecord(record);
  if (!planned.ok) fail(planned.error);
  return { record, plan: planned.plan };
}

const now = () => new Date().toISOString();

export const demoGateway: GameGateway = {
  mode: "demo",
  async createSession() {
    const record = createSessionRecord({ id: `demo-${randomHex(8)}`, seed: randomHex(16), now: now() });
    store(record);
    return toPublicSession(record, current(record.id).plan);
  },
  async currentSession() {
    const record = load();
    if (!record) return null;
    const planned = planForRecord(record);
    return planned.ok ? toPublicSession(record, planned.plan) : null;
  },
  async furnitureDetail(sessionId, furnitureId) {
    const { record, plan } = current(sessionId);
    const f = plan.furniture.find((x) => x.id === furnitureId);
    if (!f) fail("FURNITURE_NOT_FOUND");
    const def = FURNITURE_DEFINITIONS[f.type];
    return {
      furnitureId,
      name: def.name,
      description: def.description,
      examineText: def.examineText,
      memoryStatus: "ready",
      visited: record.visited.includes(furnitureId),
    };
  },
  async generateMemory(sessionId, furnitureId) {
    const { plan } = current(sessionId);
    const f = plan.furniture.find((x) => x.id === furnitureId);
    if (!f) fail("FURNITURE_NOT_FOUND");
    return { status: "ready", source: "fallback", memory: buildFallbackStory(furnitureId, f.type, plan.cast) };
  },
  async completeMemory(sessionId, furnitureId, body) {
    const { record, plan } = current(sessionId);
    const res = completeMemory(record, plan, { furnitureId, ...body, now: now() });
    if (!res.ok) fail(res.error);
    store(res.record);
    return { session: toPublicSession(res.record, plan), newClueIds: res.newClueIds };
  },
  async decodeClue(sessionId, clueId, relatedClueIds) {
    const { record, plan } = current(sessionId);
    const res = decodeClue(record, { clueId, relatedClueIds, now: now() });
    if (!res.ok) fail(res.error);
    store(res.record);
    return { decoded: res.decoded, session: toPublicSession(res.record, plan) };
  },
  async solveSeal(sessionId, answer, revision) {
    const { record, plan } = current(sessionId);
    const res = solveSeal(record, plan, { answer, revision, now: now() });
    if (!res.ok) fail(res.error);
    store(res.record);
    return {
      correct: res.correct,
      unlocked: res.correct,
      attemptsLeft: res.attemptsLeft,
      revision: res.record.revision,
      session: toPublicSession(res.record, plan),
    };
  },
  async saveCheckpoint(sessionId, checkpoint) {
    const { record } = current(sessionId);
    const next = saveCheckpoint(record, { checkpoint, now: now() });
    store(next);
    return { savedAt: next.updatedAt, revision: next.revision };
  },
  async finishEnding(sessionId, revision) {
    const { record, plan } = current(sessionId);
    const res = finishEnding(record, plan, { revision, now: now() });
    if (!res.ok) fail(res.error);
    store(res.record);
    return {
      endingId: res.ending.endingId,
      completedAt: res.record.completedAt ?? now(),
      ending: res.ending,
      session: toPublicSession(res.record, plan),
    };
  },
  async deleteSession() {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  },
};
