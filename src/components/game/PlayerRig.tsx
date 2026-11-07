"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { PLAYER, ROOM } from "@/game-core/definitions/room";
import type { DecorInstance } from "@/game-core/definitions/decor";
import { furnitureAabb, resolveCircleAabb } from "@/game-core/generation/geometry";
import { decorAabb } from "@/game-core/generation/placeDecor";
import type { FurnitureInstance } from "@/game-core/types";
import { useGameStore } from "@/stores/gameStore";
import { consumeLook, keysDown, playerPose, touchMove } from "./inputState";
import type { InteractionUserData } from "./RoomScene";

const ACCEL = 14;
const PITCH_LIMIT = 1.3;
const CHECKPOINT_INTERVAL_MS = 20_000;
const RAYCAST_EVERY = 3;

function collide(x: number, z: number, boxes: ReturnType<typeof furnitureAabb>[]): [number, number] {
  const r = PLAYER.radius;
  let px = Math.min(ROOM.maxX - r, Math.max(ROOM.minX + r, x));
  let pz = Math.min(ROOM.maxZ - r, Math.max(ROOM.minZ + r, z));
  for (let pass = 0; pass < 2; pass++) {
    for (const b of boxes) [px, pz] = resolveCircleAabb(b, px, pz, r);
  }
  return [px, pz];
}

/**
 * First-person controller (WASD + mouse look, capsule-vs-AABB collision)
 * plus the centre-screen interaction raycaster (spec 2.2, 3.4).
 */
export function PlayerRig({ furniture, decor, world }: { furniture: FurnitureInstance[]; decor: DecorInstance[]; world: React.RefObject<THREE.Group | null> }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const boxes = useMemo(() => [...furniture.map((f) => furnitureAabb(f)), ...decor.map((d) => decorAabb(d))], [furniture, decor]);
  const velocity = useRef(new THREE.Vector2());
  const frame = useRef(0);
  const raycaster = useMemo(() => {
    const r = new THREE.Raycaster();
    r.far = PLAYER.interactDistance;
    return r;
  }, []);
  const centre = useMemo(() => new THREE.Vector2(0, 0), []);
  const lastSaved = useRef({ at: 0, x: playerPose.position[0], z: playerPose.position[2] });

  // Restore the checkpoint once per session, pushed out of any collider (spec 8.3).
  const sessionId = useGameStore((s) => s.session?.sessionId ?? null);
  useEffect(() => {
    if (!sessionId || playerPose.initialisedFor === sessionId) return;
    const cp = useGameStore.getState().session?.checkpoint;
    const [x, z] = collide(cp?.position[0] ?? PLAYER.spawn[0], cp?.position[2] ?? PLAYER.spawn[2], boxes);
    playerPose.position = [x, PLAYER.eyeHeight, z];
    playerPose.yaw = cp?.yaw ?? PLAYER.spawnYaw;
    playerPose.pitch = 0;
    playerPose.initialisedFor = sessionId;
  }, [sessionId, boxes]);

  // Save position when the tab is hidden.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden" && playerPose.initialisedFor) {
        void useGameStore.getState().saveCheckpoint({ position: playerPose.position, yaw: playerPose.yaw });
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const state = useGameStore.getState();
    const { phase, settings } = state;
    const active = (phase === "EXPLORING" || phase === "ESCAPE") && !state.journalOpen && !state.settingsOpen && !state.manualOpen;

    // look
    const look = consumeLook();
    if (active && (state.pointerLocked || state.touchControls)) {
      const k = 0.0022 * settings.mouseSensitivity;
      playerPose.yaw -= look.dx * k;
      playerPose.pitch -= look.dy * k * (settings.invertY ? -1 : 1);
      playerPose.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, playerPose.pitch));
    }

    // move (projected onto the XZ plane, eased acceleration)
    let ix = 0;
    let iz = 0;
    if (active) {
      if (keysDown.has("KeyW") || keysDown.has("ArrowUp")) iz -= 1;
      if (keysDown.has("KeyS") || keysDown.has("ArrowDown")) iz += 1;
      if (keysDown.has("KeyA") || keysDown.has("ArrowLeft")) ix -= 1;
      if (keysDown.has("KeyD") || keysDown.has("ArrowRight")) ix += 1;
      ix += touchMove.x;
      iz -= touchMove.y;
    }
    const len = Math.max(1, Math.hypot(ix, iz));
    const sin = Math.sin(playerPose.yaw);
    const cos = Math.cos(playerPose.yaw);
    const tx = ((ix * cos + iz * sin) / len) * PLAYER.walkSpeed;
    const tz = ((-ix * sin + iz * cos) / len) * PLAYER.walkSpeed;
    const blend = 1 - Math.exp(-ACCEL * delta);
    velocity.current.x += (tx - velocity.current.x) * blend;
    velocity.current.y += (tz - velocity.current.y) * blend;
    if (Math.abs(velocity.current.x) + Math.abs(velocity.current.y) > 1e-4) {
      const [nx, nz] = collide(
        playerPose.position[0] + velocity.current.x * delta,
        playerPose.position[2] + velocity.current.y * delta,
        boxes,
      );
      playerPose.position = [nx, PLAYER.eyeHeight, nz];
    }

    // subtle head bob while walking
    const speed = velocity.current.length();
    const bob = Math.sin(performance.now() * 0.009) * 0.018 * Math.min(1, speed / PLAYER.walkSpeed);

    camera.position.set(playerPose.position[0], PLAYER.eyeHeight + bob, playerPose.position[2]);
    camera.rotation.set(playerPose.pitch, playerPose.yaw, 0, "YXZ");
    if (camera.fov !== settings.fov) {
      camera.fov = settings.fov;
      camera.updateProjectionMatrix();
    }

    // interaction raycast (closest hit only; walls occlude)
    frame.current += 1;
    if (active && world.current && frame.current % RAYCAST_EVERY === 0) {
      raycaster.setFromCamera(centre, camera);
      const hit = raycaster.intersectObject(world.current, true)[0];
      let target: InteractionUserData | null = null;
      let o: THREE.Object3D | null = hit?.object ?? null;
      while (o) {
        const data = o.userData as Partial<InteractionUserData>;
        if (data.interactionId) {
          target = data as InteractionUserData;
          break;
        }
        o = o.parent;
      }
      state.setFocusTarget(target ? { id: target.interactionId, kind: target.kind, label: target.label } : null);
    } else if (!active && state.focusTarget) {
      state.setFocusTarget(null);
    }

    // periodic position checkpoint (spec 8.3: 15–30 s)
    const now = performance.now();
    if (active && now - lastSaved.current.at > CHECKPOINT_INTERVAL_MS) {
      const moved = Math.hypot(playerPose.position[0] - lastSaved.current.x, playerPose.position[2] - lastSaved.current.z);
      lastSaved.current = { at: now, x: playerPose.position[0], z: playerPose.position[2] };
      if (moved > 0.5) void state.saveCheckpoint({ position: playerPose.position, yaw: playerPose.yaw });
    }
  });

  return null;
}
