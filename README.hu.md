# 🃏 Texas Hold'em

[English](README.md) · [Deutsch](README.de.md) · **Magyar**

No-limit Texas Hold'em versenyek **React 18**, **Vite** és **TypeScript** alapon – heads-up vagy 6 fős sit & go **15 saját
rajzfilmes gépi ellenfél** ellen, mindegyiknek saját arca, játékstílusa, erőssége és egy-két látható árulkodó szokása van. Animált
SVG-asztal három kinézettel, színtévesztőknek is jól olvasható pakli, minden lépéshez szövegbuborék és teljes leosztásnapló teszi
könnyen követhetővé a 20–60 perces játékot.
Önállóan **és** a **[Zoltan's Arcade](https://github.com/ZoliQua/Arcade-Game-Center)** tizenöt játékának egyikeként is fut –
játszd itt: [dulzoltan.hu/arcade/#/play/holdem](https://dulzoltan.hu/arcade/#/play/holdem).

[![CI](https://github.com/ZoliQua/Texas-Holdem-Game/actions/workflows/ci.yml/badge.svg)](https://github.com/ZoliQua/Texas-Holdem-Game/actions/workflows/ci.yml)
![license](https://img.shields.io/badge/license-MIT-green)
![node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![react](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![typescript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)

---

## 📑 Tartalom

- [A Zoltan's Arcade család](#%EF%B8%8F-a-zoltans-arcade-család)
- [Funkciók](#-funkciók)
- [Gyors kezdés](#-gyors-kezdés)
- [A verseny](#-a-verseny)
- [Irányítás](#%EF%B8%8F-irányítás)
- [Pontozás és statisztika](#-pontozás-és-statisztika)
- [A szereplők](#-a-szereplők)
- [Színtévesztő-barát kialakítás](#-színtévesztő-barát-kialakítás)
- [Automatikus mentés és folytatás](#-automatikus-mentés-és-folytatás)
- [Beágyazás az Arcade-Game-Centerbe](#-beágyazás-az-arcade-game-centerbe)
- [Hogyan működik](#-hogyan-működik)
- [Szimulációs szkriptek](#-szimulációs-szkriptek)
- [Szkriptek](#-szkriptek)
- [Felépítés](#%EF%B8%8F-felépítés)
- [Közreműködés](#-közreműködés)
- [Licenc](#%EF%B8%8F-licenc)

## 🕹️ A Zoltan's Arcade család

Minden játék önálló repó, amely a portálba is beépül. Közös a dizájnrendszerük, a pontozási modelljük és a mentési formátumuk – ezt a beépített [`src/arcade/`](./src/arcade) kit adja.

| Játék | Repó | Műfaj |
| --- | --- | --- |
| 🏠 **Arcade portál** | [Arcade-Game-Center](https://github.com/ZoliQua/Arcade-Game-Center) | Minden játék egy helyen, élő demók, statisztika, ranglista |
| 🧱 Tetris | [Tetris-Game](https://github.com/ZoliQua/Tetris-Game) | Árkád |
| 🐍 Snake | [Snake-Game](https://github.com/ZoliQua/Snake-Game) | Reflex |
| 🔢 2048 | [2048-Game](https://github.com/ZoliQua/2048-Game) | Logikai |
| 🟡 Pac-Man | [Pac-Man-Game](https://github.com/ZoliQua/Pac-Man-Game) | Labirintus |
| ⚫ Gomoku | [Gomoku-Game](https://github.com/ZoliQua/Gomoku-Game) | Stratégia |
| 🦷 Tic-Tac-Toe | [Tic-Tac-Toe-Game](https://github.com/ZoliQua/Tic-Tac-Toe-Game) | Párbaj |
| 🏓 Breakout | [Breakout-Game](https://github.com/ZoliQua/Breakout-Game) | Ütő |
| 👾 Space Invaders | [Space-Invaders-Game](https://github.com/ZoliQua/Space-Invaders-Game) | Lövöldözős |
| 🔴 Connect Four | [Connect-Four-Game](https://github.com/ZoliQua/Connect-Four-Game) | Párbaj |
| 🔩 Nut Sort | [Nut-Sort-Game](https://github.com/ZoliQua/Nut-Sort-Game) | Rendezős |
| 🃏 **Texas Hold'em** (ez a repó) | [Texas-Holdem-Game](https://github.com/ZoliQua/Texas-Holdem-Game) | Kártya |
| 💣 Minesweeper | [Minesweeper-Game](https://github.com/ZoliQua/Minesweeper-Game) | Logikai |
| ♠️ Solitaire | [Solitaire-Game](https://github.com/ZoliQua/Solitaire-Game) | Kártya |
| 🎴 Ulti | [Ulti-Game](https://github.com/ZoliQua/Ulti-Game) | Kártya |
| 🂡 Snapszer | [Snapszer-Game](https://github.com/ZoliQua/Snapszer-Game) | Kártya |

## ✨ Funkciók

- 🏆 **Sit & go versenyek** – heads-up (te + 1 gép) vagy 6 fős (te + 5 gép); az nyer, akinél utoljára marad zseton
- 🎚️ **Könnyű, közepes vagy nehéz** – a játék a megfelelő szereplőkészletből ültet gépeket az asztalhoz
- ⏱️ **20, 30, 45 vagy 60 perc** – a vakszintek a *lejátszott leosztások* szerint lépnek, szimulációval kalibrálva, így a szünet
  sosem gyorsítja őket
- 🦊 **15 saját szereplő** – teknős, egér, medve, róka, robot… mindegyiknek neve, stílusa (rock, calling station, TAG, LAG, maniac),
  erőssége és egy-két saját árulkodó szokása van; a szereplő kártyáját a helyéről nyithatod meg
- 🎬 **Animált asztal** – osztás, a flop/turn/river felfordítása, a tétvonalhoz és a kasszába csúszó zsetonok, a nyertesükhöz
  vándorló mellékkasszák, mozgó osztógomb, gondolkodó gyűrű a gépeknél és a szereplők pózai
- 💬 **Buborékok és leosztásnapló** – minden lépés buborékként jelenik meg a helynél („Emel 120-ra”) és a naplóban, leosztásonként
  és körönként csoportosítva, a mutatással („Bruno nyer 1 240-et flush-sel, K magas”) és a kiesésekkel („Pixel 4.-ként kiesett”)
- 🎨 **Három asztal** – Arcade neon (alapértelmezett), klasszikus kaszinó, elegáns sötét; **négyszínű vagy szürke pakli**;
  lassú / normál / gyors tempó
- 🧠 **Tisztességes gépek** – mindig csak egy `BotView`-t látnak (a nyilvános információt és a saját két lapjukat); egy teszt
  összekeveri mindenki más lapjait és a paklit, és ellenőrzi, hogy egyetlen döntés sem változik
- 📱 **Telefonra kész** – álló képernyőn függőleges asztal, a napló számlálós fiókként, érintőképernyőn pedig hüvelykujjal elérhető
  lenti sáv ujjnyi gombokkal, 44 px magas emeléscsúszkával és gyorsgombokkal
- 📖 **Szabályok ablak** – cél, irányítás, szabályok, pontozás és kézrangsor példalapokkal; megnyitáskor a játék szünetel
- 🏁 **Idő előtti befejezés** – szándékosan lezárhatod a versenyt, és a zsetonjaid szerinti jelenlegi helyezésed pontjai kerülnek
  a ranglistára
- ⛶ **Teljes képernyő** – az asztal az oldal nélkül (iPhone-on CSS-es teljes képernyős mód)
- 💾 **Automatikus mentés és folytatás** – az egész verseny, akár leosztás közben is, túléli az újratöltést és a lap bezárását
- 🌗 **Sötét / világos téma**, közös minden arcade-játékkal (**T** billentyű)
- 🌍 **Három nyelv** – angol, magyar és német; váltás a felső sávban vagy a beállításokban (linkben `?lang=en|hu|de` is); a számok
  a nyelv szerinti számjegy-csoportosítást követik
- 🦷 **Fogas mód** – „Fogas mód” / "Dental mode" / „Zahnmodus” kapcsoló a beállításokban, alapból kikapcsolva (vagy `?dental=1`),
  az egész arcade-ban közös: amíg be van kapcsolva, menta-fehér rendelőasztal váltja a választott asztalt, a szereplők fogászati
  figurákká válnak, de megtartják árulkodó szokásaikat, a lapok hátán pedig fog-logó van; csak megjelenés
- 🤖 **Bemutató mód** (`<HoldemDemo />`) – hat gép gyors leosztásokat játszik a portál nyitóoldalán
- 🧪 **Tesztelve** – a kiértékelő mind a 2 598 960 ötlapos kézen, a licitálási és mellékkassza-szabályok, 1 000+ véletlen leosztás a
  zsetonmegmaradásra, csalás elleni védelem, árulkodó szokások, a mentésőr és a felület

## 🚀 Gyors kezdés

Kell hozzá **Node ≥ 20** és npm.

```bash
git clone https://github.com/ZoliQua/Texas-Holdem-Game.git
cd Texas-Holdem-Game
npm install
npm run dev          # http://localhost:5173
```

Éles build: `npm run build && npm run preview`. A build relatív útvonalakat használ, így a `dist/` bármelyik almappából kiszolgálható.

## 🎲 A verseny

A szokásos no-limit hold'em versenyszabályok:

- Mindenki **1 500 zsetonnal** kezd; a vakok **10/20**-ról indulnak, és a 10/20, 15/30, 25/50, 50/100, 75/150, 100/200, 150/300,
  200/400, 300/600, 400/800, 600/1 200, 800/1 600, 1 000/2 000 létrán emelkednek, utána ×1,5-tel egy kerek értékre. Ante nincs.
- Az osztógomb az óramutató járásával megegyezően halad. Heads-upban az osztó teszi be a kisvakot, flop előtt elsőként, utána
  utolsóként lép.
- A minimális emelés akkora, mint az előző tét vagy emelés; egy teljes emelésnél kisebb all-in nem nyitja újra a licitet azoknak, akik
  már léptek. A meg nem adott zsetonok visszakerülnek a tulajdonosukhoz.
- Minden all-in szinthez mellékkassza jön létre; megosztott kasszában a maradék zseton az osztótól balra eső első nyertesé.
- Mutatáskor az utolsó támadó mutat először. A gépek mindig mutatnak, hogy a napló beszédes maradjon.
- Az ugyanabban a leosztásban kiesők sorrendjét a leosztás eleji zsetonjuk adja (egyenlő zsetonnal ugyanazt a helyet kapják).
- A játékod véget ér, ha kiesel vagy nyersz – a gépeknek nem kell végigjátszaniuk –, vagy ha megnyomod a **Befejezés** gombot.

A **szintenkénti leosztások** száma a `src/engine/schedule.json`-ból jön (lásd [Szimulációs szkriptek](#-szimulációs-szkriptek)).
A felső sáv mindig mutatja a vakokat, a következő szintet, és hogy hány leosztás van még addig.

## ⌨️ Irányítás

| Billentyű | Művelet |
| --- | --- |
| **F** | Dobás |
| **C** | Passz, vagy a kiírt összeg megadása |
| **R** | Ugrás a tét / emelés csúszkájára |
| ⬅️ ➡️ | Az összeg módosítása egy nagyvakkal (akkor is, ha a csúszkán van a fókusz) |
| **A** | All-in kiválasztása (megerősítés **Enter**rel) |
| **Enter** | Tét / emelés megerősítése · indítás · folytatás |
| **P** / **Esc** | Szünet / folytatás (akkor is, ha a lap a háttérbe kerül) |
| **T** | Sötét / világos téma váltása (önálló oldalon) |

A lépéssávban van **Dobás**, **Passz / Megadás n**, egy **csúszka** a minimális emeléstől az all-inig, a **Min. · ½ kassza ·
¾ kassza · Kassza · All-in** gyorsgombok, és egy megerősítő gomb, amely mindig mutatja az összeget. Amíg egy lépés animálódik, a sáv
zárolva van, így dupla kattintás vagy dupla Enter sosem lép kétszer. A gyorsbillentyűk nem működnek, amíg mezőbe gépelsz, vagy
lenyomva tartod a Cmd/Ctrl/Alt billentyűt. Az **R** az emelés csúszkájáé, ezért a **Szabályok** ablak a Verseny panel gombjával
nyílik.

**Telefonon:** a lépéseid az asztal alatti lenti sávban vannak, hüvelykujjnyi távolságra – koppints a **Dobás**, **Passz /
Megadás** vagy az emelés gombra, húzd a (44 px magas) csúszkát, vagy koppints egy gyorsgombra a tét beállításához; az emelés gombja
megerősítés előtt mindig mutatja az összeget. Egy szereplőre koppintva megnyílik a kártyája. A **Szabályok**, **Befejezés** és
**Teljes képernyő** gomb a Verseny panelen van. iPhone-on add hozzá az oldalt a főképernyőhöz, így böngészősávok nélkül látod.

## 🎯 Pontozás és statisztika

A nehézség és a helyezés számít, a tempó és a hossz nem.

```
base       = { easy: 1000, medium: 2500, hard: 5000 }[difficulty]
placeShare = 6-max:    [1.00, 0.60, 0.40, 0.25, 0.10, 0.00][place − 1]
             heads-up: win 0.40, loss 0.00
score      = round(base × placeShare)          // max 5 000
```

| Hely | Könnyű, 6 fős | Közepes, 6 fős | Nehéz, 6 fős | Heads-up győzelem (K / Kö / N) |
| --- | --- | --- | --- | --- |
| 1. | 1 000 | 2 500 | **5 000** | 400 / 1 000 / 2 000 |
| 2. | 600 | 1 500 | 3 000 | — |
| 3. | 400 | 1 000 | 2 000 | — |
| 4. | 250 | 625 | 1 250 | — |
| 5. | 100 | 250 | 500 | — |
| 6. | 0 | 0 | 0 | — |

**Idő előtti befejezés.** A **Befejezés** gomb azonnal lezárja az egész versenyt (egy megerősítés után, amely mutatja a pontokat).
A még játékban lévők között a zsetonjaid alapján kapsz helyezést – a mostani leosztás előtti állás szerint, egyenlő zsetonnál a jobb
helyet –, és pontosan annyi pontot kapsz, amennyit az a hely a fenti táblázat szerint ér; az eredménykártyán „Idő előtt befejezve”
áll.

Minden befejezett versenyt egyszer rögzít a kit az `arcade.stats.holdem` alatt (rekord, játszmák, győzelmek, idő); az eredmény első
helynél `win`, a **Befejezés** gombbal lezárt versenynél `finished`, egyébként `loss`. Az **Új verseny** gombbal feladott verseny
nem kerül rögzítésre.

## 🦊 A szereplők

Tizenöt saját szereplő – nehézségi készletenként öt. Minden készletben ugyanaz az öt stílus van, annál jobban játszva, minél nehezebb
a készlet:

| Stílus | Így játszik… |
| --- | --- |
| **Rock** | nagyon kevés kezet, és ritkán tesz be zsetont valódi lap nélkül |
| **Calling station** | sok flopot néz meg; sokat megad, ritkán emel, nehéz megblöffölni |
| **Tight-aggresszív** | jó kezdőkezeket, keményen |
| **Loose-aggresszív** | sok kezet, folyamatos nyomással |
| **Maniac** | bármit, bármikor – és sokat blöfföl |

Egy **közepes** 6 fős asztalhoz négy közepes szereplő ül, plusz egy meglepetésvendég a könnyű vagy a nehéz készletből. Az erősség
határozza meg, hány equity-mintát vesz egy gép, mennyire jól olvassa a range-eket és a szokásokat, mennyire túlozza el a stílusát,
és milyen gyakran hibázik (túl lazán ad meg, kihagy egy értékfogadást, szórja a zsetont).

**Árulkodó szokások.** Minden szereplőnek van egy-két saját szokása, amelyet a *saját* keze vált ki – a szereplő egy animációja vagy a
gondolkodási idejének változása. A könnyű szereplők nagyjából az esetek 80 %-ában őszinték, a közepesek kb. 60 %-ban; a nehezek ritkán
mutatják őket, és néha szándékosan meg is fordítják. A játék sosem árulja el, mit jelentenek: figyelni rájuk a móka része. A szereplő
kártyája (kattints egy helyre) mutatja a stílust és a játékmenet élő statisztikáit: VPIP, PFR, agresszió és mutatások.

## 🎨 Színtévesztő-barát kialakítás

Semmilyen információ nem csak színen múlik:

- **A színek formák** – nagy, rajzolt pikk / kőr / káró / treff formák a sarokjelzésben és egy nagy középső jel, egymásra csúszott
  lapokon is jól láthatók. Az alapértelmezett **négyszínű** pakli (♠ fekete, ♥ piros, ♦ kék, ♣ zöld) színt is ad; a **szürke**
  pakli elveszi.
- Az **aktív hely** körül mozgó szaggatott keret és „Gondolkodik…” / „Te jössz” felirat van; a gépeknél visszaszámláló gyűrű is.
- **DOBOTT**, **ALL-IN** és **KIESETT** címkék; a dobott helyek halványabbak, a kiesett szereplők szürkék.
- A **nyerő öt lap** kiemelkedik és keretet kap; a naplóban az eredmények ★, a kiesések ✕ jelet kapnak.
- A zsetonok összege mindig szövegként is látszik.
- A `prefers-reduced-motion` lerövidíti az animációkat, de a buborékokat és a naplót sosem hagyja ki.

## 💾 Automatikus mentés és folytatás

Az egész verseny – a beállítás, az ültetés, a seedelt pakli és a pozíciója, a teljes asztalállapot, a napló (utolsó 200 leosztás) és a
játékmenet statisztikái – minden lépés után mentődik (kulcs: `arcade.session.holdem`, sémaverzióval). Egy szigorú őr ellenőrzi a
szerkezetet, a **zsetonmegmaradást** (zsetonok + kasszák = játékosok × 1 500), a lapok egyediségét, a soron lévő játékost, és hogy
minden gép pontosan egy szereplő a névsorból; minden mást eldob. Újratöltés után **Üdv újra!** fogad, a játék pontosan ugyanannál a
döntésnél áll szünetelve – ugyanazok a lapok, ugyanaz a kassza, ugyanaz a napló, nincs új osztás.

## 🧩 Beágyazás az Arcade-Game-Centerbe

```tsx
import { HoldemGame, HoldemDemo } from '@arcade/holdem';

<HoldemGame
  embedded                                       // az oldalcím elrejtése; a portál mutatja
  onGameOver={(score) => submitScore('holdem', score)}  // befejezett játékok 0-nál több ponttal, és minden Befejezés
  onRunEnd={(run) => console.log(run.outcome, run.score)}
  onStatusChange={({ status, seconds }) => updateHeader(status, seconds)}
/>
<HoldemDemo active={cardIsVisible} />            // bemutató mód a nyitóoldalon
```

Állapotok: `idle` a beállító képernyőn, `running` verseny közben, `paused` felfüggesztve vagy visszaállítva, `gameOver` attól, hogy
a játékod véget ért, egészen egy új versenyig.

## 🧠 Hogyan működik

- **Motor** (`src/engine/`) – tiszta és megváltoztathatatlan adatokkal dolgozik. A lapok 0–51 közötti számok; egy rangszámlálós,
  bitmaszkos **hétlapos kiértékelő** foglalás nélkül pontozza a kezeket. A `startHand` és az `applyAction` a vakoktól a mutatásig
  levezet egy leosztást, felépíti a mellékkasszákat és minden eseményt rögzít. A paklit egy seedelt mulberry32 generátor keveri, az
  állapota az asztallal együtt mentődik.
- **Gépek** (`src/bots/`) – a `toBotView` az egyetlen híd az asztal és a gépek kódja között. A flop előtti döntések egy 169 kezes
  táblázatra (all-in equity egy véletlen kéz ellen, ezzel a kiértékelővel számolva), a pozícióra és a zsetonmélységre épülnek, rövid
  zsetonnál push/fold táblával. A flop után a gép **Monte Carlo equity**-becslést futtat az ellenfelek lépéseiből (az ügyesebb
  gépeknél a megfigyelt szokásaikból is) kiolvasott range-ek ellen, és ezt veti össze a kassza-esélyekkel, a stílusával és egy
  ökölszabállyal arról, mikor köti el a zsetonjait.
- **Vezérlő** (`src/game/`) – egy reducer (`advance`) futó animációt jelző nonce-szal, a pontozási képlet, a mentésőr és a
  `useBotTurns`, amely körönként pontosan egy gépi lépést ütemez látható gondolkodási idővel (normál tempón 0,6–2 mp).
- **Felület** (`src/ui/`) – SVG-posztó HTML-helyekkel a tetején, asztalegységekben méretezve, így telefontól asztali gépig
  skálázódik; paraméteres SVG-szereplővázak pózokkal és árulkodó animációkkal.

## 📈 Szimulációs szkriptek

| Szkript | Mit csinál |
| --- | --- |
| `npm run sim:strength` | Duplikált heads-up meccsek (készletpáronként 500, ugyanazokon a lapokon helycserével) az alapértelmezett 45 perces szerkezeten. Elfogadás: a nehéz a meccsek ≥ 60 %-ában legyőzi a közepest, a közepes a könnyűt. `HPL=…` más szinthosszt próbál, `PAIR=hard,medium` egy párt, `SIM_VERBOSE=1` stílusonként ír. |
| `npm run sim:calibrate` | Formátumonként és kiértékelésenként 300 verseny a közepes készlettel, a te helyeden a közepes tight-aggresszív géppel, leosztásonkénti időmodellel árazva (osztás 2,5 mp, gépi lépésenként 1,3 mp, emberi lépésenként 4 mp, körönként 1,5 mp, kifizetésenként 3 mp); bináris kereséssel megkeresi a szintenkénti leosztásszámot minden célhosszra, és megírja a `src/engine/schedule.json`-t. |

Gépek között heads-upban hamar kiesik valaki, ezért a 60 perces heads-up cél nem érhető el – a gyakorlatilag lapos vakokkal is egy
heads-up játék medián hossza kb. 44 perc. Az ütemterv ezt rögzíti (`reachable: false`), a beállító képernyő pedig a jellemző hosszt
mutatja.

## 🧪 Szkriptek

| Szkript | Mire való |
| --- | --- |
| `npm run dev` | Vite fejlesztői szerver |
| `npm run build` | Típusellenőrzés (`tsc -b`) és éles build |
| `npm run preview` | Az éles build kiszolgálása |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (motor-, gép-, vezérlő- és komponenstesztek) |
| `npm run check` | lint → typecheck → test → build (ezt futtatja a CI) |
| `npm run sim:strength` / `sim:calibrate` | a fenti szimulációk |

## 🏗️ Felépítés

```
src/
  arcade/                 beépített Zoltan's Arcade kit – itt ne szerkeszd (lásd a README-jét)
  engine/                 tiszta szabályok, React nélkül
    cards.ts rng.ts       lapok 0..51, seedelt mulberry32, keverés
    evaluate.ts           hétlapos kiértékelő, describe()
    hand.ts pots.ts       licit, mellékkasszák, mutatás, kifizetés
    tournament.ts blinds.ts schedule.ts(+json) stats.ts
  bots/                   view.ts (BotView), profiles.ts (névsor), preflop.ts, equity.ts, strength.ts,
                          decide.ts, tells.ts, simulate.ts
  game/                   state.ts (advance), scoring.ts (+ standingPlace), persist.ts (őr), useBotTurns.ts, speed.ts
  ui/                     Table, Seat, CardView, Character, Chips, ActionBar, LogPanel, CharacterCard,
                          SetupScreen, SettingsPanel, themes, layout, useSettings, handLadder
  hooks/useHoldemKeys.ts
  demo/HoldemDemo.tsx     bemutató mód a nyitóoldalra
  rules.tsx               a Szabályok ablak szakaszai + HandLadderDiagram
  HoldemGame.tsx          a beágyazható játék (ArcadeGameProps)
  App.tsx main.tsx index.ts
scripts/                  sim-strength.ts, calibrate-blinds.ts (vite-node)
```

## 🤝 Közreműködés

Lásd a [CONTRIBUTING.md](./CONTRIBUTING.md)-t, a [magatartási kódexet](./CODE_OF_CONDUCT.md) és a [SECURITY.md](./SECURITY.md)-t.
A közreműködők a [CONTRIBUTORS.md](./CONTRIBUTORS.md)-ben, a változások a [CHANGELOG.md](./CHANGELOG.md)-ben vannak.

## ⚖️ Licenc

[MIT](./LICENSE) © 2026 Zoltán Dul

---

<p align="center">❤️-vel készítette Dul Zoltán · a <a href="https://github.com/ZoliQua/Arcade-Game-Center">Zoltan's Arcade</a> része</p>
