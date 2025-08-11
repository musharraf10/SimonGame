// Modern Simon game JS — Fixed: play each color only once per sequence playback
const COLORS = ["red", "yellow", "green", "purple"]; // matches HTML ids

/* DOM */
const allBtns = Array.from(document.querySelectorAll(".s-btn"));
const startBtn = document.getElementById("startBtn");
const levelBadge = document.getElementById("levelBadge");
const statusEl = document.getElementById("status");
const overlay = document.getElementById("overlay");
const overlayMsg = document.getElementById("overlayMessage");
const overlayLoader = document.getElementById("overlayLoader");
const overlayBtn = document.getElementById("overlayBtn");

/* STATE */
let gameSeq = [];
let userSeq = [];
let level = 0;
let acceptingInput = false;
let started = false;
let isPlayingSequence = false;

/* AUDIO (optional) */
let audioCtx;
const tones = { red: 261.6, yellow: 329.6, green: 392.0, purple: 523.3 };
const SFX_ENABLED = true;
function playTone(color, dur = 220) {
  if (!SFX_ENABLED) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "sine";
    o.frequency.value = tones[color] || 300;
    o.connect(g);
    g.connect(audioCtx.destination);
    g.gain.value = 0.0001;
    const now = audioCtx.currentTime;
    g.gain.linearRampToValueAtTime(0.09, now + 0.01);
    o.start(now);
    g.gain.linearRampToValueAtTime(0.0001, now + dur / 1000);
    o.stop(now + dur / 1000 + 0.02);
  } catch (e) {}
}

/* HELPERS */
function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }
function setStatus(txt) { statusEl.textContent = txt; }
function setLevel(n) { levelBadge.textContent = n > 0 ? `Level ${n}` : "Level —"; }
function showOverlay(message, withLoader = false, showRestart = false) {
  overlayMsg.textContent = message;
  overlayLoader.classList.toggle("hidden", !withLoader);
  overlayBtn.classList.toggle("hidden", !showRestart);
  overlay.classList.remove("hidden");
}
function hideOverlay() { overlay.classList.add("hidden"); }

/* UI flash helpers - single flash per call */
function flashTileOnce(color, duration = 320) {
  const btn = document.getElementById(color);
  if (!btn) return;
  btn.classList.add("flash");
  playTone(color, duration);
  return sleep(duration).then(() => btn.classList.remove("flash"));
}
function userPressFeedback(el) {
  el.classList.add("userFlash");
  setTimeout(() => el.classList.remove("userFlash"), 180);
}

/* Random color */
function getRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

/* Play a full sequence (each color blinks once, in order).
   Locks input during playback. */
async function playSequence(sequence) {
  if (isPlayingSequence) return;
  isPlayingSequence = true;
  acceptingInput = false;
  // small pause before start so user can see change
  await sleep(350);

  for (let i = 0; i < sequence.length; i++) {
    const color = sequence[i];
    await flashTileOnce(color, 300);    // each tile flashes ONCE
    // gap between flashes
    await sleep(120);
  }

  // done playing sequence
  isPlayingSequence = false;
  acceptingInput = true;
}

/* Level up: push next color then play the full sequence once */
async function levelUp() {
  userSeq = [];
  level++;
  setLevel(level);
  setStatus("Watch the new color");

  // pick new color & add to sequence
  const newColor = getRandomColor();
  gameSeq.push(newColor);

  // 🔹 Only blink the new color
  acceptingInput = false;
  await sleep(400);
  await flashTileOnce(newColor, 300);
  acceptingInput = true;

  setStatus("Your turn — repeat full sequence");
}

/* Check answer as user enters input */
function checkAns(idx) {
  if (!acceptingInput) return;
  if (userSeq[idx] === gameSeq[idx]) {
    // so far so good
    if (userSeq.length === gameSeq.length) {
      // completed the sequence correctly — move to next level after short delay
      acceptingInput = false;
      setStatus("Nice! Next level...");
      setTimeout(() => {
        showOverlay("Get ready...", true, false);
        setTimeout(() => {
          hideOverlay();
          levelUp();
        }, 800);
      }, 700);
    }
  } else {
    // wrong — game over
    acceptingInput = false;
    setStatus("Wrong! Game over");
    showOverlay(`Game Over! Your score: ${level}`, false, true);
    overlayBtn.onclick = resetGame;
  }
}

/* Reset game */
function resetGame() {
  hideOverlay();
  started = false;
  gameSeq = [];
  userSeq = [];
  level = 0;
  setLevel(0);
  setStatus("Press Start to begin");
  acceptingInput = false;
}

/* Input handler for tiles (pointerdown for mobile & desktop) */
function handleTilePointerDown(e) {
  const btn = e.currentTarget;
  // if not accepting input, give small feedback but ignore sequence
  if (!acceptingInput) {
    userPressFeedback(btn);
    return;
  }
  // real user press
  userPressFeedback(btn);
  const color = btn.dataset.color;
  if (!color) return;
  userSeq.push(color);
  checkAns(userSeq.length - 1);
}

/* Start button flow */
startBtn.addEventListener("click", () => {
  if (started) return;
  started = true;
  showOverlay("Get Ready...", true, false);
  setTimeout(() => {
    hideOverlay();
    level = 0;
    gameSeq = [];
    setLevel(0);
    levelUp();
  }, 850);
});

/* attach handlers to tiles */
allBtns.forEach(btn => {
  btn.addEventListener("pointerdown", handleTilePointerDown);
  // accessibility: keyboard support
  btn.setAttribute("tabindex", "0");
  btn.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); btn.click(); }
  });
});

/* overlay restart button */
overlayBtn.addEventListener("click", resetGame);

/* init UI */
setLevel(0);
setStatus("Press Start to begin");
hideOverlay();
