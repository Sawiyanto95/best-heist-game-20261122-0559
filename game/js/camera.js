// The Velvet Vault — the ceiling cameras. Each one sweeps a fixed arc from
// its wall mount, and its red cone watches the floor below. Smoke blinds it.

import { dist, insideCone, tileCenter } from './util.js';

export const CAMERA_RANGE = 205;
export const CAMERA_HALF_ANGLE = 0.44;

export function makeCamera(def) {
  const at = tileCenter(def.at[0], def.at[1]);
  return {
    x: at.x,
    y: at.y,
    from: def.from,
    to: def.to,
    speed: def.speed,
    angle: (def.from + def.to) / 2,
    dir: 1,
    spotted: false,
    sweepPhase: Math.random() * 6,
  };
}

export function updateCamera(c, dt, player, map, clouds, cloaked) {
  c.sweepPhase += dt;
  c.angle += c.speed * c.dir * dt;
  if (c.angle >= c.to) { c.angle = c.to; c.dir = -1; }
  if (c.angle <= c.from) { c.angle = c.from; c.dir = 1; }

  const inSmoke = clouds.some((cl) => dist(cl.x, cl.y, player.x, player.y) < cl.r);
  c.spotted = !cloaked && !inSmoke &&
    insideCone(map, c.x, c.y, c.angle, CAMERA_RANGE, CAMERA_HALF_ANGLE, player.x, player.y);
}
