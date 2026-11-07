"use client";

import { memo, useMemo } from "react";
import * as THREE from "three";
import type { DecorType, PaintingKind } from "@/game-core/definitions/decor";
import { PAINTINGS } from "@/game-core/definitions/decor";
import { brassMaterial, PALETTE, photoTexture, plainMaterial, woodMaterial } from "../materials";
import { bunFoot, column, rbox, spindle, turnedLeg, vase } from "./geometry";

/** Non-interactive set dressing (no memories). Front faces +Z, floor at y=0. */
type V3 = [number, number, number];

function M({ geo, mat, p, r, shadow = true }: { geo: THREE.BufferGeometry; mat: THREE.Material; p?: V3; r?: V3; shadow?: boolean }) {
  return <mesh geometry={geo} material={mat} position={p} rotation={r} castShadow={shadow} receiveShadow />;
}

const fabric = (c: string) => plainMaterial(c, 0.95);

const Armchair = memo(function Armchair() {
  const wood = woodMaterial(PALETTE.darkWalnut, 0.5);
  const velvet = fabric("#4b3328");
  const cushion = fabric("#5a3d2e");
  return (
    <group>
      {[
        [-0.34, 0.3],
        [0.34, 0.3],
        [-0.34, -0.3],
        [0.34, -0.3],
      ].map(([x, z]) => (
        <M key={`${x}${z}`} geo={turnedLeg(0.16, 0.03)} mat={wood} p={[x, 0.08, z]} />
      ))}
      <M geo={rbox(0.8, 0.18, 0.74, 0.05)} mat={velvet} p={[0, 0.27, 0]} />
      <M geo={rbox(0.6, 0.12, 0.58, 0.05)} mat={cushion} p={[0, 0.41, 0.06]} />
      {/* back with wings */}
      <M geo={rbox(0.8, 0.72, 0.16, 0.06)} mat={velvet} p={[0, 0.72, -0.31]} r={[-0.12, 0, 0]} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <M geo={rbox(0.12, 0.26, 0.66, 0.05)} mat={velvet} p={[s * 0.36, 0.5, 0.02]} />
          <mesh position={[s * 0.36, 0.64, 0.02]} rotation={[Math.PI / 2, 0, 0]} material={velvet} castShadow>
            <cylinderGeometry args={[0.075, 0.075, 0.66, 16]} />
          </mesh>
          <M geo={rbox(0.12, 0.42, 0.24, 0.05)} mat={velvet} p={[s * 0.36, 0.86, -0.22]} r={[0, s * 0.15, 0]} />
        </group>
      ))}
      {/* a folded blanket left on the arm */}
      <M geo={rbox(0.2, 0.05, 0.46, 0.02)} mat={fabric("#7a6a4f")} p={[0.36, 0.73, 0.05]} r={[0, 0, 0.05]} />
    </group>
  );
});

const SideTable = memo(function SideTable() {
  const wood = woodMaterial(PALETTE.walnut, 0.45);
  const brass = brassMaterial();
  const shade = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#d9c39a", emissive: "#ffb565", emissiveIntensity: 0.55, roughness: 0.9, side: THREE.DoubleSide }),
    [],
  );
  return (
    <group>
      <mesh position={[0, 0.6, 0]} material={wood} castShadow receiveShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.035, 32]} />
      </mesh>
      <M geo={column(0.52, 0.035)} mat={wood} p={[0, 0.32, 0]} />
      {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((a) => (
        <M key={a} geo={rbox(0.05, 0.04, 0.24, 0.015)} mat={wood} p={[Math.sin(a) * 0.1, 0.03, Math.cos(a) * 0.1]} r={[0, a, 0]} />
      ))}
      {/* table lamp */}
      <M geo={vase(0.22, 0.07)} mat={plainMaterial("#3d4a52", 0.2, 0.2)} p={[0.02, 0.73, -0.02]} />
      <M geo={spindle(0.12, 0.008)} mat={brass} p={[0.02, 0.89, -0.02]} shadow={false} />
      <mesh position={[0.02, 1.0, -0.02]} material={shade}>
        <cylinderGeometry args={[0.08, 0.15, 0.17, 24, 1, true]} />
      </mesh>
      {/* a book left open */}
      <M geo={rbox(0.2, 0.025, 0.15, 0.004)} mat={plainMaterial("#e8dcc0", 0.95)} p={[-0.1, 0.63, 0.1]} r={[0, 0.5, 0]} shadow={false} />
    </group>
  );
});

const Sideboard = memo(function Sideboard() {
  const wood = woodMaterial(PALETTE.walnut, 0.42);
  const dark = woodMaterial(PALETTE.darkWalnut, 0.5);
  const brass = brassMaterial();
  return (
    <group>
      {[-0.72, 0.72].flatMap((x) => [0.18, -0.18].map((z) => [x, z])).map(([x, z]) => (
        <M key={`${x}${z}`} geo={bunFoot(0.045)} mat={dark} p={[x, 0.03, z]} />
      ))}
      <M geo={rbox(1.56, 0.78, 0.46, 0.012)} mat={wood} p={[0, 0.46, 0]} />
      <M geo={rbox(1.64, 0.045, 0.5, 0.015)} mat={dark} p={[0, 0.87, 0.005]} />
      {[-0.52, 0, 0.52].map((x) => (
        <group key={x} position={[x, 0.44, 0.232]}>
          <M geo={rbox(0.46, 0.62, 0.016, 0.006)} mat={dark} />
          <M geo={rbox(0.38, 0.52, 0.012, 0.005)} mat={wood} p={[0, 0, 0.01]} />
          <M geo={bunFoot(0.016)} mat={brass} p={[x === 0 ? 0 : -Math.sign(x) * 0.17, 0, 0.024]} shadow={false} />
        </group>
      ))}
      {/* objects on top: framed photos, a vase, a candle */}
      <M geo={rbox(0.18, 0.24, 0.02, 0.006)} mat={woodMaterial(PALETTE.darkWalnut, 0.4)} p={[-0.45, 1.01, -0.1]} r={[-0.15, 0.2, 0]} />
      <M geo={rbox(0.13, 0.18, 0.015, 0.005)} mat={brass} p={[-0.2, 0.98, -0.12]} r={[-0.15, -0.1, 0]} />
      <M geo={vase(0.3, 0.075)} mat={plainMaterial("#6e7b6a", 0.25, 0.05)} p={[0.45, 1.04, -0.05]} />
      <M geo={column(0.2, 0.03)} mat={brass} p={[0.1, 0.99, -0.08]} />
    </group>
  );
});

const CoatRack = memo(function CoatRack() {
  const wood = woodMaterial(PALETTE.darkWalnut, 0.45);
  const brass = brassMaterial();
  return (
    <group>
      {[0, 1, 2, 3].map((i) => (
        <M key={i} geo={rbox(0.05, 0.04, 0.42, 0.015)} mat={wood} p={[0, 0.03, 0]} r={[0, (i * Math.PI) / 4, 0]} />
      ))}
      <M geo={column(1.75, 0.035)} mat={wood} p={[0, 0.9, 0]} />
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2 + Math.PI / 4;
        return <M key={i} geo={spindle(0.16, 0.012)} mat={brass} p={[Math.sin(a) * 0.07, 1.68, Math.cos(a) * 0.07]} r={[Math.cos(a) * 0.9, 0, -Math.sin(a) * 0.9]} shadow={false} />;
      })}
      {/* an old coat and a hat */}
      <mesh position={[0.1, 1.28, 0.04]} rotation={[0, 0, -0.08]} material={fabric("#2f2a26")} castShadow>
        <cylinderGeometry args={[0.1, 0.2, 0.75, 16, 1, true]} />
      </mesh>
      <mesh position={[-0.06, 1.8, -0.04]} material={fabric("#3a2f26")} castShadow>
        <cylinderGeometry args={[0.07, 0.08, 0.1, 18]} />
      </mesh>
      <mesh position={[-0.06, 1.76, -0.04]} material={fabric("#3a2f26")} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.01, 24]} />
      </mesh>
    </group>
  );
});

const Trunk = memo(function Trunk() {
  const leather = plainMaterial("#4a3020", 0.7);
  const brass = brassMaterial();
  const strap = plainMaterial("#2b1c12", 0.8);
  return (
    <group>
      <M geo={rbox(0.92, 0.38, 0.52, 0.03)} mat={leather} p={[0, 0.2, 0]} />
      <M geo={rbox(0.94, 0.14, 0.54, 0.05)} mat={leather} p={[0, 0.45, 0]} />
      {[-0.25, 0.25].map((x) => (
        <M key={x} geo={rbox(0.06, 0.53, 0.56, 0.01)} mat={strap} p={[x, 0.27, 0]} shadow={false} />
      ))}
      {[-0.44, 0.44].flatMap((x) => [0.25, -0.25].map((z) => [x, z])).map(([x, z]) => (
        <M key={`${x}${z}`} geo={rbox(0.07, 0.07, 0.07, 0.012)} mat={brass} p={[x, 0.44, z]} shadow={false} />
      ))}
      <M geo={rbox(0.1, 0.08, 0.02, 0.008)} mat={brass} p={[0, 0.39, 0.27]} shadow={false} />
    </group>
  );
});

function CrateBox({ crate, slat, p, s, r }: { crate: THREE.Material; slat: THREE.Material; p: V3; s: number; r: number }) {
  return (
    <group position={p} rotation={[0, r, 0]}>
      <M geo={rbox(s, s * 0.8, s * 0.8, 0.008)} mat={crate} />
      {[-1, 1].map((k) => (
        <M key={k} geo={rbox(s + 0.01, 0.04, 0.03, 0.005)} mat={slat} p={[0, k * s * 0.25, s * 0.4 + 0.012]} shadow={false} />
      ))}
    </group>
  );
}

const Crates = memo(function Crates() {
  const crate = woodMaterial("#8a6a48", 0.85);
  const slat = woodMaterial("#6a5038", 0.85);
  return (
    <group>
      <CrateBox crate={crate} slat={slat} p={[-0.12, 0.24, 0]} s={0.56} r={0.05} />
      <CrateBox crate={crate} slat={slat} p={[0.2, 0.2, 0.02]} s={0.46} r={-0.12} />
      <CrateBox crate={crate} slat={slat} p={[-0.06, 0.66, -0.02]} s={0.42} r={0.25} />
      {/* papers sticking out */}
      <M geo={rbox(0.2, 0.004, 0.28, 0.001)} mat={plainMaterial("#d8ccb0", 0.95)} p={[-0.06, 0.84, 0.02]} r={[0.1, 0.3, 0.05]} shadow={false} />
    </group>
  );
});

const Plant = memo(function Plant() {
  const pot = plainMaterial("#7a4a32", 0.8);
  const dry = plainMaterial("#6b5a3a", 0.9);
  const twigs = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2;
        return { a, tilt: 0.25 + (i % 3) * 0.12, len: 0.55 + (i % 4) * 0.12 };
      }),
    [],
  );
  return (
    <group>
      <M geo={vase(0.42, 0.2)} mat={pot} p={[0, 0.21, 0]} />
      <mesh position={[0, 0.4, 0]} material={plainMaterial("#2a1e14", 1)}>
        <cylinderGeometry args={[0.15, 0.15, 0.02, 20]} />
      </mesh>
      {twigs.map((t, i) => (
        <mesh
          key={i}
          position={[Math.sin(t.a) * Math.sin(t.tilt) * t.len * 0.5, 0.4 + Math.cos(t.tilt) * t.len * 0.5, Math.cos(t.a) * Math.sin(t.tilt) * t.len * 0.5]}
          rotation={[Math.cos(t.a) * t.tilt, 0, -Math.sin(t.a) * t.tilt]}
          material={dry}
          castShadow
        >
          <cylinderGeometry args={[0.004, 0.009, t.len, 5]} />
        </mesh>
      ))}
    </group>
  );
});

export const DECOR_MODELS: Record<DecorType, React.ComponentType> = {
  armchair: Armchair,
  side_table: SideTable,
  sideboard: Sideboard,
  coat_rack: CoatRack,
  trunk: Trunk,
  crates: Crates,
  plant: Plant,
};

/** Framed oil painting hung on a wall (image generated with ChatGPT). */
export const Painting = memo(function Painting({ kind }: { kind: PaintingKind }) {
  const def = PAINTINGS[kind];
  const frame = woodMaterial(PALETTE.darkWalnut, 0.35);
  const canvas = useMemo(
    () => new THREE.MeshStandardMaterial({ map: photoTexture(def.image), roughness: 0.75, color: "#d8d0c4" }),
    [def.image],
  );
  const f = 0.07;
  return (
    <group>
      <mesh position={[0, 0, 0.012]} material={canvas}>
        <planeGeometry args={[def.w, def.h]} />
      </mesh>
      <M geo={rbox(def.w + f * 2, f, 0.05, 0.012)} mat={frame} p={[0, def.h / 2 + f / 2, 0.02]} shadow={false} />
      <M geo={rbox(def.w + f * 2, f, 0.05, 0.012)} mat={frame} p={[0, -def.h / 2 - f / 2, 0.02]} shadow={false} />
      <M geo={rbox(f, def.h, 0.05, 0.012)} mat={frame} p={[-def.w / 2 - f / 2, 0, 0.02]} shadow={false} />
      <M geo={rbox(f, def.h, 0.05, 0.012)} mat={frame} p={[def.w / 2 + f / 2, 0, 0.02]} shadow={false} />
      <M geo={rbox(def.w + 0.02, def.h + 0.02, 0.008, 0.002)} mat={brassMaterial()} p={[0, 0, 0.008]} shadow={false} />
    </group>
  );
});
