import type { ReactNode } from 'react';
import { formatNumber, Tooth, useDental, useIsTouch, useKitMessages, useLang, useMessages, type RulesSection } from './arcade';
import type { Difficulty } from './bots/profiles';
import { rankLabel, rankOf, suitOf, type Card } from './engine/cards';
import { STARTING_STACK } from './engine/tournament';
import { SIX_MAX_SHARES, tournamentScore } from './game/scoring';
import { MESSAGES, type MessageKey } from './i18n';
import { SuitShape } from './ui/CardView';
import { ordinal } from './ui/format';
import { HAND_LADDER } from './ui/handLadder';
import { POOL_KEY } from './ui/labels';
import { SUIT_FILL, type DeckStyle } from './ui/themes';

const ROW_H = 34;
const CARD_W = 22;
const CARD_H = 31;
const CARD_X0 = 152;
const CARD_STEP = 26;
const WIDTH = CARD_X0 + 4 * CARD_STEP + CARD_W + 4;

const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard'];
const PRESET_KEYS: readonly MessageKey[] = ['presetMin', 'presetHalf', 'presetThreeQuarter', 'presetPot', 'presetAllIn'];

/** One small card face: rank + suit shape; cards that make the hand have a solid frame, kickers a dashed one and sit lower. */
function MiniCard({ card, x, y, kicker, deck }: { card: Card; x: number; y: number; kicker: boolean; deck: DeckStyle }) {
  const suit = suitOf(card);
  const fill = SUIT_FILL[deck][suit];
  const top = kicker ? y + 3 : y;
  return (
    <g data-kicker={kicker} opacity={kicker ? 0.6 : 1}>
      <rect
        x={x}
        y={top}
        width={CARD_W}
        height={CARD_H}
        rx={3}
        fill="#fbfbf7"
        stroke={kicker ? 'rgba(0,0,0,.55)' : '#111'}
        strokeWidth={kicker ? 1 : 1.8}
        strokeDasharray={kicker ? '2.5 2' : undefined}
      />
      <text x={x + 3} y={top + 11} fontSize={rankOf(card) === 10 ? 8.5 : 10} fontWeight={800} fill={fill} fontFamily="ui-sans-serif, system-ui, sans-serif">
        {rankLabel(rankOf(card))}
      </text>
      <SuitShape suit={suit} fill={fill} x={x + 6} y={top + 14} size={13} />
    </g>
  );
}

/** Rules diagram: the ten hand rankings from best to worst, each with five example cards. Follows dental mode (rank badges on teeth). */
export function HandLadderDiagram({ deck = 'color' }: { deck?: DeckStyle }) {
  const m = useMessages(MESSAGES);
  const [lang] = useLang();
  const [dental] = useDental();
  const list = HAND_LADDER.map((r) => m(r.label)).join(', ');
  const legend = m('rulesLadderLegend');
  return (
    <figure style={{ margin: '8px 0' }}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HAND_LADDER.length * ROW_H + 4}`}
        role="img"
        aria-label={m('rulesLadderLabel', { list, legend })}
        style={{ width: '100%', maxWidth: 420, height: 'auto', display: 'block', margin: '0 auto' }}
      >
        {HAND_LADDER.map((r, i) => {
          const y = i * ROW_H + 2;
          return (
            <g key={r.label} data-ladder-row={i + 1}>
              {i % 2 === 0 && <rect x={0} y={y - 1} width={WIDTH} height={ROW_H} rx={6} fill="var(--panel-border)" opacity={0.35} />}
              {dental ? (
                <g data-ladder-badge="tooth" transform={`translate(2 ${y + 1})`}>
                  <Tooth size={28} />
                </g>
              ) : (
                <circle data-ladder-badge="ring" cx={16} cy={y + 15} r={11} fill="none" stroke="var(--text)" strokeWidth={1.5} />
              )}
              <text x={16} y={y + (dental ? 16 : 19)} textAnchor="middle" fontSize={11} fontWeight={800} fill={dental ? '#2a2f3a' : 'var(--text)'}>
                {formatNumber(i + 1, lang)}
              </text>
              <text x={34} y={y + 19} fontSize={12} fontWeight={600} fill="var(--text)">
                {m(r.label)}
              </text>
              {r.cards.map((c, k) => (
                <MiniCard key={c} card={c} x={CARD_X0 + k * CARD_STEP} y={y} kicker={r.kickers[k]} deck={deck} />
              ))}
            </g>
          );
        })}
      </svg>
      <figcaption style={{ fontSize: 12, color: 'var(--text-mute)', textAlign: 'center', marginTop: 4 }}>{legend}</figcaption>
    </figure>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- the diagram and its hook belong together
export function useRulesSections(deck: DeckStyle = 'color'): RulesSection[] {
  const m = useMessages(MESSAGES);
  const k = useKitMessages();
  const [lang] = useLang();
  const touch = useIsTouch();
  const num = (n: number) => formatNumber(n, lang);
  const ios = typeof navigator !== 'undefined' && /iP(hone|od)/.test(navigator.userAgent);
  const points = (difficulty: Difficulty, format: 'sixMax' | 'headsUp', place: number) => tournamentScore({ difficulty, format, place });
  const sixMax = DIFFICULTIES.map((d) => {
    const places = SIX_MAX_SHARES.map((_, i) => m('rulesScoringPlace', { ord: ordinal(i + 1, lang), n: num(points(d, 'sixMax', i + 1)) })).join(', ');
    return <li key={d}>{m('rulesScoringSixMax', { pool: m(POOL_KEY[d]), places })}</li>;
  });
  const max = Math.max(...DIFFICULTIES.flatMap((d) => [points(d, 'sixMax', 1), points(d, 'headsUp', 1)]));
  const mobile: ReactNode = (
    <ul>
      <li>{m('rulesMobileBar')}</li>
      <li>{m('rulesMobileSlider')}</li>
      <li>{m('rulesMobileFs')}</li>
      {ios && <li>{k('iosHomeScreenTip')}</li>}
    </ul>
  );
  return [
    { id: 'goal', body: <p>{m('rulesGoalText', { stack: num(STARTING_STACK) })}</p> },
    {
      id: 'play',
      body: <p>{touch ? m('rulesPlayTouch', { presets: PRESET_KEYS.map((p) => m(p)).join(', ') }) : m('rulesPlayKeys')}</p>,
    },
    {
      id: 'rules',
      body: (
        <>
          <ul>
            <li>{m('rulesRulesLadder')}</li>
            <li>{m('rulesRulesBlinds')}</li>
            <li>{m('rulesRulesAllIn')}</li>
            <li>{m('rulesRulesOut')}</li>
          </ul>
          <HandLadderDiagram deck={deck} />
        </>
      ),
    },
    {
      id: 'scoring',
      body: (
        <>
          <p>{m('rulesScoringIntro')}</p>
          <ul>
            {sixMax}
            <li>
              {m('rulesScoringHeadsUp', {
                easy: num(points('easy', 'headsUp', 1)),
                medium: num(points('medium', 'headsUp', 1)),
                hard: num(points('hard', 'headsUp', 1)),
                lose: num(points('hard', 'headsUp', 2)),
              })}
            </li>
          </ul>
          <p>{m('rulesScoringMax', { max: num(max) })}</p>
          <p>{m('rulesScoringFinish')}</p>
        </>
      ),
    },
    { id: 'dental', body: <p>{m('rulesDentalText')}</p> },
    { id: 'mobile', body: mobile },
  ];
}
