/**
 * State Management & Persistence
 */

const STARTING_BALANCE = 1000;          // chips for new player
const BONUS_AMOUNT     = 10000;         // 4-hour free bonus
const BONUS_INTERVAL   = 4 * 60 * 60 * 1000; // 4 hours in ms (fixed from 15 min mismatch)

let state = {
  balance:   STARTING_BALANCE,
  lastBonus: Date.now() - BONUS_INTERVAL, // claimable immediately on first load
  stats: { games: 0, wins: 0, losses: 0, best: 0, totalWon: 0 }
};

/** Load saved state from localStorage */
function loadState() {
  try {
    const saved = localStorage.getItem('grCasino');
    if (saved) {
      const s = JSON.parse(saved);
      if (typeof s.balance === 'number' && !isNaN(s.balance)) {
        state.balance = Math.max(0, Math.floor(s.balance));
      }
      if (typeof s.lastBonus === 'number' && !isNaN(s.lastBonus)) {
        state.lastBonus = s.lastBonus;
      }
      if (s.stats && typeof s.stats === 'object') {
        state.stats = Object.assign({ games: 0, wins: 0, losses: 0, best: 0, totalWon: 0 }, s.stats);
      }
    }
  } catch (e) {
    console.warn('Failed to parse saved casino state, using defaults.', e);
  }
}

/** Save state to localStorage */
function saveState() {
  try {
    localStorage.setItem('grCasino', JSON.stringify(state));
  } catch (e) {
    console.warn('Could not persist state to localStorage', e);
  }
}

/** Change player balance, refresh header, and persist */
function changeBalance(delta) {
  state.balance = Math.max(0, state.balance + delta);
  updateBalanceDisplay();
  saveState();
}

/** Update the balance UI in the header */
function updateBalanceDisplay() {
  const el = document.getElementById('balanceDisplay');
  if (el) {
    el.textContent = state.balance.toLocaleString('en-US');
  }
}

/** Record game round into lifetime statistics */
function recordResult(win, amount) {
  state.stats.games++;
  if (win) {
    state.stats.wins++;
    if (amount > state.stats.best) state.stats.best = amount;
    state.stats.totalWon += amount;
    if (window.sound) window.sound.playWin();
  } else {
    state.stats.losses++;
    if (window.sound) window.sound.playLose();
  }
  updateStats();
  saveState();
}

/** Update the footer statistics bar */
function updateStats() {
  const g = document.getElementById('statGames');
  const w = document.getElementById('statWins');
  const l = document.getElementById('statLosses');
  const b = document.getElementById('statBest');
  const t = document.getElementById('statTotal');

  if (g) g.textContent = state.stats.games;
  if (w) w.textContent = state.stats.wins;
  if (l) l.textContent = state.stats.losses;
  if (b) b.textContent = '$' + state.stats.best.toLocaleString('en-US');
  if (t) t.textContent = '$' + state.stats.totalWon.toLocaleString('en-US');
}

/** Zero-pad helper */
function pad(n) {
  return String(n).padStart(2, '0');
}

/** Update bonus countdown timer every second */
function updateBonusTimer() {
  const remaining = BONUS_INTERVAL - (Date.now() - state.lastBonus);
  const timerEl    = document.getElementById('bonusTimer');
  const timerLabel = document.getElementById('timerLabel');
  const timerValue = document.getElementById('timerValue');

  if (!timerEl || !timerLabel || !timerValue) return;

  if (remaining <= 0) {
    timerEl.classList.add('ready');
    timerLabel.textContent = '🎁 BONUS READY!';
    timerValue.textContent = 'Click to Claim';
  } else {
    timerEl.classList.remove('ready');
    timerLabel.textContent = 'Bonus in';
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    const s = Math.floor((remaining % 60000) / 1000);
    timerValue.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
}

/** Claim the 4-hour bonus */
function claimBonus() {
  if (Date.now() - state.lastBonus < BONUS_INTERVAL) return;
  state.lastBonus = Date.now();
  changeBalance(BONUS_AMOUNT);
  if (window.sound) window.sound.playWin();
  showToast(`🎁 Claimed bonus +$${BONUS_AMOUNT.toLocaleString('en-US')}! Good luck!`);
  saveState();
}

/** Check if player is bankrupt and grant emergency backup funds */
function checkBrokeBonus() {
  if (state.balance <= 0) {
    const emergency = 250;
    changeBalance(emergency);
    if (window.sound) window.sound.playWin();
    showToast(`💸 Bankrupt! Here is $${emergency} to keep playing! 🎁`, 4000);
  }
}
