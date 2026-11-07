/**
 * Shared, framework-free contracts for 真実を求めて.
 * Everything in game-core is pure TypeScript (no React / Three / Node APIs)
 * so it can run on the server, in the browser, and in unit tests.
 */

export type Vec3 = [number, number, number];

export type FurnitureType = "chair" | "clock" | "desk" | "bookshelf" | "drawer" | "mirror";

export type GamePhase =
  | "TITLE"
  | "INITIALIZING"
  | "EXPLORING"
  | "INSPECTING"
  | "MEMORY_TRANSITION_IN"
  | "MEMORY_OBSERVE"
  | "MEMORY_EXPLORE"
  | "MEMORY_CLUE"
  | "MEMORY_REVIEW"
  | "MEMORY_TRANSITION_OUT"
  | "PUZZLE"
  | "ESCAPE"
  | "ENDING"
  | "PAUSED"
  | "ERROR";

export type MemoryAction =
  | "SIT_DOWN"
  | "STAND_UP"
  | "PLACE_LETTER"
  | "CHECK_CLOCK"
  | "LOOK_AROUND"
  | "OPEN_DRAWER"
  | "LIGHT_FADE"
  | "PLAY_AMBIENCE";

export type ActorId = "protagonist" | "adult_a" | "adult_b" | "child_a";

/** Named points inside the memory set that the camera may look at. */
export type MemoryTargetId =
  | "dining_table"
  | "clock_face"
  | "letter"
  | "family"
  | "old_door"
  | "drawer"
  | "mirror"
  | "bookshelf";

export type MemoryEvent = {
  id: string;
  atMs: number;
  durationMs: number;
  action: MemoryAction;
  actorId: ActorId | null;
  subtitle: string;
  cameraTargetId: MemoryTargetId | null;
  clueId: string | null;
  allowExplore: boolean;
};

export type MemoryStory = {
  furnitureId: string;
  title: string;
  summary: string;
  narration: string;
  actors: ActorId[];
  events: MemoryEvent[];
};

/** Display names chosen per session for the people in the memories. */
export type CastNames = Record<ActorId, string>;

export type FurnitureInstance = {
  /** e.g. "chair_001" — unique in a session */
  id: string;
  type: FurnitureType;
  /** floor-level position in metres (y is always 0 for floor items) */
  position: Vec3;
  /** rotation around Y in radians; 0 = front faces +Z */
  rotationY: number;
  required: boolean;
};

export type Checkpoint = { position: Vec3; yaw: number };

/** Clue as the browser is allowed to see it (only after it is found). */
export type PublicClue = {
  id: string;
  furnitureId: string;
  furnitureType: FurnitureType;
  required: boolean;
  title: string;
  content: string;
  /** 1-based order in which the player found it */
  order: number;
  foundAt: string;
  decoded: boolean;
  /** Interpretation text; only present once decoded */
  decodedContent: string | null;
  /** Related clue ids that the player has ALSO found (never leaks unfound ids) */
  relatedClueIds: string[];
  /** True when every related clue needed for decoding has been found */
  decodable: boolean;
};

export type PublicProgress = {
  collectedClueIds: string[];
  decodedClueIds: string[];
  visitedFurnitureIds: string[];
  requiredClueCount: number;
  requiredCollectedCount: number;
  optionalClueCount: number;
  optionalCollectedCount: number;
  /** Seal panel is revealed (all required clues collected) */
  puzzleUnlocked: boolean;
  /** Correct code entered — door is open */
  solved: boolean;
  attemptsLeft: number;
  completedAt: string | null;
  endingId: EndingId | null;
};

export type PublicSession = {
  sessionId: string;
  seed: string;
  chapterId: string;
  storyVersion: string;
  puzzleVersion: string;
  cast: CastNames;
  furniture: FurnitureInstance[];
  progress: PublicProgress;
  clues: PublicClue[];
  checkpoint: Checkpoint | null;
  revision: number;
  createdAt: string;
};

export type EndingId = "ending-quiet" | "ending-warm" | "ending-whole";

export type EndingContent = {
  endingId: EndingId;
  title: string;
  truth: string[];
  epilogue: string[];
  extraMemoryCount: number;
};

export type HintLevel = 1 | 2 | 3;
