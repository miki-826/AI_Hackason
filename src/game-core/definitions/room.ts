import type { Vec3 } from "../types";

/** Room is centred on the origin. X = left/right, Z = front/back, Y = up. */
export const ROOM = {
  width: 12,
  depth: 10,
  height: 4,
  minX: -6,
  maxX: 6,
  minZ: -5,
  maxZ: 5,
} as const;

export const PLAYER = {
  eyeHeight: 1.65,
  radius: 0.3,
  walkSpeed: 3.1,
  spawn: [0, 1.65, 3.6] as Vec3,
  /** yaw 0 looks toward -Z (into the room) */
  spawnYaw: 0,
  interactDistance: 2.2,
} as const;

/** Hidden seal panel lives on the east wall; area in front is always kept clear. */
export const SEAL_PANEL = {
  position: [ROOM.maxX - 0.06, 1.45, 0] as Vec3,
  rotationY: -Math.PI / 2,
  /** clear zone in front of the panel (x/z bounds) */
  reserve: { minX: ROOM.maxX - 1.8, maxX: ROOM.maxX, minZ: -1.3, maxZ: 1.3 },
  /** where the player should be able to stand to use it */
  standPoint: [ROOM.maxX - 1.2, 0, 0] as Vec3,
} as const;

export const SPAWN_CLEAR_RADIUS = 1.3;

export const SEAL_PANEL_INTERACTION_ID = "seal_panel";
export const SEAL_PANEL_NAME = "？？？";
export const EXIT_DOOR_INTERACTION_ID = "exit_door";
