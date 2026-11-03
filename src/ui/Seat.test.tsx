import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ROSTER } from '../bots/profiles';
import { cards } from '../engine/cards';
import type { PlayerState } from '../engine/types';
import { Seat, type SeatProps } from './Seat';

const player = (o: Partial<PlayerState> = {}): PlayerState => ({
  id: 'bruno', stack: 1480, bet: 0, committed: 20, hole: cards('As Kh'), folded: false, allIn: false, out: false, acted: false, ...o,
});

const props = (o: Partial<SeatProps> = {}): SeatProps => ({
  player: player(),
  profile: ROSTER.find((p) => p.id === 'bruno') ?? null,
  active: false,
  isDealer: false,
  callout: null,
  pose: 'idle',
  cue: null,
  deck: 'color',
  showHole: false,
  ...o,
});

const seatEl = (c: HTMLElement) => c.querySelector('[data-seat]') as HTMLElement;

describe('<Seat />', () => {
  it('shows the name and stack', () => {
    render(<Seat {...props()} />);
    expect(screen.getByText('Bruno')).toBeTruthy();
    expect(screen.getByText('1 480')).toBeTruthy();
  });

  it('the active bot seat has the dashed outline class and “Thinking…”', () => {
    const { container } = render(<Seat {...props({ active: true, pose: 'thinking' })} />);
    expect(seatEl(container).className).toContain('active');
    expect(screen.getByText('Thinking…')).toBeTruthy();
  });

  it('the active player seat says “Your turn”', () => {
    const { container } = render(<Seat {...props({ player: player({ id: 'you' }), profile: null, active: true, showHole: true })} />);
    expect(seatEl(container).className).toContain('active');
    expect(screen.getByText('Your turn')).toBeTruthy();
  });

  it('folded, all-in and out seats show their tags', () => {
    const { rerender } = render(<Seat {...props({ player: player({ folded: true }) })} />);
    expect(screen.getByText('FOLD')).toBeTruthy();
    rerender(<Seat {...props({ player: player({ allIn: true, stack: 0 }) })} />);
    expect(screen.getByText('ALL-IN')).toBeTruthy();
    rerender(<Seat {...props({ player: player({ out: true, stack: 0, hole: null }), pose: 'busted' })} />);
    expect(screen.getByText('OUT')).toBeTruthy();
  });

  it('an opponent’s hole cards are face down unless shown', () => {
    const { rerender } = render(<Seat {...props()} />);
    expect(screen.getAllByRole('img', { name: 'Face-down card' })).toHaveLength(2);
    expect(screen.queryByRole('img', { name: 'Ace of spades' })).toBeNull();
    rerender(<Seat {...props({ showHole: true })} />);
    expect(screen.getByRole('img', { name: 'Ace of spades' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'King of hearts' })).toBeTruthy();
  });

  it('shows the call-out bubble', () => {
    render(<Seat {...props({ callout: 'Raises to 120' })} />);
    expect(screen.getByText('Raises to 120')).toBeTruthy();
  });
});
