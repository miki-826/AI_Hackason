import { z } from "zod";
import { STORY_BIBLE } from "@/game-core/content/storyBible";
import { MEMORY_TARGETS } from "@/game-core/definitions/furniture";
import type { MemoryStory } from "@/game-core/types";

const actorIds = STORY_BIBLE.allowedActors as unknown as ["protagonist", ...("adult_a" | "adult_b" | "child_a")[]];
const actions = STORY_BIBLE.allowedActions as unknown as ["SIT_DOWN", ...("STAND_UP" | "PLACE_LETTER" | "CHECK_CLOCK" | "LOOK_AROUND" | "OPEN_DRAWER" | "LIGHT_FADE" | "PLAY_AMBIENCE")[]];
const targets = Object.keys(MEMORY_TARGETS) as [keyof typeof MEMORY_TARGETS, ...(keyof typeof MEMORY_TARGETS)[]];
const eventSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,48}$/),
  atMs: z.number().int().min(0).max(120000),
  durationMs: z.number().int().min(800).max(12000),
  action: z.enum(actions),
  actorId: z.enum(actorIds).nullable(),
  subtitle: z.string().min(1).max(180),
  cameraTargetId: z.enum(targets).nullable(),
  clueId: z.string().nullable(),
  allowExplore: z.boolean(),
}).strict();

export const memoryStorySchema = z.object({
  furnitureId: z.string(), title: z.string().min(1).max(40),
  summary: z.string().min(1).max(80), narration: z.string().min(1).max(200),
  actors: z.array(z.enum(actorIds)).min(1).refine((a) => new Set(a).size === a.length),
  events: z.array(eventSchema).min(1).max(8),
}).strict().superRefine((story, ctx) => {
  const ids = new Set<string>();
  let last = -1;
  story.events.forEach((event, i) => {
    if (ids.has(event.id)) ctx.addIssue({ code: "custom", path: ["events", i, "id"], message: "Duplicate event id" });
    ids.add(event.id);
    if (event.atMs <= last) ctx.addIssue({ code: "custom", path: ["events", i, "atMs"], message: "Events must ascend" });
    last = event.atMs;
    if (event.atMs + event.durationMs > 120000) ctx.addIssue({ code: "custom", path: ["events", i], message: "Event exceeds timeline" });
    if (event.actorId && !story.actors.includes(event.actorId)) ctx.addIssue({ code: "custom", path: ["events", i, "actorId"], message: "Actor is not in story" });
  });
});

const nullable = (values: readonly string[]) => ({ enum: [...values, null] });
export const memoryStoryJsonSchema = {
  type: "object", additionalProperties: false,
  required: ["furnitureId", "title", "summary", "narration", "actors", "events"],
  properties: {
    furnitureId: { type: "string" }, title: { type: "string", maxLength: 40 },
    summary: { type: "string", maxLength: 80 }, narration: { type: "string", maxLength: 200 },
    actors: { type: "array", items: { type: "string", enum: STORY_BIBLE.allowedActors } },
    events: { type: "array", maxItems: 8, items: { type: "object", additionalProperties: false,
      required: ["id", "atMs", "durationMs", "action", "actorId", "subtitle", "cameraTargetId", "clueId", "allowExplore"],
      properties: { id: { type: "string", pattern: "^[a-z0-9-]{1,48}$" },
        atMs: { type: "integer", minimum: 0, maximum: 120000 },
        durationMs: { type: "integer", minimum: 800, maximum: 12000 },
        action: { type: "string", enum: STORY_BIBLE.allowedActions }, actorId: nullable(STORY_BIBLE.allowedActors),
        subtitle: { type: "string", maxLength: 180 }, cameraTargetId: nullable(targets),
        clueId: { type: ["string", "null"] }, allowExplore: { type: "boolean" } } } },
  },
} as const;

export function validateStorySemantics(story: MemoryStory, expected: { furnitureId: string; expectedClueId: string | null }): string[] {
  const issues: string[] = [];
  if (story.furnitureId !== expected.furnitureId) issues.push("Wrong furnitureId");
  const clueEvents = story.events.filter((e) => e.clueId !== null);
  if (expected.expectedClueId) {
    if (clueEvents.length !== 1 || clueEvents[0]?.clueId !== expected.expectedClueId || !clueEvents[0]?.allowExplore) issues.push("Expected exactly one explorable clue event");
  } else if (clueEvents.length) issues.push("Unexpected clue event");
  if ([story.narration, ...story.events.map((e) => e.subtitle)].some((s) => /https?:\/\/|www\.|<|>|`|javascript:/i.test(s))) issues.push("Unsafe text");
  return issues;
}
