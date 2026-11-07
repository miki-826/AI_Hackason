"use client";

import { useFrame } from "@react-three/fiber";
import { memo, useMemo, useRef } from "react";
import type * as THREE from "three";
import type { FurnitureType } from "@/game-core/types";
import { brassMaterial, PALETTE, plainMaterial, woodMaterial } from "../materials";

/**
 * Procedural stand-in models built from primitives (spec 19-3 allows 仮モデル).
 * Each model sits on the floor at the origin with its front facing +Z and
 * matches the footprint in FURNITURE_DEFINITIONS. Swapping in GLB assets
 * later only means replacing these components.
 */

type ModelProps = { variant?: "present" | "memory" };

function Box({
  size,
  position,
  material,
  rotation,
  castShadow = true,
}: {
  size: [number, number, number];
  position: [number, number, number];
  material: THREE.Material;
  rotation?: [number, number, number];
  castShadow?: boolean;
}) {
  return (
    <mesh position={position} rotation={rotation} material={material} castShadow={castShadow} receiveShadow>
      <boxGeometry args={size} />
    </mesh>
  );
}

function Cyl({
  r,
  r2,
  h,
  position,
  material,
  rotation,
  seg = 12,
}: {
  r: number;
  r2?: number;
  h: number;
  position: [number, number, number];
  material: THREE.Material;
  rotation?: [number, number, number];
  seg?: number;
}) {
  return (
    <mesh position={position} rotation={rotation} material={material} castShadow receiveShadow>
      <cylinderGeometry args={[r, r2 ?? r, h, seg]} />
    </mesh>
  );
}

// ---------------------------------------------------------------- chair --
export const ChairModel = memo(function ChairModel({ variant = "present" }: ModelProps) {
  const wood = woodMaterial(variant === "memory" ? PALETTE.oak : PALETTE.walnut);
  const seatH = 0.46;
  const legs: [number, number][] = [
    [-0.21, 0.2],
    [0.21, 0.2],
    [-0.21, -0.2],
    [0.21, -0.2],
  ];
  return (
    <group>
      <Box size={[0.5, 0.05, 0.48]} position={[0, seatH, 0]} material={wood} />
      {legs.map(([x, z]) => (
        <Cyl key={`${x}${z}`} r={0.022} r2={0.017} h={seatH} position={[x, seatH / 2, z]} material={wood} />
      ))}
      {/* stretchers */}
      <Box size={[0.42, 0.02, 0.02]} position={[0, 0.14, 0.2]} material={wood} />
      <Box size={[0.42, 0.02, 0.02]} position={[0, 0.14, -0.2]} material={wood} />
      {/* spindle back */}
      <Cyl r={0.022} h={0.6} position={[-0.21, seatH + 0.3, -0.21]} material={wood} />
      <Cyl r={0.022} h={0.6} position={[0.21, seatH + 0.3, -0.21]} material={wood} />
      {[-0.13, -0.065, 0, 0.065, 0.13].map((x) => (
        <Cyl key={x} r={0.011} h={0.5} position={[x, seatH + 0.28, -0.215]} material={wood} />
      ))}
      <Box size={[0.5, 0.07, 0.045]} position={[0, seatH + 0.58, -0.215]} material={wood} />
      {/* the carved scratches on the backrest */}
      <Box
        size={[0.12, 0.012, 0.005]}
        position={[0.06, seatH + 0.58, -0.19]}
        material={plainMaterial("#2a1a0f", 0.9)}
        castShadow={false}
      />
    </group>
  );
});

// ---------------------------------------------------------------- clock --
export const ClockModel = memo(function ClockModel({ variant = "present" }: ModelProps) {
  const wood = woodMaterial(variant === "memory" ? PALETTE.mahogany : PALETTE.darkWalnut, 0.6);
  const brass = brassMaterial();
  const pendulum = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (pendulum.current) pendulum.current.rotation.z = Math.sin(clock.elapsedTime * Math.PI) * 0.16;
  });
  const faceMat = plainMaterial(variant === "memory" ? "#f3e6c8" : "#cfc4a8", 0.6);
  const ticks = useMemo(() => Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2), []);
  return (
    <group>
      <Box size={[0.62, 0.12, 0.42]} position={[0, 0.06, 0]} material={wood} />
      <Box size={[0.5, 1.3, 0.34]} position={[0, 0.77, 0]} material={wood} />
      <Box size={[0.6, 0.62, 0.4]} position={[0, 1.73, 0]} material={wood} />
      <Box size={[0.66, 0.08, 0.44]} position={[0, 2.08, 0]} material={wood} />
      <mesh position={[0, 2.16, 0]} material={wood} castShadow>
        <cylinderGeometry args={[0.2, 0.33, 0.1, 4, 1]} />
      </mesh>
      {/* face */}
      <mesh position={[0, 1.75, 0.205]} rotation={[Math.PI / 2, 0, 0]} material={brass}>
        <cylinderGeometry args={[0.235, 0.235, 0.02, 32]} />
      </mesh>
      <mesh position={[0, 1.75, 0.21]} rotation={[Math.PI / 2, 0, 0]} material={faceMat}>
        <cylinderGeometry args={[0.2, 0.2, 0.012, 32]} />
      </mesh>
      {ticks.map((a) => (
        <Box
          key={a}
          size={[0.012, 0.035, 0.004]}
          position={[Math.sin(a) * 0.17, 1.75 + Math.cos(a) * 0.17, 0.218]}
          rotation={[0, 0, -a]}
          material={plainMaterial(PALETTE.ink)}
          castShadow={false}
        />
      ))}
      {/* hands frozen at 3:15 */}
      <Box size={[0.012, 0.11, 0.004]} position={[0.035, 1.735, 0.222]} rotation={[0, 0, -Math.PI / 2 - 0.13]} material={plainMaterial(PALETTE.ink)} castShadow={false} />
      <Box size={[0.008, 0.16, 0.004]} position={[0.075, 1.75, 0.224]} rotation={[0, 0, -Math.PI / 2]} material={plainMaterial(PALETTE.ink)} castShadow={false} />
      {/* pendulum window */}
      <Box size={[0.3, 0.8, 0.01]} position={[0, 0.85, 0.172]} material={plainMaterial("#0c0a08", 0.4)} castShadow={false} />
      <group ref={pendulum} position={[0, 1.22, 0.18]}>
        <Box size={[0.012, 0.55, 0.008]} position={[0, -0.28, 0]} material={brass} castShadow={false} />
        <mesh position={[0, -0.58, 0]} rotation={[Math.PI / 2, 0, 0]} material={brass}>
          <cylinderGeometry args={[0.07, 0.07, 0.015, 24]} />
        </mesh>
      </group>
    </group>
  );
});

// ----------------------------------------------------------------- desk --
export const DeskModel = memo(function DeskModel({ variant = "present" }: ModelProps) {
  const wood = woodMaterial(variant === "memory" ? PALETTE.oak : PALETTE.walnut, 0.65);
  const dark = woodMaterial(PALETTE.darkWalnut);
  const brass = brassMaterial();
  const paper = plainMaterial(PALETTE.paper, 0.95);
  const legs: [number, number][] = [
    [-0.68, 0.31],
    [0.68, 0.31],
    [-0.68, -0.31],
    [0.68, -0.31],
  ];
  return (
    <group>
      <Box size={[1.5, 0.05, 0.75]} position={[0, 0.755, 0]} material={wood} />
      {legs.map(([x, z]) => (
        <Cyl key={`${x}${z}`} r={0.035} r2={0.025} h={0.73} position={[x, 0.365, z]} material={dark} />
      ))}
      {/* drawer banks */}
      <Box size={[0.42, 0.22, 0.66]} position={[-0.5, 0.62, 0]} material={wood} />
      <Box size={[0.42, 0.22, 0.66]} position={[0.5, 0.62, 0]} material={wood} />
      <Box size={[0.52, 0.12, 0.66]} position={[0, 0.67, 0]} material={wood} />
      {[-0.5, 0.5, 0].map((x) => (
        <Box key={x} size={[0.08, 0.016, 0.02]} position={[x, x === 0 ? 0.67 : 0.62, 0.34]} material={brass} castShadow={false} />
      ))}
      {/* keyhole */}
      <Cyl r={0.012} h={0.01} position={[0.5, 0.57, 0.335]} rotation={[Math.PI / 2, 0, 0]} material={plainMaterial("#0a0806")} />
      {/* papers, letter, inkwell, quill */}
      <Box size={[0.3, 0.004, 0.22]} position={[-0.25, 0.782, 0.08]} rotation={[0, 0.15, 0]} material={paper} castShadow={false} />
      <Box size={[0.26, 0.004, 0.2]} position={[0.08, 0.784, 0.12]} rotation={[0, -0.08, 0]} material={paper} castShadow={false} />
      <Cyl r={0.035} r2={0.045} h={0.06} position={[0.42, 0.81, -0.12]} material={plainMaterial("#101418", 0.3, 0.2)} />
      <mesh position={[0.45, 0.93, -0.12]} rotation={[0.2, 0, -0.35]} material={plainMaterial("#e9e4da", 0.9)}>
        <coneGeometry args={[0.025, 0.28, 6]} />
      </mesh>
      {/* small mantel clock */}
      <Box size={[0.14, 0.18, 0.08]} position={[-0.55, 0.87, -0.2]} material={plainMaterial("#6b6f72", 0.4, 0.6)} />
    </group>
  );
});

// ------------------------------------------------------------ bookshelf --
export const BookshelfModel = memo(function BookshelfModel({ variant = "present" }: ModelProps) {
  const wood = woodMaterial(variant === "memory" ? PALETTE.oak : PALETTE.darkWalnut, 0.75);
  const books = useMemo(() => {
    const colors = ["#5b2a22", "#2f3d33", "#3b3226", "#5a4a2c", "#28333f", "#6a4b35", "#433028"];
    const out: { x: number; y: number; w: number; h: number; c: string; tilt: number }[] = [];
    let s = 7;
    const rnd = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    const shelves = [0.12, 0.52, 0.92, 1.32, 1.72];
    shelves.forEach((y, si) => {
      let x = -0.53;
      while (x < 0.5) {
        const w = 0.03 + rnd() * 0.04;
        const h = 0.24 + rnd() * 0.12;
        // leave the gap where the photograph used to stand
        if (!(si === 3 && x > -0.1 && x < 0.18)) {
          out.push({ x: x + w / 2, y: y + h / 2 + 0.02, w, h, c: colors[Math.floor(rnd() * colors.length)], tilt: rnd() < 0.08 ? 0.25 : 0 });
        }
        x += w + 0.004;
      }
    });
    return out;
  }, []);
  return (
    <group>
      <Box size={[1.2, 2.1, 0.04]} position={[0, 1.05, -0.18]} material={wood} />
      <Box size={[0.04, 2.1, 0.4]} position={[-0.58, 1.05, 0]} material={wood} />
      <Box size={[0.04, 2.1, 0.4]} position={[0.58, 1.05, 0]} material={wood} />
      {[0.12, 0.52, 0.92, 1.32, 1.72, 2.08].map((y) => (
        <Box key={y} size={[1.14, 0.035, 0.38]} position={[0, y, 0]} material={wood} />
      ))}
      {books.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, 0.01]} rotation={[0, 0, b.tilt]} material={plainMaterial(b.c, 0.8)} castShadow>
          <boxGeometry args={[b.w, b.h, 0.26]} />
        </mesh>
      ))}
    </group>
  );
});

// --------------------------------------------------------------- drawer --
export const DrawerModel = memo(function DrawerModel({ variant = "present" }: ModelProps) {
  const wood = woodMaterial(variant === "memory" ? PALETTE.oak : PALETTE.walnut, 0.7);
  const brass = brassMaterial();
  return (
    <group>
      <Box size={[0.9, 0.95, 0.48]} position={[0, 0.5, 0]} material={wood} />
      <Box size={[0.94, 0.04, 0.5]} position={[0, 0.99, 0]} material={wood} />
      {[0.8, 0.52, 0.22].map((y, i) => (
        <group key={y} position={[0, y, i === 2 ? 0.3 : 0.245]}>
          <Box size={[0.82, 0.24, 0.02]} position={[0, 0, 0]} material={woodMaterial(PALETTE.oak, 0.65)} />
          <Box size={[0.12, 0.02, 0.025]} position={[0, 0.02, 0.02]} material={brass} castShadow={false} />
        </group>
      ))}
      {/* faded ribbon peeking out of the open bottom drawer */}
      <Box size={[0.05, 0.008, 0.12]} position={[0.15, 0.345, 0.22]} rotation={[0, 0.4, 0]} material={plainMaterial("#8c3b3b", 0.8)} castShadow={false} />
    </group>
  );
});

// --------------------------------------------------------------- mirror --
export const MirrorModel = memo(function MirrorModel({ variant = "present" }: ModelProps) {
  const wood = woodMaterial(variant === "memory" ? PALETTE.mahogany : PALETTE.darkWalnut, 0.55);
  const glass = plainMaterial(variant === "memory" ? "#d8d2c4" : "#7d878c", 0.12, 0.95);
  return (
    <group>
      <Box size={[0.8, 0.05, 0.32]} position={[0, 0.03, 0]} material={wood} />
      <Box size={[0.05, 1.8, 0.05]} position={[-0.37, 0.92, -0.05]} material={wood} />
      <Box size={[0.05, 1.8, 0.05]} position={[0.37, 0.92, -0.05]} material={wood} />
      <group position={[0, 1.15, -0.03]} rotation={[-0.06, 0, 0]}>
        <Box size={[0.66, 1.42, 0.05]} position={[0, 0, 0]} material={wood} />
        <mesh position={[0, 0, 0.028]} material={glass}>
          <planeGeometry args={[0.56, 1.3]} />
        </mesh>
        {/* haze */}
        <mesh position={[0, -0.1, 0.03]}>
          <planeGeometry args={[0.56, 1.0]} />
          <meshBasicMaterial color="#c9c3b5" transparent opacity={0.12} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
});

export const FURNITURE_MODELS: Record<FurnitureType, React.ComponentType<ModelProps>> = {
  chair: ChairModel,
  clock: ClockModel,
  desk: DeskModel,
  bookshelf: BookshelfModel,
  drawer: DrawerModel,
  mirror: MirrorModel,
};
