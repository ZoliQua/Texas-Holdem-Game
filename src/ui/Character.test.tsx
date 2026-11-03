import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ROSTER, type TellKind } from '../bots/profiles';
import { Character } from './Character';
import { POSES } from './pose';

const look = ROSTER[0].look;

describe('<Character />', () => {
  it('renders every pose for every character', () => {
    for (const p of ROSTER) {
      for (const pose of POSES) {
        const { container, unmount } = render(<Character look={p.look} pose={pose} cue={null} size={60} />);
        const svg = container.querySelector('svg') as SVGElement;
        expect(svg.getAttribute('class')).toContain(`pose-${pose}`);
        expect(svg.getAttribute('data-pose')).toBe(pose);
        unmount();
      }
    }
  });

  it('a tell cue adds its tell-<kind> class and timing', () => {
    const kinds: TellKind[] = ['earTwitch', 'glance', 'leanBack', 'chipShuffle', 'longStare', 'snapCall'];
    for (const kind of kinds) {
      const { container, unmount } = render(
        <Character look={look} pose="thinking" cue={{ kind, atMs: 200, durationMs: 900, thinkMs: 1400 }} size={60} />,
      );
      const svg = container.querySelector('svg') as SVGElement;
      expect(svg.getAttribute('class')).toContain(`tell-${kind}`);
      expect(svg.style.getPropertyValue('--cue-delay')).toBe('200ms');
      unmount();
    }
  });

  it('has no tell class without a cue', () => {
    const { container } = render(<Character look={look} pose="idle" cue={null} size={60} />);
    expect(container.querySelector('svg')?.getAttribute('class')).not.toContain('tell-');
  });
});
