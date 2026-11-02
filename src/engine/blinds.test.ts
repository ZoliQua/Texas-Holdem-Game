import { describe, expect, it } from 'vitest';
import { blindsForLevel } from './blinds';

describe('blindsForLevel', () => {
  it('returns the spec ladder exactly', () => {
    const ladder = Array.from({ length: 13 }, (_, i) => blindsForLevel(i + 1));
    expect(ladder.map((b) => `${b.sb}/${b.bb}`)).toEqual([
      '10/20', '15/30', '25/50', '50/100', '75/150', '100/200', '150/300',
      '200/400', '300/600', '400/800', '600/1200', '800/1600', '1000/2000',
    ]);
  });

  it('continues ×1.5 with tidy values beyond 1000/2000', () => {
    expect(blindsForLevel(14)).toEqual({ sb: 1500, bb: 3000 });
    expect(blindsForLevel(15)).toEqual({ sb: 2250, bb: 4500 });
    expect(blindsForLevel(16)).toEqual({ sb: 3400, bb: 6800 });
    expect(blindsForLevel(17)).toEqual({ sb: 5000, bb: 10000 });
    for (let l = 14; l < 30; l += 1) {
      const { sb, bb } = blindsForLevel(l);
      expect(Number.isInteger(sb)).toBe(true);
      expect(bb).toBeGreaterThan(blindsForLevel(l - 1).bb);
    }
  });
});
