"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { FALLBACK_LAYOUT } from "@/game-core/generation/placeFurniture";
import { furnitureIdFor } from "@/game-core/definitions/furniture";
import { RoomScene } from "./RoomScene";

const LAYOUT = FALLBACK_LAYOUT.map((f) => ({ ...f, id: furnitureIdFor(f.type) }));

function Drift() {
  useFrame(({ camera, clock }) => {
    const t = clock.elapsedTime * 0.05;
    camera.position.set(Math.sin(t) * 1.2, 1.7, 3.8 + Math.cos(t) * 0.3);
    camera.lookAt(Math.sin(t * 0.7) * 1.5, 1.1, -3);
  });
  return null;
}

/** Slowly drifting view of the sealed room behind the title (FR-001). */
export default function TitleBackdrop() {
  return (
    <div aria-hidden className="absolute inset-0 opacity-70">
      <Canvas dpr={[1, 1.5]} camera={{ fov: 62, near: 0.05, far: 40, position: [0, 1.7, 3.8] }}>
        <RoomScene furniture={LAYOUT} quality="standard" interactive={false} />
        <Drift />
      </Canvas>
    </div>
  );
}
