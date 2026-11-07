import {
  FURNITURE_DEFINITIONS,
  OPTIONAL_FURNITURE,
  REQUIRED_FURNITURE,
  furnitureIdFor,
} from "../definitions/furniture";
import { PLAYER, ROOM, SEAL_PANEL, SPAWN_CLEAR_RADIUS } from "../definitions/room";
import { createRng, type Rng } from "../seed/prng";
import type { FurnitureInstance, FurnitureType } from "../types";
import { aabbOverlap, closestPointOnAabb, furnitureAabb, type Aabb } from "./geometry";

const GAP_MARGIN = 0.35;
const WALL_GAP = 0.04;
const MAX_ATTEMPTS = 30;
const CANDIDATES_PER_ITEM = 28;
const GRID = 0.2;
const REACH = 1.35;

type Wall = "N" | "S" | "W" | "E";
const WALL_ROT: Record<Wall, number> = { N: 0, S: Math.PI, W: Math.PI / 2, E: -Math.PI / 2 };
const WALL_CHOICES: Wall[] = ["N", "N", "W", "E", "S"];

const PANEL_RESERVE: Aabb = SEAL_PANEL.reserve;

type Candidate = Omit<FurnitureInstance, "id" | "required">;

function round(v: number): number {
  return Math.round(v * 100) / 100;
}

function candidate(type: FurnitureType, rng: Rng): Candidate {
  const def = FURNITURE_DEFINITIONS[type];
  if (def.slot === "center") {
    return {
      type,
      position: [round(rng.range(-3, 3)), 0, round(rng.range(-2.6, 1.4))],
      rotationY: rng.int(0, 3) * (Math.PI / 2),
    };
  }
  const wall = rng.pick(WALL_CHOICES);
  const off = def.footprint.d / 2 + WALL_GAP;
  const along = def.footprint.w / 2 + 0.25;
  const alongX = round(rng.range(ROOM.minX + along, ROOM.maxX - along));
  const alongZ = round(rng.range(ROOM.minZ + along, ROOM.maxZ - along));
  switch (wall) {
    case "N":
      return { type, position: [alongX, 0, ROOM.minZ + off], rotationY: WALL_ROT.N };
    case "S":
      return { type, position: [alongX, 0, ROOM.maxZ - off], rotationY: WALL_ROT.S };
    case "W":
      return { type, position: [ROOM.minX + off, 0, alongZ], rotationY: WALL_ROT.W };
    case "E":
      return { type, position: [ROOM.maxX - off, 0, alongZ], rotationY: WALL_ROT.E };
  }
}

function fits(item: Candidate, placed: FurnitureInstance[]): boolean {
  const box = furnitureAabb(item);
  if (box.minX < ROOM.minX || box.maxX > ROOM.maxX || box.minZ < ROOM.minZ || box.maxZ > ROOM.maxZ) return false;
  if (aabbOverlap(box, PANEL_RESERVE)) return false;
  const [sx, sz] = closestPointOnAabb(box, PLAYER.spawn[0], PLAYER.spawn[2]);
  if (Math.hypot(sx - PLAYER.spawn[0], sz - PLAYER.spawn[2]) < SPAWN_CLEAR_RADIUS) return false;
  const grown = furnitureAabb(item, GAP_MARGIN);
  return placed.every((p) => !aabbOverlap(grown, furnitureAabb(p, GAP_MARGIN)));
}

/**
 * BFS over a walkability grid: the player spawn must reach every furniture
 * item and the seal panel stand point (spec 3.3 step 5).
 */
export function isLayoutTraversable(furniture: FurnitureInstance[]): boolean {
  const boxes = furniture.map((f) => furnitureAabb(f));
  const cols = Math.round(ROOM.width / GRID);
  const rows = Math.round(ROOM.depth / GRID);
  const cx = (i: number) => ROOM.minX + (i + 0.5) * GRID;
  const cz = (j: number) => ROOM.minZ + (j + 0.5) * GRID;
  const r = PLAYER.radius;
  const walkable = (i: number, j: number) => {
    const x = cx(i);
    const z = cz(j);
    if (x < ROOM.minX + r || x > ROOM.maxX - r || z < ROOM.minZ + r || z > ROOM.maxZ - r) return false;
    for (const b of boxes) {
      const [px, pz] = closestPointOnAabb(b, x, z);
      if ((px - x) ** 2 + (pz - z) ** 2 < r * r) return false;
    }
    return true;
  };
  const si = Math.floor((PLAYER.spawn[0] - ROOM.minX) / GRID);
  const sj = Math.floor((PLAYER.spawn[2] - ROOM.minZ) / GRID);
  if (!walkable(si, sj)) return false;
  const seen = new Uint8Array(cols * rows);
  const queue: number[] = [sj * cols + si];
  seen[queue[0]] = 1;
  const reached: [number, number][] = [];
  const dirs: [number, number][] = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  for (let head = 0; head < queue.length; head++) {
    const idx = queue[head];
    const i = idx % cols;
    const j = (idx - i) / cols;
    reached.push([cx(i), cz(j)]);
    for (const [di, dj] of dirs) {
      const ni = i + di;
      const nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= cols || nj >= rows) continue;
      const nidx = nj * cols + ni;
      if (seen[nidx] || !walkable(ni, nj)) continue;
      seen[nidx] = 1;
      queue.push(nidx);
    }
  }
  const canReach = (box: Aabb) =>
    reached.some(([x, z]) => {
      const [px, pz] = closestPointOnAabb(box, x, z);
      return Math.hypot(px - x, pz - z) <= REACH;
    });
  if (!boxes.every(canReach)) return false;
  const [sx, , sz] = SEAL_PANEL.standPoint;
  return reached.some(([x, z]) => Math.hypot(x - sx, z - sz) <= 0.6);
}

/** Verified fixed layout used when random placement fails (spec 3.3 step 6). */
export const FALLBACK_LAYOUT: Omit<FurnitureInstance, "id">[] = [
  { type: "chair", position: [-0.8, 0, -0.6], rotationY: 0, required: true },
  { type: "clock", position: [-3.5, 0, ROOM.minZ + 0.25], rotationY: 0, required: true },
  { type: "desk", position: [2.6, 0, ROOM.minZ + 0.42], rotationY: 0, required: true },
  { type: "bookshelf", position: [ROOM.minX + 0.24, 0, -1.5], rotationY: Math.PI / 2, required: false },
  { type: "mirror", position: [ROOM.minX + 0.22, 0, 2.2], rotationY: Math.PI / 2, required: false },
  { type: "drawer", position: [3.4, 0, ROOM.maxZ - 0.29], rotationY: Math.PI, required: false },
];

export type PlacementResult = { furniture: FurnitureInstance[]; usedFallback: boolean; attempts: number };

/** Optional furniture chosen for a seed (2–3 of bookshelf / drawer / mirror). */
export function selectFurnitureTypes(seed: string): FurnitureType[] {
  const rng = createRng(`${seed}:select`);
  const optionalCount = rng.int(2, 3);
  const optional = rng.shuffle(OPTIONAL_FURNITURE).slice(0, optionalCount);
  return [...REQUIRED_FURNITURE, ...optional];
}

export function placeFurniture(seed: string): PlacementResult {
  const types = selectFurnitureTypes(seed);
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const rng = createRng(`${seed}:place:${attempt}`);
    const placed: FurnitureInstance[] = [];
    let ok = true;
    for (const type of types) {
      let done = false;
      for (let c = 0; c < CANDIDATES_PER_ITEM && !done; c++) {
        const cand = candidate(type, rng);
        if (fits(cand, placed)) {
          placed.push({ ...cand, id: furnitureIdFor(type), required: FURNITURE_DEFINITIONS[type].required });
          done = true;
        }
      }
      if (!done) {
        ok = false;
        break;
      }
    }
    if (ok && isLayoutTraversable(placed)) return { furniture: placed, usedFallback: false, attempts: attempt };
  }
  const furniture = FALLBACK_LAYOUT.filter((f) => types.includes(f.type)).map((f) => ({
    ...f,
    id: furnitureIdFor(f.type),
  }));
  return { furniture, usedFallback: true, attempts: MAX_ATTEMPTS };
}
