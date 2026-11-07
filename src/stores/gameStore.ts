"use client";

import { create } from "zustand";
import { PAUSABLE_PHASES, transition, type GameEvent } from "@/game-core/state/transitions";
import type {
  Checkpoint,
  EndingContent,
  GamePhase,
  HintLevel,
  MemoryEvent,
  MemoryStory,
  PublicClue,
  PublicSession,
} from "@/game-core/types";
import type { FurnitureDetailResponse } from "@/lib/api/contract";
import { GatewayError, type GameGateway } from "@/lib/client/gateway";
import { serverGateway } from "@/lib/client/serverGateway";
import { DEFAULT_SETTINGS, loadSettings, persistSettings, sanitizeSettings, type Settings } from "./settings";

export type FocusKind = "furniture" | "seal_panel" | "exit_door";

export type FocusTarget = { id: string; kind: FocusKind; label: string };

export type LoadingStep = { id: string; label: string; status: "pending" | "active" | "done" };

export type MemoryPlayback = {
  /** increments on every (re)play so the 3D timeline restarts */
  playId: number;
  furnitureId: string;
  story: MemoryStory;
  source: "ai" | "fallback";
  /** index of the event currently shown; -1 before the first event */
  eventIndex: number;
  observedEventIds: string[];
  /** the event whose fragment is waiting to be picked up (MEMORY_EXPLORE) */
  exploreEvent: MemoryEvent | null;
  /** clue granted during this playback (shown in MEMORY_CLUE / review) */
  foundClue: PublicClue | null;
  /** clue event ids already resolved in this playback (no double grants) */
  resolvedClueEventIds: string[];
  /** this furniture's clue was collected in an earlier playback */
  alreadyCollected: boolean;
  /** saving the clue failed; the CLUE card offers a retry */
  clueFailed: boolean;
  retryEvent: MemoryEvent | null;
};

export type PuzzleState = {
  submitting: boolean;
  result: "idle" | "wrong" | "correct" | "error";
  message: string | null;
};

export type GameState = {
  phase: GamePhase;
  /** phase to return to when the pause menu closes */
  pausedFrom: GamePhase | null;
  mode: "server" | "demo";
  session: PublicSession | null;
  loadingSteps: LoadingStep[];
  error: { message: string; retryable: boolean } | null;
  /** object under the crosshair (updated only when it changes) */
  focusTarget: FocusTarget | null;
  inspecting: { furnitureId: string; detail: FurnitureDetailResponse | null; examined: boolean; loading: boolean } | null;
  memory: MemoryPlayback | null;
  memoryLoading: boolean;
  /** clue shown in the SC-06 "found" card after returning to the room */
  journalOpen: boolean;
  hintLevel: 0 | HintLevel;
  puzzle: PuzzleState;
  ending: EndingContent | null;
  settings: Settings;
  settingsOpen: boolean;
  controlsOpen: boolean;
  toast: { id: number; text: string } | null;
  hasSavedGame: boolean | null;
  /** true while the canvas holds pointer lock (mouse-look active) */
  pointerLocked: boolean;
  /** true while the 3D canvas shows the memory set instead of the room */
  memorySceneActive: boolean;
};

export type GameActions = {
  hydrateSettings(): void;
  checkSavedGame(): Promise<void>;
  startNewGame(): Promise<void>;
  continueGame(): Promise<void>;
  retryInit(): Promise<void>;
  goToTitle(): void;

  setFocusTarget(target: FocusTarget | null): void;
  interact(): void;
  investigate(furnitureId: string): Promise<void>;
  examine(): void;
  closeInspect(): void;

  replayMemory(): Promise<void>;
  memoryFadeComplete(): void;
  showMemoryEvent(index: number): void;
  collectFragment(): Promise<void>;
  acknowledgeClue(): void;
  memoryTimelineEnd(): void;
  returnFromMemory(): Promise<void>;
  leaveMemory(): void;

  openJournal(): void;
  closeJournal(): void;
  setHintLevel(level: 0 | HintLevel): void;
  decodeClue(clueId: string, relatedClueIds: string[]): Promise<boolean>;

  openPuzzle(): void;
  closePuzzle(): void;
  submitCode(code: string): Promise<void>;
  escapeComplete(): Promise<void>;

  pause(): void;
  resume(): void;
  openSettings(): void;
  closeSettings(): void;
  toggleControls(open?: boolean): void;
  updateSettings(patch: Partial<Settings>): void;

  saveCheckpoint(checkpoint: Checkpoint): Promise<void>;
  showToast(text: string): void;
  abandonGame(): Promise<void>;
  setPointerLocked(locked: boolean): void;
  setMemorySceneActive(active: boolean): void;
};

export type GameStore = GameState & GameActions;

const INIT_STEPS: LoadingStep[] = [
  { id: "session", label: "部屋の扉を閉ざしています", status: "pending" },
  { id: "layout", label: "家具の配置を決定しています", status: "pending" },
  { id: "memories", label: "記憶を整理しています", status: "pending" },
];

const IDLE_PUZZLE: PuzzleState = { submitting: false, result: "idle", message: null };

let gateway: GameGateway = serverGateway;
let toastSeq = 0;
let playSeq = 0;
const memoryCache = new Map<string, { story: MemoryStory; source: "ai" | "fallback" }>();

const cacheKey = (sessionId: string, furnitureId: string) => `ts:memory:v1:${sessionId}:${furnitureId}`;

function readCachedMemory(sessionId: string, furnitureId: string) {
  const key = cacheKey(sessionId, furnitureId);
  const hit = memoryCache.get(key);
  if (hit) return hit;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { story: MemoryStory; source: "ai" | "fallback" };
    if (parsed?.story?.furnitureId !== furnitureId || !Array.isArray(parsed.story.events)) return null;
    memoryCache.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
}

function writeCachedMemory(sessionId: string, furnitureId: string, value: { story: MemoryStory; source: "ai" | "fallback" }) {
  const key = cacheKey(sessionId, furnitureId);
  memoryCache.set(key, value);
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / private mode */
  }
}

function messageOf(err: unknown): string {
  if (err instanceof GatewayError) return err.message;
  return "予期しないエラーが発生しました。";
}

async function switchToDemoIfAllowed(err: unknown): Promise<boolean> {
  if (!(err instanceof GatewayError) || err.code !== "NETWORK") return false;
  // The offline demo contains spoilers, so it is only compiled into the client
  // bundle when NEXT_PUBLIC_ENABLE_DEMO is "true" at build time (spec 5.3).
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO === "true") {
    const mod: { demoGateway: GameGateway | null } = await import("@/lib/client/demoGateway");
    if (!mod.demoGateway) return false;
    gateway = mod.demoGateway;
    return true;
  }
  return false;
}

let pendingUnlockToast = false;

export const useGameStore = create<GameStore>()((set, get) => {
  const flushUnlockToast = () => {
    if (!pendingUnlockToast) return;
    pendingUnlockToast = false;
    setTimeout(() => get().showToast("東の壁で、何かが動いた音がする。"), 1200);
  };

  /** Apply a phase machine event; ignored if not allowed. */
  const go = (event: GameEvent): boolean => {
    const next = transition(get().phase, event);
    if (!next) return false;
    set({ phase: next });
    return true;
  };

  const setStep = (id: string, status: LoadingStep["status"]) =>
    set((s) => ({ loadingSteps: s.loadingSteps.map((st) => (st.id === id ? { ...st, status } : st)) }));

  const prefetchRequiredMemories = async (session: PublicSession) => {
    const required = session.furniture.filter((f) => f.required);
    await Promise.allSettled(
      required.map(async (f) => {
        if (readCachedMemory(session.sessionId, f.id)) return;
        const res = await gateway.generateMemory(session.sessionId, f.id);
        writeCachedMemory(session.sessionId, f.id, { story: res.memory, source: res.source });
      }),
    );
  };

  const boot = async (load: () => Promise<PublicSession | null>) => {
    set({ phase: "INITIALIZING", loadingSteps: INIT_STEPS.map((s) => ({ ...s })), error: null, ending: null });
    try {
      setStep("session", "active");
      let session: PublicSession | null;
      try {
        session = await load();
      } catch (err) {
        if (await switchToDemoIfAllowed(err)) {
          session = await gateway.createSession();
          get().showToast("サーバーに接続できないため、オフラインのデモで遊んでいます。");
        } else throw err;
      }
      if (!session) throw new GatewayError("再開できるセッションが見つかりません。", 404, "NOT_FOUND", false);
      setStep("session", "done");
      // later retries must resume this session, never start a new one
      lastBoot = () => gateway.currentSession();
      setStep("layout", "active");
      set({ session, mode: gateway.mode });
      setStep("layout", "done");
      setStep("memories", "active");
      await prefetchRequiredMemories(session);
      setStep("memories", "done");
      if (session.progress.completedAt) {
        // already cleared: show the ending again
        const res = await gateway.finishEnding(session.sessionId, session.revision);
        set({ session: res.session, ending: res.ending, phase: "ENDING" });
        return;
      }
      set({ phase: "EXPLORING", hasSavedGame: true });
    } catch (err) {
      const retryable = err instanceof GatewayError ? err.retryable : true;
      set({ phase: "ERROR", error: { message: messageOf(err), retryable } });
    }
  };

  let lastBoot: () => Promise<PublicSession | null> = () => gateway.createSession();

  return {
    phase: "TITLE",
    pausedFrom: null,
    mode: "server",
    session: null,
    loadingSteps: INIT_STEPS,
    error: null,
    focusTarget: null,
    inspecting: null,
    memory: null,
    memoryLoading: false,
    journalOpen: false,
    hintLevel: 0,
    puzzle: IDLE_PUZZLE,
    ending: null,
    settings: DEFAULT_SETTINGS,
    settingsOpen: false,
    controlsOpen: false,
    toast: null,
    hasSavedGame: null,
    pointerLocked: false,
    memorySceneActive: false,

    setMemorySceneActive(active) {
      if (get().memorySceneActive !== active) set({ memorySceneActive: active });
    },

    setPointerLocked(locked) {
      if (get().pointerLocked !== locked) set({ pointerLocked: locked });
    },

    hydrateSettings() {
      set({ settings: loadSettings() });
    },

    async checkSavedGame() {
      try {
        const session = await serverGateway.currentSession();
        set({ hasSavedGame: Boolean(session) });
      } catch {
        set({ hasSavedGame: false });
      }
    },

    async startNewGame() {
      gateway = serverGateway;
      const current = get().session;
      if (current) {
        await gateway.deleteSession(current.sessionId).catch(() => undefined);
      }
      set({ session: null, memory: null, inspecting: null, journalOpen: false, hintLevel: 0, puzzle: IDLE_PUZZLE });
      lastBoot = () => gateway.createSession();
      await boot(lastBoot);
    },

    async continueGame() {
      gateway = serverGateway;
      lastBoot = () => gateway.currentSession();
      await boot(lastBoot);
    },

    async retryInit() {
      await boot(lastBoot);
    },

    goToTitle() {
      set({
        phase: "TITLE",
        pausedFrom: null,
        memory: null,
        inspecting: null,
        journalOpen: false,
        settingsOpen: false,
        puzzle: IDLE_PUZZLE,
        focusTarget: null,
        hasSavedGame: null,
      });
    },

    setFocusTarget(target) {
      const cur = get().focusTarget;
      if (cur?.id === target?.id) return;
      set({ focusTarget: target });
    },

    interact() {
      const { phase, focusTarget, session, journalOpen, settingsOpen } = get();
      if ((phase !== "EXPLORING" && phase !== "ESCAPE") || !focusTarget || journalOpen || settingsOpen) return;
      if (phase === "ESCAPE") {
        if (focusTarget.kind === "exit_door" && go("ESCAPED")) void get().escapeComplete();
        return;
      }
      if (focusTarget.kind === "furniture") void get().investigate(focusTarget.id);
      else if (focusTarget.kind === "seal_panel" && session?.progress.puzzleUnlocked && !session.progress.solved) get().openPuzzle();
      else if (focusTarget.kind === "exit_door" && session?.progress.solved) {
        if (go("ESCAPED")) void get().escapeComplete();
      }
    },

    async investigate(furnitureId) {
      const { session } = get();
      if (!session || !go("INVESTIGATE")) return;
      set({ inspecting: { furnitureId, detail: null, examined: false, loading: true } });
      try {
        const detail = await gateway.furnitureDetail(session.sessionId, furnitureId);
        set((s) => (s.inspecting?.furnitureId === furnitureId ? { inspecting: { ...s.inspecting, detail, loading: false } } : {}));
      } catch (err) {
        set((s) => (s.inspecting ? { inspecting: { ...s.inspecting, loading: false } } : {}));
        get().showToast(messageOf(err));
      }
    },

    examine() {
      set((s) => (s.inspecting ? { inspecting: { ...s.inspecting, examined: true } } : {}));
    },

    closeInspect() {
      if (go("BACK")) set({ inspecting: null });
    },

    async replayMemory() {
      const { session, inspecting, memory, phase } = get();
      const furnitureId = inspecting?.furnitureId ?? memory?.furnitureId;
      if (!session || !furnitureId) return;
      if (phase !== "INSPECTING" && phase !== "MEMORY_REVIEW") return;
      set({ memoryLoading: true });
      try {
        let cached = readCachedMemory(session.sessionId, furnitureId);
        if (!cached) {
          const res = await gateway.generateMemory(session.sessionId, furnitureId);
          cached = { story: res.memory, source: res.source };
          writeCachedMemory(session.sessionId, furnitureId, cached);
        }
        if (!go("REPLAY")) return;
        set({
          inspecting: null,
          memory: {
            playId: ++playSeq,
            furnitureId,
            story: cached.story,
            source: cached.source,
            eventIndex: -1,
            observedEventIds: [],
            exploreEvent: null,
            foundClue: session.clues.find((c) => c.furnitureId === furnitureId) ?? null,
            alreadyCollected: session.clues.some((c) => c.furnitureId === furnitureId),
            clueFailed: false,
            retryEvent: null,
            resolvedClueEventIds: [],
          },
        });
      } catch (err) {
        get().showToast(messageOf(err));
      } finally {
        set({ memoryLoading: false });
      }
    },

    memoryFadeComplete() {
      const { phase } = get();
      if (phase === "MEMORY_TRANSITION_IN") go("FADE_COMPLETE");
      else if (phase === "MEMORY_TRANSITION_OUT") {
        go("FADE_COMPLETE");
        set({ memory: null });
      }
    },

    showMemoryEvent(index) {
      const { memory, phase, session } = get();
      if (!memory || phase !== "MEMORY_OBSERVE") return;
      const event = memory.story.events[index];
      if (!event) return;
      const observed = memory.observedEventIds.includes(event.id) ? memory.observedEventIds : [...memory.observedEventIds, event.id];
      set({ memory: { ...memory, eventIndex: index, observedEventIds: observed } });
      const alreadyHave = event.clueId ? session?.progress.collectedClueIds.includes(event.clueId) : false;
      if (event.clueId && !memory.resolvedClueEventIds.includes(event.id) && !alreadyHave) {
        if (event.allowExplore) {
          if (go("EXPLORATION_EVENT")) set((s) => (s.memory ? { memory: { ...s.memory, exploreEvent: event } } : {}));
        } else if (go("CLUE_EVENT")) {
          void get().collectFragment();
        }
      }
    },

    async collectFragment() {
      const { memory, session, phase } = get();
      if (!memory || !session) return;
      const event = memory.retryEvent ?? memory.exploreEvent ?? memory.story.events[memory.eventIndex];
      if (!event?.clueId) return;
      if (phase === "MEMORY_EXPLORE" && !go("CLUE_FOUND")) return;
      set({
        memory: {
          ...memory,
          exploreEvent: null,
          retryEvent: null,
          clueFailed: false,
          resolvedClueEventIds: memory.resolvedClueEventIds.includes(event.id)
            ? memory.resolvedClueEventIds
            : [...memory.resolvedClueEventIds, event.id],
        },
      });
      try {
        const res = await gateway.completeMemory(session.sessionId, memory.furnitureId, {
          observedEventIds: memory.observedEventIds,
          foundClueIds: [event.clueId],
        });
        const clue = res.session.clues.find((c) => c.id === event.clueId) ?? null;
        if (res.session.progress.puzzleUnlocked && !session.progress.puzzleUnlocked) pendingUnlockToast = true;
        set((s) => ({ session: res.session, memory: s.memory ? { ...s.memory, foundClue: clue, clueFailed: false } : null }));
      } catch (err) {
        // keep the clue retryable: the CLUE card offers 「もう一度記録する」
        set((s) => (s.memory ? { memory: { ...s.memory, clueFailed: true, retryEvent: event } } : {}));
        get().showToast(messageOf(err));
      }
    },

    acknowledgeClue() {
      go("ACKNOWLEDGED");
    },

    memoryTimelineEnd() {
      go("TIMELINE_END");
    },

    async returnFromMemory() {
      const { memory, session } = get();
      if (!go("RETURN")) return;
      if (memory && session && !session.progress.visitedFurnitureIds.includes(memory.furnitureId)) {
        try {
          const res = await gateway.completeMemory(session.sessionId, memory.furnitureId, {
            observedEventIds: memory.observedEventIds,
            foundClueIds: [],
          });
          set({ session: res.session });
        } catch {
          /* visiting is cosmetic; clue progress was already saved when found */
        }
      }
      flushUnlockToast();
    },

    leaveMemory() {
      const { phase } = get();
      if (phase === "MEMORY_REVIEW") {
        void get().returnFromMemory();
        return;
      }
      if (go("BACK")) flushUnlockToast();
    },

    openJournal() {
      const { phase } = get();
      if (phase === "EXPLORING" || phase === "INSPECTING" || phase === "MEMORY_REVIEW" || phase === "PUZZLE") set({ journalOpen: true });
    },
    closeJournal() {
      set({ journalOpen: false });
    },
    setHintLevel(level) {
      set({ hintLevel: level });
    },

    async decodeClue(clueId, relatedClueIds) {
      const { session } = get();
      if (!session) return false;
      try {
        const res = await gateway.decodeClue(session.sessionId, clueId, relatedClueIds);
        set({ session: res.session });
        return res.decoded;
      } catch (err) {
        get().showToast(messageOf(err));
        return false;
      }
    },

    openPuzzle() {
      if (go("OPEN_PUZZLE")) set({ puzzle: IDLE_PUZZLE });
    },
    closePuzzle() {
      go("CLOSE_PUZZLE");
    },

    async submitCode(code) {
      const { session, puzzle } = get();
      if (!session || puzzle.submitting) return;
      set({ puzzle: { submitting: true, result: "idle", message: null } });
      try {
        const res = await gateway.solveSeal(session.sessionId, code, session.revision);
        set({ session: res.session });
        if (res.correct) {
          set({ puzzle: { submitting: false, result: "correct", message: "封印が解けた。" } });
          go("SOLVED");
        } else {
          set({
            puzzle: {
              submitting: false,
              result: "wrong",
              message: `装置は沈黙したままだ。（残り ${res.attemptsLeft} 回）`,
            },
          });
        }
      } catch (err) {
        if (err instanceof GatewayError && err.code === "CONFLICT") {
          const fresh = await gateway.currentSession().catch(() => null);
          if (fresh) set({ session: fresh });
          set({ puzzle: { submitting: false, result: "error", message: "進行状況を更新しました。もう一度入力してください。" } });
          return;
        }
        set({ puzzle: { submitting: false, result: "error", message: messageOf(err) } });
      }
    },

    async escapeComplete() {
      const { session } = get();
      if (!session) return;
      try {
        let res;
        try {
          res = await gateway.finishEnding(session.sessionId, session.revision);
        } catch (err) {
          if (!(err instanceof GatewayError && err.code === "CONFLICT")) throw err;
          const fresh = await gateway.currentSession();
          if (!fresh) throw err;
          res = await gateway.finishEnding(fresh.sessionId, fresh.revision);
        }
        set({ session: res.session, ending: res.ending, phase: "ENDING" });
      } catch (err) {
        set({ phase: "ERROR", error: { message: messageOf(err), retryable: true } });
      }
    },

    pause() {
      const { phase } = get();
      if (!PAUSABLE_PHASES.has(phase)) return;
      set({ pausedFrom: phase, phase: "PAUSED", settingsOpen: false });
    },
    resume() {
      const { pausedFrom } = get();
      set({ phase: pausedFrom ?? "EXPLORING", pausedFrom: null, settingsOpen: false });
    },
    openSettings() {
      set({ settingsOpen: true });
    },
    closeSettings() {
      set({ settingsOpen: false });
    },
    toggleControls(open) {
      set((s) => ({ controlsOpen: open ?? !s.controlsOpen }));
    },
    updateSettings(patch) {
      const settings = sanitizeSettings({ ...get().settings, ...patch });
      persistSettings(settings);
      set({ settings });
    },

    async saveCheckpoint(checkpoint) {
      const { session } = get();
      if (!session) return;
      try {
        await gateway.saveCheckpoint(session.sessionId, checkpoint, session.revision);
      } catch {
        /* position saves are best-effort and never roll back progress (spec 8.3) */
      }
    },

    showToast(text) {
      toastSeq += 1;
      const id = toastSeq;
      set({ toast: { id, text } });
      setTimeout(() => {
        if (get().toast?.id === id) set({ toast: null });
      }, 4200);
    },

    async abandonGame() {
      const { session } = get();
      if (session) await gateway.deleteSession(session.sessionId).catch(() => undefined);
      set({ session: null, hasSavedGame: false });
      get().goToTitle();
    },
  };
});

/** Single derived selector for HUD visibility (spec 7.4). */
export const selectHudVisible = (s: GameState) => s.phase === "EXPLORING" && !s.journalOpen;
