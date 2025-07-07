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
  saveGameState();

if (checkWin(currentPlayer)) {
  gameActive = false;
  localStorage.removeItem("gameState");
  playSound("win");
  triggerConfetti();
  let winnerName;
  if (mode === "PvC" && currentPlayer === "O") {
    // AI (O) wins in PvC mode
    winnerName = getName("O"); // Use the computer’s name
  } else {
    // Human (X) wins or PvP win
    winnerName = getName(currentPlayer);
  }
  updateStatus(`${winnerName} wins! 🎉`);
  updateLeaderboardData(winnerName);
  // Increment rounds for the winner
  const category = mode === "PvP" ? "PvP" : "PvC";
  const winnerAvatar = mode === "PvC" && currentPlayer === "O" ? getEmoji("O") : getEmoji(currentPlayer);
  let winnerEntry = leaderboard[category].find(p => p.name === winnerName);
  if (!winnerEntry) {
    winnerEntry = { name: winnerName, avatar: winnerAvatar, wins: 0, draws: 0, rounds: 0 };
    leaderboard[category].push(winnerEntry);
  }
  winnerEntry.rounds += 1;
  
  if (mode === "PvP") {
    const otherPlayer = currentPlayer === "X" ? "O" : "X";
    const otherName = getName(otherPlayer);
    let otherEntry = leaderboard[category].find(p => p.name === otherName);
    if (!otherEntry) {
      otherEntry = { name: otherName, avatar: getEmoji(otherPlayer), wins: 0, draws: 0, rounds: 0 };
      leaderboard[category].push(otherEntry);
    }
    otherEntry.rounds += 1;
  } else if (mode === "PvC") {
    // In PvC, only human’s rounds increment if AI wins (AI not tracked in leaderboard)
    const humanName = getName("X");
    let humanEntry = leaderboard[category].find(p => p.name === humanName);
    if (humanEntry) humanEntry.rounds += 1;
  }
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
 updateLeaderboard();
 document.getElementById("game-over-popup").style.display = "flex";
  triggerConfetti();
 return;

}

if (isDraw()) {
  gameActive = false;
  localStorage.removeItem("gameState");
  playSound("draw");
  updateStatus("It's a draw! 🤝");
  console.log("Draw detected, mode:", mode, "currentPlayer:", currentPlayer); // Debug log
  // Increment rounds and draws for both players involved
  const category = mode === "PvP" ? "PvP" : "PvC";
  const playerXName = getName("X");
  const playerOName = getName("O");
  const playerXEmoji = getEmoji("X");
  const playerOEmoji = getEmoji("O");
  console.log("Players - X:", playerXName, "O:", playerOName); // Debug log
  // Update both players
  const players = [
    { name: playerXName, avatar: playerXEmoji },
    { name: playerOName, avatar: playerOEmoji }
  ];
  players.forEach(playerData => {
    console.log("Processing player:", playerData.name); // Debug log
    let playerEntry = leaderboard[category].find(p => p.name === playerData.name);
    if (!playerEntry) {
      console.log("Creating new entry for:", playerData.name);
      playerEntry = { name: playerData.name, avatar: playerData.avatar, wins: 0, draws: 0, rounds: 0 };
      leaderboard[category].push(playerEntry);
    }
    playerEntry.rounds += 1;
    playerEntry.draws += 1;
    console.log("Updated entry:", playerEntry); // Debug log
  });
  // In PvC, exclude computer if named (handled in updateLeaderboard)
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
  console.log("Leaderboard after draw:", leaderboard); // Debug log
  updateLeaderboard();
  document.getElementById("game-over-popup").style.display = "flex";

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
  
  if (playerEntry) {
    playerEntry.wins += 1;
  } else {
    leaderboard[category].push({ name: winner, wins: 1, draws: 0, rounds: 0 });
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
    ["Name", "Wins", "Draws", "Rounds"].forEach(headerText => {
      const th = document.createElement("th");
      th.textContent = headerText;
      th.style.border = "1px solid black";
      th.style.padding = "5px";
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    pvpTable.appendChild(thead);

    const tbody = document.createElement("tbody");
    leaderboard.PvP.forEach(p => {
      const row = document.createElement("tr");
      ["name", "wins", "draws", "rounds"].forEach(prop => {
        const td = document.createElement("td");
        td.textContent = p[prop] || 0;
        td.style.border = "1px solid black";
        td.style.padding = "5px";
        row.appendChild(td);
      });
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
    ["Name", "Wins", "Draws", "Rounds"].forEach(headerText => {
      const th = document.createElement("th");
      th.textContent = headerText;
      th.style.border = "1px solid black";
      th.style.padding = "5px";
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    pvcTable.appendChild(thead);

    const tbody = document.createElement("tbody");
    leaderboard.PvC.forEach(p => {
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
      tbody.appendChild(row);
    });
    pvcTable.appendChild(tbody);

    list.appendChild(pvcTable);
  }
    leaderboardUpdatePending = false;
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





 




