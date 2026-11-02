/** Blind ladder from the spec; beyond the table each level is ×1.5, rounded to a tidy value. */
const LADDER: readonly [number, number][] = [
  [10, 20], [15, 30], [25, 50], [50, 100], [75, 150], [100, 200], [150, 300],
  [200, 400], [300, 600], [400, 800], [600, 1200], [800, 1600], [1000, 2000],
];

/** Rounds to two significant digits (always an even number from 100 up, so the small blind stays whole). */
export function tidy(x: number): number {
  const digits = Math.floor(Math.log10(x)) + 1;
  const unit = 10 ** Math.max(0, digits - 2);
  return Math.round(x / unit) * unit;
}

/** Blinds of a 1-based level. */
export function blindsForLevel(level: number): { sb: number; bb: number } {
  const l = Math.max(1, Math.floor(level));
  if (l <= LADDER.length) {
    const [sb, bb] = LADDER[l - 1];
    return { sb, bb };
  }
  let bb = LADDER[LADDER.length - 1][1];
  for (let i = LADDER.length; i < l; i += 1) bb = tidy(bb * 1.5);
  return { sb: bb / 2, bb };
}
