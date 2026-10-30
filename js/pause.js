// ---------- Pause menu ----------
const B_SLOTS = ['bow', 'boomerang', 'hookshot', 'ocarina'];
const ITEM_NAME = { bow: 'BOW', boomerang: 'BOOMERANG', hookshot: 'HOOKSHOT', ocarina: 'OCARINA' };

function updatePause() {
  const p = player;
  if (pressed.has('start')) { state = 'play'; sfx('pause'); return; }
  const step = pressed.has('right') || pressed.has('down') ? 1 : pressed.has('left') || pressed.has('up') ? -1 : 0;
  if (!step || !p.bItems.length) return;
  // move the cursor to the next item you own; the cursor is your equipped B item
  let i = B_SLOTS.indexOf(p.bItem);
  for (let k = 0; k < B_SLOTS.length; k++) {
    i = (i + step + B_SLOTS.length) % B_SLOTS.length;
    if (p.bItems.includes(B_SLOTS[i])) break;
  }
  if (B_SLOTS[i] !== p.bItem) { p.bItem = B_SLOTS[i]; sfx('swap'); }
}

function drawPause() {
  const p = player, top = HUD;
  ctx.fillStyle = '#000000'; ctx.fillRect(0, top, PW, PH);

  // B item: the equipped item on the left, everything you own on the right
  text('INVENTORY', 16, top + 8, '#d82800');
  ctx.strokeStyle = '#2038ec'; ctx.lineWidth = 1;
  ctx.strokeRect(24.5, top + 26.5, 24, 24);
  if (p.bItem) drawIcon(p.bItem, 36.5, top + 38.5);
  text(BTN.item, 36, top + 54, '#fcfcfc', 8, 'center');
  ctx.strokeRect(72.5, top + 22.5, 160, 32);
  B_SLOTS.forEach((item, i) => {
    const cx = 92 + i * 40, cy = top + 38;
    if (p.bItems.includes(item)) drawIcon(item, cx + 0.5, cy + 0.5);
    if (item === p.bItem) {
      ctx.strokeStyle = (frame >> 3) & 1 ? '#d82800' : '#0058f8';
      ctx.strokeRect(cx - 11.5, cy - 12.5, 24, 26);
      ctx.strokeStyle = '#2038ec';
    }
  });
  text(p.bItem ? ITEM_NAME[p.bItem] : 'NO ITEMS YET', 152, top + 60, p.bItem ? '#fcfcfc' : '#7c7c7c', 8, 'center');
  // with the ocarina selected, show the song you know and how to play it
  if (p.bItem === 'ocarina') SONG_OF_TIME.forEach((n, i) => drawNote(n, 109 + i * 15, top + 71));

  // passive gear
  text('GEAR', 16, top + 84, '#d82800');
  const sw = SWORDS[p.sword - 1];
  const gear = [['sword', sw.name, sw.icon], ['shield', 'SHIELD', SPR.shieldIcon], ['armor', 'BLUE MAIL', SPR.armorIcon]];
  gear.forEach(([key, name, icon], i) => {
    const y = top + 98 + i * 18;
    if (p[key]) { ctx.drawImage(icon, Math.round(22 - icon.width / 2), Math.round(y + 3 - icon.height / 2)); text(name, 34, y, '#fcfcfc'); }
    else text('---', 34, y, '#7c7c7c');
  });

  // heart pieces and run stats
  // sits right of the longest gear name ("TEMPERED SWORD" ends at x 146)
  if (heartsMaxed()) ctx.drawImage(SPR.containerFull, 154, top + 80, SPR.containerFull.width * 2, SPR.containerFull.height * 2);
  else drawPieceHeart(154, top + 80, 2);
  text('PIECES', 186, top + 82, '#d82800');
  text(heartsMaxed() ? 'MAX' : p.pieces + ' / 4', 186, top + 94, '#fcfcfc');
  const stats = [
    ['HEARTS', (p.max / Q) + '/16'],
    ['RUPEES', rupees],
    ['EXPLORED', visited.size],
    ['GUARDIANS', bossesBeaten],
  ];
  stats.forEach(([label, value], i) => {
    text(label, 132, top + 112 + i * 11, '#bcbcbc');
    text(String(value), 244, top + 112 + i * 11, '#fcfcfc', 8, 'right');
  });

  text(p.bItems.length > 1 ? 'ARROWS SELECT  ' + BTN.start + ' RESUME' : BTN.start + '  RESUME', 128, top + 164, '#7c7c7c', 8, 'center');
}

