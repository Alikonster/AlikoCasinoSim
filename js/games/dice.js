/**
 * Casino Craps & Dice Game Logic (with Calibrated Odds & Realistic Acoustics)
 */

let diceTarget          = null;
let diceMultiplierValue = 0;
let diceRolling         = false;

/** Select target outcome and store multiplier */
function selectDiceTarget(el, target, mult) {
  document.querySelectorAll('.target-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  diceTarget          = target;
  diceMultiplierValue = parseFloat(mult.replace('×', ''));
  if (window.sound) window.sound.playChip();
}

/** Render authentic white inlaid pips on ruby red translucent die */
function renderDie(elId, value) {
  const die = document.getElementById(elId);
  if (!die) return;
  die.className = `die die-${value}`;

  const dotSets = {
    1: [[32,32]],
    2: [[16,16],[48,48]],
    3: [[16,16],[32,32],[48,48]],
    4: [[16,16],[48,16],[16,48],[48,48]],
    5: [[16,16],[48,16],[32,32],[16,48],[48,48]],
    6: [[16,16],[48,16],[16,32],[48,32],[16,48],[48,48]]
  };

  const dots = (dotSets[value] || []).map(([cx, cy]) =>
    `<circle cx="${cx}" cy="${cy}" r="6.5" fill="#ffffff" style="filter: drop-shadow(0 1px 1px rgba(0,0,0,0.7));"/>`
  ).join('');

  die.innerHTML = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">${dots}</svg>`;
}

/** Roll dice with authentic craps acoustic physical tumble */
function diceRoll() {
  if (diceRolling) return;
  if (!diceTarget) {
    showToast('Select a target!');
    return;
  }
  if (!validateBet('dc')) return;

  const bet = bets.dc;
  changeBalance(-bet);
  clearBet('dc');
  diceRolling = true;
  document.getElementById('dcRollBtn').disabled = true;

  const sumEl = document.getElementById('diceSum');
  if (sumEl) sumEl.textContent = '';

  const die1El = document.getElementById('die1');
  const die2El = document.getElementById('die2');
  die1El.classList.add('rolling');
  die2El.classList.add('rolling');

  // Authentic felt & craps dice acoustic rattle
  if (window.sound) window.sound.playDiceRoll();

  let ticks = 0;
  const shuffleInterval = setInterval(() => {
    renderDie('die1', Math.ceil(Math.random() * 6));
    renderDie('die2', Math.ceil(Math.random() * 6));
    if (++ticks > 8) clearInterval(shuffleInterval);
  }, 80);

  setTimeout(() => {
    clearInterval(shuffleInterval);

    const d1  = Math.ceil(Math.random() * 6);
    const d2  = Math.ceil(Math.random() * 6);
    const sum = d1 + d2;

    renderDie('die1', d1);
    renderDie('die2', d2);
    die1El.classList.remove('rolling');
    die2El.classList.remove('rolling');

    if (sumEl) sumEl.textContent = `${d1} + ${d2} = ${sum}`;

    let won = false;
    if      (diceTarget === 'low'   && sum >= 2  && sum <= 6)               won = true;
    else if (diceTarget === 'high'  && sum >= 8  && sum <= 12)              won = true;
    else if (diceTarget === 'seven' && sum === 7)                           won = true;
    else if (!isNaN(parseInt(diceTarget, 10)) && sum === parseInt(diceTarget, 10)) won = true;

    if (won) {
      const win = Math.floor(bet * diceMultiplierValue);
      changeBalance(win);
      recordResult(true, win - bet);
      showResult('diceResult', 'win', `Sum ${sum}! You won $${win - bet}! 🎉`);
    } else {
      recordResult(false, bet);
      showResult('diceResult', 'lose', `Sum ${sum}. You lost $${bet}`);
    }

    diceRolling = false;
    document.getElementById('dcRollBtn').disabled = false;
    checkBrokeBonus();
  }, 900);
}
