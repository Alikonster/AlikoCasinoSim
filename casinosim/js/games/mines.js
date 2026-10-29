/**
 * Mines (Bombs) Game Logic
 */

const MINES_SIZE   = 25;
let minesBoard     = [];
let minesRevealed  = [];
let minesSafeCount = 0;
let minesActive    = false;
let minesBet       = 0;

/**
 * FIX: Calibrate multiplier to fair 96% RTP (was 80% with 1.00x on pick #1)
 */
function minesCalcMult(safe, mines) {
  let mult = 1;
  const total = MINES_SIZE;
  for (let i = 0; i < safe; i++) {
    mult *= (total - mines - i) / (total - i);
  }
  return parseFloat((0.96 / mult).toFixed(2));
}

function minesUpdateOdds() {
  if (!minesActive) {
    document.getElementById('minesMultiplier').textContent = '×1.00';
    document.getElementById('minesSafe').textContent = '0';
    document.getElementById('minesPotential').textContent = '$0';
    const nextCard = document.getElementById('minesNextMultCard');
    if (nextCard) nextCard.style.display = 'none';
  }
}

/** Build grid DOM */
function minesBuildGrid() {
  const grid = document.getElementById('minesGrid');
  if (!grid) return;
  grid.innerHTML = '';
  for (let i = 0; i < MINES_SIZE; i++) {
    const cell = document.createElement('div');
    cell.className = 'mine-cell';
    cell.id = 'mc' + i;
    cell.innerHTML = '<span class="cell-icon">❓</span>';
    cell.onclick = () => minesReveal(i);
    grid.appendChild(cell);
  }
}

/** Start new Mines round */
function minesStart() {
  if (!validateBet('mn')) return;

  minesBet = bets.mn;
  changeBalance(-minesBet);
  clearBet('mn');

  const mineCount = parseInt(document.getElementById('minesCount').value, 10);

  minesBoard     = Array(MINES_SIZE).fill(false);
  minesRevealed  = Array(MINES_SIZE).fill(false);
  minesSafeCount = 0;

  // Shuffle mine positions
  const positions = Array.from({ length: MINES_SIZE }, (_, i) => i);
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  positions.slice(0, mineCount).forEach(p => { minesBoard[p] = true; });

  minesActive = true;
  minesBuildGrid();

  const nextMult = minesCalcMult(1, mineCount);
  document.getElementById('minesMultiplier').textContent = '×1.00';
  document.getElementById('minesSafe').textContent = '0';
  document.getElementById('minesPotential').textContent = '$' + minesBet;
  document.getElementById('minesNextMult').textContent = '×' + nextMult.toFixed(2);
  document.getElementById('minesNextMultCard').style.display = '';
  document.getElementById('minesResult').classList.remove('show');

  document.getElementById('mnStartBtn').disabled   = true;
  document.getElementById('mnCashoutBtn').disabled = false;
  document.getElementById('minesCount').disabled   = true;
}

/** Click / Reveal cell */
function minesReveal(idx) {
  if (!minesActive) return;
  if (minesRevealed[idx]) return;

  minesRevealed[idx] = true;
  const cell = document.getElementById('mc' + idx);

  if (minesBoard[idx]) {
    // Mine hit!
    if (window.sound) window.sound.playBoom();
    cell.innerHTML = '<span class="cell-icon">💣</span>';
    cell.classList.add('revealed-mine', 'game-over-mine');
    minesActive = false;

    setTimeout(() => {
      minesBoard.forEach((isMine, i) => {
        if (isMine && !minesRevealed[i]) {
          const c = document.getElementById('mc' + i);
          c.innerHTML = '<span class="cell-icon">💣</span>';
          c.classList.add('revealed-mine');
        }
        const c = document.getElementById('mc' + i);
        c.style.cursor = 'default';
      });
    }, 350);

    recordResult(false, minesBet);
    showResult('minesResult', 'lose', `💥 Mine! You lost $${minesBet}`);
    document.getElementById('mnStartBtn').disabled   = false;
    document.getElementById('mnCashoutBtn').disabled = true;
    document.getElementById('minesCount').disabled   = false;
    document.getElementById('minesNextMultCard').style.display = 'none';
    checkBrokeBonus();
  } else {
    // Safe gem!
    if (window.sound) window.sound.playGem();
    minesSafeCount++;
    cell.innerHTML = '<span class="cell-icon">💎</span><span class="cell-text">SAFE</span>';
    cell.classList.add('revealed-safe');

    const mineCount = parseInt(document.getElementById('minesCount').value, 10);
    const mult = minesCalcMult(minesSafeCount, mineCount);
    const potential = Math.floor(minesBet * mult);

    const multEl = document.getElementById('minesMultiplier');
    multEl.textContent = '×' + mult.toFixed(2);
    multEl.classList.remove('bump');
    void multEl.offsetWidth;
    multEl.classList.add('bump');

    document.getElementById('minesSafe').textContent = minesSafeCount;
    document.getElementById('minesPotential').textContent = '$' + potential;

    const maxSafe = MINES_SIZE - mineCount;
    if (minesSafeCount >= maxSafe) {
      minesCashout();
    } else {
      const nextMult = minesCalcMult(minesSafeCount + 1, mineCount);
      document.getElementById('minesNextMult').textContent = '×' + nextMult.toFixed(2);
    }
  }
}

/** Cash out winnings */
function minesCashout() {
  if (!minesActive) return;
  minesActive = false;

  const mineCount = parseInt(document.getElementById('minesCount').value, 10);
  const mult      = minesCalcMult(minesSafeCount, mineCount);
  const win       = Math.floor(minesBet * mult);

  changeBalance(win);
  recordResult(true, win - minesBet);
  showResult('minesResult', 'win', `💰 Cashed out! ×${mult.toFixed(2)} · You won $${win - minesBet}! 🎉`);

  minesBoard.forEach((isMine, i) => {
    if (isMine) {
      const c = document.getElementById('mc' + i);
      c.innerHTML = '<span class="cell-icon">💣</span>';
      c.classList.add('revealed-mine');
    }
    const c = document.getElementById('mc' + i);
    c.style.cursor = 'default';
  });

  document.getElementById('mnStartBtn').disabled   = false;
  document.getElementById('mnCashoutBtn').disabled = true;
  document.getElementById('minesCount').disabled   = false;
  document.getElementById('minesNextMultCard').style.display = 'none';
  checkBrokeBonus();
}
