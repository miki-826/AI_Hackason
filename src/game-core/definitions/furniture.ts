import type { FurnitureType, MemoryTargetId, Vec3 } from "../types";

export type SlotKind = "center" | "wall";

export type FurnitureDefinition = {
  type: FurnitureType;
  name: string;
  /** short line shown in the inspect panel */
  description: string;
  /** text shown when the player chooses 「調査する」 */
  examineText: string;
  required: boolean;
  slot: SlotKind;
  /** unrotated footprint (x width, z depth) in metres, front faces +Z */
  footprint: { w: number; d: number };
  height: number;
  /** local-space point (relative to the item) the raycast prompt is centred on */
  focusPoint: Vec3;
  /**
   * Where the "object's eye" sits inside the memory set, and what it looks at
   * first. Coordinates are in MEMORY SET space (see MEMORY_TARGETS).
   */
  memoryAnchor: { position: Vec3; lookAt: MemoryTargetId };
  /** accent colour used for icons / journal chips */
  sigil: string;
};

export const FURNITURE_DEFINITIONS: Record<FurnitureType, FurnitureDefinition> = {
  chair: {
    type: "chair",
    name: "古びた椅子",
    description: "背もたれの塗装が擦り切れた食卓の椅子。座面に小さな傷が並んでいる。",
    examineText:
      "背もたれの裏に、子どもの字で刻まれた傷がある。何かの数字を数えたように見えるが、ここからは読み取れない。椅子は、ずっと誰かを待っていたように温かい。",
    required: true,
    slot: "center",
    footprint: { w: 0.58, d: 0.58 },
    height: 1.05,
    focusPoint: [0, 0.7, 0],
    memoryAnchor: { position: [-0.35, 1.38, 1.62], lookAt: "dining_table" },
    sigil: "#c79a5b",
  },
  clock: {
    type: "clock",
    name: "振り子時計",
    description: "背の高い柱時計。振り子は揺れているのに、針は一度も進まない。",
    examineText:
      "文字盤のガラスに細いひびが入っている。針は三時十五分を指したまま動かない。振り子の音だけが、部屋の時間を刻んでいる。",
    required: true,
    slot: "wall",
    footprint: { w: 0.68, d: 0.46 },
    height: 2.2,
    focusPoint: [0, 1.6, 0.2],
    memoryAnchor: { position: [-2.6, 1.9, -2.15], lookAt: "family" },
    sigil: "#b8925a",
  },
  desk: {
    type: "desk",
    name: "書斎机",
    description: "インクの染みが残る書斎机。引き出しの一つに鍵穴がある。",
    examineText:
      "机の上には封の切られていない便箋が一枚。インク壺は乾ききっているのに、ペン先だけが濡れている。誰かが最後に何かを書こうとした跡だ。",
    required: true,
    slot: "wall",
    footprint: { w: 1.58, d: 0.8 },
    height: 0.78,
    focusPoint: [0, 0.85, 0.1],
    memoryAnchor: { position: [2.75, 0.98, -2.05], lookAt: "letter" },
    sigil: "#8f6a43",
  },
  bookshelf: {
    type: "bookshelf",
    name: "本棚",
    description: "背表紙の褪せた本が並ぶ。一段だけ、本が抜き取られた隙間がある。",
    examineText:
      "抜き取られた隙間の奥に、写真立ての跡が四角く残っている。埃のない四角形は、まだ新しい。",
    required: false,
    slot: "wall",
    footprint: { w: 1.3, d: 0.46 },
    height: 2.1,
    focusPoint: [0, 1.3, 0.15],
    memoryAnchor: { position: [-2.95, 1.95, 0.8], lookAt: "family" },
    sigil: "#6f9a99",
  },
  drawer: {
    type: "drawer",
    name: "引き出し収納",
    description: "真鍮の取っ手がついた小さな収納箱。最下段だけ少し開いている。",
    examineText: "開いた隙間から、色褪せたリボンの端がのぞいている。贈り物を包んでいたもののようだ。",
    required: false,
    slot: "wall",
    footprint: { w: 0.98, d: 0.56 },
    height: 1.0,
    focusPoint: [0, 0.7, 0.2],
    memoryAnchor: { position: [1.8, 0.78, 2.4], lookAt: "drawer" },
    sigil: "#9c7b54",
  },
  mirror: {
    type: "mirror",
    name: "姿見",
    description: "曇った姿見。覗き込んでも、自分の顔がはっきり映らない。",
    examineText: "鏡の縁に、誰かが指でなぞった跡がある。映っているのは自分のはずなのに、少しだけ若く見える。",
    required: false,
    slot: "wall",
    footprint: { w: 0.82, d: 0.4 },
    height: 1.9,
    focusPoint: [0, 1.25, 0.1],
    memoryAnchor: { position: [-1.4, 1.55, 2.8], lookAt: "mirror" },
    sigil: "#8fa3ad",
  },
};

export const REQUIRED_FURNITURE: FurnitureType[] = ["chair", "clock", "desk"];
export const OPTIONAL_FURNITURE: FurnitureType[] = ["bookshelf", "drawer", "mirror"];

/** Points inside the memory set (the "past" version of the room). */
export const MEMORY_TARGETS: Record<MemoryTargetId, Vec3> = {
  dining_table: [0, 0.85, 0],
  clock_face: [-2.6, 1.9, -2.38],
  letter: [2.3, 0.8, -2.25],
  family: [0, 1.1, -0.1],
  old_door: [0, 1.3, -3.6],
  drawer: [1.6, 0.7, 1.75],
  mirror: [-1.4, 1.35, 1.75],
  bookshelf: [-2.3, 1.2, 0.8],
};

/**
 * Where an actor stands when an event points at a place. Targets not listed
 * here mean "at the table" (the actor's own seat).
 */
export const MEMORY_STAGE_POINTS: Partial<Record<MemoryTargetId, Vec3>> = {
  clock_face: [-2.6, 0, -1.85],
  letter: [2.3, 0, -1.55],
  drawer: [1.6, 0, 1.8],
  mirror: [-1.4, 0, 1.65],
  bookshelf: [-2.25, 0, 0.8],
  old_door: [0, 0, -2.9],
};

export function furnitureIdFor(type: FurnitureType, index = 1): string {
  return `${type}_${String(index).padStart(3, "0")}`;
}

export function furnitureTypeFromId(id: string): FurnitureType | null {
  const type = id.split("_")[0] as FurnitureType;
  return type in FURNITURE_DEFINITIONS ? type : null;
}
