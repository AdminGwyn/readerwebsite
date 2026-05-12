/**
 * Nhạc nền: ambient tổng hợp (Web Audio) + file người dùng
 */

export class AmbientEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.oscNodes = [];
    this.gainNodes = [];
    this.userSource = null;
    this.userGain = null;
    /** @type {HTMLAudioElement | null} */
    this.loopAudio = null;
    this._started = false;
  }

  async ensureContext() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) throw new Error("Web Audio không khả dụng.");
    if (!this.ctx) {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.master.gain.value = 0.28;
    }
    if (this.ctx.state === "suspended") await this.ctx.resume();
    return this.ctx;
  }

  /** Pad êm — không cần file ngoài */
  async startAmbient() {
    await this.ensureContext();
    if (this._started) return;
    this._started = true;

    const freqs = [196, 293.66, 392];
    freqs.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = i === 0 ? "sine" : "triangle";
      osc.frequency.value = freq;
      gain.gain.value = i === 0 ? 0.06 : 0.035;
      osc.connect(gain);
      gain.connect(this.master);
      osc.start();
      this.oscNodes.push(osc);
      this.gainNodes.push(gain);
    });

    /** Chậm dao động biên độ — cảm giác “thở” */
    const now = this.ctx.currentTime;
    this.gainNodes.forEach((g, i) => {
      g.gain.setValueAtTime(g.gain.value, now);
      g.gain.exponentialRampToValueAtTime(Math.max(0.02, g.gain.value * 0.55), now + 5 + i);
      g.gain.exponentialRampToValueAtTime(g.gain.value, now + 12 + i * 2);
    });
  }

  stopAmbient() {
    this.oscNodes.forEach((o) => {
      try {
        o.stop();
      } catch {
        /* noop */
      }
    });
    this.oscNodes = [];
    this.gainNodes = [];
    this._started = false;
  }

  setAmbientVolume(v01) {
    if (!this.master) return;
    this.master.gain.value = Math.min(0.55, Math.max(0, v01));
  }

  async playUserBuffer(arrayBuffer) {
    await this.ensureContext();
    this.stopUser();
    const decoded = await this.ctx.decodeAudioData(arrayBuffer.slice(0));
    const src = this.ctx.createBufferSource();
    src.buffer = decoded;
    src.loop = true;
    const g = this.ctx.createGain();
    g.gain.value = 0.35;
    src.connect(g);
    g.connect(this.ctx.destination);
    src.start();
    this.userSource = src;
    this.userGain = g;
  }

  stopUser() {
    if (this.userSource) {
      try {
        this.userSource.stop();
      } catch {
        /* noop */
      }
      this.userSource = null;
      this.userGain = null;
    }
  }

  setUserVolume(v01) {
    if (this.userGain) this.userGain.gain.value = Math.min(1, Math.max(0, v01));
  }

  /** Phát file MP3 có sẵn trong thư mục dự án (nhạc nền lặp) */
  async playLoopUrl(url) {
    this.stopLoopUrl();
    const a = new Audio(url);
    a.loop = true;
    a.preload = "auto";
    a.volume = 0.28;
    this.loopAudio = a;
    try {
      await a.play();
    } catch {
      throw new Error("Không phát được nhạc nền — thử tương tác trang trước.");
    }
  }

  stopLoopUrl() {
    if (this.loopAudio) {
      this.loopAudio.pause();
      this.loopAudio.src = "";
      this.loopAudio = null;
    }
  }

  setLoopUrlVolume(v01) {
    if (this.loopAudio) this.loopAudio.volume = Math.min(1, Math.max(0, v01));
  }

  dispose() {
    this.stopAmbient();
    this.stopUser();
    this.stopLoopUrl();
    if (this.ctx) this.ctx.close();
    this.ctx = null;
    this.master = null;
  }
}
