// ---------- Player ----------
function swordRect() {
  const p = player;
  switch (p.dir) {
    case 'right': return { x: p.x + 12, y: p.y + 8, w: 11, h: 4 };
    case 'left': return { x: p.x - 7, y: p.y + 8, w: 11, h: 4 };
    case 'up': return { x: p.x + 2, y: p.y - 9, w: 4, h: 12 };
    default: return { x: p.x + 10, y: p.y + 12, w: 4, h: 12 };
  }
}

function swordHits() {
  const p = player, s = swordRect();
  for (const e of enemies) {
    if (e.spawn > 0 || e.dead || p.hit.has(e)) continue;
    if (overlap(s, hb(e))) { p.hit.add(e); damageEnemy(e, p.dir, SWORDS[p.sword - 1].dmg); }
  }
  for (const b of projs) {
    if (!b.dead && overlap(s, b)) { b.dead = true; puff(b.x + b.w / 2, b.y + b.h / 2, '#fcfcfc', 5, 1); sfx('block'); }
  }
  for (const [x, y] of [[s.x + 1, s.y + 1], [s.x + s.w - 1, s.y + s.h - 1], [s.x + s.w / 2, s.y + s.h / 2]]) {
    const c = Math.floor(x / T), r = Math.floor(y / T);
    if (c < 1 || r < 1 || c >= COLS - 1 || r >= ROWS - 1) continue;
    if (grid[r][c] === 'B') {
      grid[r][c] = '.';
      puff(c * T + 8, r * T + 8, BIOMES[scr.biome].bush[1], 8, 1.2);
      sfx('cut');
      const roll = Math.random();
      const type = roll < 0.15 ? 'rupee' : roll < 0.3 ? 'heart' : roll < 0.38 && hasBow() ? 'arrows' : null;
      if (type) pickups.push({ type, x: c * T + 8, y: r * T + 8, t: 480 });
    }
  }
}

function damageEnemy(e, dir = player.dir, dmg = 1) {
  const boss = e.type === 'boss';
  // a guardian shrugs off hits unless it's dazed from slamming into something
  if (boss && (e.mode !== 'dazed' || e.ifr > 0)) {
    if (e.mode !== 'dazed') {
      const pc = center(player), c = center(e);
      puff((pc.x + c.x) / 2, (pc.y + c.y) / 2, '#fcfcfc', 4, 1);
      sfx('block');
    }
    return;
  }
  e.hp -= dmg;
  e.flash = 14;
  if (boss) e.ifr = 20;
  const [dx, dy] = DIRS[dir];
  e.kbx = dx * (boss ? 2 : 3); e.kby = dy * (boss ? 2 : 3); e.kbt = boss ? 5 : 8;
  sfx('hit');
  if (e.hp > 0) return;
  e.dead = true;
  const c = center(e);
  puff(c.x, c.y, '#fcfcfc', boss ? 24 : 10, boss ? 2.5 : 1.5);
  sfx('kill');
  if (boss) {
    scr.bossDead = true;
    dun.done = true;
    bossesBeaten++;
    sfx('boss');
    pickups.push({ type: 'container', x: Math.max(32, Math.min(PW - 32, c.x)), y: Math.max(32, Math.min(PH - 32, c.y)), t: Infinity });
  } else {
    drop(c.x, c.y);
  }
}

// dmg is in quarter hearts; the blue mail halves it
function hurtPlayer(dmg, fx, fy) {
  const p = player;
  if (p.hold > 0 || (hook && hook.phase === 'pull')) return;
  p.hp -= p.armor ? dmg / 2 : dmg;
  p.inv = 60;
  sfx('hurt');
  const c = center(p), dx = c.x - fx, dy = c.y - fy;
  if (Math.abs(dx) > Math.abs(dy)) { p.kbx = (Math.sign(dx) || 1) * 3; p.kby = 0; }
  else { p.kby = (Math.sign(dy) || 1) * 3; p.kbx = 0; }
  p.kbt = 8;
  if (p.hp <= 0) {
    p.hp = 0;
    state = 'dead'; stateT = 0;
    endTime = performance.now();
    if (visited.size > best) {
      best = visited.size; newBest = true;
      try { localStorage.setItem('lonkBest', String(best)); } catch (e) {}
    }
    sfx('die');
  }
}

function updatePlayer() {
  const p = player;
  if (p.inv > 0) p.inv--;
  if (hook) return; // rooted in place while the hookshot is out
  if (p.kbt > 0) { p.kbt--; move(p, p.kbx, 0); move(p, 0, p.kby); }
  if (p.atk > 0) {
    p.atk--;
    if (p.atk > 0) swordHits();
  }
  if (p.shoot > 0) p.shoot--;
  // a press during a swing is buffered and fires the moment the swing ends
  if (pressed.has('attack')) p.queued = true;
  if (p.queued && p.atk === 0 && p.shoot === 0) startSwing();
  if (pressed.has('item') && p.atk === 0 && p.shoot === 0) {
    if (p.bItem === 'bow' && arrows.length < 2) { if (p.arrows > 0) fireArrow(); else sfx('error'); }
    else if (p.bItem === 'boomerang' && !boomer) throwBoomerang();
    else if (p.bItem === 'hookshot') fireHook();
    else if (p.bItem === 'ocarina') { startOcarina(); return; }
  }
  if (p.kbt > 0) return;

  const dx = (isHeld('right') ? 1 : 0) - (isHeld('left') ? 1 : 0);
  const dy = (isHeld('down') ? 1 : 0) - (isHeld('up') ? 1 : 0);
  if (!dx && !dy) return;
  // facing locks during a swing or shot; otherwise face the most recent key that matches the movement
  if (p.atk === 0 && p.shoot === 0) {
    const d = heldDir();
    const [fx, fy] = d ? DIRS[d] : [0, 0];
    if ((fx && fx === dx) || (fy && fy === dy)) p.dir = d;
    else p.dir = dx ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  }
  const sp = (p.atk > 0 || p.shoot > 0 ? 1.1 : 1.4) / (dx && dy ? Math.SQRT2 : 1);
  move(p, dx * sp, dy * sp);
  p.walk++;
}

function startSwing() {
  const p = player;
  p.atk = 12;
  p.queued = false;
  p.hit = new Set();
  sfx('sword');
  swordHits();
}

function fireArrow() {
  const p = player, [dx, dy] = DIRS[p.dir];
  const cx = p.x + 8, cy = p.y + 10;
  p.shoot = 14; p.shootKind = 'bow';
  p.arrows--;
  arrows.push(dx
    ? { x: cx + dx * 6 - 6, y: cy - 2, w: 12, h: 3, vx: dx * 4, vy: 0, dir: p.dir }
    : { x: cx - 1, y: cy + dy * 6 - 6, w: 3, h: 12, vx: 0, vy: dy * 4, dir: p.dir });
  sfx('arrow');
}

function updateArrows() {
  for (const a of arrows) {
    a.x += a.vx; a.y += a.vy;
    const [dx, dy] = DIRS[a.dir];
    const tx = a.x + a.w / 2 + dx * a.w / 2, ty = a.y + a.h / 2 + dy * a.h / 2;
    if (!inPlay(tx, ty)) { a.dead = true; continue; }
    // arrows fly over water and ravines but stop at trees, rocks, bushes and posts
    if (flyBlocked(tileAt(tx, ty))) { a.dead = true; puff(tx, ty, '#fcd8a8', 4, 1); continue; }
    for (const e of enemies) {
      if (e.dead || e.spawn > 0 || !overlap(a, hb(e))) continue;
      damageEnemy(e, a.dir);
      a.dead = true;
      break;
    }
  }
  arrows = arrows.filter(a => !a.dead);
}

// The boomerang flies out (diagonals allowed), stuns what it touches, grabs drops, then homes back.
function throwBoomerang() {
  const p = player;
  let dx = (isHeld('right') ? 1 : 0) - (isHeld('left') ? 1 : 0);
  let dy = (isHeld('down') ? 1 : 0) - (isHeld('up') ? 1 : 0);
  if (!dx && !dy) [dx, dy] = DIRS[p.dir];
  const d = Math.hypot(dx, dy), c = center(p);
  boomer = { x: c.x - 4, y: c.y - 4, w: 8, h: 8, vx: dx / d * 3.5, vy: dy / d * 3.5, t: 0, back: false, hit: new Set() };
  p.shoot = 10; p.shootKind = 'boomerang';
  sfx('boomerang');
}

function updateBoomer() {
  const b = boomer;
  if (!b) return;
  b.t++;
  if (b.t % 10 === 0) tone(800, 0.05, 'triangle', 0.02, 500);
  const bx = b.x + 4, by = b.y + 4;
  if (!b.back) {
    b.x += b.vx; b.y += b.vy;
    const nx = b.x + 4, ny = b.y + 4;
    if (b.t > 26 || !inPlay(nx, ny) || flyBlocked(tileAt(nx, ny))) b.back = true;
  } else {
    const pc = center(player), dx = pc.x - bx, dy = pc.y - by, d = Math.hypot(dx, dy) || 1;
    if (d < 6) { boomer = null; return; }
    b.x += dx / d * 4; b.y += dy / d * 4;
  }
  for (const e of enemies) {
    if (e.dead || e.spawn > 0 || b.hit.has(e) || !overlap(b, hb(e))) continue;
    b.hit.add(e);
    b.back = true;
    if (e.type === 'boss') { sfx('block'); continue; } // guardians can't be stunned
    e.stun = 150;
    e.flash = 8;
    sfx('stun');
  }
  for (const k of pickups) if (!k.dead && k.type !== 'piece' && k.type !== 'container' && overlap(b, { x: k.x - 5, y: k.y - 6, w: 10, h: 12 })) collect(k);
}

// The hookshot shoots straight out up to 6 tiles. It latches onto posts and reels you to them,
// stuns any enemy it hits, and bounces off anything else solid.
const HOOK_RANGE = 96;
const hookOrigin = () => {
  const [dx, dy] = DIRS[player.dir];
  return { x: player.x + 8 + dx * 6, y: player.y + 10 + dy * 6 };
};
function fireHook() {
  const p = player, [dx, dy] = DIRS[p.dir], o = hookOrigin();
  hook = { x: o.x, y: o.y, dx, dy, dist: 0, phase: 'out', tx: 0, ty: 0 };
  p.shoot = 1; p.shootKind = 'hookshot';
  sfx('hook');
}

function updateHook() {
  const h = hook, p = player;
  if (!h) return;
  if (h.phase === 'out') {
    for (let step = 0; step < 2 && h.phase === 'out'; step++) {
      h.x += h.dx * 3; h.y += h.dy * 3; h.dist += 3;
      if (!inPlay(h.x, h.y) || h.dist >= HOOK_RANGE) { h.phase = 'back'; break; }
      const c = Math.floor(h.x / T), r = Math.floor(h.y / T), ch = grid[r][c];
      if (ch === 'P') {
        // land on the tile in front of the post, as long as it's solid ground
        const lc = c - h.dx, lr = r - h.dy;
        sfx('clink');
        if (lc >= 0 && lr >= 0 && lc < COLS && lr < ROWS && !SOLID.has(grid[lr][lc])) {
          h.phase = 'pull'; h.tx = lc * T; h.ty = lr * T - 2;
        } else h.phase = 'back';
      } else if (flyBlocked(ch)) {
        h.phase = 'back'; sfx('clink'); puff(h.x, h.y, '#fcfcfc', 4, 1);
      } else {
        for (const e of enemies) {
          if (e.dead || e.spawn > 0 || !overlap({ x: h.x - 3, y: h.y - 3, w: 6, h: 6 }, hb(e))) continue;
          h.phase = 'back';
          if (e.type === 'boss') { sfx('block'); break; }
          e.stun = 150;
          e.flash = 8;
          sfx('stun');
          break;
        }
      }
    }
  } else if (h.phase === 'back') {
    h.dist -= 6;
    if (h.dist <= 0) { hook = null; return; }
    const o = hookOrigin();
    h.x = o.x + h.dx * h.dist; h.y = o.y + h.dy * h.dist;
  } else {
    const dx = h.tx - p.x, dy = h.ty - p.y, d = Math.hypot(dx, dy);
    if (d <= 4) { p.x = h.tx; p.y = h.ty; hook = null; }
    else { p.x += dx / d * 4; p.y += dy / d * 4; }
  }
}

function checkEdges() {
  const p = player;
  let dir = null;
  if (p.x < -6) dir = 'left';
  else if (p.x > PW - 10) dir = 'right';
  else if (p.y < -8) dir = 'up';
  else if (p.y > PH - 10) dir = 'down';
  if (!dir) return;
  // the entrance room's south door leads back outside
  if (dun && dir === 'down' && scr.kind === 'start') { startFade(exitDungeon); sfx('stairs'); return; }
  const [dx, dy] = DIRS[dir];
  let next;
  if (dun) {
    next = dun.rooms.get((dpos.x + dx) + ',' + (dpos.y + dy));
    if (!next) { p.x = Math.max(-6, Math.min(PW - 10, p.x)); p.y = Math.max(-8, Math.min(PH - 10, p.y)); return; }
    dpos = { x: dpos.x + dx, y: dpos.y + dy };
  } else {
    const nsx = cur.sx + dx, nsy = cur.sy + dy, key = nsx + ',' + nsy;
    next = screens[key] || (screens[key] = genScreen(nsx, nsy));
    cur = { sx: nsx, sy: nsy };
  }
  scroll = { dx, dy, t: 0, dur: 50, oldScr: scr, newScr: next, from: { x: p.x, y: p.y } };
  if (dir === 'left') p.x = PW - 16;
  if (dir === 'right') p.x = 0;
  if (dir === 'up') p.y = PH - 16;
  if (dir === 'down') p.y = 0;
  scroll.to = { x: p.x, y: p.y };
  enemies = []; projs = []; pickups = []; arrows = []; boomer = null; hook = null;
  state = 'scroll';
}

