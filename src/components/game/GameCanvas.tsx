"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type * as THREE from "three";
import { PLAYER } from "@/game-core/definitions/room";
import { useGameStore } from "@/stores/gameStore";
import { MemoryScene } from "@/components/memory/MemoryScene";
import { lookInput } from "./inputState";
import { PlayerRig } from "./PlayerRig";
import { RoomScene } from "./RoomScene";

const LOCKABLE = new Set(["EXPLORING", "ESCAPE", "MEMORY_OBSERVE", "MEMORY_EXPLORE"]);

/** WebGL canvas: the present room, or the memory set while a memory plays. */
export default function GameCanvas() {
  const furniture = useGameStore((s) => s.session?.furniture);
  const quality = useGameStore((s) => s.settings.quality);
  const memorySceneActive = useGameStore((s) => s.memorySceneActive);
  const memory = useGameStore((s) => s.memory);
  const world = useRef<THREE.Group>(null);
  const aimed = useRef(false);
  const wrapper = useRef<HTMLDivElement>(null);

  // Pointer lock + mouse deltas (spec 2.2: acquired only on explicit click).
  useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const s = useGameStore.getState();
      if (!LOCKABLE.has(s.phase) || s.journalOpen || s.settingsOpen) return;
      if (document.pointerLockElement !== el) {
        void el.requestPointerLock?.();
        return;
      }
      if (s.phase === "MEMORY_EXPLORE" && aimed.current) void s.collectFragment();
      else if (s.focusTarget) s.interact();
    };
    const onMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== el) return;
      lookInput.dx += e.movementX;
      lookInput.dy += e.movementY;
    };
    const onLockChange = () => {
      const locked = document.pointerLockElement === el;
      const s = useGameStore.getState();
      s.setPointerLocked(locked);
      // ESC released the lock during gameplay -> pause (spec 2.2)
      if (!locked && LOCKABLE.has(s.phase)) s.pause();
    };
    el.addEventListener("mousedown", onDown);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("pointerlockchange", onLockChange);
    const unsub = useGameStore.subscribe((s, prev) => {
      if (s.phase !== prev.phase && !LOCKABLE.has(s.phase) && document.pointerLockElement === el) {
        document.exitPointerLock();
      }
      if ((s.journalOpen && !prev.journalOpen) || (s.settingsOpen && !prev.settingsOpen)) {
        if (document.pointerLockElement === el) document.exitPointerLock();
      }
    });
    return () => {
      el.removeEventListener("mousedown", onDown);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("pointerlockchange", onLockChange);
      unsub();
      if (document.pointerLockElement === el) document.exitPointerLock();
    };
  }, []);

  const showMemory = memorySceneActive && memory;
  const dpr: [number, number] = quality === "high" ? [1, 2] : quality === "standard" ? [1, 1.5] : [0.75, 1];

  return (
    <div
      ref={wrapper}
      className="fixed inset-0 h-dvh w-dvw transition-[filter] duration-700"
      style={{ filter: showMemory ? "sepia(0.45) saturate(1.25) contrast(1.06) brightness(1.04)" : "none" }}
    >
      <Canvas
        shadows={quality !== "low"}
        resize={{ scroll: false, debounce: { scroll: 0, resize: 0 } }}
        dpr={dpr}
        gl={{ antialias: quality !== "low", powerPreference: "high-performance" }}
        camera={{ fov: 70, near: 0.05, far: 60, position: PLAYER.spawn }}
        aria-label="3D の部屋"
      >
        {showMemory ? (
          <MemoryScene memory={memory} quality={quality} aimedRef={aimed} />
        ) : furniture ? (
          <>
            <RoomScene furniture={furniture} quality={quality} interactive worldRef={world} />
            <PlayerRig furniture={furniture} world={world} />
          </>
        ) : null}
      </Canvas>
      {showMemory ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, transparent 45%, rgba(40,20,5,0.55) 100%)" }}
        />
      ) : null}
      <div aria-hidden className="grain absolute inset-0 opacity-60" />
    </div>
  );
}
