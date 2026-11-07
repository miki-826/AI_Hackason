"use client";

import { useFrame } from "@react-three/fiber";
import { memo, useMemo, useRef } from "react";
import * as THREE from "three";
import type { FurnitureType } from "@/game-core/types";
import { brassMaterial, PALETTE, plainMaterial, woodMaterial } from "../materials";
import { bailHandle, bowRail, bunFoot, column, finial, ovalDisc, ovalRing, rbox, spindle, turnedLeg, vase } from "./geometry";

/**
 * Procedural antique furniture (no external model files).
 * Each model stands on the floor at the origin, front facing +Z, and matches
 * the footprint in FURNITURE_DEFINITIONS. Geometry is shared and cached.
 */
type ModelProps = { variant?: "present" | "memory" };
type V3 = [number, number, number];

function M({ geo, mat, p, r, s, shadow = true }: { geo: THREE.BufferGeometry; mat: THREE.Material; p?: V3; r?: V3; s?: V3; shadow?: boolean }) {
  return <mesh geometry={geo} material={mat} position={p} rotation={r} scale={s} castShadow={shadow} receiveShadow />;
}

const glass = new THREE.MeshPhysicalMaterial({ color: "#c9d6dc", roughness: 0.05, metalness: 0, transparent: true, opacity: 0.18, clearcoat: 1 });
const mirrorGlass = new THREE.MeshStandardMaterial({ color: "#d8dde0", roughness: 0.04, metalness: 1 });
const mirrorGlassMemory = new THREE.MeshStandardMaterial({ color: "#efe6d6", roughness: 0.06, metalness: 1 });

// ---------------------------------------------------------------- chair --
export const ChairModel = memo(function ChairModel({ variant = "present" }: ModelProps) {
  const wood = woodMaterial(variant === "memory" ? PALETTE.oak : PALETTE.walnut, 0.55);
  const seatH = 0.46;
  const legs: [number, number, number, number][] = [
    [-0.2, 0.19, -0.06, 0.06],
    [0.2, 0.19, -0.06, -0.06],
    [-0.19, -0.18, 0.06, 0.06],
    [0.19, -0.18, 0.06, -0.06],
  ];
  return (
    <group>
      {/* saddle seat */}
      <M geo={rbox(0.5, 0.045, 0.47, 0.018)} mat={wood} p={[0, seatH, 0.005]} />
      <M geo={rbox(0.44, 0.012, 0.4, 0.006)} mat={woodMaterial(variant === "memory" ? PALETTE.oak : PALETTE.darkWalnut, 0.5)} p={[0, seatH + 0.026, 0.01]} />
      {/* splayed turned legs */}
      {legs.map(([x, z, rx, rz]) => (
        <M key={`${x}${z}`} geo={turnedLeg(seatH - 0.02, 0.026)} mat={wood} p={[x, (seatH - 0.02) / 2, z]} r={[rx, 0, rz]} s={[1, 1, 1]} />
      ))}
      {/* H stretcher */}
      <M geo={spindle(0.36, 0.012)} mat={wood} p={[-0.205, 0.16, 0]} r={[Math.PI / 2, 0, 0]} />
      <M geo={spindle(0.36, 0.012)} mat={wood} p={[0.205, 0.16, 0]} r={[Math.PI / 2, 0, 0]} />
      <M geo={spindle(0.4, 0.011)} mat={wood} p={[0, 0.17, 0]} r={[0, 0, Math.PI / 2]} />
      {/* back posts + spindles + bent crest rail */}
      {[-0.205, 0.205].map((x) => (
        <M key={x} geo={spindle(0.6, 0.02)} mat={wood} p={[x, seatH + 0.3, -0.205]} r={[-0.1, 0, 0]} />
      ))}
      {[-0.12, -0.06, 0, 0.06, 0.12].map((x) => (
        <M key={x} geo={spindle(0.52, 0.0095)} mat={wood} p={[x, seatH + 0.27, -0.212]} r={[-0.1, 0, 0]} />
      ))}
      <group position={[0, seatH + 0.57, -0.238]} rotation={[-0.1, 0, 0]}>
        <M geo={bowRail(0.43, 0.05, 0.022)} mat={wood} />
      </group>
      {/* the carved tally marks on the crest rail */}
      {[0, 1, 2, 3].map((i) => (
        <M key={i} geo={rbox(0.003, 0.03, 0.004, 0.001)} mat={plainMaterial("#1e130b", 0.9)} p={[0.03 + i * 0.012, seatH + 0.575, -0.214]} shadow={false} />
      ))}
    </group>
  );
});

// ---------------------------------------------------------------- clock --
export const ClockModel = memo(function ClockModel({ variant = "present" }: ModelProps) {
  const wood = woodMaterial(variant === "memory" ? PALETTE.mahogany : PALETTE.darkWalnut, 0.42);
  const trim = woodMaterial(variant === "memory" ? PALETTE.oak : PALETTE.walnut, 0.4);
  const brass = brassMaterial();
  const ink = plainMaterial(PALETTE.ink, 0.5);
  const pendulum = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (pendulum.current) pendulum.current.rotation.z = Math.sin(clock.elapsedTime * Math.PI) * 0.14;
  });
  const faceMat = plainMaterial(variant === "memory" ? "#f4ead2" : "#d8ccb0", 0.55);
  const ticks = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);
  return (
    <group>
      {/* plinth with bun feet */}
      {[
        [-0.25, 0.16],
        [0.25, 0.16],
        [-0.25, -0.15],
        [0.25, -0.15],
      ].map(([x, z]) => (
        <M key={`${x}${z}`} geo={bunFoot(0.045)} mat={trim} p={[x, 0.03, z]} />
      ))}
      <M geo={rbox(0.62, 0.26, 0.42, 0.012)} mat={wood} p={[0, 0.19, 0]} />
      <M geo={rbox(0.5, 0.18, 0.02, 0.006)} mat={trim} p={[0, 0.19, 0.212]} />
      <M geo={rbox(0.58, 0.04, 0.4, 0.01)} mat={trim} p={[0, 0.34, 0]} />
      {/* trunk with glazed door */}
      <M geo={rbox(0.48, 1.06, 0.34, 0.01)} mat={wood} p={[0, 0.88, 0]} />
      <M geo={rbox(0.38, 0.88, 0.02, 0.006)} mat={trim} p={[0, 0.9, 0.172]} />
      <M geo={rbox(0.3, 0.78, 0.01, 0.004)} mat={plainMaterial("#0d0a07", 0.6)} p={[0, 0.9, 0.18]} shadow={false} />
      <mesh position={[0, 0.9, 0.188]} material={glass}>
        <planeGeometry args={[0.3, 0.78]} />
      </mesh>
      {/* pendulum + weights */}
      <group ref={pendulum} position={[0, 1.26, 0.168]}>
        <M geo={rbox(0.01, 0.62, 0.006, 0.002)} mat={brass} p={[0, -0.31, 0]} shadow={false} />
        <mesh position={[0, -0.64, 0]} rotation={[Math.PI / 2, 0, 0]} material={brass}>
          <cylinderGeometry args={[0.065, 0.065, 0.014, 32]} />
        </mesh>
      </group>
      {[-0.08, 0.08].map((x) => (
        <M key={x} geo={vase(0.16, 0.026)} mat={brass} p={[x, 1.08, 0.14]} r={[Math.PI, 0, 0]} shadow={false} />
      ))}
      <M geo={rbox(0.58, 0.05, 0.4, 0.012)} mat={trim} p={[0, 1.43, 0]} />
      {/* hood with columns, dial and arched pediment */}
      <M geo={rbox(0.54, 0.56, 0.38, 0.01)} mat={wood} p={[0, 1.73, 0]} />
      {[-0.245, 0.245].map((x) => (
        <M key={x} geo={column(0.52, 0.022)} mat={trim} p={[x, 1.73, 0.19]} />
      ))}
      <mesh position={[0, 1.75, 0.192]} rotation={[Math.PI / 2, 0, 0]} material={brass}>
        <cylinderGeometry args={[0.215, 0.215, 0.012, 48]} />
      </mesh>
      <mesh position={[0, 1.75, 0.199]} rotation={[Math.PI / 2, 0, 0]} material={faceMat}>
        <cylinderGeometry args={[0.19, 0.19, 0.008, 48]} />
      </mesh>
      {ticks.map((i) => {
        const a = (i / 60) * Math.PI * 2;
        const hour = i % 5 === 0;
        return (
          <M
            key={i}
            geo={rbox(hour ? 0.01 : 0.004, hour ? 0.032 : 0.012, 0.003, 0.001)}
            mat={ink}
            p={[Math.sin(a) * (hour ? 0.158 : 0.168), 1.75 + Math.cos(a) * (hour ? 0.158 : 0.168), 0.205]}
            r={[0, 0, -a]}
            shadow={false}
          />
        );
      })}
      {/* hands frozen at 3:15 */}
      <M geo={rbox(0.012, 0.1, 0.003, 0.002)} mat={ink} p={[0.04, 1.738, 0.209]} r={[0, 0, -Math.PI / 2 - 0.13]} shadow={false} />
      <M geo={rbox(0.008, 0.15, 0.003, 0.002)} mat={ink} p={[0.07, 1.75, 0.211]} r={[0, 0, -Math.PI / 2]} shadow={false} />
      <mesh position={[0, 1.75, 0.214]} rotation={[Math.PI / 2, 0, 0]} material={brass}>
        <cylinderGeometry args={[0.012, 0.012, 0.006, 16]} />
      </mesh>
      <M geo={rbox(0.62, 0.05, 0.42, 0.012)} mat={trim} p={[0, 2.03, 0]} />
      <mesh position={[0, 2.06, 0.0]} rotation={[0, 0, 0]} material={wood} castShadow>
        <cylinderGeometry args={[0.26, 0.26, 0.38, 32, 1, false, -Math.PI / 2, Math.PI]} />
      </mesh>
      {[-0.27, 0, 0.27].map((x) => (
        <M key={x} geo={finial(0.12, 0.03)} mat={brass} p={[x, x === 0 ? 2.38 : 2.12, 0.05]} shadow={false} />
      ))}
    </group>
  );
});

// ----------------------------------------------------------------- desk --
export const DeskModel = memo(function DeskModel({ variant = "present" }: ModelProps) {
  const wood = woodMaterial(variant === "memory" ? PALETTE.oak : PALETTE.walnut, 0.45);
  const dark = woodMaterial(PALETTE.darkWalnut, 0.5);
  const brass = brassMaterial();
  const paper = plainMaterial(PALETTE.paper, 0.95);
  const leather = plainMaterial(variant === "memory" ? "#3f5a3a" : "#26352a", 0.75);
  const legs: [number, number][] = [
    [-0.68, 0.3],
    [0.68, 0.3],
    [-0.68, -0.3],
    [0.68, -0.3],
  ];
  return (
    <group>
      {/* top with overhang and inset leather */}
      <M geo={rbox(1.52, 0.045, 0.76, 0.014)} mat={wood} p={[0, 0.755, 0]} />
      <M geo={rbox(1.1, 0.004, 0.46, 0.002)} mat={leather} p={[0, 0.779, 0.04]} shadow={false} />
      {/* apron + drawer pedestals */}
      <M geo={rbox(1.4, 0.12, 0.66, 0.008)} mat={wood} p={[0, 0.67, 0]} />
      {[-0.5, 0.5].map((x) => (
        <group key={x}>
          <M geo={rbox(0.4, 0.5, 0.64, 0.008)} mat={wood} p={[x, 0.4, 0]} />
          {[0.53, 0.37, 0.21].map((y) => (
            <group key={y} position={[x, y, 0.322]}>
              <M geo={rbox(0.36, 0.14, 0.016, 0.006)} mat={dark} />
              <M geo={rbox(0.3, 0.09, 0.01, 0.004)} mat={wood} p={[0, 0, 0.01]} />
              <M geo={bailHandle(0.07, 0.004)} mat={brass} p={[0, -0.01, 0.022]} r={[0, 0, Math.PI]} shadow={false} />
            </group>
          ))}
        </group>
      ))}
      {/* centre drawer with keyhole */}
      <group position={[0, 0.67, 0.332]}>
        <M geo={rbox(0.5, 0.09, 0.014, 0.005)} mat={dark} />
        <mesh position={[0, 0, 0.009]} rotation={[Math.PI / 2, 0, 0]} material={brass}>
          <cylinderGeometry args={[0.018, 0.018, 0.004, 20]} />
        </mesh>
        <M geo={rbox(0.006, 0.016, 0.004, 0.001)} mat={plainMaterial("#050403")} p={[0, -0.002, 0.012]} shadow={false} />
      </group>
      {/* turned feet under the pedestals */}
      {legs.map(([x, z]) => (
        <M key={`${x}${z}`} geo={turnedLeg(0.16, 0.032)} mat={dark} p={[x * 0.75 + (x > 0 ? -0.02 : 0.02), 0.08, z]} />
      ))}
      {/* writing set */}
      <M geo={rbox(0.21, 0.003, 0.297, 0.001)} mat={paper} p={[-0.08, 0.784, 0.08]} r={[0, 0.12, 0]} shadow={false} />
      <M geo={rbox(0.21, 0.003, 0.297, 0.001)} mat={plainMaterial("#efe5cf", 0.95)} p={[0.16, 0.785, 0.1]} r={[0, -0.1, 0]} shadow={false} />
      <M geo={vase(0.07, 0.04)} mat={plainMaterial("#11161b", 0.15, 0.3)} p={[0.48, 0.815, -0.16]} />
      <mesh position={[0.5, 0.93, -0.15]} rotation={[0.25, 0, -0.32]} material={plainMaterial("#ece6da", 0.9)}>
        <coneGeometry args={[0.022, 0.3, 8]} />
      </mesh>
      {/* candlestick */}
      <M geo={column(0.2, 0.03)} mat={brass} p={[-0.55, 0.88, -0.2]} />
      <mesh position={[-0.55, 1.03, -0.2]} material={plainMaterial("#efe6d2", 0.6)}>
        <cylinderGeometry args={[0.012, 0.012, 0.1, 12]} />
      </mesh>
      {/* stacked books */}
      <M geo={rbox(0.18, 0.04, 0.25, 0.006)} mat={plainMaterial("#5b2a22", 0.7)} p={[-0.3, 0.8, -0.2]} r={[0, 0.2, 0]} />
      <M geo={rbox(0.16, 0.035, 0.23, 0.006)} mat={plainMaterial("#2f3d33", 0.7)} p={[-0.3, 0.838, -0.2]} r={[0, 0.05, 0]} />
    </group>
  );
});

// ------------------------------------------------------------ bookshelf --
export const BookshelfModel = memo(function BookshelfModel({ variant = "present" }: ModelProps) {
  const wood = woodMaterial(variant === "memory" ? PALETTE.oak : PALETTE.darkWalnut, 0.55);
  const trim = woodMaterial(variant === "memory" ? PALETTE.oak : PALETTE.walnut, 0.5);
  const books = useMemo(() => {
    const colors = ["#5b2a22", "#2f3d33", "#3b3226", "#5a4a2c", "#28333f", "#6a4b35", "#433028", "#6d5a3a", "#3a2230"];
    const out: { x: number; y: number; w: number; h: number; d: number; c: string; tilt: number }[] = [];
    let s = 7;
    const rnd = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    const shelves = [0.14, 0.54, 0.94, 1.34, 1.72];
    shelves.forEach((y, si) => {
      let x = -0.52;
      while (x < 0.5) {
        const w = 0.04 + rnd() * 0.035;
        const h = 0.2 + rnd() * (si === 4 ? 0.04 : si === 3 ? 0.08 : 0.12);
        const gap = si === 3 && x > -0.12 && x < 0.2; // where the photograph stood
        if (!gap) {
          const leaning = rnd() < 0.05;
          out.push({ x: x + w / 2, y: y + h / 2 + 0.02, w, h, d: 0.2 + rnd() * 0.06, c: colors[Math.floor(rnd() * colors.length)], tilt: leaning ? 0.22 : 0 });
        }
        x += w + 0.006;
      }
    });
    return out;
  }, []);
  return (
    <group>
      {/* carcass, plinth, cornice */}
      <M geo={rbox(1.2, 2.0, 0.03, 0.006)} mat={wood} p={[0, 1.05, -0.185]} />
      <M geo={rbox(0.045, 2.0, 0.4, 0.008)} mat={wood} p={[-0.578, 1.05, 0]} />
      <M geo={rbox(0.045, 2.0, 0.4, 0.008)} mat={wood} p={[0.578, 1.05, 0]} />
      <M geo={rbox(1.24, 0.1, 0.42, 0.012)} mat={trim} p={[0, 0.05, 0.005]} />
      <M geo={rbox(1.28, 0.06, 0.44, 0.014)} mat={trim} p={[0, 2.05, 0.01]} />
      <M geo={rbox(1.22, 0.05, 0.41, 0.01)} mat={wood} p={[0, 2.0, 0.005]} />
      {[0.12, 0.52, 0.92, 1.32, 1.7].map((y) => (
        <M key={y} geo={rbox(1.12, 0.03, 0.37, 0.008)} mat={wood} p={[0, y, 0]} />
      ))}
      {books.map((b, i) => (
        <M key={i} geo={rbox(b.w, b.h, b.d, 0.004)} mat={plainMaterial(b.c, 0.75)} p={[b.x, b.y, 0.02]} r={[0, 0, b.tilt]} shadow={false} />
      ))}
      {/* a small vase and a box on the top shelf */}
      <M geo={vase(0.16, 0.05)} mat={plainMaterial("#3d5560", 0.25, 0.1)} p={[0.38, 1.8, 0.02]} />
      <M geo={rbox(0.16, 0.08, 0.12, 0.01)} mat={trim} p={[-0.38, 1.76, 0.02]} />
    </group>
  );
});

// --------------------------------------------------------------- drawer --
export const DrawerModel = memo(function DrawerModel({ variant = "present" }: ModelProps) {
  const wood = woodMaterial(variant === "memory" ? PALETTE.oak : PALETTE.walnut, 0.45);
  const dark = woodMaterial(PALETTE.darkWalnut, 0.5);
  const brass = brassMaterial();
  return (
    <group>
      {[
        [-0.38, 0.19],
        [0.38, 0.19],
        [-0.38, -0.19],
        [0.38, -0.19],
      ].map(([x, z]) => (
        <M key={`${x}${z}`} geo={bunFoot(0.04)} mat={dark} p={[x, 0.025, z]} />
      ))}
      <M geo={rbox(0.86, 0.9, 0.46, 0.012)} mat={wood} p={[0, 0.5, 0]} />
      <M geo={rbox(0.94, 0.04, 0.5, 0.016)} mat={dark} p={[0, 0.97, 0.005]} />
      <M geo={rbox(0.9, 0.05, 0.48, 0.012)} mat={dark} p={[0, 0.07, 0.005]} />
      {[0.8, 0.53, 0.25].map((y, i) => {
        const open = i === 2 ? 0.07 : 0;
        return (
          <group key={y} position={[0, y, 0.236 + open]}>
            <M geo={rbox(0.78, 0.22, 0.018, 0.006)} mat={dark} />
            <M geo={rbox(0.7, 0.15, 0.012, 0.005)} mat={wood} p={[0, 0, 0.011]} />
            {[-0.2, 0.2].map((x) => (
              <M key={x} geo={bunFoot(0.017)} mat={brass} p={[x, 0, 0.026]} r={[Math.PI / 2, 0, 0]} shadow={false} />
            ))}
          </group>
        );
      })}
      {/* faded ribbon peeking out of the open bottom drawer */}
      <M geo={rbox(0.05, 0.006, 0.14, 0.002)} mat={plainMaterial("#8c3b3b", 0.8)} p={[0.15, 0.37, 0.25]} r={[0, 0.4, 0]} shadow={false} />
    </group>
  );
});

// --------------------------------------------------------------- mirror --
export const MirrorModel = memo(function MirrorModel({ variant = "present" }: ModelProps) {
  const wood = woodMaterial(variant === "memory" ? PALETTE.mahogany : PALETTE.darkWalnut, 0.4);
  const brass = brassMaterial();
  return (
    <group>
      {/* trestle feet */}
      {[-0.34, 0.34].map((x) => (
        <group key={x}>
          <M geo={rbox(0.06, 0.05, 0.34, 0.014)} mat={wood} p={[x, 0.03, 0]} />
          <M geo={column(1.62, 0.03)} mat={wood} p={[x, 0.86, -0.02]} />
          <M geo={finial(0.1, 0.03)} mat={brass} p={[x, 1.72, -0.02]} shadow={false} />
        </group>
      ))}
      <M geo={spindle(0.62, 0.016)} mat={wood} p={[0, 0.24, -0.02]} r={[0, 0, Math.PI / 2]} />
      {/* tilting oval glass */}
      <group position={[0, 1.08, -0.02]} rotation={[-0.07, 0, 0]}>
        <M geo={ovalRing(0.27, 0.6, 0.035)} mat={wood} />
        <mesh position={[0, 0, -0.01]} geometry={ovalDisc(0.27, 0.6)} material={wood} />
        <mesh position={[0, 0, 0.004]} geometry={ovalDisc(0.255, 0.585)} material={variant === "memory" ? mirrorGlassMemory : mirrorGlass} />
        {/* faint haze on the glass */}
        <mesh position={[0, -0.12, 0.007]} geometry={ovalDisc(0.2, 0.36)}>
          <meshBasicMaterial color="#c9c3b5" transparent opacity={0.08} depthWrite={false} />
        </mesh>
        {[-0.3, 0.3].map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={brass}>
            <cylinderGeometry args={[0.018, 0.018, 0.06, 16]} />
          </mesh>
        ))}
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

