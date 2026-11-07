"use client";

import { useEffect } from "react";
import { keysDown } from "@/components/game/inputState";
import { useGameStore } from "@/stores/gameStore";

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);

/** Global keyboard: WASD (held), E interact, J/Tab journal, ESC closes the top layer. */
export function useGameInput() {
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysDown.add(e.code);
      if (isTyping(e.target)) return;
      const s = useGameStore.getState();
      if (e.code === "KeyE" && !e.repeat) {
        if (s.phase === "MEMORY_EXPLORE") void s.collectFragment();
        else s.interact();
      } else if ((e.code === "KeyJ" || e.code === "Tab") && !e.repeat) {
        if (s.phase === "TITLE") return;
        e.preventDefault();
        if (s.journalOpen) s.closeJournal();
        else s.openJournal();
      } else if (e.code === "Escape") {
        if (s.controlsOpen) s.toggleControls(false);
        else if (s.settingsOpen) s.closeSettings();
        else if (s.journalOpen) s.closeJournal();
        else if (s.phase === "PUZZLE") s.closePuzzle();
        else if (s.phase === "INSPECTING") s.closeInspect();
        else if (s.phase === "PAUSED") s.resume();
        else if (s.phase === "EXPLORING" || s.phase === "MEMORY_OBSERVE" || s.phase === "MEMORY_EXPLORE") s.pause();
      }
    };
    const onUp = (e: KeyboardEvent) => keysDown.delete(e.code);
    const onBlur = () => keysDown.clear();
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);
}
