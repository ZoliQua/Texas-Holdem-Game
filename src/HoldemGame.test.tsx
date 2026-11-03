import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readStats, saveSession } from './arcade';
import { cards } from './engine/cards';
import { startHand } from './engine/hand';
import { newTournament } from './engine/tournament';
import { HoldemGame, SESSION_SCHEMA } from './HoldemGame';
import { isHoldemSession } from './game/persist';
import { advance, createInitialState, isPlayerTurn, PLAYER_ID, type GameState } from './game/state';
import { untilPlayerTurn } from './game/testkit';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

const key = (k: string) => fireEvent.keyDown(window, { key: k });
const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms));

/** Runs timers until the player is to act (the action bar has an enabled Fold). */
function waitForMyTurn(limit = 120) {
  for (let i = 0; i < limit; i += 1) {
    const fold = screen.queryByRole('button', { name: /^Fold/ }) as HTMLButtonElement | null;
    if (fold && !fold.disabled) return;
    tick(500);
  }
  throw new Error('the player never got a turn');
}

/** A saved heads-up game at the player's decision with fixed cards. */
function riggedHeadsUp(o: { you: number; bot: number; youHole: string; botHole: string; board: string }): GameState {
  let s = advance(createInitialState(), { type: 'start', setup: { format: 'headsUp', difficulty: 'hard', length: 45 }, seed: 99 });
  const ids = s.table.players.map((p) => p.id);
  let t = newTournament({ seed: 5, playerIds: ids, handsPerLevel: s.table.handsPerLevel });
  t = { ...t, button: 0, players: t.players.map((p, i) => ({ ...p, stack: i === 0 ? o.you : o.bot })) };
  t = startHand(t);
  const you = cards(o.youHole);
  const bot = cards(o.botHole);
  const board = cards(o.board);
  const used = new Set([...you, ...bot, ...board]);
  const rest = Array.from({ length: 52 }, (_, i) => i).filter((c) => !used.has(c));
  t = {
    ...t,
    players: t.players.map((p, i) => ({ ...p, hole: i === 0 ? you : bot })),
    deck: [rest[0], board[0], board[1], board[2], rest[1], board[3], rest[2], board[4], ...rest.slice(3)],
  };
  s = { ...s, table: t, log: [t.events] };
  expect(isHoldemSession(JSON.parse(JSON.stringify(s)))).toBe(true);
  return s;
}

function save(data: GameState) {
  saveSession('holdem', { schema: SESSION_SCHEMA, data, seconds: 42, score: 0 });
}

describe('<HoldemGame />', () => {
  it('setup → start deals a 6-max table with the player’s cards face up', () => {
    const onStatusChange = vi.fn();
    const { container } = render(<HoldemGame onStatusChange={onStatusChange} />);
    expect(screen.getByRole('dialog', { name: 'New tournament' })).toBeTruthy();
    expect(onStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'idle' }));
    fireEvent.click(screen.getByRole('button', { name: /Deal me in/ }));
    expect(container.querySelectorAll('[data-seat]')).toHaveLength(6);
    const mine = container.querySelector(`[data-seat="${PLAYER_ID}"]`) as HTMLElement;
    const faces = [...mine.querySelectorAll('svg[role="img"]')].map((e) => e.getAttribute('aria-label'));
    expect(faces.filter((n) => n && n !== 'Face-down card' && n.includes(' of '))).toHaveLength(2);
    expect(onStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'running' }));
  });

  it('a double Call (two clicks, or Enter twice) applies only one action', () => {
    const start = untilPlayerTurn(
      advance(createInitialState(), { type: 'start', setup: { format: 'headsUp', difficulty: 'easy', length: 45 }, seed: 8 }),
    );
    expect(isPlayerTurn(start)).toBe(true);
    save(start);
    render(<HoldemGame />);
    fireEvent.click(screen.getByRole('button', { name: /Continue/ }));
    const mine = () =>
      [...screen.getByRole('region', { name: 'Hand log' }).querySelectorAll('li')].filter((li) => /^You (call|check|fold|bet|raise|go)/.test(li.textContent ?? '')).length;
    const before = mine();
    const call = screen.getByRole('button', { name: /^(Call|Check)/ });
    fireEvent.click(call);
    fireEvent.click(call);
    key('Enter');
    key('Enter');
    tick(10);
    expect(mine()).toBe(before + 1);
  });

  it('pause stops the bots; P resumes', () => {
    render(<HoldemGame />);
    fireEvent.click(screen.getByRole('button', { name: /Deal me in/ }));
    key('p');
    expect(screen.getByRole('dialog', { name: 'Paused' })).toBeTruthy();
    const before = screen.getByRole('region', { name: 'Hand log' }).textContent;
    tick(20_000);
    expect(screen.getByRole('region', { name: 'Hand log' }).textContent).toBe(before);
    key('p');
    expect(screen.queryByRole('dialog', { name: 'Paused' })).toBeNull();
  });

  it('restores a saved game at the player’s decision with the same cards and no new deal', () => {
    const s = untilPlayerTurn(
      advance(createInitialState(), { type: 'start', setup: { format: 'sixMax', difficulty: 'easy', length: 30 }, seed: 17 }),
    );
    save(s);
    const { container } = render(<HoldemGame />);
    expect(screen.getByRole('dialog', { name: 'Welcome back' })).toBeTruthy();
    const mine = container.querySelector(`[data-seat="${PLAYER_ID}"]`) as HTMLElement;
    const labels = [...mine.querySelectorAll('svg[role="img"]')]
      .map((e) => e.getAttribute('aria-label'))
      .filter((n) => n?.includes(' of '));
    expect(labels).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: /Continue/ }));
    expect((screen.getByRole('button', { name: /^Fold/ }) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByText(`Hand #${s.table.handNo} · Blinds 10/20`)).toBeTruthy();
  });

  it('a won run shows the result and reports the score once', () => {
    // The bot is all-in from its big blind; the player calls with aces.
    save(riggedHeadsUp({ you: 2980, bot: 20, youHole: 'As Ad', botHole: '7c 2d', board: 'Kh 9s 4d 3c Jh' }));
    const onGameOver = vi.fn();
    const onRunEnd = vi.fn();
    render(<HoldemGame onGameOver={onGameOver} onRunEnd={onRunEnd} />);
    fireEvent.click(screen.getByRole('button', { name: /Continue/ }));
    waitForMyTurn();
    key('c');
    tick(8000);
    expect(screen.getByRole('dialog', { name: 'You won the tournament!' })).toBeTruthy();
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(onGameOver).toHaveBeenCalledWith(2000); // hard heads-up: 5000 × 0.4
    expect(onRunEnd).toHaveBeenCalledWith(expect.objectContaining({ outcome: 'win', score: 2000, ranked: true }));
    tick(10_000);
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(readStats('holdem').plays).toBe(1);
  });

  it('a busted player sees the place and scores nothing in a heads-up loss', () => {
    save(riggedHeadsUp({ you: 30, bot: 2970, youHole: '7c 2d', botHole: 'As Ad', board: 'Kh 9s 4d 3c Jh' }));
    const onRunEnd = vi.fn();
    const onGameOver = vi.fn();
    render(<HoldemGame onGameOver={onGameOver} onRunEnd={onRunEnd} />);
    fireEvent.click(screen.getByRole('button', { name: /Continue/ }));
    waitForMyTurn();
    key('a');
    key('Enter');
    tick(15_000);
    // The bot may fold; play on until the run ends.
    for (let i = 0; i < 40 && !screen.queryByRole('dialog', { name: /You (finished|won)/ }); i += 1) {
      const fold = screen.queryByRole('button', { name: /^Fold/ }) as HTMLButtonElement | null;
      if (fold && !fold.disabled) {
        key('a');
        key('Enter');
      }
      tick(3000);
    }
    const result = screen.getByRole('dialog', { name: /You (finished 2nd|won the tournament!)/ });
    expect(result).toBeTruthy();
    expect(onRunEnd).toHaveBeenCalledTimes(1);
    if (result.getAttribute('aria-label') === 'You finished 2nd') {
      expect(onRunEnd).toHaveBeenCalledWith(expect.objectContaining({ outcome: 'loss', score: 0 }));
      expect(onGameOver).not.toHaveBeenCalled();
    }
  });

  it('“New tournament” mid-game asks first and records nothing', () => {
    const onRunEnd = vi.fn();
    render(<HoldemGame onRunEnd={onRunEnd} />);
    fireEvent.click(screen.getByRole('button', { name: /Deal me in/ }));
    tick(3000);
    fireEvent.click(screen.getByRole('button', { name: 'New tournament' }));
    expect(screen.getByRole('dialog', { name: 'Abandon this tournament?' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Abandon/ }));
    expect(screen.getByRole('dialog', { name: 'New tournament' })).toBeTruthy();
    tick(10_000);
    expect(onRunEnd).not.toHaveBeenCalled();
    expect(readStats('holdem').plays).toBe(0);
    expect(localStorage.getItem('arcade.session.holdem')).toBeNull();
  });
});
