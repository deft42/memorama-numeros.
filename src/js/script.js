// Espera a que todo el contenido HTML esté cargado
document.addEventListener("DOMContentLoaded", () => {
  // --- 0. Elementos del DOM ---
  const startGameButton = document.getElementById("start-game-button");
  const resetButton = document.getElementById("reset-button");
  const gameBoard = document.getElementById("game-board");
  const gameContainer = document.getElementById("game-container");
  const startMenu = document.getElementById("start-menu");
  const timerElement = document.getElementById("timer");
  const winMessage = document.getElementById("win-message");
  const scoreForm = document.getElementById("score-form");
  const finalTimeElement = document.getElementById("final-time");
  const playerNameInput = document.getElementById("player-name");
  const saveScoreButton = document.getElementById("save-score-button");
  const rankingList = document.getElementById("ranking-list");
  const player = document.getElementById("musicPlayer");

  // --- 1. Sistema de música ---
  const playlist = [
    "audios/1_Pixel_Dreams.mp3",
    "audios/2_Counting_Stars.mp3",
    "audios/3_Memory_Quest.mp3",
    "audios/4_Bit_by_Bit.mp3",
    "audios/5_Numberland.mp3",
    "audios/6_Retro_Playground.mp3",
    "audios/7_Tiny_Adventures.mp3",
    "audios/8_Learning_Loop.mp3",
    "audios/9_Pixel_Parade.mp3",
    "audios/10_Happy_Digits.mp3",
  ];

  let currentTrack = 0;
  player.volume = 0.3;

  function playTrack(index) {
    player.src = playlist[index];
    player.play().catch(() => {
      console.warn("Autoplay bloqueado, esperando interacción del usuario.");
    });
  }

  player.addEventListener("ended", () => {
    currentTrack++;
    if (currentTrack >= playlist.length) currentTrack = 0;
    playTrack(currentTrack);
  });

  // --- 2. Variables del juego ---
  const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const colorClasses = {
    0: "color-0",
    1: "color-1",
    2: "color-2",
    3: "color-3",
    4: "color-4",
    5: "color-5",
    6: "color-6",
    7: "color-7",
    8: "color-8",
    9: "color-9",
    10: "color-10",
  };
  let gameCards = [...numbers, ...numbers]; // Total 22 tarjetas

  let flippedCards = [];
  let matchedPairs = 0;
  let lockBoard = false;

  let timerInterval = null;
  let seconds = 0;

  let audioStarted = false;
  const matchSound = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.2 },
  }).toDestination();

  // --- 3. Funciones auxiliares ---
  function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  }

  function startTimer() {
    seconds = 0;
    timerElement.textContent = "00:00:00";
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      seconds++;
      timerElement.textContent = formatTime(seconds);
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
  }

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  function loadRanking() {
    const scores = JSON.parse(localStorage.getItem("memoramaRanking")) || [];
    scores.sort((a, b) => a.time - b.time);
    rankingList.innerHTML = "";

    if (scores.length === 0) {
      rankingList.innerHTML =
        '<li class="text-gray-500 text-center">¡Sé el primero en jugar!</li>';
    } else {
      scores.slice(0, 5).forEach((score, index) => {
        const li = document.createElement("li");
        li.className = "text-lg text-gray-800 p-1";
        li.innerHTML = `<span class="font-bold text-indigo-600">${
          index + 1
        }. ${score.name}</span> - ${formatTime(score.time)}`;
        rankingList.appendChild(li);
      });
    }
  }

  function saveScore() {
    const playerName = playerNameInput.value.trim();
    const nameToSave = playerName || "Anónimo";

    const scores = JSON.parse(localStorage.getItem("memoramaRanking")) || [];
    scores.push({ name: nameToSave, time: seconds });
    localStorage.setItem("memoramaRanking", JSON.stringify(scores));

    loadRanking();
    scoreForm.classList.add("hidden");
    resetButton.classList.remove("hidden");
    playerNameInput.value = "";
  }

  function resetBoard() {
    flippedCards = [];
    lockBoard = false;
  }

  // --- 4. Funciones principales ---
  function createBoard() {
    gameBoard.innerHTML = "";
    winMessage.classList.add("hidden");
    scoreForm.classList.add("hidden");
    resetButton.classList.add("hidden");
    flippedCards = [];
    matchedPairs = 0;
    lockBoard = false;

    shuffle(gameCards);

    gameCards.forEach((number) => {
      const cardElement = document.createElement("div");
      cardElement.classList.add("card", "cursor-pointer");
      cardElement.dataset.value = number;

      const cardInner = document.createElement("div");
      cardInner.classList.add("card-inner");

      const cardBack = document.createElement("div");
      cardBack.classList.add("card-back");
      cardBack.textContent = "⭐";

      const cardFront = document.createElement("div");
      cardFront.classList.add("card-front", colorClasses[number]);
      cardFront.textContent = number;

      cardInner.appendChild(cardBack);
      cardInner.appendChild(cardFront);
      cardElement.appendChild(cardInner);

      cardElement.addEventListener("click", flipCard);
      gameBoard.appendChild(cardElement);
    });

    startTimer();
  }

  async function flipCard() {
    if (!audioStarted) {
      await Tone.start();
      audioStarted = true;
    }

    if (lockBoard || this.classList.contains("matched")) return;
    if (this === flippedCards[0]) return;

    this.classList.add("flipped");
    flippedCards.push(this);

    if (flippedCards.length === 2) {
      lockBoard = true;
      checkForMatch();
    }
  }

  function checkForMatch() {
    const [card1, card2] = flippedCards;
    const isMatch = card1.dataset.value === card2.dataset.value;

    isMatch ? disableCards(card1, card2) : unflipCards(card1, card2);
  }

  function disableCards(card1, card2) {
    if (audioStarted) matchSound.triggerAttackRelease("C5", "8n");

    card1.classList.add("matched");
    card2.classList.add("matched");

    matchedPairs++;
    resetBoard();

    if (matchedPairs === numbers.length) {
      stopTimer();
      setTimeout(() => {
        winMessage.classList.remove("hidden");
        scoreForm.classList.remove("hidden");
        finalTimeElement.textContent = formatTime(seconds);
      }, 500);
    }
  }

  function unflipCards(card1, card2) {
    setTimeout(() => {
      card1.classList.remove("flipped");
      card2.classList.remove("flipped");
      resetBoard();
    }, 1000);
  }

  function startGame() {
    startMenu.classList.add("hidden");
    gameContainer.classList.remove("hidden");
    loadRanking();
    createBoard();

    // Iniciar música
    currentTrack = 0;
    playTrack(currentTrack);
  }

  // --- 5. Listeners de botones ---
  startGameButton.addEventListener("click", startGame);
  resetButton.addEventListener("click", createBoard);
  saveScoreButton.addEventListener("click", saveScore);

  // Registro del Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
            .register('/sw.js')
            .then(reg => console.log('Service Worker registrado con éxito:', reg))
            .catch(err => console.error('Error al registrar Service Worker:', err));
    }
});
