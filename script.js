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
    { text: "mr.yoshioka is smart" },
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

// Queue configuration for game progression (3 short -> 3 medium -> 3 long)
const wordSequence = [
  "short", "short", "short",
  "medium", "medium", "medium",
  "long", "long", "long"
];

let wordSequenceIndex = 0;

// Pool tracking for unused phrases to prevent repetition
let unusedWords = {
  short: [],
  medium: [],
  long: []
};

// Refills and shuffles the phrase pool for a category
function resetPool(category) {
  unusedWords[category] = [...wordGroups[category]];
}

// Retrieves the next phrase sequentially without back-to-back duplicates
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
    se.play().catch(() => { /* Safely ignore browser autoplay audio blocks */ }); 
  }
};

// DOM References
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

function setNewWord() {
  currentWord = getNextWord();
  targetText = currentWord.text;
  currentIndex = 0;

  // Render the target English text on screen
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
  // Displays spaces explicitly as "SPACE" so players understand the break
  romajiGuideEl.textContent = nextChar === " " ? "NEXT KEY: SPACE" : "NEXT KEY: " + nextChar.toUpperCase();
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
    inputEl.disabled = false; // Unlocks the box so you can start typing!
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
      gameOver();
    }
  }, 1000);
}

function gameOver() {
  playSE(seEnd);

  let bonus = currentIndex;
  const finalScore = score + bonus;

  if (kanjiEl) kanjiEl.textContent = "Game Over";
  if (kanaEl) kanaEl.textContent = "";
  if (romajiGuideEl) romajiGuideEl.textContent = "";
  
  if (inputEl) {
    inputEl.value = "";
    inputEl.placeholder = "Press START to begin typing";
    inputEl.disabled = true; // Locks the box again when the game is over
  }

  if (gameOverEl) {
    if (bonus > 0) {
      gameOverEl.textContent = `Your Score: ${finalScore} (Bonus +${bonus}pt)`;
    } else {
      gameOverEl.textContent = `Your Score: ${finalScore}`;
    }
  }
}

if (inputEl) {
  inputEl.addEventListener("input", () => {
    if (!currentWord || inputEl.disabled) return;

    const currentTypedValue = inputEl.value;
    const expectedTextSoFar = targetText.slice(0, currentIndex);

    // Dynamic verification of keyboard stroke tracking
    if (currentTypedValue.startsWith(expectedTextSoFar) && currentTypedValue.length === currentIndex + 1) {
      const newlyTypedChar = currentTypedValue[currentIndex];
      const expectedChar = targetText[currentIndex];

      if (newlyTypedChar.toLowerCase() === expectedChar.toLowerCase()) {
        currentIndex++;

        // Word Completed Successfully
        if (currentIndex >= targetText.length) {
          playSE(seCorrect);
          score += targetText.length;
          if (scoreEl) scoreEl.textContent = "Score: " + score;
          setNewWord();
          return;
        }
        updateNextKeyGuide();
      } else {
        // Typing error (Wrong key pressed)
        playSE(seMiss);
        inputEl.value = expectedTextSoFar;
      }
    } else {
      // Structural correction on delete/backspace actions
      playSE(seMiss);
      inputEl.value = expectedTextSoFar;
    }
  });
}

if (startBtn) {
  startBtn.addEventListener("click", startGame);
}
