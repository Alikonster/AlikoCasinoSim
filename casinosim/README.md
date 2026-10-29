# Aliko Casino & Resort — Grand Salon Simulator (`casinosim`)

A fully modular, zero-dependency browser-based virtual casino suite redesigned with an authentic luxury casino aesthetic (Emerald Felt, Polished Mahogany, Brass Trim, Padded Leather Table Rails) and an advanced procedural acoustic physics sound synthesizer.

---

## 🏛️ Authentic Casino Redesign ("Less AI, More Real Casino")

1. **Luxury Casino Materials & Atmosphere:**
   - **Table Surfaces:** Rich European Casino Green Baize (`#0a3c23` with radial vignette and spotlight illumination) framed by deep mahogany wood borders and stitched black leather armrest bumpers.
   - **Header & Navigation:** Styled as a Monte Carlo VIP Grand Salon with brass dividers, high-roller VIP balance plaque, and tactile leatherette room selector tabs.
   - **Classic Typography:** Luxury serif foiling using `Cinzel` and `Playfair Display` alongside high-legibility numerals.
2. **Authentic 14g Clay Casino Chips:**
   - Multi-tone striped edge inserts crafted via CSS `conic-gradient`.
   - Real Nevada casino standard colors:
     - **$5 Red** (Bordeaux with White inserts)
     - **$25 Green** (Casino Green with Gold inserts)
     - **$50 Orange** (Amber with White inserts)
     - **$100 Black** (Onyx with Gold inserts)
     - **$500 Purple** (High-Roller Purple with Pink inserts)
   - Concentric clay texture, tactile drop shadows, and authentic physical stacking sounds.
3. **Blackjack Table:**
   - Screenprinted gold felt banner: `★ BLACKJACK PAYS 3 TO 2 ★` with dealer rules and insurance arches.
   - Genuine casino playing cards with intricate crosshatch lattice backs (Bicycle / Club Special style) and crisp corner indices.
4. **European Roulette:**
   - 3D Mahogany bowl with brass deflector frets and chrome center turret.
   - Independent ivory ball track: the ivory ball physically orbits counter-clockwise on the outer rim and drops into the winning pocket!
   - Full French/European betting table cloth.
5. **Vintage Gamble Machine (Electro-mechanical Slots):**
   - Polished chrome cabinet bezel with backlit glass marquee topper (`★ GOLDEN FORTUNE JACKPOT ★`).
   - 3D cylindrical drum reels with realistic curved glass highlights and deep shadow depth.
   - Illuminated payline and electromechanical payout bell chime.
6. **Craps / Precision Dice:**
   - Translucent ruby-red acrylic razor-edge casino dice with recessed white circular pips.
   - Felt tumbling sound and calibrated true-odds probability multipliers.

---

## 🔊 Advanced Physical Modeling Sound Engine (`js/audio.js`)

Zero external mp3/wav files required — all sounds are synthesized live via the Web Audio API with realistic physical acoustic modeling:
- **Clay Casino Chips:** High-frequency ceramic impact bursts with dual body resonances (`1920Hz` & `3840Hz`) and micro-rebounds.
- **Card Deals & Slides:** Bandpass-filtered woolen felt friction swoosh plus crisp corner snap.
- **Roulette Wheel:** Low-frequency rotational mahogany hum, fast ivory ball rolling on track, and decelerating fret deflector clicks settling with a pocket plink.
- **Mechanical Slot Machine:** High-speed ratchet clicking flutter during spin, heavy solenoid `THUD-CLANK` on reel stops, and authentic dual-tone Bally electromechanical payout bells (`1046Hz` & `1052Hz`) with coins clattering into the stainless steel tray.
- **Craps Dice:** Realistic acoustic tumbling thuds against rubber bumper and felt baize.
- **Master Audio Toggle:** Header `🔊 / 🔇` button with persistence in `localStorage`.

---

## 📁 Project Architecture

```
casinosim/
├── index.html                   # Application entry point
├── README.md                    # Project documentation
├── css/
│   ├── main.css                 # Master theme: Mahogany, Brass, Leather, Baize felt, Clay chips
│   └── games/
│       ├── blackjack.css        # Horseshoe felt, gold banner, card spots
│       ├── hol.css              # VIP card salon, gold VS medallion
│       ├── roulette.css         # Mahogany wheel bowl, ivory ball track, betting cloth
│       ├── slots.css            # Vintage Vegas slot cabinet, backlit marquee, 3D cylindrical reels
│       ├── coinflip.css         # 24K gold & sterling silver 3D medallion
│       ├── dice.css             # Ruby-red precision craps dice on emerald felt
│       ├── mines.css            # Jewel vault grid, gem reveals, subterranean bomb blasts
│       └── plinko.css           # High-roller brass pegboard and neon multiplier bins
└── js/
    ├── audio.js                 # Physical acoustic sound synthesizer (chips, roulette, slots, etc.)
    ├── state.js                 # State management, localStorage persistence, 4h bonus countdown
    ├── ui.js                    # Chip betting system, navigation, toast notifications, deck tools
    └── games/
        ├── blackjack.js         # Hit, Stand, Double, 3:2 Natural Blackjack
        ├── hol.js               # Hi-Lo logic with fixed card-by-card continuity
        ├── roulette.js          # European roulette, physical ball animation, calibrated payouts
        ├── slots.js             # Weighted reels, electromechanical bells, coin drop cascades
        ├── coinflip.js          # 3D coin flip physics with 1.95x payout
        ├── dice.js              # 2D6 dice roll with calibrated probability multipliers
        ├── mines.js             # 5x5 Mines grid with fair 96% RTP formula
        └── plinko.js            # 12-row Canvas physics, peg collision sound, calibrated buckets
```

---

## 🚀 How to Run

Simply open [`casinosim/index.html`](file:///C:/Users/aldiyar/casinosim/index.html) in any modern web browser. No local web server, Node.js, or build step is required.
