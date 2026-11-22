// The Velvet Vault — the game itself: state machine, level flow, the alarm,
// lasers, pickups, and the staged states the screenshots are taken from.
// Modes: title → play → caught → clear → over → win.

import { TILE, BOARD_X, BOARD_Y, dist, moveCircle, tileAt, tileCenter, isLaserTile } from './util.js';
import { LEVELS, findMarks } from './levels.js';
import { makeGuard, updateGuard } from './guard.js';
import { makeCamera, updateCamera } from './camera.js';
import { VaultAudio } from './audio.js';
import { VaultInput } from './input.js';
import { dropSmoke, throwDecoy, raiseCloak } from './tools.js';
import { drawGame } from './render.js';
import { drawHud } from './hud.js';

export const PLAYER_SPEED = 155;
export const PLAYER_RADIUS = 12;
export const ALARM_GUARD_RATE = 55;
export const ALARM_CAMERA_RATE = 40;
export const ALARM_DECAY = 12;
export const LASER_HIT = 25;

export const audio = new VaultAudio();
export const input = new VaultInput();

export let state = null;

export function loadLevel(index, keepScore, keepLives) {
  const def = LEVELS[index];
  const marks = findMarks(def.map);
  state = {
    mode: 'play',
    levelIndex: index,
    level: def,
    map: def.map,
    player: { x: marks.start.x, y: marks.start.y },
    start: { x: marks.start.x, y: marks.start.y },
    lastMove: { x: 0, y: 0 },
    guards: def.guards.map(makeGuard),
    cameras: def.cameras.map(makeCamera),
    coins: def.coins.map(([tx, ty]) => ({ ...tileCenter(tx, ty), taken: false })),
    gold: marks.gold.map((p) => ({ ...p, taken: false })),
    coinsTaken: 0,
    diamond: { x: marks.loot.x, y: marks.loot.y, taken: false },
    exit: { x: marks.exit.x, y: marks.exit.y },
    alarm: def.startAlarm || 0,
    score: keepScore || 0,
    levelStartScore: keepScore || 0,
    lives: keepLives === undefined ? 3 : keepLives,
    smokes: def.smokes,
    decoys: def.decoys,
    cloaks: def.cloaks,
    cloakT: 0,
    smokeClouds: [],
    decoy: null,
    time: 0,
    timeTotal: 0,
    toast: null,
    flash: 0,
    clearBonus: 0,
    frozen: false,
    blipTimer: 0,
    caughtTimer: 0,
    laserCooldown: 0,
    audio,
  };
  return state;
}

export function startGame() {
  loadLevel(0, 0, 3);
  audio.ensure();
}

export function nextLevel() {
  const s = state;
  const total = s.timeTotal + s.time;
  loadLevel(s.levelIndex + 1, s.score, s.lives);
  state.timeTotal = total;
}

export function retryLevel() {
  const s = state;
  loadLevel(s.levelIndex, s.levelStartScore, 3);
  state.timeTotal = s.timeTotal - s.time;
}

export function respawnAfterCaught() {
  const s = state;
  const def = s.level;
  s.player.x = s.start.x;
  s.player.y = s.start.y;
  s.guards = def.guards.map(makeGuard);
  s.cameras = def.cameras.map(makeCamera);
  s.smokeClouds = [];
  s.decoy = null;
  s.cloakT = 0;
  s.alarm = 40;
  s.mode = 'play';
}

export function toast(text) {
  state.toast = { text, t: 2.6 };
}

export function update(dt) {
  const s = state;
  if (s.toast) {
    s.toast.t -= dt;
    if (s.toast.t <= 0) s.toast = null;
  }
  if (s.flash > 0) s.flash = Math.max(0, s.flash - dt * 1.5);
  if (s.laserCooldown > 0) s.laserCooldown -= dt;

  if (s.mode === 'caught') {
    s.caughtTimer -= dt;
    if (s.caughtTimer <= 0) respawnAfterCaught();
    return;
  }
  if (s.mode !== 'play') return;

  s.time += dt;
  if (s.cloakT > 0) s.cloakT -= dt;

  // Move Rook.
  const mv = input.moveVector();
  s.lastMove = mv;
  if (mv.x !== 0 || mv.y !== 0) {
    const moved = moveCircle(s.map, s.player.x, s.player.y, PLAYER_RADIUS,
      mv.x * PLAYER_SPEED * dt, mv.y * PLAYER_SPEED * dt);
    s.player.x = moved.x;
    s.player.y = moved.y;
  }

  // Tools.
  if (input.pressed('e')) dropSmoke(s);
  if (input.pressed('q')) raiseCloak(s);
  if (input.pressed('m')) audio.muted = !audio.muted;
  while (input.clicks.length > 0) {
    const c = input.clicks.shift();
    throwDecoy(s, c.x, c.y);
  }

  // Guards and cameras.
  const cloaked = s.cloakT > 0;
  for (const g of s.guards) updateGuard(g, dt, s.player, s.map, s.smokeClouds, cloaked);
  for (const c of s.cameras) updateCamera(c, dt, s.player, s.map, s.smokeClouds, cloaked);

  // The alarm: climbs fast while seen, drains while hidden.
  const seenByGuard = s.guards.some((g) => g.spotted);
  const seenByCamera = s.cameras.some((c) => c.spotted);
  if (seenByGuard || seenByCamera) {
    if (seenByGuard) s.alarm += ALARM_GUARD_RATE * dt;
    if (seenByCamera) s.alarm += ALARM_CAMERA_RATE * dt;
    s.blipTimer -= dt;
    if (s.alarm > 50 && s.blipTimer <= 0) {
      audio.alarmBlip();
      s.blipTimer = 0.45;
    }
  } else {
    s.alarm = Math.max(0, s.alarm - ALARM_DECAY * dt);
  }

  // Lasers: crossing a beam spikes the alarm.
  const tile = tileAt(s.map, s.player.x, s.player.y);
  if (isLaserTile(tile) && s.laserCooldown <= 0) {
    s.alarm = Math.min(100, s.alarm + LASER_HIT);
    s.laserCooldown = 1.2;
    s.flash = 0.3;
    audio.laserZap();
    toast('LASER! The alarm jumps!');
  }

  // Smoke clouds and decoys fade.
  for (const sm of s.smokeClouds) sm.t -= dt;
  s.smokeClouds = s.smokeClouds.filter((sm) => sm.t > 0);
  if (s.decoy) {
    s.decoy.t -= dt;
    if (s.decoy.t <= 0) s.decoy = null;
  }

  // Pickups: coins, gold bars, the loot itself.
  for (const c of s.coins) {
    if (!c.taken && dist(s.player.x, s.player.y, c.x, c.y) < 22) {
      c.taken = true;
      s.coinsTaken += 1;
      s.score += 100;
      audio.coin();
    }
  }
  for (const g of s.gold) {
    if (!g.taken && dist(s.player.x, s.player.y, g.x, g.y) < 22) {
      g.taken = true;
      s.score += 250;
      audio.coin();
      toast('Gold bar! +250');
    }
  }
  if (!s.diamond.taken && dist(s.player.x, s.player.y, s.diamond.x, s.diamond.y) < 24) {
    s.diamond.taken = true;
    s.score += 500;
    audio.pickup();
    toast(`${s.level.lootName} secured — reach the exit!`);
  }

  // The exit opens once the loot is taken.
  if (s.diamond.taken && dist(s.player.x, s.player.y, s.exit.x, s.exit.y) < 26) {
    s.clearBonus = Math.max(0, 300 - Math.floor(s.time) * 2);
    s.score += s.clearBonus;
    audio.win();
    if (s.levelIndex >= LEVELS.length - 1) {
      s.mode = 'win';
      s.timeTotal += s.time;
    } else {
      s.mode = 'clear';
    }
    return;
  }

  // Caught at full alarm.
  if (s.alarm >= 100) {
    s.alarm = 100;
    s.lives -= 1;
    s.flash = 0.6;
    audio.caught();
    if (s.lives <= 0) {
      s.mode = 'over';
    } else {
      s.mode = 'caught';
      s.caughtTimer = 1.4;
    }
  }
}

// Staged states for the screenshots: frozen frames of the game itself, so
// the cover shows the thief, the cones, the cameras, the loot and the alarm
// meter all in one frame.
export function stageShot(name) {
  const tile = tileCenter;
  if (name === 'cover') {
    // Room one mid-heist: Rook in the open, a cone sweeping onto him.
    state.player.x = tile(11, 7).x;
    state.player.y = tile(11, 7).y;
    state.guards[0].x = tile(15, 7).x;
    state.guards[0].y = tile(15, 7).y;
    state.guards[0].facing = Math.PI;
    state.guards[1].x = tile(18, 12).x;
    state.guards[1].y = tile(18, 12).y;
    state.guards[1].facing = -Math.PI / 2;
    state.cameras[0].angle = Math.PI * 0.5;
    state.cameras[1].angle = Math.PI * 1.5;
    state.alarm = 55;
    state.coins[0].taken = true;
    state.coinsTaken = 1;
    state.score = 100;
    state.time = 42;
  } else if (name === 'tense') {
    // Room two, loot in hand, alarm high, a guard giving chase.
    loadLevel(1, 650, 3);
    const s2 = state;
    s2.diamond.taken = true;
    s2.player.x = tile(18, 12).x;
    s2.player.y = tile(18, 12).y;
    s2.guards[2].x = tile(16, 10).x;
    s2.guards[2].y = tile(16, 10).y;
    s2.guards[2].facing = Math.PI / 2;
    s2.guards[2].alert = 2.5;
    s2.guards[2].chaseX = s2.player.x;
    s2.guards[2].chaseY = s2.player.y;
    s2.guards[0].x = tile(10, 6).x;
    s2.guards[0].y = tile(10, 6).y;
    s2.guards[0].facing = 0;
    s2.cameras[0].angle = Math.PI * 0.5;
    s2.alarm = 78;
    s2.coins[0].taken = true;
    s2.coins[1].taken = true;
    s2.coinsTaken = 2;
    s2.score = 850;
    s2.time = 96;
  } else if (name === 'tool') {
    // Room three: smoke blooming, cloak up, a decoy ringing across the hall.
    loadLevel(2, 1400, 3);
    const s3 = state;
    s3.player.x = tile(11, 7).x;
    s3.player.y = tile(11, 7).y;
    s3.smokeClouds.push({ x: s3.player.x, y: s3.player.y, r: 95, t: 4 });
    s3.cloakT = 2.5;
    s3.cloaks = 1;
    s3.smokes = 3;
    s3.decoy = { x: tile(18, 7).x, y: tile(18, 7).y, t: 5 };
    s3.guards[3].x = tile(17, 8).x;
    s3.guards[3].y = tile(17, 8).y;
    s3.guards[3].facing = Math.PI / 2;
    s3.guards[3].investigateT = 4;
    s3.guards[3].investigateX = tile(18, 7).x;
    s3.guards[3].investigateY = tile(18, 7).y;
    s3.guards[0].x = tile(5, 2).x;
    s3.guards[0].y = tile(5, 2).y;
    s3.guards[0].facing = 0;
    s3.cameras[0].angle = Math.PI * 0.5;
    s3.cameras[1].angle = Math.PI * 1.5;
    s3.alarm = 34;
    s3.score = 1400;
    s3.time = 58;
    s3.toast = { text: 'Cloak up — unseen for 3 seconds!', t: 9 };
  } else if (name === 'escape') {
    // Room four, the getaway: loot taken, sprinting for the skylight exit.
    loadLevel(3, 2100, 2);
    const s4 = state;
    s4.diamond.taken = true;
    s4.player.x = tile(17, 12).x;
    s4.player.y = tile(17, 12).y;
    s4.guards[0].x = tile(12, 10).x;
    s4.guards[0].y = tile(12, 10).y;
    s4.guards[0].facing = 0;
    s4.guards[0].alert = 2.5;
    s4.guards[0].chaseX = s4.player.x;
    s4.guards[0].chaseY = s4.player.y;
    s4.guards[1].x = tile(20, 6).x;
    s4.guards[1].y = tile(20, 6).y;
    s4.guards[1].facing = Math.PI;
    s4.cameras[0].angle = Math.PI * 0.5;
    s4.alarm = 62;
    s4.coins[0].taken = true;
    s4.coinsTaken = 1;
    s4.score = 2100;
    s4.time = 74;
    s4.toast = { text: 'The case is yours — RUN for the skylight!', t: 9 };
  }
  // 'cover' needs nothing else: room one as it opens, staged mid-heist.
  state.frozen = true;
  state.mode = 'play';
}

export function handleClick() {
  const s = state;
  if (s.mode === 'title') {
    audio.ensure();
    audio.click();
    startGame();
  } else if (s.mode === 'clear') {
    audio.click();
    nextLevel();
  } else if (s.mode === 'over') {
    audio.click();
    retryLevel();
  } else if (s.mode === 'win') {
    audio.click();
    startGame();
  }
}

export function boot() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Debug hook for playtesting: lets a test driver read the live state.
  window.__vault = { get state() { return state; }, startGame, loadLevel };
  input.attach(canvas);
  canvas.addEventListener('mousedown', () => {
    // Clicks on screens advance them; clicks in play toss decoys (queued).
    // A screen-advancing click must not also become a decoy when play starts.
    if (state.mode !== 'play') {
      handleClick();
      input.clicks.length = 0;
    }
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && state.mode !== 'play') handleClick();
  });

  // A fresh load shows the title screen over room one.
  loadLevel(0, 0, 3);
  state.mode = 'title';

  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (shot) {
    stageShot(shot);
    // Frozen frame: one draw, no loop, so the shot is deterministic.
    drawGame(ctx, state, 1.234);
    drawHud(ctx, state, 1.234);
    return;
  }

  let last = performance.now();
  let t = 0;
  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    update(dt);
    drawGame(ctx, state, t);
    drawHud(ctx, state, t);
    input.endFrame();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

document.addEventListener('DOMContentLoaded', boot);
