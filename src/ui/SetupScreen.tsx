import { POOL_LABEL, type Difficulty } from '../bots/profiles';
import { expectedMinutes, LENGTHS, type Format, type LengthMin } from '../engine/schedule';
import { BASE_POINTS, HEADS_UP_WIN_SHARE } from '../game/scoring';
import type { Setup } from '../game/state';
import styles from './SetupScreen.module.css';

const FORMAT_LABEL: Record<Format, string> = { headsUp: 'Heads-up', sixMax: '6-max' };
const FORMAT_HINT: Record<Format, string> = { headsUp: 'You against one bot', sixMax: 'You and five bots' };
const DIFF_HINT: Record<Difficulty, string> = {
  easy: 'Friendly players who make mistakes and give their hands away.',
  medium: 'Solid regulars — with one surprise guest at a 6-max table.',
  hard: 'Sharp readers who exploit habits and hide their tells.',
};

/** Format, difficulty and length before each tournament. */
export function SetupScreen({ value: setup, onChange: setSetup, onStart }: { value: Setup; onChange(s: Setup): void; onStart(s: Setup): void }) {
  const win = setup.format === 'sixMax' ? BASE_POINTS[setup.difficulty] : Math.round(BASE_POINTS[setup.difficulty] * HEADS_UP_WIN_SHARE);
  const minutes = expectedMinutes(setup.format, setup.length);
  return (
    <form
      className={styles.setup}
      onSubmit={(e) => {
        e.preventDefault();
        onStart(setup);
      }}
    >
      <fieldset className={styles.group}>
        <legend>Format</legend>
        <div className="arc-segmented arc-segmented--full">
          {(['headsUp', 'sixMax'] as const).map((f) => (
            <button key={f} type="button" aria-pressed={setup.format === f} onClick={() => setSetup({ ...setup, format: f })}>
              <strong>{FORMAT_LABEL[f]}</strong>
              <small>{FORMAT_HINT[f]}</small>
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className={styles.group}>
        <legend>Difficulty</legend>
        <div className="arc-segmented arc-segmented--full">
          {(['easy', 'medium', 'hard'] as const).map((d) => (
            <button key={d} type="button" aria-pressed={setup.difficulty === d} onClick={() => setSetup({ ...setup, difficulty: d })}>
              {POOL_LABEL[d]}
            </button>
          ))}
        </div>
        <p className={styles.hint}>{DIFF_HINT[setup.difficulty]}</p>
      </fieldset>
      <fieldset className={styles.group}>
        <legend>Length</legend>
        <div className="arc-segmented arc-segmented--full">
          {LENGTHS.map((l: LengthMin) => (
            <button key={l} type="button" aria-pressed={setup.length === l} onClick={() => setSetup({ ...setup, length: l })}>
              {l} min
            </button>
          ))}
        </div>
        <p className={styles.hint}>
          Blinds rise by hands played, not by the clock.{' '}
          {Math.abs(minutes - setup.length) / setup.length > 0.1 ? `Typically about ${Math.round(minutes)} min at Normal speed.` : ''}
        </p>
      </fieldset>
      <p className={styles.score}>
        Starting stacks 1 500 · a win pays <strong>{win}</strong> points
      </p>
      <button type="submit" className={`arc-btn arc-btn--primary ${styles.start}`}>
        Deal me in <kbd className="arc-kbd">Enter</kbd>
      </button>
    </form>
  );
}

export default SetupScreen;
