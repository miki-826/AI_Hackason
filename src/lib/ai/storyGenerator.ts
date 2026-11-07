import { buildFallbackStory } from "@/game-core/content/fallbackStories";
import { CLUE_BY_ID } from "@/game-core/content/clues";
import { STORY_BIBLE } from "@/game-core/content/storyBible";
import { FURNITURE_DEFINITIONS, MEMORY_TARGETS } from "@/game-core/definitions/furniture";
import type { GamePlan } from "@/game-core/generation/generateGamePlan";
import type { SessionRecord } from "@/game-core/rules/sessionRules";
import type { MemoryStory } from "@/game-core/types";
import { furniturePrompt, systemPrompt } from "./prompts";
import { memoryStoryJsonSchema, memoryStorySchema, validateStorySemantics } from "./storySchema";

type Result = { story: MemoryStory; source: "ai" | "fallback"; record: SessionRecord };
const cache = new Map<string, Promise<Result>>();
export function hasCachedStory(record: SessionRecord, furnitureId: string): boolean { return cache.has(`${record.id}:${record.seed}:${furnitureId}`); }
export function aiEnabled(): boolean { return !!(process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL && process.env.DISABLE_AI_GENERATION !== "true"); }

export async function getMemoryStory(args: { record: SessionRecord; plan: GamePlan; furnitureId: string }): Promise<Result> {
  const key = `${args.record.id}:${args.record.seed}:${args.furnitureId}`;
  const hit = cache.get(key);
  if (hit) {
    const result = await hit;
    return { ...result, record: { ...args.record, aiGenerations: Math.max(args.record.aiGenerations, result.record.aiGenerations) } };
  }
  const pending = generate(args);
  cache.set(key, pending);
  if (cache.size > 500) cache.delete(cache.keys().next().value!);
  return pending;
}

async function generate({ record, plan, furnitureId }: { record: SessionRecord; plan: GamePlan; furnitureId: string }): Promise<Result> {
  const started = Date.now();
  const furniture = plan.furniture.find((f) => f.id === furnitureId);
  if (!furniture) throw new Error("Unknown furniture");
  const clueId = Object.entries(plan.clueSources).find(([, id]) => id === furnitureId)?.[0] ?? null;
  const fallback = (): Result => ({ story: buildFallbackStory(furnitureId, furniture.type, plan.cast), source: "fallback", record });
  if (!aiEnabled() || record.aiGenerations >= 8) {
    console.info(JSON.stringify({ event: "memory_generation", outcome: "fallback", latencyMs: Date.now() - started, usage: null }));
    return fallback();
  }
  const def = FURNITURE_DEFINITIONS[furniture.type];
  const prompt = furniturePrompt({ furnitureId, furnitureType: furniture.type, furnitureName: def.name,
    description: def.description, castNames: plan.cast, allowedActors: STORY_BIBLE.allowedActors,
    allowedActions: STORY_BIBLE.allowedActions, allowedTargets: Object.keys(MEMORY_TARGETS),
    clueId, clueContent: clueId ? CLUE_BY_ID.get(clueId)?.content ?? null : null });
  let issues: string[] = [];
  let usage: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: process.env.OPENAI_MODEL,
          input: [{ role: "system", content: systemPrompt }, { role: "user", content: `${prompt}${issues.length ? `\n修正事項: ${issues.join("; ")}` : ""}` }],
          text: { format: { type: "json_schema", name: "memory_story", strict: true, schema: memoryStoryJsonSchema } } }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`OpenAI status ${response.status}`);
      const data = await response.json() as { output_text?: string; output?: { content?: { type: string; text?: string }[] }[]; usage?: unknown };
      usage = data.usage;
      const output = data.output_text ?? data.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text;
      if (!output) throw new Error("No output text");
      const parsed = memoryStorySchema.safeParse(JSON.parse(output));
      issues = parsed.success ? validateStorySemantics(parsed.data, { furnitureId, expectedClueId: clueId }) : parsed.error.issues.map((issue) => issue.message);
      if (parsed.success && !issues.length) {
        console.info(JSON.stringify({ event: "memory_generation", outcome: "ai", latencyMs: Date.now() - started, usage }));
        return { story: parsed.data, source: "ai", record: { ...record, aiGenerations: record.aiGenerations + 1 } };
      }
    } catch (error) { issues = [error instanceof Error ? error.message : "Generation failed"]; }
    finally { clearTimeout(timer); }
  }
  console.info(JSON.stringify({ event: "memory_generation", outcome: "fallback", latencyMs: Date.now() - started, usage }));
  return fallback();
}
