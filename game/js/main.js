'use strict';
/* The Velvet Vault — the game itself: state machine, level flow, the alarm,
   the tools, and the staged states the screenshots are taken from.
   Modes: title → play → caught → clear → over → win. */


Heist.PLAYER_SPEED = 150;
Heist.PLAYER_RADIUS = 12;
Heist.ALARM_SEEN_RATE = 50; // per second while any guard sees Rook
Heist.ALARM_CAMERA_RATE = 40; // per second while any camera sees Rook
Heist.ALARM_DECAY = 10; // per second while unseen

Heist.state = null;

Heist.loadLevel = function (index, keepScore) {
  const def = Heist.LEVELS[index];
  const marks = Heist.findMarks(def.map);
  Heist.state = {
    mode: 'play',
    levelIndex: index,
    level: def,
    map: def.map,
    player: { x: marks.start.x, y: marks.start.y },
    start: { x: marks.start.x, y: marks.start.y },
    guards: def.guards.map(Heist.makeGuard),
    cameras: def.cameras.map(Heist.makeCamera),
    coins: def.coins.map(function (p) {
      const c = Heist.tileCenter(p[0], p[1]);
      return { x: c.x, y: c.y, taken: false };
    }),
    coinsTaken: 0,
    diamond: { x: marks.loot.x, y: marks.loot.y, taken: false },
    exit: { x: marks.exit.x, y: marks.exit.y },
    alarm: 0,
    score: keepScore || 0,
    levelStartScore: keepScore || 0,
    lives: 3,
    smokes: def.smokes,
    decoys: def.decoys,
    smokeClouds: [],
    decoy: null,
    time: 0,
    toast: null,
    flash: 0,
    clearBonus: 0,
    frozen: false,
    blipTimer: 0,
    caughtTimer: 0,
  };
  return Heist.state;
};

Heist.startGame = function () {
  Heist.loadLevel(0, 0);
  Heist.audio.ensure();
};

Heist.nextLevel = function () {
  const s = Heist.state;
  Heist.loadLevel(s.levelIndex + 1, s.score);
  Heist.state.lives = s.lives;
};

Heist.retryLevel = function () {
  const s = Heist.state;
  Heist.loadLevel(s.levelIndex, s.levelStartScore);
};

Heist.respawnAfterCaught = function () {
  const s = Heist.state;
  const def = s.level;
  s.player.x = s.start.x;
  s.player.y = s.start.y;
  s.guards = def.guards.map(Heist.makeGuard);
  s.cameras = def.cameras.map(Heist.makeCamera);
  s.smokeClouds = [];
  s.decoy = null;
  s.alarm = 40;
  s.mode = 'play';
};

Heist.toast = function (text) {
  Heist.state.toast = { text, t: 2.6 };
};

Heist.throwDecoy = function (x, y) {
  const s = Heist.state;
  if (s.decoys <= 0 || s.mode !== 'play') return;
  s.decoys -= 1;
  s.score = Math.max(0, s.score - 50);
  s.decoy = { x, y, t: 6 };
  Heist.audio.decoy();
  let best = null;
  let bestD = 1e9;
  for (const g of s.guards) {
    const d = Heist.dist(g.x, g.y, x, y);
    if (d < bestD) {
      bestD = d;
      best = g;
    }
  }
  if (best) Heist.guardInvestigate(best, x, y);
};

Heist.dropSmoke = function () {
  const s = Heist.state;
  if (s.smokes <= 0 || s.mode !== 'play') return;
  s.smokes -= 1;
  s.score = Math.max(0, s.score - 100);
  s.smokeClouds.push({ x: s.player.x, y: s.player.y, r: 90, t: 4 });
  Heist.audio.smoke();
};

Heist.update = function (dt) {
  const s = Heist.state;
  if (s.toast) s.toast.t -= dt;
  if (s.flash > 0) s.flash = Math.max(0, s.flash - dt * 1.5);

  if (s.mode === 'caught') {
    s.caughtTimer -= dt;
    if (s.caughtTimer <= 0) Heist.respawnAfterCaught();
    return;
  }
  if (s.mode !== 'play') return;

  s.time += dt;

  // --- Move Rook.
  const mv = Heist.input.moveVector();
  if (mv.x !== 0 || mv.y !== 0) {
    const moved = Heist.moveCircle(
      s.map, s.player.x, s.player.y, Heist.PLAYER_RADIUS,
      mv.x * Heist.PLAYER_SPEED * dt, mv.y * Heist.PLAYER_SPEED * dt
    );
    s.player.x = moved.x;
    s.player.y = moved.y;
  }

  // --- Tools.
  if (Heist.input.pressed('e')) Heist.dropSmoke();
  if (Heist.input.pressed('q')) {
    Heist.throwDecoy(s.player.x + 120, s.player.y);
  }
  while (Heist.input.clicks.length > 0) {
    const c = Heist.input.clicks.shift();
    Heist.throwDecoy(c.x, c.y);
  }
  if (Heist.input.pressed('m')) {
    Heist.audio.muted = !Heist.audio.muted;
  }

  // --- Guards and cameras.
  for (const g of s.guards) Heist.updateGuard(g, dt, s.player, s.map, s.smokeClouds);
  for (const c of s.cameras) Heist.updateCamera(c, dt, s.player, s.map, s.smokeClouds);

  // --- The alarm: climbs fast while seen, drains while hidden.
  const seenByGuard = s.guards.some((g) => g.spotted);
  const seenByCamera = s.cameras.some((c) => c.spotted);
  if (seenByGuard || seenByCamera) {
    s.alarm += (seenByGuard ? Heist.ALARM_SEEN_RATE : 0) * dt;
    s.alarm += (seenByCamera ? Heist.ALARM_CAMERA_RATE : 0) * dt;
    s.blipTimer -= dt;
    if (s.alarm > 50 && s.blipTimer <= 0) {
      Heist.audio.alarmBlip();
      s.blipTimer = 0.45;
    }
  } else {
    s.alarm = Math.max(0, s.alarm - Heist.ALARM_DECAY * dt);
  }

  // --- Smoke clouds and decoys fade.
  for (const sm of s.smokeClouds) sm.t -= dt;
  s.smokeClouds = s.smokeClouds.filter((sm) => sm.t > 0);
  if (s.decoy) {
    s.decoy.t -= dt;
    if (s.decoy.t <= 0) s.decoy = null;
  }

  // --- Pickups.
  for (const c of s.coins) {
    if (!c.taken && Heist.dist(s.player.x, s.player.y, c.x, c.y) < 22) {
      c.taken = true;
      s.coinsTaken += 1;
      s.score += 100;
      Heist.audio.coin();
    }
  }
  if (!s.diamond.taken && Heist.dist(s.player.x, s.player.y, s.diamond.x, s.diamond.y) < 24) {
    s.diamond.taken = true;
    s.score += 500;
    Heist.audio.pickup();
    Heist.toast('Diamond secured — reach the exit!');
  }

  // --- The exit opens once the diamond is taken.
  if (s.diamond.taken && Heist.dist(s.player.x, s.player.y, s.exit.x, s.exit.y) < 26) {
    s.clearBonus = Math.max(0, 300 - Math.floor(s.time) * 2);
    s.score += s.clearBonus;
    Heist.audio.win();
    if (s.levelIndex >= Heist.LEVELS.length - 1) {
      s.mode = 'win';
    } else {
      s.mode = 'clear';
    }
    return;
  }

  // --- Caught at full alarm.
  if (s.alarm >= 100) {
    s.alarm = 100;
    s.lives -= 1;
    s.flash = 0.6;
    Heist.audio.caught();
    if (s.lives <= 0) {
      s.mode = 'over';
    } else {
      s.mode = 'caught';
      s.caughtTimer = 1.4;
    }
  }
};

/* Staged states for the screenshots: frozen frames of the game itself,
   so the cover shows the thief, the cones, the cameras, the loot and the
   alarm meter all in one frame. */
Heist.stageShot = function (name) {
  const s = Heist.state;
  const tile = Heist.tileCenter;
  if (name === 'play') {
    // Mid-heist in room one: Rook behind a case, a cone sweeping at him.
    s.player.x = tile(11, 7).x;
    s.player.y = tile(11, 7).y;
    s.guards[0].x = tile(14, 7).x;
    s.guards[0].y = tile(14, 7).y;
    s.guards[0].facing = Math.PI;
    s.guards[1].x = tile(18, 12).x;
    s.guards[1].y = tile(18, 12).y;
    s.guards[1].facing = -Math.PI / 2;
    s.cameras[0].angle = Math.PI * 0.5;
    s.cameras[1].angle = Math.PI * 1.5;
    s.alarm = 55;
    s.coins[0].taken = true;
    s.coinsTaken = 1;
    s.score = 100;
    s.time = 42;
  } else if (name === 'end') {
    // Room two, diamond in hand, alarm high, sprinting for the exit.
    Heist.loadLevel(1, 650);
    const s2 = Heist.state;
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
  } else if (name === 'vault') {
    // Room three at the start: four guards, three cameras, full board.
    Heist.loadLevel(2, 1400);
    Heist.state.time = 8;
  }
  // 'start' needs nothing: room one as it opens.
  Heist.state.frozen = true;
  Heist.state.mode = 'play';
};

Heist.handleClick = function () {
  const s = Heist.state;
  if (s.mode === 'title') {
    Heist.audio.ensure();
    Heist.audio.click();
    Heist.startGame();
  } else if (s.mode === 'clear') {
    Heist.audio.click();
    Heist.nextLevel();
  } else if (s.mode === 'over') {
    Heist.audio.click();
    Heist.retryLevel();
  } else if (s.mode === 'win') {
    Heist.audio.click();
    Heist.startGame();
  }
};

Heist.boot = function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  Heist.input.attach(canvas);
  canvas.addEventListener('mousedown', () => {
    // Clicks on screens advance them; clicks in play toss decoys (queued).
    if (Heist.state.mode !== 'play') Heist.handleClick();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && Heist.state.mode !== 'play') Heist.handleClick();
  });

  // A fresh load shows the title screen over room one.
  Heist.loadLevel(0, 0);
  Heist.state.mode = 'title';

  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (shot) {
    Heist.stageShot(shot);
    // Frozen frame: one draw, no loop, so the shot is deterministic.
    Heist.drawGame(ctx, Heist.state, 1.234);
    return;
  }

  let last = performance.now();
  let t = 0;
  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    Heist.update(dt);
    Heist.drawGame(ctx, Heist.state, t);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
};

document.addEventListener('DOMContentLoaded', Heist.boot);
