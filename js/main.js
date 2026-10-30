// ---------- Main update ----------
// fn runs at the darkest point of the fade (switching between the overworld and a dungeon)
function startFade(fn) { fade = { t: 0, fn }; state = 'fade'; }

// Test setups, picked by the page address: index.html#ocarina drops you next to a Song of Time vault
// with the ocarina equipped, and index.html#ocarina-bridge next to a ravine bridge.
function startGame() {
  newGame();
  const m = typeof location !== 'undefined' && location.hash.match(/^#ocarina(-bridge)?$/);
  if (m) testOcarina(m[1] ? 'u' : 'Q');
}

function testOcarina(tile) {
  // the nearest puzzle screen of the wanted kind
  for (let d = 1; d < 80; d++)
    for (let sx = -d; sx <= d; sx++)
      for (const sy of [d - Math.abs(sx), Math.abs(sx) - d]) {
        const s = screens[sx + ',' + sy] || genScreen(sx, sy);
        if (!s.vault || !s.g.some(row => row.includes(tile))) continue;
        screens[sx + ',' + sy] = s;
        cur = { sx, sy };
        const [lc, lr] = s.vault.land;
        player.x = lc * T; player.y = lr * T + 1; player.dir = 'up';
        player.bItems.push('ocarina'); player.bItem = 'ocarina';
        pool.splice(pool.indexOf('ocarina'), 1);
        loadScreen();
        enemies = [];
        return;
      }
}

function update() {
  frame++;
  if (state === 'title') {
    if (pressed.has('start') || pressed.has('attack')) startGame();
    return;
  }
  if (state === 'dead') {
    stateT++;
    updateParts();
    if (stateT > 60 && pressed.has('start')) startGame();
    return;
  }
  if (state === 'fade') {
    if (++fade.t === 20) fade.fn();
    if (fade.t >= 40) { state = 'play'; fade = null; }
    return;
  }
  if (state === 'scroll') {
    if (++scroll.t >= scroll.dur) { state = 'play'; loadScreen(); }
    return;
  }
  if (state === 'paused') { updatePause(); return; }
  if (state === 'ocarina') { updateOcarina(); return; } // the world stands still while you play
  // the world also stands still while Lonk holds up something he just got
  if (player.hold > 0) { player.hold--; updateParts(); return; }
  if (pressed.has('start')) { state = 'paused'; sfx('pause'); return; }
  if (quake > 0) quake--;
  updatePlayer();
  if (state !== 'play') return;
  updateHook();
  // step into a dungeon's doorway to go down the stairs
  const pc = center(player);
  if (!dun && scr.entrance && inPlay(pc.x, pc.y) && tileAt(pc.x, pc.y) === 'E') { startFade(enterDungeon); sfx('stairs'); return; }
  checkEdges();
  if (state !== 'play') return;
  updateArrows();
  updateBoomer();
  updateEnemies();
  updateProjs();
  updatePickups();
  if (dun) updateRoom();
  updateChest();
  if (scr.shop) updateShop();
  updateParts();
}

// ---------- Loop ----------
let last = performance.now(), acc = 0;
const STEP = 1000 / 60;
function loop(now) {
  acc += Math.min(100, now - last);
  last = now;
  while (acc >= STEP) {
    update();
    pressed.clear();
    acc -= STEP;
  }
  render();
  present();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
