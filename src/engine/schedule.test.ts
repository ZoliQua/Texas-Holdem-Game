import { describe, expect, it } from 'vitest';
import schedule from './schedule.json';
import { DEFAULT_LENGTH, handsPerLevel, LENGTHS, type Format } from './schedule';

const FORMATS: Format[] = ['headsUp', 'sixMax'];

describe('blind schedule', () => {
  it('has a calibrated value for every format × length pair', () => {
    expect(LENGTHS).toEqual([20, 30, 45, 60]);
    expect(DEFAULT_LENGTH).toBe(45);
    for (const f of FORMATS) {
      for (const l of LENGTHS) {
        const n = handsPerLevel(f, l);
        expect(Number.isInteger(n)).toBe(true);
        expect(n).toBeGreaterThan(0);
      }
    }
  });

  it('longer tournaments get longer levels (strictly while the target is reachable)', () => {
    for (const f of FORMATS) {
      for (let i = 1; i < LENGTHS.length; i += 1) {
        const prev = handsPerLevel(f, LENGTHS[i - 1]);
        const cur = handsPerLevel(f, LENGTHS[i]);
        if (schedule.entries[f][String(LENGTHS[i]) as '20'].reachable) expect(cur).toBeGreaterThan(prev);
        else expect(cur).toBeGreaterThanOrEqual(prev);
      }
    }
  });

  it('records the time model and the medians it achieved', () => {
    expect(schedule.model).toEqual({ dealS: 2.5, botActionS: 1.3, humanActionS: 4, streetS: 1.5, awardS: 3 });
    expect(schedule.tournaments).toBeGreaterThanOrEqual(300);
    for (const f of FORMATS) {
      for (const l of LENGTHS) {
        const e = schedule.entries[f][String(l) as '20'];
        expect(e.medianMin).toBeGreaterThan(0);
        if (e.reachable) expect(Math.abs(e.medianMin - l) / l).toBeLessThanOrEqual(0.1);
      }
    }
  });
});
