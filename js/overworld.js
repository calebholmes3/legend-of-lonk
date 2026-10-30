// ---------- Overworld generation ----------
let seed = 1;

// smooth noise over screen coordinates, so biomes form regions several screens wide
function vnoise(x, y, salt) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const s = t => t * t * (3 - 2 * t), u = s(xf), v = s(yf);
  const n = (a, b) => h3(a, b, seed * 31 + salt);
  const top = n(xi, yi) * (1 - u) + n(xi + 1, yi) * u;
  const bot = n(xi, yi + 1) * (1 - u) + n(xi + 1, yi + 1) * u;
  return top * (1 - v) + bot * v;
}
function biomeAt(sx, sy) {
  if (sx === 0 && sy === 0) return 'plains';
  // temperature drops as you head north (negative sy)
  const t = vnoise(sx / 5, sy / 5, 1) * 0.75 + vnoise(sx / 2, sy / 2, 2) * 0.25 + sy * 0.008;
  const m = vnoise(sx / 4, sy / 4, 3) * 0.75 + vnoise(sx / 2, sy / 2, 4) * 0.25;
  if (t < 0.36) return 'snow';
  if (t > 0.64) return m < 0.5 ? 'desert' : 'plains';
  if (m > 0.62) return 'lake';
  if (m > 0.5) return 'forest';
  if (m < 0.38) return 'mountain';
  return 'plains';
}
// Exit positions belong to the edge between two screens, so both sides always line up.
const gapH = (x, y) => 2 + Math.floor(h3(x, y, seed * 31 + 5) * 11);  // top edge of screen (x, y): columns g, g+1
const gapV = (x, y) => 2 + Math.floor(h3(x, y, seed * 31 + 6) * 5);   // left edge of screen (x, y): rows g..g+2

// Overlay structures, laid out as tiles. The entrance is a stone shrine with a torch on each side
// and a doorway (E) you walk into; the shop is a merchant between two fires with wares below.
const ENTRANCE_BLOCK = ['.DDD.', 'DDEDD'];
const SHOP_BLOCK = ['D.D.D', '.....', '.....'];
// Song of Time puzzles, each with a heart piece in the pocket: a rock vault sealed by a block (play
// the song to make it vanish), or a pocket across a ravine (play it to raise blocks as stepping stones).
const VAULT_BLOCK = ['RRRRR', 'R...R', 'R...R', 'RRQRR'];
const BRIDGE_BLOCK = ['VVVVV', 'V...V', 'V...V', 'VVuVV', 'VVuVV'];

function genScreen(sx, sy) {
  const biome = biomeAt(sx, sy), B = BIOMES[biome];
  const rnd = mulberry32(Math.floor(h3(sx, sy, seed * 31 + 7) * 4294967296));
  const d = Math.abs(sx) + Math.abs(sy);
  const dungeon = d >= 3 && rnd() < 0.08;
  const shop = !dungeon && d >= 2 && rnd() < 0.05;
  const hasChest = !dungeon && !shop && d > 0 && rnd() < 0.25;

  const g = [];
  for (let r = 0; r < ROWS; r++) {
    g.push([]);
    for (let c = 0; c < COLS; c++) {
      const edge = r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1;
      const deco = rnd();
      g[r].push(edge ? B.border : deco < 0.12 ? ',' : B.flowers && deco < 0.16 ? 'f' : '.');
    }
  }
  const top = gapH(sx, sy), bottom = gapH(sx, sy + 1), left = gapV(sx, sy), right = gapV(sx + 1, sy);
  g[0][top] = g[0][top + 1] = '.';
  g[ROWS - 1][bottom] = g[ROWS - 1][bottom + 1] = '.';
  for (let k = 0; k < 3; k++) { g[left + k][0] = '.'; g[right + k][COLS - 1] = '.'; }

  const ponds = B.ponds >= 1 ? 2 + Math.floor(rnd() * 2) : rnd() < B.ponds ? 1 : 0;
  for (let k = 0; k < ponds; k++) {
    const w = 2 + Math.floor(rnd() * 3), h = 2 + Math.floor(rnd() * 2);
    const c0 = 2 + Math.floor(rnd() * (COLS - 4 - w)), r0 = 2 + Math.floor(rnd() * (ROWS - 4 - h));
    for (let r = r0; r < r0 + h; r++) for (let c = c0; c < c0 + w; c++) g[r][c] = 'W';
  }
  const density = d === 0 ? B.density / 2 : B.density;
  for (let r = 2; r < ROWS - 2; r++)
    for (let c = 2; c < COLS - 2; c++)
      if (g[r][c] !== 'W' && rnd() < density) g[r][c] = B.obs[Math.floor(rnd() * B.obs.length)];

  // drop in a structure first (entrance, shop or ravine island), then carve paths from every exit to a hub around it
  const exits = [[top, 1], [top + 1, 1], [bottom, ROWS - 2], [bottom + 1, ROWS - 2]];
  for (let k = 0; k < 3; k++) exits.push([1, left + k], [COLS - 2, right + k]);
  const snapshot = g.map(row => row.slice());
  let island = null, entrance = null, shopInfo = null, vault = null;
  if (dungeon) entrance = placeBlock(g, ENTRANCE_BLOCK, rnd);
  else if (shop) shopInfo = placeBlock(g, SHOP_BLOCK, rnd);
  else if (d > 0 && rnd() < 0.1) island = placeIsland(g, exits, rnd);
  else if (d > 0 && rnd() < 0.06) {
    vault = placeBlock(g, rnd() < 0.5 ? VAULT_BLOCK : BRIDGE_BLOCK, rnd);
    vault.piece = [vault.c0 + 2, vault.r0 + 1];
  }
  let hub = carvePaths(g, island || entrance || shopInfo || vault, exits, rnd);
  if (!hub) {
    // couldn't route around it, so leave it out
    for (let r = 0; r < ROWS; r++) g[r] = snapshot[r].slice();
    island = entrance = shopInfo = vault = null;
    hub = carvePaths(g, null, exits, rnd);
  }
  if (shopInfo) {
    const { c0, r0 } = shopInfo;
    shopInfo.items = [
      { type: 'piece', price: 50, c: c0, r: r0 + 1 },
      { type: 'mystery', price: 50, c: c0 + 2, r: r0 + 1 },
      { type: 'arrows', price: 10, c: c0 + 4, r: r0 + 1 },
    ];
  }
  const feature = island || entrance || shopInfo || vault;
  return {
    g, biome, hub, d, island, entrance, shop: shopInfo, vault, dungeon: null, islandTaken: false,
    chest: hasChest ? placeChest(g, hub, exits, feature, rnd) : null,
  };
}

// Overworld chests sit out in the open from the start, somewhere you can walk to but not right at an exit.
function placeChest(g, hub, exits, feature, rnd) {
  const reserved = feature ? feature.reserved : new Set();
  const cells = reachable(g, hub).filter(([c, r]) =>
    !reserved.has(c + ',' + r) && exits.every(([ec, er]) => Math.abs(ec - c) + Math.abs(er - r) > 2));
  if (!cells.length) return null;
  const [c, r] = cells[Math.floor(rnd() * cells.length)];
  return { c, r, open: false };
}

// Stamp a structure near the middle-top of the screen, clearing a ring of ground around it so it
// stands out. Paths are routed to the tile just below its center.
function placeBlock(g, art, rnd) {
  const h = art.length, w = art[0].length;
  const c0 = 3 + Math.floor(rnd() * (COLS - 5 - w)), r0 = 2 + Math.floor(rnd() * 3);
  for (let r = r0 - 1; r <= r0 + h; r++)
    for (let c = c0 - 1; c <= c0 + w; c++) g[r][c] = '.';
  const reserved = new Set();
  art.forEach((row, j) => [...row].forEach((ch, i) => {
    g[r0 + j][c0 + i] = ch;
    reserved.add((c0 + i) + ',' + (r0 + j));
  }));
  return { c0, r0, land: [c0 + (w >> 1), r0 + h], reserved };
}

// A 3x3 island ringed by a 1-wide ravine, with a heart piece in the middle. It can sit against the
// screen's edge, where the border wall closes it off in place of ravine. A post on the island and a
// matching post on the mainland line up across the ravine, so only the hookshot gets you there.
function placeIsland(g, exits, rnd) {
  const interior = (c, r) => c >= 1 && r >= 1 && c <= COLS - 2 && r <= ROWS - 2;
  const exitSet = new Set(exits.map(e => e.join(',')));
  for (let tries = 0; tries < 40; tries++) {
    // 5x5 block: the island plus its ring; the ring may overlap the border
    const c0 = Math.floor(rnd() * (COLS - 4)), r0 = Math.floor(rnd() * (ROWS - 4));
    const [sx, sy] = DIRS[DIR_NAMES[Math.floor(rnd() * 4)]];
    const cc = c0 + 2, cr = r0 + 2;
    const post = [cc + sx * 4, cr + sy * 4], land = [cc + sx * 3, cr + sy * 3];
    if (!interior(...post) || !interior(...land)) continue;
    const reserved = new Set([post.join(',')]);
    let sealed = true;
    for (let r = r0; r <= r0 + 4 && sealed; r++)
      for (let c = c0; c <= c0 + 4; c++) {
        if (interior(c, r)) reserved.add(c + ',' + r);
        else if (!SOLID.has(g[r][c])) { sealed = false; break; } // an exit gap would let you walk in
      }
    if (!sealed || [...reserved].some(k => exitSet.has(k))) continue;

    for (let r = r0; r <= r0 + 4; r++)
      for (let c = c0; c <= c0 + 4; c++)
        if (interior(c, r)) g[r][c] = Math.abs(c - cc) <= 1 && Math.abs(r - cr) <= 1 ? '.' : 'V';
    g[cr - sy][cc - sx] = 'P';
    g[post[1]][post[0]] = 'P';
    g[land[1]][land[0]] = '.';
    return { c: cc, r: cr, land, reserved };
  }
  return null;
}

// Pick a hub near the middle, then carve a 2-wide path from each exit (and the feature's landing
// spot) to it. Obstacles on the way are cleared and water gets a bridge; only the feature is off limits.
function carvePaths(g, feature, exits, rnd) {
  const reserved = feature ? feature.reserved : new Set();
  const free = (c, r) => c >= 1 && r >= 1 && c <= COLS - 2 && r <= ROWS - 2 && !reserved.has(c + ',' + r);
  const jc = 6.5 + rnd() * 2, jr = 4 + rnd() * 1.5;
  let hub = null, bestD = Infinity;
  for (let r = 1; r <= ROWS - 3; r++)
    for (let c = 1; c <= COLS - 3; c++) {
      if (!free(c, r) || !free(c + 1, r) || !free(c, r + 1) || !free(c + 1, r + 1)) continue;
      const dd = Math.hypot(c + 0.5 - jc, r + 0.5 - jr);
      if (dd < bestD) { bestD = dd; hub = [c, r]; }
    }
  if (!hub) return null;

  const carve = (c, r) => {
    if (!free(c, r)) return;
    if (g[r][c] === 'W') g[r][c] = '=';
    else if (SOLID.has(g[r][c])) g[r][c] = '.';
  };
  const key = (c, r) => c + ',' + r;
  const route = start => {
    const prev = new Map([[key(...start), null]]), q = [start];
    while (q.length) {
      const [c, r] = q.shift();
      if (c === hub[0] && r === hub[1]) break;
      const nbrs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      if (rnd() < 0.5) nbrs.reverse();
      for (const [dc, dr] of nbrs) {
        const nc = c + dc, nr = r + dr, k = key(nc, nr);
        if (!free(nc, nr) || prev.has(k)) continue;
        prev.set(k, [c, r]);
        q.push([nc, nr]);
      }
    }
    if (!prev.has(key(...hub))) return false;
    for (let cell = hub; cell; cell = prev.get(key(...cell))) {
      const [c, r] = cell;
      carve(c, r); carve(c + 1, r); carve(c, r + 1); carve(c + 1, r + 1);
    }
    return true;
  };
  for (const e of exits) if (!route(e)) return null;
  if (feature && !route(feature.land)) return null;
  return hub;
}

function reachable(g, from) {
  const seen = new Set([from.join(',')]), q = [from];
  while (q.length) {
    const [c, r] = q.shift();
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = c + dc, nr = r + dr;
      if (nc < 1 || nr < 1 || nc >= COLS - 1 || nr >= ROWS - 1) continue;
      const k = nc + ',' + nr;
      if (seen.has(k) || SOLID.has(g[nr][nc])) continue;
      seen.add(k); q.push([nc, nr]);
    }
  }
  return [...seen].map(s => s.split(',').map(Number));
}
