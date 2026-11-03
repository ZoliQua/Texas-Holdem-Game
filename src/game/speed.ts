import { prefersReducedMotion } from '../arcade';

export type Speed = 'slow' | 'normal' | 'fast';
export const SPEEDS: readonly Speed[] = ['slow', 'normal', 'fast'];

/** Multiplier on every delay and animation at a given speed (Normal = 1). */
export const SPEED_FACTOR: Record<Speed, number> = { slow: 1.6, normal: 1, fast: 0.45 };

/** Cap for animation durations under `prefers-reduced-motion` (call-outs and the log are never skipped). */
export const REDUCED_MOTION_FACTOR = 0.3;

/** Factor for animations (transitions), honouring reduced motion. */
export function animationFactor(speed: Speed, reduced: boolean = prefersReducedMotion()): number {
  return reduced ? Math.min(SPEED_FACTOR[speed], REDUCED_MOTION_FACTOR) : SPEED_FACTOR[speed];
}
