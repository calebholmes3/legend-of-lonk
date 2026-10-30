// ---------- Enemies ----------
function updOcto(e, pc) {
  if (e.pause > 0) {
    e.pause--;
    if (e.pause === 10) {
      const c = center(e), [dx, dy] = DIRS[e.dir], sp = e.tough ? 3 : 2.4;
      projs.push({ type: 'rock', x: c.x - 3 + dx * 8, y: c.y - 3 + dy * 8, w: 6, h: 6, vx: dx * sp, vy: dy * sp, life: 240, dmg: e.tough ? 4 : 2 });
    }
    return;
  }
  if (--e.timer <= 0) {
    if (Math.random() < 0.4) {
      const ec = center(e), dx = pc.x - ec.x, dy = pc.y - ec.y;
      e.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    } else {
      e.dir = DIR_NAMES[Math.floor(Math.random() * 4)];
    }
    e.timer = 30 + Math.random() * 70;
    if (Math.random() < (e.tough ? 0.5 : 0.35)) e.pause = 28;
    return;
  }
  const [dx, dy] = DIRS[e.dir];
  if (move(e, dx * 0.6 * e.spd, dy * 0.6 * e.spd)) e.timer = 0;
}

function updSlime(e, pc) {
  if (e.hop > 0) { e.hop--; move(e, e.vx, 0); move(e, 0, e.vy); return; }
  if (--e.timer <= 0) {
    const ec = center(e), dx = pc.x - ec.x, dy = pc.y - ec.y, d = Math.hypot(dx, dy) || 1;
    e.vx = dx / d * 1.4 * e.spd + (Math.random() - 0.5) * 0.8;
    e.vy = dy / d * 1.4 * e.spd + (Math.random() - 0.5) * 0.8;
    e.hop = 18;
    e.timer = (35 + Math.random() * 45) / e.spd;
  }
}

// Guardians are armored: hits just clink off. They stalk you spitting fire, then wind up and charge
// in a straight line. Dodge so they slam into a wall or pillar, and they're dazed and open to attack
// for a moment. Below 40% health they get faster, charge sooner and spit wider spreads.
// The guardians of your first two dungeons are gentler (BOSS_TIERS); pairs are [calm, angry].
const BOSS_TIERS = [
  { hp: 5, spd: 0.4, fire: [[-0.2, 0.2], [-0.3, 0, 0.3]], every: [130, 100], windup: [54, 42], charge: [2.2, 2.6], daze: [190, 150] },
  { hp: 7, spd: 0.45, fire: [[-0.3, 0, 0.3], [-0.4, -0.13, 0.13, 0.4]], every: [115, 85], windup: [44, 32], charge: [2.5, 3], daze: [170, 130] },
  { hp: null, spd: 0.5, fire: [[-0.3, 0, 0.3], [-0.5, -0.25, 0, 0.25, 0.5]], every: [100, 70], windup: [36, 24], charge: [2.8, 3.4], daze: [150, 110] },
];
function updBoss(e, pc) {
  const ec = center(e), dx = pc.x - ec.x, dy = pc.y - ec.y, d = Math.hypot(dx, dy) || 1;
  const angry = e.hp <= e.maxHp * 0.4, a1 = angry ? 1 : 0;
  const B = BOSS_TIERS[scr.tier], lvl = scr.tier < 2 ? 0 : Math.min(1, scr.d / 20);
  e.mt--;
  if (e.mode === 'stalk') {
    const sp = B.spd + a1 * 0.25 + lvl * 0.25;
    move(e, dx / d * sp, 0);
    move(e, 0, dy / d * sp);
    if (--e.timer <= 0) {
      e.timer = B.every[a1];
      const a = Math.atan2(dy, dx), fs = 1.8 + lvl * 0.8;
      for (const o of B.fire[a1])
        projs.push({ type: 'fire', x: ec.x - 4, y: ec.y - 4, w: 8, h: 8, vx: Math.cos(a + o) * fs, vy: Math.sin(a + o) * fs, life: 300, dmg: scr.d >= 12 ? 4 : 2 });
      sfx('fire');
    }
    if (e.mt <= 0) { e.mode = 'windup'; e.mt = B.windup[a1]; sfx('windup'); }
  } else if (e.mode === 'windup') {
    // aim at wherever you are when the windup ends
    if (e.mt <= 0) { e.mode = 'charge'; e.cdx = dx / d; e.cdy = dy / d; e.mt = 100; }
  } else if (e.mode === 'charge') {
    const sp = B.charge[a1] + lvl * 0.6;
    const hitX = move(e, e.cdx * sp, 0), hitY = move(e, 0, e.cdy * sp);
    if (hitX || hitY) {
      e.mode = 'dazed'; e.mt = B.daze[a1];
      quake = 14;
      puff(ec.x + e.cdx * 14, ec.y + e.cdy * 14, '#bcbcbc', 10, 1.5);
      sfx('slam');
    } else if (e.mt <= 0) { e.mode = 'stalk'; e.mt = 90; }
  } else if (e.mt <= 0) {
    // dazed, back to stalking
    e.mode = 'stalk'; e.mt = (angry ? 70 : 120) + Math.random() * 60; e.timer = 40;
  }
}

function updateEnemies() {
  const pc = center(player);
  for (const e of enemies) {
    e.anim++;
    if (e.flash > 0) e.flash--;
    if (e.spawn > 0) { e.spawn--; continue; }
    if (e.stun > 0) e.stun--;
    if (e.ifr > 0) e.ifr--;
    if (e.kbt > 0) { e.kbt--; move(e, e.kbx, 0); move(e, 0, e.kby); }
    else if (e.stun > 0) { /* frozen in place */ }
    else if (e.type === 'octo') updOcto(e, pc);
    else if (e.type === 'slime') updSlime(e, pc);
    else updBoss(e, pc);
    if (state === 'play' && player.inv === 0 && e.stun === 0 && e.mode !== 'dazed' && overlap(hb(e), hb(player))) {
      const c = center(e);
      hurtPlayer(e.type === 'boss' ? (e.mode === 'charge' ? 6 : 4) : e.tough ? 4 : 2, c.x, c.y);
    }
  }
  enemies = enemies.filter(e => !e.dead);
}

function updateProjs() {
  for (const b of projs) {
    if (b.dead) continue;
    b.x += b.vx; b.y += b.vy; b.life--;
    if (b.life <= 0 || b.x < -8 || b.y < -8 || b.x > PW || b.y > PH) { b.dead = true; continue; }
    if (b.type === 'rock' && solidPx(b.x + 3, b.y + 3, false)) {
      b.dead = true; puff(b.x + 3, b.y + 3, '#c84c0c', 5, 1); continue;
    }
    if (state === 'play' && player.inv === 0 && overlap(b, hb(player))) {
      const p = player, [fx, fy] = DIRS[p.dir];
      const guarding = p.shield && p.atk === 0 && p.shoot === 0;
      b.dead = true;
      if (guarding && fx * b.vx + fy * b.vy < -0.8) {
        sfx('block'); puff(b.x + 3, b.y + 3, '#fcfcfc', 4, 1);
      } else {
        hurtPlayer(b.dmg || 2, b.x + b.w / 2 - b.vx * 4, b.y + b.h / 2 - b.vy * 4);
      }
    }
  }
  projs = projs.filter(b => !b.dead);
}

function updatePickups() {
  for (const k of pickups) {
    if (k.dead) continue;
    k.t--;
    if (k.t <= 0) { k.dead = true; continue; }
    if (overlap({ x: k.x - 5, y: k.y - 6, w: 10, h: 12 }, hb(player))) collect(k);
  }
  pickups = pickups.filter(k => !k.dead);
}

function updateParts() {
  for (const q of parts) { q.x += q.vx; q.y += q.vy; q.vx *= 0.9; q.vy *= 0.9; q.life--; }
  parts = parts.filter(q => q.life > 0);
}

