// ==============================
// 1. Phrase List (Grouped by Difficulty)
// ==============================
const wordGroups = {
  short: [
    { text: "Forest" },
    { text: "Tatsumi" },
    { text: "Gecko" },
    { text: "Lizard" },
    { text: "Fireworks" },
    { text: "Young Deer" },
    { text: "Green Grass" },
    { text: "Give it a try" },
    { text: "Go beyond" },
    { text: "Self Log" },
  ],
  medium: [
    { text: "Mountain of Knowledge" },
    { text: "Path of Knowledge" },
    { text: "Garden of Knowledge" },
    { text: "Owasashi Festival" },
    { text: "Just a brief scene" },
    { text: "Sunny Room" },
    { text: "Proactive Learner" },
    { text: "50th Anniversary" },
    { text: "Festival" },
    { text: "Snake infested Hallway" }
  ],
  long: [
    { text: "Principal's 8th Year" },
    { text: "Tatsumi Junior High School" },
    { text: "Joint Exhibition" },
    { text: "Limit one keychain per person" },
    { text: "Mr. Ikeda is a gyaru" },
    { text: "Dried earthworms at the edge of the garden after rain" },
    { text: "The vice principal has a great voice" },
    { text: "Mr. Kondo slips into regional dialect sometimes" },
    { text: "Mr. Owada's back muscles are like Machamp" },
    { text: "The principal's presence is immense" }
  ]
};

const wordSequence = [
  "short", "short", "short",
  "medium", "medium", "medium",
  "long", "long", "long"
];

let wordSequenceIndex = 0;
let unusedWords = { short: [], medium: [], long: [] };

function resetPool(category) {
  unusedWords[category] = [...wordGroups[category]];
}

function getNextWord() {
  const currentCategory = wordSequence[wordSequenceIndex];
  if (!unusedWords[currentCategory] || unusedWords[currentCategory].length === 0) {
    resetPool(currentCategory);
  }
  const pool = unusedWords[currentCategory];
  const randomIndex = Math.floor(Math.random() * pool.length);
  const selectedWord = pool.splice(randomIndex, 1)[0];
  wordSequenceIndex = (wordSequenceIndex + 1) % wordSequence.length;
  return selectedWord;
}

// Audio Elements
const seCorrect = document.getElementById("se-correct");
const seMiss = document.getElementById("se-miss");
const seStart = document.getElementById("se-start");
const seEnd = document.getElementById("se-end");

const playSE = se => { 
  if (se) {
    se.currentTime = 0; 
    se.play().catch(() => {}); 
  }
};

// DOM References
const gamePanel = document.getElementById("game"); // Reference for shaking
const kanjiEl = document.getElementById("kanji");
const kanaEl = document.getElementById("kana"); 
const romajiGuideEl = document.getElementById("romaji-guide"); 
const inputEl = document.getElementById("input");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const startBtn = document.getElementById("start");
const gameOverEl = document.getElementById("game-over");

// Game States
let currentWord = null;
let targetText = "";
let currentIndex = 0;     
let score = 0;
let time = 60;
let timer;

// Triggers an intense shaking animation on layout errors
function triggerHardShake() {
  if (!gamePanel) return;
  gamePanel.classList.remove("shake");
  void gamePanel.offsetWidth; // Force CSS reflow to re-trigger the animation instantly
  gamePanel.classList.add("shake");
}

function setNewWord() {
  currentWord = getNextWord();
  targetText = currentWord.text;
  currentIndex = 0;

  if (kanjiEl) kanjiEl.textContent = targetText;
  if (kanaEl) kanaEl.textContent = ""; 
  if (inputEl) inputEl.value = "";

  updateNextKeyGuide();
}

function updateNextKeyGuide() {
  if (!romajiGuideEl) return;
  if (currentIndex >= targetText.length) {
    romajiGuideEl.textContent = "";
    return;
  }
  const nextChar = targetText[currentIndex];
  romajiGuideEl.textContent = "NEXT KEY: " + nextChar.toUpperCase();
}

function startGame() {
  playSE(seStart);
  score = 0;
  time = 60;
  wordSequenceIndex = 0;

  resetPool("short");
  resetPool("medium");
  resetPool("long");

  if (scoreEl) scoreEl.textContent = "Score: 0";
  if (timeEl) timeEl.textContent = "Time Left: 60";
  if (gameOverEl) gameOverEl.textContent = "";

  if (inputEl) {
    inputEl.disabled = false;
    inputEl.value = "";
    inputEl.placeholder = "";
    inputEl.focus();
  }

  setNewWord();

  clearInterval(timer);
  timer = setInterval(() => {
    time--;
    if (timeEl) timeEl.textContent = "Time Left: " + time;
    if (time <= 0) {
      clearInterval(timer);
      startResultsCountdown();
    }
  }, 1000);
}

// Handles the new post-match timer countdown
function startResultsCountdown() {
  playSE(seEnd);

  // Instantly lock typing input and hide active phrase boxes
  if (inputEl) {
    inputEl.value = "";
    inputEl.placeholder = "Time Up!";
    inputEl.disabled = true;
  }
  if (kanjiEl) kanjiEl.textContent = "TIME UP!";
  if (kanaEl) kanaEl.textContent = "";
  if (romajiGuideEl) romajiGuideEl.textContent = "";

  let countdownValue = 5;
  if (gameOverEl) gameOverEl.textContent = `Results in ${countdownValue}...`;

  const countdownInterval = setInterval(() => {
    countdownValue--;
    if (countdownValue > 0) {
      if (gameOverEl) gameOverEl.textContent = `Results in ${countdownValue}...`;
    } else {
      clearInterval(countdownInterval);
      showFinalResults();
    }
  }, 1000);
}

function showFinalResults() {
  let bonus = currentIndex;
  const finalScore = score + bonus;

  if (kanjiEl) kanjiEl.textContent = "Game Over";
  
  if (gameOverEl) {
    if (bonus > 0) {
      gameOverEl.textContent = `Your Score: ${finalScore} (Bonus +${bonus}pt)`;
    } else {
      gameOverEl.textContent = `Your Score: ${finalScore}`;
    }
  }
}

// MECHANICAL KEYBOARD INTERCEPT ENGINE
if (inputEl) {
  inputEl.addEventListener("keydown", (event) => {
    if (event.key.length !== 1 || !currentWord || inputEl.disabled) {
      if (event.key === " ") event.preventDefault();
      return;
    }

    event.preventDefault(); // Stop standard slower input buffer rendering

    const pressedKey = event.key;
    const expectedChar = targetText[currentIndex];

    if (pressedKey.toLowerCase() === expectedChar.toLowerCase()) {
      currentIndex++;

      if (currentIndex >= targetText.length) {
        playSE(seCorrect);
        score += targetText.length;
        if (scoreEl) scoreEl.textContent = "Score: " + score;
        setNewWord();
        return;
      }

      // Auto-space jumper
      if (targetText[currentIndex] === " ") {
        currentIndex++;
      }

      inputEl.value = targetText.slice(0, currentIndex);
      updateNextKeyGuide();
    } else {
      // Mistake: trigger audio AND intense screen vibration
      playSE(seMiss);
      triggerHardShake();
    }
  });
}

if (startBtn) {
  startBtn.addEventListener("click", startGame);
}
