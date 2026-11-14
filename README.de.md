# 🃏 Texas Hold'em

[English](README.md) · **Deutsch** · [Magyar](README.hu.md)

No-Limit-Texas-Hold'em-Turniere mit **React 18**, **Vite** und **TypeScript** – ein Heads-up- oder 6-max-Sit-&-Go gegen
**15 eigene Cartoon-Bots**, jeder mit Gesicht, Spielstil, Spielstärke und ein, zwei sichtbaren Tells. Ein animierter SVG-Tisch in
drei Designs, ein farbenblindfreundliches Deck, Sprechblasen für jede Aktion und ein vollständiger Handverlauf machen eine Partie von
20–60 Minuten leicht verfolgbar.
Läuft allein **und** als eines der fünfzehn Spiele von **[Zoltan's Arcade](https://github.com/ZoliQua/Arcade-Game-Center)** –
spiel es auf [dulzoltan.hu/arcade/#/play/holdem](https://dulzoltan.hu/arcade/#/play/holdem).

[![CI](https://github.com/ZoliQua/Texas-Holdem-Game/actions/workflows/ci.yml/badge.svg)](https://github.com/ZoliQua/Texas-Holdem-Game/actions/workflows/ci.yml)
![license](https://img.shields.io/badge/license-MIT-green)
![node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![react](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![typescript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)

---

## 📑 Inhaltsverzeichnis

- [Die Zoltan's-Arcade-Familie](#%EF%B8%8F-die-zoltans-arcade-familie)
- [Funktionen](#-funktionen)
- [Schnellstart](#-schnellstart)
- [Das Turnier](#-das-turnier)
- [Steuerung](#%EF%B8%8F-steuerung)
- [Punkte & Statistik](#-punkte--statistik)
- [Die Figuren](#-die-figuren)
- [Farbenblindes Design](#-farbenblindes-design)
- [Autospeichern & Fortsetzen](#-autospeichern--fortsetzen)
- [Einbindung in Arcade-Game-Center](#-einbindung-in-arcade-game-center)
- [So funktioniert es](#-so-funktioniert-es)
- [Simulationsskripte](#-simulationsskripte)
- [Skripte](#-skripte)
- [Architektur](#%EF%B8%8F-architektur)
- [Mitwirken](#-mitwirken)
- [Lizenz](#%EF%B8%8F-lizenz)

## 🕹️ Die Zoltan's-Arcade-Familie

Jedes Spiel ist ein eigenständiges Repo, das sich auch ins Portal einklinkt. Alle teilen ein Designsystem, ein Punktemodell und ein Speicherformat über das eingebundene Kit [`src/arcade/`](./src/arcade).

| Spiel | Repo | Genre |
| --- | --- | --- |
| 🏠 **Arcade-Portal** | [Arcade-Game-Center](https://github.com/ZoliQua/Arcade-Game-Center) | Alle Spiele an einem Ort, Live-Demos, Statistik, Bestenliste |
| 🧱 Tetris | [Tetris-Game](https://github.com/ZoliQua/Tetris-Game) | Arcade |
| 🐍 Snake | [Snake-Game](https://github.com/ZoliQua/Snake-Game) | Reaktion |
| 🔢 2048 | [2048-Game](https://github.com/ZoliQua/2048-Game) | Knobelei |
| 🟡 Pac-Man | [Pac-Man-Game](https://github.com/ZoliQua/Pac-Man-Game) | Labyrinth |
| ⚫ Gomoku | [Gomoku-Game](https://github.com/ZoliQua/Gomoku-Game) | Strategie |
| 🦷 Tic-Tac-Toe | [Tic-Tac-Toe-Game](https://github.com/ZoliQua/Tic-Tac-Toe-Game) | Duell |
| 🏓 Breakout | [Breakout-Game](https://github.com/ZoliQua/Breakout-Game) | Schläger |
| 👾 Space Invaders | [Space-Invaders-Game](https://github.com/ZoliQua/Space-Invaders-Game) | Shooter |
| 🔴 Vier gewinnt | [Connect-Four-Game](https://github.com/ZoliQua/Connect-Four-Game) | Duell |
| 🔩 Nut Sort | [Nut-Sort-Game](https://github.com/ZoliQua/Nut-Sort-Game) | Sortieren |
| 🃏 **Texas Hold'em** (dieses Repo) | [Texas-Holdem-Game](https://github.com/ZoliQua/Texas-Holdem-Game) | Karten |
| 💣 Minesweeper | [Minesweeper-Game](https://github.com/ZoliQua/Minesweeper-Game) | Logik |
| ♠️ Solitaire | [Solitaire-Game](https://github.com/ZoliQua/Solitaire-Game) | Karten |
| 🎴 Ulti | [Ulti-Game](https://github.com/ZoliQua/Ulti-Game) | Karten |
| 🂡 Snapszer | [Snapszer-Game](https://github.com/ZoliQua/Snapszer-Game) | Karten |

## ✨ Funktionen

- 🏆 **Sit-&-Go-Turniere** – Heads-up (du + 1 Bot) oder 6-max (du + 5 Bots); wer als Letzter noch Chips hat, gewinnt
- 🎚️ **Leicht, Mittel oder Schwer** – das Spiel setzt Bots aus dem passenden Figurenpool an den Tisch
- ⏱️ **20, 30, 45 oder 60 Minuten** – die Blindstufen steigen nach *gespielten Händen*, per Simulation kalibriert, also beschleunigt
  eine Pause sie nie
- 🦊 **15 eigene Figuren** – Schildkröte, Maus, Bär, Fuchs, Roboter … jede mit Namen, Spielstil (Rock, Calling Station, TAG, LAG,
  Maniac), Spielstärke und ein, zwei persönlichen Tells; die Figurenkarte öffnest du am Platz
- 🎬 **Animierter Tisch** – Austeilen, Aufdecken von Flop/Turn/River, Chips, die zur Einsatzlinie und in den Pot gleiten, Side Pots,
  die zu ihren Gewinnern wandern, ein wandernder Dealer-Button, ein Denkring für Bots und Posen der Figuren
- 💬 **Sprechblasen und Handverlauf** – jede Aktion erscheint als Blase am Platz („Erhöht auf 120“) und im Verlauf, gruppiert nach
  Hand und Setzrunde, mit Showdowns („Bruno gewinnt 1 240 mit Flush, K hoch“) und Ausscheiden („Pixel scheidet als 4. aus“)
- 🎨 **Drei Tische** – Arcade-Neon (Standard), klassisches Casino, elegantes Dunkel; **Vierfarben- oder graues Deck**; Tempo
  Langsam / Normal / Schnell
- 🧠 **Faire Bots** – sie sehen immer nur eine `BotView` (öffentliche Informationen plus ihre eigenen zwei Karten); ein Test vertauscht
  die Karten aller anderen und das Deck und prüft, dass sich keine Entscheidung ändert
- 📱 **Handytauglich** – ein aufrechter Tisch im Hochformat, der Verlauf als Schublade mit Zähler und auf Touchscreens eine kompakte
  Aktionsleiste direkt unter dem Tisch (bei quer gehaltenem Handy daneben) mit fingergroßen Knöpfen, einem 44 px hohen
  Erhöhen-Regler und Vorgaben; der Tisch passt sich der Bildschirmhöhe an, sodass deine Karten, das Board und die Leiste auf einen
  Bildschirm passen
- 📖 **Regeln-Dialog** – Ziel, Steuerung, Regeln, Punkte und eine Rangliste der Hände mit Beispielkarten; beim Öffnen pausiert das Spiel
- 🏁 **Vorzeitig beenden** – beende das Turnier bewusst; nach 10 gespielten Händen zählen die Punkte deines aktuellen Platzes nach Chips
- ⛶ **Vollbild** – der Tisch ohne die Seite drumherum (auf dem iPhone ein CSS-Vollbildmodus)
- 💾 **Autospeichern & Fortsetzen** – das ganze Turnier übersteht, auch mitten in der Hand, Neuladen und geschlossene Tabs
- 🌗 **Dunkles / helles Design**, geteilt mit allen Arcade-Spielen (Taste **T**)
- 🌍 **Drei Sprachen** – Englisch, Ungarisch und Deutsch; umschalten in der oberen Leiste oder in den Einstellungen (auch
  `?lang=en|hu|de` für Links); Zahlen folgen der Zifferngruppierung der Sprache
- 🦷 **Zahnmodus** – ein Schalter „Fogas mód“ / "Dental mode" / „Zahnmodus“ in den Einstellungen, standardmäßig aus (oder
  `?dental=1`), in der ganzen Arcade geteilt: Solange er an ist, ersetzt ein mint-weißer Praxistisch das gewählte Tischdesign, die
  Figuren werden zu Zahnarzt-Figuren, die ihre Tells behalten, und die Kartenrücken tragen ein Zahn-Logo; reine Darstellung
- 🤖 **Attract-Mode-Demo** (`<HoldemDemo />`) – sechs Bots spielen schnelle Hände auf der Startseite des Portals
- 🧪 **Getestet** – der Evaluator gegen alle 2 598 960 Fünf-Karten-Hände, Setz- und Side-Pot-Regeln, über 1 000 Zufallshände für
  die Chip-Erhaltung, Anti-Cheat, Tells, der Sitzungswächter und die Oberfläche

## 🚀 Schnellstart

Benötigt **Node ≥ 20** und npm.

```bash
git clone https://github.com/ZoliQua/Texas-Holdem-Game.git
cd Texas-Holdem-Game
npm install
npm run dev          # http://localhost:5173
```

Produktions-Build: `npm run build && npm run preview`. Der Build nutzt relative Asset-Pfade, daher lässt sich `dist/` aus jedem
Unterordner ausliefern.

## 🎲 Das Turnier

Übliche No-Limit-Hold'em-Turnierregeln:

- Alle starten mit **1 500 Chips**; die Blinds beginnen bei **10/20** und steigen über 10/20, 15/30, 25/50, 50/100, 75/150, 100/200,
  150/300, 200/400, 300/600, 400/800, 600/1 200, 800/1 600, 1 000/2 000, danach jeweils ×1,5 auf einen runden Wert. Keine Antes.
- Der Button wandert im Uhrzeigersinn. Heads-up zahlt der Button den Small Blind, handelt vor dem Flop als Erster und danach als
  Letzter.
- Die Mindesterhöhung ist so groß wie der vorige Einsatz bzw. die vorige Erhöhung; ein All-in unter einer vollen Erhöhung öffnet die
  Setzrunde für Spieler, die schon gehandelt haben, nicht wieder. Nicht gecallte Chips gehen an ihren Besitzer zurück.
- Für jede All-in-Stufe entsteht ein Side Pot; ein übriger Chip in einem geteilten Pot geht an den ersten Gewinner links vom Button.
- Im Showdown zeigt der letzte Aggressor zuerst. Bots zeigen immer, damit der Verlauf aussagekräftig bleibt.
- Wer in derselben Hand ausscheidet, wird nach dem Stack zu Beginn dieser Hand gereiht (gleiche Stacks teilen sich den Platz).
- Dein Lauf endet, wenn du ausscheidest oder gewinnst – die Bots müssen nicht zu Ende spielen – oder wenn du **Beenden** drückst.

Die **Hände pro Stufe** stammen aus `src/engine/schedule.json` (siehe [Simulationsskripte](#-simulationsskripte)). Die Statusleiste
zeigt immer die Blinds, die nächste Stufe und wie viele Hände bis dahin fehlen.

## ⌨️ Steuerung

| Taste | Aktion |
| --- | --- |
| **F** | Passen |
| **C** | Checken oder den angezeigten Betrag mitgehen |
| **R** | Fokus auf den Setzen-/Erhöhen-Regler |
| ⬅️ ➡️ | Betrag um einen Big Blind ändern (auch wenn der Regler den Fokus hat) |
| **A** | All-in wählen (mit **Enter** bestätigen) |
| **Enter** | Einsatz / Erhöhung bestätigen · starten · weiter |
| **P** / **Esc** | Pause / weiter (auch wenn der Tab verborgen ist) |
| **T** | Dunkles / helles Design umschalten (eigenständige Seite) |

Die Aktionsleiste hat **Passen**, **Checken / Mitgehen n**, einen **Regler** von der Mindesterhöhung bis All-in, die Vorgaben
**Min · ½ Pot · ¾ Pot · Pot · All-in** und einen Bestätigen-Knopf, der immer den Betrag zeigt. Während eine Aktion animiert wird,
ist sie gesperrt, sodass ein Doppelklick oder doppeltes Enter nie zweimal handelt. Tastenkürzel werden ignoriert, solange du in ein
Feld tippst oder Cmd/Strg/Alt hältst. **R** gehört zum Erhöhen-Regler, deshalb öffnet sich der **Regeln**-Dialog über seinen Knopf im
Turnier-Bereich.

**Auf dem Handy:** Deine Aktionen liegen in der Leiste direkt unter dem Tisch (bei quer gehaltenem Handy daneben), in
Daumenreichweite; der Tisch ist so bemessen, dass deine Karten, das Board und die Leiste auf einen Bildschirm passen, und beim
Austeilen scrollt die Seite sie ins Bild – tippe auf **Passen**, **Checken /
Mitgehen** oder den Erhöhen-Knopf, zieh den Regler (44 px hoch) oder tippe auf eine Vorgabe, um den Einsatz festzulegen; der
Erhöhen-Knopf zeigt den Betrag immer, bevor du bestätigst. Tippe auf eine Figur für ihre Karte. Die Knöpfe **Regeln**, **Beenden**
und **Vollbild** sind im Turnier-Bereich; im Vollbild entfallen Titel und Statuskacheln. Auf dem iPhone füge die Seite zum Home-Bildschirm hinzu, dann gibt es keine Browserleisten.

## 🎯 Punkte & Statistik

Schwierigkeit und Platzierung zählen, Tempo und Länge nicht.

```
base       = { easy: 1000, medium: 2500, hard: 5000 }[difficulty]
placeShare = 6-max:    [1.00, 0.60, 0.40, 0.25, 0.10, 0.00][place − 1]
             heads-up: win 0.40, loss 0.00
score      = round(base × placeShare)          // max 5 000
```

| Platz | Leicht 6-max | Mittel 6-max | Schwer 6-max | Heads-up-Sieg (L / M / S) |
| --- | --- | --- | --- | --- |
| 1. | 1 000 | 2 500 | **5 000** | 400 / 1 000 / 2 000 |
| 2. | 600 | 1 500 | 3 000 | — |
| 3. | 400 | 1 000 | 2 000 | — |
| 4. | 250 | 625 | 1 250 | — |
| 5. | 100 | 250 | 500 | — |
| 6. | 0 | 0 | 0 | — |

**Vorzeitig beenden.** Der Knopf **Beenden** schließt das ganze Turnier sofort ab (nach einer Rückfrage, die die Punkte zeigt).
Sobald mindestens **10 Hände** gespielt sind (`MIN_FINISH_HANDS`), wirst du unter den verbliebenen Spielern nach Chips platziert –
beendest du mitten in einer Hand, sind deine schon gesetzten Chips verloren, bei den anderen zählen ihre Einsätze weiter mit –,
bei gleich vielen Chips gilt der **schlechtere**
Platz, und du bekommst genau die Punkte, die dieser Platz oben bringt. Vor 10 gespielten Händen bringt Beenden **0** Punkte, also
gibt es mit Austeilen → Beenden nie einen geschenkten ersten Platz. Die Ergebniskarte zeigt „Vorzeitig beendet“.

Jedes beendete Turnier wird vom Kit einmal unter `arcade.stats.holdem` erfasst (Bestwert, Spiele, Siege, Zeit); das Ergebnis ist
`win` für den ersten Platz, `finished` für ein mit **Beenden** abgeschlossenes Turnier und sonst `loss`. Ein über **Neues Turnier**
abgebrochenes Turnier wird nicht erfasst.

## 🦊 Die Figuren

Fünfzehn eigene Figuren – fünf pro Schwierigkeitspool. Jeder Pool hat dieselben fünf Spielstile, umso besser gespielt, je schwerer
der Pool:

| Stil | Spielt … |
| --- | --- |
| **Rock** | sehr wenige Hände und bringt selten Chips ohne echte Hand ein |
| **Calling Station** | viele Flops; geht oft mit, erhöht selten, schwer zu bluffen |
| **Tight-aggressiv** | gute Starthände, hart gespielt |
| **Loose-aggressiv** | viele Hände, ständiger Druck |
| **Maniac** | alles, jederzeit – und blufft viel |

Ein **mittlerer** 6-max-Tisch setzt vier mittlere Figuren plus einen Überraschungsgast aus dem leichten oder schweren Pool. Die
Spielstärke bestimmt, wie viele Equity-Stichproben ein Bot zieht, wie gut er Ranges und Neigungen liest, wie stark er seinen Stil
übertreibt und wie oft er Fehler macht (zu weit mitgehen, eine Value-Bet verpassen, Chips verschleudern).

**Tells.** Jede Figur hat ein, zwei persönliche Gewohnheiten, die von *ihrer eigenen* Hand ausgelöst werden – eine Animation der Figur
oder eine veränderte Bedenkzeit. Leichte Figuren sind in etwa 80 % der Fälle ehrlich, mittlere in etwa 60 %; schwere zeigen sie selten
und drehen sie manchmal absichtlich um. Das Spiel verrät nie, was sie bedeuten: Auf sie zu achten gehört zum Spaß. Die Figurenkarte
(Klick auf einen Platz) zeigt den Stil und Live-Statistiken der Sitzung: VPIP, PFR, Aggression und Showdowns.

## 🎨 Farbenblindes Design

Keine Information hängt allein an der Farbe:

- **Farben sind Formen** – große, gezeichnete Pik-/Herz-/Karo-/Kreuz-Formen im Eckindex und ein großes Mittelsymbol, sichtbar auch
  bei überlappenden Karten. Das Standard-**Vierfarben**-Deck (♠ schwarz, ♥ rot, ♦ blau, ♣ grün) ergänzt Farbe; das **graue** Deck
  nimmt sie weg.
- Der **aktive Platz** hat einen laufenden gestrichelten Rahmen und das Etikett „Denkt nach…“ / „Du bist dran“; Bots bekommen
  zusätzlich einen Countdown-Ring.
- Etiketten **GEPASST**, **ALL-IN** und **RAUS**; gepasste Plätze werden gedimmt, ausgeschiedene Figuren grau.
- Die **fünf Gewinnkarten** werden angehoben und umrandet; Ergebnisse im Verlauf tragen ein ★, Ausscheiden ein ✕.
- Chips zeigen ihren Betrag immer als Text.
- `prefers-reduced-motion` verkürzt die Animationen, überspringt aber nie Sprechblasen oder den Verlauf.

## 💾 Autospeichern & Fortsetzen

Das ganze Turnier – Einstellungen, Plätze, das geseedete Deck und seine Position, der vollständige Tischzustand, der Verlauf (die
letzten 200 Hände) und die Sitzungsstatistik – wird nach jeder Aktion gespeichert (Schlüssel `arcade.session.holdem`, mit
Schema-Version). Ein strenger Wächter prüft die Struktur, die **Chip-Erhaltung** (Stacks + Pots = Spieler × 1 500), die Eindeutigkeit
der Karten, den Spieler am Zug und dass jeder Bot genau eine Figur aus dem Kader ist; alles andere wird verworfen. Nach dem Neuladen
erscheint **Willkommen zurück**, das Spiel steht pausiert an genau derselben Entscheidung – gleiche Karten, gleicher Pot, gleicher
Verlauf, kein neues Austeilen.

## 🧩 Einbindung in Arcade-Game-Center

```tsx
import { HoldemGame, HoldemDemo } from '@arcade/holdem';

<HoldemGame
  embedded                                       // Seitentitel ausblenden; das Portal zeigt ihn
  onGameOver={(score) => submitScore('holdem', score)}  // beendete Läufe mit Punkten > 0 und jedes Beenden
  onRunEnd={(run) => console.log(run.outcome, run.score)}
  onStatusChange={({ status, seconds }) => updateHeader(status, seconds)}
/>
<HoldemDemo active={cardIsVisible} />            // Attract-Mode auf der Startseite
```

Status-Zuordnung: `idle` im Einstellungsbildschirm, `running` während eines Turniers, `paused` wenn angehalten oder wiederhergestellt,
`gameOver` vom Ende deines Laufs bis zu einem neuen Turnier.

## 🧠 So funktioniert es

- **Engine** (`src/engine/`) – rein und unveränderlich. Karten sind Zahlen 0–51; ein **7-Karten-Evaluator** mit Rangzählung und
  Bitmasken bewertet Hände ohne Allokation. `startHand` und `applyAction` spielen eine Hand von den Blinds bis zum Showdown, bauen
  Side Pots und zeichnen jedes Ereignis auf. Das Deck wird von einem geseedeten mulberry32-Generator gemischt, dessen Zustand mit dem
  Tisch gespeichert wird.
- **Bots** (`src/bots/`) – `toBotView` ist die einzige Brücke vom Tisch zum Bot-Code. Preflop-Entscheidungen nutzen eine Tabelle mit
  169 Händen (All-in-Equity gegen eine zufällige Hand, mit diesem Evaluator berechnet), Position und Stacktiefe, mit Push/Fold-Charts
  für kurze Stacks. Nach dem Flop schätzt ein Bot seine **Equity per Monte Carlo** gegen Ranges, die er aus den Aktionen der Gegner
  liest (und, bei starken Bots, aus ihren beobachteten Neigungen), und wägt sie gegen Pot Odds, seinen Stil und eine Faustregel ab,
  wann er seinen Stack festlegt.
- **Controller** (`src/game/`) – ein Reducer (`advance`) mit einer Nonce für laufende Animationen, die Punkteformel, der
  Sitzungswächter und `useBotTurns`, das pro Zug genau eine Bot-Aktion mit sichtbarer Bedenkzeit einplant (0,6–2 s bei normalem
  Tempo).
- **Oberfläche** (`src/ui/`) – ein SVG-Filz mit HTML-Plätzen darüber, in Tischeinheiten bemessen, sodass er vom Handy bis zum Desktop
  skaliert; ein parametrisches SVG-Figurengerüst mit Posen und Tell-Animationen.

## 📈 Simulationsskripte

| Skript | Was es tut |
| --- | --- |
| `npm run sim:strength` | Duplikat-Heads-up-Matches (500 pro Pool-Paar, Plätze bei denselben Karten getauscht) auf der Standardstruktur für 45 Minuten. Abnahme: Schwer schlägt Mittel und Mittel schlägt Leicht in ≥ 60 % der Matches. `HPL=…` probiert andere Stufenlängen, `PAIR=hard,medium` ein Paar, `SIM_VERBOSE=1` pro Stil. |
| `npm run sim:calibrate` | 300 Turniere im mittleren Pool pro Format und Auswertung, dein Platz gespielt vom mittleren Tight-aggressiv-Bot, bepreist mit einem Zeitmodell pro Hand (Austeilen 2,5 s, 1,3 s pro Bot-Aktion, 4 s pro menschlicher Aktion, 1,5 s pro Setzrunde, 3 s pro Auszahlung); sucht binär die Hände pro Stufe für jede Ziellänge und schreibt `src/engine/schedule.json`. |

Heads-up zwischen Bots scheidet schnell jemand aus, daher ist das 60-Minuten-Ziel heads-up nicht erreichbar – selbst mit praktisch
flachen Blinds dauert ein Heads-up-Lauf im Median etwa 44 Minuten. Der Plan hält das fest (`reachable: false`), und der
Einstellungsbildschirm zeigt die typische Länge.

## 🧪 Skripte

| Skript | Zweck |
| --- | --- |
| `npm run dev` | Vite-Entwicklungsserver |
| `npm run build` | Typprüfung (`tsc -b`) und Produktions-Build |
| `npm run preview` | Den Produktions-Build ausliefern |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (Engine-, Bot-, Controller- und Komponententests) |
| `npm run check` | lint → typecheck → test → build (was die CI ausführt) |
| `npm run sim:strength` / `sim:calibrate` | die Simulationen oben |

## 🏗️ Architektur

```
src/
  arcade/                 eingebundenes Zoltan's-Arcade-Kit – hier nicht bearbeiten (siehe dessen README)
  engine/                 reine Regeln, kein React
    cards.ts rng.ts       Karten 0..51, geseedetes mulberry32, Mischen
    evaluate.ts           7-Karten-Evaluator, describe()
    hand.ts pots.ts       Setzen, Side Pots, Showdown, Auszahlungen
    tournament.ts blinds.ts schedule.ts(+json) stats.ts
  bots/                   view.ts (BotView), profiles.ts (Kader), preflop.ts, equity.ts, strength.ts,
                          decide.ts, tells.ts, simulate.ts
  game/                   state.ts (advance), scoring.ts (+ standingPlace), persist.ts (Wächter), useBotTurns.ts, speed.ts
  ui/                     Table, Seat, CardView, Character, Chips, ActionBar, LogPanel, CharacterCard,
                          SetupScreen, SettingsPanel, themes, layout, useSettings, handLadder
  hooks/useHoldemKeys.ts
  demo/HoldemDemo.tsx     Attract-Mode der Startseite
  rules.tsx               Abschnitte des Regeln-Dialogs + HandLadderDiagram
  HoldemGame.tsx          das einbettbare Spiel (ArcadeGameProps)
  App.tsx main.tsx index.ts
scripts/                  sim-strength.ts, calibrate-blinds.ts (vite-node)
```

## 🤝 Mitwirken

Siehe [CONTRIBUTING.md](./CONTRIBUTING.md), den [Verhaltenskodex](./CODE_OF_CONDUCT.md) und [SECURITY.md](./SECURITY.md).
Mitwirkende stehen in [CONTRIBUTORS.md](./CONTRIBUTORS.md), Änderungen in [CHANGELOG.md](./CHANGELOG.md).

## ⚖️ Lizenz

[MIT](./LICENSE) © 2026 Zoltán Dul

---

<p align="center">Mit ❤️ gemacht von Zoltán Dul · Teil von <a href="https://github.com/ZoliQua/Arcade-Game-Center">Zoltan's Arcade</a></p>
