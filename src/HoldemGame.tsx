import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type CSSProperties } from 'react';
import {
  clearSession,
  FinishButton,
  formatClock,
  formatNumber,
  FullscreenButton,
  gameName,
  GameOverlay,
  KeyHelp,
  RulesButton,
  SaveBadge,
  StatPanel,
  TouchHelp,
  useArcadeRun,
  useImmersive,
  useRestoredSession,
  useRunTimer,
  useKitMessages,
  useLang,
  useMessages,
  useSessionAutosave,
  type ArcadeGameProps,
  type ArcadeStatus,
  type OverlayAction,
} from './arcade';
import type { TellCue } from './bots/tells';
import { blindsForLevel } from './engine/blinds';
import { potSize } from './engine/hand';
import { isHoldemSession } from './game/persist';
import { standingPlace, tournamentScore } from './game/scoring';
import { SPEED_FACTOR } from './game/speed';
import {
  advance,
  createInitialState,
  isPlayerTurn,
  playerLegal,
  PLAYER_ID,
  playerSeat,
  type GameState,
  type Setup,
} from './game/state';
import { useBotTurns } from './game/useBotTurns';
import { useHoldemKeys } from './hooks/useHoldemKeys';
import { MESSAGES, type MessageKey } from './i18n';
import { useRulesSections } from './rules';
import { ActionBar, type ActionBarHandle } from './ui/ActionBar';
import { CharacterCard } from './ui/CharacterCard';
import { calloutFor, formatChips, ordinal } from './ui/format';
import { FORMAT_LABEL, POOL_NOTE_KEY } from './ui/labels';
import { LogPanel } from './ui/LogPanel';
import { SettingsPanel } from './ui/SettingsPanel';
import { SetupScreen } from './ui/SetupScreen';
import { Table } from './ui/Table';
import { useSettings } from './ui/useSettings';
import type { Action, LogEvent } from './engine/types';
import styles from './App.module.css';

/** Bump when GameState changes shape; older saves are then discarded. */
export const SESSION_SCHEMA = 1;
/** How long an action's chips and call-out animate before the next decision (Normal speed). */
export const SETTLE_MS = 450;
/** How long a call-out bubble stays (Normal speed). */
export const CALLOUT_MS = 1600;
/** Pause after a hand before the next deal (Normal speed); longer after a showdown. */
export const HAND_PAUSE_MS = 1800;
export const SHOWDOWN_PAUSE_MS = 3200;
/** Lets the last pot slide before the result card covers the table. */
export const RESULT_DELAY_MS = 1600;

/** UI phase over the tournament: before the first deal, playing, paused. */
type UiPhase = 'idle' | 'live' | 'paused';

const KEYS: [string, MessageKey][] = [
  ['F', 'keyFold'],
  ['C', 'keyCheckCall'],
  ['R', 'keyRaise'],
  ['← →', 'keyNudge'],
  ['A', 'keyAllIn'],
  ['Enter', 'keyConfirm'],
  ['P Esc', 'keyPause'],
];

const TOUCH_ROWS: [MessageKey, MessageKey][] = [
  ['touchBar', 'touchBarAction'],
  ['touchSlider', 'touchSliderAction'],
  ['touchPreset', 'touchPresetAction'],
  ['touchSeat', 'touchSeatAction'],
];

const newSeed = () => (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;

export function HoldemGame(props: ArcadeGameProps = {}) {
  const { embedded = false } = props;
  const tr = useMessages(MESSAGES);
  const k = useKitMessages();
  const [lang] = useLang();
  const restored = useRestoredSession<GameState>('holdem', SESSION_SCHEMA, isHoldemSession);
  const resumable = restored !== null && (restored.data.phase === 'playing' || restored.data.phase === 'handOver');

  const [game, dispatch] = useReducer(advance, undefined, (): GameState => {
    if (!restored) return createInitialState();
    // A finished run is already recorded; start over at the setup with the same choices.
    if (!resumable) return createInitialState(restored.data.setup);
    return { ...restored.data, pending: null };
  });
  const [ui, setUi] = useState<UiPhase>(resumable ? 'paused' : 'idle');
  const [runKey, setRunKey] = useState(0);
  const [welcomeBack, setWelcomeBack] = useState(resumable);
  const [confirmNew, setConfirmNew] = useState(false);
  const [openChar, setOpenChar] = useState<string | null>(null);
  const [setup, setSetup] = useState<Setup>(game.setup);
  const [cues, setCues] = useState<Record<string, TellCue | null>>({});
  const [turn, setTurn] = useState<{ id: string; ms: number } | null>(null);
  // The event behind each seat's bubble; worded at render time, so a language switch re-words it.
  const [callouts, setCallouts] = useState<Record<string, LogEvent | null>>({});
  const [showResult, setShowResult] = useState(false);
  const settings = useSettings();
  const factor = SPEED_FACTOR[settings.speed];
  const bar = useRef<ActionBarHandle>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const immersive = useImmersive(rootRef);
  const rulesSections = useRulesSections(settings.deck);
  const [rulesOpen, setRulesOpen] = useState(false);
  // The Finish confirm is open: bots, animations and the clock wait without leaving `running`.
  const [finishOpen, setFinishOpen] = useState(false);

  const finished = game.phase === 'finished';
  const status: ArcadeStatus = ui === 'idle' ? 'idle' : finished ? 'gameOver' : ui === 'paused' ? 'paused' : 'running';
  const running = status === 'running';
  const dialogOpen = confirmNew || openChar !== null || rulesOpen || finishOpen;
  const place = game.playerPlace;
  const score = finished && place !== null ? tournamentScore({ difficulty: game.setup.difficulty, format: game.setup.format, place }) : 0;

  const seconds = useRunTimer(running && !finishOpen, runKey, runKey === 0 && resumable ? (restored?.seconds ?? 0) : 0);

  const stats = useArcadeRun({
    gameId: 'holdem',
    status,
    score,
    seconds,
    runKey,
    outcome: () => (game.finishedEarly ? 'finished' : place === 1 ? 'win' : 'loss'),
    props,
  });

  const inTournament = game.phase === 'playing' || game.phase === 'handOver';
  const savedAt = useSessionAutosave({
    gameId: 'holdem',
    schema: SESSION_SCHEMA,
    enabled: ui !== 'idle' && inTournament,
    discard: ui === 'idle' || finished,
    data: game,
    seconds,
    score: 0,
  });

  // ── Pacing ──────────────────────────────────────────────────
  const paused = !running || dialogOpen;

  // Let an action's chips and bubble play before anybody acts again.
  useEffect(() => {
    if (game.pending === null || paused) return;
    const nonce = game.pending;
    const id = window.setTimeout(() => dispatch({ type: 'settle', nonce }), SETTLE_MS * factor);
    return () => window.clearTimeout(id);
  }, [game.pending, paused, factor]);

  // Next deal after a short look at the result.
  const showdown = game.table.events.some((e) => e.t === 'show');
  useEffect(() => {
    if (game.phase !== 'handOver' || paused || game.pending !== null) return;
    const id = window.setTimeout(() => dispatch({ type: 'nextHand' }), (showdown ? SHOWDOWN_PAUSE_MS : HAND_PAUSE_MS) * factor);
    return () => window.clearTimeout(id);
  }, [game.phase, game.table.handNo, paused, game.pending, showdown, factor]);

  useEffect(() => {
    if (!finished) {
      setShowResult(false);
      return;
    }
    // Finished on purpose: nothing is sliding, the card shows at once.
    if (game.finishedEarly) {
      setShowResult(true);
      return;
    }
    const id = window.setTimeout(() => setShowResult(true), RESULT_DELAY_MS * Math.max(0.5, factor));
    return () => window.clearTimeout(id);
  }, [finished, factor, game.finishedEarly]);

  const onCue = useCallback((id: string, cue: TellCue | null) => setCues((c) => ({ ...c, [id]: cue })), []);
  useBotTurns({ state: game, dispatch, paused, speed: settings.speed, onCue, onTurn: setTurn });

  // Call-outs: each new action shows as a bubble at its seat for a moment.
  const seen = useRef<{ hand: number; count: number }>({ hand: game.table.handNo, count: game.table.events.length });
  const bubbleTimers = useRef(new Map<string, number>());
  useEffect(() => {
    const t = game.table;
    const from = seen.current.hand === t.handNo ? seen.current.count : 0;
    seen.current = { hand: t.handNo, count: t.events.length };
    const fresh = t.events.slice(from).filter((e) => calloutFor(e) !== null);
    if (fresh.length === 0) return;
    const latest: Record<string, LogEvent> = {};
    for (const e of fresh) latest[(calloutFor(e) as { id: string }).id] = e;
    setCallouts((prev) => ({ ...prev, ...latest }));
    for (const id of Object.keys(latest)) {
      window.clearTimeout(bubbleTimers.current.get(id));
      bubbleTimers.current.set(
        id,
        window.setTimeout(() => setCallouts((prev) => ({ ...prev, [id]: null })), CALLOUT_MS * factor),
      );
    }
  }, [game.table, factor]);
  useEffect(() => {
    const timers = bubbleTimers.current;
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, []);

  // Leaving the tab pauses, so neither the clock nor the bots run unseen.
  useEffect(() => {
    if (!running) return;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') setUi((p) => (p === 'live' ? 'paused' : p));
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [running]);

  // ── Actions ─────────────────────────────────────────────────
  const start = useCallback((s: Setup) => {
    dispatch({ type: 'start', setup: s, seed: newSeed() });
    seen.current = { hand: 0, count: 0 };
    setCallouts({});
    setCues({});
    setWelcomeBack(false);
    setUi('live');
    setRunKey((k) => k + 1);
  }, []);

  const togglePause = useCallback(() => {
    if (ui === 'idle' || finished) return;
    setWelcomeBack(false);
    setUi((p) => (p === 'live' ? 'paused' : 'live'));
  }, [ui, finished]);

  const toSetup = useCallback(() => {
    clearSession('holdem');
    dispatch({ type: 'newTournament' });
    setConfirmNew(false);
    setWelcomeBack(false);
    setShowResult(false);
    setUi('idle');
  }, []);

  const onRulesOpen = useCallback((open: boolean) => {
    setRulesOpen(open);
    if (open) setUi((p) => (p === 'live' ? 'paused' : p));
  }, []);

  const finishEarly = useCallback(() => {
    setWelcomeBack(false);
    setOpenChar(null);
    dispatch({ type: 'finish' });
  }, []);

  const requestNew = useCallback(() => {
    if (finished || ui === 'idle') toSetup();
    else setConfirmNew(true);
  }, [finished, ui, toSetup]);

  const legal = running && !dialogOpen ? playerLegal(game) : null;
  const onAction = useCallback((a: Action) => dispatch({ type: 'player', action: a }), []);

  useHoldemKeys({
    dialog: dialogOpen,
    onDialogConfirm: () => {
      if (rulesOpen || finishOpen) return;
      if (confirmNew) toSetup();
      else setOpenChar(null);
    },
    onDialogCancel: () => {
      // The Rules dialog and the Finish confirm handle their own Escape.
      setConfirmNew(false);
      setOpenChar(null);
    },
    onPrimary: () => {
      if (status === 'idle') start(setup);
      else if (status === 'paused') togglePause();
      else if (status === 'gameOver' && showResult) toSetup();
    },
    onFold: () => legal && bar.current?.fold(),
    onCheckCall: () => legal && bar.current?.checkOrCall(),
    onFocusRaise: () => legal && bar.current?.focusSlider(),
    onNudge: (steps) => legal && bar.current?.nudge(steps),
    onAllIn: () => legal && bar.current?.setAllIn(),
    onConfirm: () => {
      if (status === 'idle') start(setup);
      else if (status === 'paused') togglePause();
      else if (status === 'gameOver') {
        if (showResult) toSetup();
      } else if (legal) bar.current?.confirm();
    },
    onTogglePause: togglePause,
  });

  // ── View ────────────────────────────────────────────────────
  const t = game.table;
  const me = playerSeat(game);
  const { sb, bb } = blindsForLevel(t.level);
  const next = blindsForLevel(t.level + 1);
  const handsLeft = Math.max(0, t.handsPerLevel - t.handsInLevel);
  const alive = t.players.filter((p) => !p.out).length;
  const name = useCallback(
    (id: string) => (id === PLAYER_ID ? tr('you') : (game.bots.find((b) => b.id === id)?.name ?? id)),
    [game.bots, tr],
  );
  const calloutTexts = useMemo(() => {
    const out: Record<string, string | null> = {};
    for (const [id, e] of Object.entries(callouts)) out[id] = e ? (calloutFor(e, lang)?.text ?? null) : null;
    return out;
  }, [callouts, lang]);
  const keyRows = useMemo(() => KEYS.map(([keys, action]): [string, string] => [keys, tr(action)]), [tr]);
  const touchRows = useMemo(() => TOUCH_ROWS.map(([gesture, action]): [string, string] => [tr(gesture), tr(action)]), [tr]);
  // What Finish would rank right now: the points of the player's current place among the players still in.
  const finishScore = inTournament
    ? tournamentScore({ difficulty: game.setup.difficulty, format: game.setup.format, place: standingPlace(t.players, PLAYER_ID) })
    : 0;
  const openProfile = openChar ? (game.bots.find((b) => b.id === openChar) ?? null) : null;
  const best = Math.max(stats.best, score);
  const newBest = score > 0 && score > stats.bestBeforeRun;

  let statusLabel: string | undefined;
  if (status === 'running') {
    if (isPlayerTurn(game)) statusLabel = tr('yourTurn');
    else if (game.phase === 'handOver') statusLabel = tr('nextHandStatus');
    else statusLabel = tr('isThinking', { name: name(t.players[t.toAct ?? 0]?.id ?? '') });
  }

  let overlay: { title: string; message?: string; actions: OverlayAction[] } | null = null;
  if (confirmNew) {
    overlay = {
      title: tr('abandonTitle'),
      message: tr('abandonBody'),
      actions: [
        { label: tr('abandon'), onClick: toSetup, primary: true, kbd: 'Enter' },
        { label: tr('keepPlaying'), onClick: () => setConfirmNew(false), kbd: 'Esc' },
      ],
    };
  } else if (status === 'paused') {
    overlay = welcomeBack
      ? {
          title: k('welcomeBack'),
          message: tr('welcomeBody', { hand: t.handNo, chips: formatChips(me?.stack ?? 0, lang), players: alive }),
          actions: [
            { label: tr('continue'), onClick: togglePause, primary: true, kbd: 'P' },
            { label: tr('newTournament'), onClick: requestNew },
          ],
        }
      : {
          title: k('paused'),
          message: tr('pausedBody'),
          actions: [
            { label: k('resume'), onClick: togglePause, primary: true, kbd: 'P' },
            { label: tr('newTournament'), onClick: requestNew },
          ],
        };
  } else if (status === 'gameOver' && showResult && place !== null) {
    const won = place === 1 && !game.finishedEarly;
    overlay = {
      title: game.finishedEarly ? k('finishedEarly') : won ? tr('wonTitle') : tr('finishedTitle', { ord: ordinal(place, lang), n: place }),
      message:
        (game.finishedEarly ? `${tr('finishedEarlyRank', { ord: ordinal(place, lang) })} · ` : '') +
        (score > 0 ? tr('resultPoints', { points: formatChips(score, lang) }) : tr('resultNoPoints')) +
        tr('resultTail', { hands: formatNumber(t.handNo, lang), time: formatClock(seconds), best: formatChips(best, lang) }) +
        (newBest ? tr('newBestSuffix') : ''),
      actions: [{ label: tr('newTournament'), onClick: toSetup, primary: true, kbd: 'Enter' }],
    };
  }

  const pot = potSize(t);
  const style = { '--game-color': 'var(--game-holdem)' } as CSSProperties;

  return (
    <div ref={rootRef} className={`arc-game ${styles.game}`} style={style}>
      {!embedded && (
        <header className="arc-game__head">
          <div>
            <h1 className="arc-game__title">{gameName('holdem', lang)}</h1>
            <p className="arc-game__sub">{tr('subtitle')}</p>
          </div>
        </header>
      )}

      <StatPanel
        status={status}
        statusLabel={statusLabel}
        items={
          inTournament || finished
            ? [
                { label: tr('statBlinds'), value: `${formatChips(sb, lang)}/${formatChips(bb, lang)}` },
                {
                  label: tr('statNext'),
                  value: (
                    <span className={styles.wrapValue}>
                      {handsLeft > 0
                        ? tr('statIn', { sb: formatChips(next.sb, lang), bb: formatChips(next.bb, lang), n: handsLeft })
                        : tr('statNextHand', { sb: formatChips(next.sb, lang), bb: formatChips(next.bb, lang) })}
                    </span>
                  ),
                },
                { label: tr('statStack'), value: formatChips(me?.stack ?? 0, lang) },
                { label: tr('statPlayers'), value: `${alive} / ${t.players.length}` },
                { label: k('time'), value: formatClock(seconds) },
              ]
            : [
                { label: k('best'), value: formatChips(stats.best, lang) },
                { label: tr('statPlayed'), value: formatNumber(stats.plays, lang) },
                { label: k('time'), value: formatClock(seconds) },
              ]
        }
      />

      <div className={styles.layout}>
        <div className={styles.main}>
          <div className={`arc-game__board arc-board-tap ${styles.tableWrap}`}>
            <Table
              state={game}
              theme={settings.table}
              deck={settings.deck}
              speed={settings.speed}
              cues={cues}
              callouts={calloutTexts}
              turn={turn}
              onOpenCharacter={(id) => {
                if (id !== PLAYER_ID) setOpenChar(id);
              }}
            />
            {status === 'idle' && (
              <div className="arc-overlay" role="dialog" aria-label={tr('newTournament')}>
                <div className={`arc-overlay__card ${styles.setupCard}`}>
                  <h2 className="arc-overlay__title">{gameName('holdem', lang)}</h2>
                  <p className="arc-overlay__msg">{tr('setupBody')}</p>
                  <SetupScreen value={setup} onChange={setSetup} onStart={start} />
                </div>
              </div>
            )}
            {overlay && <GameOverlay {...overlay} />}
            {openProfile && <CharacterCard profile={openProfile} stats={game.stats[openProfile.id]} onClose={() => setOpenChar(null)} />}
          </div>
          {(inTournament || finished) && (
            <ActionBar ref={bar} legal={legal} pot={pot} betTo={t.betTo} bb={bb} onAction={onAction} />
          )}
        </div>

        <aside className={styles.side}>
          <LogPanel log={game.log} name={name} you={PLAYER_ID} deck={settings.deck} />

          <section className="arc-panel">
            <h2 className="arc-panel__title">{tr('panelTournament')}</h2>
            <div className={styles.buttons}>
              <button type="button" className="arc-btn arc-btn--primary" onClick={status === 'idle' ? () => start(setup) : togglePause} disabled={finished}>
                {status === 'running' ? k('pause') : status === 'paused' ? k('resume') : k('start')}
              </button>
              <button type="button" className="arc-btn" onClick={requestNew} disabled={status === 'idle'}>
                {tr('newTournament')}
              </button>
            </div>
            <div className={styles.tools}>
              <RulesButton sections={rulesSections} gameId="holdem" onOpenChange={onRulesOpen} hotkey={false} />
              <FinishButton score={finishScore} visible={ui !== 'idle' && inTournament} onFinish={finishEarly} onOpenChange={setFinishOpen} />
              <FullscreenButton immersive={immersive} />
            </div>
            {inTournament && (
              <p className={styles.note}>
                {tr('tournamentNote', {
                  format: tr(FORMAT_LABEL[game.setup.format]),
                  difficulty: tr(POOL_NOTE_KEY[game.setup.difficulty]),
                  length: game.setup.length,
                  hand: t.handNo,
                })}
              </p>
            )}
            <div className={styles.save}>
              <SaveBadge savedAt={inTournament && ui !== 'idle' ? savedAt : null} />
            </div>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">{tr('panelSettings')}</h2>
            <div className={styles.settings}>
              <SettingsPanel table={settings.table} deck={settings.deck} speed={settings.speed} set={settings.set} dentalRowClass={styles.dentalRow} />
            </div>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">{tr('panelKeys')}</h2>
            <KeyHelp rows={keyRows} />
            <TouchHelp rows={touchRows} />
          </section>
        </aside>
      </div>
    </div>
  );
}

export default HoldemGame;
