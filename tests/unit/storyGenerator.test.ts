import { afterEach, describe, expect, it, vi } from "vitest";
import { createSessionRecord, planForRecord } from "@/game-core/rules/sessionRules";
import { buildFallbackStory } from "@/game-core/content/fallbackStories";
import { getMemoryStory } from "@/lib/ai/storyGenerator";
const originalFetch = global.fetch;
const key = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL;
afterEach(() => { global.fetch = originalFetch; process.env.OPENAI_API_KEY = key; process.env.OPENAI_MODEL = model; delete process.env.DISABLE_AI_GENERATION; });
function args() {
  const record = createSessionRecord({ id: crypto.randomUUID(), seed: "a".repeat(32), now: new Date().toISOString() });
  const result = planForRecord(record); if (!result.ok) throw new Error();
  const furniture = result.plan.furniture.find((item) => item.type === "chair")!;
  return { record, plan: result.plan, furnitureId: furniture.id, story: buildFallbackStory(furniture.id, furniture.type, result.plan.cast) };
}
describe("story generator", () => {
  it("accepts valid AI JSON", async () => {
    process.env.OPENAI_API_KEY = "test"; process.env.OPENAI_MODEL = "test-model";
    const input = args(); global.fetch = vi.fn().mockResolvedValue(Response.json({ output_text: JSON.stringify(input.story) }));
    const result = await getMemoryStory(input); expect(result.source).toBe("ai"); expect(result.record.aiGenerations).toBe(1);
  });
  it("falls back after invalid JSON", async () => {
    process.env.OPENAI_API_KEY = "test"; process.env.OPENAI_MODEL = "test-model";
    global.fetch = vi.fn().mockResolvedValue(Response.json({ output_text: "not-json" }));
    expect((await getMemoryStory(args())).source).toBe("fallback"); expect(global.fetch).toHaveBeenCalledTimes(3);
  });
  it("falls back on abort", async () => {
    process.env.OPENAI_API_KEY = "test"; process.env.OPENAI_MODEL = "test-model";
    global.fetch = vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError"));
    expect((await getMemoryStory(args())).source).toBe("fallback");
  });
  it("does not fetch when disabled", async () => {
    process.env.DISABLE_AI_GENERATION = "true"; global.fetch = vi.fn();
    expect((await getMemoryStory(args())).source).toBe("fallback"); expect(global.fetch).not.toHaveBeenCalled();
  });
});
