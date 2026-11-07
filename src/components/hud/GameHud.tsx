"use client";

import { useRouter } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { MEMORY_PHASES } from "@/game-core/state/transitions";
import { SEAL_PANEL_NAME } from "@/game-core/definitions/room";
import { useGameStore } from "@/stores/gameStore";
import { ControlsHelp } from "@/components/ui/ControlsHelp";
import { Gear, Satchel } from "@/components/ui/icons";
import { SettingsDialog } from "@/components/ui/SettingsDialog";
import { Toast } from "@/components/ui/Toast";
import { VoiceToggle } from "@/components/ui/VoiceToggle";
import { ClueJournal } from "./ClueJournal";
import { EndingScreen } from "./EndingScreen";
import { InspectPanel } from "./InspectPanel";
import { MemoryOverlay } from "./MemoryOverlay";
import { PuzzlePanel } from "./PuzzlePanel";

function LoadingScreen() {
  const steps = useGameStore((s) => s.loadingSteps);
  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-ink/95" role="status" aria-live="polite">
      <div className="w-[min(92vw,26rem)]">
        <p className="font-mincho text-2xl tracking-wider text-brass-bright">目を覚ます</p>
        <ol className="mt-6 space-y-3">
          {steps.map((st) => (
            <li key={st.id} className="flex items-center gap-3 text-sm">
              <span
                aria-hidden
                className={`inline-block h-2.5 w-2.5 rotate-45 border ${
                  st.status === "done" ? "border-brass bg-brass" : st.status === "active" ? "animate-pulse border-ember bg-ember/50" : "border-mist/50"
                }`}
              />
              <span className={st.status === "pending" ? "text-mist" : "text-parchment"}>{st.label}</span>
              <span className="sr-only">{st.status === "done" ? "完了" : st.status === "active" ? "処理中" : "待機中"}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function ErrorScreen() {
  const router = useRouter();
  const { error, retryInit, goToTitle } = useGameStore(useShallow((s) => ({ error: s.error, retryInit: s.retryInit, goToTitle: s.goToTitle })));
  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-ink/95 px-4">
      <div role="alertdialog" aria-labelledby="err-title" className="brass-panel w-[min(92vw,30rem)] p-8">
        <h2 id="err-title" className="font-mincho text-xl text-brass-bright">部屋に入れなかった</h2>
        <p className="mt-3 leading-relaxed text-parchment">{error?.message ?? "原因不明のエラーです。"}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {error?.retryable ? (
            <button type="button" className="brass-button px-5 py-2.5" onClick={() => void retryInit()}>
              もう一度試す
            </button>
          ) : null}
          <button
            type="button"
            className="px-5 py-2.5 text-mist underline-offset-4 hover:text-parchment hover:underline"
            onClick={() => {
              goToTitle();
              router.push("/");
            }}
          >
            タイトルへ
          </button>
        </div>
      </div>
    </div>
  );
}

function missionText(p: { requiredCollectedCount: number; requiredClueCount: number; puzzleUnlocked: boolean; solved: boolean }, escape: boolean) {
  if (escape || p.solved) return { main: "光の差す扉へ向かう", sub: null };
  if (p.puzzleUnlocked) return { main: `東の壁に現れた${SEAL_PANEL_NAME}を調べる`, sub: null };
  return { main: "家具に触れて、物の記憶をたどる", sub: `必須の記憶 ${p.requiredCollectedCount} / ${p.requiredClueCount}` };
}

const PROMPT: Record<string, string> = { furniture: "調べる", seal_panel: `${SEAL_PANEL_NAME}に触れる`, exit_door: "扉を開ける" };

function ExplorationHud() {
  const { phase, focusTarget, pointerLocked, progress, undecoded, interact, openJournal, pause } = useGameStore(
    useShallow((s) => ({
      phase: s.phase,
      focusTarget: s.focusTarget,
      pointerLocked: s.pointerLocked,
      progress: s.session?.progress,
      undecoded: s.session?.clues.filter((c) => !c.decoded).length ?? 0,
      interact: s.interact,
      openJournal: s.openJournal,
      pause: s.pause,
    })),
  );
  if (!progress) return null;
  const mission = missionText(progress, phase === "ESCAPE");
  return (
    <>
      <div className="absolute left-5 top-5 max-w-[22rem] text-sm">
        <p className="font-mincho text-base text-parchment drop-shadow">{mission.main}</p>
        {mission.sub ? <p className="mt-1 text-mist">{mission.sub}</p> : null}
      </div>
      <VoiceToggle className="absolute right-[4.5rem] top-5" />
      <button
        type="button"
        aria-label="一時停止メニュー"
        className="pointer-events-auto absolute right-5 top-5 grid h-11 w-11 place-items-center border border-brass/60 bg-night/80 text-brass-bright hover:border-brass"
        onClick={pause}
      >
        <Gear size={22} />
      </button>
      <button
        type="button"
        aria-label={`手掛かり帳を開く（未解読 ${undecoded} 件）`}
        className="pointer-events-auto absolute bottom-5 left-5 grid h-16 w-16 place-items-center border border-brass/60 bg-night/80 text-brass-bright hover:border-brass"
        onClick={openJournal}
      >
        <Satchel size={30} />
        {undecoded > 0 ? (
          <span className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-ember px-1 text-xs font-bold text-ink">{undecoded}</span>
        ) : null}
      </button>
      <div aria-hidden className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-brass-bright/90" />
      {focusTarget ? (
        <div className="absolute left-1/2 top-[calc(50%+1.75rem)] -translate-x-1/2 text-center">
          <p className="font-mincho text-lg text-parchment drop-shadow">{focusTarget.label}</p>
          {pointerLocked ? (
            <p className="mt-1 text-sm text-brass-bright">
              <kbd className="border border-brass/70 px-1.5">E</kbd> {PROMPT[focusTarget.kind]}
            </p>
          ) : (
            <button type="button" className="brass-button pointer-events-auto mt-2 px-4 py-1.5 text-sm" onClick={interact}>
              {PROMPT[focusTarget.kind]}
            </button>
          )}
        </div>
      ) : null}
      {!pointerLocked && phase === "EXPLORING" ? (
        <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm text-mist">クリックで視点を操作 ・ ESC で一時停止</p>
      ) : null}
    </>
  );
}

function PauseMenu() {
  const router = useRouter();
  const a = useGameStore(
    useShallow((s) => ({ resume: s.resume, openSettings: s.openSettings, toggleControls: s.toggleControls, goToTitle: s.goToTitle, startNewGame: s.startNewGame })),
  );
  return (
    <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-ink/70 px-4">
      <div role="dialog" aria-modal="true" aria-labelledby="pause-title" className="brass-panel flex w-[min(92vw,22rem)] flex-col gap-3 p-8">
        <h2 id="pause-title" className="mb-2 text-center font-mincho text-2xl text-brass-bright">一時停止</h2>
        <button type="button" autoFocus className="brass-button py-3 text-lg" onClick={a.resume}>
          再開する
        </button>
        <button type="button" className="brass-button py-2.5" onClick={a.openSettings}>
          設定
        </button>
        <button type="button" className="brass-button py-2.5" onClick={() => a.toggleControls(true)}>
          操作説明
        </button>
        <button
          type="button"
          className="brass-button py-2.5"
          onClick={() => {
            a.goToTitle();
            router.push("/");
          }}
        >
          タイトルへ戻る
        </button>
        <button type="button" className="mt-2 text-sm text-mist underline-offset-4 hover:text-parchment hover:underline" onClick={() => void a.startNewGame()}>
          最初からやり直す（記録は消えます）
        </button>
      </div>
    </div>
  );
}

/** The single overlay mounted above the 3D canvas. */
export function GameHud() {
  const { phase, journalOpen, settingsOpen, controlsOpen } = useGameStore(
    useShallow((s) => ({ phase: s.phase, journalOpen: s.journalOpen, settingsOpen: s.settingsOpen, controlsOpen: s.controlsOpen })),
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-20 select-none text-parchment">
      {phase === "INITIALIZING" ? <LoadingScreen /> : null}
      {phase === "ERROR" ? <ErrorScreen /> : null}
      {phase === "EXPLORING" || phase === "ESCAPE" ? <ExplorationHud /> : null}
      {phase === "INSPECTING" ? <InspectPanel /> : null}
      {MEMORY_PHASES.has(phase) ? <MemoryOverlay /> : null}
      {phase === "PUZZLE" ? <PuzzlePanel /> : null}
      {phase === "ENDING" ? <EndingScreen /> : null}
      {phase === "PAUSED" ? <PauseMenu /> : null}
      {journalOpen ? <ClueJournal /> : null}
      {settingsOpen ? <SettingsDialog /> : null}
      {controlsOpen ? <ControlsHelp /> : null}
      <Toast />
    </div>
  );
}
