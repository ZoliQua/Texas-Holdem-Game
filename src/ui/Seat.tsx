import type { CSSProperties } from 'react';
import { useLang, useMessages } from '../arcade';
import type { BotProfile } from '../bots/profiles';
import type { TellCue } from '../bots/tells';
import type { PlayerState } from '../engine/types';
import { MESSAGES, type MessageKey } from '../i18n';
import { CardView } from './CardView';
import { Character, type Pose } from './Character';
import { formatChips } from './format';
import type { DeckStyle } from './themes';
import styles from './Table.module.css';

export type SeatProps = {
  player: PlayerState;
  /** Null for the human player. */
  profile: BotProfile | null;
  active: boolean;
  isDealer: boolean;
  callout: string | null;
  pose: Pose;
  cue: TellCue | null;
  deck: DeckStyle;
  /** Show the hole cards face up (always for the player, at showdown for bots). */
  showHole: boolean;
  /** Cards of the winning five to raise and outline. */
  highlight?: readonly number[];
  /** Thinking time of an acting bot (drives the turn ring), Normal-speed ms × speed. */
  turnMs?: number | null;
  back?: string;
  onOpen?: () => void;
  className?: string;
  style?: CSSProperties;
};

const TAG_KEY: Record<'out' | 'allin' | 'fold', MessageKey> = { out: 'tagOut', allin: 'tagAllIn', fold: 'tagFold' };

/** The player's own seat face. */
function PlayerBadge() {
  const t = useMessages(MESSAGES);
  return (
    <svg viewBox="0 0 100 100" className={styles.youBadge} aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill="var(--seat-stroke)" />
      <text x="50" y="64" textAnchor="middle" fontSize="40" fontWeight="800" fill="var(--seat-bg)" fontFamily="ui-sans-serif, system-ui">
        {t('you')}
      </text>
    </svg>
  );
}

export function Seat({
  player,
  profile,
  active,
  isDealer,
  callout,
  pose,
  cue,
  deck,
  showHole,
  highlight = [],
  turnMs = null,
  back,
  onOpen,
  className,
  style,
}: SeatProps) {
  const t = useMessages(MESSAGES);
  const [lang] = useLang();
  const me = profile === null;
  const name = profile?.name ?? t('you');
  const tagKind = player.out ? 'out' : player.allIn ? 'allin' : player.folded ? 'fold' : null;
  const tag = tagKind ? t(TAG_KEY[tagKind]) : null;
  const cls = [
    styles.seat,
    me ? styles.me : '',
    active ? styles.active : '',
    player.folded && !player.out ? styles.folded : '',
    player.allIn ? styles.allIn : '',
    player.out ? styles.out : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  const avatar = me ? (
    <PlayerBadge />
  ) : (
    <Character look={(profile as BotProfile).look} pose={pose} cue={cue} size={0} className={styles.avatarArt} />
  );
  const label =
    t('seatLabel', { name, n: formatChips(player.stack, lang) }) +
    (tag ? `, ${tag.toLowerCase()}` : '') +
    (active ? (me ? t('seatTurnYou') : t('seatThinking')) : '');

  return (
    <div className={cls} style={style} data-seat={player.id} aria-label={label}>
      {active && <span className={styles.turnLabel}>{me ? t('yourTurn') : t('thinking')}</span>}
      {callout && (
        <span className={styles.callout} role="status" key={callout}>
          {callout}
        </span>
      )}
      <div className={styles.pill}>
        {onOpen && !me ? (
          <button type="button" className={styles.avatar} onClick={onOpen} aria-label={t('about', { name })} title={t('about', { name })}>
            {avatar}
          </button>
        ) : (
          <span className={styles.avatar}>{avatar}</span>
        )}
        {active && !me && turnMs !== null && (
          <svg className={styles.turnRing} viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" r="18" style={{ animationDuration: `${turnMs}ms` }} />
          </svg>
        )}
        <span className={styles.info}>
          <strong className={styles.name}>{name}</strong>
          <span className={styles.stack}>{formatChips(player.stack, lang)}</span>
        </span>
        {isDealer && <span className={styles.srOnly}>{t('dealer')}</span>}
      </div>
      {tagKind && <span className={`${styles.tag} ${styles[`tag-${tagKind}`]}`}>{tag}</span>}
      {player.hole && (showHole || !player.out) && (me || !player.folded) && (
        <span className={`${styles.hole} ${me ? styles.holeMe : ''}`}>
          {player.hole.map((c, i) => (
            <CardView
              key={`${c}-${i}`}
              card={c}
              deck={deck}
              size={0}
              faceDown={!showHole}
              back={back}
              highlight={showHole && highlight.includes(c)}
              className={styles.holeCard}
              style={{ ['--i' as string]: i }}
            />
          ))}
        </span>
      )}
    </div>
  );
}

export default Seat;
