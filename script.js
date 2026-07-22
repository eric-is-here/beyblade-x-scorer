const WINNING_SCORE = 4;
let history = [];
let gameOver = false;
let wakeLock = null;
let keepScreenAwake = false;

async function toggleScreenAwake() {
  const button = document.getElementById('screenToggle');

  if (!('wakeLock' in navigator)) {
    button.textContent = 'Screen Lock Unsupported';
    button.disabled = true;
    return;
  }

  try {
    if (wakeLock) {
      keepScreenAwake = false;
      await wakeLock.release();
      return;
    }

    keepScreenAwake = true;
    wakeLock = await navigator.wakeLock.request('screen');
    button.textContent = 'Screen Stays On';
    button.classList.add('active');

    wakeLock.addEventListener('release', () => {
      wakeLock = null;
      button.textContent = 'Keep Screen On';
      button.classList.remove('active');
    });
  } catch (error) {
    button.textContent = 'Unable to Keep Screen On';
  }
}

document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible' && keepScreenAwake && !wakeLock) {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
    } catch (error) {
      // The browser may deny wake locks until the page is active again.
    }
  }
});

function getScoreEl(player) {
  return document.getElementById('score' + player);
}

function getScore(player) {
  return parseInt(getScoreEl(player).textContent);
}

function setScore(player, value) {
  const el = getScoreEl(player);
  el.textContent = value;
  el.classList.remove('score-pop');
  void el.offsetWidth;
  el.classList.add('score-pop');
}

function getFinishName(button) {
  return button.childNodes[0].textContent.trim();
}

function addLog(text) {
  const log = document.getElementById('log');
  const entry = document.createElement('div');
  entry.textContent = text;
  log.prepend(entry);
}

function addPoint(player, points, btn) {
  if (gameOver) return;

  btn.classList.remove('button-flash');
  void btn.offsetWidth;
  btn.classList.add('button-flash');

  const currentScore = getScore(player);
  const newScore = currentScore + points;
  setScore(player, newScore);

  const playerName = document.getElementById('name' + player).value || 'Player ' + player;
  history.push({ player, points, prevScore: currentScore });
  addLog(playerName + ': +' + points + ' (' + getFinishName(btn) + ')');

  if (newScore >= WINNING_SCORE) {
    gameOver = true;
    showWinner(playerName, player);
  }
}

function undo() {
  if (history.length === 0 || gameOver) return;

  const last = history.pop();
  setScore(last.player, last.prevScore);

  const log = document.getElementById('log');
  if (log.firstChild) log.removeChild(log.firstChild);
}

function resetMatch() {
  setScore('A', 0);
  setScore('B', 0);
  history = [];
  gameOver = false;
  document.getElementById('log').innerHTML = '';
}

function showWinner(name, player) {
  const opponent = player === 'A' ? 'B' : 'A';

  document.getElementById('winnerText').textContent = name + ' WINS!';
  document.getElementById('finalScore').textContent = getScore(player) + ' — ' + getScore(opponent);
  document.getElementById('overlay').hidden = false;
}

function newMatch() {
  document.getElementById('overlay').hidden = true;
  resetMatch();
}