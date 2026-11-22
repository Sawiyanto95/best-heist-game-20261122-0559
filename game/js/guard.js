// The Velvet Vault — the museum guards. A guard walks a straight patrol
// line, turns at each end, and watches a cone in front of him. Spot Rook
// and he gives chase for a few seconds; a decoy coin pulls him off to look.

import { angleTo, dist, insideCone, moveCircle, tileCenter } from './util.js';

export const GUARD_RANGE = 175;
export const GUARD_HALF_ANGLE = 0.56;

export function makeGuard(def) {
  const pts = def.path.map(([tx, ty]) => tileCenter(tx, ty));
  return {
    x: pts[0].x,
    y: pts[0].y,
    path: pts,
    leg: 0,
    speed: def.speed,
    facing: angleTo(pts[0].x, pts[0].y, pts[1].x, pts[1].y),
    spotted: false,
    alert: 0,
    chaseX: 0,
    chaseY: 0,
    investigateX: 0,
    investigateY: 0,
    investigateT: 0,
    walkPhase: 0,
  };
}

export function guardInvestigate(guard, x, y) {
  guard.investigateX = x;
  guard.investigateY = y;
  guard.investigateT = 4;
}

export function updateGuard(g, dt, player, map, clouds, cloaked) {
  g.walkPhase += dt * 10;

  // Can he see Rook right now? Not through smoke, not through a cloak.
  // Checked every frame, in every state: a guard standing on top of Rook
  // keeps the alarm climbing instead of forgetting him after one frame.
  const inSmoke = clouds.some((c) => dist(c.x, c.y, player.x, player.y) < c.r);
  g.spotted = !cloaked && !inSmoke &&
    insideCone(map, g.x, g.y, g.facing, GUARD_RANGE, GUARD_HALF_ANGLE, player.x, player.y);
  if (g.spotted) {
    g.alert = 2.5;
    g.chaseX = player.x;
    g.chaseY = player.y;
  }

  // A guard already chasing runs at the last place he saw Rook.
  if (g.alert > 0) {
    g.alert -= dt;
    const d = dist(g.x, g.y, g.chaseX, g.chaseY);
    if (d > 6) {
      const a = angleTo(g.x, g.y, g.chaseX, g.chaseY);
      g.facing = a;
      const moved = moveCircleGuard(g, a, g.speed * 1.6 * dt, map);
      g.x = moved.x;
      g.y = moved.y;
    }
    return;
  }

  // A decoy coin pulls the guard over to look at the spot.
  if (g.investigateT > 0) {
    g.investigateT -= dt;
    const d = dist(g.x, g.y, g.investigateX, g.investigateY);
    if (d > 8) {
      const a = angleTo(g.x, g.y, g.investigateX, g.investigateY);
      g.facing = a;
      const moved = moveCircleGuard(g, a, g.speed * 1.15 * dt, map);
      g.x = moved.x;
      g.y = moved.y;
    } else {
      g.facing += dt * 1.4;
    }
    return;
  }

  // Walk the patrol line, turning at each end.
  const target = g.path[g.leg];
  const d = dist(g.x, g.y, target.x, target.y);
  if (d < 4) {
    g.leg = (g.leg + 1) % g.path.length;
  } else {
    const a = angleTo(g.x, g.y, target.x, target.y);
    g.facing = a;
    const moved = moveCircleGuard(g, a, g.speed * dt, map);
    g.x = moved.x;
    g.y = moved.y;
  }
}

// Guards slide along walls like the player instead of walking through them.
function moveCircleGuard(g, angle, step, map) {
  const dx = Math.cos(angle) * step;
  const dy = Math.sin(angle) * step;
  return moveCircle(map, g.x, g.y, 12, dx, dy);
}
