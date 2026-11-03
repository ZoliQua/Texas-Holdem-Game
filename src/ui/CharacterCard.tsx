import { useEffect, useRef } from 'react';
import { POOL_LABEL, STYLE_BLURB, STYLE_LABEL, type BotProfile } from '../bots/profiles';
import { aggressionFactor, pct, type PlayerStats } from '../engine/stats';
import { Character } from './Character';
import styles from './CharacterCard.module.css';

/** A character's card: who they are and what the table has seen of them. Never reveals their tells. */
export function CharacterCard({ profile, stats, onClose }: { profile: BotProfile; stats: PlayerStats | undefined; onClose(): void }) {
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const s = stats;
  const rows: [string, string, string][] = [
    ['Hands', s ? String(s.hands) : '0', 'dealt in'],
    ['VPIP', s ? `${pct(s.vpip, s.hands)} %` : '–', 'puts chips in preflop'],
    ['PFR', s ? `${pct(s.pfr, s.hands)} %` : '–', 'raises preflop'],
    ['Aggression', s && s.hands > 0 ? aggressionFactor(s).toFixed(1) : '–', 'bets and raises per call'],
    ['Showdowns', s ? String(s.showdowns) : '0', 'hands shown down'],
  ];

  return (
    <div className="arc-overlay" role="dialog" aria-modal="true" aria-label={`${profile.name} — character card`} onClick={onClose}>
      <div className={`arc-overlay__card ${styles.card}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.head}>
          <span className={styles.portrait}>
            <Character look={profile.look} pose="idle" cue={null} size={96} />
          </span>
          <div>
            <h2 className={styles.name}>{profile.name}</h2>
            <p className={styles.meta}>
              <span className={styles.chip}>{STYLE_LABEL[profile.style]}</span>
              <span className={styles.chip}>{POOL_LABEL[profile.pool]} table</span>
            </p>
          </div>
        </div>
        <p className={styles.blurb}>{STYLE_BLURB[profile.style]}</p>
        <p className={styles.bio}>“{profile.bio}”</p>
        <h3 className={styles.sub}>This tournament</h3>
        <dl className={styles.stats}>
          {rows.map(([label, value, hint]) => (
            <div key={label} title={hint}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <p className={styles.note}>Every character has a habit or two that gives their hand away. Watch closely.</p>
        <div className="arc-overlay__actions">
          <button ref={close} type="button" className="arc-btn arc-btn--primary" onClick={onClose}>
            Close <kbd className="arc-kbd">Esc</kbd>
          </button>
        </div>
      </div>
    </div>
  );
}

export default CharacterCard;
