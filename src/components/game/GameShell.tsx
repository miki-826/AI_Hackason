"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { GameHud } from "@/components/hud/GameHud";
import { useGameInput } from "@/hooks/useGameInput";
import { audio } from "@/lib/audio/audioEngine";
import { useGameStore } from "@/stores/gameStore";
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

export function GameShell() {
  const params = useSearchParams();
  const mode = params.get("mode");
  const started = useRef(false);
  const hasSession = useGameStore((s) => Boolean(s.session));
  useGameInput();

  useEffect(() => {
    const s = useGameStore.getState();
    s.hydrateSettings();
    if (started.current) return;
    started.current = true;
    if (!supportsWebGL2()) {
      useGameStore.setState({
        phase: "ERROR",
        error: { message: "このブラウザは WebGL2 に対応していないため、3D の部屋を表示できません。最新の Chrome または Edge でお試しください。", retryable: false },
      });
      return;
    }
    if (mode === "continue") void s.continueGame();
    else void s.startNewGame();
  }, [mode]);

  // audio follows settings, page visibility and the current scene
  useEffect(() => {
    const apply = () => {
      const { settings } = useGameStore.getState();
      audio.setVolumes({ master: settings.masterVolume, sfx: settings.sfxVolume, ambience: settings.ambienceVolume });
    };
    apply();
    const unlock = () => {
      audio.unlock();
      apply();
      if (useGameStore.getState().session) audio.ambience("room");
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    const unsub = useGameStore.subscribe((s, prev) => {
      if (s.settings !== prev.settings) apply();
      const prevCount = prev.session?.progress.collectedClueIds.length ?? 0;
      const count = s.session?.progress.collectedClueIds.length ?? 0;
      if (count > prevCount && prev.session) audio.play("clue");
      if (s.session?.progress.solved && !prev.session?.progress.solved) audio.play("unlock");
      if (s.puzzle.result === "wrong" && prev.puzzle.result !== "wrong") audio.play("wrong");
      if (s.phase === "ENDING" && prev.phase !== "ENDING") audio.ambience("off");
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
    </main>
  );
}
