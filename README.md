# 🃏 Texas Hold'em

No-limit Texas Hold'em tournaments built with **React 18**, **Vite** and **TypeScript** — a heads-up or 6-max sit & go against
**15 original cartoon bots**, each with a face, a playing style, a strength and a couple of visible tells. An animated SVG table in
three themes, a colour-blind-friendly deck, call-outs for every action and a full hand log keep a 20–60 minute session easy to follow.
Runs on its own **and** as one of the fourteen games of **[Zoltan's Arcade](https://github.com/ZoliQua/Arcade-Game-Center)** —
play it at [dulzoltan.hu/arcade/#/play/holdem](https://dulzoltan.hu/arcade/#/play/holdem).

[![CI](https://github.com/ZoliQua/Texas-Holdem-Game/actions/workflows/ci.yml/badge.svg)](https://github.com/ZoliQua/Texas-Holdem-Game/actions/workflows/ci.yml)
![license](https://img.shields.io/badge/license-MIT-green)
![node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![react](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![typescript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)

---

## 📑 Table of contents

- [The Zoltan's Arcade family](#-the-zoltans-arcade-family)
- [Features](#-features)
- [Quick start](#-quick-start)
- [The tournament](#-the-tournament)
- [Controls](#%EF%B8%8F-controls)
- [Scoring & stats](#-scoring--stats)
- [The characters](#-the-characters)
- [Colour-blind design](#-colour-blind-design)
- [Autosave & resume](#-autosave--resume)
- [Embedding in Arcade-Game-Center](#-embedding-in-arcade-game-center)
- [How it works](#-how-it-works)
- [Simulation scripts](#-simulation-scripts)
- [Scripts](#-scripts)
- [Architecture](#%EF%B8%8F-architecture)
- [Contributing](#-contributing)
- [License](#%EF%B8%8F-license)

## 🕹️ The Zoltan's Arcade family

Every game is a standalone repo that also plugs into the portal. They share one design system, one scoring model and one save format through the vendored [`src/arcade/`](./src/arcade) kit.

| Game | Repo | Genre |
| --- | --- | --- |
| 🏠 **Arcade portal** | [Arcade-Game-Center](https://github.com/ZoliQua/Arcade-Game-Center) | All games in one place, live demos, stats, leaderboard |
| 🧱 Tetris | [Tetris-Game](https://github.com/ZoliQua/Tetris-Game) | Arcade |
| 🐍 Snake | [Snake-Game](https://github.com/ZoliQua/Snake-Game) | Reflex |
| 🔢 2048 | [2048-Game](https://github.com/ZoliQua/2048-Game) | Puzzle |
| 🟡 Pac-Man | [Pac-Man-Game](https://github.com/ZoliQua/Pac-Man-Game) | Maze |
| ⚫ Gomoku | [Gomoku-Game](https://github.com/ZoliQua/Gomoku-Game) | Strategy |
| 🦷 Tic-Tac-Toe | [Tic-Tac-Toe-Game](https://github.com/ZoliQua/Tic-Tac-Toe-Game) | Duel |
| 🏓 Breakout | [Breakout-Game](https://github.com/ZoliQua/Breakout-Game) | Paddle |
| 👾 Space Invaders | [Space-Invaders-Game](https://github.com/ZoliQua/Space-Invaders-Game) | Shooter |
| 🔴 Connect Four | [Connect-Four-Game](https://github.com/ZoliQua/Connect-Four-Game) | Duel |
| 🔩 Nut Sort | [Nut-Sort-Game](https://github.com/ZoliQua/Nut-Sort-Game) | Sorting |
| 🃏 **Texas Hold'em** (this repo) | [Texas-Holdem-Game](https://github.com/ZoliQua/Texas-Holdem-Game) | Cards |
| 💣 Minesweeper | [Minesweeper-Game](https://github.com/ZoliQua/Minesweeper-Game) | Logic |
| ♠️ Solitaire | [Solitaire-Game](https://github.com/ZoliQua/Solitaire-Game) | Cards |
| 🎴 Ulti | [Ulti-Game](https://github.com/ZoliQua/Ulti-Game) | Cards |

## ✨ Features

- 🏆 **Sit & go tournaments** — heads-up (you + 1 bot) or 6-max (you + 5 bots); the last player with chips wins
- 🎚️ **Easy, Medium or Hard** — the game seats bots from the matching pool of characters
- ⏱️ **20, 30, 45 or 60 minutes** — blind levels advance by *hands played*, calibrated by simulation, so pausing never speeds them up
- 🦊 **15 original characters** — tortoise, mouse, bear, fox, robot… each with a name, a style (rock, calling station, TAG, LAG, maniac),
  a strength and one or two personal tells; open a character card from the seat
- 🎬 **Animated table** — dealing, flipping the flop/turn/river, chips sliding to the bet line and into the pot, side pots sliding
  to their winners, a moving dealer button, a thinking ring for bots and character poses
- 💬 **Call-outs and a hand log** — every action appears as a bubble at the seat ("Raises to 120") and in a log grouped by hand and
  street, with showdowns ("Bruno wins 1 240 with a flush, K-high") and eliminations ("Pixel is out in 4th")
- 🎨 **Three tables** — Arcade neon (default), Classic casino, Elegant dark; **four-colour or grey deck**; Slow / Normal / Fast speed
- 🧠 **Fair bots** — they only ever see a `BotView` (public information plus their own two cards); a test permutes everybody else's
  cards and the deck and checks that no decision changes
- 📱 **Phone-ready** — an upright table on portrait screens, the log as a drawer with a badge, the action bar pinned to the bottom
- 💾 **Autosave & resume** — the whole tournament, mid-hand, survives reloads and tab closes
- 🌗 **Dark / light theme** shared with every arcade game (press **T**)
- 🌍 **Three languages** — English, Hungarian and German; switch in the top bar or in the settings (also `?lang=en|hu|de` for link hand-off); numbers follow the locale's grouping
- 🦷 **Dental mode** — a „Fogas mód” / "Dental mode" / „Zahnmodus” toggle in the settings, off by default (or `?dental=1`), shared across the whole arcade: a mint-and-white clinic table style replaces the chosen table theme while it is on, the characters are re-skinned as dental figures that keep their tells, and the card backs carry a tooth logo; presentation only
- 🤖 **Attract-mode demo** (`<HoldemDemo />`) — six bots play fast hands on the portal's landing page
- 🧪 **Tested** — the evaluator against all 2 598 960 five-card hands, betting and side-pot rules, 1 000+ random hands for chip
  conservation, anti-cheat, tells, the session guard and the UI

## 🚀 Quick start

Requires **Node ≥ 20** and npm.

```bash
git clone https://github.com/ZoliQua/Texas-Holdem-Game.git
cd Texas-Holdem-Game
npm install
npm run dev          # http://localhost:5173
```

Production build: `npm run build && npm run preview`. The build uses relative asset paths, so `dist/` can be served from any sub-folder.

## 🎲 The tournament

Standard no-limit hold'em tournament rules:

- Everybody starts with **1 500 chips**; blinds start at **10/20** and climb the ladder 10/20, 15/30, 25/50, 50/100, 75/150, 100/200,
  150/300, 200/400, 300/600, 400/800, 600/1 200, 800/1 600, 1 000/2 000, then ×1.5 to a tidy value. No antes.
- The button moves clockwise. Heads-up, the button posts the small blind, acts first preflop and last after the flop.
- The minimum raise is the size of the previous bet or raise; an all-in for less than a full raise does not reopen the betting
  for players who have already acted. Uncalled chips go back to their owner.
- Side pots are built for every all-in level; an odd chip in a split pot goes to the first winner left of the button.
- At showdown the last aggressor shows first. Bots always show, so the log stays informative.
- Players busted in the same hand are ranked by their stack at the start of that hand (equal stacks share the place).
- Your run ends when you bust or win — the bots do not have to play it out.

**Hands per level** come from `src/engine/schedule.json` (see [Simulation scripts](#-simulation-scripts)). The stat strip always shows
the blinds, the next level and how many hands remain until it.

## ⌨️ Controls

| Key | Action |
| --- | --- |
| **F** | Fold |
| **C** | Check, or call the amount shown |
| **R** | Focus the bet / raise slider |
| ⬅️ ➡️ | Change the amount by one big blind (also while the slider has focus) |
| **A** | Select all-in (confirm with **Enter**) |
| **Enter** | Confirm the bet / raise · start · continue |
| **P** / **Esc** | Pause / resume (also when the tab is hidden) |
| **T** | Toggle dark / light theme (standalone page) |

The action bar has **Fold**, **Check / Call n**, a **slider** from the minimum raise to all-in, presets **Min · ½ pot · ¾ pot · Pot ·
All-in**, and a confirm button that always shows the amount. It is locked while an action animates, so a double click or a double
Enter can never act twice. Hotkeys are ignored while you type in a field or hold Cmd/Ctrl/Alt.

## 🎯 Scoring & stats

Difficulty and placement count; speed and length do not.

```
base       = { easy: 1000, medium: 2500, hard: 5000 }[difficulty]
placeShare = 6-max:    [1.00, 0.60, 0.40, 0.25, 0.10, 0.00][place − 1]
             heads-up: win 0.40, loss 0.00
score      = round(base × placeShare)          // max 5 000
```

| Place | Easy 6-max | Medium 6-max | Hard 6-max | Heads-up win (E / M / H) |
| --- | --- | --- | --- | --- |
| 1st | 1 000 | 2 500 | **5 000** | 400 / 1 000 / 2 000 |
| 2nd | 600 | 1 500 | 3 000 | — |
| 3rd | 400 | 1 000 | 2 000 | — |
| 4th | 250 | 625 | 1 250 | — |
| 5th | 100 | 250 | 500 | — |
| 6th | 0 | 0 | 0 | — |

Every finished tournament is recorded once by the kit under `arcade.stats.holdem` (Best, plays, wins, time); the outcome is `win`
for first place and `loss` otherwise. A tournament abandoned through **New tournament** is not recorded.

## 🦊 The characters

Fifteen original characters — five per difficulty pool. Every pool has the same five styles, played better the harder the pool:

| Style | Plays… |
| --- | --- |
| **Rock** | very few hands, and seldom puts chips in without a real holding |
| **Calling station** | lots of flops; calls a lot, rarely raises, hard to bluff |
| **Tight-aggressive** | good starting hands, played hard |
| **Loose-aggressive** | many hands, constant pressure |
| **Maniac** | anything, anytime — and bluffs a lot |

A **Medium** 6-max table seats four Medium characters plus one surprise guest from the Easy or Hard pool. Strength changes how many
equity samples a bot takes, how well it reads ranges and tendencies, how much it exaggerates its style and how often it makes a
mistake (calling too wide, missing a value bet, splashing chips).

**Tells.** Every character has one or two personal habits driven by *its own* hand — an animation of the character or a change in
its thinking time. Easy characters are honest about 80 % of the time, Medium about 60 %; Hard characters show them rarely and
sometimes reverse them on purpose. The game never tells you what they mean: watching for them is part of the fun. The character card
(click a seat) shows the style and live session stats: VPIP, PFR, aggression and showdowns.

## 🎨 Colour-blind design

No information is carried by colour alone:

- **Suits are shapes** — large, drawn spade / heart / diamond / club shapes in the corner index and a big centre pip, visible even
  when cards overlap. The default **four-colour** deck (♠ black, ♥ red, ♦ blue, ♣ green) adds colour; the **grey** deck removes it.
- The **active seat** has a marching dashed outline and a "Thinking…" / "Your turn" label; bots also get a countdown ring.
- **FOLD**, **ALL-IN** and **OUT** tags; folded seats dim, busted characters turn grey.
- The **winning five cards** are raised and outlined; results in the log carry a ★ and eliminations a ✕.
- Chips always show their amount in text.
- `prefers-reduced-motion` shortens the animations but never skips call-outs or the log.

## 💾 Autosave & resume

The whole tournament — setup, seats, the seeded deck and its position, the full table state, the log (last 200 hands) and the
session stats — is saved after every action (key `arcade.session.holdem`, schema-versioned). A strict guard checks the structure,
**chip conservation** (stacks + pots = players × 1 500), card uniqueness, the player to act and that every bot is exactly a roster
character; anything else is discarded. Reloading shows **Welcome back** with the game paused at the exact decision point — same
cards, same pot, same log, no new deal.

## 🧩 Embedding in Arcade-Game-Center

```tsx
import { HoldemGame, HoldemDemo } from '@arcade/holdem';

<HoldemGame
  embedded                                       // hide the page title; the portal shows it
  onGameOver={(score) => submitScore('holdem', score)}  // finished runs with points > 0
  onRunEnd={(run) => console.log(run.outcome, run.score)}
  onStatusChange={({ status, seconds }) => updateHeader(status, seconds)}
/>
<HoldemDemo active={cardIsVisible} />            // landing-page attract mode
```

Status mapping: `idle` on the setup screen, `running` while a tournament is played, `paused` while suspended or restored,
`gameOver` from the moment your run ends until a new tournament.

## 🧠 How it works

- **Engine** (`src/engine/`) — pure and immutable. Cards are numbers 0–51; a rank-count / bit-mask **7-card evaluator** scores hands
  without allocating. `startHand` and `applyAction` run a hand from blinds to showdown, building side pots and recording every event.
  The deck is shuffled by a seeded mulberry32 generator whose state is saved with the table.
- **Bots** (`src/bots/`) — `toBotView` is the only bridge from the table to bot code. Preflop decisions use a 169-hand table (all-in
  equity against a random hand, computed with this evaluator), position and stack depth, with push/fold charts for short stacks.
  After the flop a bot runs a **Monte Carlo equity** estimate against ranges read from the opponents' actions (and, for skilled bots,
  their observed tendencies) and weighs it against pot odds, its style and a rule of thumb for committing its stack.
- **Controller** (`src/game/`) — a reducer (`advance`) with a pending-animation nonce, the scoring formula, the session guard and
  `useBotTurns`, which schedules exactly one bot action per turn with a visible thinking delay (0.6–2 s at Normal speed).
- **UI** (`src/ui/`) — an SVG felt with HTML seats on top, sized in table units so it scales from a phone to a desktop; a
  parametric SVG character rig with poses and tell animations.

## 📈 Simulation scripts

| Script | What it does |
| --- | --- |
| `npm run sim:strength` | Duplicate heads-up matches (500 per pool pair, seats swapped on the same deals) on the default 45-minute structure. Acceptance: Hard beats Medium and Medium beats Easy in ≥ 60 % of matches. `HPL=…` tries other level lengths, `PAIR=hard,medium` one pair, `SIM_VERBOSE=1` per style. |
| `npm run sim:calibrate` | 300 medium-pool tournaments per format and evaluation, with your seat played by the medium tight-aggressive bot, priced with a per-hand time model (deal 2.5 s, 1.3 s per bot action, 4 s per human action, 1.5 s per street, 3 s per award); binary-searches hands per level for each target length and writes `src/engine/schedule.json`. |

Heads-up play between bots busts somebody quickly, so the 60-minute heads-up target is not reachable — even with practically flat
blinds the median heads-up run lasts about 44 minutes. The schedule records this (`reachable: false`) and the setup screen shows the
typical length.

## 🧪 Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and production build |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (engine, bots, controller and component tests) |
| `npm run check` | lint → typecheck → test → build (what CI runs) |
| `npm run sim:strength` / `sim:calibrate` | the simulations above |

## 🏗️ Architecture

```
src/
  arcade/                 vendored Zoltan's Arcade kit — do not edit here (see its README)
  engine/                 pure rules, no React
    cards.ts rng.ts       cards 0..51, seeded mulberry32, shuffles
    evaluate.ts           7-card evaluator, describe()
    hand.ts pots.ts       betting, side pots, showdown, awards
    tournament.ts blinds.ts schedule.ts(+json) stats.ts
  bots/                   view.ts (BotView), profiles.ts (roster), preflop.ts, equity.ts, strength.ts,
                          decide.ts, tells.ts, simulate.ts
  game/                   state.ts (advance), scoring.ts, persist.ts (guard), useBotTurns.ts, speed.ts
  ui/                     Table, Seat, CardView, Character, Chips, ActionBar, LogPanel, CharacterCard,
                          SetupScreen, SettingsPanel, themes, layout, useSettings
  hooks/useHoldemKeys.ts
  demo/HoldemDemo.tsx     landing-page attract mode
  HoldemGame.tsx          the embeddable game (ArcadeGameProps)
  App.tsx main.tsx index.ts
scripts/                  sim-strength.ts, calibrate-blinds.ts (vite-node)
```

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md), the [Code of Conduct](./CODE_OF_CONDUCT.md) and [SECURITY.md](./SECURITY.md).
Contributors are listed in [CONTRIBUTORS.md](./CONTRIBUTORS.md); changes in [CHANGELOG.md](./CHANGELOG.md).

## ⚖️ License

[MIT](./LICENSE) © 2026 Zoltán Dul

---

<p align="center">Made with ❤️ by Zoltán Dul · part of <a href="https://github.com/ZoliQua/Arcade-Game-Center">Zoltan's Arcade</a></p>
