let currentPlayer = "X";
let gameActive = true;
let gamePaused = false;
let timer;
let timeLeft = 10;
let boardTheme = "classic";
let soundOn = true;
let mode = "PvP";
let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];

const winningCombos = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function startGame() {
  // const form = document.getElementById("gameForm");
  // if (!form.checkValidity()) {
  //   form.reportValidity();
  //   return;
  // }
  currentPlayer = "X";
  gameActive = true;
  mode = document.getElementById("gameMode").value;
  boardTheme = document.getElementById("themeSelector").value;

  document.body.classList.remove("theme-classic", "theme-neon", "theme-wood", "theme-clear");
  document.body.classList.add(`theme-${boardTheme}`);

  showScreen("game-section");
  resetGame();
  updateLeaderboard();
}

function createBoard() {
  const board = document.getElementById("board");
  board.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.index = i;
    cell.addEventListener("click", handleClick);
    board.appendChild(cell);
  }
}

function handleClick(e) {
  if (!gameActive || gamePaused) return;
  const cell = e.target;
  const index = parseInt(cell.dataset.index);
  if (cell.textContent !== "") return;

  playSound("click");
  const emoji = getEmoji(currentPlayer);
  cell.textContent = emoji;
  cell.dataset.player = currentPlayer;

  if (checkWin(currentPlayer)) {
    gameActive = false;
    playSound("win");
    triggerConfetti();
    updateStatus(`${getName(currentPlayer)} wins! 🎉`);
    updateLeaderboardData(getName(currentPlayer));
    showScreen("game-over");
    return;
  }

  if (isDraw()) {
    gameActive = false;
    playSound("draw");
    updateStatus("It's a draw! 🤝");
    showScreen("game-over");
    return;
  }

  currentPlayer = currentPlayer === "X" ? "O" : "X";
  updateStatus(`${getName(currentPlayer)}'s Turn`);
  restartTimer();

  if ((mode === "Easy" || mode === "Hard") && currentPlayer === "O") {
    setTimeout(aiMove, 500);
  }
}

function aiMove() {
  let bestIndex;
  const empty = [...document.querySelectorAll(".cell")].filter(c => c.textContent === "");
  if (empty.length === 0) return;

  if (mode === "Easy") {
    bestIndex = empty[Math.floor(Math.random() * empty.length)].dataset.index;
  } else {
    bestIndex = getBestMove();
  }

  const cell = document.querySelector(`.cell[data-index='${bestIndex}']`);
  handleClick({ target: cell });
}

function getBestMove() {
  const cells = [...document.querySelectorAll(".cell")];
  const board = cells.map(c => c.dataset.player || "");
  return minimax(board, "O").index;
}

function minimax(board, player) {
  const avail = board.map((v, i) => v === "" ? i : null).filter(v => v !== null);
  if (checkMiniWin(board, "X")) return { score: -10 };
  if (checkMiniWin(board, "O")) return { score: 10 };
  if (avail.length === 0) return { score: 0 };

  const moves = [];
  for (let i of avail) {
    const move = { index: i };
    board[i] = player;
    move.score = (player === "O" ? minimax(board, "X") : minimax(board, "O")).score;
    board[i] = "";
    moves.push(move);
  }

  return moves.reduce((best, m) =>
    (player === "O" && m.score > best.score) || (player === "X" && m.score < best.score)
      ? m : best, { score: player === "O" ? -Infinity : Infinity });
}

function checkMiniWin(board, player) {
  return winningCombos.some(combo => combo.every(i => board[i] === player));
}

function checkWin(player) {
  const cells = document.querySelectorAll(".cell");
  return winningCombos.some(combo => combo.every(i => cells[i].dataset.player === player));
}

function isDraw() {
  return [...document.querySelectorAll(".cell")].every(c => c.textContent !== "");
}

function updateStatus(msg) {
  document.getElementById("status").textContent = msg;
}

function getName(player) {
  return document.getElementById(`player${player}Name`).value || player;
}

function getEmoji(player) {
  return document.getElementById(`player${player}Emoji`).value || (player === "X" ? "😀" : "🤖");
}

function resetGame() {
  gameActive = true;
  createBoard();
  updateStatus(`${getName("X")}'s Turn`);
  restartTimer();
  clearConfetti();
}

function goHome() {
  showScreen("intro-screen");
  clearTimeout(timer);
}

function pauseGame() {
  gamePaused = true;
  clearTimeout(timer);
  showScreen("pause-menu");
}

function resumeGame() {
  gamePaused = false;
  showScreen("game-section");
  updateStatus(`${getName(currentPlayer)}'s Turn`);
  restartTimer();
}

function restartTimer() {
  clearTimeout(timer);
  timeLeft = 10;
  document.getElementById("timer").textContent = `⏱️ ${timeLeft}`;
  countdown();
}

function countdown() {
  if (!gameActive || gamePaused) return;
  document.getElementById("timer").textContent = `⏱️ ${timeLeft}`;
  if (timeLeft <= 0) {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    updateStatus(`${getName(currentPlayer)}'s Turn (Auto Skipped)`);
    restartTimer();
    if ((mode === "Easy" || mode === "Hard") && currentPlayer === "O") {
      setTimeout(aiMove, 500);
    }
    return;
  }
  timeLeft--;
  timer = setTimeout(countdown, 1000);
}

function playSound(type) {
  if (!soundOn) return;
  const sounds = {
    click: "clickSound",
    win: "winSound",
    draw: "drawSound"
  };
  const audio = document.getElementById(sounds[type]);
  if (audio) {
    audio.currentTime = 0;
    audio.play();
  }
}

function openSettings() {
  document.getElementById("settings-panel").style.display = "block";
}

function closeSettings() {
  document.getElementById("settings-panel").style.display = "none";
}

function resetStats() {
  if (confirm("Reset all data?")) {
    localStorage.clear();
    leaderboard = [];
    updateLeaderboard();
    goHome();
  }
}

document.getElementById("soundToggle").addEventListener("change", e => {
  soundOn = e.target.checked;
});

document.getElementById("themeToggle").addEventListener("change", e => {
  document.body.classList.toggle("dark", e.target.checked);
});

function updateLeaderboardData(winner) {
  if (!winner) return;
  leaderboard.push({ name: winner, score: 1, time: Date.now() });
  leaderboard = leaderboard.reduce((acc, item) => {
    const existing = acc.find(i => i.name === item.name);
    if (existing) existing.score += item.score;
    else acc.push(item);
    return acc;
  }, []);
  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 5);
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
  updateLeaderboard();
}

function updateLeaderboard() {
  const list = document.getElementById("leaderboardList");
  const screenList = document.getElementById("leaderboardScreenList");
  [list, screenList].forEach(l => {
    if (!l) return;
    l.innerHTML = "";
    leaderboard.forEach(p => {
      const li = document.createElement("li");
      li.textContent = `${p.name}: ${p.score}`;
      l.appendChild(li);
    });
  });
}

// Confetti
const confettiCanvas = document.getElementById("confetti-canvas");
const ctx = confettiCanvas.getContext("2d");
let confetti = [];

function resizeCanvas() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function triggerConfetti() {
  confetti = Array.from({ length: 150 }, () => ({
    x: Math.random() * confettiCanvas.width,
    y: Math.random() * confettiCanvas.height - confettiCanvas.height,
    r: Math.random() * 6 + 2,
    d: Math.random() * 50 + 50,
    color: `hsl(${Math.random() * 360}, 100%, 50%)`,
    tilt: Math.random() * 10 - 10
  }));
  animateConfetti();
}

function animateConfetti() {
  if (!confetti.length) return;
  requestAnimationFrame(animateConfetti);
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confetti.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    p.y += p.d * 0.01;
    p.tilt += 0.1;
    p.x += Math.sin(p.tilt);
  });
  confetti = confetti.filter(p => p.y < confettiCanvas.height);
}

function clearConfetti() {
  confetti = [];
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
}

// Splash → Intro
window.addEventListener("load", () => {
  const splash = document.getElementById("splash-screen");
  const intro = document.getElementById("intro-screen");
  const video = document.getElementById("splash-video");

  function goToIntroScreen() {
    splash.style.opacity = 0;
    setTimeout(() => {
      splash.style.display = "none";
      intro.style.display = "block";
    }, 1000);
  }

  if (video) video.addEventListener("ended", goToIntroScreen);
  setTimeout(goToIntroScreen, 7000);
});

// ✅ Screen switching utility
function showScreen(id) {
  const screens = [
    "intro-screen",
    "game-section",
    "settings-panel",
    "game-over",
    "pause-menu",
    "how-to-play",
    "leaderboard-screen"
  ];
  screens.forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = s === id ? "block" : "none";
  });
}
