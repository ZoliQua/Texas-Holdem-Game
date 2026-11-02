# Texas Hold'em Game — CLAUDE.md

## Project Facts

* **Repository**: https://github.com/ZoliQua/Texas-Holdem-Game (package `texas-holdem-game`)
* **Portal**: https://github.com/ZoliQua/Arcade-Game-Center — arcade id **`holdem`**, colour token `--game-holdem`,
  play URL https://drdul.hu/arcade/#/play/holdem. Once integrated, the same `src/` is mirrored into `Arcade-Game-Center/apps/holdem/`.
* **Sister games**: Tetris, Snake (the reference implementation), 2048, Pac-Man, Gomoku, Tic-Tac-Toe, Breakout, Space Invaders,
  Connect Four, Nut Sort. The closest template is Connect Four (same shell wiring, persist guard and overlays).
* **Stack**: React 18.3, Vite 5.4, TypeScript 5.6, CSS Modules on the shared arcade tokens, `vite-node` for the simulation
  scripts. No other runtime dependencies.
* **Package manager**: npm. **Node**: >=20.
* **Scripts**:
  * `npm run dev` — local dev server
  * `npm run build` — `tsc -b && vite build`
  * `npm run typecheck` — `tsc -b`
  * `npm run lint` — ESLint (flat config, typescript-eslint)
  * `npm test` — Vitest (engine, bots, controller and component tests, jsdom)
  * `npm run check` — lint → typecheck → test → build (same as CI)
  * `npm run sim:strength` — bot-only heads-up matches per pool pair (strength acceptance)
  * `npm run sim:calibrate` — bot-only tournaments that write `src/engine/schedule.json`
* **Communication**: respond to the user in **Hungarian** in chat, even though this file and the codebase are in English.

If any fact above disagrees with the real repository, verify first and flag the divergence to the user before editing code.

---

## Kit patch (temporary)

`src/arcade/` is the vendored kit from `Arcade-Game-Center/packages/kit/src`. Until Hold'em is integrated into the portal it
carries one **repo-local patch** that registers the game, and nothing else:

* `types.ts` — `'holdem'` in `ArcadeGameId`;
* `registry.ts` — the `holdem` entry (name, repo, tag "Cards", tagline, `--game-holdem`);
* `arcade.css` — `--game-holdem: #38bdf8` (dark) and `#0284c7` (light).

The portal integration lands this exact patch in the kit and re-syncs; after that the folder is a byte-identical copy again.
Never make any other change in `src/arcade/`.

---

## Primary Goal

A correct, fair (non-cheating) and good-looking no-limit hold'em tournament that runs standalone and embeds unchanged in the
Arcade-Game-Center portal, and that is easy to follow over a 20–60 minute session.

**Priority order**: correctness → truthfulness → verification → small diffs → maintainability → polish.

---

## Architecture rules

* `src/engine/` is pure TypeScript (cards, evaluator, betting, pots, tournament, blinds, schedule). No React, no DOM.
* `src/bots/` never imports `TableState` for decisions: `decide`, `estimateEquity`, `tellFor` and `thinkingMs` take a
  `BotView` only. `toBotView` is the single place that turns the table into what a bot may see. The permutation test in
  `src/bots/decide.test.ts` must stay.
* `src/game/` holds the reducer (`advance`), scoring, the session guard and the bot scheduler.
* `src/ui/` renders; nothing there mutates game state.
* Randomness is always injected (seeded mulberry32). The deck order is part of the saved table state.
* No information by colour alone: suits have distinct shapes, the active seat has a dashed outline plus a label, folded /
  all-in / out seats carry text tags, winning cards are raised and outlined.

---

## Working Rules

**Verify before and after every non-trivial change.** Read the target file and its neighbours; afterwards re-check imports, call sites and state transitions.

**No hallucination.** Never claim a build, lint or test passed without running it.

**Small, local, reversible changes.** One fix or one feature at a time.

**No new dependencies** without justification. No Zustand, game engines, lodash, immer, animation libraries.

**CSS**: CSS Modules + kit tokens only. No `:root`, `html`, `body`, `*` or bare element selectors in game styles. Must look right in both `[data-theme='dark']` and `[data-theme='light']`.

---

## Git & Commit Rules

- Commit **only** as `Zoltán Dul <zoltan.dul@gmail.com>` (the global git identity).
- **Never** add `Co-Authored-By: Claude …`, "Generated with Claude Code" or any AI attribution
  to commit messages or pull-request descriptions.
- Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
