"use client";

import * as THREE from "three";

/**
 * Procedural textures (generated once on a canvas) so the game ships no
 * third-party texture assets — no licensing to track (spec 3.2).
 */

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function canvasTexture(size: number, draw: (ctx: CanvasRenderingContext2D, rnd: () => number) => void, seed: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Texture();
  draw(ctx, seeded(seed));
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

const cache = new Map<string, THREE.Texture>();

function cached(key: string, make: () => THREE.Texture) {
  let t = cache.get(key);
  if (!t) {
    t = make();
    cache.set(key, t);
  }
  return t;
}

/** Long wood grain, light-neutral so it can be tinted by material colour. */
export function woodGrainTexture(): THREE.Texture {
  return cached("wood", () =>
    canvasTexture(
      256,
      (ctx, rnd) => {
        ctx.fillStyle = "#bfbfbf";
        ctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 140; i++) {
          const x = rnd() * 256;
          const w = 0.6 + rnd() * 2.2;
          const shade = 120 + Math.floor(rnd() * 110);
          ctx.strokeStyle = `rgba(${shade},${shade},${shade},${0.18 + rnd() * 0.3})`;
          ctx.lineWidth = w;
          ctx.beginPath();
          let y = 0;
          ctx.moveTo(x, y);
          while (y < 256) {
            y += 16;
            ctx.lineTo(x + Math.sin(y * 0.05 + i) * 2.5, y);
          }
          ctx.stroke();
        }
        for (let k = 0; k < 6; k++) {
          const cx = rnd() * 256;
          const cy = rnd() * 256;
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 6 + rnd() * 8);
          g.addColorStop(0, "rgba(60,60,60,0.55)");
          g.addColorStop(1, "rgba(60,60,60,0)");
          ctx.fillStyle = g;
          ctx.fillRect(cx - 16, cy - 16, 32, 32);
        }
      },
      11,
    ),
  );
}

/** Floor planks with seams, scuffs and dust. */
export function floorTexture(): THREE.Texture {
  return cached("floor", () => {
    const t = canvasTexture(
      512,
      (ctx, rnd) => {
        const planks = 8;
        const pw = 512 / planks;
        for (let p = 0; p < planks; p++) {
          let y = -rnd() * 300;
          while (y < 512) {
            const len = 220 + rnd() * 260;
            const base = 70 + Math.floor(rnd() * 35);
            ctx.fillStyle = `rgb(${base + 28},${base + 12},${base - 6})`;
            ctx.fillRect(p * pw, y, pw, len);
            for (let g = 0; g < 18; g++) {
              ctx.strokeStyle = `rgba(30,20,12,${0.12 + rnd() * 0.2})`;
              ctx.lineWidth = 0.6 + rnd();
              const gx = p * pw + rnd() * pw;
              ctx.beginPath();
              ctx.moveTo(gx, y);
              ctx.lineTo(gx + (rnd() - 0.5) * 6, y + len);
              ctx.stroke();
            }
            ctx.fillStyle = "rgba(10,6,3,0.85)";
            ctx.fillRect(p * pw, y, pw, 2);
            y += len;
          }
          ctx.fillStyle = "rgba(8,5,3,0.9)";
          ctx.fillRect(p * pw, 0, 2, 512);
        }
        for (let s = 0; s < 40; s++) {
          ctx.fillStyle = `rgba(200,190,170,${rnd() * 0.05})`;
          ctx.beginPath();
          ctx.ellipse(rnd() * 512, rnd() * 512, 10 + rnd() * 50, 4 + rnd() * 20, rnd() * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      },
      23,
    );
    t.repeat.set(3, 2.5);
    return t;
  });
}

/** Faded damask wallpaper with water stains and peeling seams. */
export function wallTexture(): THREE.Texture {
  return cached("wall", () => {
    const t = canvasTexture(
      512,
      (ctx, rnd) => {
        ctx.fillStyle = "#4a4f52";
        ctx.fillRect(0, 0, 512, 512);
        ctx.strokeStyle = "rgba(160,150,120,0.08)";
        ctx.lineWidth = 2;
        for (let x = 0; x < 512; x += 64) {
          for (let y = 0; y < 512; y += 96) {
            const ox = (y / 96) % 2 === 0 ? 0 : 32;
            ctx.beginPath();
            ctx.ellipse(x + ox + 32, y + 48, 14, 30, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + ox + 32, y + 10);
            ctx.lineTo(x + ox + 32, y + 86);
            ctx.stroke();
          }
        }
        for (let x = 0; x < 512; x += 128) {
          ctx.fillStyle = "rgba(10,10,10,0.25)";
          ctx.fillRect(x, 0, 1.5, 512);
        }
        for (let s = 0; s < 14; s++) {
          const cx = rnd() * 512;
          const cy = rnd() * 512;
          const r = 30 + rnd() * 120;
          const g = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
          g.addColorStop(0, `rgba(40,32,20,${0.2 + rnd() * 0.25})`);
          g.addColorStop(1, "rgba(40,32,20,0)");
          ctx.fillStyle = g;
          ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        }
        for (let n = 0; n < 9000; n++) {
          const v = Math.floor(rnd() * 255);
          ctx.fillStyle = `rgba(${v},${v},${v},0.03)`;
          ctx.fillRect(rnd() * 512, rnd() * 512, 1, 1);
        }
      },
      37,
    );
    t.repeat.set(2.5, 1);
    return t;
  });
}

/** Warm striped wallpaper used inside memories (the room as it once was). */
export function memoryWallTexture(): THREE.Texture {
  return cached("memwall", () => {
    const t = canvasTexture(
      256,
      (ctx, rnd) => {
        ctx.fillStyle = "#b98b5a";
        ctx.fillRect(0, 0, 256, 256);
        for (let x = 0; x < 256; x += 32) {
          ctx.fillStyle = "rgba(120,70,35,0.35)";
          ctx.fillRect(x, 0, 10, 256);
          ctx.fillStyle = "rgba(255,230,180,0.12)";
          ctx.fillRect(x + 14, 0, 2, 256);
        }
        for (let n = 0; n < 3000; n++) {
          ctx.fillStyle = `rgba(80,40,10,${rnd() * 0.06})`;
          ctx.fillRect(rnd() * 256, rnd() * 256, 2, 2);
        }
      },
      41,
    );
    t.repeat.set(4, 1);
    return t;
  });
}

const materialCache = new Map<string, THREE.Material>();

/** Shared tinted wood material (one instance per colour). */
export function woodMaterial(color: string, roughness = 0.72): THREE.MeshStandardMaterial {
  const key = `wood:${color}:${roughness}`;
  let m = materialCache.get(key) as THREE.MeshStandardMaterial | undefined;
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.02, map: woodGrainTexture() });
    materialCache.set(key, m);
  }
  return m;
}

export function brassMaterial(): THREE.MeshStandardMaterial {
  const key = "brass";
  let m = materialCache.get(key) as THREE.MeshStandardMaterial | undefined;
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color: "#b8925a", roughness: 0.35, metalness: 0.85 });
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
