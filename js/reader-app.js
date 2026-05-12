import { initTheme, toggleTheme, themeIcon } from "./theme.js";
import { getStoryById, loadLibrary } from "./store.js";
import {
  getVoicesLoaded,
  sortVoicesForVietnamese,
  scoreVoiceForVietnamese,
  splitIntoSentences,
  stripHtml,
  VietnameseSpeechQueue,
} from "./vietnamese-tts.js";
import { AmbientEngine } from "./ambient-audio.js";

initTheme();

const params = new URLSearchParams(location.search);
const idParam = params.get("id");
let story = getStoryById(idParam) ?? loadLibrary().stories[0] ?? null;

const $ = (s, r = document) => r.querySelector(s);

const scrollEl = $("#read-scroll");
const article = $("#article");
const progressFill = $("#progress-fill");
const progressPct = $("#progress-pct");
const voiceSelect = $("#voice-select");
const voiceHint = $("#voice-hint");
const rateEl = $("#rate");
const pitchEl = $("#pitch");
const autoScroll = $("#auto-scroll");
const scrollSpeed = $("#scroll-speed");
const musicVol = $("#music-vol");
const fontRange = $("#font-size");
const fsKey = "reader_font_px";

let voicesList = [];
let scrollRaf = null;
let ambientOn = false;
let loopOn = false;
const ambient = new AmbientEngine();

const tts = new VietnameseSpeechQueue({});

function renderStory() {
  if (!story) {
    article.innerHTML =
      "<p>Chưa có nội dung. Thêm sách trong trang quản trị hoặc quay <a href='index.html'>trang chủ</a>.</p>";
    return;
  }
  $("#book-title").textContent = story.title;
  $("#book-author").textContent = [story.author, story.publisher].filter(Boolean).join(" · ");

  const toc = $("#toc-nav");
  toc.innerHTML = "";
  (story.chapters || []).forEach((ch, i) => {
    const a = document.createElement("a");
    a.href = `#ch-${ch.id}`;
    a.textContent = `${i + 1}. ${ch.title}`;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById(`ch-${ch.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    toc.appendChild(a);
  });

  article.innerHTML = (story.chapters || [])
    .map((ch) => `<section class="chapter-block" id="ch-${ch.id}">${ch.html}</section>`)
    .join("");
}

function updateProgress() {
  const el = scrollEl;
  const max = el.scrollHeight - el.clientHeight;
  const p = max > 0 ? Math.round((el.scrollTop / max) * 100) : 100;
  const c = Math.min(100, Math.max(0, p));
  progressFill.style.width = `${c}%`;
  progressPct.textContent = `${c}% đã đọc`;
}

function loopAutoScroll() {
  if (!autoScroll.checked) {
    scrollRaf = null;
    return;
  }
  const spd = Number(scrollSpeed.value) / 320;
  scrollEl.scrollTop += spd;
  updateProgress();
  scrollRaf = requestAnimationFrame(loopAutoScroll);
}

function startAuto() {
  if (scrollRaf) cancelAnimationFrame(scrollRaf);
  scrollRaf = requestAnimationFrame(loopAutoScroll);
}

async function loadVoices() {
  voicesList = await getVoicesLoaded();
  voiceSelect.innerHTML = "";
  sortVoicesForVietnamese(voicesList).forEach((v) => {
    const opt = document.createElement("option");
    opt.value = String(voicesList.indexOf(v));
    const vi = (v.lang || "").toLowerCase().startsWith("vi") ? "VI" : v.lang || "?";
    opt.textContent = `${v.name} (${vi})`;
    voiceSelect.appendChild(opt);
  });
  const best = sortVoicesForVietnamese(voicesList)[0];
  if (best && (best.lang || "").toLowerCase().startsWith("vi")) {
    voiceHint.textContent = "Ưu tiên giọng tiếng Việt khi có.";
    voiceHint.className = "hint ok";
  } else {
    voiceHint.textContent = "Nên cài giọng vi-VN trong Windows/macOS để đọc tự nhiên.";
    voiceHint.className = "hint warn";
  }
}

function currentVoice() {
  const i = Number(voiceSelect.value);
  return voicesList[i] ?? null;
}

function speak() {
  const text = stripHtml(article);
  const sentences = splitIntoSentences(text);
  if (!sentences.length) return;
  const v = currentVoice();
  tts.cancel();
  tts.speak(sentences, {
    voice: v,
    lang: v?.lang?.startsWith("vi") ? v.lang : "vi-VN",
    rate: Number(rateEl.value),
    pitch: Number(pitchEl.value),
    volume: 1,
  });
}

function highlightSelection() {
  const sel = window.getSelection();
  if (!sel?.rangeCount || sel.isCollapsed || !article.contains(sel.anchorNode)) return;
  const range = sel.getRangeAt(0);
  try {
    const span = document.createElement("span");
    span.className = "hl";
    range.surroundContents(span);
    sel.removeAllRanges();
  } catch {
    alert("Chọn một đoạn trong cùng một khối để đánh dấu.");
  }
}

function clearHighlights() {
  article.querySelectorAll(".hl").forEach((el) => {
    const p = el.parentNode;
    while (el.firstChild) p.insertBefore(el.firstChild, el);
    p.removeChild(el);
    p.normalize();
  });
}

function updateThemeBtn() {
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  const b = $("#theme-toggle");
  if (b) {
    b.textContent = themeIcon(dark);
    b.title = dark ? "Sáng" : "Tối";
  }
}

fontRange.addEventListener("input", () => {
  const v = fontRange.value;
  article.style.setProperty("--read-fs", `${v}px`);
  localStorage.setItem(fsKey, v);
});

scrollEl.addEventListener("scroll", updateProgress, { passive: true });

$("#theme-toggle").addEventListener("click", () => {
  toggleTheme();
  updateThemeBtn();
});

$("#btn-speak").addEventListener("click", speak);
$("#btn-pause").addEventListener("click", () => {
  if (speechSynthesis?.paused) tts.resume();
  else tts.pause();
});
$("#btn-stop").addEventListener("click", () => tts.cancel());

$("#btn-highlight").addEventListener("click", highlightSelection);
$("#btn-clear-hl").addEventListener("click", clearHighlights);

autoScroll.addEventListener("change", () => {
  if (autoScroll.checked) startAuto();
  else if (scrollRaf) cancelAnimationFrame(scrollRaf);
});

$("#btn-ambient").addEventListener("click", async () => {
  try {
    if (ambientOn || loopOn) {
      ambient.stopAmbient();
      ambient.stopLoopUrl();
      ambientOn = false;
      loopOn = false;
      $("#btn-ambient").classList.remove("active");
      return;
    }
    try {
      await ambient.playLoopUrl("assets/audio/ambient-soft.mp3");
      loopOn = true;
      ambient.setLoopUrlVolume(Number(musicVol.value) / 100);
    } catch {
      await ambient.startAmbient();
      ambientOn = true;
      ambient.setAmbientVolume(Number(musicVol.value) / 100);
    }
    $("#btn-ambient").classList.add("active");
  } catch {
    voiceHint.textContent = "Bấm lại sau khi đã tương tác trang.";
    voiceHint.className = "hint warn";
  }
});

musicVol.addEventListener("input", () => {
  const v = Number(musicVol.value) / 100;
  ambient.setAmbientVolume(v);
  ambient.setUserVolume(v);
  ambient.setLoopUrlVolume(v);
});

renderStory();
const savedFs = localStorage.getItem(fsKey);
if (savedFs && fontRange) {
  fontRange.value = savedFs;
  article.style.setProperty("--read-fs", `${savedFs}px`);
}
updateProgress();
loadVoices();
updateThemeBtn();

window.speechSynthesis?.addEventListener?.("voiceschanged", loadVoices);

const dockToggle = $("#dock-toggle");
const readDock = $("#read-dock");

if (dockToggle && readDock) {
  dockToggle.addEventListener("click", () => {
    dockToggle.classList.toggle("open");
    readDock.classList.toggle("open");
  });
}
