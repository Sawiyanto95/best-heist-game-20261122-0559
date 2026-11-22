// The Velvet Vault — Rook's tools. Every tool costs score, so each use is
// a trade: safety now against the final payout.
//   Smoke bomb (E, 100 pts): a cloud that blinds guards and cameras.
//   Decoy coin (click, 50 pts): the nearest guard walks over to look.
//   Shadow cloak (Q, 150 pts): 3 seconds invisible to every cone.

import { dist } from './util.js';

export const SMOKE_COST = 100;
export const DECOY_COST = 50;
export const CLOAK_COST = 150;
export const CLOAK_TIME = 3;

export function dropSmoke(state) {
  if (state.smokes <= 0 || state.mode !== 'play') return false;
  state.smokes -= 1;
  state.score = Math.max(0, state.score - SMOKE_COST);
  state.smokeClouds.push({ x: state.player.x, y: state.player.y, r: 95, t: 4.5 });
  state.audio.smoke();
  return true;
}

export function throwDecoy(state, x, y) {
  if (state.decoys <= 0 || state.mode !== 'play') return false;
  state.decoys -= 1;
  state.score = Math.max(0, state.score - DECOY_COST);
  state.decoy = { x, y, t: 6 };
  state.audio.decoy();
  let best = null;
  let bestD = Infinity;
  for (const g of state.guards) {
    const d = dist(g.x, g.y, x, y);
    if (d < bestD) { bestD = d; best = g; }
  }
  if (best) {
    best.investigateX = x;
    best.investigateY = y;
    best.investigateT = 4;
  }
  return true;
}

export function raiseCloak(state) {
  if (state.cloaks <= 0 || state.mode !== 'play' || state.cloakT > 0) return false;
  state.cloaks -= 1;
  state.score = Math.max(0, state.score - CLOAK_COST);
  state.cloakT = CLOAK_TIME;
  state.audio.cloak();
  return true;
}
