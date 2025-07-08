let currentPlayer = "X";
let gameActive = true;
let gamePaused = false;
let timer;
let timeLeft = 10;
let boardTheme = "classic";
let soundOn = true;
let mode = "PvP";
let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || { PvP: [], PvC: [] };
if (!leaderboard.PvP || !leaderboard.PvC) {
  leaderboard = { PvP: [], PvC: [] };
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
}//ensures leaderboard is always an object with PvP and PvC array

const winningCombos = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function startGame() {
  event.preventDefault(); // Prevent form submission  
  totalRounds = parseInt(document.getElementById("rounds").value) || 1;
  roundsPlayed = 0;
  const form = document.getElementById("gameForm");
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  localStorage.removeItem("gameState");

  try {
    // Clear any existing game state to start fresh
    localStorage.removeItem("gameState");

    // Reset game variables
    currentPlayer = "X";
    gameActive = true;
    gamePaused = false;
    mode = document.getElementById("gameMode").value;
    boardTheme = document.getElementById("themeSelector").value;

    // Update theme
    document.body.classList.remove("theme-classic", "theme-neon", "theme-wood", "theme-clear");
    document.body.classList.add(`theme-${boardTheme}`);

     // No round increment here, moved to game end
  const category = mode === "PvP" ? "PvP" : "PvC";
  // Only update leaderboard structure if not already present
  const player1 = getName("X");
  let player1Entry = leaderboard[category].find(p => p.name === player1);
  if (!player1Entry) {
    leaderboard[category].push({ name: player1, wins: 0, rounds: 0 });
  }
  if (mode === "PvP") {
    const player2 = getName("O");
    let player2Entry = leaderboard[category].find(p => p.name === player2);
    if (!player2Entry) {
      leaderboard[category].push({ name: player2, wins: 0, rounds: 0 });
    }
  }
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));

    // Show game screen and reset game
    showScreen("game-section");
    resetGame();
    updateLeaderboard();
  } catch (error) {
    console.error("Error starting game:", error);
    updateStatus("Failed to start game. Please try again.");
  }
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
  // Animate cell on move
  cell.classList.add('cell-animate');
  setTimeout(() => cell.classList.remove('cell-animate'), 350);
  saveGameState();

if (checkWin(currentPlayer)) {
  gameActive = false;
  localStorage.removeItem("gameState");
  playSound("win");
  triggerConfetti();
  let winnerName;
  if (mode === "PvC" && currentPlayer === "O") {
    winnerName = getName("O");
  } else {
    winnerName = getName(currentPlayer);
  }
  updateStatus(`${winnerName} wins! 🎉`);
  // Save round for both players (winner and loser)
  const category = mode === "PvP" ? "PvP" : "PvC";
  const boardState = [...document.querySelectorAll('.cell')].map(cell => ({
    text: cell.textContent,
    player: cell.dataset.player || ""
  }));
  const roundData = {
    board: boardState,
    winner: winnerName,
    mode: mode,
    date: new Date().toISOString()
  };
  // Winner
  let winnerEntry = leaderboard[category].find(p => p.name === winnerName);
  if (!winnerEntry) {
    winnerEntry = { name: winnerName, avatar: getEmoji(currentPlayer), wins: 0, draws: 0, rounds: 0, roundHistory: [] };
    leaderboard[category].push(winnerEntry);
  }
  winnerEntry.wins += 1;
  winnerEntry.rounds += 1;
  if (!winnerEntry.roundHistory) winnerEntry.roundHistory = [];
  winnerEntry.roundHistory.push(roundData);
  // Loser
  let loserName;
  if (mode === "PvP") {
    loserName = getName(currentPlayer === "X" ? "O" : "X");
    let loserEntry = leaderboard[category].find(p => p.name === loserName);
    if (!loserEntry) {
      loserEntry = { name: loserName, avatar: getEmoji(currentPlayer === "X" ? "O" : "X"), wins: 0, draws: 0, rounds: 0, roundHistory: [] };
      leaderboard[category].push(loserEntry);
    }
    loserEntry.rounds += 1;
    if (!loserEntry.roundHistory) loserEntry.roundHistory = [];
    loserEntry.roundHistory.push(roundData);
  } else if (mode === "PvC") {
    // Only human's rounds increment if AI wins (AI not tracked in leaderboard)
    const humanName = getName("X");
    let humanEntry = leaderboard[category].find(p => p.name === humanName);
    if (humanEntry) {
      humanEntry.rounds += 1;
      if (!humanEntry.roundHistory) humanEntry.roundHistory = [];
      humanEntry.roundHistory.push(roundData);
    }
  }
  leaderboard[category].sort((a, b) => b.wins - a.wins);
  leaderboard[category] = leaderboard[category].slice(0, 5);
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
  updateLeaderboard();
  roundsPlayed++;
  if (roundsPlayed >= totalRounds) {
    document.getElementById("game-over-popup").style.display = "flex";
    triggerConfetti();
  } else {
    setTimeout(() => {
      resetGame();
    }, 1200);
  }
  triggerConfetti();
  return;
}

if (isDraw()) {
  gameActive = false;
  localStorage.removeItem("gameState");
  playSound("draw");
  updateStatus("It's a draw! 🤝");
  const category = mode === "PvP" ? "PvP" : "PvC";
  const playerXName = getName("X");
  const playerOName = getName("O");
  const playerXEmoji = getEmoji("X");
  const playerOEmoji = getEmoji("O");
  let totalRounds = 1;
  let roundsPlayed = 0;
  const boardState = [...document.querySelectorAll('.cell')].map(cell => ({
    text: cell.textContent,
    player: cell.dataset.player || ""
  }));
  const roundData = {
    board: boardState,
    winner: "Draw",
    mode: mode,
    date: new Date().toISOString()
  };
  // Update both players
  const players = [
    { name: playerXName, avatar: playerXEmoji },
    { name: playerOName, avatar: playerOEmoji }
  ];
  players.forEach(playerData => {
    let playerEntry = leaderboard[category].find(p => p.name === playerData.name);
    if (!playerEntry) {
      playerEntry = { name: playerData.name, avatar: playerData.avatar, wins: 0, draws: 0, rounds: 0, roundHistory: [] };
      leaderboard[category].push(playerEntry);
    }
    playerEntry.rounds += 1;
    playerEntry.draws += 1;
    if (!playerEntry.roundHistory) playerEntry.roundHistory = [];
    playerEntry.roundHistory.push(roundData);
  });
  leaderboard[category].sort((a, b) => b.wins - a.wins);
  leaderboard[category] = leaderboard[category].slice(0, 5);
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
  updateLeaderboard();
  roundsPlayed++;
  if (roundsPlayed >= totalRounds) {
    document.getElementById("game-over-popup").style.display = "flex";
    triggerConfetti();
  } else {
    setTimeout(() => {
      resetGame();
    }, 1200);
  }
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
  if (cell) {
    currentPlayer = "O"; // Set AI as current player
    handleClick({ target: cell }); // Let handleClick handle everything (win, round count, leaderboard)
  }
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
  const winCombo = winningCombos.find(combo => combo.every(i => cells[i].dataset.player === player));
  if (winCombo) {
    // Animate winning line
    winCombo.forEach(i => {
      cells[i].classList.add('win-animate');
      setTimeout(() => cells[i].classList.remove('win-animate'), 1200);
    });
    // Show animated line overlay
    showWinLine(winCombo);
    setTimeout(hideWinLine, 1300);
    return true;
  }
  return false;
}

// Draw animated win line overlay
function showWinLine(combo) {
  let overlay = document.getElementById('win-line-overlay');
  if (!overlay) {
    overlay = document.createElement('canvas');
    overlay.id = 'win-line-overlay';
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '100';
    document.getElementById('game-section').appendChild(overlay);
  }
  const board = document.getElementById('board');
  const rect = board.getBoundingClientRect();
  overlay.width = rect.width;
  overlay.height = rect.height;
  overlay.style.width = rect.width + 'px';
  overlay.style.height = rect.height + 'px';
  overlay.style.display = 'block';
  const ctx = overlay.getContext('2d');
  ctx.clearRect(0, 0, overlay.width, overlay.height);
  // Get cell centers
  const cells = board.querySelectorAll('.cell');
  const getCellCenter = idx => {
    const cellRect = cells[idx].getBoundingClientRect();
    return {
      x: cellRect.left - rect.left + cellRect.width / 2,
      y: cellRect.top - rect.top + cellRect.height / 2
    };
  };
  const start = getCellCenter(combo[0]);
  const end = getCellCenter(combo[2]);
  // Animate line
  let progress = 0;
  function animateLine() {
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    ctx.strokeStyle = '#ff0';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(start.x + (end.x - start.x) * progress, start.y + (end.y - start.y) * progress);
    ctx.stroke();
    if (progress < 1) {
      progress += 0.07;
      requestAnimationFrame(animateLine);
    }
  }
  animateLine();
}

function hideWinLine() {
  const overlay = document.getElementById('win-line-overlay');
  if (overlay) overlay.style.display = 'none';
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
 document.getElementById("game-over-popup").style.display = "none";
 document.getElementById("pause-popup").style.display = "none";
 document.getElementById("leaderboard-popup").classList.remove("active");
 gameActive = true;
 gamePaused = false;
currentPlayer = "X";
  createBoard();
  updateStatus(`${getName("X")}'s Turn`);
  restartTimer();
  clearConfetti();
  saveGameState();
}

function goHome() {
  showScreen("intro-screen");
  clearTimeout(timer);
}

function pauseGame() {
  console.log("⏸ Pausing game...");
  gamePaused = true;
  clearTimeout(timer); 
  saveGameState();     
  document.getElementById("pause-popup").style.display = "flex";
}

function resumeGame() {
  console.log("▶ Resuming game...");
  gamePaused = false;
  document.getElementById("pause-popup").style.display = "none";
  countdown(); // Resume countdown from where it left
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
  if (timeLeft <= 3 && timeLeft > 0) animateTimerWarning();
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

// Animated timer (pulse and color change)
function animateTimerWarning() {
  const timerEl = document.getElementById('timer');
  timerEl.classList.add('timer-warning');
  setTimeout(() => timerEl.classList.remove('timer-warning'), 900);
}

// Animated board theme transition
function animateThemeChange(newTheme) {
  const board = document.getElementById('board');
  board.classList.add('theme-animate');
  setTimeout(() => {
    board.classList.remove('theme-animate');
    document.body.className = '';
    document.body.classList.add(`theme-${newTheme}`);
  }, 500);
}

// Video background for game-section
function setVideoBackground(url) {
  let videoBg = document.getElementById('video-bg');
  if (!videoBg) {
    videoBg = document.createElement('video');
    videoBg.id = 'video-bg';
    videoBg.autoplay = true;
    videoBg.loop = true;
    videoBg.muted = true;
    videoBg.style.position = 'absolute';
    videoBg.style.top = '0';
    videoBg.style.left = '0';
    videoBg.style.width = '100%';
    videoBg.style.height = '100%';
    videoBg.style.objectFit = 'cover';
    videoBg.style.zIndex = '-1';
    document.getElementById('game-section').prepend(videoBg);
  }
  videoBg.src = url;
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
    leaderboard = { PvP: [], PvC: [] };
    localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
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
  const category = mode === "PvP" ? "PvP" : "PvC";
  const playerEntry = leaderboard[category].find(p => p.name === winner);
  // Save the board state for this round
  const boardState = [...document.querySelectorAll('.cell')].map(cell => ({
    text: cell.textContent,
    player: cell.dataset.player || ""
  }));
  const roundData = {
    board: boardState,
    winner: winner,
    mode: mode,
    date: new Date().toISOString()
  };
  if (playerEntry) {
    playerEntry.wins += 1;
    if (!playerEntry.roundHistory) playerEntry.roundHistory = [];
    playerEntry.roundHistory.push(roundData);
  } else {
    leaderboard[category].push({ name: winner, wins: 1, draws: 0, rounds: 0, roundHistory: [roundData] });
  }
  leaderboard[category].sort((a, b) => b.wins - a.wins);
  leaderboard[category] = leaderboard[category].slice(0, 5);
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
}


let leaderboardUpdatePending = false;
let lastUpdateTime = 0;
function updateLeaderboard() {
  const now = Date.now();
  if (leaderboardUpdatePending || (now - lastUpdateTime < 1000)) return;
  leaderboardUpdatePending = true;
  lastUpdateTime = now;

  const list = document.getElementById("leaderboardList"); // Primary target
  if (!list) {
    console.error("Leaderboard list element (#leaderboardList) not found!");
    return;
  }
  list.innerHTML = "";

  // PvP Leaderboard Table
  if (leaderboard.PvP.length > 0) {
    const pvpTable = document.createElement("table");
    pvpTable.style.width = "100%";
    pvpTable.style.borderCollapse = "collapse";
    pvpTable.style.marginBottom = "20px";

    const pvpHeader = document.createElement("caption");
    pvpHeader.textContent = "PvP Leaderboard";
    pvpHeader.style.fontWeight = "bold";
    pvpHeader.style.marginBottom = "10px";
    pvpTable.appendChild(pvpHeader);

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    ["Name", "Wins", "Draws", "Rounds", "View Rounds"].forEach(headerText => {
      const th = document.createElement("th");
      th.textContent = headerText;
      th.style.border = "1px solid black";
      th.style.padding = "5px";
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    pvpTable.appendChild(thead);

    const tbody = document.createElement("tbody");
    leaderboard.PvP.forEach((p, idx) => {
      const row = document.createElement("tr");
      ["name", "wins", "draws", "rounds"].forEach(prop => {
        const td = document.createElement("td");
        td.textContent = p[prop] || 0;
        td.style.border = "1px solid black";
        td.style.padding = "5px";
        row.appendChild(td);
      });
      // Add view rounds button
      const viewTd = document.createElement("td");
      const viewBtn = document.createElement("button");
      viewBtn.textContent = "View Rounds";
      viewBtn.onclick = function() { showPlayerRounds('PvP', idx); };
      viewTd.appendChild(viewBtn);
      row.appendChild(viewTd);
      tbody.appendChild(row);
    });
    pvpTable.appendChild(tbody);
    list.appendChild(pvpTable);
  }

  // PvC Leaderboard Table
  if (leaderboard.PvC.length > 0) {
    const pvcTable = document.createElement("table");
    pvcTable.style.width = "100%";
    pvcTable.style.borderCollapse = "collapse";
    pvcTable.style.marginBottom = "20px";

    const pvcHeader = document.createElement("caption");
    pvcHeader.textContent = "PvC Leaderboard";
    pvcHeader.style.fontWeight = "bold";
    pvcHeader.style.marginBottom = "10px";
    pvcTable.appendChild(pvcHeader);

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    ["Name", "Wins", "Draws", "Rounds", "View Rounds"].forEach(headerText => {
      const th = document.createElement("th");
      th.textContent = headerText;
      th.style.border = "1px solid black";
      th.style.padding = "5px";
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    pvcTable.appendChild(thead);

    const tbody = document.createElement("tbody");
    leaderboard.PvC.forEach((p, idx) => {
      if (mode !== "PvP" && (p.name.toLowerCase().includes("ai") || p.name.toLowerCase() === "computer")) {
        return; // Skip AI entry
      }
      const row = document.createElement("tr");
      ["name", "wins", "draws", "rounds"].forEach(prop => {
        const td = document.createElement("td");
        td.textContent = p[prop] || 0;
        td.style.border = "1px solid black";
        td.style.padding = "5px";
        row.appendChild(td);
      });
      // Add view rounds button
      const viewTd = document.createElement("td");
      const viewBtn = document.createElement("button");
      viewBtn.textContent = "View Rounds";
      viewBtn.onclick = function() { showPlayerRounds('PvC', idx); };
      viewTd.appendChild(viewBtn);
      row.appendChild(viewTd);
      tbody.appendChild(row);
    });
    pvcTable.appendChild(tbody);
    list.appendChild(pvcTable);
  }
}

// Show a modal with a list of rounds for a player, each with a replay button
function showPlayerRounds(category, playerIdx) {
  const player = leaderboard[category][playerIdx];
  if (!player || (!player.roundHistory && !player.wins)) {
    alert('No rounds to show for this player.');
    return;
  }
  // Defensive: try to find by name if roundHistory is missing
  let foundPlayer = player;
  if (!player.roundHistory || !Array.isArray(player.roundHistory)) {
    foundPlayer = leaderboard[category].find(p => p.name === player.name && Array.isArray(p.roundHistory) && p.roundHistory.length > 0) || player;
  }
  // If still no roundHistory, allow showing a message
  if (!foundPlayer.roundHistory || foundPlayer.roundHistory.length === 0) {
    alert('No rounds to show for this player.');
    return;
  }
  // Create modal
  let modal = document.getElementById('rounds-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'rounds-modal';
    document.body.appendChild(modal);
  }
  modal.innerHTML = '';
  const content = document.createElement('div');
  content.style.background = '#fff';
  content.style.padding = '20px';
  content.style.borderRadius = '8px';
  content.style.maxWidth = '90vw';
  content.style.maxHeight = '80vh';
  content.style.overflowY = 'auto';
  content.style.boxShadow = '0 2px 10px #0008';
  const title = document.createElement('h3');
  title.textContent = `Rounds for ${foundPlayer.name}`;
  content.appendChild(title);
  foundPlayer.roundHistory.forEach((round, i) => {
    const roundDiv = document.createElement('div');
    roundDiv.style.marginBottom = '10px';
    roundDiv.style.border = '1px solid #ccc';
    roundDiv.style.padding = '10px';
    roundDiv.style.borderRadius = '5px';
    roundDiv.innerHTML = `<b>Round ${i+1}</b> - Winner: ${round.winner} - Mode: ${round.mode} - Date: ${new Date(round.date).toLocaleString()}`;
    const replayBtn = document.createElement('button');
    replayBtn.textContent = 'Replay';
    replayBtn.style.marginLeft = '10px';
    replayBtn.onclick = function() { replayRound(round); };
    roundDiv.appendChild(replayBtn);
    content.appendChild(roundDiv);
  });
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.style.marginTop = '10px';
  closeBtn.onclick = function() { modal.style.display = 'none'; };
  content.appendChild(closeBtn);
  modal.appendChild(content);
  modal.style.display = 'flex';
}

// Replay a round by showing the board state
function replayRound(round) {
  //remove the popups 
  document.getElementById("game-over-popup").style.display = "none";
  document.getElementById("leaderboard-popup").classList.remove("active");
  document.getElementById("rounds-modal").style.display = "none";

  // Show the game section
  showScreen('game-section');
  createBoard();
  const cells = document.querySelectorAll('.cell');
  // Clear the board for animation
  cells.forEach(cell => {
    cell.textContent = '';
    cell.removeAttribute('data-player');
  });

  // --- Replay Controls ---
  let replaySpeed = 600; // ms per move
  let isPaused = false;
  let step = 0;
  let timeoutId = null;

  // Build move order (same as before)
  let boardArr = round.board.map(cell => cell.player || '');
  let moveCount = boardArr.filter(x => x).length;
  let tempBoard = Array(9).fill('');
  let moveOrder = [];
  for (let m = 0; m < moveCount; m++) {
    let player = (m % 2 === 0) ? 'X' : 'O';
    for (let i = 0; i < 9; i++) {
      if (!tempBoard[i] && boardArr[i] === player) {
        moveOrder.push({ idx: i, player: player, text: round.board[i].text });
        tempBoard[i] = player;
        break;
      }
    }

  }

  // --- Controls UI ---
  let controls = document.getElementById('replay-controls');
  if (!controls) {
    controls = document.createElement('div');
    controls.id = 'replay-controls';
    controls.style.display = 'flex';
    controls.style.justifyContent = 'center';
    controls.style.alignItems = 'center';
    controls.style.gap = '10px';
    controls.style.margin = '10px auto';
    controls.style.background = '#f8f8f8';
    controls.style.borderRadius = '8px';
    controls.style.padding = '8px 16px';
    controls.style.width = 'fit-content';
    controls.style.boxShadow = '0 2px 8px #0002';
    document.getElementById('game-section').prepend(controls);
  }
  controls.innerHTML = '';
  // Play/Pause button
  const playPauseBtn = document.createElement('button');
  playPauseBtn.textContent = 'Pause';
  playPauseBtn.onclick = function() {
    isPaused = !isPaused;
    playPauseBtn.textContent = isPaused ? 'Play' : 'Pause';
    if (!isPaused) animateStep();
    else if (timeoutId) clearTimeout(timeoutId);
  };
  controls.appendChild(playPauseBtn);
  // Speed control
  const speedLabel = document.createElement('span');
  speedLabel.textContent = 'Speed:';
  controls.appendChild(speedLabel);
  const speedInput = document.createElement('input');
  speedInput.type = 'range';
  speedInput.min = 200;
  speedInput.max = 1500;
  speedInput.value = replaySpeed;
  speedInput.step = 100;
  speedInput.style.width = '100px';
  speedInput.oninput = function() {
    replaySpeed = parseInt(speedInput.value);
    speedValue.textContent = replaySpeed + 'ms';
  };
  controls.appendChild(speedInput);
  const speedValue = document.createElement('span');
  speedValue.textContent = replaySpeed + 'ms';
  controls.appendChild(speedValue);
  // Restart button
  const restartBtn = document.createElement('button');
  restartBtn.textContent = 'Restart';
  restartBtn.onclick = function() {
    if (timeoutId) clearTimeout(timeoutId);
    step = 0;
    cells.forEach(cell => {
      cell.textContent = '';
      cell.removeAttribute('data-player');
    });
    isPaused = false;
    playPauseBtn.textContent = 'Pause';
    animateStep();
  };
  controls.appendChild(restartBtn);
  // Exit button
  const exitBtn = document.createElement('button');
  exitBtn.textContent = 'Exit Replay';
  exitBtn.onclick = function() {
    if (timeoutId) clearTimeout(timeoutId);
    controls.remove();
    // Optionally, return to leaderboard or home
    updateStatus('Replay exited.');
    resetGame();
  };
  controls.appendChild(exitBtn);

  // --- Animation logic ---
  function animateStep() {
    if (isPaused) return;
    if (step > 0) {
      const prevMove = moveOrder[step - 1];
      if (cells[prevMove.idx]) {
        cells[prevMove.idx].textContent = prevMove.text;
        cells[prevMove.idx].dataset.player = prevMove.player;
      }
    }
    if (step < moveOrder.length) {
      const move = moveOrder[step];
      if (cells[move.idx]) {
        cells[move.idx].classList.add('replay-highlight');
        timeoutId = setTimeout(() => {
          cells[move.idx].classList.remove('replay-highlight');
          step++;
          animateStep();
        }, replaySpeed);
      } else {
        step++;
        animateStep();
      }
    } else {
      // All moves done, fill the rest of the board (in case of draw)
      round.board.forEach((cellData, i) => {
        if (cells[i]) {
          cells[i].textContent = cellData.text || '';
          if (cellData.player) cells[i].dataset.player = cellData.player;
        }
      });
      gameActive = false;
      gamePaused = true;
      clearTimeout(timer);
      updateStatus(`Replay: Winner was ${round.winner}`);
      leaderboardUpdatePending = false;
    }
  }
  animateStep();
}

//the function for show more and less
function toggleTutorial(event) {
  event.preventDefault(); // Prevent default link behavior
  const tutorial = document.querySelector('#how-to-play .tutorial');
  const showMore = document.querySelector('#how-to-play .show-more');
  if (tutorial.style.display === 'none') {
    tutorial.style.display = 'block';
    showMore.textContent = 'Show Less';
  } else {
    tutorial.style.display = 'none';
    showMore.textContent = 'Show More';
  }
}

function openTutorial(event) {
  event.preventDefault(); // Prevent default link behavior
  const youtubeLink = document.getElementById('youtube-link');
  // Replace with your YouTube tutorial URL
  youtubeLink.href = 'https://youtu.be/iEW-d02l9ew?feature=shared'; // URL of the YouTube tutorial
  // Open the link in a new tab
  window.open(youtubeLink.href, '_blank'); // Open in new tab
}

// Ensure leaderboard button works on setup page
document.addEventListener('DOMContentLoaded', function() {
  var leaderboardBtn = document.querySelector("#gameForm button[onclick*='showLeaderboard']");
  if (leaderboardBtn) {
    leaderboardBtn.addEventListener('click', function(e) {
      e.preventDefault();
      showLeaderboard();
    });
  }
});
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
  // Emoji confetti shapes
  const emojis = ['🎉','✨','🎊','⭐','🔥','😃','😎','🏆','🥇','🥳'];
  confetti = Array.from({ length: 120 }, () => {
    const useEmoji = Math.random() < 0.4;
    return {
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * confettiCanvas.height - confettiCanvas.height,
      r: Math.random() * 6 + 2,
      d: Math.random() * 50 + 50,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      tilt: Math.random() * 10 - 10,
      emoji: useEmoji ? emojis[Math.floor(Math.random() * emojis.length)] : null
    };
  });
  animateConfetti();
}

function animateConfetti() {
  if (!confetti.length) return;
  requestAnimationFrame(animateConfetti);
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confetti.forEach(p => {
    if (p.emoji) {
      ctx.font = `${p.r * 3}px serif`;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.tilt * 0.1);
      ctx.fillText(p.emoji, 0, 0);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    p.y += p.d * 0.01;
    p.tilt += 0.1;
    p.x += Math.sin(p.tilt);
  });
  confetti = confetti.filter(p => p.y < confettiCanvas.height);
}

// Animated board theme transition
function animateThemeChange(newTheme) {
  const board = document.getElementById('board');
  board.classList.add('theme-animate');
  setTimeout(() => {
    board.classList.remove('theme-animate');
    document.body.className = '';
    document.body.classList.add(`theme-${newTheme}`);
  }, 500);
}

// Video background for game-section
function setVideoBackground(url) {
  let videoBg = document.getElementById('video-bg');
  if (!videoBg) {
    videoBg = document.createElement('video');
    videoBg.id = 'video-bg';
    videoBg.autoplay = true;
    videoBg.loop = true;
    videoBg.muted = true;
    videoBg.style.position = 'absolute';
    videoBg.style.top = '0';
    videoBg.style.left = '0';
    videoBg.style.width = '100%';
    videoBg.style.height = '100%';
    videoBg.style.objectFit = 'cover';
    videoBg.style.zIndex = '-1';
    document.getElementById('game-section').prepend(videoBg);
  }
  videoBg.src = url;
}

// Example: setVideoBackground('ticanimation.mp4'); // Call this on game start if you want a video background

// Animated timer (pulse and color change)
function animateTimerWarning() {
  const timerEl = document.getElementById('timer');
  timerEl.classList.add('timer-warning');
  setTimeout(() => timerEl.classList.remove('timer-warning'), 900);
}

// Enhance countdown to animate timer when low
const originalCountdown = countdown;
countdown = function() {
  if (!gameActive || gamePaused) return;
  document.getElementById('timer').textContent = `⏱️ ${timeLeft}`;
  if (timeLeft <= 3 && timeLeft > 0) animateTimerWarning();
  if (timeLeft <= 0) {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateStatus(`${getName(currentPlayer)}'s Turn (Auto Skipped)`);
    restartTimer();
    if ((mode === 'Easy' || mode === 'Hard') && currentPlayer === 'O') {
      setTimeout(aiMove, 500);
    }
    return;
  }
  timeLeft--;
  timer = setTimeout(countdown, 1000);
};

function clearConfetti() {
  confetti = [];
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
}

// Splash → Intro
window.addEventListener("load", () => {
  const splash = document.getElementById("splash-screen");
  const intro = document.getElementById("intro-screen");
  const video = document.getElementById("splash-video");
  const typewriter = document.getElementById("typewriter");
  const textToType = "🎮 Welcome to Tic Tac Toe 🎮";
  let typeIndex = 0;

  function typeWriter() {
    if (typeIndex < textToType.length) {
      typewriter.textContent += textToType.charAt(typeIndex);
      typeIndex++;
      setTimeout(typeWriter, 150); // Adjust speed (150ms per character)
    }
  }

 function goToIntroScreen() {
  splash.style.opacity = 0;
  setTimeout(() => {
    splash.style.display = "none";
    const restored = restoreGameState();

    // ✅ Always show intro screen if restoring fails or was paused
    if (!restored || restored === "interrupted") {
      intro.style.display = "block";
      showScreen("intro-screen");
    }

    // ✅ ALWAYS update leaderboard regardless of restore status
    updateLeaderboard();
  }, 1000);
}
  // Start typewriter effect
  if (typewriter) {
    typeWriter();
  }

  if (video) {
    video.addEventListener("ended", goToIntroScreen);
    video.addEventListener("error", () => {
      console.warn("Video failed to load, switching to intro screen.");
      goToIntroScreen();
    });
    video.play().catch(() => {
      console.warn("Auto-play failed, showing intro screen.");
      goToIntroScreen();
    });
    video.onloadedmetadata = () => {
      const videoDuration = video.duration * 1000; // Convert to milliseconds
      setTimeout(goToIntroScreen, videoDuration + 500); // Add buffer for typing
    };
  } else {
    setTimeout(goToIntroScreen, 10500); // Fallback if no video
  }
});

// ✅ Screen switching utility
function showScreen(id) {
  const screens = [
    "intro-screen",
    "game-section",
    "settings-panel",
    "game-over-popup",
    "pause-screen",
    "how-to-play",
    "leaderboard-screen"
  ];
  screens.forEach(s => {
    const el = document.getElementById(s);
    if (el) {
      if (s === id) {
        el.style.display = "flex";
        el.classList.add("active");
        console.log("Showing screen:", s);
      } else {
        el.style.display = "none";
        el.classList.remove("active");
      }
    }
  });
}


function saveGameState() {
  const cells = [...document.querySelectorAll(".cell")];

   const gameState = {
    board: cells.map(c => ({ text: c.textContent, player: c.dataset.player || "" })),
    currentPlayer: currentPlayer,
    gameActive: gameActive,
    gamePaused: gamePaused,
    timeLeft: timeLeft,
    mode: mode,
    boardTheme: boardTheme,
    playerXName: getName("X"),
    playerXEmoji: getEmoji("X"),
    playerOName: getName("O"),
    playerOEmoji: getEmoji("O"),
    };
  localStorage.setItem("gameState", JSON.stringify(gameState));
  console.log("Game state saved:", gameState); // Debug log
}


function restoreGameState() {
  try {
    const gameState = JSON.parse(localStorage.getItem("gameState"));
    if (!gameState || !gameState.board || !gameState.currentPlayer || !gameState.gameActive) {
      console.warn("No valid or active game state found in localStorage. Starting fresh.");
      return false;
    }

    currentPlayer = gameState.currentPlayer;
    gameActive = gameState.gameActive;
    gamePaused = gameState.gamePaused || false;
    timeLeft = gameState.timeLeft || 10;
    mode = gameState.mode || "PvP";
    boardTheme = gameState.boardTheme || "classic";

    // Restore player inputs if elements exist
    const playerXName = document.getElementById("playerXName");
    const playerXEmoji = document.getElementById("playerXEmoji");
    const playerOName = document.getElementById("playerOName");
    const playerOEmoji = document.getElementById("playerOEmoji");
    const gameMode = document.getElementById("gameMode");
    const themeSelector = document.getElementById("themeSelector");

    if (playerXName) playerXName.value = gameState.playerXName || "Player X";
    if (playerXEmoji) playerXEmoji.value = gameState.playerXEmoji || "😀";
    if (playerOName) playerOName.value = gameState.playerOName || "Player O";
    if (playerOEmoji) playerOEmoji.value = gameState.playerOEmoji || "🤖";
    if (gameMode) gameMode.value = mode;
    if (themeSelector) themeSelector.value = boardTheme;

    // Apply theme
    document.body.classList.remove("theme-classic", "theme-neon", "theme-wood", "theme-clear");
    document.body.classList.add(`theme-${boardTheme}`);

    // Restore board
    createBoard();
    const cells = document.querySelectorAll(".cell");
    gameState.board.forEach((cellData, i) => {
      if (cells[i]) {
        cells[i].textContent = cellData.text || "";
        if (cellData.player) cells[i].dataset.player = cellData.player;
      }
    });

    // Check if game was already won or drawn
    if (!gameActive) {
      resetGame(); // Reset to a new game if the previous game ended
      return true;
    }

    // Update UI
    updateStatus(`${getName(currentPlayer)}'s Turn`);
    document.getElementById("timer").textContent = `⏱️ ${timeLeft}`;
    if (gameActive && !gamePaused) countdown();

      if (!gamePaused) {
    showScreen("game-section");
    }
  return true;

  } catch (error) {
    console.error("Error restoring game state:", error);
    localStorage.removeItem("gameState"); // Clear invalid state
    return false;
  }
}
function showLeaderboard() {
  const popup = document.getElementById("leaderboard-popup");
  if (!popup) {
    console.error("❌ Leaderboard popup not found");
    return;
  }

  updateLeaderboard();
  popup.classList.add("active");
}



function closeLeaderboard() {
  document.getElementById("leaderboard-popup").classList.remove("active");
}





 




