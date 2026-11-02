import schedule from './schedule.json';

export type Format = 'headsUp' | 'sixMax';
export type LengthMin = 20 | 30 | 45 | 60;

export const LENGTHS: readonly LengthMin[] = [20, 30, 45, 60];
export const DEFAULT_LENGTH: LengthMin = 45;

export const isFormat = (v: unknown): v is Format => v === 'headsUp' || v === 'sixMax';
export const isLength = (v: unknown): v is LengthMin => LENGTHS.includes(v as LengthMin);

/**
 * Hands per blind level for a format and target length, calibrated by
 * `scripts/calibrate-blinds.ts` (bot-only simulation with a per-hand time model).
 */
export function handsPerLevel(format: Format, length: LengthMin): number {
  return schedule.entries[format][String(length) as '20'].handsPerLevel;
}

/** The median length the calibration achieved, in minutes (for the setup screen). */
export function expectedMinutes(format: Format, length: LengthMin): number {
  return schedule.entries[format][String(length) as '20'].medianMin;
}
