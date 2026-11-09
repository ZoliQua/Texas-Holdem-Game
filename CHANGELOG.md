# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.1.0] — 2026-11-09

### Added

- Three languages: English, Hungarian and German, switchable in the top bar / settings and by `?lang=en|hu|de`; the choice is shared across the arcade (`arcade.lang`).
- Dental mode (off by default, shared `arcade.dental`, `?dental=1`): a mint-and-white clinic table style replaces the chosen table theme while it is on, the characters are re-skinned as dental figures that keep their tells, and the card backs carry a tooth logo. Presentation only: rules, scores, stats and saves are unchanged.

### Changed

- Numbers use the locale's digit grouping.
- Links now point to https://dulzoltan.hu/arcade/ (the arcade moved to its new domain).

### Added

- Hungarian and German: the setup screen, action bar, table, seats, character cards, settings, results and the hand log follow the shared arcade language (`src/i18n.ts`). Showdown hands use the standard poker terms of each language.
- Dental mode (shared `arcade.dental`, off by default; toggle in the arcade top bar and in Settings): a mint and white clinic table replaces the chosen table theme while it is on (the stored theme is kept and returns when it is off); the fifteen characters wear dental outfits — dentist, tooth fairy, hygienist, patient with braces, orthodontist, assistant, oral surgeon, technician, professor, radiographer, nurse, curing-light robot and patients — with their species, poses and tells unchanged; card backs carry a tooth logo.

### Changed

- Next-blinds tile: the label is just “Next blinds” („Következő vak”, „Nächste Blinds”) and the value carries the level and when it starts (“15/30 · in 52 hands”); the value wraps instead of being cut off (the Hungarian one was truncated).
- The hand log is worded at render time from the stored events (hand values are re-worded from the evaluator's English text), so tournaments saved before this change render in every language; the save format is unchanged.
- Chip amounts and points use the language's digit grouping (1,240 · 1240 · 1.240) instead of a space.

## [1.0.0] — 2026-11-03

### Added

- No-limit Texas Hold'em sit & go: heads-up or 6-max, Easy / Medium / Hard tables, 20 / 30 / 45 / 60 minute structures with blind
  levels advancing by hands played (calibrated by simulation, `src/engine/schedule.json`). Starting stack 1 500, blinds from 10/20.
- Pure engine: seeded mulberry32 deck, allocation-free 7-card evaluator (checked against all 2 598 960 five-card hands), heads-up blind
  rule, minimum raises, short all-ins that do not reopen the betting, uncalled bets returned, side pots, odd chips left of the button,
  last aggressor shows first, same-hand eliminations ranked by starting stack.
- 15 original characters in three strength pools (rock, calling station, TAG, LAG, maniac in each) with an SVG character rig, poses
  and one or two personal tells each. Bots decide from a `BotView` only; an anti-cheat permutation test guards it.
- Animated SVG table in three themes (Arcade neon, Classic casino, Elegant dark), four-colour or grey deck with drawn suit shapes,
  Slow / Normal / Fast speed; dealing, flips, chip slides, side pots to their winners, a moving dealer button and a bot thinking ring.
- Call-outs for every action, a hand log grouped by street (drawer with an unread badge on phones), character cards with session
  stats (VPIP, PFR, aggression, showdowns).
- Action bar with slider and Min / ½ pot / ¾ pot / Pot / All-in presets; keys F, C, R, ← →, A, Enter, P / Esc.
- Arcade integration: tournament scoring (base 1 000 / 2 500 / 5 000 × place share, heads-up win 40 %), stats, autosave & resume with
  a strict guard (chip conservation, unique cards), pause on hidden tab, `HoldemDemo` attract mode.
- `npm run sim:strength` and `npm run sim:calibrate` simulation scripts.
