"use client";

import { useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { useEffect } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { QualityPreset } from "@/stores/settings";

/**
 * Image-based lighting from a procedural room (no HDR download), so varnish,
 * brass and glass pick up soft, believable reflections.
 */
export function SceneEnvironment({ intensity }: { intensity: number }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  useEffect(() => {
    scene.environmentIntensity = intensity;
  }, [scene, intensity]);
  return null;
}

/**
 * Cinematic post-processing. "high": ambient occlusion + restrained bloom + SMAA;
 * "standard": full-resolution tone mapping + SMAA; "low": none.
 */
export function PostFX({ quality, warm }: { quality: QualityPreset; warm: boolean }) {
  if (quality === "low") return null;
  if (quality === "high") {
    return (
      <EffectComposer multisampling={0}>
        <N8AO aoRadius={0.55} distanceFalloff={0.9} intensity={2.4} halfRes quality="performance" color="#0b0806" />
        <Bloom intensity={warm ? 0.65 : 0.35} luminanceThreshold={0.82} luminanceSmoothing={0.2} mipmapBlur />
        <Vignette offset={0.22} darkness={warm ? 0.48 : 0.62} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <SMAA />
      </EffectComposer>
    );
  }
  return (
    <EffectComposer multisampling={0}>
      <Vignette offset={0.22} darkness={warm ? 0.48 : 0.6} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <SMAA />
    </EffectComposer>
  );
}
