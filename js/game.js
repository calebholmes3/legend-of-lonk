// ---------- Game state ----------
let state = 'title', stateT = 0, frame = 0;
let screens = {}, visited = new Set(), scr = null, grid = null, cur = { sx: 0, sy: 0 };
let dun = null, dpos = { x: 0, y: 0 }; // the dungeon you're in (null on the overworld) and the room within it
let fade = null, quake = 0;
let player, enemies = [], projs = [], pickups = [], parts = [], arrows = [], boomer = null, hook = null;
let scroll = null;
let rupees = 0, startTime = 0, endTime = 0;
let pool = [], bossesBeaten = 0, farthest = 0, dungeonsFound = 0;
let best = 0, newBest = false;
try { best = +localStorage.getItem('lonkBest') || 0; } catch (e) {}

const MAX_ARROWS = 50;
const curKey = () => cur.sx + ',' + cur.sy;
const hasBow = () => player.bItems.includes('bow');

function newGame() {
  seed = (Math.random() * 1e9) | 0;
  screens = {}; visited = new Set();
  // 'sword' appears twice: each one upgrades the sword a level
  pool = ['bow', 'shield', 'armor', 'boomerang', 'hookshot', 'ocarina', 'sword', 'sword'];
  bossesBeaten = 0; farthest = 0; dungeonsFound = 0; rupees = 0; newBest = false;
  cur = { sx: 0, sy: 0 };
  dun = null; fade = null; quake = 0;
  const s0 = screens['0,0'] = genScreen(0, 0);
  player = {
    x: s0.hub[0] * T + 8, y: s0.hub[1] * T + 4, ox: 3, oy: 6, w: 10, h: 9,
    dir: 'down', hp: 3 * Q, max: 3 * Q, pieces: 0, atk: 0, inv: 0, kbt: 0, kbx: 0, kby: 0, walk: 0, hit: new Set(),
    shoot: 0, shootKind: null, hold: 0, holdItem: null,
    shield: false, armor: false, sword: 1, bItems: [], bItem: null, arrows: 0,
  };
  loadScreen();
  state = 'play'; stateT = 0;
  startTime = performance.now();
}

function loadScreen() {
  enemies = []; projs = []; pickups = []; parts = []; arrows = []; boomer = null; hook = null;
  if (dun) { loadRoom(); return; }
  const key = curKey();
  scr = screens[key] || (screens[key] = genScreen(cur.sx, cur.sy));
  grid = scr.g;
  if (!visited.has(key)) { visited.add(key); farthest = Math.max(farthest, scr.d); }
  // the heart piece on a ravine island or inside a Song of Time puzzle
  const prize = scr.island ? [scr.island.c, scr.island.r] : scr.vault ? scr.vault.piece : null;
  if (prize && !scr.islandTaken) pickups.push({ type: 'piece', x: prize[0] * T + 8, y: prize[1] * T + 8, t: Infinity });
  if (scr.shop) return; // no fighting in the shop

  const B = BIOMES[scr.biome];
  const n = scr.d === 0 ? 2 : Math.min(7, 2 + Math.floor(scr.d / 3) + Math.floor(Math.random() * 2));
  const toughChance = Math.min(0.75, scr.d * 0.06);
  const cells = reachable(grid, scr.hub)
    .filter(([c, r]) => Math.hypot(c * T - player.x, r * T - player.y) > 64)
    .sort(() => Math.random() - 0.5);
  for (let i = 0; i < n && i < cells.length; i++) {
    const [c, r] = cells[i];
    enemies.push(makeEnemy(Math.random() < B.octo ? 'octo' : 'slime', c * T, r * T, Math.random() < toughChance));
  }
}

function makeEnemy(type, x, y, tough) {
  const e = {
    type, x, y, tough, dir: DIR_NAMES[Math.floor(Math.random() * 4)],
    timer: 0, kbt: 0, kbx: 0, kby: 0, flash: 0, pause: 0, hop: 0, vx: 0, vy: 0, stun: 0,
    anim: Math.floor(Math.random() * 60), spawn: 24, spd: tough ? 1.3 : 1,
  };
  if (type === 'octo') Object.assign(e, { hp: tough ? 2 : 1, ox: 1, oy: 2, w: 14, h: 12 });
  if (type === 'slime') Object.assign(e, { hp: tough ? 3 : 2, ox: 1, oy: 6, w: 14, h: 9, timer: 30 + Math.random() * 40 });
  if (type === 'boss') {
    const hp = BOSS_TIERS[scr.tier].hp || 8 + 2 * Math.min(8, Math.floor(scr.d / 4));
    Object.assign(e, {
      hp, maxHp: hp, ox: 3, oy: 3, w: 26, h: 26, timer: 90, size: 32, spawn: 40, pal: scr.bossPal,
      mode: 'stalk', mt: 120, cdx: 0, cdy: 0, ifr: 0,
    });
  }
  return e;
}

// ---------- Collision helpers ----------
function solidPx(px, py, isPlayer) {
  const c = Math.floor(px / T), r = Math.floor(py / T);
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return !isPlayer;
  return SOLID.has(grid[r][c]);
}
const tileAt = (px, py) => grid[Math.floor(py / T)][Math.floor(px / T)];
const inPlay = (px, py) => px >= 0 && py >= 0 && px < PW && py < PH;
function boxFree(e, x, y) {
  const isP = e === player;
  const x0 = x + e.ox, y0 = y + e.oy, x1 = x0 + e.w - 0.01, y1 = y0 + e.h - 0.01;
  for (let yy = y0; ; yy = Math.min(yy + 8, y1)) {
    for (let xx = x0; ; xx = Math.min(xx + 8, x1)) {
      if (solidPx(xx, yy, isP)) return false;
      if (xx >= x1) break;
    }
    if (yy >= y1) break;
  }
  return true;
}
// slide the player around corners when they are almost lined up with a gap
function nudge(e, axis, d) {
  for (let k = 1; k <= 7; k++) {
    for (const s of [-1, 1]) {
      const nx = axis === 'x' ? e.x + s * k : e.x + d;
      const ny = axis === 'y' ? e.y + s * k : e.y + d;
      if (boxFree(e, nx, ny)) {
        if (axis === 'x' && boxFree(e, e.x + s, e.y)) e.x += s;
        if (axis === 'y' && boxFree(e, e.x, e.y + s)) e.y += s;
        return;
      }
    }
  }
}
function move(e, dx, dy) {
  let blocked = false;
  if (dx) {
    if (boxFree(e, e.x + dx, e.y)) e.x += dx;
    else { blocked = true; if (e === player && !dy) nudge(e, 'y', dx); }
  }
  if (dy) {
    if (boxFree(e, e.x, e.y + dy)) e.y += dy;
    else { blocked = true; if (e === player && !dx) nudge(e, 'x', dy); }
  }
  return blocked;
}
const hb = e => ({ x: e.x + e.ox, y: e.y + e.oy, w: e.w, h: e.h });
const center = e => ({ x: e.x + e.ox + e.w / 2, y: e.y + e.oy + e.h / 2 });
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// ---------- Effects & pickups ----------
function puff(x, y, col = '#fcfcfc', n = 10, sp = 1.5) {
  for (let i = 0; i < n; i++) {
    const a = Math.PI * 2 * i / n + Math.random() * 0.3;
    const v = sp * (0.5 + Math.random());
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 20 + Math.random() * 10, col, s: 2 });
  }
}
// arrows only drop once you own the bow
function drop(x, y) {
  const r = Math.random();
  const type = r < 0.22 ? 'rupee' : r < 0.28 ? 'rupee5' : r < 0.41 ? 'heart' : r < 0.51 && hasBow() ? 'arrows' : null;
  if (type) pickups.push({ type, x, y, t: 480 });
}
function collect(k) {
  k.dead = true;
  if (k.type === 'rupee') { rupees += 1; sfx('rupee'); }
  else if (k.type === 'rupee5') { rupees += 5; sfx('rupee'); }
  else if (k.type === 'heart') { player.hp = Math.min(player.max, player.hp + Q); sfx('heart'); }
  else if (k.type === 'arrows') { player.arrows = Math.min(MAX_ARROWS, player.arrows + 5); sfx('rupee'); }
  else if (k.type === 'key') { scr.keyTaken = true; dun.keys++; sfx('key'); }
  else if (k.type === 'fairy') { scr.fairyTaken = true; player.hp = player.max; sfx('heart'); }
  else if (k.type === 'piece') { scr.islandTaken = true; giveItem(heartsMaxed() ? 'rupees50' : 'piece'); }
  else if (k.type === 'container') { scr.containerTaken = true; giveItem(heartsMaxed() ? 'rupees50' : 'container'); }
}

const takeFromPool = () => pool.splice(Math.floor(Math.random() * pool.length), 1)[0];

function giveItem(item) {
  const p = player;
  if (item === 'shield') p.shield = true;
  if (item === 'armor') p.armor = true;
  if (item === 'sword') p.sword = Math.min(3, p.sword + 1);
  if (B_SLOTS.includes(item)) {
    p.bItems.push(item);
    if (!p.bItem) p.bItem = item;
  }
  if (item === 'bow') p.arrows = Math.min(MAX_ARROWS, p.arrows + 10); // comes with a starter quiver
  if (item === 'piece') {
    p.pieces++;
    if (p.pieces >= 4) { p.pieces = 0; p.max = Math.min(MAX_HEARTS * Q, p.max + Q); }
    p.hp = p.max; // every piece also refills your hearts
  }
  if (item === 'container') { p.max = Math.min(MAX_HEARTS * Q, p.max + Q); p.hp = p.max; }
  if (item === 'hearts') p.hp = Math.min(p.max, p.hp + 3 * Q);
  if (item === 'arrows') p.arrows = Math.min(MAX_ARROWS, p.arrows + 10);
  if (item === 'rupees') rupees += 20;
  if (item === 'rupees50') rupees += 50;
  p.hold = 90; p.holdItem = item;
  p.atk = 0; p.shoot = 0; p.queued = false;
  sfx('item');
}

// ---------- Chests ----------
// Overworld chests hold small supplies. In a dungeon, the item chest takes from the item pool
// (50 rupees once the pool is empty) and the rupee chest holds 50 rupees.
function chestLoot() {
  if (!scr.room) return shuffle(hasBow() ? ['hearts', 'rupees', 'arrows'] : ['hearts', 'rupees'])[0];
  return scr.loot === 'item' && pool.length ? takeFromPool() : 'rupees50';
}

function updateChest() {
  if (scr.room && scr.loot && !scr.chest && scr.cleared) revealChest();
  const ch = scr.chest;
  if (ch && !ch.open && overlap({ x: ch.c * T - 1, y: ch.r * T - 1, w: 18, h: 18 }, hb(player))) {
    ch.open = true;
    giveItem(chestLoot());
  }
}

// a dungeon chest appears near the middle of the room (next to where the key drops) once it's cleared
function revealChest() {
  const pc = center(player), [hc, hr] = scr.hub;
  const cells = reachable(grid, scr.hub)
    .filter(([c, r]) => !(c === hc && r === hr) && Math.hypot(c * T + 8 - pc.x, r * T + 8 - pc.y) > 28)
    .sort((a, b) => Math.hypot(a[0] - hc - 0.5, a[1] - hr - 0.5) - Math.hypot(b[0] - hc - 0.5, b[1] - hr - 0.5));
  const [c, r] = cells[0] || scr.hub;
  scr.chest = { c, r, open: false };
  puff(c * T + 8, r * T + 8, '#f8d878', 14, 1.8);
  sfx('chest');
}

// ---------- Shop ----------
// Walk onto an item to buy it. The heart piece and mystery item are one each per shop;
// arrows are always in stock.
function shopStock(it) {
  if (it.sold) return false;
  if (it.type === 'piece') return !heartsMaxed();
  if (it.type === 'mystery') return pool.length > 0;
  return true;
}

function updateShop() {
  const p = player;
  if (p.hold > 0) return;
  for (const it of scr.shop.items) {
    const on = shopStock(it) && overlap({ x: it.c * T + 3, y: it.r * T + 2, w: 10, h: 12 }, hb(p));
    if (on && !it.touch) {
      if (rupees < it.price || (it.type === 'arrows' && p.arrows >= MAX_ARROWS)) sfx('error');
      else {
        rupees -= it.price;
        if (it.type === 'arrows') { p.arrows = Math.min(MAX_ARROWS, p.arrows + 10); sfx('rupee'); }
        else { it.sold = true; giveItem(it.type === 'piece' ? 'piece' : takeFromPool()); }
      }
    }
    it.touch = on;
  }
}
