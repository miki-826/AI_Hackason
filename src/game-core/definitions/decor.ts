import type { Vec3 } from "../types";

/**
 * Set dressing: furniture with no memory (not interactive). It only makes the
 * room feel lived-in; placement never blocks the paths the puzzle needs.
 */
export type DecorType = "armchair" | "side_table" | "sideboard" | "coat_rack" | "trunk" | "crates" | "plant";

export type DecorDefinition = {
  type: DecorType;
  /** unrotated footprint (x width, z depth), front faces +Z */
  footprint: { w: number; d: number };
  height: number;
  slot: "wall" | "corner";
  /** distance kept from the wall behind it */
  wallGap: number;
};

export const DECOR_DEFINITIONS: Record<DecorType, DecorDefinition> = {
  armchair: { type: "armchair", footprint: { w: 0.86, d: 0.82 }, height: 1.1, slot: "wall", wallGap: 0.3 },
  side_table: { type: "side_table", footprint: { w: 0.5, d: 0.5 }, height: 0.65, slot: "wall", wallGap: 0.12 },
  sideboard: { type: "sideboard", footprint: { w: 1.6, d: 0.5 }, height: 0.92, slot: "wall", wallGap: 0.04 },
  coat_rack: { type: "coat_rack", footprint: { w: 0.5, d: 0.5 }, height: 1.85, slot: "corner", wallGap: 0.15 },
  trunk: { type: "trunk", footprint: { w: 0.95, d: 0.55 }, height: 0.55, slot: "wall", wallGap: 0.06 },
  crates: { type: "crates", footprint: { w: 0.8, d: 0.62 }, height: 1.0, slot: "corner", wallGap: 0.06 },
  plant: { type: "plant", footprint: { w: 0.48, d: 0.48 }, height: 1.3, slot: "corner", wallGap: 0.12 },
};

export type DecorInstance = { id: string; type: DecorType; position: Vec3; rotationY: number };

export type PaintingKind = "landscape" | "still_life" | "seascape";

export const PAINTINGS: Record<PaintingKind, { image: string; w: number; h: number }> = {
  landscape: { image: "/images/art/landscape.jpg", w: 0.9, h: 0.68 },
  still_life: { image: "/images/art/still-life.jpg", w: 0.56, h: 0.74 },
  seascape: { image: "/images/art/seascape.jpg", w: 0.9, h: 0.68 },
};

export type WallArt = { id: string; kind: PaintingKind; position: Vec3; rotationY: number };
