/**
 * Coin Flip Game Logic
 */

let coinChoice   = null;
let coinFlipping = false;

/** Highlight selected side */
function selectCoin(choice) {
  coinChoice = choice;
  const h = document.getElementById('choiceHeads');
  const t = document.getElementById('choiceTails');
  if (h) h.classList.toggle('selected', choice === 'heads');
  if (t) t.classList.toggle('selected', choice === 'tails');
  if (window.sound) window.sound.playChip();
}

/** Flip coin */
function coinFlip() {
  if (coinFlipping) return;
  if (!coinChoice) {
    showToast('Choose Heads or Tails!');
    return;
  }
  if (!validateBet('cf')) return;

  const bet = bets.cf;
  changeBalance(-bet);
  clearBet('cf');
  coinFlipping = true;
  document.getElementById('cfFlipBtn').disabled = true;

  const coin      = document.getElementById('coin');
  const result    = Math.random() < 0.5 ? 'heads' : 'tails';
  const landAngle = result === 'heads' ? 0 : 180;

  coin.style.transition = 'none';
  coin.style.transform  = 'rotateY(0deg)';
  coin.getBoundingClientRect(); // force reflow
  coin.style.transition = 'transform 2s cubic-bezier(0.2, 0.8, 0.3, 1)';
  coin.style.transform  = `rotateY(${1440 + landAngle}deg)`;

  if (window.sound) window.sound.playPeg();

  setTimeout(() => {
    const won = result === coinChoice;
    const label = result === 'heads' ? '🦅 Heads' : '🌟 Tails';

    if (won) {
      const win = Math.floor(bet * 1.95);
      changeBalance(win);
      recordResult(true, win - bet);
      showResult('coinResult', 'win', `${label}! You won $${win - bet}! 🎉`);
    } else {
      recordResult(false, bet);
      showResult('coinResult', 'lose', `${label}! You lost $${bet}`);
    }

    coinFlipping = false;
    document.getElementById('cfFlipBtn').disabled = false;
    coin.style.transition = 'none';
    coin.style.transform  = `rotateY(${landAngle}deg)`;
    checkBrokeBonus();
  }, 2100);
}
