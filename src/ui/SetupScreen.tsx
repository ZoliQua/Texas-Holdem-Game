import { formatNumber, useLang, useMessages } from '../arcade';
import type { Difficulty } from '../bots/profiles';
import { STARTING_STACK } from '../engine/tournament';
import { expectedMinutes, LENGTHS, type Format, type LengthMin } from '../engine/schedule';
import { BASE_POINTS, HEADS_UP_WIN_SHARE } from '../game/scoring';
import type { Setup } from '../game/state';
import { MESSAGES, type MessageKey } from '../i18n';
import { FORMAT_LABEL, POOL_KEY } from './labels';
import styles from './SetupScreen.module.css';

const FORMAT_HINT: Record<Format, MessageKey> = { headsUp: 'formatHeadsUpHint', sixMax: 'formatSixMaxHint' };
const DIFF_HINT: Record<Difficulty, MessageKey> = { easy: 'diffHintEasy', medium: 'diffHintMedium', hard: 'diffHintHard' };

/** Format, difficulty and length before each tournament. */
export function SetupScreen({ value: setup, onChange: setSetup, onStart }: { value: Setup; onChange(s: Setup): void; onStart(s: Setup): void }) {
  const t = useMessages(MESSAGES);
  const [lang] = useLang();
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
        <legend>{t('legendFormat')}</legend>
        <div className="arc-segmented arc-segmented--full">
          {(['headsUp', 'sixMax'] as const).map((f) => (
            <button key={f} type="button" aria-pressed={setup.format === f} onClick={() => setSetup({ ...setup, format: f })}>
              <strong>{t(FORMAT_LABEL[f])}</strong>
              <small>{t(FORMAT_HINT[f])}</small>
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className={styles.group}>
        <legend>{t('legendDifficulty')}</legend>
        <div className="arc-segmented arc-segmented--full">
          {(['easy', 'medium', 'hard'] as const).map((d) => (
            <button key={d} type="button" aria-pressed={setup.difficulty === d} onClick={() => setSetup({ ...setup, difficulty: d })}>
              {t(POOL_KEY[d])}
            </button>
          ))}
        </div>
        <p className={styles.hint}>{t(DIFF_HINT[setup.difficulty])}</p>
      </fieldset>
      <fieldset className={styles.group}>
        <legend>{t('legendLength')}</legend>
        <div className="arc-segmented arc-segmented--full">
          {LENGTHS.map((l: LengthMin) => (
            <button key={l} type="button" aria-pressed={setup.length === l} onClick={() => setSetup({ ...setup, length: l })}>
              {t('minutes', { n: l })}
            </button>
          ))}
        </div>
        <p className={styles.hint}>
          {t('blindsRise')}{' '}
          {Math.abs(minutes - setup.length) / setup.length > 0.1 ? t('typically', { n: Math.round(minutes) }) : ''}
        </p>
      </fieldset>
      <p className={styles.score}>
        {t('scoreBefore', { n: formatNumber(STARTING_STACK, lang) })}
        <strong>{formatNumber(win, lang)}</strong>
        {t('scoreAfter')}
      </p>
      <button type="submit" className={`arc-btn arc-btn--primary ${styles.start}`}>
        {t('dealMeIn')} <kbd className="arc-kbd">Enter</kbd>
      </button>
    </form>
  );
}

export default SetupScreen;
