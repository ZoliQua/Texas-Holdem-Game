import type { CSSProperties } from 'react';
import type { ArcadeGameProps } from './arcade';

/** Placeholder until the table is wired up. */
export function HoldemGame({ embedded = false }: ArcadeGameProps = {}) {
  return (
    <div className="arc-game" style={{ '--game-color': 'var(--game-holdem)' } as CSSProperties}>
      {!embedded && (
        <header className="arc-game__head">
          <h1 className="arc-game__title">Texas Hold&apos;em</h1>
        </header>
      )}
    </div>
  );
}

export default HoldemGame;
