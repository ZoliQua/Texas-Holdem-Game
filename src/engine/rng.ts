/**
 * Seeded PRNG (mulberry32). The whole generator state is one 32-bit integer,
 * so it can be saved with the table and resumed exactly.
 */
export type Rng = {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Current internal state; `rngFromState(state())` continues the same sequence. */
  state(): number;
};

export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return {
    next() {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    state: () => a,
  };
}

export function rngFromState(state: number): Rng {
  return makeRng(state);
}

/** Integer in [0, n). */
export function randInt(rng: Rng, n: number): number {
  return Math.floor(rng.next() * n);
}

/** A new array with the items in random order (Fisher–Yates). */
export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = randInt(rng, i + 1);
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}
