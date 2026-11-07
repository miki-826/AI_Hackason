"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { MEMORY_STAGE_POINTS, MEMORY_TARGETS } from "@/game-core/definitions/furniture";
import type { ActorId, MemoryAction, Vec3 } from "@/game-core/types";
import { useGameStore } from "@/stores/gameStore";

/**
 * Jointed memory figure (hips, knees, shoulders, elbows, neck) posed per
 * MemoryAction so it reads at a glance what each person is doing.
 * Faces +Z; the parent yaw turns it toward what the event is about.
 */
export const SEATS: Record<ActorId, { pos: Vec3; yaw: number }> = {
  adult_a: { pos: [-1.2, 0, 0], yaw: Math.PI / 2 },
  adult_b: { pos: [1.2, 0, 0], yaw: -Math.PI / 2 },
  child_a: { pos: [-0.35, 0, -0.85], yaw: 0 },
  protagonist: { pos: [0.45, 0, -0.85], yaw: 0 },
};

type Build = { feminine: boolean; hair: "bun" | "bob" | "short" | "messy" };
const BUILD: Record<ActorId, Build> = {
  adult_a: { feminine: true, hair: "bun" },
  adult_b: { feminine: false, hair: "short" },
  child_a: { feminine: true, hair: "bob" },
  protagonist: { feminine: false, hair: "messy" },
};

type Pose = {
  hipY: number;
  lean: number;
  thigh: number;
  knee: number;
  shoulderL: number;
  shoulderR: number;
  elbowL: number;
  elbowR: number;
  headPitch: number;
  headYaw: number;
};

const STAND: Pose = { hipY: 0.92, lean: 0, thigh: 0, knee: 0, shoulderL: 0.06, shoulderR: 0.06, elbowL: -0.15, elbowR: -0.15, headPitch: 0, headYaw: 0 };
const SIT: Pose = { hipY: 0.5, lean: 0.08, thigh: -Math.PI / 2, knee: Math.PI / 2, shoulderL: -0.55, shoulderR: -0.55, elbowL: -1.0, elbowR: -1.0, headPitch: 0.08, headYaw: 0 };

function poseFor(action: MemoryAction | null, active: boolean, seated: boolean, kneelAtDrawer: boolean, t: number): Pose {
  const base = seated ? SIT : STAND;
  if (!active || !action) return { ...base, headYaw: Math.sin(t * 0.6) * 0.08 };
  switch (action) {
    case "CHECK_CLOCK":
      // standing, pointing up at the clock face, head raised
      return { ...STAND, shoulderR: -2.75, elbowR: -0.1, shoulderL: 0.1, headPitch: -0.5 };
    case "PLACE_LETTER":
      return seated
        ? { ...SIT, lean: 0.3, shoulderR: -0.95, elbowR: -0.55, headPitch: 0.45 }
        : { ...STAND, lean: 0.12, shoulderR: -1.0, elbowR: -0.7, shoulderL: -0.8, elbowL: -0.9, headPitch: 0.4 };
    case "OPEN_DRAWER":
      return kneelAtDrawer
        ? { hipY: 0.47, lean: 0.25, thigh: 0, knee: Math.PI / 2, shoulderL: -1.3, shoulderR: -1.3, elbowL: -0.2, elbowR: -0.2, headPitch: 0.35, headYaw: 0 }
        : { ...STAND, lean: 0.35, thigh: -0.5, knee: 0.9, hipY: 0.78, shoulderL: -1.1, shoulderR: -1.1, elbowL: -0.3, elbowR: -0.3, headPitch: 0.4 };
    case "LOOK_AROUND":
      return { ...base, headYaw: Math.sin(t * 1.4) * 0.6, headPitch: -0.05 };
    case "SIT_DOWN":
      return { ...SIT, shoulderR: -0.9, elbowR: -1.3, headPitch: -0.05 };
    case "STAND_UP":
      return { ...STAND, shoulderR: -0.4, elbowR: -0.6 };
    default:
      return base;
  }
}

function useGeometries() {
  return useMemo(() => {
    const torsoProfile = [
      [0.0, 0.0],
      [0.13, 0.0],
      [0.16, 0.06],
      [0.15, 0.2],
      [0.14, 0.3],
      [0.17, 0.42],
      [0.19, 0.5],
      [0.14, 0.56],
      [0.05, 0.58],
      [0.045, 0.66],
      [0.0, 0.67],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const torso = new THREE.LatheGeometry(torsoProfile, 24);
    torso.scale(1, 1, 0.62);
    const skirtProfile = [
      [0.0, 0.06],
      [0.15, 0.06],
      [0.2, -0.2],
      [0.25, -0.45],
      [0.0, -0.45],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const skirt = new THREE.LatheGeometry(skirtProfile, 24);
    skirt.scale(1, 1, 0.75);
    const head = new THREE.SphereGeometry(0.1, 24, 18);
    head.scale(0.88, 1.12, 0.98);
    const hair = new THREE.SphereGeometry(0.108, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.62);
    hair.scale(0.92, 1.1, 1.02);
    return {
      torso,
      skirt,
      head,
      hair,
      bun: new THREE.SphereGeometry(0.05, 14, 10),
      thigh: new THREE.CapsuleGeometry(0.065, 0.32, 6, 12),
      shin: new THREE.CapsuleGeometry(0.05, 0.34, 6, 12),
      foot: new THREE.CapsuleGeometry(0.04, 0.12, 4, 8),
      upperArm: new THREE.CapsuleGeometry(0.045, 0.22, 6, 10),
      forearm: new THREE.CapsuleGeometry(0.038, 0.2, 6, 10),
      hand: new THREE.SphereGeometry(0.04, 10, 8),
    };
  }, []);
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

type Geo = ReturnType<typeof useGeometries>;
type GroupRef = React.RefObject<THREE.Group | null>;

function Leg({ g, material, side, thighRef, kneeRef }: { g: Geo; material: THREE.Material; side: number; thighRef: GroupRef; kneeRef: GroupRef }) {
  return (
    <group ref={thighRef} position={[side * 0.085, 0, 0]}>
      <mesh geometry={g.thigh} material={material} position={[0, -0.21, 0]} />
      <group ref={kneeRef} position={[0, -0.43, 0]}>
        <mesh geometry={g.shin} material={material} position={[0, -0.21, 0]} />
        <mesh geometry={g.foot} material={material} position={[0, -0.43, 0.05]} rotation={[Math.PI / 2, 0, 0]} />
      </group>
    </group>
  );
}

function Arm({ g, material, width, side, shRef, elRef }: { g: Geo; material: THREE.Material; width: number; side: number; shRef: GroupRef; elRef: GroupRef }) {
  return (
    <group ref={shRef} position={[side * width, 0.48, 0]} rotation={[0, 0, side * 0.06]}>
      <mesh geometry={g.upperArm} material={material} position={[0, -0.15, 0]} />
      <group ref={elRef} position={[0, -0.3, 0]}>
        <mesh geometry={g.forearm} material={material} position={[0, -0.13, 0]} />
        <mesh geometry={g.hand} material={material} position={[0, -0.27, 0]} />
      </group>
    </group>
  );
}

export function MemoryActor({ id, scale }: { id: ActorId; scale: number }) {
  const g = useGeometries();
  const build = BUILD[id];
  const root = useRef<THREE.Group>(null);
  const hips = useRef<THREE.Group>(null);
  const chest = useRef<THREE.Group>(null);
  const neck = useRef<THREE.Group>(null);
  const thighL = useRef<THREE.Group>(null);
  const thighR = useRef<THREE.Group>(null);
  const kneeL = useRef<THREE.Group>(null);
  const kneeR = useRef<THREE.Group>(null);
  const shL = useRef<THREE.Group>(null);
  const shR = useRef<THREE.Group>(null);
  const elL = useRef<THREE.Group>(null);
  const elR = useRef<THREE.Group>(null);
  const pose = useRef<Pose>({ ...SIT });

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffd8a8",
        emissive: "#ff9a3c",
        emissiveIntensity: 0.45,
        transparent: true,
        opacity: 0.55,
        roughness: 0.55,
        depthWrite: false,
      }),
    [],
  );
  const hairMat = useMemo(() => {
    const m = material.clone();
    m.color.set("#a8682c");
    m.emissiveIntensity = 0.3;
    return m;
  }, [material]);
  useEffect(
    () => () => {
      material.dispose();
      hairMat.dispose();
    },
    [material, hairMat],
  );

  const seat = SEATS[id];

  useFrame(({ clock }, delta) => {
    const r = root.current;
    if (!r) return;
    const m = useGameStore.getState().memory;
    const event = m ? m.story.events[m.eventIndex] : undefined;
    const isActive = event?.actorId === id;
    const stage = isActive && event?.cameraTargetId ? MEMORY_STAGE_POINTS[event.cameraTargetId] : undefined;
    const target = stage ?? seat.pos;
    const k = 1 - Math.exp(-3 * delta);

    // walk to where the event happens, back to the seat otherwise
    const dist = Math.hypot(target[0] - r.position.x, target[2] - r.position.z);
    r.position.x = lerp(r.position.x, target[0], k * 0.8);
    r.position.z = lerp(r.position.z, target[2], k * 0.8);
    const walking = dist > 0.08;

    const atSeat = !stage && Math.hypot(seat.pos[0] - r.position.x, seat.pos[2] - r.position.z) < 0.15;
    const seated = atSeat && !(isActive && event && (event.action === "STAND_UP" || event.action === "CHECK_CLOCK"));
    const kneel = id === "child_a" && event?.cameraTargetId === "drawer";
    const want = poseFor(isActive ? (event?.action ?? null) : null, Boolean(isActive), seated, kneel, clock.elapsedTime);
    if (walking) {
      const s = Math.sin(clock.elapsedTime * 7);
      Object.assign(want, { ...STAND, thigh: s * 0.45, knee: Math.max(0, -s) * 0.6, shoulderL: -s * 0.4, shoulderR: s * 0.4 });
    }
    const p = pose.current;
    (Object.keys(p) as (keyof Pose)[]).forEach((key) => {
      p[key] = lerp(p[key], want[key], k);
    });

    // facing
    const look = isActive && event?.cameraTargetId ? MEMORY_TARGETS[event.cameraTargetId] : MEMORY_TARGETS.dining_table;
    const wantYaw = walking ? Math.atan2(target[0] - r.position.x, target[2] - r.position.z) : seated && !isActive ? seat.yaw : Math.atan2(look[0] - r.position.x, look[2] - r.position.z);
    let dy = wantYaw - r.rotation.y;
    dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    r.rotation.y += dy * k;

    if (hips.current) hips.current.position.y = p.hipY;
    if (chest.current) chest.current.rotation.x = p.lean;
    if (neck.current) neck.current.rotation.set(p.headPitch, p.headYaw, 0);
    const legWalkOffset = walking ? Math.PI : 0;
    if (thighL.current) thighL.current.rotation.x = p.thigh;
    if (thighR.current) thighR.current.rotation.x = walking ? -p.thigh : p.thigh;
    if (kneeL.current) kneeL.current.rotation.x = p.knee;
    if (kneeR.current) kneeR.current.rotation.x = walking ? Math.max(0, Math.sin(clock.elapsedTime * 7 + legWalkOffset)) * 0.6 : p.knee;
    if (shL.current) shL.current.rotation.x = p.shoulderL;
    if (shR.current) shR.current.rotation.x = p.shoulderR;
    if (elL.current) elL.current.rotation.x = p.elbowL;
    if (elR.current) elR.current.rotation.x = p.elbowR;

    material.emissiveIntensity = lerp(material.emissiveIntensity, isActive ? 1.0 : 0.4, k);
    material.opacity = (isActive ? 0.68 : 0.5) + Math.sin(clock.elapsedTime * 1.3 + scale * 7) * 0.04;
  });

  const shoulderW = build.feminine ? 0.17 : 0.2;

  return (
    <group ref={root} position={seat.pos} rotation={[0, seat.yaw, 0]} scale={scale}>
      <group ref={hips} position={[0, SIT.hipY, 0]}>
        <Leg g={g} material={material} side={-1} thighRef={thighL} kneeRef={kneeL} />
        <Leg g={g} material={material} side={1} thighRef={thighR} kneeRef={kneeR} />
        <group ref={chest}>
          <mesh geometry={g.torso} material={material} />
          {build.feminine && id === "adult_a" ? <mesh geometry={g.skirt} material={material} /> : null}
          <Arm g={g} material={material} width={shoulderW} side={-1} shRef={shL} elRef={elL} />
          <Arm g={g} material={material} width={shoulderW} side={1} shRef={shR} elRef={elR} />
          <group ref={neck} position={[0, 0.64, 0]}>
            <mesh geometry={g.head} material={material} position={[0, 0.1, 0.01]} />
            <mesh geometry={g.hair} material={hairMat} position={[0, 0.12, -0.005]} rotation={[-0.35, 0, 0]} />
            {build.hair === "bun" ? <mesh geometry={g.bun} material={hairMat} position={[0, 0.17, -0.1]} /> : null}
            {build.hair === "bob" ? <mesh geometry={g.hair} material={hairMat} position={[0, 0.07, -0.01]} scale={[1.08, 0.9, 1.05]} rotation={[-0.1, 0, 0]} /> : null}
          </group>
        </group>
      </group>
    </group>
  );
}
