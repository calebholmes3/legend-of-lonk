// ---------- Dungeons ----------
// A dungeon is a handful of rooms on a grid. A main line runs from the entrance room up to the boss;
// the boss door and (in longer dungeons) one door partway along are locked. Keys and the two chests
// sit in side rooms, and each one appears only once you've cleared that room's enemies.

// door tiles in the wall, and the floor tiles just inside them
const DOOR_TILES = { up: [[7, 0], [8, 0]], down: [[7, ROWS - 1], [8, ROWS - 1]], left: [[0, 5]], right: [[COLS - 1, 5]] };
const DOOR_IN = { up: [[7, 1], [8, 1]], down: [[7, ROWS - 2], [8, ROWS - 2]], left: [[1, 5]], right: [[COLS - 2, 5]] };
// both rooms on either side of a door share one entry, so unlocking it from one side opens both
const edgeKey = (x, y, dir) =>
  dir === 'right' ? x + ',' + y + 'h' : dir === 'left' ? (x - 1) + ',' + y + 'h' :
  dir === 'down' ? x + ',' + y + 'v' : x + ',' + (y - 1) + 'v';

// null (wall), 'open', 'locked', or 'exit' (the entrance room's south door back outside)
function doorState(edges, rm, dir) {
  if (rm.kind === 'start' && dir === 'down') return 'exit';
  return edges.get(edgeKey(rm.x, rm.y, dir)) || null;
}

function applyDoors(rm, edges) {
  for (const dir of DIR_NAMES) {
    const st = doorState(edges, rm, dir);
    if (!st) continue;
    const t = rm.shut ? 'S' : st === 'locked' ? 'L' : 'o';
    for (const [c, r] of DOOR_TILES[dir]) rm.g[r][c] = t;
  }
}

// Dungeons get harder in the order you find them: tier 0 and 1 are your first two, tier 2 is full strength.
function genDungeon(sx, sy, d) {
  const rnd = mulberry32(Math.floor(h3(sx, sy, seed * 31 + 11) * 4294967296));
  const biome = 'dun' + Math.floor(rnd() * DUN_PALS.length);
  const tier = Math.min(2, dungeonsFound++);
  const rooms = new Map(), edges = new Map();
  const at = (x, y) => rooms.get(x + ',' + y);
  const add = (x, y, kind) => {
    const rm = {
      x, y, kind, biome, d, tier, room: true, boss: kind === 'boss', bossPal: Math.floor(rnd() * BOSS_PALS.length),
      bossDead: false, containerTaken: false, key: false, keyTaken: false, loot: null, chest: null,
      cleared: kind === 'start' || kind === 'rest', seen: false, shut: false, fairyTaken: false,
    };
    rooms.set(x + ',' + y, rm);
    return rm;
  };

  // The main line never heads south or doubles back, so it can't run into itself. Its last two rooms
  // are a rest room with a healing fairy, then the boss behind the locked door.
  const len = 5 + Math.floor(rnd() * 2) + (d >= 10 ? 1 : 0);
  const main = [add(0, 0, 'start')];
  let last = 'up';
  while (main.length < len) {
    const prev = main[main.length - 1];
    const opts = ['up', 'up', 'left', 'right'].filter(dir => dir !== { left: 'right', right: 'left' }[last]);
    const dir = opts[Math.floor(rnd() * opts.length)], [dx, dy] = DIRS[dir];
    const rm = add(prev.x + dx, prev.y + dy, main.length === len - 1 ? 'boss' : main.length === len - 2 ? 'rest' : 'room');
    edges.set(edgeKey(prev.x, prev.y, dir), 'open');
    rm.from = dir;
    main.push(rm);
    last = dir;
  }
  const lock = i => edges.set(edgeKey(main[i].x, main[i].y, main[i + 1].from), 'locked');
  lock(len - 2);
  const pre = len - 3; // the last ordinary room before the rest room
  const mid = len >= 6 ? 1 + Math.floor(rnd() * (len - 5)) : 0;
  if (mid) lock(mid);

  // a side room hanging off one of main[lo..hi]; if there's no space, a main room in that range that passes ok()
  const pick = (lo, hi, ok) => {
    for (let t = 0; t < 16; t++) {
      const host = main[lo + Math.floor(rnd() * (hi - lo + 1))];
      const dir = DIR_NAMES[Math.floor(rnd() * 4)], [dx, dy] = DIRS[dir];
      const x = host.x + dx, y = host.y + dy;
      if (at(x, y) || (x === 0 && y === 1)) continue;
      edges.set(edgeKey(host.x, host.y, dir), 'open');
      return add(x, y, 'room');
    }
    const opts = main.slice(Math.max(1, lo), hi + 1).filter(ok);
    return opts.length ? opts[Math.floor(rnd() * opts.length)] : main[hi];
  };
  // each key is reachable before the door it opens
  if (mid) pick(0, mid, rm => !rm.key).key = true;
  pick(mid ? mid + 1 : 0, pre, rm => !rm.key).key = true;
  pick(0, pre, rm => !rm.loot).loot = 'item';
  const r2 = pick(0, pre, rm => !rm.loot);
  if (!r2.loot) r2.loot = 'rupees';

  for (const rm of rooms.values()) { buildRoom(rm, edges, rnd); applyDoors(rm, edges); }
  return { rooms, edges, keys: 0, done: false };
}

function buildRoom(rm, edges, rnd) {
  const g = [];
  for (let r = 0; r < ROWS; r++)
    g.push(Array.from({ length: COLS }, (_, c) => r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1 ? 'w' : '.'));
  if (rm.boss) {
    // pillars the guardian can be baited into charging
    for (const [c, r] of [[3, 3], [12, 3], [3, 7], [12, 7]]) g[r][c] = 'k';
  } else if (rm.kind === 'room') {
    // blocks scattered with mirror symmetry, like the original's room layouts
    for (let r = 2; r <= ROWS - 3; r++)
      for (let c = 2; c < COLS / 2; c++)
        if (rnd() < 0.12) g[r][c] = g[r][COLS - 1 - c] = 'k';
  }
  const exits = DIR_NAMES.filter(dir => doorState(edges, rm, dir)).flatMap(dir => DOOR_IN[dir]);
  rm.g = g;
  rm.hub = carvePaths(g, null, exits, rnd) || [7, 4];
}

function loadRoom() {
  const rm = scr = dun.rooms.get(dpos.x + ',' + dpos.y);
  grid = rm.g;
  rm.seen = true;
  if (rm.boss) {
    if (!rm.bossDead) {
      // spawn the guardian in whichever arena spot is farthest from the player
      const pc = center(player);
      const far = ([c, r]) => Math.hypot(c * T + 16 - pc.x, r * T + 16 - pc.y);
      const [bc, br] = [[5, 2], [9, 2], [5, 6], [9, 6], [7, 4]].sort((a, b) => far(b) - far(a))[0];
      enemies.push(makeEnemy('boss', bc * T, br * T, false));
      sfx('boss');
    } else if (!rm.containerTaken) {
      pickups.push({ type: 'container', x: 128, y: 88, t: Infinity });
    }
    return;
  }
  if (rm.kind === 'rest' && !rm.fairyTaken) pickups.push({ type: 'fairy', x: 128, y: 88, t: Infinity });
  if (!rm.cleared) {
    // your first dungeon has 1-2 plain enemies per room, the second 2-3 with a few tough ones
    const n = [1, 2, 3][rm.tier] + Math.floor(Math.random() * (rm.tier < 2 ? 2 : 3));
    const toughChance = [0, 0.15, Math.min(0.8, 0.25 + rm.d * 0.04)][rm.tier];
    const cells = reachable(grid, rm.hub)
      .filter(([c, r]) => Math.hypot(c * T - player.x, r * T - player.y) > 64)
      .sort(() => Math.random() - 0.5);
    for (let i = 0; i < n && i < cells.length; i++) {
      const [c, r] = cells[i];
      enemies.push(makeEnemy(Math.random() < 0.5 ? 'octo' : 'slime', c * T, r * T, Math.random() < toughChance));
    }
  } else if (rm.key && !rm.keyTaken) {
    dropKey(false);
  }
}

function dropKey(fx) {
  const [c, r] = scr.hub, x = c * T + 8, y = r * T + 8;
  pickups.push({ type: 'key', x, y, t: Infinity });
  if (fx) { puff(x, y, '#f8b800', 12, 1.6); sfx('key'); }
}

const insideRoom = p => {
  const b = hb(p);
  return b.x >= T && b.y >= T && b.x + b.w <= PW - T && b.y + b.h <= PH - T;
};

function updateRoom() {
  const rm = scr;
  if (!rm.cleared && enemies.length === 0) {
    rm.cleared = true;
    if (rm.key && !rm.keyTaken) dropKey(true);
  }
  // the boss room's doors bar shut once you're all the way in, and open when the guardian falls
  if (rm.boss && !rm.bossDead && !rm.shut && insideRoom(player)) { rm.shut = true; applyDoors(rm, dun.edges); sfx('shut'); }
  if (rm.shut && rm.bossDead) { rm.shut = false; applyDoors(rm, dun.edges); sfx('unlock'); }
  // walk into a locked door with a key to open it
  if (dun.keys > 0 && !rm.shut) {
    const b = hb(player), near = { x: b.x - 2, y: b.y - 2, w: b.w + 4, h: b.h + 4 };
    for (const dir of DIR_NAMES) {
      const k = edgeKey(rm.x, rm.y, dir);
      if (dun.edges.get(k) !== 'locked') continue;
      const tiles = DOOR_TILES[dir], [c0, r0] = tiles[0];
      if (!overlap(near, { x: c0 * T, y: r0 * T, w: tiles.length * T, h: T })) continue;
      dun.edges.set(k, 'open');
      dun.keys--;
      applyDoors(rm, dun.edges);
      const [dx, dy] = DIRS[dir], nb = dun.rooms.get((rm.x + dx) + ',' + (rm.y + dy));
      if (nb) applyDoors(nb, dun.edges);
      sfx('unlock');
      break;
    }
  }
}

function enterDungeon() {
  dun = scr.dungeon || (scr.dungeon = genDungeon(cur.sx, cur.sy, scr.d));
  dpos = { x: 0, y: 0 };
  player.x = 7 * T + 8; player.y = 8 * T; player.dir = 'up';
  loadScreen();
}

function exitDungeon() {
  dun = null;
  const [lc, lr] = screens[curKey()].entrance.land;
  player.x = lc * T; player.y = lr * T + 1; player.dir = 'down';
  loadScreen();
}
