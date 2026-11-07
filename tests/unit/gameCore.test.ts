import { describe, expect, it } from "vitest";
import { createRng } from "@/game-core/seed/prng";
import { generateGamePlan } from "@/game-core/generation/generateGamePlan";
import { isLayoutTraversable } from "@/game-core/generation/placeFurniture";
import { aabbOverlap, furnitureAabb } from "@/game-core/generation/geometry";
import { analyzePlan } from "@/game-core/puzzle/solveGraph";
import { checkSeal, normalizeCode } from "@/game-core/puzzle/validateAnswer";
import { transition } from "@/game-core/state/transitions";
import {
  completeMemory,
  createSessionRecord,
  decodeClue,
  finishEnding,
  solveSeal,
  toPublicSession,
} from "@/game-core/rules/sessionRules";
import { buildFallbackStory } from "@/game-core/content/fallbackStories";

const now = "2026-11-07T00:00:00.000Z";
const seedFor = (i: number) => {
  const rng = createRng(`test-${i}`);
  return Array.from({ length: 32 }, () => Math.floor(rng.next() * 16).toString(16)).join("");
};

describe("PRNG / placement", () => {
  it("same seed -> same layout", () => {
    const s = seedFor(1);
    expect(generateGamePlan(s).furniture).toEqual(generateGamePlan(s).furniture);
  });

  it("1,000 seeds: required furniture present, no overlap, traversable, clearable", () => {
    let fallbacks = 0;
    for (let i = 0; i < 1000; i++) {
      const plan = generateGamePlan(seedFor(i));
      const types = plan.furniture.map((f) => f.type);
      expect(types).toEqual(expect.arrayContaining(["chair", "clock", "desk"]));
      expect(new Set(types).size).toBe(types.length);
      expect(plan.furniture.length).toBeGreaterThanOrEqual(5);
      const boxes = plan.furniture.map((f) => furnitureAabb(f));
      for (let a = 0; a < boxes.length; a++)
        for (let b = a + 1; b < boxes.length; b++) expect(aabbOverlap(boxes[a], boxes[b])).toBe(false);
      expect(isLayoutTraversable(plan.furniture)).toBe(true);
      expect(analyzePlan(plan)).toEqual({ solvable: true, problems: [] });
      if (plan.usedFallbackLayout) fallbacks++;
    }
    expect(fallbacks).toBeLessThan(50);
  }, 120_000);
});

describe("seal rules", () => {
  it("normalises full-width digits and rejects bad formats", () => {
    expect(normalizeCode("０３１５")).toBe("0315");
    expect(normalizeCode("03 15")).toBe("0315");
    expect(normalizeCode("315")).toBeNull();
    expect(normalizeCode(315)).toBeNull();
  });
  it("never succeeds without the required clues", () => {
    const r = checkSeal({ input: "0315", expectedAnswer: "0315", requiredClueIds: ["a", "b"], collectedClueIds: ["a"], solved: false });
    expect(r).toEqual({ ok: false, reason: "CLUES_MISSING" });
  });
  it("has no attempt limit: 100 wrong codes, then the right one still opens", () => {
    let record = createSessionRecord({ id: "lim", seed: seedFor(9), now });
    const plan = generateGamePlan(record.seed);
    for (const f of plan.furniture.filter((x) => x.required)) {
      const clue = Object.entries(plan.clueSources).find(([, fid]) => fid === f.id)![0];
      const r = completeMemory(record, plan, { furnitureId: f.id, observedEventIds: [], foundClueIds: [clue], now });
      if (!r.ok) throw new Error(r.error);
      record = r.record;
    }
    for (let i = 0; i < 100; i++) {
      const w = solveSeal(record, plan, { answer: "1111", revision: record.revision, now });
      if (!w.ok) throw new Error(w.error);
      record = w.record;
    }
    const ok = solveSeal(record, plan, { answer: "0315", revision: record.revision, now });
    expect(ok.ok && ok.correct).toBe(true);
  });
});

describe("state machine", () => {
  it("rejects invalid transitions", () => {
    expect(transition("EXPLORING", "SOLVED")).toBeNull();
    expect(transition("TITLE", "INVESTIGATE")).toBeNull();
    expect(transition("INSPECTING", "BACK")).toBe("EXPLORING");
    expect(transition("MEMORY_REVIEW", "RETURN")).toBe("MEMORY_TRANSITION_OUT");
    // memories can be skipped from any playing state, never from the room
    for (const p of ["MEMORY_TRANSITION_IN", "MEMORY_OBSERVE", "MEMORY_EXPLORE", "MEMORY_CLUE"] as const) {
      expect(transition(p, "SKIP")).toBe("MEMORY_REVIEW");
    }
    expect(transition("EXPLORING", "SKIP")).toBeNull();
    expect(transition("MEMORY_REVIEW", "SKIP")).toBeNull();
  });
});

describe("simulated solver: fixed stories only (no AI) always clear", () => {
  it("collect -> decode -> solve -> ending, for 200 seeds", () => {
    for (let i = 0; i < 200; i++) {
      let record = createSessionRecord({ id: `s${i}`, seed: seedFor(i), now });
      const plan = generateGamePlan(record.seed);
      for (const f of plan.furniture.filter((x) => x.required)) {
        const story = buildFallbackStory(f.id, f.type, plan.cast);
        const clueEvent = story.events.find((e) => e.clueId);
        expect(clueEvent?.allowExplore).toBe(true);
        const res = completeMemory(record, plan, {
          furnitureId: f.id,
          observedEventIds: story.events.map((e) => e.id),
          foundClueIds: [clueEvent!.clueId!],
          now,
        });
        if (!res.ok) throw new Error(res.error);
        record = res.record;
      }
      const dec = decodeClue(record, { clueId: "clue-desk", relatedClueIds: ["clue-chair", "clue-clock"], now });
      expect(dec.ok && dec.decoded).toBe(true);
      const wrong = solveSeal(record, plan, { answer: "1503", revision: record.revision, now });
      if (!wrong.ok) throw new Error(wrong.error);
      expect(wrong.correct).toBe(false);
      record = wrong.record;
      const stale = solveSeal(record, plan, { answer: "0315", revision: record.revision - 1, now });
      expect(stale).toEqual({ ok: false, error: "REVISION_CONFLICT" });
      const right = solveSeal(record, plan, { answer: "0315", revision: record.revision, now });
      if (!right.ok) throw new Error(right.error);
      expect(right.correct).toBe(true);
      const end = finishEnding(right.record, plan, { revision: right.record.revision, now });
      if (!end.ok) throw new Error(end.error);
      expect(end.ending.endingId).toBe("ending-quiet");
    }
  });

  it("rejects clues from other furniture and is idempotent", () => {
    const record = createSessionRecord({ id: "x", seed: seedFor(3), now });
    const plan = generateGamePlan(record.seed);
    const chair = plan.furniture.find((f) => f.type === "chair")!;
    expect(completeMemory(record, plan, { furnitureId: chair.id, observedEventIds: [], foundClueIds: ["clue-desk"], now })).toEqual({ ok: false, error: "CLUE_NOT_ALLOWED" });
    const once = completeMemory(record, plan, { furnitureId: chair.id, observedEventIds: [], foundClueIds: ["clue-chair"], now });
    if (!once.ok) throw new Error();
    const twice = completeMemory(once.record, plan, { furnitureId: chair.id, observedEventIds: [], foundClueIds: ["clue-chair"], now });
    if (!twice.ok) throw new Error();
    expect(twice.record.revision).toBe(once.record.revision);
    expect(twice.newClueIds).toEqual([]);
  });

  it("public session never leaks the answer or unfound clues", () => {
    const record = createSessionRecord({ id: "y", seed: seedFor(4), now });
    const json = JSON.stringify(toPublicSession(record, generateGamePlan(record.seed)));
    expect(json).not.toContain("0315");
    expect(json).not.toContain("clue-");
  });
});

describe("set dressing (decor)", () => {
  it("1,000 seeds: decor never overlaps furniture or blocks any required path", async () => {
    const { placeDecor, decorAabb } = await import("@/game-core/generation/placeDecor");
    const { isAreaTraversable } = await import("@/game-core/generation/placeFurniture");
    const { SEAL_PANEL } = await import("@/game-core/definitions/room");
    let total = 0;
    for (let i = 0; i < 1000; i++) {
      const seed = seedFor(i);
      const plan = generateGamePlan(seed);
      const { decor, art } = placeDecor(seed, plan.furniture);
      expect(placeDecor(seed, plan.furniture)).toEqual({ decor, art });
      total += decor.length;
      const fBoxes = plan.furniture.map((f) => furnitureAabb(f));
      const dBoxes = decor.map((d) => decorAabb(d));
      for (const d of dBoxes) {
        for (const f of fBoxes) expect(aabbOverlap(d, f)).toBe(false);
        expect(aabbOverlap(d, SEAL_PANEL.reserve)).toBe(false);
      }
      expect(isAreaTraversable([...fBoxes, ...dBoxes], fBoxes)).toBe(true);
      expect(art.length).toBe(3);
    }
    expect(total / 1000).toBeGreaterThan(3.5);
  }, 180_000);
});
