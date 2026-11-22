// The Velvet Vault — the HUD: title, room name, the big alarm meter, score,
// loot, lives and the tool belt with its costs. Drawn on the same canvas so
// every screenshot carries the whole game state at a glance.

const GOLD = '#d4a437';
const GOLD_BRIGHT = '#ffd166';
const NAVY = '#0d1b2a';
const BURGUNDY = '#7a1f2b';
const RED = '#e63946';
const CREAM = '#f2e8cf';

function alarmColor(alarm) {
  if (alarm < 35) return '#50dc8c';
  if (alarm < 70) return GOLD_BRIGHT;
  return RED;
}

export function drawHud(ctx, state, t) {
  // Top bar.
  ctx.fillStyle = '#0a1520';
  ctx.fillRect(0, 0, 1280, 84);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 84);
  ctx.lineTo(1280, 84);
  ctx.stroke();
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(0, 88);
  ctx.lineTo(1280, 88);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = GOLD_BRIGHT;
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText('✦ THE VELVET VAULT ✦', 24, 36);
  ctx.fillStyle = CREAM;
  ctx.font = '16px Georgia, serif';
  ctx.fillText(state.level.name, 24, 62);

  // The alarm meter: big, labelled, segmented — the heart of the HUD.
  const mx = 480;
  const mw = 320;
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', mx, 28);
  ctx.fillStyle = '#1c2f4a';
  ctx.fillRect(mx, 36, mw, 26);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.strokeRect(mx, 36, mw, 26);
  const frac = state.alarm / 100;
  ctx.fillStyle = alarmColor(state.alarm);
  ctx.fillRect(mx + 2, 38, (mw - 4) * frac, 22);
  // Segment ticks.
  ctx.strokeStyle = 'rgba(13,27,42,0.8)';
  ctx.lineWidth = 2;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(mx + (mw / 4) * i, 36);
    ctx.lineTo(mx + (mw / 4) * i, 62);
    ctx.stroke();
  }
  ctx.fillStyle = alarmColor(state.alarm);
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText(`${Math.floor(state.alarm)}%`, mx + mw + 10, 56);
  if (state.alarm >= 70) {
    ctx.fillStyle = RED;
    ctx.font = 'bold 15px Georgia, serif';
    ctx.fillText('!! THEY SEE YOU !!', mx, 80);
  }

  // Score, loot and lives on the right.
  ctx.textAlign = 'right';
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 18px Georgia, serif';
  ctx.fillText(`SCORE ${state.score}`, 1256, 34);
  ctx.font = '15px Georgia, serif';
  const lootMark = state.diamond.taken ? '◆ LOOT SECURED' : `◆ ${state.level.lootName}`;
  ctx.fillStyle = state.diamond.taken ? '#50dc8c' : GOLD_BRIGHT;
  ctx.fillText(lootMark, 1256, 58);
  ctx.fillStyle = RED;
  ctx.font = 'bold 16px Georgia, serif';
  ctx.fillText('♥'.repeat(Math.max(0, state.lives)) + '♡'.repeat(Math.max(0, 3 - state.lives)), 1256, 80);

  // Bottom tool belt with costs, and the room hint.
  ctx.fillStyle = '#0a1520';
  ctx.fillRect(0, 712, 1280, 88);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 712);
  ctx.lineTo(1280, 712);
  ctx.stroke();
  ctx.textAlign = 'left';
  ctx.fillStyle = CREAM;
  ctx.font = '15px Georgia, serif';
  ctx.fillText(state.level.hint, 24, 742);
  ctx.fillStyle = '#9db4c8';
  ctx.font = '14px Georgia, serif';
  ctx.fillText('WASD move · E smoke · Q cloak · click toss a decoy coin · M mute · Enter continue', 24, 768);

  const tools = [
    { key: 'E', label: 'SMOKE', n: state.smokes, cost: 100 },
    { key: 'CLICK', label: 'DECOY', n: state.decoys, cost: 50 },
    { key: 'Q', label: 'CLOAK', n: state.cloaks, cost: 150 },
  ];
  let tx = 880;
  ctx.textAlign = 'left';
  for (const tool of tools) {
    ctx.fillStyle = '#1c2f4a';
    ctx.fillRect(tx, 726, 118, 52);
    ctx.strokeStyle = tool.n > 0 ? GOLD : '#44586e';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(tx, 726, 118, 52);
    ctx.fillStyle = tool.n > 0 ? GOLD_BRIGHT : '#6b7f92';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillText(`${tool.key} ${tool.label} ×${tool.n}`, tx + 8, 748);
    ctx.fillStyle = '#9db4c8';
    ctx.font = '12px Georgia, serif';
    ctx.fillText(`−${tool.cost} pts`, tx + 8, 768);
    tx += 126;
  }

  // Toasts and banners.
  if (state.toast) {
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.fillStyle = 'rgba(10,21,32,0.85)';
    const w = ctx.measureText(state.toast.text).width + 36;
    ctx.fillRect(640 - w / 2, 100, w, 36);
    ctx.strokeStyle = GOLD;
    ctx.strokeRect(640 - w / 2, 100, w, 36);
    ctx.fillStyle = GOLD_BRIGHT;
    ctx.fillText(state.toast.text, 640, 125);
  }
  if (state.mode === 'caught') {
    banner(ctx, 'CAUGHT!', 'The guards drag you back to the door…', RED);
  } else if (state.mode === 'clear') {
    banner(ctx, 'ROOM CLEAR!', `+${state.clearBonus} time bonus — click or press Enter for the next room`, '#50dc8c');
  } else if (state.mode === 'over') {
    banner(ctx, 'THE HEIST FAILS', 'Out of lives. Click or press Enter to try the room again.', RED);
  } else if (state.mode === 'win') {
    banner(ctx, 'CLEAN GETAWAY!', `You escaped with ${state.score} points in ${Math.floor(state.timeTotal)}s. Click to play again.`, GOLD_BRIGHT);
  } else if (state.mode === 'title') {
    ctx.fillStyle = 'rgba(7,13,22,0.82)';
    ctx.fillRect(160, 96, 960, 600);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 3;
    ctx.strokeRect(160, 96, 960, 600);
    ctx.textAlign = 'center';
    ctx.fillStyle = GOLD_BRIGHT;
    ctx.font = 'bold 52px Georgia, serif';
    ctx.fillText('✦ THE VELVET VAULT ✦', 640, 250);
    ctx.fillStyle = CREAM;
    ctx.font = '20px Georgia, serif';
    ctx.fillText('An art-deco museum heist in four rooms', 640, 300);
    ctx.font = '17px Georgia, serif';
    ctx.fillText('Lift the loot from every gallery, dodge the sweeping cones,', 640, 350);
    ctx.fillText('and slip out the exit before the alarm hits 100%.', 640, 378);
    ctx.fillStyle = GOLD_BRIGHT;
    ctx.font = 'bold 17px Georgia, serif';
    ctx.fillText('Smoke blinds them · a decoy coin pulls a guard away · the cloak hides you', 640, 430);
    ctx.fillText('Lasers scream the alarm — step around them.', 640, 458);
    ctx.fillStyle = CREAM;
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillText('Click or press Enter to begin the heist', 640, 540);
    ctx.font = '15px Georgia, serif';
    ctx.fillStyle = '#9db4c8';
    ctx.fillText('WASD / arrows move · E smoke (−100) · Q cloak (−150) · click decoy (−50) · M mute', 640, 580);
  }
}

function banner(ctx, title, sub, color) {
  ctx.fillStyle = 'rgba(7,13,22,0.88)';
  ctx.fillRect(320, 320, 640, 130);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(320, 320, 640, 130);
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.font = 'bold 40px Georgia, serif';
  ctx.fillText(title, 640, 375);
  ctx.fillStyle = CREAM;
  ctx.font = '17px Georgia, serif';
  ctx.fillText(sub, 640, 415);
}
