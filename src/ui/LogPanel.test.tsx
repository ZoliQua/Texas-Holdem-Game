import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { cards } from '../engine/cards';
import type { LogEvent } from '../engine/types';
import { LogPanel } from './LogPanel';

const hand: LogEvent[] = [
  { t: 'hand', hand: 23, sb: 50, bb: 100, button: 'bruno', level: 4 },
  { t: 'blind', id: 'you', amount: 50 },
  { t: 'blind', id: 'pixel', amount: 100 },
  { t: 'deal', street: 'preflop', board: [] },
  { t: 'act', id: 'bruno', action: { kind: 'raise', amount: 300 }, to: 300 },
  { t: 'act', id: 'you', action: { kind: 'call', amount: 250 }, to: 300 },
  { t: 'act', id: 'pixel', action: { kind: 'allIn', amount: 845 }, to: 845 },
  { t: 'act', id: 'bruno', action: { kind: 'call', amount: 545 }, to: 845 },
  { t: 'act', id: 'you', action: { kind: 'fold' }, to: 300 },
  { t: 'deal', street: 'flop', board: cards('Kh 7d 2c') },
  { t: 'deal', street: 'turn', board: cards('Kh 7d 2c 9h') },
  { t: 'deal', street: 'river', board: cards('Kh 7d 2c 9h 4h') },
  { t: 'show', id: 'pixel', hole: cards('Qh Jh'), value: 'Flush, K-high' },
  { t: 'show', id: 'bruno', hole: cards('As Ad'), value: 'Pair of Aces' },
  { t: 'win', pot: 0, ids: ['pixel'], amount: 1990, value: 'Flush, K-high' },
];
const second: LogEvent[] = [
  { t: 'hand', hand: 24, sb: 50, bb: 100, button: 'pixel', level: 4 },
  { t: 'act', id: 'pixel', action: { kind: 'fold' }, to: 0 },
  { t: 'out', id: 'pixel', place: 4 },
];
const NAMES: Record<string, string> = { bruno: 'Bruno', pixel: 'Pixel', you: 'You' };

describe('<LogPanel />', () => {
  it('lists hands newest first with street groups, amounts, the board and results', () => {
    const { container } = render(<LogPanel log={[hand, second]} name={(id) => NAMES[id]} you="you" deck="color" />);
    const titles = [...container.querySelectorAll('h3')].map((h) => h.textContent);
    expect(titles).toEqual(['Hand #24 · Blinds 50/100', 'Hand #23 · Blinds 50/100']);
    expect(screen.getByText('Bruno raises to 300')).toBeTruthy();
    expect(screen.getByText('You call 250')).toBeTruthy();
    expect(screen.getByText('Pixel all-in 845')).toBeTruthy();
    expect(screen.getByText('You post the small blind 50')).toBeTruthy();
    for (const street of ['Preflop', 'Flop', 'Turn', 'River', 'Result']) expect(screen.getAllByText(street).length).toBeGreaterThan(0);
    expect(screen.getByText('Pixel shows — Flush, K-high')).toBeTruthy();
    expect(screen.getByText(/Pixel wins 1,990 with a flush, K-high/)).toBeTruthy();
    expect(screen.getByText('Pixel is out in 4th')).toBeTruthy();
    // The river group shows all five board cards.
    expect(screen.getAllByRole('img', { name: '4 of hearts' }).length).toBeGreaterThan(0);
  });

  it('has a drawer toggle with a badge for entries added while closed', () => {
    const { rerender } = render(<LogPanel log={[hand]} name={(id) => NAMES[id]} you="you" deck="color" />);
    expect(screen.getByRole('button', { name: /Log/ }).getAttribute('aria-expanded')).toBe('false');
    rerender(<LogPanel log={[hand, second]} name={(id) => NAMES[id]} you="you" deck="color" />);
    expect(screen.getByLabelText('3 new')).toBeTruthy();
  });
});
