"use client";

import { useFrame } from "@react-three/fiber";
import { memo, useMemo, useRef } from "react";
import * as THREE from "three";
import { FURNITURE_DEFINITIONS } from "@/game-core/definitions/furniture";
import { EXIT_DOOR_INTERACTION_ID, ROOM, SEAL_PANEL, SEAL_PANEL_INTERACTION_ID } from "@/game-core/definitions/room";
import type { FurnitureInstance as FurnitureInstanceData } from "@/game-core/types";
import { createRng } from "@/game-core/seed/prng";
import type { QualityPreset } from "@/stores/settings";
import { useGameStore } from "@/stores/gameStore";
import { FURNITURE_MODELS } from "./furniture/FurnitureModels";
import { brassMaterial, floorTexture, plainMaterial, wallTexture, woodMaterial, PALETTE } from "./materials";

export type InteractionUserData = { interactionId: string; kind: "furniture" | "seal_panel" | "exit_door"; label: string };

// ---------------------------------------------------------------- shell --
const RoomShell = memo(function RoomShell() {
  const floorMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: floorTexture(), roughness: 0.82, color: "#9a8a78" }),
    [],
  );
  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({ map: wallTexture(), roughness: 0.95, color: "#b4b8bb" }), []);
  const ceilingMat = plainMaterial("#1b1f24", 0.95);
  const trim = woodMaterial(PALETTE.darkWalnut, 0.7);
  const { width: W, depth: D, height: H } = ROOM;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={floorMat}>
        <planeGeometry args={[W, D]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, 0]} material={ceilingMat}>
        <planeGeometry args={[W, D]} />
      </mesh>
      {/* walls: N, S, W, E */}
      <mesh position={[0, H / 2, ROOM.minZ]} receiveShadow material={wallMat}>
        <planeGeometry args={[W, H]} />
      </mesh>
      <mesh position={[0, H / 2, ROOM.maxZ]} rotation={[0, Math.PI, 0]} receiveShadow material={wallMat}>
        <planeGeometry args={[W, H]} />
      </mesh>
      <mesh position={[ROOM.minX, H / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow material={wallMat}>
        <planeGeometry args={[D, H]} />
      </mesh>
      <mesh position={[ROOM.maxX, H / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow material={wallMat}>
        <planeGeometry args={[D, H]} />
      </mesh>
      {/* skirting boards */}
      <mesh position={[0, 0.07, ROOM.minZ + 0.015]} material={trim}>
        <boxGeometry args={[W, 0.14, 0.03]} />
      </mesh>
      <mesh position={[0, 0.07, ROOM.maxZ - 0.015]} material={trim}>
        <boxGeometry args={[W, 0.14, 0.03]} />
      </mesh>
      <mesh position={[ROOM.minX + 0.015, 0.07, 0]} material={trim}>
        <boxGeometry args={[0.03, 0.14, D]} />
      </mesh>
      <mesh position={[ROOM.maxX - 0.015, 0.07, 0]} material={trim}>
        <boxGeometry args={[0.03, 0.14, D]} />
      </mesh>
      {/* ceiling beams */}
      {[-3.6, 0, 3.6].map((x) => (
        <mesh key={x} position={[x, H - 0.12, 0]} material={trim}>
          <boxGeometry args={[0.22, 0.24, D]} />
        </mesh>
      ))}
      {/* scattered papers */}
      {[
        [-1.8, 2.4, 0.4],
        [2.2, 1.6, -0.7],
        [-4.2, -0.6, 1.2],
        [3.9, 3.4, 2.1],
      ].map(([x, z, r]) => (
        <mesh key={`${x}${z}`} position={[x, 0.004, z]} rotation={[-Math.PI / 2, 0, r]} material={plainMaterial("#bfb49c", 0.95)}>
          <planeGeometry args={[0.21, 0.29]} />
        </mesh>
      ))}
    </group>
  );
});

// ------------------------------------------------------------- lighting --
function PendantLamp({ quality }: { quality: QualityPreset }) {
  const light = useRef<THREE.PointLight>(null);
  const bulb = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // slow, irregular flicker
    const f = 1 - Math.max(0, Math.sin(t * 7.3) * Math.sin(t * 2.1) * Math.sin(t * 0.37)) * 0.35;
    if (light.current) light.current.intensity = 16 * f;
    if (bulb.current) bulb.current.color.setScalar(0.9 * f + 0.1);
  });
  const shadows = quality !== "low";
  return (
    <group position={[0, ROOM.height, 0.4]}>
      <mesh position={[0, -0.45, 0]} material={plainMaterial("#111", 0.6, 0.5)}>
        <cylinderGeometry args={[0.006, 0.006, 0.9, 6]} />
      </mesh>
      <mesh position={[0, -0.95, 0]} material={brassMaterial()}>
        <coneGeometry args={[0.28, 0.2, 24, 1, true]} />
      </mesh>
      <mesh position={[0, -1.0, 0]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshBasicMaterial ref={bulb} color="#ffd9a0" toneMapped={false} />
      </mesh>
      <pointLight
        ref={light}
        position={[0, -1.05, 0]}
        color="#ffc98a"
        intensity={16}
        distance={14}
        decay={1.4}
        castShadow={shadows}
        shadow-mapSize={quality === "high" ? [1024, 1024] : [512, 512]}
        shadow-bias={-0.002}
      />
    </group>
  );
}

const Dust = memo(function Dust({ count }: { count: number }) {
  const points = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(count * 3);
    const rng = createRng(`dust:${count}`);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (rng.next() - 0.5) * ROOM.width * 0.9;
      arr[i * 3 + 1] = rng.next() * ROOM.height;
      arr[i * 3 + 2] = (rng.next() - 0.5) * ROOM.depth * 0.9;
    }
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, [count]);
  useFrame((_, delta) => {
    if (points.current) {
      points.current.rotation.y += delta * 0.006;
      points.current.position.y = Math.sin(performance.now() * 0.00008) * 0.15;
    }
  });
  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial size={0.012} color="#e8d6b0" transparent opacity={0.45} depthWrite={false} sizeAttenuation />
    </points>
  );
});

// ------------------------------------------------------------ furniture --
const FurnitureInstance = memo(function FurnitureInstance({ data, interactive }: { data: FurnitureInstanceData; interactive: boolean }) {
  const def = FURNITURE_DEFINITIONS[data.type];
  const Model = FURNITURE_MODELS[data.type];
  const focused = useGameStore((s) => interactive && s.focusTarget?.id === data.id);
  const glow = useRef<THREE.PointLight>(null);
  useFrame((_, delta) => {
    if (!glow.current) return;
    const target = focused ? 0.9 : 0;
    glow.current.intensity += (target - glow.current.intensity) * Math.min(1, delta * 6);
  });
  const userData: InteractionUserData | undefined = interactive
    ? { interactionId: data.id, kind: "furniture", label: def.name }
    : undefined;
  return (
    <group position={data.position} rotation={[0, data.rotationY, 0]} userData={userData ?? {}}>
      <Model />
      {interactive ? (
        <pointLight ref={glow} position={[def.focusPoint[0], def.focusPoint[1] + 0.25, def.focusPoint[2] + 0.55]} color="#ffcf8a" intensity={0} distance={1.8} decay={2} />
      ) : null}
    </group>
  );
});

// ---------------------------------------------------- seal panel / door --
function SealPanel() {
  const unlocked = useGameStore((s) => Boolean(s.session?.progress.puzzleUnlocked));
  const solved = useGameStore((s) => Boolean(s.session?.progress.solved));
  const focused = useGameStore((s) => s.focusTarget?.id === SEAL_PANEL_INTERACTION_ID);
  const group = useRef<THREE.Group>(null);
  const keyhole = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    // slides out of the wall when unlocked
    const targetOut = unlocked && !solved ? 0.06 : -0.08;
    group.current.position.z += (targetOut - group.current.position.z) * Math.min(1, delta * 2);
    if (keyhole.current) {
      const pulse = 0.55 + Math.sin(clock.elapsedTime * 2.2) * 0.25 + (focused ? 0.3 : 0);
      keyhole.current.color.setRGB(1 * pulse, 0.62 * pulse, 0.28 * pulse);
    }
  });
  if (!unlocked || solved) return null;
  const [x, y, z] = SEAL_PANEL.position;
  const brass = brassMaterial();
  const userData: InteractionUserData = { interactionId: SEAL_PANEL_INTERACTION_ID, kind: "seal_panel", label: "封印装置" };
  return (
    <group position={[x, y, z]} rotation={[0, SEAL_PANEL.rotationY, 0]}>
      <group ref={group} userData={userData} position={[0, 0, -0.08]}>
        <mesh material={woodMaterial(PALETTE.darkWalnut)} castShadow>
          <boxGeometry args={[0.9, 1.1, 0.08]} />
        </mesh>
        <mesh position={[0, 0, 0.045]} material={brass}>
          <boxGeometry args={[0.78, 0.98, 0.02]} />
        </mesh>
        {[-0.27, -0.09, 0.09, 0.27].map((dx) => (
          <mesh key={dx} position={[dx, 0.18, 0.07]} rotation={[Math.PI / 2, 0, 0]} material={plainMaterial("#2b2118", 0.5, 0.4)}>
            <cylinderGeometry args={[0.07, 0.07, 0.04, 20]} />
          </mesh>
        ))}
        <mesh position={[0, -0.22, 0.06]}>
          <circleGeometry args={[0.07, 24]} />
          <meshBasicMaterial ref={keyhole} color="#ff9e47" toneMapped={false} />
        </mesh>
        <pointLight position={[0, 0, 0.5]} color="#ffb169" intensity={1.4} distance={2.4} decay={2} />
      </group>
    </group>
  );
}

function ExitDoor() {
  const solved = useGameStore((s) => Boolean(s.session?.progress.solved));
  const light = useRef<THREE.MeshBasicMaterial>(null);
  const spot = useRef<THREE.PointLight>(null);
  useFrame((_, delta) => {
    if (light.current) light.current.opacity = Math.min(1, light.current.opacity + delta * 0.4);
    if (spot.current) spot.current.intensity = Math.min(14, spot.current.intensity + delta * 5);
  });
  if (!solved) return null;
  const userData: InteractionUserData = { interactionId: EXIT_DOOR_INTERACTION_ID, kind: "exit_door", label: "光の差す扉" };
  const frame = woodMaterial(PALETTE.darkWalnut, 0.6);
  return (
    <group position={[ROOM.maxX - 0.02, 0, 0]} rotation={[0, -Math.PI / 2, 0]} userData={userData}>
      <mesh position={[0, 1.15, 0]}>
        <planeGeometry args={[1.1, 2.3]} />
        <meshBasicMaterial ref={light} color="#fff8ea" transparent opacity={0} toneMapped={false} />
      </mesh>
      <mesh position={[-0.6, 1.2, 0.04]} material={frame}>
        <boxGeometry args={[0.1, 2.4, 0.08]} />
      </mesh>
      <mesh position={[0.6, 1.2, 0.04]} material={frame}>
        <boxGeometry args={[0.1, 2.4, 0.08]} />
      </mesh>
      <mesh position={[0, 2.4, 0.04]} material={frame}>
        <boxGeometry args={[1.3, 0.1, 0.08]} />
      </mesh>
      {/* opened door leaf swung into the room */}
      <mesh position={[-0.55 + Math.cos(1.1) * 0.5, 1.15, Math.sin(1.1) * 0.5]} rotation={[0, -1.1, 0]} material={woodMaterial(PALETTE.walnut)}>
        <boxGeometry args={[1.0, 2.25, 0.05]} />
      </mesh>
      {/* light shaft */}
      <mesh position={[0, 0.02, 1.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.1, 2.8]} />
        <meshBasicMaterial color="#fff1d6" transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <pointLight ref={spot} position={[0, 1.4, 0.8]} color="#fff4e0" intensity={0} distance={9} decay={1.4} />
    </group>
  );
}

// ---------------------------------------------------------------- scene --
export function RoomScene({
  furniture,
  quality,
  interactive,
  worldRef,
}: {
  furniture: FurnitureInstanceData[];
  quality: QualityPreset;
  interactive: boolean;
  worldRef?: React.Ref<THREE.Group>;
}) {
  return (
    <>
      <color attach="background" args={["#07090c"]} />
      <fog attach="fog" args={["#07090c", 9, 22]} />
      <hemisphereLight args={["#6a7c96", "#2a1c12", 0.9]} />
      <ambientLight intensity={0.35} color="#8f9cb4" />
      <directionalLight position={[-4, 3.6, 4]} intensity={0.55} color="#8aa0c2" />
      <PendantLamp quality={quality} />
      <group ref={worldRef}>
        <RoomShell />
        {furniture.map((f) => (
          <FurnitureInstance key={f.id} data={f} interactive={interactive} />
        ))}
        {interactive ? (
          <>
            <SealPanel />
            <ExitDoor />
          </>
        ) : null}
      </group>
      {quality !== "low" ? <Dust count={quality === "high" ? 900 : 400} /> : null}
    </>
  );
}
