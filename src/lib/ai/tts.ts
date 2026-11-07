import { createHash } from "node:crypto";
import { buildFallbackStory } from "@/game-core/content/fallbackStories";
import { CLUE_BY_ID } from "@/game-core/content/clues";
import { buildEnding } from "@/game-core/content/endings";
import { SPOKEN_MANUAL_LINES } from "@/game-core/definitions/manual";
import type { GamePlan } from "@/game-core/generation/generateGamePlan";
import type { SessionRecord } from "@/game-core/rules/sessionRules";
import type { MemoryStory } from "@/game-core/types";
import { cachedStoriesForSession } from "./storyGenerator";

const audioCache = new Map<string, ArrayBuffer>();
const inFlight = new Map<string, Promise<ArrayBuffer>>();
const MAX_CACHE_ENTRIES = 300;

export function isTtsEnabled(): boolean {
  return !!(process.env.OPENAI_API_KEY && process.env.OPENAI_TTS_MODEL && process.env.DISABLE_AI_GENERATION !== "true");
}

export async function synthesize(text: string): Promise<ArrayBuffer> {
  if (!isTtsEnabled()) throw new Error("TTS disabled");
  const key = process.env.OPENAI_API_KEY!;
  const model = process.env.OPENAI_TTS_MODEL!;
  const voice = process.env.OPENAI_TTS_VOICE || "sage";
  const cacheKey = createHash("sha256").update(`${voice}:${model}:${text}`).digest("hex");
  const cached = audioCache.get(cacheKey);
  if (cached) {
    audioCache.delete(cacheKey);
    audioCache.set(cacheKey, cached);
    return cached;
  }
  const existing = inFlight.get(cacheKey);
  if (existing) return existing;

  const pending = (async () => {
    const started = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, voice, input: text, response_format: "mp3", instructions: "落ち着いた、静かで少し懐かしさのある語り口の日本語で、ゆっくり読み上げてください。" }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`OpenAI status ${response.status}`);
      const audio = await response.arrayBuffer();
      audioCache.set(cacheKey, audio);
      if (audioCache.size > MAX_CACHE_ENTRIES) audioCache.delete(audioCache.keys().next().value!);
      console.info(JSON.stringify({ event: "tts_synthesis", outcome: "success", latencyMs: Date.now() - started }));
      return audio;
    } catch (error) {
      console.info(JSON.stringify({ event: "tts_synthesis", outcome: "error", latencyMs: Date.now() - started }));
      throw error;
    } finally {
      clearTimeout(timeout);
      inFlight.delete(cacheKey);
    }
  })();
  inFlight.set(cacheKey, pending);
  return pending;
}

function storyContains(story: MemoryStory, text: string): boolean {
  return [story.narration, story.title, ...story.events.map((event) => event.subtitle)].some((line) => line.trim() === text);
}

export function isSpeakableForSession(record: SessionRecord, plan: GamePlan, text: string): boolean {
  const requested = text.trim();
  if (!requested) return false;
  if (cachedStoriesForSession(record).some((story) => storyContains(story, requested))) return true;
  if (plan.furniture.some((furniture) => storyContains(buildFallbackStory(furniture.id, furniture.type, plan.cast), requested))) return true;
  if (SPOKEN_MANUAL_LINES.some((line) => line.trim() === requested)) return true;
  if (record.found.some(({ clueId }) => {
    const clue = CLUE_BY_ID.get(clueId);
    return clue && [clue.title, clue.content, clue.decodedContent].some((line) => line.trim() === requested);
  })) return true;
  if (record.completedAt && record.endingId) {
    const extra = plan.optionalClueIds.filter((id) => record.found.some((clue) => clue.clueId === id)).length;
    const ending = buildEnding(record.endingId, extra);
    if ([...ending.truth, ...ending.epilogue].some((line) => line.trim() === requested)) return true;
  }
  return false;
}
