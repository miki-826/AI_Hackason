"use client";

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/**
 * Shared, cached furniture geometry (built once, reused by every instance).
 * Turned legs and spindles come from lathe profiles; slabs are bevelled.
 */
const cache = new Map<string, THREE.BufferGeometry>();

function once<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
  let g = cache.get(key) as T | undefined;
  if (!g) {
    g = make();
    cache.set(key, g);
  }
  return g;
}

/** Bevelled box; size in metres, small radius for soft highlights on edges. */
export function rbox(w: number, h: number, d: number, r = 0.008): THREE.BufferGeometry {
  return once(`rb:${w}:${h}:${d}:${r}`, () => new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2)));
}

/**
 * Lathe from a normalised profile: [radius, t] with t in 0..1 along height.
 * The result is centred vertically on the origin.
 */
function lathe(key: string, height: number, scale: number, profile: [number, number][], seg = 14) {
  return once(`lathe:${key}:${height}:${scale}:${seg}`, () => {
    const pts = profile.map(([r, t]) => new THREE.Vector2(Math.max(0.0005, r * scale), t * height - height / 2));
    const g = new THREE.LatheGeometry(pts, seg);
    g.computeVertexNormals();
    return g;
  });
}

/** Classic turned table/chair leg with beads and a tapered foot. */
export function turnedLeg(height: number, thickness: number) {
  return lathe("leg", height, thickness, [
    [0.55, 0],
    [0.62, 0.03],
    [0.42, 0.08],
    [0.48, 0.42],
    [0.6, 0.47],
    [0.62, 0.5],
    [0.5, 0.53],
    [0.66, 0.6],
    [0.5, 0.66],
    [0.95, 0.72],
    [1, 0.78],
    [1, 1],
  ]);
}

/** Slim tapered spindle with a central swelling (chair backs, rails). */
export function spindle(height: number, thickness: number) {
  return lathe("spindle", height, thickness, [
    [0.6, 0],
    [0.75, 0.06],
    [0.55, 0.12],
    [0.85, 0.45],
    [1, 0.55],
    [0.7, 0.8],
    [0.75, 0.94],
    [0.6, 1],
  ]);
}

/** Column with base, shaft and capital (clock hood, mirror posts). */
export function column(height: number, thickness: number) {
  return lathe("column", height, thickness, [
    [1, 0],
    [1, 0.06],
    [0.7, 0.1],
    [0.62, 0.15],
    [0.55, 0.85],
    [0.7, 0.9],
    [1, 0.94],
    [1, 1],
  ]);
}

/** Decorative finial (urn + spike). */
export function finial(height: number, thickness: number) {
  return lathe("finial", height, thickness, [
    [0.001, 1],
    [0.15, 0.85],
    [0.35, 0.6],
    [0.6, 0.45],
    [0.5, 0.3],
    [0.25, 0.2],
    [0.5, 0.08],
    [0.5, 0],
  ]);
}

/** Squashed bun foot. */
export function bunFoot(r: number) {
  return once(`bun:${r}`, () => {
    const g = new THREE.SphereGeometry(r, 16, 10);
    g.scale(1, 0.6, 1);
    return g;
  });
}

/** Inkwell / vase body. */
export function vase(height: number, thickness: number) {
  return lathe("vase", height, thickness, [
    [0.001, 0],
    [0.55, 0.02],
    [0.8, 0.2],
    [1, 0.45],
    [0.75, 0.75],
    [0.4, 0.88],
    [0.5, 1],
  ], 20);
}

/**
 * Bent-wood crest rail: a tube along an arc that bows backwards.
 * span = distance between the two posts.
 */
export function bowRail(span: number, bow: number, radius: number) {
  return once(`bow:${span}:${bow}:${radius}`, () => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-span / 2, 0, 0),
      new THREE.Vector3(0, 0.06, -bow),
      new THREE.Vector3(span / 2, 0, 0),
    );
    return new THREE.TubeGeometry(curve, 24, radius, 8, false);
  });
}

/** Half-round bail handle for drawers. */
export function bailHandle(width: number, radius: number) {
  return once(`bail:${width}:${radius}`, () => new THREE.TorusGeometry(width / 2, radius, 8, 18, Math.PI));
}

/** Oval frame ring (mirror). */
export function ovalRing(rx: number, ry: number, tube: number) {
  return once(`oval:${rx}:${ry}:${tube}`, () => {
    const g = new THREE.TorusGeometry(1, tube / Math.max(rx, ry), 10, 48);
    g.scale(rx, ry, Math.max(rx, ry));
    return g;
  });
}

export function ovalDisc(rx: number, ry: number) {
  return once(`ovald:${rx}:${ry}`, () => {
    const g = new THREE.CircleGeometry(1, 48);
    g.scale(rx, ry, 1);
    return g;
  });
}
