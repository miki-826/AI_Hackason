import type { CastNames } from "../types";
import { createRng } from "../seed/prng";

const POOLS = {
  protagonist: ["湊", "蒼", "律", "悠真"],
  adult_a: ["母さん", "お母さん"],
  adult_b: ["父さん", "お父さん"],
  child_a: ["小春", "灯", "結衣", "紬"],
} as const;

/** Names vary by seed, but are stable for the whole session. */
export function castForSeed(seed: string): CastNames {
  const rng = createRng(`${seed}:cast`);
  return {
    protagonist: rng.pick(POOLS.protagonist),
    adult_a: rng.pick(POOLS.adult_a),
    adult_b: rng.pick(POOLS.adult_b),
    child_a: rng.pick(POOLS.child_a),
  };
}
