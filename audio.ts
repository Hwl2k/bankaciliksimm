export type SoundKind = 'ding' | 'ok' | 'err' | 'msg' | 'promo';

class BankAudioEngine {
  private ctx: AudioContext | null = null;
  public enabled = true;

  play(kind: SoundKind): void {
    if (!this.enabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.ctx) this.ctx = new AudioCtx();
      const now = this.ctx.currentTime;

      const tone = (freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.09) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(vol, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + dur + 0.02);
      };

      if (kind === 'ding') {
        tone(880, now, 0.24, 'sine', 0.11);
        tone(659.25, now + 0.18, 0.34, 'sine', 0.11);
      } else if (kind === 'ok') {
        tone(540, now, 0.1, 'triangle', 0.09);
        tone(780, now + 0.09, 0.2, 'triangle', 0.09);
      } else if (kind === 'err') {
        tone(210, now, 0.14, 'sawtooth', 0.07);
        tone(150, now + 0.12, 0.22, 'sawtooth', 0.07);
      } else if (kind === 'msg') {
        tone(960, now, 0.1, 'sine', 0.05);
      } else if (kind === 'promo') {
        tone(523, now, 0.12, 'triangle', 0.1);
        tone(659, now + 0.1, 0.12, 'triangle', 0.1);
        tone(784, now + 0.2, 0.12, 'triangle', 0.1);
        tone(1046, now + 0.3, 0.28, 'triangle', 0.11);
      }
    } catch {
      // Ignore audio autoplay blocks in headless browsers
    }
  }
}

export const bankAudio = new BankAudioEngine();
