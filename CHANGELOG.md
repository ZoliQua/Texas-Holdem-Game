# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] — 2026-12-05

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
