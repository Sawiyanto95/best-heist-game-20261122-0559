'use strict';
/* The Velvet Vault — keyboard and mouse.
   WASD or arrows move Rook, E drops a smoke bomb, Q tosses a decoy coin,
   and a mouse click on the floor tosses a decoy to that exact spot.
   Clicks on the canvas are queued so the game can spend them. */


Heist.input = {
  keys: {},
  clicks: [], // {x, y} in canvas pixels, oldest first
  mouseX: 0,
  mouseY: 0,

  attach: function (canvas) {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return; // holding a key must not re-trigger tools
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      this.keys[e.key.toLowerCase()] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouseX = ((e.clientX - r.left) / r.width) * Heist.W;
      this.mouseY = ((e.clientY - r.top) / r.height) * Heist.H;
    });
    canvas.addEventListener('mousedown', (e) => {
      const r = canvas.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * Heist.W;
      const y = ((e.clientY - r.top) / r.height) * Heist.H;
      this.clicks.push({ x, y });
      Heist.audio.ensure();
    });
  },

  /* Movement vector from the keys held down, normalised. */
  moveVector: function () {
    let x = 0;
    let y = 0;
    const k = this.keys;
    if (k['a'] || k['arrowleft']) x -= 1;
    if (k['d'] || k['arrowright']) x += 1;
    if (k['w'] || k['arrowup']) y -= 1;
    if (k['s'] || k['arrowdown']) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.sqrt(2);
      x *= inv;
      y *= inv;
    }
    return { x, y };
  },

  /* True once when a key is pressed (edge, not hold). Callers clear it. */
  pressed: function (key) {
    if (this.keys[key]) {
      this.keys[key] = false;
      return true;
    }
    return false;
  },
};
