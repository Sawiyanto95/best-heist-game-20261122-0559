'use strict';
/* The Velvet Vault — tiny synthesised sounds, no audio files.
   Everything is a short WebAudio blip so the game stays a handful of
   static files and plays with no network request. */


Heist.audio = {
  ctx: null,
  muted: false,

  ensure: function () {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      } catch (e) {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  tone: function (freq, dur, type, vol, slideTo) {
    if (this.muted || !this.ctx) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol || 0.12, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  },

  pickup: function () {
    this.tone(660, 0.09, 'sine', 0.12);
    setTimeout(() => this.tone(990, 0.12, 'sine', 0.12), 70);
  },

  coin: function () {
    this.tone(1180, 0.07, 'triangle', 0.1);
    setTimeout(() => this.tone(1560, 0.1, 'triangle', 0.1), 60);
  },

  smoke: function () {
    this.tone(300, 0.25, 'sine', 0.1, 90);
  },

  decoy: function () {
    this.tone(520, 0.08, 'square', 0.06);
  },

  alarmBlip: function () {
    this.tone(880, 0.08, 'square', 0.05);
    setTimeout(() => this.tone(660, 0.08, 'square', 0.05), 100);
  },

  caught: function () {
    this.tone(220, 0.4, 'sawtooth', 0.14, 55);
  },

  win: function () {
    const notes = [523, 659, 784, 1046];
    notes.forEach((n, i) => setTimeout(() => this.tone(n, 0.22, 'triangle', 0.12), i * 130));
  },

  click: function () {
    this.tone(440, 0.05, 'sine', 0.07);
  },
};
