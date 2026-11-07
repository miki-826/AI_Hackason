"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import { audio } from "@/lib/audio/audioEngine";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Black veil that carries the scene swap between the room and a memory
 * (spec 4.3 step 2: 0.6–1.2 s fade, then the memory set loads).
 */
export function MemoryVeil() {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    let timers: ReturnType<typeof setTimeout>[] = [];
    const clear = () => {
      timers.forEach(clearTimeout);
      timers = [];
    };
    const after = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    const unsub = useGameStore.subscribe((s, prev) => {
      const entered = s.phase !== prev.phase || s.memory?.playId !== prev.memory?.playId;
      if (!entered) return;
      const fade = reduced() ? 150 : 700;
      if (s.phase === "MEMORY_TRANSITION_IN") {
        clear();
        setOpacity(1);
        audio.play("transition");
        after(fade, () => {
          useGameStore.getState().setMemorySceneActive(true);
          audio.ambience("memory");
          after(120, () => setOpacity(0));
          after(120 + fade, () => useGameStore.getState().memoryFadeComplete());
        });
      } else if (s.phase === "MEMORY_TRANSITION_OUT" && prev.phase !== "MEMORY_TRANSITION_OUT") {
        clear();
        setOpacity(1);
        after(fade, () => {
          const st = useGameStore.getState();
          st.setMemorySceneActive(false);
          audio.ambience("room");
          st.memoryFadeComplete();
          after(120, () => setOpacity(0));
        });
      } else if (s.phase === "TITLE" || s.phase === "INITIALIZING") {
        clear();
        setOpacity(0);
        useGameStore.getState().setMemorySceneActive(false);
      }
    });
    return () => {
      unsub();
      clear();
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30 bg-black"
      style={{ opacity, transition: "opacity 700ms cubic-bezier(0.22,0.61,0.36,1)" }}
    />
  );
}
