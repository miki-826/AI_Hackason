import type { ActorId, MemoryAction } from "../types";

/** Immutable world settings (spec 5.3). Server-only: contains the answer. */
export const STORY_BIBLE = {
  version: "story-1.0",
  puzzleVersion: "puzzle-1.0",
  placementVersion: "placement-1.0",
  chapterId: "chapter-01-last-supper",
  title: "真実を求めて",
  theme: "物の記憶と失われた約束",
  openingId: "intro-001",
  revealId: "reveal-001",
  truth: "この部屋は主人公の心残りから生み出された、死後も続く『あの後の部屋』である",
  mandatoryFurniture: ["chair", "clock", "desk"],
  puzzleId: "seal-code-001",
  answer: "0315",
  requiredClueIds: ["clue-chair", "clue-clock", "clue-desk"],
  allowedActors: ["protagonist", "adult_a", "adult_b", "child_a"] as ActorId[],
  allowedActions: [
    "SIT_DOWN",
    "STAND_UP",
    "PLACE_LETTER",
    "CHECK_CLOCK",
    "LOOK_AROUND",
    "OPEN_DRAWER",
    "LIGHT_FADE",
    "PLAY_AMBIENCE",
  ] as MemoryAction[],
  /** shared facts the narrative may reference (never the raw answer) */
  worldFacts: [
    "家族四人が暮らした家の食卓のある部屋",
    "ある春の夜、家族は最後の夕食を共にした",
    "その翌日、主人公以外の家族は事故で帰らなかった",
    "主人公は、最後の食卓で言えなかった言葉をずっと気にかけている",
    "部屋の家具たちは、あの夜の出来事を覚えている",
  ],
} as const;

export const MAX_SEAL_ATTEMPTS = 30;
