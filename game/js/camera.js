'use strict';
/* The Velvet Vault — the ceiling security camera.
   Fixed to one spot, sweeping its red cone back and forth. Cameras cannot
   be lured by a decoy, but smoke blinds them like anything else. */


Heist.CAMERA_RANGE = 210;
Heist.CAMERA_HALF_ANGLE = 0.5; // about 29 degrees each side

Heist.makeCamera = function (def) {
  const p = Heist.tileCenter(def.at[0], def.at[1]);
  return {
    kind: 'camera',
    x: p.x,
    y: p.y,
    from: def.from,
    to: def.to,
    speed: def.speed,
    phase: 0,
    angle: (def.from + def.to) / 2,
    spotted: false,
  };
};

Heist.updateCamera = function (c, dt, player, map, smokes) {
  c.phase += dt * c.speed;
  const mid = (c.from + c.to) / 2;
  const amp = (c.to - c.from) / 2;
  c.angle = mid + Math.sin(c.phase) * amp;
  c.spotted = Heist.cameraSees(c, player, map, smokes);
};

Heist.cameraSees = function (c, player, map, smokes) {
  if (Heist.inSmoke(player.x, player.y, smokes)) return false;
  const d = Heist.dist(c.x, c.y, player.x, player.y);
  if (d > Heist.CAMERA_RANGE) return false;
  if (Heist.angleDiff(Heist.angleTo(c.x, c.y, player.x, player.y), c.angle) > Heist.CAMERA_HALF_ANGLE) {
    return false;
  }
  return !Heist.lineBlocked(map, c.x, c.y, player.x, player.y, smokes);
};
