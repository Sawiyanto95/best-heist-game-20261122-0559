// The Velvet Vault — small math and grid helpers shared by every system.
// No state lives here: pure functions on numbers, points and tile maps.

export const TILE = 40;
export const COLS = 24;
export const ROWS = 15;
export const BOARD_X = 160;
export const BOARD_Y = 96;
export const BOARD_W = COLS * TILE;
export const BOARD_H = ROWS * TILE;

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

export function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function tileCenter(tx, ty) {
  return { x: BOARD_X + tx * TILE + TILE / 2, y: BOARD_Y + ty * TILE + TILE / 2 };
}

export function tileAt(map, px, py) {
  const tx = Math.floor((px - BOARD_X) / TILE);
  const ty = Math.floor((py - BOARD_Y) / TILE);
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return '#';
  return map[ty][tx];
}

export function isSolidTile(ch) {
  // Walls, crates, display cases and velvet ropes block movement.
  return ch === '#' || ch === 'C' || ch === 'D' || ch === 'V';
}

export function blocksSight(ch) {
  // Ropes are low: they block feet, not eyes. Cases and crates block both.
  return ch === '#' || ch === 'C' || ch === 'D';
}

export function isLaserTile(ch) {
  return ch === '|';
}

// Circle-vs-grid collision: slide along walls instead of sticking.
export function moveCircle(map, x, y, r, dx, dy) {
  let nx = x + dx;
  if (circleHits(map, nx, y, r)) nx = x;
  let ny = y + dy;
  if (circleHits(map, nx, ny, r)) ny = y;
  return { x: nx, y: ny };
}

export function circleHits(map, x, y, r) {
  const x0 = Math.floor((x - r - BOARD_X) / TILE);
  const x1 = Math.floor((x + r - BOARD_X) / TILE);
  const y0 = Math.floor((y - r - BOARD_Y) / TILE);
  const y1 = Math.floor((y + r - BOARD_Y) / TILE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const ch = ty < 0 || ty >= ROWS || tx < 0 || tx >= COLS ? '#' : map[ty][tx];
      if (!isSolidTile(ch)) continue;
      const cx = clamp(x, BOARD_X + tx * TILE, BOARD_X + (tx + 1) * TILE);
      const cy = clamp(y, BOARD_Y + ty * TILE, BOARD_Y + (ty + 1) * TILE);
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r) return true;
    }
  }
  return false;
}

// Line of sight between two points, sampled in small steps.
export function hasLineOfSight(map, ax, ay, bx, by) {
  const d = dist(ax, ay, bx, by);
  const steps = Math.max(1, Math.ceil(d / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (blocksSight(tileAt(map, lerp(ax, bx, t), lerp(ay, by, t)))) return false;
  }
  return true;
}

// Is point p inside the watcher's cone? Range, half-angle and sight all count.
export function insideCone(map, wx, wy, facing, range, halfAngle, px, py) {
  const d = dist(wx, wy, px, py);
  if (d > range) return false;
  if (Math.abs(angleDiff(angleTo(wx, wy, px, py), facing)) > halfAngle) return false;
  return hasLineOfSight(map, wx, wy, px, py);
}

export function insideSmoke(clouds, x, y) {
  for (const c of clouds) {
    if (dist(c.x, c.y, x, y) < c.r) return true;
  }
  return false;
}
