'use strict';
/* The Velvet Vault — shared helpers: grid geometry, sight lines and angles.
   Every other file hangs its work off the single Heist namespace below. */

const Heist = window.Heist || (window.Heist = {});

Heist.TILE = 40; // pixels per grid cell
Heist.COLS = 24; // room width in cells
Heist.ROWS = 15; // room height in cells
Heist.W = Heist.COLS * Heist.TILE; // 960
Heist.H = Heist.ROWS * Heist.TILE; // 600

Heist.clamp = function (v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
};

Heist.dist = function (x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  return Math.sqrt(dx * dx + dy * dy);
};

Heist.angleTo = function (x0, y0, x1, y1) {
  return Math.atan2(y1 - y0, x1 - x0);
};

/* Smallest absolute difference between two angles, in radians. */
Heist.angleDiff = function (a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
};

/* The map is an array of 15 strings, 24 characters each.
   '#' wall, 'C' crate, 'D' display case: all three block movement and sight.
   Anything else is open floor. */
Heist.tileAt = function (map, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= Heist.COLS || ty >= Heist.ROWS) return '#';
  return map[ty][tx];
};

Heist.isSolid = function (map, tx, ty) {
  const c = Heist.tileAt(map, tx, ty);
  return c === '#' || c === 'C' || c === 'D';
};

Heist.tileCenter = function (tx, ty) {
  return { x: tx * Heist.TILE + Heist.TILE / 2, y: ty * Heist.TILE + Heist.TILE / 2 };
};

/* Walk a straight line in small steps; true when a wall, crate or case
   (or a smoke cloud, when smokes are given) stands between the two points. */
Heist.lineBlocked = function (map, x0, y0, x1, y1, smokes) {
  const d = Heist.dist(x0, y0, x1, y1);
  const steps = Math.max(1, Math.ceil(d / 4));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    if (Heist.isSolid(map, Math.floor(x / Heist.TILE), Math.floor(y / Heist.TILE))) return true;
    if (smokes) {
      for (const s of smokes) {
        if (Heist.dist(x, y, s.x, s.y) < s.r) return true;
      }
    }
  }
  return false;
};

/* March a ray from (x, y) along angle until it hits something solid
   or runs out of range; returns the distance travelled. */
Heist.castRay = function (map, x, y, angle, maxDist) {
  const step = 4;
  const dx = Math.cos(angle) * step;
  const dy = Math.sin(angle) * step;
  let px = x;
  let py = y;
  let travelled = 0;
  while (travelled < maxDist) {
    px += dx;
    py += dy;
    travelled += step;
    if (Heist.isSolid(map, Math.floor(px / Heist.TILE), Math.floor(py / Heist.TILE))) {
      return travelled;
    }
  }
  return maxDist;
};

/* Circle (the thief) against the solid tiles around it: returns the
   position after sliding along walls, axis by axis. */
Heist.moveCircle = function (map, x, y, r, dx, dy) {
  let nx = x + dx;
  if (Heist.circleHits(map, nx, y, r)) nx = x;
  let ny = y + dy;
  if (Heist.circleHits(map, nx, ny, r)) ny = y;
  return { x: nx, y: ny };
};

Heist.circleHits = function (map, x, y, r) {
  const x0 = Math.floor((x - r) / Heist.TILE);
  const x1 = Math.floor((x + r) / Heist.TILE);
  const y0 = Math.floor((y - r) / Heist.TILE);
  const y1 = Math.floor((y + r) / Heist.TILE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (!Heist.isSolid(map, tx, ty)) continue;
      const cx = Heist.clamp(x, tx * Heist.TILE, tx * Heist.TILE + Heist.TILE);
      const cy = Heist.clamp(y, ty * Heist.TILE, ty * Heist.TILE + Heist.TILE);
      const ddx = x - cx;
      const ddy = y - cy;
      if (ddx * ddx + ddy * ddy < r * r) return true;
    }
  }
  return false;
};
