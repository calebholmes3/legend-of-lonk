// ---------- Rendering ----------
function drawGrid(s, ox, oy) {
  const set = TILESETS[s.biome];
  grid0 = s.g;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      ctx.drawImage(tileImg(set, s.g[r][c], c, r), Math.round(ox + c * T), Math.round(oy + r * T) + HUD);
  // structures drawn over their tiles
  const at = f => [Math.round(ox + f.c0 * T), Math.round(oy + f.r0 * T) + HUD];
  if (s.entrance) drawEntrance(...at(s.entrance));
  if (s.shop) {
    const [X, Y] = at(s.shop), fire = SPR.fire[(frame >> 3) & 1];
    ctx.drawImage(fire, X, Y); ctx.drawImage(fire, X + 4 * T, Y);
    ctx.drawImage(SPR.merchant, X + 2 * T, Y);
  }
}

// Dungeon entrance: a teal stone shrine (5x2 tiles with its torches) that stands out in every biome,
// with a gold Triforce over an arched doorway and steps leading down.
const ENT = { d: '#004058', m: '#008888', l: '#00e8d8' };
function drawEntrance(X, Y) {
  const f = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(X + x, Y + y, w, h); };
  for (const tx of [0, 64]) {
    ctx.drawImage(SPR.fire[((frame >> 3) + tx) & 1], X + tx, Y + 7);
    f(tx + 3, 21, 10, 3, ENT.d); f(tx + 4, 21, 8, 1, ENT.l);
    f(tx + 5, 24, 6, 8, ENT.d); f(tx + 6, 24, 4, 8, ENT.m);
  }
  const s = 16;
  f(s, 4, 48, 28, ENT.d);
  f(s + 1, 5, 46, 27, ENT.m);
  for (let i = 0; i < 6; i++) { f(s + i * 8 + 1, 0, 6, 5, ENT.d); f(s + i * 8 + 2, 1, 4, 4, ENT.m); f(s + i * 8 + 2, 1, 4, 1, ENT.l); }
  f(s + 1, 5, 46, 1, ENT.l);
  // brickwork
  f(s + 1, 12, 46, 1, ENT.d); f(s + 1, 13, 46, 1, ENT.l);
  f(s + 1, 20, 46, 1, ENT.d); f(s + 1, 21, 46, 1, ENT.l);
  for (const x of [8, 40]) { f(s + x, 6, 1, 6, ENT.d); f(s + x, 22, 1, 10, ENT.d); }
  for (const x of [6, 42]) f(s + x, 14, 1, 6, ENT.d);
  drawTriforce(X + s + 24, Y + 9, 3, '#f8b800');
  // arched doorway
  f(s + 15, 14, 18, 18, ENT.d);
  f(s + 15, 14, 2, 1, ENT.m); f(s + 31, 14, 2, 1, ENT.m); f(s + 15, 15, 1, 1, ENT.m); f(s + 32, 15, 1, 1, ENT.m);
  f(s + 18, 15, 12, 1, '#000000');
  f(s + 17, 16, 14, 16, '#000000');
  f(s + 23, 12, 2, 3, '#f8b800');
  f(s + 18, 21, 12, 1, '#7c7c7c'); f(s + 19, 25, 10, 1, '#7c7c7c'); f(s + 20, 29, 8, 1, '#7c7c7c');
}

function drawShop(sh) {
  for (const it of sh.items) {
    if (!shopStock(it)) continue;
    const x = it.c * T + 8, y = it.r * T + 8 + HUD;
    if (it.type === 'piece') ctx.drawImage(SPR.heartBig, x - 6, y - 6);
    else if (it.type === 'arrows') ctx.drawImage(SPR.arrowItem, x - 2, y - 4);
    else {
      // mystery item: a ? in a box
      ctx.fillStyle = '#f8b800'; ctx.fillRect(x - 6, y - 7, 12, 14);
      ctx.fillStyle = '#000000'; ctx.fillRect(x - 5, y - 6, 10, 12);
      text('?', x + 1, y - 3, '#f8b800', 8, 'center');
    }
    text(String(it.price), x + 1, y + 10, rupees >= it.price ? '#fcfcfc' : '#7c7c7c', 8, 'center');
  }
}

function drawTriforce(cx, cy, h, col) {
  ctx.fillStyle = col;
  for (let j = 0; j < h; j++) {
    ctx.fillRect(cx - j, cy - h + j, 2 * j + 1, 1);
    ctx.fillRect(cx - h - j, cy + j, 2 * j + 1, 1);
    ctx.fillRect(cx + h - j, cy + j, 2 * j + 1, 1);
  }
}

function drawSword() {
  const s = swordRect(), d = player.dir;
  const X = Math.round(s.x), Y = Math.round(s.y) + HUD;
  const sw = SWORDS[player.sword - 1];
  ctx.fillStyle = sw.blade; ctx.fillRect(X, Y, s.w, s.h);
  ctx.fillStyle = sw.edge;
  if (d === 'left' || d === 'right') ctx.fillRect(X, Y + s.h - 1, s.w, 1);
  else ctx.fillRect(X + s.w - 1, Y, 1, s.h);
  const hilt = sw.hilt, guard = sw.guard;
  // the guard's center pixels get the gem color (gold on the Master Sword)
  const gem = (x, y, w, h) => { ctx.fillStyle = sw.gem; ctx.fillRect(x, y, w, h); };
  if (d === 'right') { ctx.fillStyle = hilt; ctx.fillRect(X, Y, 3, s.h); ctx.fillStyle = guard; ctx.fillRect(X + 3, Y - 1, 1, s.h + 2); gem(X + 3, Y + 1, 1, 2); }
  if (d === 'left') { ctx.fillStyle = hilt; ctx.fillRect(X + s.w - 3, Y, 3, s.h); ctx.fillStyle = guard; ctx.fillRect(X + s.w - 4, Y - 1, 1, s.h + 2); gem(X + s.w - 4, Y + 1, 1, 2); }
  if (d === 'up') { ctx.fillStyle = hilt; ctx.fillRect(X, Y + s.h - 3, s.w, 3); ctx.fillStyle = guard; ctx.fillRect(X - 1, Y + s.h - 4, s.w + 2, 1); gem(X + 1, Y + s.h - 4, 2, 1); }
  if (d === 'down') { ctx.fillStyle = hilt; ctx.fillRect(X, Y, s.w, 3); ctx.fillStyle = guard; ctx.fillRect(X - 1, Y + 3, s.w + 2, 1); gem(X + 1, Y + 3, 2, 1); }
}

// rotations that turn art drawn facing down (or right, for arrows) toward each direction
const ROT_DOWN = { down: 0, up: Math.PI, left: Math.PI / 2, right: -Math.PI / 2 };
const ROT_RIGHT = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };

function drawBow(X, Y) {
  ctx.save();
  ctx.translate(X + 8, Y + 9);
  ctx.rotate(ROT_DOWN[player.dir]);
  ctx.fillStyle = '#fcfcfc'; ctx.fillRect(-4, 5, 9, 1);
  ctx.fillStyle = '#c84c0c';
  ctx.fillRect(-5, 4, 1, 2); ctx.fillRect(-4, 6, 1, 1); ctx.fillRect(-3, 7, 7, 1);
  ctx.fillRect(4, 6, 1, 1); ctx.fillRect(5, 4, 1, 2);
  ctx.restore();
}

function drawArrow(a) {
  ctx.save();
  ctx.translate(Math.round(a.x + a.w / 2), Math.round(a.y + a.h / 2) + HUD);
  ctx.rotate(ROT_RIGHT[a.dir]);
  ctx.fillStyle = '#c84c0c'; ctx.fillRect(-6, 0, 10, 1);
  ctx.fillStyle = '#fcfcfc'; ctx.fillRect(3, -1, 1, 3); ctx.fillRect(4, 0, 2, 1);
  ctx.fillStyle = '#d82800'; ctx.fillRect(-6, -1, 2, 1); ctx.fillRect(-6, 1, 2, 1);
  ctx.restore();
}

function drawBoomer() {
  const b = boomer;
  if (!b) return;
  ctx.save();
  ctx.translate(Math.round(b.x + 4), Math.round(b.y + 4) + HUD);
  ctx.rotate(((b.t >> 2) & 3) * Math.PI / 2);
  ctx.fillStyle = '#e45c10'; ctx.fillRect(-4, -4, 8, 3); ctx.fillRect(-4, -4, 3, 8);
  ctx.fillStyle = '#f8b800'; ctx.fillRect(-4, -4, 3, 3);
  ctx.restore();
}

function drawHook() {
  const h = hook;
  if (!h) return;
  const o = h.phase === 'pull' ? { x: player.x + 8, y: player.y + 10 } : hookOrigin();
  const len = Math.hypot(h.x - o.x, h.y - o.y);
  // chain links, then the claw at the tip
  for (let s = 0; s < len; s += 4) {
    const lx = Math.round(o.x + (h.x - o.x) * s / len), ly = Math.round(o.y + (h.y - o.y) * s / len) + HUD;
    ctx.fillStyle = (s >> 2) & 1 ? '#fcfcfc' : '#bcbcbc'; ctx.fillRect(lx - 1, ly - 1, 2, 2);
  }
  ctx.save();
  ctx.translate(Math.round(h.x), Math.round(h.y) + HUD);
  ctx.rotate(ROT_RIGHT[h.dx > 0 ? 'right' : h.dx < 0 ? 'left' : h.dy > 0 ? 'down' : 'up']);
  ctx.fillStyle = '#fcfcfc'; ctx.fillRect(-2, -1, 4, 2); ctx.fillRect(1, -3, 2, 6);
  ctx.fillStyle = '#bcbcbc'; ctx.fillRect(3, -3, 1, 1); ctx.fillRect(3, 2, 1, 1);
  ctx.restore();
}

function drawIcon(item, cx, cy) {
  const img = item === 'sword' ? SWORDS[player.sword - 1].icon : ITEM_ICON[item];
  ctx.drawImage(img, Math.round(cx - img.width / 2), Math.round(cy - img.height / 2));
}

function drawPlayer(x, y) {
  const p = player;
  if (state === 'play' && p.inv > 0 && (p.inv >> 2) & 1) return;
  const set = p.armor ? LONK.blue : LONK.green;
  const X = Math.round(x), Y = Math.round(y) + HUD;
  if (p.hold > 0) {
    ctx.drawImage(set.down[0], X, Y);
    drawIcon(p.holdItem, X + 8, Y - 7);
    return;
  }
  if (state === 'ocarina') {
    // ocarina held up to his mouth
    ctx.drawImage(set.down[0], X, Y);
    ctx.drawImage(SPR.ocarinaHeld, X + 5, Y + 7);
    return;
  }
  const f = p.atk > 0 || p.shoot > 0 ? 0 : (p.walk >> 3) & 1;
  const bow = p.shoot > 0 && p.shootKind === 'bow';
  const behind = p.dir === 'up';
  if (behind && p.atk > 0) drawSword();
  if (behind && bow) drawBow(X, Y);
  ctx.drawImage(set[p.dir][f], X, Y);
  if (behind) return;
  if (p.atk > 0) drawSword();
  else if (bow) drawBow(X, Y);
  else if (p.shield && p.shoot === 0 && !hook) ctx.drawImage(SPR.miniShield, X + { down: 0, right: 8, left: 1 }[p.dir], Y + 6);
}

function drawEnemy(e) {
  const x = Math.round(e.x), y = Math.round(e.y) + HUD, sz = e.size || 16;
  if (e.spawn > 0) {
    ctx.fillStyle = (e.spawn >> 2) & 1 ? '#fcfcfc' : '#fc9838';
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + e.spawn * 0.2, d = e.spawn / 3;
      ctx.fillRect(Math.round(x + sz / 2 + Math.cos(a) * d - 2), Math.round(y + sz / 2 + Math.sin(a) * d - 2), 4, 4);
    }
    return;
  }
  const fl = e.flash > 0 && (e.flash >> 1) & 1;
  if (e.type === 'octo') {
    ctx.save();
    ctx.translate(x + 8, y + 8);
    ctx.rotate(ROT_DOWN[e.dir]);
    if (!e.stun && (e.anim >> 3) & 1) ctx.scale(-1, 1);
    ctx.drawImage(fl ? SPR.octoF : e.tough ? SPR.octoT : SPR.octo, -8, -8);
    ctx.restore();
  } else if (e.type === 'slime') {
    const hopY = e.hop > 0 ? -Math.round(Math.sin(Math.PI * (18 - e.hop) / 18) * 5) : 0;
    ctx.drawImage(fl ? SPR.slimeF : e.tough ? SPR.slimeT : SPR.slime, x, y + hopY);
  } else {
    // it trembles while winding up a charge
    const shake = fl || e.mode === 'windup' ? ((frame & 2) ? 1 : -1) : 0;
    ctx.drawImage(fl ? SPR.bossF : SPR.boss[e.pal], x + shake, y, 32, 32);
  }
  if (e.stun > 0 || e.mode === 'dazed') {
    // stars circling a stunned enemy
    ctx.fillStyle = '#f8b800';
    for (const k of [0, Math.PI]) {
      const a = frame * 0.2 + k;
      ctx.fillRect(Math.round(x + sz / 2 + Math.cos(a) * 6 - 1), Math.round(y + 1 + Math.sin(a) * 2), 2, 2);
    }
  }
}

function drawProj(b) {
  const x = Math.round(b.x), y = Math.round(b.y) + HUD;
  if (b.type === 'rock') {
    ctx.fillStyle = '#881400'; ctx.fillRect(x + 1, y, 4, 6); ctx.fillRect(x, y + 1, 6, 4);
    ctx.fillStyle = '#e45c10'; ctx.fillRect(x + 1, y + 1, 2, 2);
  } else {
    const alt = (frame >> 2) & 1;
    disc(ctx, x + 4, y + 4, 4, alt ? '#e45c10' : '#fca044');
    disc(ctx, x + 4, y + 4, 2, alt ? '#f8b800' : '#fcfcfc');
  }
}

function drawPickup(k) {
  if (k.t < 120 && (k.t >> 2) & 1) return;
  const x = Math.round(k.x), y = Math.round(k.y) + HUD;
  if (k.type === 'rupee') ctx.drawImage(SPR.rupee, x - 2, y - 4);
  else if (k.type === 'rupee5') ctx.drawImage(SPR.rupeeB, x - 2, y - 4);
  else if (k.type === 'heart') ctx.drawImage(SPR.heart, x - 3, y - 3);
  else if (k.type === 'arrows') ctx.drawImage(SPR.arrowItem, x - 2, y - 4);
  else if (k.type === 'key') ctx.drawImage(SPR.key, x - 2, y - 4);
  else if (k.type === 'fairy') {
    // flutters in a small loop
    const fx = Math.round(Math.cos(frame / 20) * 6), fy = Math.round(Math.sin(frame / 10) * 3);
    ctx.drawImage(SPR.fairy[(frame >> 2) & 1], x - 3 + fx, y - 3 + fy);
  }
  else if (k.type === 'piece' || k.type === 'container') {
    const bob = Math.round(Math.sin(frame / 15) * 2);
    if (heartsMaxed()) ctx.drawImage(SPR.rupeeBig, x - 3, y - 6 + bob);
    else ctx.drawImage(k.type === 'piece' ? SPR.heartBig : SPR.containerFull, x - 6, y - 6 + bob);
    if ((frame >> 3) % 4 === 0) { ctx.fillStyle = '#fcfcfc'; ctx.fillRect(x + 5, y - 9 + bob, 1, 3); ctx.fillRect(x + 4, y - 8 + bob, 3, 1); }
  }
}


// heart-piece progress: a heart container filled in by quarters (clockwise from top left)
function drawPieceHeart(x, y, scale) {
  const hp = SPR.containerFull, hw = Math.floor(hp.width / 2), hh = Math.floor(hp.height / 2);
  ctx.drawImage(SPR.containerEmpty, x, y, hp.width * scale, hp.height * scale);
  const quads = [[0, 0, hw, hh], [hw, 0, hp.width - hw, hh], [hw, hh, hp.width - hw, hp.height - hh], [0, hh, hw, hp.height - hh]];
  for (let i = 0; i < player.pieces; i++) {
    const [qx, qy, qw, qh] = quads[i];
    ctx.drawImage(hp, qx, qy, qw, qh, x + qx * scale, y + qy * scale, qw * scale, qh * scale);
  }
}

function drawHUD() {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 256, HUD);
  // minimap: a 5x5 window around you. Overworld screens are colored by biome; in a dungeon you see
  // the rooms you've been in, and the boss room is always marked.
  const dot = (X, Y, col) => { ctx.fillStyle = col; ctx.fillRect(X + 3, Y + 1, 3, 3); };
  ctx.fillStyle = '#7c7c7c'; ctx.fillRect(10, 8, 54, 34);
  if (dun) { ctx.fillStyle = '#000000'; ctx.fillRect(11, 9, 52, 32); }
  for (let j = -2; j <= 2; j++)
    for (let i = -2; i <= 2; i++) {
      const X = 12 + (i + 2) * 10, Y = 10 + (j + 2) * 6;
      if (dun) {
        const rm = dun.rooms.get((dpos.x + i) + ',' + (dpos.y + j));
        if (!rm) continue;
        if (rm.seen) { ctx.fillStyle = '#2038ec'; ctx.fillRect(X, Y, 9, 5); }
        if (rm.boss && !rm.bossDead) dot(X, Y, '#d82800');
        if (rm.seen && rm.chest && !rm.chest.open) dot(X, Y, '#f8b800');
        if (rm.seen && rm.kind === 'rest' && !rm.fairyTaken) dot(X, Y, '#f878f8');
      } else {
        const key = (cur.sx + i) + ',' + (cur.sy + j), s = screens[key], seen = visited.has(key);
        ctx.fillStyle = seen ? BIOMES[s.biome].map : '#7c7c7c';
        ctx.fillRect(X, Y, 9, 5);
        if (seen && s.entrance && !(s.dungeon && s.dungeon.done)) dot(X, Y, '#d82800');
        if (seen && s.shop) dot(X, Y, '#3cbcfc');
        if (seen && s.chest && !s.chest.open) dot(X, Y, '#f8b800');
        if (seen && (s.island || s.vault) && !s.islandTaken) dot(X, Y, '#f878f8');
      }
      if (!i && !j) dot(X, Y, '#80d010');
    }
  // rupees, keys (for the dungeon you're in) and arrows
  ctx.drawImage(SPR.rupee, 70, 12);
  text('x' + String(Math.min(999, rupees)).padStart(3, '0'), 78, 13);
  ctx.drawImage(SPR.key, 70, 23);
  text('x' + (dun ? dun.keys : 0), 78, 24);
  ctx.drawImage(SPR.arrowItem, 70, 34);
  text('x' + String(player.arrows).padStart(2, '0'), 78, 35);
  // Z slot (sword)
  text(BTN.attack, 121, 4, '#fcfcfc');
  ctx.strokeStyle = '#2038ec'; ctx.strokeRect(116.5, 13.5, 16, 24);
  drawIcon('sword', 124.5, 25.5);
  // X slot (equipped item)
  text(BTN.item, 143, 4, '#fcfcfc');
  ctx.strokeStyle = '#2038ec'; ctx.strokeRect(138.5, 13.5, 16, 24);
  if (player.bItem) drawIcon(player.bItem, 146.5, 25.5);
  // life: up to 16 hearts in two rows, each drawn in quarters
  text('-LIFE-', 206, 6, '#d82800', 8, 'center');
  for (let i = 0; i < player.max / Q; i++) {
    const hx = 170 + (i % 8) * 9, hy = 19 + Math.floor(i / 8) * 9;
    const q = Math.max(0, Math.min(Q, player.hp - i * Q));
    ctx.drawImage(SPR.heartEmpty, hx, hy);
    for (let k = 0; k < q; k++) {
      const [sx, sy, sw, sh] = HEART_QUADS[k];
      ctx.drawImage(SPR.heart, sx, sy, sw, sh, hx + sx, hy + sy, sw, sh);
    }
  }
}

function drawWorld() {
  drawGrid(scr, 0, 0);
  if (scr.chest) ctx.drawImage(scr.chest.open ? SPR.chestOpen : SPR.chest, scr.chest.c * T, scr.chest.r * T + HUD);
  if (scr.shop) drawShop(scr.shop);
  pickups.forEach(drawPickup);
  enemies.forEach(drawEnemy);
  projs.forEach(drawProj);
  arrows.forEach(drawArrow);
  drawBoomer();
  drawHook();
  drawPlayer(player.x, player.y);
  for (const q of parts) { ctx.fillStyle = q.col; ctx.fillRect(Math.round(q.x), Math.round(q.y) + HUD, q.s, q.s); }
  const boss = enemies.find(e => e.type === 'boss' && e.spawn <= 0);
  if (boss) {
    ctx.fillStyle = '#000'; ctx.fillRect(63, HUD + PH - 10, 130, 6);
    ctx.fillStyle = '#d82800'; ctx.fillRect(64, HUD + PH - 9, Math.round(128 * boss.hp / boss.maxHp), 4);
  }
}

function drawTitle() {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 256, 224);
  drawTriforce(128, 46, 24, (frame >> 4) & 1 ? '#f8b800' : '#f8d878');
  text('THE LEGEND OF', 128, 82, '#fcfcfc', 16, 'center');
  text('LONK', 128, 107, '#a81000', 48, 'center');
  text('LONK', 128, 104, '#f8b800', 48, 'center');
  if ((frame >> 5) & 1) text('PRESS ' + BTN.start, 128, 172, '#fcfcfc', 8, 'center');
  if (best) text('BEST: ' + best + ' SCREENS', 128, 196, '#7c7c7c', 8, 'center');
}

function render() {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 256, 224);
  if (state === 'title') { drawTitle(); return; }

  ctx.save();
  ctx.beginPath(); ctx.rect(0, HUD, PW, PH); ctx.clip();
  if (quake > 0) ctx.translate(quake & 2 ? 2 : -2, 0);
  if (state === 'scroll') {
    const p = scroll.t / scroll.dur;
    const ox = -scroll.dx * PW * p, oy = -scroll.dy * PH * p;
    drawGrid(scroll.oldScr, ox, oy);
    drawGrid(scroll.newScr, ox + scroll.dx * PW, oy + scroll.dy * PH);
    const px = (1 - p) * (scroll.from.x + ox) + p * (scroll.to.x + ox + scroll.dx * PW);
    const py = (1 - p) * (scroll.from.y + oy) + p * (scroll.to.y + oy + scroll.dy * PH);
    drawPlayer(px, py);
  } else {
    drawWorld();
  }
  ctx.restore();
  if (fade) {
    // stepped fade to black and back, when taking the stairs in or out of a dungeon
    ctx.globalAlpha = Math.ceil((1 - Math.abs(fade.t - 20) / 20) * 4) / 4;
    ctx.fillStyle = '#000000'; ctx.fillRect(0, HUD, PW, PH);
    ctx.globalAlpha = 1;
  }
  if (state === 'ocarina') drawOcarina();
  drawHUD();
  if (state === 'paused') drawPause();

  if (state === 'dead') {
    ctx.fillStyle = '#000000'; ctx.fillRect(0, HUD, PW, PH);
    text('GAME OVER', 128, HUD + 18, '#fcfcfc', 16, 'center');
    const secs = (endTime - startTime) / 1000;
    const time = Math.floor(secs / 60) + ':' + String(Math.floor(secs % 60)).padStart(2, '0');
    const rows = [
      ['SCREENS EXPLORED', visited.size],
      ['FARTHEST REACHED', farthest],
      ['GUARDIANS BEATEN', bossesBeaten],
      ['RUPEES', rupees],
      ['TIME', time],
    ];
    rows.forEach(([label, value], i) => {
      text(label, 40, HUD + 50 + i * 14, '#bcbcbc');
      text(String(value), 216, HUD + 50 + i * 14, '#fcfcfc', 8, 'right');
    });
    text(newBest ? 'NEW BEST!' : 'BEST: ' + best + ' SCREENS', 128, HUD + 128, newBest ? '#f8b800' : '#7c7c7c', 8, 'center');
    if (stateT > 60 && (frame >> 5) & 1) text('PRESS ' + BTN.start, 128, HUD + 150, '#fcfcfc', 8, 'center');
  }
}

