import { act, render } from '@testing-library/react';
import { useReducer } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { advance, botToAct, type GameAction, type GameState } from './state';
import { startGame } from './testkit';
import { useBotTurns } from './useBotTurns';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

/** A started game where a bot is first to act. */
function botFirst(): GameState {
  for (let seed = 1; seed < 50; seed += 1) {
    const s = startGame({ format: 'sixMax' }, seed);
    if (botToAct(s)) return s;
  }
  throw new Error('no seed with a bot to act first');
}

function Harness({ initial, paused, log }: { initial: GameState; paused: boolean; log: GameAction[] }) {
  const [state, dispatch] = useReducer((s: GameState, a: GameAction) => {
    log.push(a);
    return advance(s, a);
  }, initial);
  useBotTurns({ state, dispatch, paused, speed: 'normal', onCue: () => {} });
  return <span data-events={state.table.events.length} />;
}

const botActions = (log: GameAction[]) => log.filter((a) => a.type === 'bot');

describe('useBotTurns', () => {
  it('does nothing while paused', () => {
    const log: GameAction[] = [];
    render(<Harness initial={botFirst()} paused log={log} />);
    act(() => vi.advanceTimersByTime(10_000));
    expect(log).toHaveLength(0);
  });

  it('dispatches exactly one action per turn, also across pause and resume', () => {
    const log: GameAction[] = [];
    const initial = botFirst();
    const { rerender } = render(<Harness initial={initial} paused log={log} />);
    rerender(<Harness initial={initial} paused={false} log={log} />);
    act(() => vi.advanceTimersByTime(300)); // still thinking
    rerender(<Harness initial={initial} paused log={log} />);
    act(() => vi.advanceTimersByTime(5000));
    expect(botActions(log)).toHaveLength(0);
    rerender(<Harness initial={initial} paused={false} log={log} />);
    act(() => vi.advanceTimersByTime(2000)); // thinking is at most 2 s at Normal speed
    expect(botActions(log)).toHaveLength(1);
    // The table is now animating (pending): no further bot acts until it settles.
    act(() => vi.advanceTimersByTime(5000));
    expect(botActions(log)).toHaveLength(1);
  });

  it('cancels its timer on unmount', () => {
    const log: GameAction[] = [];
    const { unmount } = render(<Harness initial={botFirst()} paused={false} log={log} />);
    act(() => vi.advanceTimersByTime(100));
    unmount();
    act(() => vi.advanceTimersByTime(10_000));
    expect(log).toHaveLength(0);
  });
});
