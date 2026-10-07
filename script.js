const WINNING_SCORE = 4;
let history = [];
let gameOver = false;
let freeMarks = false;
let wakeLock = null;
let keepScreenAwake = false;

function toggleFreeMarks() {
  freeMarks = !freeMarks;
  const button = document.getElementById('freeMarksToggle');
  button.textContent = freeMarks ? 'Free Marks On' : 'Free Marks';
  button.classList.toggle('active', freeMarks);
}

function updateFullscreenButton() {
  const button = document.getElementById('fullscreenToggle');
  const active = document.fullscreenElement || document.body.classList.contains('pseudo-fullscreen');
  button.textContent = active ? 'Exit Fullscreen' : 'Fullscreen';
  button.classList.toggle('active', active);
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => {
      // iOS Safari (and non-secure contexts) reject the Fullscreen API —
      // fall back to a CSS-only immersive mode.
      document.body.classList.toggle('pseudo-fullscreen');
      updateFullscreenButton();
    });
  } else {
    document.body.classList.toggle('pseudo-fullscreen');
    updateFullscreenButton();
  }
}

document.addEventListener('fullscreenchange', updateFullscreenButton);

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

const MARK_LABELS = { xtreme: 'X3', over: 'O2', burst: 'B2', spin: 'S1' };

function renderMarks(player) {
  const strip = document.getElementById('marks' + player);
  strip.innerHTML = '';

  history
    .filter((entry) => entry.player === player)
    .forEach((entry) => {
      const mark = document.createElement('span');
      mark.className = 'mark ' + entry.type;
      mark.textContent = MARK_LABELS[entry.type];
      strip.appendChild(mark);
    });
}

function renderAllMarks() {
  renderMarks('A');
  renderMarks('B');
}

function getFinishType(btn) {
  const types = ['xtreme', 'over', 'burst', 'spin'];
  return types.find((type) => btn.classList.contains(type)) || 'spin';
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
  history.push({ player, points, type: getFinishType(btn), prevScore: currentScore });
  addLog(playerName + ': +' + points + ' (' + getFinishName(btn) + ')');
  renderMarks(player);

  if (!freeMarks && newScore >= WINNING_SCORE) {
    gameOver = true;
    showWinner(playerName, player);
  }
}

function undo() {
  if (history.length === 0 || gameOver) return;

  const last = history.pop();
  setScore(last.player, last.prevScore);
  renderAllMarks();

  const log = document.getElementById('log');
  if (log.firstChild) log.removeChild(log.firstChild);
}

function resetMatch() {
  setScore('A', 0);
  setScore('B', 0);
  history = [];
  gameOver = false;
  document.getElementById('log').innerHTML = '';
  renderAllMarks();
}

function renderFinalMarks() {
  const container = document.getElementById('finalMarks');
  container.innerHTML = '';

  ['A', 'B'].forEach((player) => {
    const row = document.createElement('div');
    row.className = 'row';

    const label = document.createElement('span');
    label.className = 'player-label';
    label.textContent = document.getElementById('name' + player).value || 'Player ' + player;
    row.appendChild(label);

    const marks = history.filter((entry) => entry.player === player);
    if (marks.length === 0) {
      const empty = document.createElement('span');
      empty.className = 'empty';
      empty.textContent = 'no marks';
      row.appendChild(empty);
    } else {
      marks.forEach((entry) => {
        const mark = document.createElement('span');
        mark.className = 'mark ' + entry.type;
        mark.textContent = MARK_LABELS[entry.type];
        row.appendChild(mark);
      });
    }

    container.appendChild(row);
  });
}

function showWinner(name, player) {
  document.getElementById('winnerText').textContent = name + ' WINS!';
  document.getElementById('finalScore').textContent = getScore('A') + ' — ' + getScore('B');
  renderFinalMarks();
  document.getElementById('overlay').hidden = false;
}

function newMatch() {
  document.getElementById('overlay').hidden = true;
  resetMatch();
}