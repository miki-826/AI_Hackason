import { STORY_BIBLE } from "../content/storyBible";
import { CLUE_DEFINITIONS } from "../content/clues";
import { castForSeed } from "../content/cast";
import type { CastNames, FurnitureInstance } from "../types";
import { placeFurniture } from "./placeFurniture";

/**
 * Deterministic game plan for a seed (spec 5.2 A). It never changes once a
 * session starts: the same seed + versions always reproduce it, which is why
 * the session only needs to persist the seed and the version strings.
 */
export type GamePlan = {
  seed: string;
  chapterId: string;
  storyVersion: string;
  puzzleVersion: string;
  placementVersion: string;
  furniture: FurnitureInstance[];
  /** clue id -> furniture id holding it (only furniture present in the room) */
  clueSources: Record<string, string>;
  requiredClueIds: string[];
  optionalClueIds: string[];
  cast: CastNames;
  usedFallbackLayout: boolean;
};

const REQUIRED: readonly string[] = STORY_BIBLE.requiredClueIds;

export function generateGamePlan(seed: string): GamePlan {
  const { furniture, usedFallback } = placeFurniture(seed);
  const clueSources: Record<string, string> = {};
  for (const clue of CLUE_DEFINITIONS) {
    const holder = furniture.find((f) => f.type === clue.furnitureType);
    if (holder) clueSources[clue.id] = holder.id;
  }
  const present = Object.keys(clueSources);
  return {
    seed,
    chapterId: STORY_BIBLE.chapterId,
    storyVersion: STORY_BIBLE.version,
    puzzleVersion: STORY_BIBLE.puzzleVersion,
    placementVersion: STORY_BIBLE.placementVersion,
    furniture,
    clueSources,
    requiredClueIds: [...REQUIRED],
    optionalClueIds: present.filter((id) => !REQUIRED.includes(id)),
    cast: castForSeed(seed),
    usedFallbackLayout: usedFallback,
  };
}
