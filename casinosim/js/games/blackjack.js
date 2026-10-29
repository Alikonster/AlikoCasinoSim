/**
 * Blackjack Game Logic
 */

let bjDeck = [];
let bjPlayerHand = [];
let bjDealerHand = [];
let bjBetPlaced = 0;

/** Render hands for player and dealer */
function renderBjHands(hideDealer = false) {
  const pc = document.getElementById('playerCards');
  const dc = document.getElementById('dealerCards');
  if (!pc || !dc) return;

  pc.innerHTML = '';
  dc.innerHTML = '';

  bjPlayerHand.forEach(c => pc.appendChild(cardEl(c)));
  bjDealerHand.forEach((c, i) => dc.appendChild(cardEl(c, hideDealer && i === 1)));

  const pScore = handValue(bjPlayerHand);
  const dScore = hideDealer
    ? rankValues[bjDealerHand[0].rank]
    : handValue(bjDealerHand);

  document.getElementById('playerScore').textContent = pScore > 0 ? `(${pScore})` : '';
  document.getElementById('dealerScore').textContent = dScore > 0
    ? `(${hideDealer ? dScore + '+?' : dScore})`
    : '';
}

/** Deal cards */
function bjDeal() {
  if (!validateBet('bj')) return;

  bjBetPlaced = bets.bj;
  changeBalance(-bjBetPlaced);
  clearBet('bj');

  bjDeck       = newDeck();
  bjPlayerHand = [bjDeck.pop(), bjDeck.pop()];
  bjDealerHand = [bjDeck.pop(), bjDeck.pop()];

  if (window.sound) window.sound.playCard();
  renderBjHands(true);

  document.getElementById('bjDealBtn').disabled   = true;
  document.getElementById('bjHitBtn').disabled    = false;
  document.getElementById('bjStandBtn').disabled  = false;
  document.getElementById('bjDoubleBtn').disabled = false;

  // Natural Blackjack check
  if (handValue(bjPlayerHand) === 21) {
    setTimeout(() => bjStand(true), 600);
  }
}

/** Player hits (takes another card) */
function bjHit() {
  bjPlayerHand.push(bjDeck.pop());
  if (window.sound) window.sound.playCard();
  renderBjHands(true);

  document.getElementById('bjDoubleBtn').disabled = true;

  if (handValue(bjPlayerHand) >= 21) {
    bjStand();
  }
}

/** Double down */
function bjDouble() {
  if (bjBetPlaced > state.balance) {
    showToast('Not enough balance to double down!');
    return;
  }
  changeBalance(-bjBetPlaced);
  bjBetPlaced *= 2;
  bjPlayerHand.push(bjDeck.pop());
  if (window.sound) window.sound.playCard();
  renderBjHands(true);
  bjStand();
}

/** Stand and resolve round */
function bjStand(isBlackjack = false) {
  document.getElementById('bjHitBtn').disabled    = true;
  document.getElementById('bjStandBtn').disabled  = true;
  document.getElementById('bjDoubleBtn').disabled = true;

  const pv = handValue(bjPlayerHand);

  // FIX: Only draw dealer cards if the player has NOT busted!
  if (pv <= 21) {
    while (handValue(bjDealerHand) < 17) {
      bjDealerHand.push(bjDeck.pop());
    }
  }

  renderBjHands(false); // Reveal dealer hole card

  const dv = handValue(bjDealerHand);
  const naturalBJ = isBlackjack && bjPlayerHand.length === 2 && pv === 21;

  setTimeout(() => {
    let resultType, resultMsg, winAmount = 0;

    if (pv > 21) {
      resultType = 'lose';
      resultMsg  = `Bust (${pv})! You lost $${bjBetPlaced}`;
      recordResult(false, bjBetPlaced);
    } else if (dv > 21) {
      winAmount  = bjBetPlaced * 2;
      resultType = 'win';
      resultMsg  = `Dealer busts! You won $${winAmount - bjBetPlaced}! 🎉`;
      changeBalance(winAmount);
      recordResult(true, winAmount - bjBetPlaced);
    } else if (naturalBJ && dv !== 21) {
      winAmount  = Math.floor(bjBetPlaced * 2.5); // 3:2 payout
      resultType = 'win';
      resultMsg  = `BLACKJACK! You won $${winAmount - bjBetPlaced}! 🃏`;
      changeBalance(winAmount);
      recordResult(true, winAmount - bjBetPlaced);
    } else if (pv > dv) {
      winAmount  = bjBetPlaced * 2;
      resultType = 'win';
      resultMsg  = `You win! ${pv} vs ${dv} · +$${winAmount - bjBetPlaced} 🎉`;
      changeBalance(winAmount);
      recordResult(true, winAmount - bjBetPlaced);
    } else if (pv < dv) {
      resultType = 'lose';
      resultMsg  = `You lose! ${pv} vs ${dv} · -$${bjBetPlaced}`;
      recordResult(false, bjBetPlaced);
    } else {
      // Tie (Push)
      resultType = 'push';
      resultMsg  = `Push! ${pv} vs ${dv} · Returned $${bjBetPlaced}`;
      changeBalance(bjBetPlaced);
    }

    showResult('bjResult', resultType, resultMsg);
    document.getElementById('bjDealBtn').disabled = false;
    checkBrokeBonus();
  }, 400);
}
