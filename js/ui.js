/**
 * UI Utilities, Navigation, Bets & Shared Card Tools
 */

// Bet registry for each game
const bets = {
  bj: 0, hol: 0, rl: 0, sl: 0, cf: 0, dc: 0, mn: 0, pl: 0
};

const betDisplayIds = {
  bj:  'bjBetDisplay',
  hol: 'holBetDisplay',
  rl:  'rlBetDisplay',
  sl:  'slBetDisplay',
  cf:  'cfBetDisplay',
  dc:  'dcBetDisplay',
  mn:  'mnBetDisplay',
  pl:  'plBetDisplay'
};

/** Show floating notification toast */
function showToast(msg, duration = 3000) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._hideTimeout);
  t._hideTimeout = setTimeout(() => t.classList.remove('show'), duration);
}

/** Show result message in the game's result container */
function showResult(id, type, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'result-msg ' + type + ' show';
  el.textContent = msg;
  clearTimeout(el._hideTimeout);
  el._hideTimeout = setTimeout(() => {
    el.className = 'result-msg';
  }, 3200);
}

/** Switch active game panel */
function showGame(name, btn) {
  document.querySelectorAll('.game-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const target = document.getElementById('game-' + name);
  if (target) target.classList.add('active');
  if (btn) btn.classList.add('active');

  // Trigger sound engine context init on first user click
  if (window.sound) {
    window.sound.init();
    window.sound.playChip();
  }
}

/** Toggle audio sound mute */
function toggleSound() {
  if (!window.sound) return;
  const isMuted = window.sound.toggleMute();
  const btn = document.getElementById('soundToggleBtn');
  if (btn) {
    btn.textContent = isMuted ? '🔇' : '🔊';
    btn.title = isMuted ? 'Unmute sound' : 'Mute sound';
  }
  showToast(isMuted ? 'Sound muted' : 'Sound enabled', 1500);
}

/** Update the bet input display */
function setBetDisplay(game, val) {
  const el = document.getElementById(betDisplayIds[game]);
  if (!el) return;
  if (el.tagName === 'INPUT') el.value = val || '';
  else el.textContent = val;
}

/** Add chips to current game bet */
function addBet(game, amount) {
  if (bets[game] + amount > state.balance) {
    showToast('Insufficient funds!');
    return;
  }
  bets[game] += amount;
  setBetDisplay(game, bets[game]);
  if (window.sound) window.sound.playChip();
}

/** Clear bet */
function clearBet(game) {
  bets[game] = 0;
  setBetDisplay(game, 0);
  if (window.sound) window.sound.playChip();
}

/** All-in bet with multi-chip cascade sound */
function allIn(game) {
  if (state.balance <= 0) {
    showToast('Balance is empty!');
    return;
  }
  bets[game] = state.balance;
  setBetDisplay(game, bets[game]);
  if (window.sound) window.sound.playChipStack();
}

/** Set bet directly via typing into the number input */
function setDirectBet(game, val) {
  const raw = parseInt(val, 10);
  if (isNaN(raw) || raw <= 0) {
    bets[game] = 0;
    return;
  }
  bets[game] = Math.min(raw, state.balance);
  const el = document.getElementById(betDisplayIds[game]);
  if (el && bets[game] < raw) el.value = bets[game];
}

/** Validate if the player has entered a valid bet */
function validateBet(game) {
  if (bets[game] <= 0) {
    showToast('Place a bet first!');
    return false;
  }
  if (bets[game] > state.balance) {
    showToast('Insufficient funds!');
    return false;
  }
  return true;
}

// ── Shared Card Utilities ──────────────────────────────────
const suits    = ['♠', '♥', '♦', '♣'];
const redSuits = ['♥', '♦'];
const ranks    = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

const rankValues = {
  'A':11, '2':2, '3':3, '4':4, '5':5, '6':6, '7':7,
  '8':8,  '9':9, '10':10, 'J':10, 'Q':10, 'K':10
};

const holRankValues = {
  'A':1, '2':2, '3':3, '4':4, '5':5, '6':6, '7':7, '8':8, '9':9,
  '10':10, 'J':11, 'Q':12, 'K':13
};

/** Create a freshly shuffled 52-card deck */
function newDeck() {
  const deck = [];
  for (const s of suits) {
    for (const r of ranks) {
      deck.push({ rank: r, suit: s });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
}

/** Create a card DOM element with authentic casino crosshatch back */
function cardEl(card, facedown = false) {
  const div = document.createElement('div');
  div.className = 'card' + (facedown ? ' back' : (redSuits.includes(card.suit) ? ' red' : ''));
  div.innerHTML = facedown
    ? '' // CSS .card.back renders authentic repeating crosshatch lattice
    : `<div class="card-rank">${card.rank}</div><div class="card-suit">${card.suit}</div>`;
  return div;
}

/** Compute best Blackjack score for a hand */
function handValue(cards) {
  let total = 0, aces = 0;
  for (const c of cards) {
    total += rankValues[c.rank];
    if (c.rank === 'A') aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}
