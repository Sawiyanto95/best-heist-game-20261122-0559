'use strict';
/* The Velvet Vault — the patrol guard.
   A guard walks its waypoints, pauses at each, and sweeps a vision cone
   ahead of it. Spotting Rook fills the alarm and makes the guard chase the
   last place it saw him; a thrown decoy pulls it off patrol to investigate. */


Heist.GUARD_RANGE = 175;
Heist.GUARD_HALF_ANGLE = 0.6; // about 34 degrees each side of facing
Heist.GUARD_CHASE_SPEED = 1.6; // multiplier while chasing

Heist.makeGuard = function (def) {
  const pts = def.path.map(function (p) {
    return Heist.tileCenter(p[0], p[1]);
  });
  return {
    kind: 'guard',
    path: pts,
    at: 0, // index of the waypoint being walked towards
    x: pts[0].x,
    y: pts[0].y,
    facing: 0,
    speed: def.speed,
    pause: 0, // seconds left standing at a waypoint
    alert: 0, // seconds left chasing a sighting
    chaseX: 0,
    chaseY: 0,
    investigateX: 0,
    investigateY: 0,
    investigating: 0, // seconds left looking at a decoy
    spotted: false, // seeing Rook right now
  };
};

Heist.updateGuard = function (g, dt, player, map, smokes) {
  g.spotted = Heist.guardSees(g, player, map, smokes);
  if (g.spotted) {
    g.alert = 2.5;
    g.chaseX = player.x;
    g.chaseY = player.y;
  }

  let tx;
  let ty;
  let speed = g.speed;
  if (g.alert > 0) {
    // Chase the last place Rook was seen.
    tx = g.chaseX;
    ty = g.chaseY;
    speed = g.speed * Heist.GUARD_CHASE_SPEED;
    g.alert -= dt;
  } else if (g.investigating > 0) {
    // Walk over to the noise and look around.
    tx = g.investigateX;
    ty = g.investigateY;
    g.investigating -= dt;
  } else {
    tx = g.path[g.at].x;
    ty = g.path[g.at].y;
  }

  if (g.pause > 0) {
    g.pause -= dt;
    if (g.pause <= 0 && g.alert <= 0 && g.investigating <= 0) {
      g.at = (g.at + 1) % g.path.length;
    }
    return;
  }

  const dx = tx - g.x;
  const dy = ty - g.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d < 3) {
    if (g.alert > 0 || g.investigating > 0) {
      g.pause = 1.0; // look around where the noise was
      if (g.investigating > 0) g.investigating = 0;
    } else {
      g.pause = 1.2;
    }
    return;
  }
  g.facing = Math.atan2(dy, dx);
  const step = Math.min(d, speed * dt);
  const moved = Heist.moveCircle(map, g.x, g.y, 12, (dx / d) * step, (dy / d) * step);
  g.x = moved.x;
  g.y = moved.y;
};

/* True when Rook is inside this guard's cone with a clear line of sight,
   or close enough to be felt. Smoke blocks sight both ways. */
Heist.guardSees = function (g, player, map, smokes) {
  if (Heist.inSmoke(player.x, player.y, smokes)) return false;
  const d = Heist.dist(g.x, g.y, player.x, player.y);
  if (d < 26) return true; // bumped into him
  if (d > Heist.GUARD_RANGE) return false;
  if (Heist.angleDiff(Heist.angleTo(g.x, g.y, player.x, player.y), g.facing) > Heist.GUARD_HALF_ANGLE) {
    return false;
  }
  return !Heist.lineBlocked(map, g.x, g.y, player.x, player.y, smokes);
};

/* A decoy coin landing nearby pulls the closest guard off its patrol. */
Heist.guardInvestigate = function (g, x, y) {
  if (Heist.dist(g.x, g.y, x, y) > 320) return false;
  g.investigateX = x;
  g.investigateY = y;
  g.investigating = 6;
  g.alert = 0;
  return true;
};

/* True when a point sits inside any active smoke cloud. */
Heist.inSmoke = function (x, y, smokes) {
  for (const s of smokes) {
    if (Heist.dist(x, y, s.x, s.y) < s.r) return true;
  }
  return false;
};
