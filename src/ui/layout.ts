export type Orientation = 'landscape' | 'portrait';

/** SVG coordinate space of the table per orientation. */
export const VIEWBOX: Record<Orientation, { w: number; h: number }> = {
  landscape: { w: 640, h: 420 },
  portrait: { w: 360, h: 580 },
};

/** Seat pill size in table units. */
export const SEAT_SIZE: Record<Orientation, { w: number; h: number }> = {
  landscape: { w: 120, h: 44 },
  portrait: { w: 100, h: 40 },
};

/** Felt oval (centre and radii) per orientation. */
export const FELT: Record<Orientation, { cx: number; cy: number; rx: number; ry: number }> = {
  landscape: { cx: 320, cy: 205, rx: 252, ry: 120 },
  portrait: { cx: 180, cy: 290, rx: 128, ry: 200 },
};

/*
 * Seat anchors clockwise from the player (bottom centre): to the player's
 * left first, as at a real table.
 */
const RING: Record<Orientation, { x: number; y: number }[]> = {
  landscape: [
    { x: 320, y: 384 },
    { x: 86, y: 300 },
    { x: 86, y: 112 },
    { x: 320, y: 30 },
    { x: 554, y: 112 },
    { x: 554, y: 300 },
  ],
  portrait: [
    { x: 180, y: 540 },
    { x: 56, y: 414 },
    { x: 56, y: 170 },
    { x: 180, y: 40 },
    { x: 304, y: 170 },
    { x: 304, y: 414 },
  ],
};

const PICK: Record<number, number[]> = {
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 5],
  5: [0, 1, 2, 4, 5],
  6: [0, 1, 2, 3, 4, 5],
};

/** Seat centres for 2–6 seats; seat 0 (the player) is always bottom centre. */
export function seatPositions(n: 2 | 3 | 4 | 5 | 6, orientation: Orientation): { x: number; y: number }[] {
  return PICK[n].map((i) => RING[orientation][i]);
}

/** A point `t` of the way from a seat towards the table centre (bet lines, card spots). */
export function towardsCentre(p: { x: number; y: number }, orientation: Orientation, t: number) {
  const f = FELT[orientation];
  return { x: p.x + (f.cx - p.x) * t, y: p.y + (f.cy - p.y) * t };
}
