/**
 * European Roulette Game Logic with Realistic Ball Physics & Audio
 * - Independent physical ivory ball simulation inside SVG coordinate space
 * - True 1-to-1 visual alignment: ball, winning pocket, and number share the same radial vector
 * - Randomized throw force (speed, duration, revolutions)
 * - Outer track orbit, spiral descent, deflector hits, fret bouncing
 * - Ball rests inside winning pocket and rides smoothly with the rotating wheel
 * - Zero center offset or penultimacy bugs
 */

const rouletteRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const rouletteSequence = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

const TOTAL_POCKETS = 37;
const POCKET_DEG = 360 / TOTAL_POCKETS; // ~9.7297°

// SVG coordinate radiuses (viewBox 0 0 200 200, center at 100, 100)
const SVG_RADIUS_OUTER_TRACK = 91.5; // High outer ball track
const SVG_RADIUS_POCKETS     = 55.5; // Dead-center inside pocket compartment

// Persistent state across spins
let currentWheelAngle      = 0;
let currentBallLocalAngle  = -90 + 0.5 * POCKET_DEG; // Centered in pocket 0
let rouletteSpinning       = false;
let rouletteRafId          = null;

let selectedRouletteBet    = null;
let selectedRouletteNumber = null;

/** Create SVG annular sector (doughnut wedge) */
function createAnnularSector(cx, cy, rIn, rOut, aStart, aEnd) {
  const x1 = cx + rOut * Math.cos(aStart);
  const y1 = cy + rOut * Math.sin(aStart);
  const x2 = cx + rOut * Math.cos(aEnd);
  const y2 = cy + rOut * Math.sin(aEnd);
  const x3 = cx + rIn * Math.cos(aEnd);
  const y3 = cy + rIn * Math.sin(aEnd);
  const x4 = cx + rIn * Math.cos(aStart);
  const y4 = cy + rIn * Math.sin(aStart);
  return `M${x1.toFixed(3)},${y1.toFixed(3)} A${rOut},${rOut} 0 0,1 ${x2.toFixed(3)},${y2.toFixed(3)} L${x3.toFixed(3)},${y3.toFixed(3)} A${rIn},${rIn} 0 0,0 ${x4.toFixed(3)},${y4.toFixed(3)} Z`;
}

/** Update physical ivory ball position inside SVG coordinate space */
function setBallPosition(radius, localAngleDeg) {
  const ball = document.getElementById('rouletteIvoryBall');
  if (!ball) return;
  const rad = localAngleDeg * Math.PI / 180;
  const cx = 100 + radius * Math.cos(rad);
  const cy = 100 + radius * Math.sin(rad);
  ball.setAttribute('cx', cx.toFixed(2));
  ball.setAttribute('cy', cy.toFixed(2));
  ball.setAttribute('r', (radius < 70 ? 4.5 : 5.0).toFixed(1));
}

/** Clear or reset highlights */
function clearPocketHighlight() {
  const g = document.getElementById('wheelHighlight');
  if (g) g.innerHTML = '';
}

/** Generate authentic European roulette wheel face & stationary bowl overlay */
function initRouletteWheel() {
  const g = document.getElementById('wheelSegments');
  if (!g) return;

  const cx = 100, cy = 100;
  const rOuter = 96, rMid = 67, rInner = 44;

  const segColors = { 0: '#15803d' };
  rouletteRed.forEach(n => { segColors[n] = '#b91c1c'; });

  let segmentsHtml = '';

  for (let i = 0; i < TOTAL_POCKETS; i++) {
    const num = rouletteSequence[i];
    const startAngle = (i / TOTAL_POCKETS) * 2 * Math.PI - Math.PI / 2;
    const endAngle   = ((i + 1) / TOTAL_POCKETS) * 2 * Math.PI - Math.PI / 2;
    const midAngle   = (startAngle + endAngle) / 2;

    const color = segColors[num] || '#18181b';

    // 1. Number wedge (r: 67 -> 96)
    const wedgePath = createAnnularSector(cx, cy, rMid, rOuter, startAngle, endAngle);
    segmentsHtml += `<path d="${wedgePath}" fill="${color}" stroke="#d4af37" stroke-width="0.5"/>`;

    // 2. Number text (tr: 81.5)
    const tr = 81.5;
    const tx = cx + tr * Math.cos(midAngle);
    const ty = cy + tr * Math.sin(midAngle);
    const deg = (midAngle * 180 / Math.PI) + 90;
    segmentsHtml += `<text x="${tx.toFixed(2)}" y="${ty.toFixed(2)}" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-size="6.2" font-family="'Oswald', sans-serif" font-weight="700" transform="rotate(${deg.toFixed(2)},${tx.toFixed(2)},${ty.toFixed(2)})">${num}</text>`;

    // 3. Pocket well compartment (r: 44 -> 67)
    const pocketPath = createAnnularSector(cx, cy, rInner, rMid, startAngle, endAngle);
    segmentsHtml += `<path d="${pocketPath}" fill="#0e0704" stroke="#795708" stroke-width="0.3"/>`;

    // 4. Brass radial pocket fret divider
    const fx1 = cx + (rInner - 1) * Math.cos(startAngle);
    const fy1 = cy + (rInner - 1) * Math.sin(startAngle);
    const fx2 = cx + (rMid + 1) * Math.cos(startAngle);
    const fy2 = cy + (rMid + 1) * Math.sin(startAngle);
    segmentsHtml += `<line x1="${fx1.toFixed(2)}" y1="${fy1.toFixed(2)}" x2="${fx2.toFixed(2)}" y2="${fy2.toFixed(2)}" stroke="#d4af37" stroke-width="1.2" stroke-linecap="round"/>`;
  }

  // Concentric brass separator rings
  segmentsHtml += `
    <circle cx="100" cy="100" r="${rOuter}" fill="none" stroke="#d4af37" stroke-width="1"/>
    <circle cx="100" cy="100" r="${rMid}" fill="none" stroke="#d4af37" stroke-width="1.6"/>
    <circle cx="100" cy="100" r="${rInner}" fill="none" stroke="#d4af37" stroke-width="1.6"/>
  `;

  g.innerHTML = segmentsHtml;

  // Build stationary outer bowl overlay (8 brass diamond deflectors)
  const bowlOverlay = document.getElementById('rouletteBowlOverlay');
  if (bowlOverlay) {
    let deflectorsHtml = `
      <defs>
        <radialGradient id="brassDiamondGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#fef08a" />
          <stop offset="45%" stop-color="#d4af37" />
          <stop offset="90%" stop-color="#795708" />
        </radialGradient>
      </defs>
    `;

    // 8 brass diamond deflector studs at radius 132px
    const deflectorR = 132;
    for (let d = 0; d < 8; d++) {
      const angle = (d / 8) * 2 * Math.PI;
      const dx = 150 + deflectorR * Math.cos(angle);
      const dy = 150 + deflectorR * Math.sin(angle);
      const rot = (angle * 180 / Math.PI) + 90;

      deflectorsHtml += `
        <polygon points="${dx},${dy - 5} ${dx + 3},${dy} ${dx},${dy + 5} ${dx - 3},${dy}"
          fill="url(#brassDiamondGrad)" stroke="#422006" stroke-width="0.6"
          transform="rotate(${rot.toFixed(1)}, ${dx.toFixed(1)}, ${dy.toFixed(1)})"
          filter="drop-shadow(0 1px 2px rgba(0,0,0,0.8))"/>
      `;
    }

    // Outer bowl rim vignette
    deflectorsHtml += `
      <circle cx="150" cy="150" r="137" fill="none" stroke="rgba(0,0,0,0.5)" stroke-width="6"/>
      <circle cx="150" cy="150" r="139" fill="none" stroke="#795708" stroke-width="1"/>
    `;
    bowlOverlay.innerHTML = deflectorsHtml;
  }

  // Populate number grid modal
  const grid = document.getElementById('rouletteNumberGrid');
  if (grid) {
    grid.innerHTML = '';
    for (let n = 0; n <= 36; n++) {
      const colorClass = n === 0 ? 'g' : (rouletteRed.includes(n) ? 'r' : 'b');
      const btn = document.createElement('div');
      btn.className = 'rn-btn ' + colorClass;
      btn.textContent = n;
      btn.dataset.num = n;
      btn.onclick = () => {
        document.querySelectorAll('.rn-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const disp = document.getElementById('modalSelectedNum');
        if (disp) disp.textContent = n;
        if (window.sound) window.sound.playChip();
      };
      grid.appendChild(btn);
    }
  }

  // Initial ball position resting in pocket 0
  currentBallLocalAngle = -90 + 0.5 * POCKET_DEG;
  setBallPosition(SVG_RADIUS_POCKETS, currentBallLocalAngle);
}

/** Select bet type */
function selectRouletteBet(type) {
  const idMap = {
    red: 'rbRed', black: 'rbBlack', even: 'rbEven', odd: 'rbOdd',
    low: 'rbLow', high: 'rbHigh',
    dozen1: 'rbD1', dozen2: 'rbD2', dozen3: 'rbD3',
    number: 'rbNumber'
  };

  document.querySelectorAll('.roulette-bet-btn').forEach(b => b.classList.remove('selected'));
  if (idMap[type]) {
    const el = document.getElementById(idMap[type]);
    if (el) el.classList.add('selected');
  }

  selectedRouletteBet    = type;
  selectedRouletteNumber = null;
  document.querySelectorAll('.rn-btn').forEach(b => b.classList.remove('selected'));
  const disp = document.getElementById('modalSelectedNum');
  if (disp) disp.textContent = '—';
  const numLbl = document.getElementById('rbNumberLabel');
  if (numLbl) numLbl.textContent = '×36 (2.7%)';
  if (window.sound) window.sound.playChip();
}

/** Open number selection modal */
function openNumberModal() {
  selectRouletteBet('number');
  const modal = document.getElementById('numberModal');
  if (modal) modal.classList.add('open');
}

/** Close number modal */
function closeNumberModal() {
  const modal = document.getElementById('numberModal');
  if (modal) modal.classList.remove('open');
}

/** Confirm chosen number */
function confirmNumber() {
  const selected = document.querySelector('.rn-btn.selected');
  if (!selected) {
    showToast('Select a number!');
    return;
  }
  selectedRouletteNumber = parseInt(selected.dataset.num, 10);
  const label = selectedRouletteNumber === 0
    ? '🟢 Zero'
    : (rouletteRed.includes(selectedRouletteNumber) ? '🔴' : '⚫') + ' ' + selectedRouletteNumber;

  const btn = document.getElementById('rbNumber');
  if (btn && btn.childNodes[0]) {
    btn.childNodes[0].textContent = `🎯 ${label} `;
  }
  closeNumberModal();
}

/**
 * Authentic Physics-driven European Roulette Spin
 * - Random spin force & launch strength
 * - Ball orbits outer track counter-clockwise
 * - Gradually decelerates, spirals inward, bounces over pocket frets
 * - Ball settles into pocket W and rides smoothly with the rotating wheel
 * - Outcome determined purely by the pocket the ball stopped in
 */
function rouletteSpin() {
  if (rouletteSpinning) return;
  if (!validateBet('rl')) return;
  if (!selectedRouletteBet) {
    showToast('Select a bet type!');
    return;
  }
  if (selectedRouletteBet === 'number' && selectedRouletteNumber === null) {
    showToast('Select a number!');
    return;
  }

  const betAmount = bets.rl;
  changeBalance(-betAmount);
  clearBet('rl');
  rouletteSpinning = true;

  document.getElementById('rlSpinBtn').disabled = true;
  const resEl = document.getElementById('rouletteResult');
  if (resEl) {
    resEl.textContent = '...';
    resEl.style.color = 'var(--brass-light)';
  }
  clearPocketHighlight();

  // 1. Fair uniform outcome selection (0..36)
  const targetPocketIndex = Math.floor(Math.random() * TOTAL_POCKETS);
  const winningNumber = rouletteSequence[targetPocketIndex];
  const pocketAngleOnWheel = -90 + (targetPocketIndex + 0.5) * POCKET_DEG;

  // 2. Randomized throw force (variable launch speed & duration)
  const spinDuration = 4.8 + Math.random() * 1.5;                     // 4.8s to 6.3s total
  const dropDuration = spinDuration * (0.74 + Math.random() * 0.05); // 3.6s to 4.8s ball lands
  
  // Wheel spins clockwise (2.4 to 4.2 full revolutions)
  const wheelSpins = 2.4 + Math.random() * 1.8;
  const wheelDelta = wheelSpins * 360 + Math.random() * 360;

  // Ball spins counter-clockwise (5 to 8 full laps)
  const ballLaps = 5 + Math.floor(Math.random() * 4);

  const startWheelAngle     = currentWheelAngle;
  const startBallWorldAngle = currentWheelAngle + currentBallLocalAngle;

  // Wheel angle at the exact moment the ball settles into pocket
  const normDrop = dropDuration / spinDuration;
  const wheelEaseAtDrop = 1 - Math.pow(1 - normDrop, 3.4);
  const wheelAngleAtDrop = startWheelAngle + wheelDelta * wheelEaseAtDrop;

  // World target angle for pocket W at landing moment
  const targetWorldAngle = wheelAngleAtDrop + pocketAngleOnWheel;

  // Total angular travel of ball counter-clockwise
  let diff = (targetWorldAngle - startBallWorldAngle) % 360;
  if (diff > 0) diff -= 360;
  const ballDelta = diff - (ballLaps * 360);

  // Trigger procedural audio
  if (window.sound) {
    window.sound.playRouletteSpin(spinDuration, dropDuration);
  }

  const wheelEl = document.getElementById('rouletteWheel');
  const startTime = performance.now();
  let lastBounceTrigger = 0;

  function step(now) {
    const elapsedSec = (now - startTime) / 1000;

    // A. Wheel rotation (smooth deceleration)
    const pw = Math.min(1, elapsedSec / spinDuration);
    const ew = 1 - Math.pow(1 - pw, 3.4);
    currentWheelAngle = startWheelAngle + wheelDelta * ew;
    if (wheelEl) {
      wheelEl.style.transform = `rotate(${currentWheelAngle.toFixed(3)}deg)`;
    }

    // B. Ball trajectory
    if (elapsedSec < dropDuration) {
      const pb = elapsedSec / dropDuration;
      // Physical rolling deceleration curve
      const eb = 1 - Math.pow(1 - pb, 2.5);
      let ballWorldAngle = startBallWorldAngle + ballDelta * eb;
      let curRadius = SVG_RADIUS_OUTER_TRACK;

      if (pb < 0.52) {
        // Phase 1: High-speed rim orbit with subtle physical roll vibration
        curRadius = SVG_RADIUS_OUTER_TRACK + Math.sin(ballWorldAngle * 0.1) * 0.3;
      } else if (pb < 0.80) {
        // Phase 2: Centrifugal decay -> smooth spiral slide down the bowl
        const dropProg = (pb - 0.52) / 0.28;
        const dropEase = dropProg * dropProg * (3 - 2 * dropProg); // Smoothstep
        curRadius = SVG_RADIUS_OUTER_TRACK - (SVG_RADIUS_OUTER_TRACK - SVG_RADIUS_POCKETS) * dropEase;
      } else {
        // Phase 3: Deflector impacts & fret chatter
        const bounceProg = (pb - 0.80) / 0.20;
        // Radial bounce hops decaying to zero
        const hop = Math.abs(Math.sin(bounceProg * Math.PI * 4)) * (1 - bounceProg) * 6.5;
        curRadius = SVG_RADIUS_POCKETS + hop;

        // Angular fret jumping (jitter decaying smoothly to zero at landing)
        const angleJitter = Math.sin(bounceProg * Math.PI * 4) * (1 - bounceProg) * 6.0;
        ballWorldAngle += angleJitter;

        // Synchronized physical bounce sound
        if (bounceProg - lastBounceTrigger > 0.22 && Math.abs(Math.sin(bounceProg * Math.PI * 4)) > 0.8) {
          lastBounceTrigger = bounceProg;
          if (window.sound) window.sound.playRouletteBounce(1 - bounceProg);
        }
      }

      // Ball angle relative to the rotating wheel face
      currentBallLocalAngle = ballWorldAngle - currentWheelAngle;
      setBallPosition(curRadius, currentBallLocalAngle);
    } else {
      // Phase 4: Ball is nestled safely inside winning pocket W, riding with the wheel!
      currentBallLocalAngle = pocketAngleOnWheel;
      setBallPosition(SVG_RADIUS_POCKETS, currentBallLocalAngle);
    }

    // Check if whole spin is complete
    if (elapsedSec < spinDuration) {
      rouletteRafId = requestAnimationFrame(step);
    } else {
      // Settle at exact resting position
      currentWheelAngle = startWheelAngle + wheelDelta;
      currentBallLocalAngle = pocketAngleOnWheel;
      setBallPosition(SVG_RADIUS_POCKETS, currentBallLocalAngle);

      const result = winningNumber;
      const isRed = rouletteRed.includes(result);
      if (resEl) {
        resEl.textContent = result;
        resEl.style.color = result === 0
          ? '#4ade80'
          : (isRed ? '#f87171' : '#e2e8f0');
      }

      // Evaluate bets
      let won = false, multiplier = 0;
      const b = selectedRouletteBet;
      if      (b === 'red'    && isRed        && result !== 0)              { won = true; multiplier = 2; }
      else if (b === 'black'  && !isRed       && result !== 0)              { won = true; multiplier = 2; }
      else if (b === 'even'   && result !== 0 && result % 2 === 0)          { won = true; multiplier = 2; }
      else if (b === 'odd'    && result % 2 === 1)                          { won = true; multiplier = 2; }
      else if (b === 'low'    && result >= 1  && result <= 18)              { won = true; multiplier = 2; }
      else if (b === 'high'   && result >= 19 && result <= 36)              { won = true; multiplier = 2; }
      else if (b === 'dozen1' && result >= 1  && result <= 12)              { won = true; multiplier = 3; }
      else if (b === 'dozen2' && result >= 13 && result <= 24)              { won = true; multiplier = 3; }
      else if (b === 'dozen3' && result >= 25 && result <= 36)              { won = true; multiplier = 3; }
      else if (b === 'number' && result === selectedRouletteNumber)         { won = true; multiplier = 36; }

      if (won) {
        const win = betAmount * multiplier;
        changeBalance(win);
        recordResult(true, win - betAmount);
        showResult('rouletteResultMsg', 'win', `Number ${result}! You won $${win - betAmount}! 🎉`);
      } else {
        recordResult(false, betAmount);
        showResult('rouletteResultMsg', 'lose', `Number ${result}. You lost $${betAmount}`);
      }

      rouletteSpinning = false;
      document.getElementById('rlSpinBtn').disabled = false;
      checkBrokeBonus();
    }
  }

  rouletteRafId = requestAnimationFrame(step);
}
