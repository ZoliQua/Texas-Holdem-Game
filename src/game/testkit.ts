/* Shared helpers for controller tests (not imported by the app). */
import { advance, createInitialState, isPlayerTurn, planBotTurn, type GameState, type Setup } from './state';

export const startGame = (setup: Partial<Setup> = {}, seed = 7): GameState =>
  advance(createInitialState(), {
    type: 'start',
    setup: { format: 'sixMax', difficulty: 'easy', length: 45, ...setup },
    seed,
  });

/** Lets bots act and settles animations until the player must act or the hand is over. */
export function runBots(s: GameState, limit = 500, onStep?: (s: GameState) => void): GameState {
  for (let i = 0; i < limit; i += 1) {
    if (s.pending !== null) s = advance(s, { type: 'settle', nonce: s.pending });
    else if (s.phase === 'playing' && !isPlayerTurn(s)) {
      const plan = planBotTurn(s);
      if (!plan) break;
      s = advance(s, { type: 'bot', id: plan.id, action: plan.action });
    } else break;
    onStep?.(s);
  }
  return s;
}

/** Plays (dealing new hands as needed) until the player is to act or the run is over. */
export function untilPlayerTurn(s: GameState, onStep?: (s: GameState) => void): GameState {
  for (let i = 0; i < 400; i += 1) {
    s = runBots(s, 500, onStep);
    if (isPlayerTurn(s) || s.phase === 'finished') return s;
    if (s.phase === 'handOver') {
      s = advance(s, { type: 'nextHand' });
      onStep?.(s);
    }
  }
  return s;
}
