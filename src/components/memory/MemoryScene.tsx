"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  FURNITURE_DEFINITIONS,
  furnitureTypeFromId,
  MEMORY_STAGE_POINTS,
  MEMORY_TARGETS,
} from "@/game-core/definitions/furniture";
import type { ActorId, MemoryAction, MemoryEvent, MemoryTargetId, Vec3 } from "@/game-core/types";
import type { QualityPreset } from "@/stores/settings";
import { useGameStore, type MemoryPlayback } from "@/stores/gameStore";
import {
  BookshelfModel,
  ChairModel,
  ClockModel,
  DeskModel,
  DrawerModel,
  MirrorModel,
} from "@/components/game/furniture/FurnitureModels";
import { consumeLook } from "@/components/game/inputState";
import { floorTexture, memoryWallTexture, plainMaterial, PALETTE, woodMaterial } from "@/components/game/materials";

/**
 * The past version of the room, seen from the object's own eye
 * (spec 4.1 memoryCameraAnchor). Coordinates are memory-set space.
 */
const SET = { w: 7.4, d: 7.4, h: 3.2 };

const SEATS: Record<ActorId, { pos: Vec3; yaw: number }> = {
  adult_a: { pos: [-1.2, 0, 0], yaw: Math.PI / 2 },
  adult_b: { pos: [1.2, 0, 0], yaw: -Math.PI / 2 },
  child_a: { pos: [-0.35, 0, -0.85], yaw: 0 },
  protagonist: { pos: [0.45, 0, -0.85], yaw: 0 },
};

const STANDING_ACTIONS: ReadonlySet<MemoryAction> = new Set(["STAND_UP", "CHECK_CLOCK", "PLACE_LETTER", "OPEN_DRAWER"]);

// ------------------------------------------------------------------ set --
const MemorySet = memo(function MemorySet() {
  const wall = useMemo(() => new THREE.MeshStandardMaterial({ map: memoryWallTexture(), roughness: 0.9, color: "#e0c39a" }), []);
  const floor = useMemo(() => new THREE.MeshStandardMaterial({ map: floorTexture(), roughness: 0.7, color: "#d0a878" }), []);
  const cloth = plainMaterial("#efe3c8", 0.95);
  const table = woodMaterial(PALETTE.oak, 0.55);
  const hw = SET.w / 2;
  const hd = SET.d / 2;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={floor} receiveShadow>
        <planeGeometry args={[SET.w, SET.d]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, SET.h, 0]} material={plainMaterial("#5a4030", 0.95)}>
        <planeGeometry args={[SET.w, SET.d]} />
      </mesh>
      <mesh position={[0, SET.h / 2, -hd]} material={wall}>
        <planeGeometry args={[SET.w, SET.h]} />
      </mesh>
      <mesh position={[0, SET.h / 2, hd]} rotation={[0, Math.PI, 0]} material={wall}>
        <planeGeometry args={[SET.w, SET.h]} />
      </mesh>
      <mesh position={[-hw, SET.h / 2, 0]} rotation={[0, Math.PI / 2, 0]} material={wall}>
        <planeGeometry args={[SET.d, SET.h]} />
      </mesh>
      <mesh position={[hw, SET.h / 2, 0]} rotation={[0, -Math.PI / 2, 0]} material={wall}>
        <planeGeometry args={[SET.d, SET.h]} />
      </mesh>
      {/* the room once had a door … */}
      <group position={[0, 0, -hd + 0.02]}>
        <mesh position={[0, 1.1, 0]} material={woodMaterial(PALETTE.walnut, 0.6)}>
          <boxGeometry args={[1.0, 2.2, 0.04]} />
        </mesh>
        <mesh position={[0.36, 1.05, 0.04]} material={plainMaterial("#c9a46a", 0.3, 0.9)}>
          <sphereGeometry args={[0.035, 12, 12]} />
        </mesh>
      </group>
      {/* … and a window full of evening light */}
      <mesh position={[hw - 0.02, 1.7, -1.0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[1.3, 1.1]} />
        <meshBasicMaterial color="#ffc27a" toneMapped={false} />
      </mesh>
      {/* dining table */}
      <group>
        <mesh position={[0, 0.76, 0]} material={table} castShadow receiveShadow>
          <boxGeometry args={[1.9, 0.05, 1.05]} />
        </mesh>
        <mesh position={[0, 0.79, 0]} material={cloth} receiveShadow>
          <boxGeometry args={[1.5, 0.008, 0.7]} />
        </mesh>
        {[
          [-0.85, -0.42],
          [0.85, -0.42],
          [-0.85, 0.42],
          [0.85, 0.42],
        ].map(([x, z]) => (
          <mesh key={`${x}${z}`} position={[x, 0.37, z]} material={table} castShadow>
            <cylinderGeometry args={[0.04, 0.03, 0.74, 10]} />
          </mesh>
        ))}
        {[
          [-0.75, 0],
          [0.75, 0],
          [-0.35, -0.3],
          [0.45, -0.3],
          [-0.35, 0.3],
        ].map(([x, z]) => (
          <mesh key={`p${x}${z}`} position={[x, 0.8, z]} material={plainMaterial("#f6f1e6", 0.35)}>
            <cylinderGeometry args={[0.12, 0.09, 0.02, 24]} />
          </mesh>
        ))}
        <mesh position={[0.05, 0.86, 0.02]} material={plainMaterial("#f3ead6", 0.6)}>
          <cylinderGeometry args={[0.025, 0.025, 0.14, 12]} />
        </mesh>
      </group>
      {/* the furniture, as it was */}
      <group position={[-0.35, 0, 0.85]} rotation={[0, Math.PI, 0]}>
        <ChairModel variant="memory" />
      </group>
      {(Object.keys(SEATS) as ActorId[]).map((id) => (
        <group key={id} position={[SEATS[id].pos[0] - Math.sin(SEATS[id].yaw) * 0.12, 0, SEATS[id].pos[2] - Math.cos(SEATS[id].yaw) * 0.12]} rotation={[0, SEATS[id].yaw, 0]}>
          <ChairModel variant="memory" />
        </group>
      ))}
      <group position={[-2.6, 0, -2.6]}>
        <ClockModel variant="memory" />
      </group>
      <group position={[2.3, 0, -2.35]}>
        <DeskModel variant="memory" />
      </group>
      <group position={[-3.45, 0, 0.8]} rotation={[0, Math.PI / 2, 0]}>
        <BookshelfModel variant="memory" />
      </group>
      <group position={[1.8, 0, 2.75]} rotation={[0, Math.PI, 0]}>
        <DrawerModel variant="memory" />
      </group>
      <group position={[-1.4, 0, 3.0]} rotation={[0, Math.PI, 0]}>
        <MirrorModel variant="memory" />
      </group>
    </group>
  );
});

// ---------------------------------------------------------------- actor --
type ActorShape = { body: THREE.LatheGeometry; head: THREE.SphereGeometry };

function useActorShape(): ActorShape {
  return useMemo(() => {
    const profile = [
      [0.0, 0],
      [0.17, 0.02],
      [0.2, 0.5],
      [0.16, 0.9],
      [0.21, 1.25],
      [0.12, 1.4],
      [0.05, 1.45],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return { body: new THREE.LatheGeometry(profile, 20), head: new THREE.SphereGeometry(0.11, 20, 16) };
  }, []);
}

function MemoryActor({ id, shape, scale }: { id: ActorId; shape: ActorShape; scale: number }) {
  const group = useRef<THREE.Group>(null);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#f3c98f",
        emissive: "#f0a24a",
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.62,
        roughness: 0.6,
        depthWrite: false,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  const seat = SEATS[id];

  useFrame(({ clock }, delta) => {
    const g = group.current;
    if (!g) return;
    const m = useGameStore.getState().memory;
    const event = m ? m.story.events[m.eventIndex] : undefined;
    const isActive = event?.actorId === id;
    const stage = isActive && event?.cameraTargetId ? MEMORY_STAGE_POINTS[event.cameraTargetId] : undefined;
    const target = stage ?? seat.pos;
    const atHome = !stage;
    const seated = atHome && !(isActive && event && STANDING_ACTIONS.has(event.action));
    const k = 1 - Math.exp(-2.4 * delta);
    g.position.x += (target[0] - g.position.x) * k;
    g.position.z += (target[2] - g.position.z) * k;
    const targetY = seated ? -0.42 * scale : 0;
    g.position.y += (targetY - g.position.y) * k;
    // face what the event is about, else the table
    const look = isActive && event?.cameraTargetId ? MEMORY_TARGETS[event.cameraTargetId] : MEMORY_TARGETS.dining_table;
    const wantYaw = atHome && !isActive ? seat.yaw : Math.atan2(look[0] - g.position.x, look[2] - g.position.z);
    let dy = wantYaw - g.rotation.y;
    dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    g.rotation.y += dy * k;
    material.emissiveIntensity += ((isActive ? 0.95 : 0.3) - material.emissiveIntensity) * k;
    material.opacity = (isActive ? 0.75 : 0.55) + Math.sin(clock.elapsedTime * 1.3 + scale * 7) * 0.05;
  });

  return (
    <group ref={group} position={seat.pos} rotation={[0, seat.yaw, 0]} scale={scale}>
      <mesh geometry={shape.body} material={material} />
      <mesh geometry={shape.head} material={material} position={[0, 1.58, 0]} />
    </group>
  );
}

// ---------------------------------------------------------------- props --
/** Props that appear once a PLACE_LETTER / OPEN_DRAWER event has played. */
function EventProps({ memory }: { memory: MemoryPlayback }) {
  const shown = memory.story.events.slice(0, memory.eventIndex + 1);
  const letters = shown.filter((e) => e.action === "PLACE_LETTER");
  const drawerOpen = shown.some((e) => e.action === "OPEN_DRAWER");
  return (
    <>
      {letters.map((e) => {
        const t = MEMORY_TARGETS[e.cameraTargetId ?? "letter"];
        const onDesk = e.cameraTargetId === "letter" || !e.cameraTargetId;
        return (
          <mesh key={e.id} position={onDesk ? [2.25, 0.79, -2.2] : [t[0], 0.81, t[2] * 0.3]} rotation={[-Math.PI / 2, 0, 0.2]}>
            <planeGeometry args={[0.2, 0.27]} />
            <meshStandardMaterial color="#fff6e4" emissive="#f0a24a" emissiveIntensity={0.25} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
      {drawerOpen ? (
        <mesh position={[1.85, 0.25, 2.35]} material={plainMaterial("#9b3d3d", 0.7)}>
          <boxGeometry args={[0.16, 0.1, 0.16]} />
        </mesh>
      ) : null}
    </>
  );
}

// ------------------------------------------------------------- fragment --
function fragmentPosition(anchor: Vec3, targetId: MemoryTargetId | null): THREE.Vector3 {
  const a = new THREE.Vector3(...anchor);
  let t = new THREE.Vector3(...MEMORY_TARGETS[targetId ?? "dining_table"]);
  if (t.distanceTo(a) < 0.35) t = new THREE.Vector3(...MEMORY_TARGETS.dining_table);
  const dir = t.clone().sub(a);
  const dist = dir.length();
  dir.normalize();
  return a.add(dir.multiplyScalar(Math.min(2.4, Math.max(0.95, dist * 0.6))));
}

function Fragment({ position, aimedRef }: { position: THREE.Vector3; aimedRef: React.RefObject<boolean> }) {
  const mesh = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (mesh.current) {
      mesh.current.rotation.y = t * 1.2;
      mesh.current.rotation.x = t * 0.7;
      mesh.current.position.y = position.y + Math.sin(t * 2) * 0.04;
      const s = aimedRef.current ? 1.35 : 1;
      mesh.current.scale.setScalar(mesh.current.scale.x + (s - mesh.current.scale.x) * 0.15);
    }
    if (halo.current) {
      const mat = halo.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.25 + Math.sin(t * 3) * 0.1 + (aimedRef.current ? 0.25 : 0);
    }
  });
  return (
    <group position={[position.x, 0, position.z]}>
      <mesh ref={mesh} position={[0, position.y, 0]}>
        <octahedronGeometry args={[0.07, 0]} />
        <meshBasicMaterial color="#ffd08a" toneMapped={false} />
      </mesh>
      <mesh ref={halo} position={[0, position.y, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#f0a24a" transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <pointLight position={[0, position.y, 0]} color="#ffb35c" intensity={1.6} distance={2.5} decay={2} />
    </group>
  );
}

// -------------------------------------------------- camera + timeline --
function MemoryDirector({ memory, anchor, fragmentPos, aimedRef }: { memory: MemoryPlayback; anchor: { position: Vec3; lookAt: MemoryTargetId }; fragmentPos: THREE.Vector3 | null; aimedRef: React.RefObject<boolean> }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const elapsed = useRef(0);
  const ended = useRef(false);
  const lookTarget = useRef(new THREE.Vector3(...MEMORY_TARGETS[anchor.lookAt]));
  const offset = useRef({ yaw: 0, pitch: 0 });
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(0, 0, 0, "YXZ"), up: new THREE.Vector3(0, 1, 0), v: new THREE.Vector3(), f: new THREE.Vector3() }), []);

  useEffect(() => {
    elapsed.current = 0;
    ended.current = false;
    camera.position.set(...anchor.position);
    lookTarget.current.set(...MEMORY_TARGETS[anchor.lookAt]);
  }, [memory.playId, anchor, camera]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const state = useGameStore.getState();
    const { phase } = state;

    // timeline only advances while observing (pauses for explore / clue / pause menu)
    if (phase === "MEMORY_OBSERVE" && !ended.current) {
      elapsed.current += delta * 1000;
      const events = memory.story.events;
      const current = state.memory?.eventIndex ?? -1;
      const next = events[current + 1];
      if (next && elapsed.current >= next.atMs) {
        state.showMemoryEvent(current + 1);
      } else if (!next) {
        const last = events[events.length - 1];
        if (!last || elapsed.current >= last.atMs + last.durationMs) {
          ended.current = true;
          state.memoryTimelineEnd();
        }
      }
    }

    // camera: fixed at the object's anchor, gently turning toward the event
    const live = state.memory;
    const ev: MemoryEvent | undefined = live ? live.story.events[live.eventIndex] : undefined;
    const want =
      phase === "MEMORY_EXPLORE" && fragmentPos
        ? fragmentPos
        : tmp.v.set(...MEMORY_TARGETS[ev?.cameraTargetId ?? anchor.lookAt]);
    lookTarget.current.lerp(want, 1 - Math.exp(-1.6 * delta));

    const look = consumeLook();
    const exploring = phase === "MEMORY_EXPLORE";
    const yawLimit = exploring ? 1.1 : 0.6;
    const pitchLimit = exploring ? 0.7 : 0.4;
    if (state.pointerLocked && (phase === "MEMORY_OBSERVE" || exploring)) {
      const k = 0.0018 * state.settings.mouseSensitivity;
      offset.current.yaw = Math.max(-yawLimit, Math.min(yawLimit, offset.current.yaw - look.dx * k));
      offset.current.pitch = Math.max(-pitchLimit, Math.min(pitchLimit, offset.current.pitch - look.dy * k * (state.settings.invertY ? -1 : 1)));
    }
    if (!exploring) {
      // drift back to the object's natural gaze
      const back = 1 - Math.exp(-0.6 * delta);
      offset.current.yaw -= offset.current.yaw * back;
      offset.current.pitch -= offset.current.pitch * back;
    }
    camera.position.set(...anchor.position);
    tmp.m.lookAt(camera.position, lookTarget.current, tmp.up);
    tmp.q.setFromRotationMatrix(tmp.m);
    tmp.e.setFromQuaternion(tmp.q, "YXZ");
    tmp.e.y += offset.current.yaw;
    tmp.e.x = Math.max(-1.3, Math.min(1.3, tmp.e.x + offset.current.pitch));
    camera.quaternion.setFromEuler(tmp.e);
    if (camera.fov !== state.settings.fov) {
      camera.fov = state.settings.fov;
      camera.updateProjectionMatrix();
    }

    // aiming at the fragment?
    if (fragmentPos) {
      camera.getWorldDirection(tmp.f);
      const to = fragmentPos.clone().sub(camera.position).normalize();
      aimedRef.current = tmp.f.dot(to) > 0.985;
    } else {
      aimedRef.current = false;
    }
  });
  return null;
}

function WarmLights({ memory, quality }: { memory: MemoryPlayback; quality: QualityPreset }) {
  const lamp = useRef<THREE.PointLight>(null);
  const candle = useRef<THREE.PointLight>(null);
  useFrame(({ clock }, delta) => {
    const m = useGameStore.getState().memory;
    const shown = m ? m.story.events.slice(0, m.eventIndex + 1) : [];
    const fading = shown.some((e) => e.action === "LIGHT_FADE");
    const k = 1 - Math.exp(-0.8 * delta);
    if (lamp.current) lamp.current.intensity += ((fading ? 2.5 : 8) - lamp.current.intensity) * k;
    if (candle.current) candle.current.intensity = (fading ? 0.6 : 1.4) + Math.sin(clock.elapsedTime * 11) * 0.15 + Math.sin(clock.elapsedTime * 3.7) * 0.1;
  });
  void memory;
  return (
    <>
      <ambientLight intensity={0.35} color="#ffd9a8" />
      <hemisphereLight args={["#ffe0b0", "#4a2a14", 0.45]} />
      <pointLight ref={lamp} position={[0, 2.6, 0]} color="#ffc27a" intensity={8} distance={10} decay={1.5} castShadow={quality === "high"} />
      <pointLight ref={candle} position={[0.05, 1.0, 0.02]} color="#ffb060" intensity={1.4} distance={3} decay={2} />
      <directionalLight position={[3.6, 2.2, -1]} color="#ffb877" intensity={0.7} />
    </>
  );
}

export function MemoryScene({ memory, quality, aimedRef }: { memory: MemoryPlayback; quality: QualityPreset; aimedRef: React.RefObject<boolean> }) {
  const shape = useActorShape();
  const phase = useGameStore((s) => s.phase);
  const exploreTargetId = useGameStore((s) => s.memory?.exploreEvent?.cameraTargetId ?? null);
  const hasExploreEvent = useGameStore((s) => Boolean(s.memory?.exploreEvent));
  const furnitureType = furnitureTypeFromId(memory.furnitureId) ?? "chair";
  const anchor = FURNITURE_DEFINITIONS[furnitureType].memoryAnchor;
  const fragmentPos = useMemo(
    () => (hasExploreEvent ? fragmentPosition(anchor.position, exploreTargetId) : null),
    [hasExploreEvent, exploreTargetId, anchor.position],
  );
  const grownUp = furnitureType === "desk" || furnitureType === "mirror";
  const scales: Record<ActorId, number> = { adult_a: 1, adult_b: 1.04, child_a: 0.7, protagonist: grownUp ? 1.02 : 0.84 };

  return (
    <>
      <color attach="background" args={["#1a0f08"]} />
      <fog attach="fog" args={["#2a1a10", 4, 11]} />
      <WarmLights memory={memory} quality={quality} />
      <MemorySet />
      {memory.story.actors.map((id) => (
        <MemoryActor key={id} id={id} shape={shape} scale={scales[id]} />
      ))}
      <EventProps memory={memory} />
      {phase === "MEMORY_EXPLORE" && fragmentPos ? <Fragment position={fragmentPos} aimedRef={aimedRef} /> : null}
      <MemoryDirector key={memory.playId} memory={memory} anchor={anchor} fragmentPos={fragmentPos} aimedRef={aimedRef} />
    </>
  );
}
