/**
 * Higher or Lower Game Logic
 */

let holDeck = [];
let holCurrentCard = null;
let holRevealedCard = null;
let holStreak = 0;
let holPot = 0;
let holPlaying = false;
let holWaitingDecision = false;

/** Start a round */
function holStart() {
  if (!validateBet('hol')) return;

  holPot = bets.hol;
  changeBalance(-holPot);
  clearBet('hol');

  holStreak = 0;
  holDeck = newDeck();
  holCurrentCard = holDeck.pop();
  holRevealedCard = null;
  holPlaying = true;
  holWaitingDecision = false;

  if (window.sound) window.sound.playCard();
  renderHolCard();

  document.getElementById('holStartBtn').style.display = 'none';
  document.getElementById('holContinueBtn').style.display = 'inline-block';
  document.getElementById('holContinueBtn').disabled = true;

  document.getElementById('holHigherBtn').disabled  = false;
  document.getElementById('holEqualBtn').disabled   = false;
  document.getElementById('holLowerBtn').disabled   = false;
  document.getElementById('holCashoutBtn').disabled = false;
  updateHolInfo();
}

/** Render current card */
function renderHolCard() {
  const isRed = redSuits.includes(holCurrentCard.suit);
  const cur   = document.getElementById('holCurrentCard');
  if (!cur) return;

  cur.className = 'card' + (isRed ? ' red' : '');
  cur.style.cssText = 'width:110px;height:158px;font-size:0';
  document.getElementById('holCRank').textContent = holCurrentCard.rank;
  document.getElementById('holCSuit').textContent = holCurrentCard.suit;

  const nxt = document.getElementById('holNextCard');
  nxt.innerHTML = '<div style="font-size:52px">🂠</div>';
  nxt.className = 'card back';
  nxt.style.cssText = 'width:110px;height:158px';
}

/** Multiplier for current streak */
function getHolMultiplier() {
  return holStreak === 0 ? 1.0 : Math.pow(1.5, holStreak);
}

/** Update streak & multiplier display */
function updateHolInfo() {
  const mult = getHolMultiplier();
  const streakEl = document.getElementById('holStreak');
  const multEl   = document.getElementById('holMultiplier');
  if (streakEl) streakEl.textContent = holStreak;
  if (multEl) multEl.textContent = '×' + mult.toFixed(2);
}

/** Player submits guess */
function holGuess(guess) {
  if (!holPlaying || holWaitingDecision) return;

  if (holDeck.length === 0) {
    holDeck = newDeck();
  }

  const nextCard = holDeck.pop();
  holRevealedCard = nextCard;

  const cv = holRankValues[holCurrentCard.rank];
  const nv = holRankValues[nextCard.rank];

  // Reveal next card
  const nextEl = document.getElementById('holNextCard');
  const isRed  = redSuits.includes(nextCard.suit);
  nextEl.className  = 'card' + (isRed ? ' red' : '');
  nextEl.style.cssText = 'width:110px;height:158px;font-size:0';
  nextEl.innerHTML  = `<div class="card-rank">${nextCard.rank}</div><div class="card-suit">${nextCard.suit}</div>`;

  if (window.sound) window.sound.playCard();

  let correct = false;
  if      (guess === 'higher') correct = nv > cv;
  else if (guess === 'lower')  correct = nv < cv;
  else if (guess === 'equal')  correct = nv === cv;

  document.getElementById('holHigherBtn').disabled = true;
  document.getElementById('holEqualBtn').disabled  = true;
  document.getElementById('holLowerBtn').disabled  = true;

  setTimeout(() => {
    if (correct) {
      holStreak++;
      const mult = getHolMultiplier();
      const winPotential = Math.floor(holPot * mult);

      showResult('holResult', 'win', `Correct! Cash out $${winPotential} or continue?`);
      updateHolInfo();

      holWaitingDecision = true;
      document.getElementById('holContinueBtn').disabled = false;
    } else {
      holPlaying = false;
      holStreak  = 0;
      holWaitingDecision = false;

      document.getElementById('holCashoutBtn').disabled = true;
      document.getElementById('holContinueBtn').style.display = 'none';
      document.getElementById('holStartBtn').style.display = 'inline-block';
      document.getElementById('holStartBtn').disabled = false;

      showResult('holResult', 'lose', `Incorrect! The card was ${nextCard.rank}${nextCard.suit}. Lost $${holPot}`);
      recordResult(false, holPot);
      holPot = 0;
      updateHolInfo();

      checkBrokeBonus();
    }
  }, 350);
}

/**
 * FIX: Continue playing by making the revealed next card the new current card
 */
function holContinue() {
  if (!holWaitingDecision) return;

  holWaitingDecision = false;
  document.getElementById('holContinueBtn').disabled = true;

  // Make the revealed next card the current card!
  if (holRevealedCard) {
    holCurrentCard = holRevealedCard;
  } else if (holDeck.length > 0) {
    holCurrentCard = holDeck.pop();
  } else {
    holDeck = newDeck();
    holCurrentCard = holDeck.pop();
  }

  if (window.sound) window.sound.playCard();
  renderHolCard();

  document.getElementById('holHigherBtn').disabled = false;
  document.getElementById('holEqualBtn').disabled  = false;
  document.getElementById('holLowerBtn').disabled  = false;
}

/** Cash out */
function holCashout() {
  if (!holPlaying) return;

  if (holStreak === 0) {
    changeBalance(holPot);
  } else {
    const mult     = getHolMultiplier();
    const winnings = Math.floor(holPot * mult);
    changeBalance(winnings);
    recordResult(true, winnings - holPot);
    showResult('holResult', 'win', `Cashed out $${winnings}! (×${mult.toFixed(2)}) 💰`);
  }

  holPot = 0;
  holPlaying = false;
  holStreak = 0;
  holWaitingDecision = false;

  document.getElementById('holHigherBtn').disabled  = true;
  document.getElementById('holEqualBtn').disabled   = true;
  document.getElementById('holLowerBtn').disabled   = true;
  document.getElementById('holCashoutBtn').disabled = true;

  document.getElementById('holContinueBtn').style.display = 'none';
  document.getElementById('holStartBtn').style.display = 'inline-block';
  document.getElementById('holStartBtn').disabled   = false;

  updateHolInfo();
}
