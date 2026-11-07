import { DECOR_DEFINITIONS, PAINTINGS, type DecorInstance, type DecorType, type PaintingKind, type WallArt } from "../definitions/decor";
import { PLAYER, ROOM, SEAL_PANEL, SPAWN_CLEAR_RADIUS } from "../definitions/room";
import { createRng, type Rng } from "../seed/prng";
import type { FurnitureInstance } from "../types";
import { aabbOverlap, closestPointOnAabb, furnitureAabb, type Aabb } from "./geometry";
import { isAreaTraversable } from "./placeFurniture";

const DECOR_TYPES: DecorType[] = ["armchair", "side_table", "sideboard", "coat_rack", "trunk", "crates", "plant"];
const FURNITURE_CLEARANCE = 0.45;
const DECOR_GAP = 0.12;
const CANDIDATES = 24;

type Wall = "N" | "S" | "W" | "E";
const WALL_ROT: Record<Wall, number> = { N: 0, S: Math.PI, W: Math.PI / 2, E: -Math.PI / 2 };

/** Axis-aligned bounds of a decor item (rotation snapped to 90°). */
export function decorAabb(d: Pick<DecorInstance, "type" | "position" | "rotationY">, margin = 0): Aabb {
  const def = DECOR_DEFINITIONS[d.type];
  const swapped = Math.abs(Math.round(d.rotationY / (Math.PI / 2))) % 2 === 1;
  const hw = (swapped ? def.footprint.d : def.footprint.w) / 2 + margin;
  const hd = (swapped ? def.footprint.w : def.footprint.d) / 2 + margin;
  return { minX: d.position[0] - hw, maxX: d.position[0] + hw, minZ: d.position[2] - hd, maxZ: d.position[2] + hd };
}

const round = (v: number) => Math.round(v * 100) / 100;

function candidate(type: DecorType, rng: Rng): Omit<DecorInstance, "id"> {
  const def = DECOR_DEFINITIONS[type];
  if (def.slot === "corner") {
    const sx = rng.next() < 0.5 ? -1 : 1;
    const sz = rng.next() < 0.5 ? -1 : 1;
    const rot = sz < 0 ? WALL_ROT.N : WALL_ROT.S;
    return {
      type,
      position: [round(sx * (ROOM.maxX - def.footprint.w / 2 - def.wallGap)), 0, round(sz * (ROOM.maxZ - def.footprint.d / 2 - def.wallGap))],
      rotationY: rot,
    };
  }
  const wall = rng.pick<Wall>(["N", "S", "W", "E", "W", "N"]);
  const off = def.footprint.d / 2 + def.wallGap;
  const along = def.footprint.w / 2 + 0.3;
  const ax = round(rng.range(ROOM.minX + along, ROOM.maxX - along));
  const az = round(rng.range(ROOM.minZ + along, ROOM.maxZ - along));
  switch (wall) {
    case "N":
      return { type, position: [ax, 0, ROOM.minZ + off], rotationY: WALL_ROT.N };
    case "S":
      return { type, position: [ax, 0, ROOM.maxZ - off], rotationY: WALL_ROT.S };
    case "W":
      return { type, position: [ROOM.minX + off, 0, az], rotationY: WALL_ROT.W };
    case "E":
      return { type, position: [ROOM.maxX - off, 0, az], rotationY: WALL_ROT.E };
  }
}

function fits(item: Omit<DecorInstance, "id">, furnitureBoxes: Aabb[], decor: DecorInstance[]): boolean {
  const box = decorAabb(item);
  if (box.minX < ROOM.minX || box.maxX > ROOM.maxX || box.minZ < ROOM.minZ || box.maxZ > ROOM.maxZ) return false;
  if (aabbOverlap(box, SEAL_PANEL.reserve)) return false;
  const [sx, sz] = closestPointOnAabb(box, PLAYER.spawn[0], PLAYER.spawn[2]);
  if (Math.hypot(sx - PLAYER.spawn[0], sz - PLAYER.spawn[2]) < SPAWN_CLEAR_RADIUS + 0.2) return false;
  const grown = decorAabb(item, FURNITURE_CLEARANCE);
  if (furnitureBoxes.some((f) => aabbOverlap(grown, f))) return false;
  const near = decorAabb(item, DECOR_GAP);
  return decor.every((d) => !aabbOverlap(near, decorAabb(d, DECOR_GAP)));
}

/**
 * Deterministic set dressing for a seed. Every accepted piece keeps the room
 * traversable: the spawn still reaches every interactive furniture item and
 * the seal panel (same BFS as the furniture placement).
 */
export function placeDecor(seed: string, furniture: FurnitureInstance[]): { decor: DecorInstance[]; art: WallArt[] } {
  const rng = createRng(`${seed}:decor`);
  const furnitureBoxes = furniture.map((f) => furnitureAabb(f));
  const decor: DecorInstance[] = [];
  const types = rng.shuffle(DECOR_TYPES).slice(0, rng.int(5, 7));
  for (const type of types) {
    for (let c = 0; c < CANDIDATES; c++) {
      const cand = candidate(type, rng);
      if (!fits(cand, furnitureBoxes, decor)) continue;
      const trial = [...decor, { ...cand, id: `decor_${type}` }];
      if (!isAreaTraversable([...furnitureBoxes, ...trial.map((d) => decorAabb(d))], furnitureBoxes)) continue;
      decor.push(trial[trial.length - 1]);
      break;
    }
  }

  // paintings high on the walls, never over the hidden seal panel / door
  const kinds = rng.shuffle<PaintingKind>(["landscape", "still_life", "seascape"]);
  const walls = rng.shuffle<Wall>(["N", "S", "W", "E"]).slice(0, 3);
  const art: WallArt[] = walls.map((wall, i) => {
    const kind = kinds[i % kinds.length];
    const half = PAINTINGS[kind].w / 2 + 0.4;
    const y = 2.6;
    if (wall === "E") {
      const side = rng.next() < 0.5 ? -1 : 1;
      const z = round(side * rng.range(2.2, ROOM.maxZ - half));
      return { id: `art_${i}`, kind, position: [ROOM.maxX - 0.03, y, z], rotationY: WALL_ROT.E };
    }
    if (wall === "W") return { id: `art_${i}`, kind, position: [ROOM.minX + 0.03, y, round(rng.range(ROOM.minZ + half, ROOM.maxZ - half))], rotationY: WALL_ROT.W };
    const x = round(rng.range(ROOM.minX + half, ROOM.maxX - half));
    return wall === "N"
      ? { id: `art_${i}`, kind, position: [x, y, ROOM.minZ + 0.03], rotationY: WALL_ROT.N }
      : { id: `art_${i}`, kind, position: [x, y, ROOM.maxZ - 0.03], rotationY: WALL_ROT.S };
  });
  return { decor, art };
}
