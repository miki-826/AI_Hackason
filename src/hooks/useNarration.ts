"use client";

import { useEffect } from "react";
import { MEMORY_PHASES } from "@/game-core/state/transitions";
import { narrator } from "@/lib/audio/narrator";
import { useGameStore } from "@/stores/gameStore";

/**
 * Decides WHAT is read aloud, from store transitions only (no per-frame work):
 * memory narration + each subtitle, the clue card, the examine text, the ending.
 */
export function useNarration() {
  useEffect(() => {
    const unsub = useGameStore.subscribe((s, prev) => {
      const sessionId = s.session?.sessionId ?? null;
      narrator.configure({ enabled: s.settings.voiceEnabled, volume: s.settings.voiceVolume * s.settings.masterVolume });
      if (!s.settings.voiceEnabled && prev.settings.voiceEnabled) s.showToast("読み上げをオフにしました（V で切替）");
      if (s.settings.voiceEnabled && !prev.settings.voiceEnabled) s.showToast("読み上げをオンにしました（V で切替）");

      // leaving a memory, pausing, or closing the panel being read silences it
      const inMemory = MEMORY_PHASES.has(s.phase);
      if (
        (MEMORY_PHASES.has(prev.phase) && !inMemory && s.phase !== "PAUSED") ||
        (s.phase === "PAUSED" && prev.phase !== "PAUSED") ||
        (prev.inspecting && !s.inspecting && !inMemory) ||
        (s.journalOpen && !prev.journalOpen)
      ) {
        narrator.cancel();
      }

      const m = s.memory;
      const pm = prev.memory;
      if (m && s.phase === "MEMORY_TRANSITION_IN" && (prev.phase !== "MEMORY_TRANSITION_IN" || m.playId !== pm?.playId)) {
        narrator.speak(m.story.narration, { interrupt: true, sessionId });
      }
      // skipping a memory jumps straight to the review: stop reading
      const skipped =
        s.phase === "MEMORY_REVIEW" && prev.phase !== "MEMORY_REVIEW" && m && pm && m.eventIndex - pm.eventIndex > 1;
      if (skipped || (s.phase === "MEMORY_REVIEW" && (prev.phase === "MEMORY_TRANSITION_IN" || prev.phase === "MEMORY_EXPLORE"))) {
        narrator.cancel();
      }
      if (!skipped && s.phase !== "MEMORY_REVIEW" && m && pm && m.playId === pm.playId && m.eventIndex !== pm.eventIndex && m.eventIndex >= 0) {
        const ev = m.story.events[m.eventIndex];
        if (ev) narrator.speak(ev.subtitle, { sessionId, interrupt: true });
      }
      if (m?.foundClue && m.foundClue !== pm?.foundClue && s.phase === "MEMORY_CLUE") {
        narrator.speak([m.foundClue.title, m.foundClue.content], { interrupt: true, sessionId });
      }
      if (s.inspecting?.examined && !prev.inspecting?.examined && s.inspecting.detail) {
        narrator.speak(s.inspecting.detail.examineText, { interrupt: true, sessionId });
      }
      if (s.ending && !prev.ending) {
        narrator.speak([s.ending.title, ...s.ending.truth, ...s.ending.epilogue], { interrupt: true, sessionId });
      }
    });
    return () => {
      unsub();
      narrator.cancel();
    };
  }, []);
}
