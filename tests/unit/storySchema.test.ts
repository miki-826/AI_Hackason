import { describe, expect, it } from "vitest";
import { buildFallbackStory } from "@/game-core/content/fallbackStories";
import { castForSeed } from "@/game-core/content/cast";
import { clueForFurnitureType } from "@/game-core/content/clues";
import { FURNITURE_DEFINITIONS } from "@/game-core/definitions/furniture";
import type { MemoryStory } from "@/game-core/types";
import { memoryStorySchema, validateStorySemantics } from "@/lib/ai/storySchema";
const cast = castForSeed("a".repeat(32));
const base = buildFallbackStory("chair_001", "chair", cast);
const check = (story: MemoryStory) => validateStorySemantics(story, { furnitureId: story.furnitureId, expectedClueId: "clue-chair" });
describe("memory story schema", () => {
  it("accepts every authored fallback", () => {
    for (const type of Object.keys(FURNITURE_DEFINITIONS) as (keyof typeof FURNITURE_DEFINITIONS)[]) {
      const story = buildFallbackStory(`${type}_001`, type, cast);
      expect(memoryStorySchema.safeParse(story).success).toBe(true);
      expect(validateStorySemantics(story, { furnitureId: story.furnitureId, expectedClueId: clueForFurnitureType(type).id })).toEqual([]);
    }
  });
  it("rejects unknown action and actor", () => {
    expect(memoryStorySchema.safeParse({ ...base, events: [{ ...base.events[0], action: "FLY" }] }).success).toBe(false);
    expect(memoryStorySchema.safeParse({ ...base, actors: ["stranger"] }).success).toBe(false);
  });
  it("rejects long subtitle, missing field, extra key", () => {
    expect(memoryStorySchema.safeParse({ ...base, events: [{ ...base.events[0], subtitle: "x".repeat(181) }] }).success).toBe(false);
    const withoutTitle = { ...base } as Partial<MemoryStory>;
    delete withoutTitle.title;
    expect(memoryStorySchema.safeParse(withoutTitle).success).toBe(false);
    expect(memoryStorySchema.safeParse({ ...base, extra: true }).success).toBe(false);
  });
  it("rejects unsafe and duplicate or wrong clues", () => {
    expect(check({ ...base, events: [{ ...base.events[0], subtitle: "https://example.com" }, ...base.events.slice(1)] })).toContain("Unsafe text");
    expect(check({ ...base, events: [...base.events, { ...base.events.at(-1)!, id: "duplicate-clue", atMs: 30000, clueId: "clue-chair", allowExplore: true }] })).not.toEqual([]);
    expect(check({ ...base, events: base.events.map((event) => event.clueId ? { ...event, clueId: "clue-clock" } : event) })).not.toEqual([]);
  });
});
