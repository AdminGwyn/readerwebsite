/* ===== READER SCRIPT - HÌNH VẼ THÔNG MINH ===== */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const paper = document.getElementById('reader-content');
  const settingsPanel = document.getElementById('settings-panel');
  if (!paper) return;

  // ══════════════════════════════════════════════
  // 1. THEME & STATE RESTORE
  // ══════════════════════════════════════════════
  const savedTheme = localStorage.getItem('reader_theme') || 'dark';
  applyTheme(savedTheme);

  const savedFont = localStorage.getItem('reader_font');
  if (savedFont) { paper.style.fontFamily = savedFont; }

  const savedSize = localStorage.getItem('reader_fs');
  if (savedSize) { paper.style.fontSize = savedSize; }

  const savedLH = localStorage.getItem('reader_lh');
  if (savedLH) { paper.style.lineHeight = savedLH; currentLineHeight = parseFloat(savedLH); }

  function applyTheme(t) {
    document.body.className = t + '-theme';
    localStorage.setItem('reader_theme', t);
    document.querySelectorAll('.t-btn').forEach(b => b.classList.remove('selected'));
    const btn = document.querySelector('.t-' + t);
    if (btn) btn.classList.add('selected');
  }

  window.changeTheme = (t) => applyTheme(t);

  // ══════════════════════════════════════════════
  // 2. READING PROGRESS BAR
  // ══════════════════════════════════════════════
  const progressBar = document.getElementById('reading-progress-bar');
  const progressText = document.getElementById('reading-progress-text');

  function updateProgress() {
    const scrollTop = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docH > 0 ? Math.round((scrollTop / docH) * 100) : 0;
    if (progressBar) progressBar.style.width = pct + '%';
    if (progressText) progressText.textContent = pct + '%';
    localStorage.setItem('reader_progress_' + location.pathname, pct);
  }
  window.addEventListener('scroll', updateProgress, { passive: true });

  // ══════════════════════════════════════════════
  // 3. SIDEBAR MANAGEMENT
  // ══════════════════════════════════════════════
  window.openSidebar = (id) => {
    const sb = document.getElementById(id);
    if (!sb) return;
    const isActive = sb.classList.toggle('active');
    document.querySelectorAll('.sidebar').forEach(s => {
      if (s.id !== id) s.classList.remove('active');
    });
    if (settingsPanel) settingsPanel.classList.remove('active');
  };

  document.addEventListener('mousedown', (e) => {
    if (!e.target.closest('.sidebar') && !e.target.closest('.settings-panel') && !e.target.closest('.nav-icon')) {
      document.querySelectorAll('.sidebar').forEach(s => s.classList.remove('active'));
      if (settingsPanel) settingsPanel.classList.remove('active');
    }
  });

  // ══════════════════════════════════════════════
  // 4. SETTINGS PANEL
  // ══════════════════════════════════════════════
  window.toggleSettings = () => {
    if (settingsPanel) settingsPanel.classList.toggle('active');
    document.querySelectorAll('.sidebar').forEach(s => s.classList.remove('active'));
  };

  let currentLineHeight = parseFloat(localStorage.getItem('reader_lh')) || 1.85;

  window.changeFont = (font) => {
    paper.style.fontFamily = font;
    localStorage.setItem('reader_font', font);
  };

  window.updateFont = (step) => {
    const size = parseInt(window.getComputedStyle(paper).fontSize);
    const newSize = Math.max(14, Math.min(28, size + step));
    paper.style.fontSize = newSize + 'px';
    localStorage.setItem('reader_fs', newSize + 'px');
  };

  window.updateLineHeight = (step) => {
    currentLineHeight = Math.max(1.3, Math.min(3.0, currentLineHeight + step));
    paper.style.lineHeight = currentLineHeight;
    localStorage.setItem('reader_lh', currentLineHeight);
  };

  // ══════════════════════════════════════════════
  // 5. HIGHLIGHT SYSTEM
  // ══════════════════════════════════════════════
  let activeHLColor = 'hl-yellow-mark';

  window.setHLColor = (color) => {
    activeHLColor = color + '-mark';
    document.querySelectorAll('.hl-color').forEach(b => b.classList.remove('active'));
    document.querySelector('.hl-' + color)?.classList.add('active');
  };

  window.doHighlight = () => {
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    if (!paper.contains(range.commonAncestorContainer)) return;
    const span = document.createElement('span');
    span.className = 'user-highlight ' + activeHLColor;
    span.title = 'Click để xóa highlight';
    span.addEventListener('click', () => {
      span.replaceWith(...span.childNodes);
      paper.normalize();
      saveHighlights();
    });
    try {
      range.surroundContents(span);
    } catch {
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
    }
    sel.removeAllRanges();
    saveHighlights();
  };

  window.clearAllHighlights = () => {
    paper.querySelectorAll('.user-highlight').forEach(el => {
      el.replaceWith(...el.childNodes);
    });
    paper.normalize();
    saveHighlights();
  };

  function saveHighlights() {
    localStorage.setItem('hl_' + location.pathname, paper.innerHTML);
  }

  function loadHighlights() {
    const saved = localStorage.getItem('hl_' + location.pathname);
    if (saved) {
      paper.innerHTML = saved;
      paper.querySelectorAll('.user-highlight').forEach(span => {
        span.addEventListener('click', () => {
          span.replaceWith(...span.childNodes);
          paper.normalize();
          saveHighlights();
        });
      });
    }
  }
  loadHighlights();

  // ══════════════════════════════════════════════
  // 6. SEARCH
  // ══════════════════════════════════════════════
  window.handleSearch = () => {
    const input = document.getElementById('input-search');
    const key = input?.value.trim();
    paper.querySelectorAll('.find-result').forEach(m => m.replaceWith(...m.childNodes));
    paper.normalize();
    if (!key) return;
    const walker = document.createTreeWalker(paper, NodeFilter.SHOW_TEXT);
    const matches = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeValue.toLowerCase().includes(key.toLowerCase())) {
        matches.push(node);
      }
    }
    matches.forEach(node => {
      const regex = new RegExp(`(${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const frag = document.createDocumentFragment();
      node.nodeValue.split(regex).forEach((part, i) => {
        if (i % 2 === 1) {
          const span = document.createElement('span');
          span.className = 'find-result';
          span.textContent = part;
          frag.appendChild(span);
        } else if (part) {
          frag.appendChild(document.createTextNode(part));
        }
      });
      node.parentNode.replaceChild(frag, node);
    });
    const first = paper.querySelector('.find-result');
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // ══════════════════════════════════════════════
  // 7. AI TEXT-TO-SPEECH (Vietnamese)
  // ══════════════════════════════════════════════
  const audioBtn = document.getElementById('btn-audio');
  const ttsStatus = document.getElementById('tts-status');
  let synth = window.speechSynthesis;
  let isSpeaking = false;

  function getBestViVoice() {
    const voices = synth.getVoices();
    const prioritized = ['Google Tiếng Việt', 'Natural', 'vi-VN'];
    for (const name of prioritized) {
      const found = voices.find(v => v.name.includes(name));
      if (found) return found;
    }
    return voices.find(v => v.lang.startsWith('vi')) || null;
  }

  function startTTS() {
    synth.cancel();
    isSpeaking = true;
    if (audioBtn) {
      audioBtn.classList.add('active');
      audioBtn.innerHTML = '<i class="fas fa-stop"></i><span class="icon-label">Dừng</span>';
    }
    if (ttsStatus) ttsStatus.classList.add('active');

    const text = paper.innerText;
    const chunks = text.match(/[^.!?:]+[.!?:]+/g) || [text];
    let currentChunk = 0;

    function speakNext() {
      if (!isSpeaking || currentChunk >= chunks.length) {
        stopTTS();
        return;
      }
      const utt = new SpeechSynthesisUtterance(chunks[currentChunk]);
      const voice = getBestViVoice();
      if (voice) utt.voice = voice;
      utt.lang = 'vi-VN';
      utt.rate = 0.9;
      utt.onend = () => { if (isSpeaking) { currentChunk++; setTimeout(speakNext, 200); } };
      utt.onerror = () => stopTTS();
      synth.speak(utt);
    }
    speakNext();
  }

  function stopTTS() {
    isSpeaking = false;
    synth.cancel();
    if (audioBtn) {
      audioBtn.classList.remove('active');
      audioBtn.innerHTML = '<i class="fas fa-headphones"></i><span class="icon-label">Giọng đọc</span>';
    }
    if (ttsStatus) ttsStatus.classList.remove('active');
  }

  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      if (isSpeaking) stopTTS();
      else startTTS();
    });
  }

  // ══════════════════════════════════════════════
  // 8. AUTO SCROLL
  // ══════════════════════════════════════════════
  let autoScrollInterval = null;
  let autoScrollSpeed = 1.5;

  window.toggleAutoScroll = () => {
    const toggle = document.getElementById('autoscroll-toggle');
    if (toggle?.checked) {
      autoScrollInterval = setInterval(() => {
        window.scrollBy({ top: 1, behavior: 'auto' });
        if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 10) {
          clearInterval(autoScrollInterval);
          if (toggle) toggle.checked = false;
        }
      }, 30 / autoScrollSpeed);
    } else {
      clearInterval(autoScrollInterval);
      autoScrollInterval = null;
    }
  };

  window.updateScrollSpeed = (val) => {
    autoScrollSpeed = parseFloat(val);
    const label = document.getElementById('scroll-speed-label');
    if (label) label.textContent = val + 'x';
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      window.toggleAutoScroll();
    }
  };

  // ══════════════════════════════════════════════
  // 9. BACKGROUND MUSIC
  // ══════════════════════════════════════════════
  window.playTrack = (trackId) => {
    if (typeof AmbientMusic !== 'undefined') {
        AmbientMusic.play(trackId);
        document.querySelectorAll('.music-track').forEach(t => t.classList.remove('playing'));
        document.getElementById('btn-music-' + trackId)?.classList.add('playing');
    }
  };

  window.updateMusicVolume = (val) => {
    if (typeof AmbientMusic !== 'undefined') AmbientMusic.setVolume(parseFloat(val));
  };

  // ══════════════════════════════════════════════
  // 10. FULLSCREEN
  // ══════════════════════════════════════════════
  const fsBtn = document.getElementById('btn-fullscreen');
  if (fsBtn) {
    fsBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        fsBtn.innerHTML = '<i class="fas fa-compress"></i><span class="icon-label">Thu nhỏ</span>';
      } else {
        document.exitFullscreen();
        fsBtn.innerHTML = '<i class="fas fa-expand"></i><span class="icon-label">Toàn màn hình</span>';
      }
    });
  }

  // ══════════════════════════════════════════════
  // 11. BACK TO TOP
  // ══════════════════════════════════════════════
  const topBtn = document.getElementById('btn-back-to-top');
  if (topBtn) {
    window.addEventListener('scroll', () => {
      topBtn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    topBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});