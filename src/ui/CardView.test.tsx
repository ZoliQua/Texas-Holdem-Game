import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { card } from '../engine/cards';
import { CardView } from './CardView';

describe('<CardView />', () => {
  it('renders the rank and a suit shape, with a spoken name', () => {
    const { container, getByRole } = render(<CardView card={card('Qh')} deck="color" size={60} />);
    expect(container.querySelector('text')?.textContent).toBe('Q');
    expect(container.querySelectorAll('[data-suit="h"]').length).toBeGreaterThanOrEqual(2);
    expect(getByRole('img').getAttribute('aria-label')).toBe('Queen of hearts');
  });

  it('shows 10 as two digits', () => {
    const { container } = render(<CardView card={card('Ts')} deck="color" size={60} />);
    expect(container.querySelector('text')?.textContent).toBe('10');
  });

  it('the grey deck gives all four suits one fill; the colour deck four', () => {
    const fills = (deck: 'color' | 'grey') =>
      new Set(
        ['As', 'Ah', 'Ad', 'Ac'].map((c) => {
          const { container, unmount } = render(<CardView card={card(c)} deck={deck} size={60} />);
          const fill = container.querySelector('text')?.getAttribute('fill');
          unmount();
          return fill;
        }),
      );
    expect(fills('grey').size).toBe(1);
    expect(fills('color').size).toBe(4);
  });

  it('a face-down card hides its rank and suit', () => {
    const { container, getByRole } = render(<CardView card={card('As')} deck="color" size={60} faceDown />);
    expect(container.querySelector('text')).toBeNull();
    expect(container.querySelector('[data-suit]')).toBeNull();
    expect(getByRole('img').getAttribute('aria-label')).toBe('Face-down card');
  });

  it('highlight raises and outlines the card', () => {
    const { container } = render(<CardView card={card('As')} deck="color" size={60} highlight />);
    expect(container.querySelector('svg')?.getAttribute('class')).toContain('highlight');
    expect(container.querySelector('rect')?.getAttribute('stroke-width')).toBe('6');
  });
});
