// ---------- Biomes & tiles ----------
// Biome colors are picked from the NES palette; tiles are flat 3-4 color art like the original.
const BIOMES = {
  plains: {
    name: 'GREEN PLAINS', map: '#00a800',
    ground: ['#fcd8a8', '#e4b070'], tuft: '#00a800', flowers: true,
    tree: 'round', treeC: ['#005800', '#00a800', '#58d854'],
    bush: ['#005800', '#00a800', '#b8f818'], rock: ['#881400', '#c84c0c', '#e45c10'],
    water: ['#2038ec', '#3cbcfc'],
    border: 'T', obs: 'BBTR', density: 0.09, ponds: 0.3, octo: 0.55,
  },
  forest: {
    name: 'DEEP WOODS', map: '#005800',
    ground: ['#58d854', '#00a800'], tuft: '#00a800', flowers: true,
    tree: 'round', treeC: ['#005800', '#00a800', '#b8f818'],
    bush: ['#005800', '#00a800', '#b8f818'], rock: ['#503000', '#ac7c00', '#f8b800'],
    water: ['#2038ec', '#3cbcfc'],
    border: 'T', obs: 'TTTB', density: 0.2, ponds: 0.15, octo: 0.4,
  },
  desert: {
    name: 'SUNBAKED DESERT', map: '#f8b800',
    ground: ['#f8d878', '#e4a044'], tuft: '#ac7c00', flowers: false,
    tree: 'cactus', treeC: ['#005800', '#00a800', '#b8f818'],
    bush: ['#ac7c00', '#f8b800', '#fce0a8'], rock: ['#881400', '#e45c10', '#fca044'],
    water: ['#0058f8', '#3cbcfc'],
    border: 'R', obs: 'RTTB', density: 0.08, ponds: 0.1, octo: 0.75,
  },
  lake: {
    name: 'MISTY LAKES', map: '#0058f8',
    ground: ['#fce0a8', '#e4b070'], tuft: '#00a800', flowers: false,
    tree: 'round', treeC: ['#005800', '#00a800', '#58d854'],
    bush: ['#005800', '#00a800', '#b8f818'], rock: ['#881400', '#c84c0c', '#e45c10'],
    water: ['#2038ec', '#3cbcfc'],
    border: 'T', obs: 'BBT', density: 0.08, ponds: 1, octo: 0.35,
  },
  mountain: {
    name: 'ROCKY HIGHLANDS', map: '#bcbcbc',
    ground: ['#bcbcbc', '#7c7c7c'], tuft: '#7c7c7c', flowers: false,
    tree: 'round', treeC: ['#005800', '#00a800', '#58d854'],
    bush: ['#005800', '#00a800', '#58d854'], rock: ['#881400', '#c84c0c', '#e45c10'],
    water: ['#2038ec', '#3cbcfc'],
    border: 'R', obs: 'RRRB', density: 0.18, ponds: 0, octo: 0.6,
  },
  snow: {
    name: 'FROSTED PEAKS', map: '#fcfcfc',
    ground: ['#fcfcfc', '#bcbcbc'], tuft: '#bcbcbc', flowers: false,
    tree: 'pine', treeC: ['#005800', '#00a800', '#fcfcfc'],
    bush: ['#005800', '#00a800', '#fcfcfc'], rock: ['#7c7c7c', '#bcbcbc', '#fcfcfc'],
    water: ['#0058f8', '#a4e4fc'],
    border: 'T', obs: 'TTRB', density: 0.12, ponds: 0.2, octo: 0.5,
  },
};

function mk(fn) {
  const c = document.createElement('canvas');
  c.width = c.height = 16;
  fn(c.getContext('2d'));
  return c;
}
function disc(x, cx, cy, r, col) {
  x.fillStyle = col;
  for (let j = -r; j <= r; j++)
    for (let i = -r; i <= r; i++)
      if (i * i + j * j <= r * r + r * 0.8) x.fillRect(Math.floor(cx + i), Math.floor(cy + j), 1, 1);
}
// paint a 16x16 pattern: d = dark, m = mid, l = light, b = trunk; '.' leaves the ground showing
function paint(x, rows, pal) {
  rows.forEach((row, y) => {
    for (let i = 0; i < row.length; i++) {
      const col = pal[row[i]];
      if (!col) continue;
      x.fillStyle = col;
      x.fillRect(i, y, 1, 1);
    }
  });
}
const TREE_ROUND = [
  '....dddddddd....',
  '..ddmmmmmmmmdd..',
  '.dmmllmmmmllmmd.',
  '.dmllmmmmllmmmd.',
  'dmmmmmddmmmmmmmd',
  'dmllmmdmmmllmmmd',
  'dmlmmmmdmmlmmmdd',
  'dmmmmmdmmmmmmddd',
  'dmmddmmmmddmmmmd',
  '.dmmmmmddmmmmmd.',
  '.dmmmmdmmdmmmmd.',
  '..ddmmmmmmmmdd..',
  '....dddmmddd....',
  '......dbbd......',
  '......dbbd......',
  '.....dddddd.....',
];
const TREE_PINE = [
  '.......dd.......',
  '......dlld......',
  '.....dllmmd.....',
  '....dmmmmmmd....',
  '....dllllmmd....',
  '...dmmmmmmmmd...',
  '..dmmmmmmmmmmd..',
  '...dllllmmmmd...',
  '..dmmmmmmmmmmd..',
  '.dmmmmmmmmmmmmd.',
  'dmmmmmmmmmmmmmmd',
  '.ddddddmmdddddd.',
  '.......bb.......',
  '.......bb.......',
  '......dbbd......',
  '................',
];
const TREE_CACTUS = [
  '......dmmd......',
  '.....dmlmmd.....',
  '.....dmlmmd.....',
  '.dd..dmlmmd.....',
  'dmmd.dmlmmd.....',
  'dmmd.dmlmmd.dd..',
  'dmmd.dmlmmddmmd.',
  'dmmddmmlmmddmmd.',
  '.dmmmmmlmmmmmmd.',
  '..dddmmlmmmmdd..',
  '.....dmlmmd.....',
  '.....dmlmmd.....',
  '.....dmlmmd.....',
  '.....dmmmmd.....',
  '....dddddddd....',
  '................',
];
const BUSH = [
  '................',
  '................',
  '................',
  '.....dddddd.....',
  '...ddmmmmmmdd...',
  '..dmmllmmmlmmd..',
  '..dmllmmmllmmd..',
  '.dmmmmmdmmmmmmd.',
  '.dmmdmmmmmdmmmd.',
  '.dmmmmmmmmmmmmd.',
  '..dmmmddmmmmmd..',
  '..ddmmmmmmmmdd..',
  '....dddddddd....',
  '................',
  '................',
  '................',
];
const ROCK = [
  '................',
  '.....ddddd......',
  '...ddmmmmmdd....',
  '..dmmllmmmmmd...',
  '.dmmlmmmmmmmmd..',
  '.dmlmmmmmmdmmmd.',
  'dmmmmmmmmdmmmmmd',
  'dmmmmmmmdmmmmmmd',
  'dmmmmmmmmdmmmmdd',
  'dmmddmmmmmdmmmdd',
  'dmmmmddmmmmmmddd',
  'dmmmmmmddmmmdddd',
  '.ddmmmmmmmdddd..',
  '..dddddddddddd..',
  '................',
  '................',
];

// Song of Time block: dark slate stone with a carved sun emblem. D outline, L/E lit and shaded edges,
// m face, d carved lines, l the raised dome of the sun.
const TIME_BLOCK = [
  'DDDDDDDDDDDDDDDD',
  'DLLLLLLLLLLLLLLD',
  'DLdmmmmdlmmmmdED',
  'DLmdmmmdlmmmdmED',
  'DLmmdmddddmdmmED',
  'DLmmmdlllldmmmED',
  'DLddddllmmddddED',
  'DLmmmdlmmmdmmmED',
  'DLmmmmddddmmmmED',
  'DLmmmdmdlmdmmmED',
  'DLmmdmddldmdmmED',
  'DLmdmdmdlmdmdmED',
  'DLdmmdmdlmdmmdED',
  'DLmmdmmdlmmdmmED',
  'DEEEEEEEEEEEEEED',
  'DDDDDDDDDDDDDDDD',
];
const TIME_PAL = { D: '#141c28', E: '#24344a', m: '#3c5470', L: '#6c8cac', d: '#18222e', l: '#58789a' };
// where a block can appear: just a faint dashed outline and emblem
function timeMarker(x, col) {
  paint(x, TIME_BLOCK, { d: col });
  x.fillStyle = col;
  for (let i = 0; i < 16; i += 2) { x.fillRect(i, 0, 1, 1); x.fillRect(15 - i, 15, 1, 1); x.fillRect(0, 15 - i, 1, 1); x.fillRect(15, i, 1, 1); }
}

function makeTileset(b) {
  const ground = (x, dots) => {
    x.fillStyle = b.ground[0]; x.fillRect(0, 0, 16, 16);
    if (dots) { x.fillStyle = b.ground[1]; x.fillRect(3, 5, 1, 1); x.fillRect(11, 12, 1, 1); x.fillRect(12, 3, 1, 1); }
  };
  const water = (x, f) => {
    x.fillStyle = b.water[0]; x.fillRect(0, 0, 16, 16);
    x.fillStyle = b.water[1];
    for (const [yy, xo] of [[3, 1], [8, 7], [13, 3]]) {
      const o = (xo + f * 3) % 12;
      x.fillRect(o, yy, 4, 1);
      x.fillRect(o + 1, yy - 1, 2, 1);
    }
  };
  const ravine = x => { x.fillStyle = '#000000'; x.fillRect(0, 0, 16, 16); };
  const cliff = x => {
    ravine(x);
    x.fillStyle = b.ground[0]; x.fillRect(0, 0, 16, 2);
    x.fillStyle = rm; x.fillRect(0, 2, 16, 3);
    x.fillStyle = rd; for (const i of [2, 7, 12]) x.fillRect(i, 2, 1, 3);
  };
  const [td, tm, tl] = b.treeC, [bd, bm, bl] = b.bush, [rd, rm, rl] = b.rock;
  const treeArt = { round: TREE_ROUND, pine: TREE_PINE, cactus: TREE_CACTUS }[b.tree];
  return {
    g0: mk(x => ground(x, false)),
    g1: mk(x => ground(x, true)),
    tuft: mk(x => {
      ground(x, false);
      x.fillStyle = b.tuft;
      x.fillRect(4, 8, 1, 3); x.fillRect(6, 7, 1, 4); x.fillRect(8, 9, 1, 2);
      x.fillRect(10, 8, 1, 3); x.fillRect(5, 10, 1, 1); x.fillRect(9, 10, 1, 1);
    }),
    flower: mk(x => {
      ground(x, false);
      for (const [fx, fy, col] of [[4, 4, '#d82800'], [11, 6, '#fcfcfc'], [6, 11, '#fcfcfc'], [12, 12, '#d82800']]) {
        x.fillStyle = col; x.fillRect(fx - 1, fy, 3, 1); x.fillRect(fx, fy - 1, 1, 3);
        x.fillStyle = '#f8b800'; x.fillRect(fx, fy, 1, 1);
      }
    }),
    T: mk(x => { ground(x, false); paint(x, treeArt, { d: td, m: tm, l: tl, b: '#c84c0c' }); }),
    B: mk(x => { ground(x, false); paint(x, BUSH, { d: bd, m: bm, l: bl }); }),
    R: mk(x => { ground(x, false); paint(x, ROCK, { d: rd, m: rm, l: rl }); }),
    W: [0, 1].map(f => mk(x => water(x, f))),
    V: mk(ravine),
    // ravine tile under ground: a cliff face shows on its top edge
    Vtop: mk(cliff),
    // Song of Time blocks: solid on the ground (Q) or a faint marker (q); risen out of a ravine as a
    // stepping stone (U) or sunk back down as a marker in the dark (u, uTop)
    Q: mk(x => { ground(x, false); paint(x, TIME_BLOCK, TIME_PAL); }),
    q: mk(x => { ground(x, false); timeMarker(x, b.ground[1]); }),
    U: mk(x => { ravine(x); paint(x, TIME_BLOCK, TIME_PAL); }),
    u: mk(x => { ravine(x); timeMarker(x, '#24344a'); }),
    uTop: mk(x => { cliff(x); timeMarker(x, '#24344a'); }),
    P: mk(x => {
      ground(x, false);
      x.fillStyle = '#881400'; x.fillRect(5, 2, 6, 13);
      x.fillStyle = '#c84c0c'; x.fillRect(6, 3, 4, 11);
      x.fillStyle = '#e45c10'; x.fillRect(6, 3, 4, 2); x.fillRect(7, 5, 1, 8);
      x.fillStyle = '#bcbcbc'; x.fillRect(5, 7, 6, 2);
    }),
    bridge: mk(x => {
      water(x, 0);
      x.fillStyle = '#c84c0c'; x.fillRect(0, 1, 16, 14);
      x.fillStyle = '#e45c10'; for (const i of [0, 4, 8, 12]) x.fillRect(i, 2, 1, 12);
      x.fillStyle = '#881400';
      x.fillRect(0, 1, 16, 1); x.fillRect(0, 14, 16, 1);
      for (const i of [3, 7, 11, 15]) x.fillRect(i, 2, 1, 12);
    }),
  };
}
const TILESETS = Object.fromEntries(Object.entries(BIOMES).map(([k, b]) => [k, makeTileset(b)]));

// Dungeon palettes: wall/block dark, mid, light, and the floor's two tones.
const DUN_PALS = [
  { wall: ['#003c3c', '#008888', '#00e8d8'], floor: ['#004058', '#00283c'] },
  { wall: ['#003c14', '#00a800', '#b8f818'], floor: ['#005800', '#003c14'] },
  { wall: ['#500000', '#a81000', '#fc7460'], floor: ['#503000', '#3c1c00'] },
  { wall: ['#24188c', '#4428bc', '#9878f8'], floor: ['#0000bc', '#000088'] },
];
function makeDungeonTileset(p) {
  const [wd, wm, wl] = p.wall, [f0, f1] = p.floor;
  const floor = (x, dot) => {
    x.fillStyle = f1; x.fillRect(0, 0, 16, 16);
    x.fillStyle = f0; x.fillRect(1, 1, 14, 14);
    if (dot) { x.fillStyle = f1; x.fillRect(7, 7, 2, 2); }
  };
  return {
    g0: mk(x => floor(x, false)),
    g1: mk(x => floor(x, true)),
    // bricks
    w: mk(x => {
      x.fillStyle = wm; x.fillRect(0, 0, 16, 16);
      for (let i = 0; i < 4; i++) {
        const y = i * 4;
        x.fillStyle = wl; x.fillRect(0, y, 16, 1);
        x.fillStyle = wd; x.fillRect(0, y + 3, 16, 1); x.fillRect(i & 1 ? 3 : 11, y, 1, 3);
      }
    }),
    // raised stone block
    k: mk(x => {
      x.fillStyle = wd; x.fillRect(0, 0, 16, 16);
      x.fillStyle = wm; x.fillRect(1, 1, 14, 14);
      x.fillStyle = wl; x.fillRect(1, 1, 14, 1); x.fillRect(1, 1, 1, 14);
      x.fillStyle = wd; x.fillRect(4, 4, 8, 8);
      x.fillStyle = wm; x.fillRect(5, 5, 6, 6);
    }),
    o: mk(x => { x.fillStyle = '#000000'; x.fillRect(0, 0, 16, 16); }),
    // locked door with a gold keyhole plate
    L: mk(x => {
      x.fillStyle = wd; x.fillRect(0, 0, 16, 16);
      x.fillStyle = '#881400'; x.fillRect(1, 1, 14, 14);
      x.fillStyle = '#c84c0c'; x.fillRect(2, 2, 12, 12);
      x.fillStyle = '#f8b800'; x.fillRect(5, 4, 6, 8);
      x.fillStyle = '#000000'; x.fillRect(7, 5, 2, 2); x.fillRect(6, 6, 4, 2); x.fillRect(7, 8, 2, 3);
    }),
    // shutter bars (boss room while the guardian lives)
    S: mk(x => {
      x.fillStyle = wd; x.fillRect(0, 0, 16, 16);
      x.fillStyle = wl; for (const i of [1, 5, 9, 13]) x.fillRect(i, 0, 2, 16);
      x.fillStyle = wm; x.fillRect(0, 7, 16, 2);
    }),
  };
}
DUN_PALS.forEach((p, i) => { TILESETS['dun' + i] = makeDungeonTileset(p); });

let grid0 = null; // the grid being drawn, so ravine tiles can look at their neighbor
function tileImg(set, ch, c, r) {
  switch (ch) {
    case 'w': return set.w;
    case 'k': return set.k;
    case 'o': return set.o;
    case 'L': return set.L;
    case 'S': return set.S;
    case 'T': return set.T;
    case 'R': return set.R;
    case 'B': return set.B;
    case 'W': return set.W[(frame >> 5) & 1];
    // ravine tiles show a cliff face when there's ground (or a risen block) above them
    case 'V': return r > 0 && !'Vu'.includes(grid0[r - 1][c]) ? set.Vtop : set.V;
    case 'u': return r > 0 && !'Vu'.includes(grid0[r - 1][c]) ? set.uTop : set.u;
    case 'Q': return set.Q;
    case 'q': return set.q;
    case 'U': return set.U;
    case 'P': return set.P;
    case ',': return set.tuft;
    case 'f': return set.flower;
    case '=': return set.bridge;
    default: return (c * 7 + r * 13) % 5 === 0 ? set.g1 : set.g0;
  }
}

