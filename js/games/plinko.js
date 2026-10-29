/**
 * Plinko Game Logic
 */

const PLINKO_ROWS = 12;
const PLINKO_COLS = PLINKO_ROWS + 1; // 13 buckets

// Calibrated fair multipliers
const PLINKO_MULTS = {
  low:    [1.8, 1.4, 1.2, 1.0, 0.9, 0.8, 0.6, 0.8, 0.9, 1.0, 1.2, 1.4, 1.8],
  medium: [6.0, 3.5, 1.8, 1.2, 0.8, 0.6, 0.4, 0.6, 0.8, 1.2, 1.8, 3.5, 6.0],
  high:   [35,  12,  4.0, 1.8, 0.8, 0.5, 0.3, 0.5, 0.8, 1.8, 4.0, 12,  35 ],
};

const PLINKO_COLORS = {
  low:    ['#2dc653','#3db55a','#4fc060','#68cc70','#82d880','#9ee09a','#e8883a','#9ee09a','#82d880','#68cc70','#4fc060','#3db55a','#2dc653'],
  medium: ['#d4a017','#e6b020','#c65050','#c08020','#808080','#606060','#404040','#606060','#808080','#c08020','#c65050','#e6b020','#d4a017'],
  high:   ['#e63946','#d95040','#c06030','#a07020','#707070','#505050','#303030','#505050','#707070','#a07020','#c06030','#d95040','#e63946'],
};

let plinkoRisk     = 'low';
let plinkoBalls    = [];
let plinkoDropping = false;

function plinkoCanvas() { return document.getElementById('plinkoCanvas'); }
function plinkoCtx()    { return plinkoCanvas().getContext('2d'); }

function plinkoLayout() {
  const W = plinkoCanvas().width;
  const H = plinkoCanvas().height;
  const padX = 36, padTop = 32, padBot = 54;
  const usableW = W - padX * 2;
  const usableH = H - padTop - padBot;
  const colSpacing = usableW / (PLINKO_ROWS);
  const rowSpacing = usableH / (PLINKO_ROWS);
  return { W, H, padX, padTop, padBot, usableW, usableH, colSpacing, rowSpacing };
}

function pegPos(row, col) {
  const l = plinkoLayout();
  const pegsInRow = row + 2;
  const rowWidth  = (pegsInRow - 1) * l.colSpacing;
  const startX    = l.padX + (l.usableW - rowWidth) / 2;
  const x = startX + col * l.colSpacing;
  const y = l.padTop + row * l.rowSpacing;
  return { x, y };
}

function bucketCentre(idx) {
  const l = plinkoLayout();
  const bucketW = l.usableW / PLINKO_COLS;
  const x = l.padX + bucketW * idx + bucketW / 2;
  const y = l.H - l.padBot / 2;
  return { x, y };
}

function plinkoDraw() {
  const canvas = plinkoCanvas();
  if (!canvas) return;
  const ctx = plinkoCtx();
  const l   = plinkoLayout();
  const mults  = PLINKO_MULTS[plinkoRisk];
  const colors = PLINKO_COLORS[plinkoRisk];

  ctx.clearRect(0, 0, l.W, l.H);

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, l.H);
  bg.addColorStop(0, '#0d0d18');
  bg.addColorStop(1, '#12121e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, l.W, l.H);

  // Pegs
  for (let r = 0; r < PLINKO_ROWS; r++) {
    const pegsInRow = r + 2;
    for (let c = 0; c < pegsInRow; c++) {
      const { x, y } = pegPos(r, c);
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(212,160,23,0.75)';
      ctx.shadowColor = 'rgba(212,160,23,0.5)';
      ctx.shadowBlur  = 4;
      ctx.fill();
      ctx.shadowBlur  = 0;
    }
  }

  // Buckets
  const bucketW = l.usableW / PLINKO_COLS;
  const bucketH = l.padBot - 6;
  const bucketY = l.H - bucketH - 3;
  for (let i = 0; i < PLINKO_COLS; i++) {
    const bx = l.padX + bucketW * i;
    const col = colors[i];

    ctx.fillStyle = col + '33';
    ctx.beginPath();
    ctx.roundRect(bx + 2, bucketY, bucketW - 4, bucketH, 4);
    ctx.fill();

    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(bx + 2, bucketY, bucketW - 4, bucketH, 4);
    ctx.stroke();

    ctx.fillStyle = col;
    ctx.font = `bold ${bucketW > 34 ? 11 : 9}px Oswald, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = mults[i] >= 10 ? mults[i] + '×' : '×' + mults[i];
    ctx.fillText(label, bx + bucketW / 2, bucketY + bucketH / 2);
  }

  // Active balls
  for (const ball of plinkoBalls) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, ball.r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#d4a017');
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(212,160,23,0.8)';
    ctx.shadowBlur  = 8;
    ctx.fill();
    ctx.shadowBlur  = 0;
  }
}

function plinkoSimPath() {
  let col = 0;
  for (let r = 0; r < PLINKO_ROWS; r++) {
    col += Math.random() < 0.5 ? 0 : 1;
  }
  return col;
}

function plinkoWaypoints(bucketIdx) {
  const l = plinkoLayout();
  const points = [];
  const rights = bucketIdx;
  const choices = [];

  for (let i = 0; i < PLINKO_ROWS; i++) {
    choices.push(i < rights ? 1 : 0);
  }
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  const topX = l.W / 2 + (Math.random() - 0.5) * 16;
  points.push({ x: topX, y: 6 });

  let col = 0;
  for (let r = 0; r < PLINKO_ROWS; r++) {
    const pegsInRow = r + 2;
    const rowWidth  = (pegsInRow - 1) * l.colSpacing;
    const startX    = l.padX + (l.usableW - rowWidth) / 2;
    const pegX = startX + col * l.colSpacing;
    const pegY = l.padTop + r * l.rowSpacing;

    points.push({ x: pegX + (choices[r] === 1 ? l.colSpacing * 0.45 : -l.colSpacing * 0.45) * 0.3, y: pegY - 4 });
    points.push({ x: pegX, y: pegY });
    col += choices[r];
  }

  const bc = bucketCentre(bucketIdx);
  points.push({ x: bc.x, y: bc.y });
  return points;
}

function plinkoAnimateBall(ball, waypoints, onDone) {
  let seg = 0;
  const SPEED = 3.6;
  const totalSegs = waypoints.length - 1;

  function step() {
    if (seg >= totalSegs) { onDone(); return; }
    const to   = waypoints[seg + 1];
    const dx   = to.x - ball.x;
    const dy   = to.y - ball.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < SPEED) {
      ball.x = to.x;
      ball.y = to.y;
      seg++;
      // Bounce sound on every peg
      if (seg % 2 === 0 && window.sound) {
        window.sound.playPeg();
      }
    } else {
      ball.x += (dx / dist) * SPEED;
      ball.y += (dy / dist) * SPEED;
    }
    plinkoDraw();
    ball._raf = requestAnimationFrame(step);
  }
  ball._raf = requestAnimationFrame(step);
}

function plinkoSetRisk(level) {
  plinkoRisk = level;
  ['low','medium','high'].forEach(r => {
    const el = document.getElementById('pr' + r.charAt(0).toUpperCase() + r.slice(1));
    if (el) el.classList.toggle('selected', r === level);
  });
  plinkoRenderMultRow();
  plinkoDraw();
  if (window.sound) window.sound.playChip();
}

function plinkoRenderMultRow() {
  const row = document.getElementById('plinkoMultiplierRow');
  if (!row) return;
  const mults  = PLINKO_MULTS[plinkoRisk];
  const colors = PLINKO_COLORS[plinkoRisk];
  row.innerHTML = '';

  mults.forEach((m, i) => {
    const box = document.createElement('div');
    box.className = 'plinko-mult-box';
    box.id = 'pmb' + i;
    box.style.color       = colors[i];
    box.style.borderColor = colors[i] + '55';
    box.style.background  = colors[i] + '18';
    box.textContent = m >= 10 ? m + '×' : '×' + m;
    row.appendChild(box);
  });
}

function plinkoDropBall() {
  if (plinkoDropping) return;
  if (!validateBet('pl')) return;

  const bet = bets.pl;
  changeBalance(-bet);
  clearBet('pl');

  plinkoDropping = true;
  document.getElementById('plDropBtn').disabled = true;
  document.getElementById('plinkoResult').classList.remove('show');

  const bucketIdx = plinkoSimPath();
  const waypoints = plinkoWaypoints(bucketIdx);

  const ball = { x: waypoints[0].x, y: waypoints[0].y, r: 6.5, _raf: null };
  plinkoBalls.push(ball);

  plinkoDraw();

  plinkoAnimateBall(ball, waypoints, () => {
    plinkoBalls = plinkoBalls.filter(b => b !== ball);

    const mult = PLINKO_MULTS[plinkoRisk][bucketIdx];
    const win  = Math.floor(bet * mult);

    const box = document.getElementById('pmb' + bucketIdx);
    if (box) {
      box.classList.add('hit');
      setTimeout(() => box.classList.remove('hit'), 500);
    }

    changeBalance(win);
    const profit = win - bet;
    if (profit >= 0) {
      recordResult(true, profit);
      showResult('plinkoResult', 'win', `×${mult} · You won $${profit}! 🎉`);
    } else {
      recordResult(false, Math.abs(profit));
      showResult('plinkoResult', 'lose', `×${mult} · You lost $${Math.abs(profit)}`);
    }

    document.getElementById('plinkoLastMult').textContent = '×' + mult;
    document.getElementById('plinkoLastWin').textContent  = (profit >= 0 ? '+' : '') + '$' + profit;

    plinkoDraw();
    plinkoDropping = false;
    document.getElementById('plDropBtn').disabled = false;
    checkBrokeBonus();
  });
}
