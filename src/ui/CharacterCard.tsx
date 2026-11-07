import { useEffect, useRef } from 'react';
import { formatNumber, LANG_LOCALES, useLang, useMessages, type Lang } from '../arcade';
import type { BotProfile, Style } from '../bots/profiles';
import { aggressionFactor, pct, type PlayerStats } from '../engine/stats';
import { MESSAGES, type MessageKey } from '../i18n';
import { Character } from './Character';
import { POOL_KEY } from './labels';
import styles from './CharacterCard.module.css';

const STYLE_KEY: Record<Style, MessageKey> = {
  rock: 'styleRock', station: 'styleStation', tag: 'styleTag', lag: 'styleLag', maniac: 'styleManiac',
};
const BLURB_KEY: Record<Style, MessageKey> = {
  rock: 'blurbRock', station: 'blurbStation', tag: 'blurbTag', lag: 'blurbLag', maniac: 'blurbManiac',
};

/** One decimal in the language's style: 1.5 · 1,5. */
function oneDecimal(n: number, lang: Lang): string {
  return new Intl.NumberFormat(LANG_LOCALES[lang], { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n);
}

/** The roster bio in the active language; a profile without a dictionary entry keeps its own text. */
function bioKey(id: string): MessageKey | null {
  const key = `bio_${id}`;
  return key in MESSAGES.en ? (key as MessageKey) : null;
}

/** A character's card: who they are and what the table has seen of them. Never reveals their tells. */
export function CharacterCard({ profile, stats, onClose }: { profile: BotProfile; stats: PlayerStats | undefined; onClose(): void }) {
  const t = useMessages(MESSAGES);
  const [lang] = useLang();
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
    [t('ccHands'), formatNumber(s ? s.hands : 0, lang), t('ccHandsHint')],
    [t('ccVpip'), s ? t('ccPct', { n: formatNumber(pct(s.vpip, s.hands), lang) }) : '–', t('ccVpipHint')],
    [t('ccPfr'), s ? t('ccPct', { n: formatNumber(pct(s.pfr, s.hands), lang) }) : '–', t('ccPfrHint')],
    [t('ccAggression'), s && s.hands > 0 ? oneDecimal(aggressionFactor(s), lang) : '–', t('ccAggressionHint')],
    [t('ccShowdowns'), formatNumber(s ? s.showdowns : 0, lang), t('ccShowdownsHint')],
  ];
  const bio = bioKey(profile.id);

  return (
    <div className="arc-overlay" role="dialog" aria-modal="true" aria-label={t('ccLabel', { name: profile.name })} onClick={onClose}>
      <div className={`arc-overlay__card ${styles.card}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.head}>
          <span className={styles.portrait}>
            <Character look={profile.look} pose="idle" cue={null} size={96} />
          </span>
          <div>
            <h2 className={styles.name}>{profile.name}</h2>
            <p className={styles.meta}>
              <span className={styles.chip}>{t(STYLE_KEY[profile.style])}</span>
              <span className={styles.chip}>{t('ccTable', { pool: t(POOL_KEY[profile.pool]) })}</span>
            </p>
          </div>
        </div>
        <p className={styles.blurb}>{t(BLURB_KEY[profile.style])}</p>
        <p className={styles.bio}>“{bio ? t(bio) : profile.bio}”</p>
        <h3 className={styles.sub}>{t('ccThis')}</h3>
        <dl className={styles.stats}>
          {rows.map(([label, value, hint]) => (
            <div key={label} title={hint}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <p className={styles.note}>{t('ccNote')}</p>
        <div className="arc-overlay__actions">
          <button ref={close} type="button" className="arc-btn arc-btn--primary" onClick={onClose}>
            {t('ccClose')} <kbd className="arc-kbd">Esc</kbd>
          </button>
        </div>
      </div>
    </div>
  );
}

export default CharacterCard;
