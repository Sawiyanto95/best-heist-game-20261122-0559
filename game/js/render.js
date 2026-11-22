// The Velvet Vault — the art-deco renderer. Everything on screen is drawn
// here from the state: marble floor, gold trim, velvet ropes, the thief,
// the guards and their red cones, the cameras, the loot and the smoke.
// Safe cover is teal and gold; danger is red; loot glows gold.

import {
  BOARD_X, BOARD_Y, BOARD_W, BOARD_H, TILE, COLS, ROWS, clamp,
} from './util.js';
import { GUARD_RANGE, GUARD_HALF_ANGLE } from './guard.js';
import { CAMERA_RANGE, CAMERA_HALF_ANGLE } from './camera.js';

const GOLD = '#d4a437';
const GOLD_BRIGHT = '#ffd166';
const NAVY = '#0d1b2a';
const TEAL = '#123f3c';
const TEAL_DARK = '#0e2f2d';
const BURGUNDY = '#7a1f2b';
const RED = '#e63946';
const CREAM = '#f2e8cf';

function conePath(ctx, x, y, facing, range, half) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, facing - half, facing + half);
  ctx.closePath();
}

function drawVisionCone(ctx, x, y, facing, range, half, spotted, t) {
  const pulse = spotted ? 0.42 + 0.1 * Math.sin(t * 14) : 0.2 + 0.03 * Math.sin(t * 3);
  const grad = ctx.createRadialGradient(x, y, 10, x, y, range);
  grad.addColorStop(0, spotted ? `rgba(230,57,70,${pulse + 0.25})` : `rgba(230,57,70,${pulse})`);
  grad.addColorStop(1, 'rgba(230,57,70,0)');
  ctx.fillStyle = grad;
  conePath(ctx, x, y, facing, range, half);
  ctx.fill();
  ctx.strokeStyle = spotted ? 'rgba(255,90,100,0.85)' : 'rgba(230,57,70,0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawFloor(ctx, t) {
  // Marble checker in deep teal, gold grout, burgundy carpet runners.
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const even = (tx + ty) % 2 === 0;
      ctx.fillStyle = even ? TEAL : TEAL_DARK;
      ctx.fillRect(BOARD_X + tx * TILE, BOARD_Y + ty * TILE, TILE, TILE);
    }
  }
  ctx.strokeStyle = 'rgba(212,164,55,0.16)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= COLS; i++) {
    ctx.beginPath();
    ctx.moveTo(BOARD_X + i * TILE, BOARD_Y);
    ctx.lineTo(BOARD_X + i * TILE, BOARD_Y + BOARD_H);
    ctx.stroke();
  }
  for (let i = 0; i <= ROWS; i++) {
    ctx.beginPath();
    ctx.moveTo(BOARD_X, BOARD_Y + i * TILE);
    ctx.lineTo(BOARD_X + BOARD_W, BOARD_Y + i * TILE);
    ctx.stroke();
  }
  // Burgundy carpet runner down the middle columns, gold border.
  const carpetX = BOARD_X + 11 * TILE;
  ctx.fillStyle = 'rgba(122,31,43,0.55)';
  ctx.fillRect(carpetX, BOARD_Y, 2 * TILE, BOARD_H);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.strokeRect(carpetX + 2, BOARD_Y + 4, 2 * TILE - 4, BOARD_H - 8);
  // Gold sunburst medallion at the centre of the room.
  const cx = BOARD_X + BOARD_W / 2;
  const cy = BOARD_Y + BOARD_H / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = 'rgba(212,164,55,0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 18, Math.sin(a) * 18);
    ctx.lineTo(Math.cos(a) * 34, Math.sin(a) * 34);
    ctx.stroke();
  }
  ctx.restore();
}

function drawWallsAndProps(ctx, map, t) {
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const ch = map[ty][tx];
      const px = BOARD_X + tx * TILE;
      const py = BOARD_Y + ty * TILE;
      if (ch === '#') {
        ctx.fillStyle = '#16283d';
        ctx.fillRect(px, py, TILE, TILE);
        ctx.strokeStyle = GOLD;
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 3, py + 3, TILE - 6, TILE - 6);
        // Art-deco chevron on wall tiles.
        ctx.strokeStyle = 'rgba(212,164,55,0.5)';
        ctx.beginPath();
        ctx.moveTo(px + 10, py + 26);
        ctx.lineTo(px + 20, py + 14);
        ctx.lineTo(px + 30, py + 26);
        ctx.stroke();
      } else if (ch === 'C') {
        // Wooden crate with gold bands — safe cover.
        ctx.fillStyle = '#5a3a22';
        ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
        ctx.strokeStyle = GOLD;
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 3, py + 3, TILE - 6, TILE - 6);
        ctx.beginPath();
        ctx.moveTo(px + 3, py + TILE / 2);
        ctx.lineTo(px + TILE - 3, py + TILE / 2);
        ctx.stroke();
      } else if (ch === 'D') {
        // Glass display case on a gold plinth — safe cover.
        ctx.fillStyle = '#1b3a4b';
        ctx.fillRect(px + 5, py + 5, TILE - 10, TILE - 10);
        ctx.fillStyle = 'rgba(210,230,255,0.25)';
        ctx.fillRect(px + 9, py + 9, TILE - 18, TILE - 18);
        ctx.strokeStyle = GOLD;
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 5, py + 5, TILE - 10, TILE - 10);
      } else if (ch === 'V') {
        // Velvet rope between two gold posts.
        ctx.fillStyle = GOLD;
        ctx.beginPath();
        ctx.arc(px + 6, py + TILE / 2, 4, 0, Math.PI * 2);
        ctx.arc(px + TILE - 6, py + TILE / 2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = BURGUNDY;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(px + 6, py + TILE / 2 + 4);
        ctx.quadraticCurveTo(px + TILE / 2, py + TILE / 2 + 12, px + TILE - 6, py + TILE / 2 + 4);
        ctx.stroke();
      } else if (ch === '|') {
        // Laser beam: a hot red line across the tile.
        const flicker = 0.6 + 0.4 * Math.sin(t * 9 + tx * 1.7);
        ctx.strokeStyle = `rgba(255,40,60,${flicker})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(px + TILE / 2, py + 2);
        ctx.lineTo(px + TILE / 2, py + TILE - 2);
        ctx.stroke();
        ctx.fillStyle = `rgba(255,40,60,${flicker})`;
        ctx.beginPath();
        ctx.arc(px + TILE / 2, py + 4, 3, 0, Math.PI * 2);
        ctx.arc(px + TILE / 2, py + TILE - 4, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawPaintings(ctx) {
  // Gold-framed paintings on the top and bottom walls.
  const frames = [3, 8, 15, 20];
  for (const tx of frames) {
    const px = BOARD_X + tx * TILE;
    ctx.fillStyle = '#2a1a2e';
    ctx.fillRect(px + 4, BOARD_Y - 2, TILE - 8, 10);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 4, BOARD_Y - 2, TILE - 8, 10);
  }
}

function drawLoot(ctx, state, t) {
  const d = state.diamond;
  if (d.taken) return;
  const glow = 0.5 + 0.3 * Math.sin(t * 4);
  const grad = ctx.createRadialGradient(d.x, d.y, 4, d.x, d.y, 46);
  grad.addColorStop(0, `rgba(255,209,102,${glow})`);
  grad.addColorStop(1, 'rgba(255,209,102,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(d.x, d.y, 46, 0, Math.PI * 2);
  ctx.fill();
  // The diamond itself, gold pedestal beneath.
  ctx.fillStyle = GOLD;
  ctx.fillRect(d.x - 14, d.y + 8, 28, 6);
  ctx.fillStyle = GOLD_BRIGHT;
  ctx.beginPath();
  ctx.moveTo(d.x, d.y - 14);
  ctx.lineTo(d.x + 11, d.y - 2);
  ctx.lineTo(d.x, d.y + 8);
  ctx.lineTo(d.x - 11, d.y - 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff6d8';
  ctx.beginPath();
  ctx.moveTo(d.x, d.y - 14);
  ctx.lineTo(d.x + 5, d.y - 2);
  ctx.lineTo(d.x, d.y + 2);
  ctx.lineTo(d.x - 5, d.y - 2);
  ctx.closePath();
  ctx.fill();
  // "LOOT" label so the target reads at a glance.
  ctx.font = 'bold 11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = GOLD_BRIGHT;
  ctx.fillText('★ LOOT ★', d.x, d.y - 22);
}

function drawCoins(ctx, state, t) {
  for (const c of state.coins) {
    if (c.taken) continue;
    const bob = Math.sin(t * 3 + c.x) * 2;
    ctx.fillStyle = GOLD_BRIGHT;
    ctx.beginPath();
    ctx.arc(c.x, c.y + bob, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a6d1f';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#8a6d1f';
    ctx.font = 'bold 9px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('$', c.x, c.y + bob + 3);
  }
  for (const g of state.gold) {
    if (g.taken) continue;
    ctx.fillStyle = GOLD_BRIGHT;
    ctx.fillRect(g.x - 9, g.y - 5, 18, 10);
    ctx.strokeStyle = '#8a6d1f';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(g.x - 9, g.y - 5, 18, 10);
  }
}

function drawExit(ctx, state, t) {
  const e = state.exit;
  const open = state.diamond.taken;
  const glow = open ? 0.5 + 0.3 * Math.sin(t * 5) : 0.12;
  ctx.fillStyle = `rgba(80,220,140,${glow})`;
  ctx.beginPath();
  ctx.arc(e.x, e.y, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = open ? '#50dc8c' : '#4a6b57';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(e.x, e.y, 22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = 'bold 11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = open ? '#a9f5c6' : '#7fa88f';
  ctx.fillText(open ? 'EXIT ✓' : 'EXIT', e.x, e.y - 30);
  // Door posts.
  ctx.fillStyle = GOLD;
  ctx.fillRect(e.x - 24, e.y - 18, 4, 36);
  ctx.fillRect(e.x + 20, e.y - 18, 4, 36);
}

function drawGuard(ctx, g, t) {
  // Navy uniform, peaked cap, red "!" when he has spotted Rook.
  const bob = Math.sin(g.walkPhase) * 1.5;
  ctx.save();
  ctx.translate(g.x, g.y + bob);
  ctx.fillStyle = '#1c2f4a';
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Cap brim in the facing direction.
  ctx.fillStyle = '#101c2e';
  ctx.beginPath();
  ctx.arc(Math.cos(g.facing) * 4, Math.sin(g.facing) * 4 - 8, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.arc(Math.cos(g.facing) * 9, Math.sin(g.facing) * 9 - 8, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // Eyes.
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(Math.cos(g.facing) * 5 - 3, Math.sin(g.facing) * 5 - 1, 2, 0, Math.PI * 2);
  ctx.arc(Math.cos(g.facing) * 5 + 3, Math.sin(g.facing) * 5 - 1, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (g.spotted || g.alert > 0) {
    ctx.font = 'bold 22px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = RED;
    ctx.fillText('!', g.x, g.y - 22);
  }
}

function drawCamera(ctx, c, t) {
  // Gold dome on the wall, red lens sweeping with its cone.
  ctx.fillStyle = '#3a2f12';
  ctx.beginPath();
  ctx.arc(c.x, c.y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = c.spotted ? '#ff2d3c' : '#ff5a64';
  ctx.beginPath();
  ctx.arc(c.x + Math.cos(c.angle) * 5, c.y + Math.sin(c.angle) * 5, 4, 0, Math.PI * 2);
  ctx.fill();
  if (c.spotted) {
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = RED;
    ctx.fillText('REC ●', c.x, c.y - 18);
  }
}

function drawPlayer(ctx, state, t) {
  const p = state.player;
  const cloaked = state.cloakT > 0;
  ctx.save();
  if (cloaked) ctx.globalAlpha = 0.45 + 0.15 * Math.sin(t * 10);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 11, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Rook: black coat, burgundy scarf, gold mask glint.
  ctx.fillStyle = '#0a0a0f';
  ctx.beginPath();
  ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = GOLD_BRIGHT;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = BURGUNDY;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(p.x, p.y + 2, 9, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
  ctx.fillStyle = GOLD_BRIGHT;
  ctx.beginPath();
  ctx.arc(p.x - 4, p.y - 2, 2, 0, Math.PI * 2);
  ctx.arc(p.x + 4, p.y - 2, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Direction tick so movement reads clearly.
  const mv = state.lastMove;
  if (mv && (mv.x !== 0 || mv.y !== 0)) {
    ctx.strokeStyle = 'rgba(255,209,102,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + mv.x * 18, p.y + mv.y * 18);
    ctx.stroke();
  }
  // "ROOK" label.
  ctx.font = 'bold 11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = CREAM;
  ctx.fillText('ROOK', p.x, p.y - 20);
}

function drawSmoke(ctx, state) {
  for (const sm of state.smokeClouds) {
    const grad = ctx.createRadialGradient(sm.x, sm.y, 6, sm.x, sm.y, sm.r);
    grad.addColorStop(0, 'rgba(220,220,230,0.55)');
    grad.addColorStop(1, 'rgba(220,220,230,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sm.x, sm.y, sm.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDecoy(ctx, state, t) {
  const d = state.decoy;
  if (!d) return;
  const ping = (Math.sin(t * 6) + 1) / 2;
  ctx.strokeStyle = `rgba(255,209,102,${0.5 + ping * 0.5})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(d.x, d.y, 12 + ping * 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = GOLD_BRIGHT;
  ctx.beginPath();
  ctx.arc(d.x, d.y, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawVignette(ctx, state, t) {
  // Tension: the screen edges burn red as the alarm climbs.
  const a = state.alarm / 100;
  if (a < 0.25) return;
  const grad = ctx.createRadialGradient(640, 400, 260, 640, 400, 720);
  grad.addColorStop(0, 'rgba(230,57,70,0)');
  grad.addColorStop(1, `rgba(230,57,70,${0.12 + a * 0.3})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1280, 800);
}

export function drawGame(ctx, state, t) {
  ctx.save();
  // Screen shake while caught.
  if (state.flash > 0) {
    const s = state.flash * 14;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }
  // Backdrop.
  ctx.fillStyle = NAVY;
  ctx.fillRect(-20, -20, 1320, 840);
  // Gold frame around the board.
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.strokeRect(BOARD_X - 8, BOARD_Y - 8, BOARD_W + 16, BOARD_H + 16);
  ctx.strokeStyle = 'rgba(212,164,55,0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(BOARD_X - 14, BOARD_Y - 14, BOARD_W + 28, BOARD_H + 28);

  drawFloor(ctx, t);
  drawWallsAndProps(ctx, state.map, t);
  drawPaintings(ctx);
  drawExit(ctx, state, t);
  drawLoot(ctx, state, t);
  drawCoins(ctx, state, t);

  // Vision cones first, then the watchers standing in them.
  for (const c of state.cameras) {
    drawVisionCone(ctx, c.x, c.y, c.angle, CAMERA_RANGE, CAMERA_HALF_ANGLE, c.spotted, t);
  }
  for (const g of state.guards) {
    drawVisionCone(ctx, g.x, g.y, g.facing, GUARD_RANGE, GUARD_HALF_ANGLE, g.spotted, t);
  }
  for (const c of state.cameras) drawCamera(ctx, c, t);
  for (const g of state.guards) drawGuard(ctx, g, t);

  drawSmoke(ctx, state);
  drawDecoy(ctx, state, t);
  drawPlayer(ctx, state, t);
  drawVignette(ctx, state, t);
  ctx.restore();
}
