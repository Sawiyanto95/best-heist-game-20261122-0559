'use strict';
/* The Velvet Vault — everything the eye sees.
   One canvas, one frame: the room Rook is crossing, the guards and their
   vision cones, the cameras, the loot, and the alarm meter up top.
   Cones are clipped by walls with a raycast, so cover reads as safety. */


/* A vision cone clipped by walls: cast a fan of rays and fill the polygon
   they reach, fading with distance so the far edge melts away. */
Heist.drawCone = function (ctx, map, x, y, facing, halfAngle, range, rgb) {
  const rays = 13;
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 0; i < rays; i++) {
    const a = facing - halfAngle + ((2 * halfAngle * i) / (rays - 1));
    const d = Heist.castRay(map, x, y, a, range);
    ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
  }
  ctx.closePath();
  const grad = ctx.createRadialGradient(x, y, 8, x, y, range);
  grad.addColorStop(0, `rgba(${rgb},0.34)`);
  grad.addColorStop(0.7, `rgba(${rgb},0.16)`);
  grad.addColorStop(1, `rgba(${rgb},0.02)`);
  ctx.fillStyle = grad;
  ctx.fill();
};

Heist.drawRoom = function (ctx, map) {
  for (let ty = 0; ty < Heist.ROWS; ty++) {
    for (let tx = 0; tx < Heist.COLS; tx++) {
      const x = tx * Heist.TILE;
      const y = ty * Heist.TILE;
      const c = map[ty][tx];
      if (c === '#') {
        ctx.fillStyle = '#0c1020';
        ctx.fillRect(x, y, Heist.TILE, Heist.TILE);
        ctx.fillStyle = '#232c4a';
        ctx.fillRect(x, y, Heist.TILE, 3);
        continue;
      }
      // Floor: quiet checker so movement reads at a glance.
      ctx.fillStyle = (tx + ty) % 2 === 0 ? '#1a2138' : '#161c2f';
      ctx.fillRect(x, y, Heist.TILE, Heist.TILE);
      if (c === 'C') {
        // Crate: wooden box, planks crossed.
        ctx.fillStyle = '#6b4a26';
        ctx.fillRect(x + 4, y + 4, Heist.TILE - 8, Heist.TILE - 8);
        ctx.strokeStyle = '#4a3016';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 4, y + 4, Heist.TILE - 8, Heist.TILE - 8);
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 4);
        ctx.lineTo(x + Heist.TILE - 4, y + Heist.TILE - 4);
        ctx.moveTo(x + Heist.TILE - 4, y + 4);
        ctx.lineTo(x + 4, y + Heist.TILE - 4);
        ctx.stroke();
      } else if (c === 'D') {
        // Display case: gold frame, glass top, something glinting inside.
        ctx.fillStyle = '#8a6d2f';
        ctx.fillRect(x + 3, y + 3, Heist.TILE - 6, Heist.TILE - 6);
        ctx.fillStyle = 'rgba(159,196,232,0.55)';
        ctx.fillRect(x + 7, y + 7, Heist.TILE - 14, Heist.TILE - 14);
        ctx.fillStyle = '#e8f4ff';
        ctx.fillRect(x + 10, y + 10, 5, 5);
      }
    }
  }
};

Heist.drawDiamond = function (ctx, d, t) {
  if (d.taken) return;
  const pulse = 1 + Math.sin(t * 4) * 0.08;
  ctx.save();
  ctx.translate(d.x, d.y);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = '#7df9ff';
  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.lineTo(11, 0);
  ctx.lineTo(0, 13);
  ctx.lineTo(-11, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#e8feff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-11, 0);
  ctx.lineTo(11, 0);
  ctx.moveTo(0, -13);
  ctx.lineTo(0, 13);
  ctx.stroke();
  ctx.restore();
  // Sparkle.
  const sx = d.x + Math.sin(t * 3) * 14;
  const sy = d.y - 14 + Math.cos(t * 2.3) * 4;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(sx - 1, sy - 1, 2, 2);
};

Heist.drawCoin = function (ctx, c, t) {
  if (c.taken) return;
  const bob = Math.sin(t * 3 + c.x) * 2;
  ctx.fillStyle = '#ffd34d';
  ctx.beginPath();
  ctx.arc(c.x, c.y + bob, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a87608';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#a87608';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', c.x, c.y + bob + 0.5);
};

Heist.drawExit = function (ctx, e, open, t) {
  const glow = open ? 0.55 + Math.sin(t * 5) * 0.2 : 0.25;
  ctx.fillStyle = open ? `rgba(80,255,140,${glow})` : `rgba(255,70,70,${glow})`;
  ctx.fillRect(e.x - 18, e.y - 18, 36, 36);
  ctx.strokeStyle = open ? '#50ff8c' : '#ff4646';
  ctx.lineWidth = 3;
  ctx.strokeRect(e.x - 18, e.y - 18, 36, 36);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(open ? 'EXIT' : 'LOCK', e.x, e.y);
};

Heist.drawGuard = function (ctx, g, t, map) {
  const alerted = g.alert > 0;
  const col = alerted ? '255,80,60' : '255,214,64';
  Heist.drawCone(ctx, map, g.x, g.y, g.facing, Heist.GUARD_HALF_ANGLE, Heist.GUARD_RANGE, col);
  // Body: dark suit, pale head, cap brim pointing where he looks.
  ctx.fillStyle = '#2b2f3a';
  ctx.beginPath();
  ctx.arc(g.x, g.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d9a066';
  ctx.beginPath();
  ctx.arc(g.x, g.y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1c1f28';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.lineTo(g.x + Math.cos(g.facing) * 15, g.y + Math.sin(g.facing) * 15);
  ctx.stroke();
  if (alerted) {
    ctx.fillStyle = '#ff5040';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', g.x, g.y - 20);
  }
};

Heist.drawCamera = function (ctx, c, t, map) {
  Heist.drawCone(ctx, map, c.x, c.y, c.angle, Heist.CAMERA_HALF_ANGLE, Heist.CAMERA_RANGE, '255,60,60');
  ctx.fillStyle = '#20242e';
  ctx.fillRect(c.x - 9, c.y - 7, 18, 14);
  ctx.fillStyle = c.spotted ? '#ff2020' : '#ff5050';
  ctx.beginPath();
  ctx.arc(c.x + Math.cos(c.angle) * 9, c.y + Math.sin(c.angle) * 9, 3.5, 0, Math.PI * 2);
  ctx.fill();
  const blink = Math.sin(t * 6) > 0;
  if (blink) {
    ctx.fillStyle = '#ff2020';
    ctx.beginPath();
    ctx.arc(c.x - 6, c.y - 6, 2, 0, Math.PI * 2);
    ctx.fill();
  }
};

Heist.drawPlayer = function (ctx, p, t) {
  const bob = Math.sin(t * 8) * 1.5;
  // Hooded thief: teal cloak, pale mask, white rim so he reads at a glance.
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 2;
  ctx.fillStyle = '#1f7a6d';
  ctx.beginPath();
  ctx.arc(p.x, p.y + bob, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e8e0c8';
  ctx.beginPath();
  ctx.arc(p.x, p.y + bob - 2, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1f2a33';
  ctx.fillRect(p.x - 5, p.y + bob - 4, 10, 3);
};

Heist.drawSmoke = function (ctx, s, t) {
  const wob = Math.sin(t * 5 + s.x) * 3;
  const grad = ctx.createRadialGradient(s.x, s.y, 4, s.x, s.y, s.r);
  grad.addColorStop(0, 'rgba(200,200,210,0.5)');
  grad.addColorStop(1, 'rgba(200,200,210,0.02)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(s.x + wob, s.y, s.r, 0, Math.PI * 2);
  ctx.fill();
};

Heist.drawDecoy = function (ctx, d, t) {
  if (!d) return;
  const glint = 0.6 + Math.sin(t * 8) * 0.4;
  ctx.fillStyle = `rgba(255,211,77,${glint})`;
  ctx.beginPath();
  ctx.arc(d.x, d.y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a87608';
  ctx.lineWidth = 2;
  ctx.stroke();
};

Heist.drawHUD = function (ctx, s) {
  ctx.fillStyle = 'rgba(8,10,20,0.82)';
  ctx.fillRect(0, 0, Heist.W, 44);
  ctx.fillStyle = '#8a6d2f';
  ctx.fillRect(0, 44, Heist.W, 2);

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e8e0c8';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText(`LEVEL ${s.levelIndex + 1} — ${s.level.name.toUpperCase()}`, 12, 23);

  // Alarm meter, centre.
  const ax = Heist.W / 2 - 120;
  ctx.fillStyle = '#ff5a4a';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('ALARM', ax - 52, 23);
  ctx.fillStyle = '#2a2f42';
  ctx.fillRect(ax, 14, 240, 16);
  const frac = Heist.clamp(s.alarm / 100, 0, 1);
  ctx.fillStyle = frac < 0.5 ? '#e8c832' : frac < 0.8 ? '#ff8c2e' : '#ff2e2e';
  ctx.fillRect(ax, 14, 240 * frac, 16);
  ctx.strokeStyle = '#e8e0c8';
  ctx.lineWidth = 1;
  ctx.strokeRect(ax, 14, 240, 16);

  // Right side: score, loot, tools, lives, time.
  ctx.textAlign = 'right';
  ctx.fillStyle = '#e8e0c8';
  ctx.font = 'bold 14px system-ui, sans-serif';
  const mm = Math.floor(s.time / 60);
  const ss = String(Math.floor(s.time % 60)).padStart(2, '0');
  ctx.fillText(`SCORE ${s.score}   ◆ ${s.diamond.taken ? '1' : '0'}/1   $ ${s.coinsTaken}/${s.coins.length}   ◐ ${s.smokes}   ○ ${s.decoys}   ♥ ${s.lives}   ${mm}:${ss}`, Heist.W - 12, 23);

  // Bottom hint.
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(232,224,200,0.6)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('WASD / arrows — move   ·   E — smoke bomb (costs 100)   ·   Click — toss a decoy coin (costs 50)   ·   M — mute', Heist.W / 2, Heist.H - 10);

  // Toast message.
  if (s.toast && s.toast.t > 0) {
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(8,10,20,0.7)';
    const w = ctx.measureText(s.toast.text).width + 28;
    ctx.fillRect(Heist.W / 2 - w / 2, 56, w, 32);
    ctx.fillStyle = '#ffd34d';
    ctx.fillText(s.toast.text, Heist.W / 2, 73);
  }
};

Heist.drawTitle = function (ctx, t) {
  ctx.fillStyle = 'rgba(6,8,16,0.88)';
  ctx.fillRect(0, 0, Heist.W, Heist.H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd34d';
  ctx.font = 'bold 54px Georgia, serif';
  ctx.fillText('THE VELVET VAULT', Heist.W / 2, 150);
  ctx.fillStyle = '#7df9ff';
  ctx.font = 'italic 20px Georgia, serif';
  ctx.fillText('a midnight heist in three rooms', Heist.W / 2, 188);
  ctx.fillStyle = '#e8e0c8';
  ctx.font = '16px system-ui, sans-serif';
  const lines = [
    'You are Rook, the thief. Lift the Velvet Diamond from each room,',
    'then slip out the exit — unseen. Guards patrol with vision cones,',
    'cameras sweep the halls, and every second you are seen, the alarm climbs.',
    '',
    'WASD / arrows — move      E — smoke bomb      Click — toss a decoy coin',
    'Hide behind crates and display cases: what blocks your body blocks their sight.',
  ];
  lines.forEach((line, i) => ctx.fillText(line, Heist.W / 2, 240 + i * 26));
  const pulse = 0.65 + Math.sin(t * 3) * 0.35;
  ctx.fillStyle = `rgba(255,211,77,${pulse})`;
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('Click or press Enter to begin', Heist.W / 2, 440);
};

Heist.drawOverlay = function (ctx, s) {
  if (s.mode === 'clear') {
    ctx.fillStyle = 'rgba(6,8,16,0.78)';
    ctx.fillRect(0, 0, Heist.W, Heist.H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#50ff8c';
    ctx.font = 'bold 44px Georgia, serif';
    ctx.fillText('ROOM CLEARED', Heist.W / 2, 230);
    ctx.fillStyle = '#e8e0c8';
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText(`Time bonus +${s.clearBonus}   ·   Score ${s.score}`, Heist.W / 2, 280);
    ctx.fillStyle = '#ffd34d';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('Click for the next room', Heist.W / 2, 330);
  } else if (s.mode === 'over') {
    ctx.fillStyle = 'rgba(20,4,6,0.88)';
    ctx.fillRect(0, 0, Heist.W, Heist.H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff5a4a';
    ctx.font = 'bold 44px Georgia, serif';
    ctx.fillText('THE CREW GOT PINCHED', Heist.W / 2, 240);
    ctx.fillStyle = '#e8e0c8';
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText(`Score ${s.score} — the vault keeps its diamonds tonight.`, Heist.W / 2, 290);
    ctx.fillStyle = '#ffd34d';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('Click to try the room again', Heist.W / 2, 340);
  } else if (s.mode === 'win') {
    ctx.fillStyle = 'rgba(6,8,16,0.88)';
    ctx.fillRect(0, 0, Heist.W, Heist.H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd34d';
    ctx.font = 'bold 48px Georgia, serif';
    ctx.fillText('THE VAULT IS YOURS', Heist.W / 2, 220);
    ctx.fillStyle = '#7df9ff';
    ctx.font = 'italic 20px Georgia, serif';
    ctx.fillText('Three rooms, three diamonds, not a single guard the wiser.', Heist.W / 2, 262);
    ctx.fillStyle = '#e8e0c8';
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText(`Final score ${s.score}`, Heist.W / 2, 310);
    ctx.fillStyle = '#ffd34d';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('Click to play again', Heist.W / 2, 360);
  }
  if (s.mode === 'caught' || s.flash > 0) {
    ctx.fillStyle = `rgba(255,30,30,${Math.max(s.flash, s.mode === 'caught' ? 0.25 : 0)})`;
    ctx.fillRect(0, 0, Heist.W, Heist.H);
    if (s.mode === 'caught') {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 52px Georgia, serif';
      ctx.fillText('CAUGHT!', Heist.W / 2, Heist.H / 2 - 10);
      ctx.font = '18px system-ui, sans-serif';
      ctx.fillText('The alarm hit the roof. Back to the door.', Heist.W / 2, Heist.H / 2 + 28);
    }
  }
};

/* One full frame: room, cones, loot, thief, HUD, and any overlay. */
Heist.drawGame = function (ctx, s, t) {
  ctx.clearRect(0, 0, Heist.W, Heist.H);
  ctx.fillStyle = '#10142a';
  ctx.fillRect(0, 0, Heist.W, Heist.H);
  Heist.drawRoom(ctx, s.map);
  Heist.drawExit(ctx, s.exit, s.diamond.taken, t);
  Heist.drawDiamond(ctx, s.diamond, t);
  for (const c of s.coins) Heist.drawCoin(ctx, c, t);
  for (const cam of s.cameras) Heist.drawCamera(ctx, cam, t, s.map);
  for (const g of s.guards) Heist.drawGuard(ctx, g, t, s.map);
  Heist.drawDecoy(ctx, s.decoy, t);
  for (const sm of s.smokeClouds) Heist.drawSmoke(ctx, sm, t);
  if (s.mode !== 'title') Heist.drawPlayer(ctx, s.player, t);
  Heist.drawHUD(ctx, s);
  if (s.mode === 'title') Heist.drawTitle(ctx, t);
  else Heist.drawOverlay(ctx, s);
};
