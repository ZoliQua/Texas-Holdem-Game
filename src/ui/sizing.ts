import type { LegalActions } from '../engine/types';

/** Raise-to amount for a pot fraction: the bet to match plus that share of the pot after calling. */
export function presetAmount(f: number | 'min' | 'max', legal: LegalActions, pot: number, betTo: number): number {
  if (legal.minRaiseTo === null) return 0;
  if (f === 'min') return legal.minRaiseTo;
  if (f === 'max') return legal.maxRaiseTo;
  const raw = betTo + f * (pot + legal.callAmount);
  return Math.round(Math.min(legal.maxRaiseTo, Math.max(legal.minRaiseTo, raw)));
}

