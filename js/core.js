// ---------- Setup ----------
// Everything is drawn at the NES's real resolution (256x224) into an offscreen buffer, which is then
// blown up to the window with no smoothing, so every sprite, letter and effect lands on the same chunky pixel grid.
const cv = document.getElementById('game');
const screenCtx = cv.getContext('2d');
const buf = document.createElement('canvas');
buf.width = 256; buf.height = 224;
const ctx = buf.getContext('2d');
ctx.imageSmoothingEnabled = false;
function present() {
  screenCtx.imageSmoothingEnabled = false;
  screenCtx.drawImage(buf, 0, 0, cv.width, cv.height);
}

const T = 16, COLS = 16, ROWS = 11, HUD = 48;
const PW = COLS * T, PH = ROWS * T;
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const DIR_NAMES = ['up', 'down', 'left', 'right'];
// V = ravine, P = hookshot post. Things that fly (arrows, boomerang, hookshot) pass over W and V.
// D = solid tile drawn by an overlay (dungeon entrance, shop). In dungeons: w = wall, k = block,
// L = locked door, S = shutter, o = open doorway. Song of Time blocks: Q solid / q marker on the ground,
// U risen stepping stone / u sunken marker in a ravine.
const SOLID = new Set(['T', 'R', 'B', 'W', 'V', 'P', 'D', 'w', 'k', 'L', 'S', 'Q', 'u']);
const flyBlocked = ch => SOLID.has(ch) && ch !== 'W' && ch !== 'V' && ch !== 'u';

// Scale up by a whole number of physical screen pixels, so every game pixel is the same size.
// The canvas fits inside #screen, which leaves room for the touch controls when they're shown.
function resize() {
  const dpr = window.devicePixelRatio || 1;
  const box = document.getElementById('screen');
  const w = box ? box.clientWidth : innerWidth, h = box ? box.clientHeight : innerHeight - 16;
  const k = Math.max(1, Math.floor(Math.min(w * dpr / 256, h * dpr / 224)));
  cv.width = 256 * k;
  cv.height = 224 * k;
  cv.style.width = 256 * k / dpr + 'px';
  cv.style.height = 224 * k / dpr + 'px';
}
addEventListener('resize', resize);
resize();

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hash(x, y) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const h3 = (x, y, salt) => hash(x + Math.imul(salt, 0x9E3779B1 | 0), y ^ Math.imul(salt + 1, 0x85EBCA6B | 0));
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- Sound ----------
let AC = null;
function tone(f, d, type = 'square', v = 0.06, f2 = null, delay = 0) {
  if (!AC) return;
  const t = AC.currentTime + delay;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g); g.connect(AC.destination);
  o.start(t); o.stop(t + d + 0.02);
}
const SFX = {
  sword: () => tone(900, 0.12, 'sawtooth', 0.035, 200),
  hit: () => tone(300, 0.08, 'square', 0.06, 150),
  kill: () => tone(400, 0.18, 'square', 0.05, 60),
  rupee: () => { tone(1300, 0.06, 'square', 0.04); tone(1900, 0.1, 'square', 0.04, null, 0.06); },
  heart: () => [0, 1, 2].forEach(i => tone(700 + i * 200, 0.07, 'triangle', 0.08, null, i * 0.06)),
  hurt: () => tone(220, 0.2, 'square', 0.07, 70),
  block: () => tone(1500, 0.05, 'square', 0.04, 800),
  cut: () => tone(500, 0.08, 'triangle', 0.06, 200),
  fire: () => tone(160, 0.25, 'sawtooth', 0.04, 90),
  boss: () => tone(90, 0.8, 'sawtooth', 0.08, 30),
  arrow: () => tone(1200, 0.08, 'triangle', 0.05, 400),
  boomerang: () => tone(500, 0.12, 'triangle', 0.04, 900),
  swap: () => tone(1000, 0.04, 'square', 0.03),
  pause: () => [880, 660, 880].forEach((f, i) => tone(f, 0.06, 'square', 0.04, null, i * 0.06)),
  stun: () => tone(700, 0.15, 'square', 0.04, 1400),
  hook: () => tone(300, 0.12, 'square', 0.03, 600),
  clink: () => { tone(1800, 0.05, 'square', 0.04); tone(2400, 0.06, 'square', 0.03, null, 0.04); },
  chest: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.09, 'square', 0.04, null, i * 0.07)),
  item: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i === 3 ? 0.5 : 0.14, 'square', 0.05, null, i * 0.13)),
  die: () => [0, 1, 2, 3].forEach(i => tone(400 - i * 80, 0.18, 'square', 0.06, null, i * 0.18)),
  error: () => tone(140, 0.14, 'square', 0.05, 100),
  key: () => [1047, 1319, 1568].forEach((f, i) => tone(f, 0.08, 'square', 0.04, null, i * 0.06)),
  unlock: () => { tone(600, 0.06, 'square', 0.05); tone(300, 0.15, 'square', 0.05, 150, 0.06); },
  shut: () => tone(120, 0.25, 'square', 0.07, 60),
  windup: () => tone(200, 0.5, 'sawtooth', 0.05, 700),
  slam: () => tone(90, 0.3, 'square', 0.09, 40),
  // the classic "you found a secret" jingle
  secret: () => [784, 740, 622, 440, 415, 659, 831, 1047].forEach((f, i) => tone(f, 0.12, 'square', 0.04, null, i * 0.11)),
  stairs: () =>[0, 1, 2, 3, 4].forEach(i => tone(660 - i * 90, 0.07, 'square', 0.04, null, i * 0.07)),
};
function sfx(n) { try { SFX[n](); } catch (e) {} }

// ---------- Input ----------
const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  KeyZ: 'attack', KeyX: 'item', Enter: 'start',
  // the on-screen touch pad (touch.js) presses these made-up codes
  TouchUp: 'up', TouchDown: 'down', TouchLeft: 'left', TouchRight: 'right',
  TouchA: 'attack', TouchB: 'item', TouchStart: 'start',
};
// What the buttons are called on screen; touch.js renames them to the pad's A, B and START.
const BTN = { attack: 'Z', item: 'X', start: 'ENTER' };
// Track physical keys so holding both W and ArrowUp doesn't break when one is released.
const heldCodes = new Set(), pressed = new Set(), dirOrder = [];
const isHeld = a => [...heldCodes].some(c => KEYMAP[c] === a);
function keyDown(code) {
  const a = KEYMAP[code];
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (err) {} }
  if (heldCodes.has(code)) return;
  if (!isHeld(a)) {
    pressed.add(a);
    if (DIRS[a]) dirOrder.push(a);
  }
  heldCodes.add(code);
}
function keyUp(code) {
  const a = KEYMAP[code];
  heldCodes.delete(code);
  if (isHeld(a)) return;
  const i = dirOrder.indexOf(a);
  if (i >= 0) dirOrder.splice(i, 1);
}
addEventListener('keydown', e => {
  if (!KEYMAP[e.code]) return;
  e.preventDefault();
  keyDown(e.code);
});
addEventListener('keyup', e => { if (KEYMAP[e.code]) keyUp(e.code); });
addEventListener('blur', () => { heldCodes.clear(); dirOrder.length = 0; });
function heldDir() { return dirOrder.length ? dirOrder[dirOrder.length - 1] : null; }
