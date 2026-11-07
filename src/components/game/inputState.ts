"use client";

import { PLAYER } from "@/game-core/definitions/room";
import type { Vec3 } from "@/game-core/types";

/**
 * High-frequency input + pose live in plain mutable objects (not React state)
 * so per-frame updates never trigger re-renders (spec 3.4 / 7.4).
 */
export const lookInput = { dx: 0, dy: 0 };

export const keysDown = new Set<string>();

/** virtual joystick (touch): x = right, y = forward, each -1..1 */
export const touchMove = { x: 0, y: 0 };

/** Present-day player pose. Survives scene swaps (room <-> memory). */
export const playerPose = {
  position: [...PLAYER.spawn] as Vec3,
  yaw: PLAYER.spawnYaw as number,
  pitch: 0,
  initialisedFor: null as string | null,
};

export function consumeLook(): { dx: number; dy: number } {
  const out = { dx: lookInput.dx, dy: lookInput.dy };
  lookInput.dx = 0;
  lookInput.dy = 0;
  return out;
}
