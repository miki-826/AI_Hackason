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
  });
});

describe("seal rules", () => {
  it("normalises full-width digits and rejects bad formats", () => {
    expect(normalizeCode("０３１５")).toBe("0315");
    expect(normalizeCode("03 15")).toBe("0315");
    expect(normalizeCode("315")).toBeNull();
    expect(normalizeCode(315)).toBeNull();
  });
  it("never succeeds without the required clues", () => {
    const r = checkSeal({ input: "0315", expectedAnswer: "0315", requiredClueIds: ["a", "b"], collectedClueIds: ["a"], solved: false, attemptsLeft: 5 });
    expect(r).toEqual({ ok: false, reason: "CLUES_MISSING" });
  });
});

describe("state machine", () => {
  it("rejects invalid transitions", () => {
    expect(transition("EXPLORING", "SOLVED")).toBeNull();
    expect(transition("TITLE", "INVESTIGATE")).toBeNull();
    expect(transition("INSPECTING", "BACK")).toBe("EXPLORING");
    expect(transition("MEMORY_REVIEW", "RETURN")).toBe("MEMORY_TRANSITION_OUT");
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
