// ---------- Ocarina ----------
// Like Ocarina of Time: five notes on Z and the arrow keys (the A and C buttons there), D F A B D.
// Playing the last six notes of a song you know plays it back and triggers it. The world is frozen
// while you play.
const NOTES = {
  A: { key: 'attack', get glyph() { return BTN.attack; }, col: '#3cbcfc', f: 587.33, line: 4 },
  v: { key: 'down', glyph: '▼', col: '#f8b800', f: 698.46, line: 3 },
  '>': { key: 'right', glyph: '▶', col: '#f8b800', f: 880, line: 2 },
  '<': { key: 'left', glyph: '◀', col: '#f8b800', f: 987.77, line: 1 },
  '^': { key: 'up', glyph: '▲', col: '#f8b800', f: 1174.66, line: 0 },
};
const SONG_OF_TIME = ['>', 'A', 'v', '>', 'A', 'v'];
const SONG_BEATS = [1, 2, 1, 1, 2, 2]; // its rhythm when the melody plays back
const BEAT = 14;                       // frames per beat
let oca = null;                        // { notes, song, t, idx } while the ocarina is out

// a soft ocarina voice: a sine with a faint triangle an octave up
function ocarinaTone(f, d) {
  tone(f, d, 'sine', 0.09);
  tone(f * 2, d * 0.8, 'triangle', 0.012);
}

function startOcarina() {
  state = 'ocarina';
  player.dir = 'down';
  oca = { notes: [], song: false, t: 0, idx: -1 };
}

function updateOcarina() {
  const o = oca;
  if (o.song) {
    // play the melody back, then the song takes effect
    o.t++;
    let at = 20;
    SONG_OF_TIME.forEach((n, i) => {
      if (o.t === at) { o.idx = i; ocarinaTone(NOTES[n].f, SONG_BEATS[i] * BEAT / 60 + 0.1); }
      at += SONG_BEATS[i] * BEAT;
    });
    if (o.t === at + 10) { o.idx = -1; songOfTime(); }
    if (o.t >= at + 50) { state = 'play'; oca = null; }
    return;
  }
  if (pressed.has('item') || pressed.has('start')) { state = 'play'; oca = null; return; }
  for (const [n, info] of Object.entries(NOTES)) {
    if (!pressed.has(info.key)) continue;
    o.notes.push(n);
    if (o.notes.length > 8) o.notes.shift();
    ocarinaTone(info.f, 0.45);
    if (o.notes.slice(-6).join() === SONG_OF_TIME.join()) {
      o.song = true; o.t = 0; o.notes = SONG_OF_TIME.slice();
      break;
    }
  }
}

// Every Song of Time block on the screen swaps: solid blocks vanish, markers become blocks.
function songOfTime() {
  const swap = { Q: 'q', q: 'Q', U: 'u', u: 'U' };
  let any = false;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const to = swap[grid[r][c]];
      if (!to) continue;
      grid[r][c] = to;
      any = true;
      puff(c * T + 8, r * T + 8, '#a4e4fc', 12, 1.4);
    }
  if (!any) return;
  sfx('secret');
  // anyone caught where a block appeared (or standing on one that sank) gets pushed to open ground
  unstick(player);
  enemies.forEach(unstick);
}

function unstick(e) {
  if (boxFree(e, e.x, e.y)) return;
  for (let d = 1; d <= 32; d++)
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]])
      if (boxFree(e, e.x + dx * d, e.y + dy * d)) { e.x += dx * d; e.y += dy * d; return; }
}

function drawNote(n, x, y, col) {
  const N = NOTES[n];
  text(N.glyph, x, y, col || N.col);
}

// The staff panel along the bottom, like Ocarina of Time's: a header with the controls,
// five orange-red lines, a treble clef, and the notes you've played.
function drawOcarina() {
  const o = oca, X = 8, Y = HUD + PH - 58, W = 240;
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = '#000000'; ctx.fillRect(X, Y, W, 54);
  ctx.globalAlpha = 1;
  if (o.song) text('SONG OF TIME', 128, Y + 5, '#fcfcfc', 8, 'center');
  else {
    const s = 'PLAY: ' + BTN.attack + ' ▶ ◀ ▲ ▼  STOP: ' + BTN.item;
    [...s].forEach((ch, i) => text(ch, 32 + i * 8, Y + 5, i === 6 ? NOTES.A.col : '▶◀▲▼'.includes(ch) ? '#f8b800' : '#fcfcfc'));
  }
  const lineY = i => Y + 22 + i * 6;
  ctx.fillStyle = '#e45c10';
  for (let i = 0; i < 5; i++) ctx.fillRect(X + 12, lineY(i), W - 24, 1);
  ctx.drawImage(SPR.clef, X + 16, Y + 18, SPR.clef.width * 2, SPR.clef.height * 2);
  o.notes.forEach((n, i) => {
    const lit = o.song && i === o.idx;
    drawNote(n, 50 + i * 22, lineY(NOTES[n].line) - 3, lit ? '#fcfcfc' : null);
  });
}
