// The Velvet Vault — tiny synthesized sounds. No audio files: every blip
// is an oscillator through the Web Audio API, so the game stays offline.

export class VaultAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch (e) {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  tone(freq, dur, type, vol, slideTo) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol || 0.08, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur);
  }

  click() { this.tone(660, 0.07, 'triangle', 0.06); }
  coin() { this.tone(990, 0.09, 'sine', 0.09); this.tone(1320, 0.12, 'sine', 0.07); }
  pickup() {
    this.tone(523, 0.12, 'triangle', 0.1);
    setTimeout(() => this.tone(784, 0.14, 'triangle', 0.1), 90);
    setTimeout(() => this.tone(1046, 0.2, 'triangle', 0.1), 180);
  }
  decoy() { this.tone(1800, 0.05, 'square', 0.04); }
  smoke() { this.tone(300, 0.35, 'sine', 0.08, 90); }
  cloak() { this.tone(440, 0.4, 'sine', 0.06, 880); }
  laserZap() { this.tone(220, 0.18, 'sawtooth', 0.07, 110); }
  alarmBlip() { this.tone(880, 0.12, 'square', 0.05, 660); }
  caught() {
    this.tone(220, 0.25, 'sawtooth', 0.1, 110);
    setTimeout(() => this.tone(165, 0.4, 'sawtooth', 0.1, 82), 200);
  }
  win() {
    [523, 659, 784, 1046].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.22, 'triangle', 0.09), i * 120));
  }
}
