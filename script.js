const boardElement = document.getElementById('board');
const messageElement = document.getElementById('message');
const turnLabel = document.getElementById('turnLabel');
const timerElement = document.getElementById('timer');
const timerPanel = document.getElementById('timerPanel');
const countXElement = document.getElementById('countX');
const countOElement = document.getElementById('countO');
const celebrationElement = document.getElementById('celebration');
const celebrationText = document.getElementById('celebrationText');
const confettiElement = document.getElementById('confetti');
const winningLines = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

let board = Array(9).fill(null);
let currentPlayer = 'X';
let selectedCell = null;
let gameOver = false;
let secondsLeft = 5;
let timerInterval;
let audioContext;

function getPlayerCount(player) {
  return board.filter((cell) => cell === player).length;
}

function playTrumpet() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    audioContext = new AudioContextClass();
  }

  try {
    if (audioContext.state === 'suspended') audioContext.resume();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((frequency, index) => {
      const start = audioContext.currentTime + index * 0.14;
      const oscillator = audioContext.createOscillator();
      const volume = audioContext.createGain();
      oscillator.type = 'sawtooth';
      oscillator.frequency.value = frequency;
      volume.gain.setValueAtTime(0.001, start);
      volume.gain.exponentialRampToValueAtTime(0.12, start + 0.025);
      volume.gain.exponentialRampToValueAtTime(0.001, start + 0.13);
      oscillator.connect(volume);
      volume.connect(audioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.14);
    });
  } catch (error) {
    // Perayaan visual tetap tampil jika audio tidak tersedia.
  }
}

function celebrateWinner(player) {
  celebrationText.textContent = `VICTORY! Pemain ${player} menang!`;
  celebrationElement.classList.add('show');
  confettiElement.innerHTML = '';

  const colors = ['#ffca70', '#82aaff', '#ff9b8f', '#83e0b0', '#c3a6ff'];
  for (let index = 0; index < 70; index += 1) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.backgroundColor = colors[index % colors.length];
    piece.style.setProperty('--drift', `${Math.random() * 180 - 90}px`);
    piece.style.setProperty('--fall-time', `${2 + Math.random() * 2}s`);
    piece.style.setProperty('--delay', `${Math.random() * 0.8}s`);
    confettiElement.appendChild(piece);
  }
  playTrumpet();
}

function renderBoard(winningLine = []) {
  boardElement.innerHTML = '';
  board.forEach((value, index) => {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell';
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-label', value ? `Kotak ${index + 1}, ${value}` : `Kotak ${index + 1}, kosong`);
    cell.textContent = value || '';
    if (value) cell.classList.add(value === 'X' ? 'x-mark' : 'o-mark');
    if (selectedCell === index) cell.classList.add('selected');
    if (winningLine.includes(index)) cell.classList.add('winning');
    cell.disabled = gameOver;
    cell.addEventListener('click', () => handleCellClick(index));
    boardElement.appendChild(cell);
  });

  countXElement.textContent = getPlayerCount('X');
  countOElement.textContent = getPlayerCount('O');
}

function updateTurnMessage() {
  turnLabel.textContent = `Pemain ${currentPlayer}`;
  const hasThree = getPlayerCount(currentPlayer) === 3;
  if (hasThree) {
    messageElement.textContent = selectedCell === null
      ? `Pemain ${currentPlayer}, pilih bidak yang ingin dipindahkan.`
      : `Pilih kotak kosong untuk memindahkan bidak ${currentPlayer}.`;
  } else {
    messageElement.textContent = `Pemain ${currentPlayer}, pilih kotak untuk meletakkan bidak.`;
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  secondsLeft = 5;
  timerElement.textContent = secondsLeft;
  timerPanel.classList.remove('urgent');
  timerInterval = setInterval(() => {
    secondsLeft -= 1;
    timerElement.textContent = secondsLeft;
    timerPanel.classList.toggle('urgent', secondsLeft <= 2);
    if (secondsLeft <= 0) {
      clearInterval(timerInterval);
      gameOver = true;
      selectedCell = null;
      const winner = currentPlayer === 'X' ? 'O' : 'X';
      messageElement.textContent = `Waktu habis! Pemain ${winner} menang.`;
      turnLabel.textContent = 'Permainan selesai';
      renderBoard();
      celebrateWinner(winner);
    }
  }, 1000);
}

function finishTurn() {
  const winningLine = winningLines.find((line) => line.every((index) => board[index] === currentPlayer));
  if (winningLine) {
    gameOver = true;
    clearInterval(timerInterval);
    messageElement.textContent = `Pemain ${currentPlayer} menang! Tiga bidak sejajar.`;
    turnLabel.textContent = 'Permainan selesai';
    renderBoard(winningLine);
    celebrateWinner(currentPlayer);
    return;
  }

  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  selectedCell = null;
  updateTurnMessage();
  renderBoard();
  resetTimer();
}

function handleCellClick(index) {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioContext = new AudioContextClass();
  }
  if (audioContext && audioContext.state === 'suspended') audioContext.resume();
  if (gameOver) return;

  if (getPlayerCount(currentPlayer) < 3) {
    if (board[index] !== null) return;
    board[index] = currentPlayer;
    finishTurn();
    return;
  }

  if (selectedCell === null) {
    if (board[index] !== currentPlayer) return;
    selectedCell = index;
    updateTurnMessage();
    renderBoard();
    return;
  }

  if (index === selectedCell) {
    selectedCell = null;
    updateTurnMessage();
    renderBoard();
    return;
  }

  if (board[index] !== null) {
    if (board[index] === currentPlayer) {
      selectedCell = index;
      updateTurnMessage();
      renderBoard();
    }
    return;
  }

  board[index] = currentPlayer;
  board[selectedCell] = null;
  finishTurn();
}

document.getElementById('restartButton').addEventListener('click', () => {
  clearInterval(timerInterval);
  board = Array(9).fill(null);
  currentPlayer = 'X';
  selectedCell = null;
  gameOver = false;
  celebrationElement.classList.remove('show');
  confettiElement.innerHTML = '';
  updateTurnMessage();
  renderBoard();
  resetTimer();
});

updateTurnMessage();
renderBoard();
resetTimer();
