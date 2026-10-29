/**
 * Vintage Gamble Machine / Slot Machine Game Logic
 */

const slotSymbols = ['🍒','🍋','🍊','🍇','🍉','🔔','⭐','7️⃣','💎'];
const slotWeights = [20,  18,  15,  12,  10,   8,   6,   4,   2 ];
const slotTotal   = slotWeights.reduce((a, b) => a + b, 0);

const slotPayouts = {
  '💎💎💎': 50, '7️⃣7️⃣7️⃣': 25, '⭐⭐⭐': 15, '🔔🔔🔔': 10,
  '🍇🍇🍇':  8, '🍉🍉🍉':  6, '🍊🍊🍊':  4, '🍋🍋🍋':  3, '🍒🍒🍒': 2
};

let slotSpinning = false;

/** Pick one slot symbol using weighted random selection */
function weightedSlot() {
  let r = Math.random() * slotTotal;
  for (let i = 0; i < slotWeights.length; i++) {
    r -= slotWeights[i];
    if (r <= 0) return slotSymbols[i];
  }
  return slotSymbols[0];
}

/** Spin mechanical reels */
function slotSpin() {
  if (slotSpinning) return;
  if (!validateBet('sl')) return;

  const bet = bets.sl;
  changeBalance(-bet);
  clearBet('sl');
  slotSpinning = true;
  document.getElementById('slSpinBtn').disabled = true;

  const reels     = [0, 1, 2].map(i => document.getElementById('reel' + i));
  const symEls    = [0, 1, 2].map(i => document.getElementById('sym' + i));
  const finalSyms = [];

  reels.forEach(r => r.classList.add('reel-spinning'));

  // Realistic mechanical reel spin ratchet sound
  if (window.sound) window.sound.playSlotReelSpin();

  const stopDelays = [850, 1300, 1750];
  stopDelays.forEach((delay, i) => {
    setTimeout(() => {
      const sym = weightedSlot();
      finalSyms[i] = sym;
      symEls[i].textContent = sym;
      reels[i].classList.remove('reel-spinning');

      // Heavy solenoid reel stop "THUD" for each reel
      if (window.sound) window.sound.playSlotReelStop();

      // Settle round after last reel stops
      if (i === 2) {
        setTimeout(() => {
          const key = finalSyms.join('');
          let multiplier = 0;

          if (slotPayouts[key]) {
            multiplier = slotPayouts[key];
          } else if (finalSyms.filter(s => s === '💎').length === 2) {
            multiplier = 5; // 2 diamonds consolation
          } else if (finalSyms.includes('💎')) {
            multiplier = 1.5; // 1 diamond consolation
          }

          if (multiplier > 0) {
            const win = Math.floor(bet * multiplier);
            changeBalance(win);
            recordResult(true, win - bet);

            // Classic electromechanical Bally bell & coin tray cascade!
            if (window.sound) {
              window.sound.playSlotWinBell(multiplier >= 10 ? 5 : 3);
              setTimeout(() => window.sound.playCoinDrop(multiplier >= 10 ? 10 : 5), 250);
            }

            showResult('slotsResult', 'win', `${key} · ×${multiplier} · You won $${win - bet}! 🎉`);
          } else {
            recordResult(false, bet);
            showResult('slotsResult', 'lose', `${key} · No luck! You lost $${bet}`);
          }

          slotSpinning = false;
          document.getElementById('slSpinBtn').disabled = false;
          checkBrokeBonus();
        }, 350);
      }
    }, delay);
  });
}
