// ---------- Sprites ----------
// colors from the NES palette
const PAL = {
  G: '#80d010', g: '#00a800', S: '#fc9838', B: '#c84c0c', K: '#000000', W: '#fcfcfc',
  R: '#d82800', r: '#a81000', b: '#0058f8', c: '#3cbcfc', P: '#6844fc', p: '#4428bc',
  H: '#fcfcfc', Y: '#f8b800', n: '#fce0a8', m: '#fc9838', M: '#c84c0c',
  D: '#881400', O: '#e45c10',
};
function makeSprite(rows, pal = PAL, flip = false) {
  const w = Math.max(...rows.map(r => r.length)), h = rows.length;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  rows.forEach((row, y) => {
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '.') continue;
      const col = typeof pal === 'function' ? pal(ch) : pal[ch];
      if (!col) continue;
      x.fillStyle = col;
      x.fillRect(flip ? w - 1 - i : i, y, 1, 1);
    }
  });
  return c;
}
const FLASH = ch => ch === 'K' ? '#000000' : '#fcfcfc';

const P_DOWN = [
  '......GGGG......',
  '.....GGGGGG.....',
  '....GGGGGGGG....',
  '....BBSSSSBB....',
  '...BBSKSSKSBB...',
  '....SSSSSSSS....',
  '.....SSSSSS.....',
  '...GGGGGGGGGG...',
  '..SGGGBBBBGGGS..',
  '..SGGGGGGGGGGS..',
  '...GGGGGGGGGG...',
  '...gGGGGGGGGg...',
  '....GGGGGGGG....',
  '....SS....SS....',
  '....BB....BB....',
  '...BBB....BBB...',
];
const P_UP = [
  '......GGGG......',
  '.....GGGGGG.....',
  '....GGGGGGGG....',
  '....BBBBBBBB....',
  '...BBBBBBBBBB...',
  '....BBBBBBBB....',
  '.....SSSSSS.....',
  '...GGGGGGGGGG...',
  '..SGGGBBBBGGGS..',
  '..SGGGGGGGGGGS..',
  '...GGGGGGGGGG...',
  '...gGGGGGGGGg...',
  '....GGGGGGGG....',
  '....SS....SS....',
  '....BB....BB....',
  '...BBB....BBB...',
];
const LEGS_ALT = [
  '.....SS..SS.....',
  '.....BB..BB.....',
  '....BBB..BBB....',
];
const P_RIGHT = [
  '.....GGGG.......',
  '....GGGGGGG.....',
  '...GGGGGGGGG....',
  '..GGBBBSSSS.....',
  '..G.BBSSSKS.....',
  '....BBSSSSSS....',
  '.....SSSSS......',
  '....GGGGGGG.....',
  '....GGGBBBB.....',
  '....GGGGGSS.....',
  '....GGGGGGG.....',
  '....gGGGGGg.....',
  '.....GGGGG......',
  '.....SS.SS......',
  '.....BB.BBB.....',
  '....BBB.........',
];
const RIGHT_ALT = [
  '......SSS.......',
  '......BBB.......',
  '......BBBB......',
];
const withLegs = (base, legs) => base.slice(0, 13).concat(legs);

const OCTO = [
  '................',
  '................',
  '.....RRRRRR.....',
  '....RRRRRRRR....',
  '...RRRRRRRRRR...',
  '..RRRWKRRWKRRR..',
  '..RRRWKRRWKRRR..',
  '..RRRRRRRRRRRR..',
  '.R.RRRRRRRRRR.R.',
  'R..RRRrrrrRRR..R',
  '...R..rKKr..R...',
  '..R...rrrr...R..',
  '................',
  '................',
  '................',
  '................',
];
const SLIME = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '......bbbb......',
  '....bbbbbbbb....',
  '...bbWWbbWWbb...',
  '..bbbWKbbWKbbb..',
  '..bbbbbbbbbbbb..',
  '.bcbbbbbbbbbbbb.',
  '.bcbbbbbbbbbbbb.',
  '.bbbbbbbbbbbbbb.',
  '..bbbbbbbbbbbb..',
  '................',
];
const BOSS_SPR = [
  '..H..........H..',
  '..HH........HH..',
  '...PPPPPPPPPP...',
  '..PPPPPPPPPPPP..',
  '.PPYYPPPPPPYYPP.',
  '.PPYKPPPPPPKYPP.',
  '.PPPPPPPPPPPPPP.',
  'PPPPPPPPPPPPPPPP',
  'PPPKWKWKWKWKWPPP',
  'PPPKKKKKKKKKKPPP',
  '.PPPPPPPPPPPPPP.',
  '.pPPPPPPPPPPPPp.',
  '..PPPPPPPPPPPP..',
  '..pp.pp..pp.pp..',
  '..pp.pp..pp.pp..',
  '.ppp.pp..pp.ppp.',
];
const HEART = [
  '.RR.RR.',
  'RRRRRRR',
  'RRRRRRR',
  '.RRRRR.',
  '..RRR..',
  '...R...',
];
// Health is counted in quarter hearts. Quadrants of the 7x6 HUD heart, in the order they fill:
// bottom left, top left, bottom right, top right (so damage empties top right first).
const Q = 4, MAX_HEARTS = 16;
const HEART_QUADS = [[0, 3, 4, 3], [0, 0, 4, 3], [4, 3, 3, 3], [4, 0, 3, 3]];
const heartsMaxed = () => player.max >= MAX_HEARTS * Q;
const RUPEE = [
  '..n..',
  '.nmM.',
  'nmmMM',
  'nmmMM',
  'nmmMM',
  'nmmMM',
  '.nmM.',
  '..M..',
];
const SHIELD_ICON = [
  'BBBBBBBB',
  'BOOOOOOB',
  'BOOYYOOB',
  'BOYYYYOB',
  'BOOYYOOB',
  'BOOOOOOB',
  '.BOOOOB.',
  '..BOOB..',
  '...BB...',
];
const MINI_SHIELD = [
  'BBBBB',
  'BOYOB',
  'BYYYB',
  'BOYOB',
  '.BOB.',
  '..B..',
];
const BOW_ICON = [
  'WBB...',
  'W..B..',
  'W...B.',
  'W...B.',
  'W....B',
  'W...B.',
  'W...B.',
  'W..B..',
  'WBB...',
];
const BOOMERANG_ICON = [
  'YOOOOOO',
  'OOOOOOD',
  'OO.....',
  'OO.....',
  'OO.....',
  'OO.....',
  'OD.....',
];
const HOOKSHOT_ICON = [
  '...H...',
  '..HHH..',
  '.H.H.H.',
  '...H...',
  '...c...',
  '...H...',
  '...c...',
  '..BBB..',
  '..BBB..',
];
const ARMOR_ICON = [
  '.cc..cc.',
  'cbbbbbbc',
  '.bbbbbb.',
  '.bbbbbb.',
  '.BBYBBB.',
  '.bbbbbb.',
  'bbbbbbbb',
  'bbbbbbbb',
];
// piece of heart: a glassy blue heart frame with a red heart inside
// o = frame edge, a = frame, h = shine, i/j = pale inside, R/Y = red heart
const PIECE = [
  '..ooo...ooo..',
  '.ohhao.oaaao.',
  'ohaiiaoaiiaao',
  'oaijRRjRRjiao',
  'oaiRYRRRRRiao',
  'oaiRRRRRRRiao',
  '.oaiRRRRRiao.',
  '..oaiRRRiao..',
  '...oaiRiao...',
  '....oaiao....',
  '.....oao.....',
  '......o......',
];
const PIECE_PAL = { o: '#0078f8', a: '#a4e4fc', h: '#fcfcfc', i: '#b8b8f8', j: '#dcdcfc', R: '#d82800', Y: '#fc9838' };
// the empty version is just a gray frame, so collected quarters stand out in full color
const PIECE_EMPTY = { o: '#7c7c7c', a: '#bcbcbc', h: '#bcbcbc' };
const CHEST = [
  '................',
  '................',
  '................',
  '...DDDDDDDDDD...',
  '..DOOOOOOOOOOD..',
  '.DOOOOOOOOOOOOD.',
  '.DBBBBBBBBBBBBD.',
  '.DYYYYYYYYYYYYD.',
  '.DBBBBBYYBBBBBD.',
  '.DBBBBBKKBBBBBD.',
  '.DBBBBBYYBBBBBD.',
  '.DBBBBBBBBBBBBD.',
  '.DYBBBBBBBBBBYD.',
  '.DDDDDDDDDDDDDD.',
  '................',
  '................',
];
const CHEST_OPEN = [
  '................',
  '..DOOOOOOOOOOD..',
  '..DOOOOOOOOOOD..',
  '..DYYYYYYYYYYD..',
  '..DDDDDDDDDDDD..',
  '.DKKKKKKKKKKKKD.',
  '.DKKKKKKKKKKKKD.',
  '.DYYYYYYYYYYYYD.',
  '.DBBBBBBBBBBBBD.',
  '.DBBBBBBBBBBBBD.',
  '.DBBBBBBBBBBBBD.',
  '.DBBBBBBBBBBBBD.',
  '.DYBBBBBBBBBBYD.',
  '.DDDDDDDDDDDDDD.',
  '................',
  '................',
];
const KEY = [
  '.YYY.',
  'YY.YY',
  '.YYY.',
  '..Y..',
  '..Y..',
  '..YY.',
  '..Y..',
  '..YY.',
];
// the Ocarina of Time: blue body, silver collar with the gold Triforce, finger holes
const OCARINA_ICON = [
  '.HB...........',
  '.BBs......BB..',
  '..sYsBBBBBBkB.',
  '..BssBBkBBBBBD',
  '.BBBBBBBBBkBD.',
  'BBkBBkBBBBBD..',
  'BHBBBBBBBDD...',
  'BBBBBBBDD.....',
  '.BkBBDD.......',
  '..DDD.........',
];
const OCARINA_PAL = { B: '#6888fc', D: '#4428bc', H: '#b8b8f8', k: '#000000', s: '#bcbcbc', Y: '#f8b800' };
// small version Lonk holds to his mouth while playing
const OCARINA_HELD = [
  '.BBBB.',
  'BkBkBD',
  '.DDDD.',
];
const TREBLE_CLEF = [
  '...O..',
  '..O.O.',
  '..O.O.',
  '..OO..',
  '..O...',
  '.OO...',
  'O.O...',
  'O.OOO.',
  'O.O..O',
  '.OO..O',
  '..OOO.',
  '..O...',
  'O.O...',
  '.O....',
];
// healing fairy, two wing frames
const FAIRY = [
  'w.....w',
  'ww.p.ww',
  'wwpppww',
  '.wpppw.',
  '..ppp..',
  '..p.p..',
];
const FAIRY2 = [
  '.......',
  '...p...',
  'wwpppww',
  'wwpppww',
  'w.ppp.w',
  '..p.p..',
];
const ARROW_ITEM = [
  '..W..',
  '.WWW.',
  '..B..',
  '..B..',
  '..B..',
  '..B..',
  '.RBR.',
  '.R.R.',
];
const FIRE = [
  '................',
  '........R.......',
  '.......RR.......',
  '.......RR...R...',
  '...R..RRR..RR...',
  '...RR.RORR.RR...',
  '...RRRROORRRR...',
  '..RRRROOOORRR...',
  '..RRROOYYOORRR..',
  '..RROOYYYYOORR..',
  '..RROYYWWYYORR..',
  '..RROYWWWWYORR..',
  '...ROYYWWYYOR...',
  '...RROOYYOORR...',
  '....RRROORRR....',
  '......RRRR......',
];
const FIRE_PAL = { R: '#d82800', O: '#fc9838', Y: '#f8b800', W: '#fcfcfc' };
const MERCHANT = [
  '.....rrrrrr.....',
  '....rrrrrrrr....',
  '...rrrrrrrrrr...',
  '..YYYYYYYYYYYY..',
  '....SSSSSSSS....',
  '....SKSSSSKS....',
  '....SSSSSSSS....',
  '....SMMMMMMS....',
  '.....SMSSMS.....',
  '...cccccccccc...',
  '..cccccccccccc..',
  '..SccccYYccccS..',
  '..SccccYYccccS..',
  '...cccccccccc...',
  '....cccccccc....',
  '....BBB..BBB....',
];

function lonkSprites(pal) {
  return {
    down: [makeSprite(P_DOWN, pal), makeSprite(withLegs(P_DOWN, LEGS_ALT), pal)],
    up: [makeSprite(P_UP, pal), makeSprite(withLegs(P_UP, LEGS_ALT), pal)],
    right: [makeSprite(P_RIGHT, pal), makeSprite(withLegs(P_RIGHT, RIGHT_ALT), pal)],
    left: [makeSprite(P_RIGHT, pal, true), makeSprite(withLegs(P_RIGHT, RIGHT_ALT), pal, true)],
  };
}
const LONK = {
  green: lonkSprites(PAL),
  blue: lonkSprites({ ...PAL, G: '#6888fc', g: '#0058f8' }),
};
// guardian color variants
const BOSS_PALS = [
  PAL,
  { ...PAL, P: '#d82800', p: '#881400' },
  { ...PAL, P: '#00a800', p: '#005800', Y: '#e45c10' },
  { ...PAL, P: '#0058f8', p: '#0000bc', H: '#f8b800' },
];

const SPR = {
  octo: makeSprite(OCTO), octoT: makeSprite(OCTO, { ...PAL, R: '#0058f8', r: '#0000bc' }), octoF: makeSprite(OCTO, FLASH),
  slime: makeSprite(SLIME), slimeT: makeSprite(SLIME, { ...PAL, b: '#d82800', c: '#fc7460' }), slimeF: makeSprite(SLIME, FLASH),
  boss: BOSS_PALS.map(p => makeSprite(BOSS_SPR, p)), bossF: makeSprite(BOSS_SPR, FLASH),
  heart: makeSprite(HEART),
  heartEmpty: makeSprite(HEART, { R: '#7c7c7c' }),
  rupee: makeSprite(RUPEE),
  rupeeB: makeSprite(RUPEE, { ...PAL, n: '#a4e4fc', m: '#3cbcfc', M: '#0058f8' }),
  // big 50-rupee gem: stands in for heart pieces and containers once your hearts are maxed
  rupeeBig: makeSprite([
    '...n...',
    '..nmM..',
    '.nmmMM.',
    'nmmmMMM',
    'nmmmMMM',
    'nmmmMMM',
    'nmmmMMM',
    'nmmmMMM',
    'nmmmMMM',
    '.nmmMM.',
    '..nmM..',
    '...M...',
  ], { n: '#d8b8f8', m: '#6844fc', M: '#4428bc' }),
  shieldIcon: makeSprite((SHIELD_ICON)),
  miniShield: makeSprite((MINI_SHIELD)),
  bowIcon: makeSprite((BOW_ICON)),
  boomerangIcon: makeSprite((BOOMERANG_ICON)),
  hookshotIcon: makeSprite((HOOKSHOT_ICON)),
  armorIcon: makeSprite((ARMOR_ICON)),
  heartBig: makeSprite(PIECE, PIECE_PAL),
  heartBigEmpty: makeSprite(PIECE, PIECE_EMPTY),
  // the pause-screen tracker: a solid red heart container that fills in by quarters
  containerFull: makeSprite(PIECE, { o: '#d82800', a: '#d82800', h: '#fcfcfc', i: '#d82800', j: '#d82800', R: '#d82800', Y: '#d82800' }),
  containerEmpty: makeSprite(PIECE, { o: '#7c7c7c' }),
  chest: makeSprite(CHEST),
  chestOpen: makeSprite(CHEST_OPEN),
  key: makeSprite(KEY),
  ocarina: makeSprite(OCARINA_ICON, OCARINA_PAL),
  ocarinaHeld: makeSprite(OCARINA_HELD, OCARINA_PAL),
  clef: makeSprite(TREBLE_CLEF, { O: '#fc9838' }),
  fairy: [FAIRY, FAIRY2].map(f => makeSprite(f, { w: '#a4e4fc', p: '#f878f8' })),
  arrowItem: makeSprite(ARROW_ITEM),
  fire: [makeSprite(FIRE, FIRE_PAL), makeSprite(FIRE, FIRE_PAL, true)],
  merchant: makeSprite(MERCHANT, { r: '#00a800', Y: '#f8b800', S: '#fc9838', K: '#000000', M: '#fcfcfc', c: '#0058f8', B: '#881400' }),
};
// sword levels: l/w/d = blade tip, face and edge, g = guard, h = guard center, H = grip, p = pommel
const SWORD_ICON = [
  '..l..',
  '.lwd.',
  '.lwd.',
  '.lwd.',
  '.lwd.',
  '.lwd.',
  '.lwd.',
  '.lwd.',
  'ggggg',
  '.ghg.',
  '..H..',
  '..H..',
  '..p..',
];
const SWORDS = [
  { name: 'SWORD', dmg: 1, blade: '#fcfcfc', edge: '#bcbcbc', hilt: '#c84c0c', guard: '#f8b800', gem: '#f8b800' },
  { name: 'TEMPERED SWORD', dmg: 1.5, blade: '#fca044', edge: '#e45c10', hilt: '#881400', guard: '#c84c0c', gem: '#f8b800' },
  { name: 'MASTER SWORD', dmg: 2, blade: '#fcfcfc', edge: '#bcbcbc', hilt: '#4428bc', guard: '#6844fc', gem: '#f8b800' },
];
for (const s of SWORDS) {
  s.icon = makeSprite(SWORD_ICON, { l: s.blade, w: s.blade, d: s.edge, g: s.guard, h: s.gem, H: s.hilt, p: s.guard });
}

const ITEM_ICON = {
  shield: SPR.shieldIcon, bow: SPR.bowIcon, boomerang: SPR.boomerangIcon, hookshot: SPR.hookshotIcon,
  armor: SPR.armorIcon, piece: SPR.heartBig, container: SPR.containerFull, rupees: SPR.rupeeB, rupees50: SPR.rupeeBig,
  hearts: SPR.heart, arrows: SPR.arrowItem, ocarina: SPR.ocarina,
};

