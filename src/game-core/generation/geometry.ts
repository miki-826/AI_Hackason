import { FURNITURE_DEFINITIONS } from "../definitions/furniture";
import type { FurnitureInstance } from "../types";

export type Aabb = { minX: number; maxX: number; minZ: number; maxZ: number };

/** Axis-aligned bounds of a furniture footprint (rotation snapped to 90°). */
export function furnitureAabb(f: Pick<FurnitureInstance, "type" | "position" | "rotationY">, margin = 0): Aabb {
  const def = FURNITURE_DEFINITIONS[f.type];
  const quarter = Math.round(f.rotationY / (Math.PI / 2));
  const swapped = Math.abs(quarter) % 2 === 1;
  const hw = (swapped ? def.footprint.d : def.footprint.w) / 2 + margin;
  const hd = (swapped ? def.footprint.w : def.footprint.d) / 2 + margin;
  return {
    minX: f.position[0] - hw,
    maxX: f.position[0] + hw,
    minZ: f.position[2] - hd,
    maxZ: f.position[2] + hd,
  };
}

export function aabbOverlap(a: Aabb, b: Aabb): boolean {
  return a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;
}

/** Closest point on an AABB to (x, z). */
export function closestPointOnAabb(box: Aabb, x: number, z: number): [number, number] {
  return [Math.max(box.minX, Math.min(x, box.maxX)), Math.max(box.minZ, Math.min(z, box.maxZ))];
}

/** Push a circle (player) out of the box. Returns corrected x/z. */
export function resolveCircleAabb(box: Aabb, x: number, z: number, r: number): [number, number] {
  const [cx, cz] = closestPointOnAabb(box, x, z);
  const dx = x - cx;
  const dz = z - cz;
  const d2 = dx * dx + dz * dz;
  if (d2 >= r * r) return [x, z];
  if (d2 > 1e-8) {
    const d = Math.sqrt(d2);
    return [cx + (dx / d) * r, cz + (dz / d) * r];
  }
  // centre inside the box — push out along the shallowest axis
  const pushes: [number, number, number][] = [
    [box.minX - r, z, x - (box.minX - r)],
    [box.maxX + r, z, box.maxX + r - x],
    [x, box.minZ - r, z - (box.minZ - r)],
    [x, box.maxZ + r, box.maxZ + r - z],
  ];
  pushes.sort((a, b) => Math.abs(a[2]) - Math.abs(b[2]));
  return [pushes[0][0], pushes[0][1]];
}
