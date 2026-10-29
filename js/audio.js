/**
 * Realistic Casino Acoustic Sound Engine (Physical Modeling Synthesis)
 * Uses the Web Audio API to procedurally generate authentic casino sounds:
 * - Weighted clay chip clatter & stacking
 * - Real card deal, slide, and snap
 * - European roulette wheel hum, ivory ball track roll & fret deflector rattles
 * - Classic mechanical slot machine reel spin ratchet, solenoid stop thud & Bally win bell
 * - Metal coin drop cascade into stainless steel payout tray
 * - Translucent craps dice tumble on felt
 * - Subterranean mine explosions & diamond crystal chimes
 * 100% offline, zero external audio files needed, zero latency.
 */

class CasinoSoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('grCasinoMuted') === 'true';
    this.masterGain = null;
    this.noiseBuffer = null;
  }

  init() {
    if (!this.ctx && typeof AudioContext !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.85, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this._generateNoiseBuffer();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  _generateNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of pink/white noise
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Pink noise filtering
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('grCasinoMuted', this.muted);
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.85, this.ctx.currentTime);
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  // ── CASINO CHIPS ──────────────────────────────────────────

  /**
   * Authentic 14g clay chip impact sound.
   * Combination of high-frequency ceramic impact burst + dual body resonances + micro-rebound.
   */
  playChip() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    this._synthSingleChip(t, 1.0);
    // Micro-rebound 16ms later (gives true tactile clay chip character)
    this._synthSingleChip(t + 0.018, 0.45);
  }

  /**
   * Cascade of 3-4 chips handling / stacking (used for All-in or setting larger bets)
   */
  playChipStack() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const count = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const delay = t + i * 0.032 + Math.random() * 0.012;
      this._synthSingleChip(delay, 0.7 + Math.random() * 0.3);
    }
  }

  _synthSingleChip(time, vol = 1.0) {
    // 1. Ceramic Body Resonance 1 (~1920 Hz)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    const pitchJitter = (Math.random() - 0.5) * 120;
    osc1.frequency.setValueAtTime(1920 + pitchJitter, time);
    osc1.frequency.exponentialRampToValueAtTime(1400, time + 0.025);

    gain1.gain.setValueAtTime(0.28 * vol, time);
    gain1.gain.exponentialRampToValueAtTime(0.001, time + 0.024);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(time);
    osc1.stop(time + 0.026);

    // 2. Ceramic High-Pitch Overtone (~3840 Hz)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(3840 + pitchJitter * 2, time);

    gain2.gain.setValueAtTime(0.18 * vol, time);
    gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.016);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(time);
    osc2.stop(time + 0.018);

    // 3. Crisp Surface Transient Click (Bandpass filtered noise burst)
    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(4800, time);
      filter.Q.setValueAtTime(4.0, time);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.35 * vol, time);
      nGain.gain.exponentialRampToValueAtTime(0.001, time + 0.012);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.masterGain);
      noise.start(time);
      noise.stop(time + 0.015);
    }
  }

  // ── PLAYING CARDS ─────────────────────────────────────────

  /**
   * Tactile sound of card sliding across woolen felt baize + crisp snap.
   */
  playCard() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 1. Felt friction swoosh
    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, t);
      filter.frequency.exponentialRampToValueAtTime(2200, t + 0.04);
      filter.frequency.exponentialRampToValueAtTime(700, t + 0.09);
      filter.Q.setValueAtTime(1.5, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.24, t + 0.035);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start(t);
      noise.stop(t + 0.095);
    }

    // 2. Card corner snap click
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(450, t + 0.03);
    snapOsc.frequency.exponentialRampToValueAtTime(160, t + 0.06);

    snapGain.gain.setValueAtTime(0.001, t);
    snapGain.gain.setValueAtTime(0.2, t + 0.03);
    snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    snapOsc.connect(snapGain);
    snapGain.connect(this.masterGain);
    snapOsc.start(t + 0.03);
    snapOsc.stop(t + 0.065);
  }

  // ── ROULETTE WHEEL & IVORY BALL ──────────────────────────

  /**
   * European roulette wheel spin:
   * 1) Mahogany wheel rotation hum
   * 2) Fast ivory ball rolling on outer wooden track
   * 3) Ball dropping and rattling across metal frets (decelerating)
   * 4) Final settling pocket plink
   */
  playRouletteSpin(durationSec = 5.0, dropTimeSec = 3.8) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 1. Wooden Wheel Rotational Ambience
    if (this.noiseBuffer) {
      const wheelNoise = this.ctx.createBufferSource();
      wheelNoise.buffer = this.noiseBuffer;
      wheelNoise.loop = true;

      const wheelFilter = this.ctx.createBiquadFilter();
      wheelFilter.type = 'lowpass';
      wheelFilter.frequency.setValueAtTime(320, t);

      const wheelGain = this.ctx.createGain();
      wheelGain.gain.setValueAtTime(0.001, t);
      wheelGain.gain.linearRampToValueAtTime(0.18, t + 0.3);
      wheelGain.gain.setValueAtTime(0.18, t + durationSec - 0.8);
      wheelGain.gain.exponentialRampToValueAtTime(0.001, t + durationSec);

      wheelNoise.connect(wheelFilter);
      wheelFilter.connect(wheelGain);
      wheelGain.connect(this.masterGain);

      wheelNoise.start(t);
      wheelNoise.stop(t + durationSec);
    }

    // 2. High-speed ball rolling on mahogany track
    if (this.noiseBuffer) {
      const ballNoise = this.ctx.createBufferSource();
      ballNoise.buffer = this.noiseBuffer;
      ballNoise.loop = true;

      const ballFilter = this.ctx.createBiquadFilter();
      ballFilter.type = 'bandpass';
      ballFilter.frequency.setValueAtTime(2800, t);
      ballFilter.frequency.exponentialRampToValueAtTime(1400, t + dropTimeSec);
      ballFilter.Q.setValueAtTime(3.5, t);

      const ballGain = this.ctx.createGain();
      ballGain.gain.setValueAtTime(0.001, t);
      ballGain.gain.linearRampToValueAtTime(0.24, t + 0.15);
      ballGain.gain.setValueAtTime(0.20, t + dropTimeSec * 0.7);
      ballGain.gain.exponentialRampToValueAtTime(0.001, t + dropTimeSec);

      ballNoise.connect(ballFilter);
      ballFilter.connect(ballGain);
      ballGain.connect(this.masterGain);

      ballNoise.start(t);
      ballNoise.stop(t + dropTimeSec + 0.05);
    }

    // 3. Ball dropping onto metal frets / deflectors
    const clickCount = 8;
    const startFret = dropTimeSec * 0.75;
    for (let i = 0; i < clickCount; i++) {
      const prog = i / (clickCount - 1);
      const sec = startFret + Math.pow(prog, 1.4) * (dropTimeSec - startFret);
      const clickTime = t + sec;
      const isLast = i >= clickCount - 2;
      const intensity = 0.15 + prog * 0.12;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isLast ? 1400 : 2600 + Math.random() * 600, clickTime);

      gain.gain.setValueAtTime(intensity, clickTime);
      gain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.015);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(clickTime);
      osc.stop(clickTime + 0.018);
    }

    // 4. Final pocket settling clack
    setTimeout(() => {
      if (this.ctx && !this.muted) {
        this._synthSingleChip(this.ctx.currentTime, 0.35);
      }
    }, Math.floor(dropTimeSec * 1000));
  }

  /** Single ball bounce on brass fret */
  playRouletteBounce(intensity = 0.3) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2200 + Math.random() * 800, t);
    gain.gain.setValueAtTime(intensity * 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.022);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.025);
  }

  // ── CLASSIC GAMBLE / SLOT MACHINE ─────────────────────────

  /**
   * Slot machine reel spinning ratchet flutter.
   */
  playSlotReelSpin() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const clicks = 24;
    for (let i = 0; i < clicks; i++) {
      const clickTime = t + i * 0.045;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(320 + (i % 3) * 60, clickTime);

      gain.gain.setValueAtTime(0.06, clickTime);
      gain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.018);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(clickTime);
      osc.stop(clickTime + 0.02);
    }
  }

  /**
   * Heavy mechanical solenoid reel stop "THUD".
   * Authentic physical slot reel stopping with spring damping.
   */
  playSlotReelStop() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Heavy low thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.06);

    gain.gain.setValueAtTime(0.42, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.075);

    // Mechanical spring metallic click
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(820, t);
    osc2.frequency.exponentialRampToValueAtTime(300, t + 0.03);

    gain2.gain.setValueAtTime(0.18, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(t);
    osc2.stop(t + 0.04);
  }

  /**
   * Classic Bally/IGT electromechanical slot machine payout bell!
   * Dual detuned metallic bell rings (1046Hz & 1052Hz) + overtones.
   */
  playSlotWinBell(rings = 3) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    for (let r = 0; r < rings; r++) {
      const ringTime = now + r * 0.16;
      this._synthBellStrike(ringTime);
    }
  }

  _synthBellStrike(time) {
    const freqs = [1046.5, 1052.2, 2093.0, 3139.5];
    const vols  = [0.22, 0.22, 0.09, 0.04];
    const decays = [0.45, 0.45, 0.25, 0.15];

    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, time);

      gain.gain.setValueAtTime(vols[idx], time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + decays[idx]);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + decays[idx] + 0.01);
    });
  }

  /**
   * Metal coins clinking into stainless steel payout tray.
   */
  playCoinDrop(count = 5) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    for (let i = 0; i < count; i++) {
      const dropTime = t + i * 0.065 + Math.random() * 0.02;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2600 + Math.random() * 900, dropTime);

      gain.gain.setValueAtTime(0.18, dropTime);
      gain.gain.exponentialRampToValueAtTime(0.001, dropTime + 0.045);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(dropTime);
      osc.stop(dropTime + 0.05);
    }
  }

  // ── CRAPS / CASINO DICE ───────────────────────────────────

  /**
   * Real casino craps dice tumbling across felt against pyramid rubber wall.
   */
  playDiceRoll() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // 4 randomized percussive felt thuds
    const thuds = [0, 0.08, 0.17, 0.28];
    thuds.forEach((d, idx) => {
      const thudTime = t + d;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160 + Math.random() * 60, thudTime);
      osc.frequency.exponentialRampToValueAtTime(60, thudTime + 0.045);

      gain.gain.setValueAtTime(0.25 - idx * 0.03, thudTime);
      gain.gain.exponentialRampToValueAtTime(0.001, thudTime + 0.05);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(thudTime);
      osc.stop(thudTime + 0.055);
    });
  }

  // ── WIN & LOSE FANFARES ───────────────────────────────────

  playWin() {
    this.playSlotWinBell(3);
    setTimeout(() => this.playCoinDrop(6), 250);
  }

  playLose() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [260, 220, 180];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + idx * 0.14);

      gain.gain.setValueAtTime(0.12, t + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.14 + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + idx * 0.14);
      osc.stop(t + idx * 0.14 + 0.22);
    });
  }

  // ── MINES & PLINKO ACCENTS ────────────────────────────────

  playGem() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1174.66, t); // D6
    osc.frequency.exponentialRampToValueAtTime(2349.32, t + 0.12); // D7

    gain.gain.setValueAtTime(0.24, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  playBoom() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.45);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.52);
  }

  playPeg() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(700 + Math.random() * 300, t);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.04);
  }
}

// Global acoustic sound singleton
window.sound = new CasinoSoundEngine();
