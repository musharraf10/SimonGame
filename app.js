
const COLORS = ["yellow", "red", "purple", "green"]; // order doesn't matter
const SFX_ENABLED = true; // set false to disable tones

/* ------------- DOM ------------- */
const allBtns = Array.from(document.querySelectorAll(".s-btn"));
const startBtn = document.getElementById("startBtn");
const levelBadge = document.getElementById("levelBadge");
const statusEl = document.getElementById("status");
const overlay = document.getElementById("overlay");
const overlayMsg = document.getElementById("overlayMessage");
const overlayLoader = document.getElementById("overlayLoader");
const overlayBtn = document.getElementById("overlayBtn");

/* ------------- STATE ------------- */
let gameSeq = [];
let userSeq = [];
let started = false;
let level = 0;
let acceptingInput = false;

/* ------------- fix random index (use 4) ------------- */
function getRandomColor() {
  const idx = Math.floor(Math.random() * COLORS.length); // correct size
  return COLORS[idx];
}

/* ------------- sound (simple WebAudio) ------------- */
let audioCtx;
const tones = {
  red: 261.6, // C4
  yellow: 329.6, // E4
  green: 392.0, // G4
  purple: 523.3 // C5
};

function playTone(color, duration = 220) {
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
    g.gain.linearRampToValueAtTime(0.0001, now + duration / 1000);
    o.stop(now + duration / 1000 + 0.02);
  } catch (e) { /* ignore */ }
}

/* ------------- UI helpers ------------- */
function setStatus(text) {
  statusEl.textContent = text;
}

function setLevel(n) {
  levelBadge.textContent = n > 0 ? `Level ${n}` : "Level —";
}

function showOverlay(message, withLoader = false, showRestart = false) {
  overlayMsg.textContent = message;
  overlayLoader.classList.toggle("hidden", !withLoader);
  overlayBtn.classList.toggle("hidden", !showRestart);
  overlay.classList.remove("hidden");
}
function hideOverlay() { overlay.classList.add("hidden"); }

/* ------------- flash helpers ------------- */
function addFlash(btnEl) {
  btnEl.classList.add("flash");
  playTone(btnEl.dataset.color);
  setTimeout(() => btnEl.classList.remove("flash"), 280);
}
function addUserFlash(btnEl) {
  btnEl.classList.add("userFlash");
  playTone(btnEl.dataset.color, 160);
  setTimeout(() => btnEl.classList.remove("userFlash"), 200);
}

/* ------------- sequence logic ------------- */
function levelUp() {
  acceptingInput = false;
  userSeq = [];
  level++;
  setLevel(level);
  setStatus("Watch the sequence");
  // add random color
  const next = getRandomColor();
  gameSeq.push(next);
  // play the sequence
  playSequence(gameSeq).then(() => {
    acceptingInput = true;
    setStatus("Your turn — repeat the sequence");
  });
}

async function playSequence(seq) {
  // small pause before playing
  await sleep(450);
  for (let color of seq) {
    const btnEl = document.getElementById(color);
    addFlash(btnEl);
    await sleep(420);
  }
  await sleep(160);
}

/* ------------- check answer ------------- */
function checkAns(idx) {
  if (!acceptingInput) return;
  if (userSeq[idx] === gameSeq[idx]) {
    if (userSeq.length === gameSeq.length) {
      acceptingInput = false;
      setStatus("Nice — next level");
      setTimeout(() => {
        // small get-ready overlay
        showOverlay("Get ready...", true, false);
        setTimeout(() => {
          hideOverlay();
          levelUp();
        }, 900);
      }, 700);
    }
  } else {
    gameOver();
  }
}

/* ------------- game over & reset ------------- */
function gameOver() {
  acceptingInput = false;
  setStatus("Game Over! Tap Restart");
  showOverlay(`Game Over! Your score: ${level}`, false, true);
  overlayBtn.onclick = resetGame;
}

/* ------------- reset ------------- */
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

/* ------------- utility sleep ------------- */
function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

/* ------------- input handlers ------------- */
function handleUserPress(e) {
  if (!acceptingInput) return;
  // support pointer events & clicks
  const target = e.currentTarget;
  addUserFlash(target);
  const color = target.dataset.color;
  userSeq.push(color);
  checkAns(userSeq.length - 1);
}

/* ------------- Start flow ------------- */
startBtn.addEventListener("click", () => {
  if (started) return;
  started = true;
  // show overlay loader then start
  showOverlay("Get Ready...", true, false);
  setTimeout(() => {
    hideOverlay();
    level = 0;
    gameSeq = [];
    setLevel(0);
    levelUp();
  }, 900);
});

/* ------------- Attach events to all color buttons ------------- */
allBtns.forEach(btn => {
  // pointerdown covers mouse, touch & pen reliably
  btn.addEventListener("pointerdown", (e) => {
    // prevent accidental input while sequence is playing
    if (!acceptingInput) {
      // but still provide a small tactile feedback
      btn.classList.add("userFlash");
      setTimeout(()=>btn.classList.remove("userFlash"),120);
      return;
    }
    handleUserPress.call(btn, e);
  });
  // keyboard support for accessibility (space/enter)
  btn.setAttribute("tabindex","0");
  btn.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      btn.click();
    }
  });
});

/* ------------- expose overlay restart button too ------------- */
overlayBtn.addEventListener("click", () => {
  resetGame();
});

/* ------------- init UI ------------- */
setLevel(0);
setStatus("Press Start to begin");
hideOverlay();

/* ------------- optional auto-play test (comment out in production) ------------- */
/* // auto start for testing:
setTimeout(() => startBtn.click(), 400);
*/
