// The Velvet Vault — keyboard and mouse input. Keys are tracked by code so
// WASD and arrows both work; mouse clicks queue board positions for decoys.

import { BOARD_X, BOARD_Y } from './util.js';

export class VaultInput {
  constructor() {
    this.down = new Set();
    this.justPressed = new Set();
    this.clicks = [];
  }

  attach(canvas) {
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
        e.preventDefault();
      }
      if (!e.repeat) this.justPressed.add(k);
      this.down.add(k);
    });
    window.addEventListener('keyup', (e) => {
      this.down.delete(e.key.toLowerCase());
    });
    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      this.clicks.push({
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      });
    });
    window.addEventListener('blur', () => {
      this.down.clear();
    });
  }

  moveVector() {
    let x = 0;
    let y = 0;
    if (this.down.has('a') || this.down.has('arrowleft')) x -= 1;
    if (this.down.has('d') || this.down.has('arrowright')) x += 1;
    if (this.down.has('w') || this.down.has('arrowup')) y -= 1;
    if (this.down.has('s') || this.down.has('arrowdown')) y += 1;
    if (x !== 0 && y !== 0) {
      const n = Math.hypot(x, y);
      x /= n;
      y /= n;
    }
    return { x, y };
  }

  pressed(key) {
    return this.justPressed.has(key);
  }

  endFrame() {
    this.justPressed.clear();
  }
}
