"use client";

import * as THREE from "three";

/**
 * Materials and textures shared by the room, furniture and memory scenes.
 */



const cache = new Map<string, THREE.Texture>();

function cached(key: string, make: () => THREE.Texture) {
  let t = cache.get(key);
  if (!t) {
    t = make();
    cache.set(key, t);
  }
  return t;
}

const materialCache = new Map<string, THREE.Material>();

// ---------------------------------------------------------------------------
// Photo textures (generated with ChatGPT image generation, made tileable and
// compressed — see docs/ASSET_LICENSES.md). Loaded once, cloned per repeat.
// ---------------------------------------------------------------------------
const loader = typeof window !== "undefined" ? new THREE.TextureLoader() : null;
const photoBase = new Map<string, THREE.Texture>();

export function photoTexture(url: string, repeatX = 1, repeatY = 1, color = true): THREE.Texture {
  const key = `${url}|${repeatX}|${repeatY}|${color}`;
  return cached(key, () => {
    let base = photoBase.get(url);
    if (!base) {
      base = loader ? loader.load(url) : new THREE.Texture();
      base.wrapS = THREE.RepeatWrapping;
      base.wrapT = THREE.RepeatWrapping;
      base.anisotropy = 4;
      photoBase.set(url, base);
    }
    const t = base.clone();
    t.source = base.source; // share the image, independent repeat
    t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.repeat.set(repeatX, repeatY);
    return t;
  });
}

export const TEXTURES = {
  floor: "/textures/floor.jpg",
  wallpaper: "/textures/wallpaper.jpg",
  wood: "/textures/wood.jpg",
  memoryWallpaper: "/textures/memory-wallpaper.jpg",
} as const;

const WHITE = new THREE.Color("#ffffff");

/** Varnished wood (photo grain + bump + light clearcoat), one instance per tint. */
export function woodMaterial(color: string, roughness = 0.62): THREE.MeshPhysicalMaterial {
  const key = `wood:${color}:${roughness}`;
  let m = materialCache.get(key) as THREE.MeshPhysicalMaterial | undefined;
  if (!m) {
    const tint = new THREE.Color(color).lerp(WHITE, 0.45);
    m = new THREE.MeshPhysicalMaterial({
      color: tint,
      roughness,
      metalness: 0,
      map: photoTexture(TEXTURES.wood),
      bumpMap: photoTexture(TEXTURES.wood, 1, 1, false),
      bumpScale: 1.2,
      clearcoat: 0.35,
      clearcoatRoughness: 0.45,
    });
    materialCache.set(key, m);
  }
  return m;
}

export function floorMaterial(variant: "present" | "memory"): THREE.MeshStandardMaterial {
  const key = `floor:${variant}`;
  let m = materialCache.get(key) as THREE.MeshStandardMaterial | undefined;
  if (!m) {
    const rx = variant === "present" ? 4 : 2.5;
    const ry = variant === "present" ? 3.3 : 2.5;
    m = new THREE.MeshStandardMaterial({
      color: variant === "present" ? "#b9a48f" : "#f0d2ac",
      map: photoTexture(TEXTURES.floor, rx, ry),
      bumpMap: photoTexture(TEXTURES.floor, rx, ry, false),
      bumpScale: 2.2,
      roughness: variant === "present" ? 0.78 : 0.55,
      metalness: 0,
    });
    materialCache.set(key, m);
  }
  return m;
}

export function wallMaterial(variant: "present" | "memory"): THREE.MeshStandardMaterial {
  const key = `wall:${variant}`;
  let m = materialCache.get(key) as THREE.MeshStandardMaterial | undefined;
  if (!m) {
    const url = variant === "present" ? TEXTURES.wallpaper : TEXTURES.memoryWallpaper;
    const rx = variant === "present" ? 3.6 : 4.5;
    const ry = variant === "present" ? 1.4 : 1.6;
    m = new THREE.MeshStandardMaterial({
      color: variant === "present" ? "#9ea4a8" : "#ffe9cc",
      map: photoTexture(url, rx, ry),
      bumpMap: photoTexture(url, rx, ry, false),
      bumpScale: 0.6,
      roughness: 0.92,
    });
    materialCache.set(key, m);
  }
  return m;
}

export function brassMaterial(): THREE.MeshPhysicalMaterial {
  const key = "brass";
  let m = materialCache.get(key) as THREE.MeshPhysicalMaterial | undefined;
  if (!m) {
    m = new THREE.MeshPhysicalMaterial({ color: "#c49a5c", roughness: 0.32, metalness: 1, clearcoat: 0.2 });
    materialCache.set(key, m);
  }
  return m;
}

export function plainMaterial(color: string, roughness = 0.85, metalness = 0): THREE.MeshStandardMaterial {
  const key = `plain:${color}:${roughness}:${metalness}`;
  let m = materialCache.get(key) as THREE.MeshStandardMaterial | undefined;
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    materialCache.set(key, m);
  }
  return m;
}

export const PALETTE = {
  walnut: "#5a3a22",
  darkWalnut: "#3b2616",
  oak: "#7a5634",
  mahogany: "#6a2f1f",
  paper: "#e8dcc0",
  ink: "#151515",
  velvet: "#5b3b2a",
} as const;
