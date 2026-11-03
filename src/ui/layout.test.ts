import { describe, expect, it } from 'vitest';
import { SEAT_SIZE, seatPositions, VIEWBOX } from './layout';

describe('seatPositions', () => {
  it('six seats in portrait fit inside the 360-wide view box; the player is bottom centre', () => {
    const seats = seatPositions(6, 'portrait');
    const box = VIEWBOX.portrait;
    const size = SEAT_SIZE.portrait;
    expect(box.w).toBe(360);
    for (const s of seats) {
      expect(s.x - size.w / 2).toBeGreaterThanOrEqual(0);
      expect(s.x + size.w / 2).toBeLessThanOrEqual(box.w);
      expect(s.y - size.h / 2).toBeGreaterThanOrEqual(0);
      expect(s.y + size.h / 2).toBeLessThanOrEqual(box.h);
    }
    expect(seats[0].x).toBe(box.w / 2);
    expect(seats[0].y).toBe(Math.max(...seats.map((s) => s.y)));
  });

  it('works for every seat count in both orientations, with distinct seats', () => {
    for (const o of ['landscape', 'portrait'] as const) {
      for (const n of [2, 3, 4, 5, 6] as const) {
        const seats = seatPositions(n, o);
        expect(seats).toHaveLength(n);
        expect(new Set(seats.map((s) => `${s.x},${s.y}`)).size).toBe(n);
        expect(seats[0].x).toBe(VIEWBOX[o].w / 2);
      }
    }
  });

  it('heads-up puts the opponent straight across', () => {
    const [me, opp] = seatPositions(2, 'landscape');
    expect(opp.x).toBe(me.x);
    expect(opp.y).toBeLessThan(me.y);
  });
});
