"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { GameHud } from "@/components/hud/GameHud";
import { ManualSlides } from "@/components/ui/ManualSlides";
import { useGameInput } from "@/hooks/useGameInput";
import { useNarration } from "@/hooks/useNarration";
import type { HealthResponse } from "@/lib/api/contract";
import { audio } from "@/lib/audio/audioEngine";
import { narrator } from "@/lib/audio/narrator";
import { MEMORY_PHASES } from "@/game-core/state/transitions";
import { useGameStore } from "@/stores/gameStore";
import { useTextScale } from "@/hooks/useTextScale";
import { MemoryVeil } from "./MemoryVeil";

// Three.js never runs during SSR (spec 12.2).
const GameCanvas = dynamic(() => import("./GameCanvas"), { ssr: false });

function supportsWebGL2(): boolean {
  try {
    return Boolean(document.createElement("canvas").getContext("webgl2"));
  } catch {
    return false;
  }
}

function applyVolumes() {
  const { settings } = useGameStore.getState();
  audio.setVolumes({
    master: settings.masterVolume,
    sfx: settings.sfxVolume,
    ambience: settings.ambienceVolume,
    bgm: settings.bgmVolume,
    voice: settings.voiceVolume,
  });
  narrator.configure({ enabled: settings.voiceEnabled, volume: settings.voiceVolume * settings.masterVolume });
}

export function GameShell() {
  const params = useSearchParams();
  const mode = params.get("mode");
  const started = useRef(false);
  const hasSession = useGameStore((s) => Boolean(s.session));
  const manualOpen = useGameStore((s) => s.manualOpen);
  const closeManual = useGameStore((s) => s.closeManual);
  useGameInput();
  useNarration();
  useTextScale();

  useEffect(() => {
    const s = useGameStore.getState();
    s.hydrateSettings();
    applyVolumes();
    if (started.current) return;
    started.current = true;
    if (!supportsWebGL2()) {
      useGameStore.setState({
        phase: "ERROR",
        error: { message: "このブラウザは WebGL2 に対応していないため、3D の部屋を表示できません。最新の Chrome または Edge でお試しください。", retryable: false },
      });
      return;
    }
    // server-side neural voice available?
    void fetch("/api/health", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<HealthResponse>) : null))
      .then((h) => narrator.configure({ serverTts: h?.tts === "enabled" }))
      .catch(() => undefined);
    if (mode === "continue") void s.continueGame();
    else {
      // new game: the illustrated manual plays while the room is prepared behind it
      s.openManual();
      void s.startNewGame();
    }
  }, [mode]);

  // audio follows settings, page visibility and the current scene
  useEffect(() => {
    const unlock = () => {
      audio.unlock();
      applyVolumes();
      const s = useGameStore.getState();
      audio.bgm(s.phase === "ENDING" ? "ending" : MEMORY_PHASES.has(s.phase) ? "memory" : "room");
      if (s.session && s.phase !== "ENDING") audio.ambience(MEMORY_PHASES.has(s.phase) ? "memory" : "room");
    };
    // BGM may already be playing (started on the title screen)
    audio.bgm("room");
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    const unsub = useGameStore.subscribe((s, prev) => {
      if (s.settings !== prev.settings) applyVolumes();
      const prevCount = prev.session?.progress.collectedClueIds.length ?? 0;
      const count = s.session?.progress.collectedClueIds.length ?? 0;
      if (count > prevCount && prev.session) audio.play("clue");
      if (s.session?.progress.solved && !prev.session?.progress.solved) audio.play("unlock");
      if (s.puzzle.result === "wrong" && prev.puzzle.result !== "wrong") audio.play("wrong");
      if (s.memorySceneActive !== prev.memorySceneActive) audio.bgm(s.memorySceneActive ? "memory" : "room");
      if (s.phase === "ENDING" && prev.phase !== "ENDING") {
        audio.ambience("off");
        audio.bgm("ending");
      }
    });
    const onVis = () => audio.setMuted(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVis);
    return () => {
      unsub();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      audio.ambience("off");
    };
  }, []);

  return (
    <main className="fixed inset-0 overflow-hidden bg-ink">
      {hasSession ? <GameCanvas /> : null}
      <MemoryVeil />
      <GameHud />
      {manualOpen ? <ManualSlides onClose={closeManual} startLabel="部屋で目を覚ます" /> : null}
    </main>
  );
}
