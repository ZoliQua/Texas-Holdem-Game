import { useCallback, useEffect, useReducer, useRef, useState, type CSSProperties } from 'react';
import {
  clearSession,
  formatClock,
  GameOverlay,
  KeyHelp,
  SaveBadge,
  StatPanel,
  useArcadeRun,
  useRestoredSession,
  useRunTimer,
  useSessionAutosave,
  type ArcadeGameProps,
  type ArcadeStatus,
  type OverlayAction,
} from './arcade';
import type { TellCue } from './bots/tells';
import { blindsForLevel } from './engine/blinds';
import { potSize } from './engine/hand';
import { isHoldemSession } from './game/persist';
import { tournamentScore } from './game/scoring';
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
import { ActionBar, type ActionBarHandle } from './ui/ActionBar';
import { CharacterCard } from './ui/CharacterCard';
import { calloutFor, formatChips, ordinal } from './ui/format';
import { LogPanel } from './ui/LogPanel';
import { SettingsPanel } from './ui/SettingsPanel';
import { SetupScreen } from './ui/SetupScreen';
import { Table } from './ui/Table';
import { useSettings } from './ui/useSettings';
import type { Action } from './engine/types';
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

const KEYS: [string, string][] = [
  ['F', 'Fold'],
  ['C', 'Check / call'],
  ['R', 'Focus the raise slider'],
  ['← →', 'Raise amount ± 1 big blind'],
  ['A', 'Select all-in'],
  ['Enter', 'Confirm bet / raise · start'],
  ['P Esc', 'Pause / resume'],
];

const newSeed = () => (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;

export function HoldemGame(props: ArcadeGameProps = {}) {
  const { embedded = false } = props;
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
  const [callouts, setCallouts] = useState<Record<string, string | null>>({});
  const [showResult, setShowResult] = useState(false);
  const settings = useSettings();
  const factor = SPEED_FACTOR[settings.speed];
  const bar = useRef<ActionBarHandle>(null);

  const finished = game.phase === 'finished';
  const status: ArcadeStatus = ui === 'idle' ? 'idle' : finished ? 'gameOver' : ui === 'paused' ? 'paused' : 'running';
  const running = status === 'running';
  const dialogOpen = confirmNew || openChar !== null;
  const place = game.playerPlace;
  const score = finished && place !== null ? tournamentScore({ difficulty: game.setup.difficulty, format: game.setup.format, place }) : 0;

  const seconds = useRunTimer(running, runKey, runKey === 0 && resumable ? (restored?.seconds ?? 0) : 0);

  const stats = useArcadeRun({
    gameId: 'holdem',
    status,
    score,
    seconds,
    runKey,
    outcome: () => (place === 1 ? 'win' : 'loss'),
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
    const id = window.setTimeout(() => setShowResult(true), RESULT_DELAY_MS * Math.max(0.5, factor));
    return () => window.clearTimeout(id);
  }, [finished, factor]);

  const onCue = useCallback((id: string, cue: TellCue | null) => setCues((c) => ({ ...c, [id]: cue })), []);
  useBotTurns({ state: game, dispatch, paused, speed: settings.speed, onCue, onTurn: setTurn });

  // Call-outs: each new action shows as a bubble at its seat for a moment.
  const seen = useRef<{ hand: number; count: number }>({ hand: game.table.handNo, count: game.table.events.length });
  const bubbleTimers = useRef(new Map<string, number>());
  useEffect(() => {
    const t = game.table;
    const from = seen.current.hand === t.handNo ? seen.current.count : 0;
    seen.current = { hand: t.handNo, count: t.events.length };
    const fresh = t.events.slice(from).map(calloutFor).filter((c): c is { id: string; text: string } => c !== null);
    if (fresh.length === 0) return;
    const latest: Record<string, string> = {};
    for (const c of fresh) latest[c.id] = c.text;
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

  const requestNew = useCallback(() => {
    if (finished || ui === 'idle') toSetup();
    else setConfirmNew(true);
  }, [finished, ui, toSetup]);

  const legal = running && !dialogOpen ? playerLegal(game) : null;
  const onAction = useCallback((a: Action) => dispatch({ type: 'player', action: a }), []);

  useHoldemKeys({
    dialog: dialogOpen,
    onDialogConfirm: () => (confirmNew ? toSetup() : setOpenChar(null)),
    onDialogCancel: () => {
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
  const name = useCallback((id: string) => (id === PLAYER_ID ? 'You' : (game.bots.find((b) => b.id === id)?.name ?? id)), [game.bots]);
  const openProfile = openChar ? (game.bots.find((b) => b.id === openChar) ?? null) : null;
  const best = Math.max(stats.best, score);
  const newBest = score > 0 && score > stats.bestBeforeRun;

  let statusLabel: string | undefined;
  if (status === 'running') {
    if (isPlayerTurn(game)) statusLabel = 'Your turn';
    else if (game.phase === 'handOver') statusLabel = 'Next hand…';
    else statusLabel = `${name(t.players[t.toAct ?? 0]?.id ?? '')} is thinking…`;
  }

  let overlay: { title: string; message?: string; actions: OverlayAction[] } | null = null;
  if (confirmNew) {
    overlay = {
      title: 'Abandon this tournament?',
      message: 'It will not be recorded. Your stats and Best stay as they are.',
      actions: [
        { label: 'Abandon', onClick: toSetup, primary: true, kbd: 'Enter' },
        { label: 'Keep playing', onClick: () => setConfirmNew(false), kbd: 'Esc' },
      ],
    };
  } else if (status === 'paused') {
    overlay = welcomeBack
      ? {
          title: 'Welcome back',
          message: `Your tournament was restored — hand #${t.handNo}, ${formatChips(me?.stack ?? 0)} chips, ${alive} players left.`,
          actions: [
            { label: 'Continue', onClick: togglePause, primary: true, kbd: 'P' },
            { label: 'New tournament', onClick: requestNew },
          ],
        }
      : {
          title: 'Paused',
          message: 'The bots wait for you. The tournament is autosaved — close the tab and continue later.',
          actions: [
            { label: 'Resume', onClick: togglePause, primary: true, kbd: 'P' },
            { label: 'New tournament', onClick: requestNew },
          ],
        };
  } else if (status === 'gameOver' && showResult && place !== null) {
    const won = place === 1;
    overlay = {
      title: won ? 'You won the tournament!' : `You finished ${ordinal(place)}`,
      message: `${score > 0 ? `+${formatChips(score)} points` : 'No points this time'} · ${t.handNo} hands · ${formatClock(seconds)} · Best ${formatChips(best)}${newBest ? ' — new best!' : ''}`,
      actions: [{ label: 'New tournament', onClick: toSetup, primary: true, kbd: 'Enter' }],
    };
  }

  const pot = potSize(t);
  const style = { '--game-color': 'var(--game-holdem)' } as CSSProperties;

  return (
    <div className={`arc-game ${styles.game}`} style={style}>
      {!embedded && (
        <header className="arc-game__head">
          <div>
            <h1 className="arc-game__title">Texas Hold&apos;em</h1>
            <p className="arc-game__sub">No-limit sit &amp; go against bots with their own faces, styles and tells.</p>
          </div>
        </header>
      )}

      <StatPanel
        status={status}
        statusLabel={statusLabel}
        items={
          inTournament || finished
            ? [
                { label: 'Blinds', value: `${formatChips(sb)}/${formatChips(bb)}` },
                { label: `Next ${formatChips(next.sb)}/${formatChips(next.bb)}`, value: handsLeft > 0 ? `in ${handsLeft}` : 'next hand' },
                { label: 'Your stack', value: formatChips(me?.stack ?? 0) },
                { label: 'Players', value: `${alive} / ${t.players.length}` },
                { label: 'Time', value: formatClock(seconds) },
              ]
            : [
                { label: 'Best', value: formatChips(stats.best) },
                { label: 'Played', value: stats.plays },
                { label: 'Time', value: formatClock(seconds) },
              ]
        }
      />

      <div className={styles.layout}>
        <div className={styles.main}>
          <div className={`arc-game__board ${styles.tableWrap}`}>
            <Table
              state={game}
              theme={settings.table}
              deck={settings.deck}
              speed={settings.speed}
              cues={cues}
              callouts={callouts}
              turn={turn}
              onOpenCharacter={(id) => {
                if (id !== PLAYER_ID) setOpenChar(id);
              }}
            />
            {status === 'idle' && (
              <div className="arc-overlay" role="dialog" aria-label="New tournament">
                <div className={`arc-overlay__card ${styles.setupCard}`}>
                  <h2 className="arc-overlay__title">Texas Hold&apos;em</h2>
                  <p className="arc-overlay__msg">A sit &amp; go: the last player with chips wins. Pick your table.</p>
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
            <h2 className="arc-panel__title">Tournament</h2>
            <div className={styles.buttons}>
              <button type="button" className="arc-btn arc-btn--primary" onClick={status === 'idle' ? () => start(setup) : togglePause} disabled={finished}>
                {status === 'running' ? 'Pause' : status === 'paused' ? 'Resume' : 'Start'}
              </button>
              <button type="button" className="arc-btn" onClick={requestNew} disabled={status === 'idle'}>
                New tournament
              </button>
            </div>
            {inTournament && (
              <p className={styles.note}>
                {game.setup.format === 'headsUp' ? 'Heads-up' : '6-max'} · {game.setup.difficulty} · {game.setup.length} min · hand #{t.handNo}
              </p>
            )}
            <div className={styles.save}>
              <SaveBadge savedAt={inTournament && ui !== 'idle' ? savedAt : null} />
            </div>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">Settings</h2>
            <div className={styles.settings}>
              <SettingsPanel table={settings.table} deck={settings.deck} speed={settings.speed} set={settings.set} />
            </div>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">Keys</h2>
            <KeyHelp rows={KEYS} />
          </section>
        </aside>
      </div>
    </div>
  );
}

export default HoldemGame;
