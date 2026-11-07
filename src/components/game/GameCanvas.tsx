"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type * as THREE from "three";
import { PLAYER } from "@/game-core/definitions/room";
import { useGameStore } from "@/stores/gameStore";
import { MemoryScene } from "@/components/memory/MemoryScene";
import { lookInput } from "./inputState";
import { PlayerRig } from "./PlayerRig";
import { PerformanceMonitor } from "@react-three/drei";
import { placeDecor } from "@/game-core/generation/placeDecor";
import type { DecorInstance } from "@/game-core/definitions/decor";
import { PostFX, SceneEnvironment } from "./RenderQuality";

const EMPTY_DECOR: DecorInstance[] = [];
import { RoomScene } from "./RoomScene";

/** Pointer lock (hidden cursor) only while walking; every other phase keeps the cursor visible. */
const LOCKABLE = new Set(["EXPLORING", "ESCAPE"]);

function downgradeQuality() {
  const s = useGameStore.getState();
  const next = s.settings.quality === "high" ? "standard" : s.settings.quality === "standard" ? "low" : null;
  if (!next) return;
  s.updateSettings({ quality: next });
  s.showToast(next === "standard" ? "動作が重いため、画質を「標準」に下げました。" : "動作が重いため、画質を「低」に下げました。");
}

/** WebGL canvas: the present room, or the memory set while a memory plays. */
export default function GameCanvas() {
  const furniture = useGameStore((s) => s.session?.furniture);
  const seed = useGameStore((s) => s.session?.seed);
  // deterministic set dressing for this session (computed once per layout)
  const dressing = useMemo(() => (seed && furniture ? placeDecor(seed, furniture) : null), [seed, furniture]);
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
    // touch: drag anywhere on the 3D view to look around, tap to interact
    const touch = { id: -1, x: 0, y: 0, startX: 0, startY: 0, t: 0 };
    const onTouchDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch" || touch.id !== -1) return;
      touch.id = e.pointerId;
      touch.x = touch.startX = e.clientX;
      touch.y = touch.startY = e.clientY;
      touch.t = performance.now();
    };
    const onTouchMove = (e: PointerEvent) => {
      if (e.pointerId !== touch.id) return;
      lookInput.dx += (e.clientX - touch.x) * 1.6;
      lookInput.dy += (e.clientY - touch.y) * 1.6;
      touch.x = e.clientX;
      touch.y = e.clientY;
    };
    const onTouchUp = (e: PointerEvent) => {
      if (e.pointerId !== touch.id) return;
      const tap = Math.hypot(e.clientX - touch.startX, e.clientY - touch.startY) < 10 && performance.now() - touch.t < 350;
      touch.id = -1;
      if (!tap) return;
      const s = useGameStore.getState();
      if (s.phase === "MEMORY_EXPLORE" && aimed.current) void s.collectFragment();
      else if (s.focusTarget) s.interact();
    };
    const onDown = (e: MouseEvent) => {
      if (useGameStore.getState().touchControls) return; // touch uses the handlers above
      if (e.button !== 0) return;
      const s = useGameStore.getState();
      if (s.phase === "MEMORY_EXPLORE") {
        // memories use the visible cursor: click the glowing fragment directly
        if (aimed.current) void s.collectFragment();
        return;
      }
      if (!LOCKABLE.has(s.phase) || s.journalOpen || s.settingsOpen || s.manualOpen) return;
      if (document.pointerLockElement !== el) {
        void el.requestPointerLock?.();
        return;
      }
      if (s.focusTarget) s.interact();
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
      if (!locked && LOCKABLE.has(s.phase) && !s.journalOpen && !s.settingsOpen && !s.controlsOpen && !s.manualOpen) s.pause();
    };
    el.addEventListener("mousedown", onDown);
    el.addEventListener("pointerdown", onTouchDown);
    window.addEventListener("pointermove", onTouchMove);
    window.addEventListener("pointerup", onTouchUp);
    window.addEventListener("pointercancel", onTouchUp);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("pointerlockchange", onLockChange);
    const unsub = useGameStore.subscribe((s, prev) => {
      if (s.phase !== prev.phase && !LOCKABLE.has(s.phase) && document.pointerLockElement === el) {
        document.exitPointerLock();
      }
      if ((s.journalOpen && !prev.journalOpen) || (s.settingsOpen && !prev.settingsOpen) || (s.manualOpen && !prev.manualOpen)) {
        if (document.pointerLockElement === el) document.exitPointerLock();
      }
    });
    return () => {
      el.removeEventListener("mousedown", onDown);
      el.removeEventListener("pointerdown", onTouchDown);
      window.removeEventListener("pointermove", onTouchMove);
      window.removeEventListener("pointerup", onTouchUp);
      window.removeEventListener("pointercancel", onTouchUp);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("pointerlockchange", onLockChange);
      unsub();
      if (document.pointerLockElement === el) document.exitPointerLock();
    };
  }, []);

  const showMemory = memorySceneActive && memory;
  const dpr: [number, number] = quality === "high" ? [1.2, 1.6] : quality === "standard" ? [1, 1.15] : [0.7, 0.9];

  return (
    <div
      ref={wrapper}
      className="fixed inset-0 h-dvh w-dvw touch-none select-none transition-[filter] duration-700"
      style={{ filter: showMemory ? "sepia(0.22) saturate(1.12)" : "none" }}
    >
      <Canvas
        shadows={quality === "low" ? false : quality === "high" ? "soft" : true}
        flat={quality !== "low"}
        resize={{ scroll: false, debounce: { scroll: 0, resize: 0 } }}
        dpr={dpr}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        camera={{ fov: 70, near: 0.05, far: 60, position: PLAYER.spawn }}
        aria-label="3D の部屋"
      >
        {/* drop one quality step automatically when the frame rate stays low */}
        <PerformanceMonitor flipflops={2} onDecline={downgradeQuality} />
        <SceneEnvironment intensity={showMemory ? 0.35 : 0.18} />
        {showMemory ? (
          <MemoryScene memory={memory} quality={quality} aimedRef={aimed} />
        ) : furniture ? (
          <>
            <RoomScene furniture={furniture} dressing={dressing ?? undefined} quality={quality} interactive worldRef={world} />
            <PlayerRig furniture={furniture} decor={dressing?.decor ?? EMPTY_DECOR} world={world} />
          </>
        ) : null}
        <PostFX quality={quality} warm={Boolean(showMemory)} />
      </Canvas>
      {showMemory ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, transparent 45%, rgba(40,20,5,0.55) 100%)" }}
        />
      ) : null}
      <div aria-hidden className="grain absolute inset-0 opacity-25" />
    </div>
  );
}
