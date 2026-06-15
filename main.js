const phrases = [
  "Enter Olympus",
  "Trade Everything",
  "Predict Anything",
  "Do Everything",
];

const el = document.getElementById("typewriter");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const TYPE_MS = 72;
const DELETE_MS = 42;
const PAUSE_MS = 1800;

let phraseIndex = 0;
let charIndex = 0;
let deleting = false;

function tick() {
  if (!el) return;

  const current = phrases[phraseIndex];

  if (!deleting) {
    charIndex++;
    el.textContent = current.slice(0, charIndex);

    if (charIndex === current.length) {
      deleting = true;
      setTimeout(tick, PAUSE_MS);
      return;
    }

    setTimeout(tick, TYPE_MS);
    return;
  }

  charIndex--;
  el.textContent = current.slice(0, charIndex);

  if (charIndex === 0) {
    deleting = false;
    phraseIndex = (phraseIndex + 1) % phrases.length;
    setTimeout(tick, 400);
    return;
  }

  setTimeout(tick, DELETE_MS);
}

if (el) {
  if (reducedMotion) {
    el.textContent = phrases[0];
  } else {
    tick();
  }
}
