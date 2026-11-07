import { Fragment, useEffect, useRef, useState } from 'react';
import { useLang, useMessages } from '../arcade';
import { MESSAGES } from '../i18n';
import type { LogEvent } from '../engine/types';
import { CardView } from './CardView';
import { handLines, STREET_KEY } from './logLines';
import type { DeckStyle } from './themes';
import styles from './LogPanel.module.css';

export type LogPanelProps = {
  log: LogEvent[][];
  name(id: string): string;
  you: string;
  deck: DeckStyle;
  /** Hands to render (the log keeps more; older hands load on demand). */
  limit?: number;
};

/** Hands newest first, grouped by street; on phones a drawer with a badge for new entries. */
export function LogPanel({ log, name, you, deck, limit = 30 }: LogPanelProps) {
  const t = useMessages(MESSAGES);
  const [lang] = useLang();
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(limit);
  const total = log.reduce((n, h) => n + h.length, 0);
  const seen = useRef(total);
  if (open) seen.current = total;
  useEffect(() => {
    if (open) seen.current = total;
  }, [open, total]);
  const unread = Math.max(0, total - seen.current);
  const hands = log.slice(-shown).reverse();

  return (
    <section className={`arc-panel ${styles.panel} ${open ? styles.open : ''}`} aria-label={t('logRegion')}>
      <button
        type="button"
        className={`arc-btn arc-btn--ghost ${styles.toggle}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {t('logToggle')}
        {unread > 0 && !open && (
          <span className={styles.badge} aria-label={t('logNew', { n: unread })}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
        <span aria-hidden="true">{open ? '▾' : '▸'}</span>
      </button>
      <h2 className={`arc-panel__title ${styles.title}`}>{t('logToggle')}</h2>
      <div className={styles.body}>
        {hands.length === 0 && <p className={styles.empty}>{t('logEmpty')}</p>}
        {hands.map((events, hi) => {
          const { title, groups } = handLines(events, name, you, lang);
          return (
            <article key={title || hi} className={styles.hand}>
              <h3 className={styles.handTitle}>{title}</h3>
              {groups.map((g, gi) => (
                <Fragment key={gi}>
                  <div className={styles.street}>
                    <span>{t(STREET_KEY[g.street])}</span>
                    {g.board.length > 0 && (
                      <span className={styles.cards}>
                        {g.board.map((c) => (
                          <CardView key={c} card={c} deck={deck} size={20} />
                        ))}
                      </span>
                    )}
                  </div>
                  <ul className={styles.lines}>
                    {g.lines.map((l) => (
                      <li key={l.key} className={styles[l.kind]}>
                        {l.cards && (
                          <span className={styles.cards}>
                            {l.cards.map((c) => (
                              <CardView key={c} card={c} deck={deck} size={18} />
                            ))}
                          </span>
                        )}
                        {l.text}
                      </li>
                    ))}
                  </ul>
                </Fragment>
              ))}
            </article>
          );
        })}
        {log.length > shown && (
          <button type="button" className={`arc-btn arc-btn--ghost ${styles.more}`} onClick={() => setShown((n) => n + 30)}>
            {t('logOlder')}
          </button>
        )}
      </div>
    </section>
  );
}

export default LogPanel;
