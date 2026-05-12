/**
 * Chọn giọng phù hợp tiếng Việt và đọc theo hàng đợi câu
 * (Web Speech API — giọng phụ thuộc hệ điều hành đã cài)
 */

const BAD_LANG_HINT = /\b(english|united states|united kingdom)\b/i;

function normalize(s) {
  return (s || "").toLowerCase();
}

/** Điểm càng cao = càng nên dùng cho văn bản tiếng Việt */
export function scoreVoiceForVietnamese(voice) {
  let score = 0;
  const lang = normalize(voice.lang);
  const name = normalize(voice.name);
  const uri = normalize(voice.voiceURI);

  if (lang === "vi-vn" || lang.startsWith("vi-") || lang === "vi") score += 120;
  if (name.includes("vietnamese") || name.includes("viet nam") || name.includes("việt")) score += 90;
  if (name.includes("hoài") || name.includes("hoai") || name.includes("hoaimy")) score += 70;
  if (name.includes("nam minh") || name.includes("namminh")) score += 65;
  if (name.includes("minh") && lang.startsWith("vi")) score += 25;
  if (/(neural|natural|premium|enhanced|online)/.test(name)) score += 35;
  if (voice.localService) score += 12;

  /** Giảm mạnh giọng chỉ tiếng Anh — thường đọc tiếng Việt bị ngọng */
  if ((lang.startsWith("en") || BAD_LANG_HINT.test(name)) && !lang.startsWith("vi")) score -= 80;

  if (name.includes("google") && lang.startsWith("vi")) score += 40;

  if (!lang || lang === "") score -= 15;

  if (uri.includes("vi_vn") || uri.includes("vietnamese")) score += 25;

  return score;
}

export function sortVoicesForVietnamese(voices) {
  return [...voices].sort((a, b) => scoreVoiceForVietnamese(b) - scoreVoiceForVietnamese(a));
}

export function pickBestVietnameseVoice(voices) {
  const sorted = sortVoicesForVietnamese(voices);
  return sorted[0] ?? null;
}

/** Tách đoạn văn thành câu */
export function splitIntoSentences(text) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  const parts = cleaned.split(/(?<=[\.\!\?\…])\s+|(?<=\n)/);
  return parts.map((p) => p.trim()).filter(Boolean);
}

export function stripHtml(el) {
  const clone = el.cloneNode(true);
  clone.querySelectorAll(".tts-highlight").forEach((n) => {
    const parent = n.parentNode;
    while (n.firstChild) parent.insertBefore(n.firstChild, n);
    parent.removeChild(n);
  });
  return clone.textContent || "";
}

export class VietnameseSpeechQueue {
  constructor({ onSentence, onEnd, onError } = {}) {
    this.onSentence = onSentence;
    this.onEnd = onEnd;
    this.onError = onError;
    this._cancelled = false;
  }

  /**
   * @param {string[]} sentences
   * @param {{ voice?: SpeechSynthesisVoice; lang?: string; rate?: number; pitch?: number; volume?: number }} opts
   */
  speak(sentences, opts) {
    if (!window.speechSynthesis) {
      this.onError?.(new Error("Trình duyệt không hỗ trợ đọc giọng."));
      return;
    }

    speechSynthesis.cancel();
    this._cancelled = false;

    let idx = 0;

    const speakOne = () => {
      if (this._cancelled || idx >= sentences.length) {
        this.onEnd?.();
        return;
      }

      const text = sentences[idx];
      const u = new SpeechSynthesisUtterance(text);
      u.lang = opts.lang || "vi-VN";
      if (opts.voice) u.voice = opts.voice;
      u.rate = opts.rate ?? 0.92;
      u.pitch = opts.pitch ?? 1;
      u.volume = opts.volume ?? 1;

      this.onSentence?.(text, idx);

      u.onend = () => {
        idx += 1;
        speakOne();
      };
      u.onerror = (e) => {
        this.onError?.(e);
        idx += 1;
        speakOne();
      };

      speechSynthesis.speak(u);
    };

    speakOne();
  }

  cancel() {
    this._cancelled = true;
    if (window.speechSynthesis) speechSynthesis.cancel();
  }

  pause() {
    speechSynthesis?.pause?.();
  }

  resume() {
    speechSynthesis?.resume?.();
  }
}

export function getVoicesLoaded() {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    if (!synth) {
      resolve([]);
      return;
    }
    let voices = synth.getVoices();
    if (voices.length) {
      resolve(voices);
      return;
    }
    const onVoices = () => {
      voices = synth.getVoices();
      if (voices.length) {
        synth.removeEventListener("voiceschanged", onVoices);
        resolve(voices);
      }
    };
    synth.addEventListener("voiceschanged", onVoices);
    setTimeout(() => {
      voices = synth.getVoices();
      if (voices.length) {
        synth.removeEventListener("voiceschanged", onVoices);
        resolve(voices);
      }
    }, 800);
  });
}
