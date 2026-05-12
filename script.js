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
  markActiveThemeBtn(savedTheme);

  const savedFont = localStorage.getItem('reader_font');
  if (savedFont) { paper.style.fontFamily = savedFont; }

  const savedSize = localStorage.getItem('reader_fs');
  if (savedSize) { paper.style.fontSize = savedSize; }

  const savedLH = localStorage.getItem('reader_lh');
  if (savedLH) { paper.style.lineHeight = savedLH; currentLineHeight = parseFloat(savedLH); }

  function applyTheme(t) {
    document.body.className = t + '-theme';
    localStorage.setItem('reader_theme', t);
    markActiveThemeBtn(t);
  }
  function markActiveThemeBtn(t) {
    document.querySelectorAll('.t-btn').forEach(b => b.classList.remove('selected'));
    const btn = document.querySelector('.t-' + t);
    if (btn) btn.classList.add('selected');
  }

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
    // Close other sidebars
    document.querySelectorAll('.sidebar').forEach(s => {
      if (s.id !== id) s.classList.remove('active');
    });
    // Close settings
    if (settingsPanel) settingsPanel.classList.remove('active');
  };

  // Close panels on outside click
  document.addEventListener('mousedown', (e) => {
    const inSidebar = e.target.closest('.sidebar');
    const inSettings = e.target.closest('.settings-panel');
    const inNavIcon = e.target.closest('.nav-icon');
    if (!inSidebar && !inSettings && !inNavIcon) {
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

  window.changeTheme = (t) => applyTheme(t);

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
  // 5. HIGHLIGHT SYSTEM (multi-color + persist)
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
      // Re-attach click handlers for loaded highlights
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
    // Clear old results
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
  // 7. AI TEXT-TO-SPEECH (Vietnamese) - IMPROVED
  // ══════════════════════════════════════════════
  const audioBtn = document.getElementById('btn-audio');
  const ttsStatus = document.getElementById('tts-status');
  let synth = window.speechSynthesis;
  let isSpeaking = false;
  let currentUtt = null;

  // Optimized Vietnamese voice selection
  function getBestViVoice() {
    const voices = synth.getVoices();
    // Prioritize "Natural" or "Google" voices as they sound much better (less "ngọng")
    const prioritized = [
      'Google Tiếng Việt',
      'Microsoft An Online',
      'Microsoft HoaiTiên Online',
      'Natural',
      'vi-VN'
    ];
    
    for (const name of prioritized) {
      const found = voices.find(v => v.name.includes(name) || v.lang === 'vi-VN' && v.name.includes(name));
      if (found) return found;
    }
    return voices.find(v => v.lang === 'vi-VN') || voices.find(v => v.lang.startsWith('vi')) || null;
  }

  // Pre-process text to improve pronunciation
  function normalizeVietnamese(text) {
    return text
      .replace(/–/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function startTTS() {
    synth.cancel();
    isSpeaking = true;
    if (audioBtn) { 
      audioBtn.classList.add('active'); 
      audioBtn.innerHTML = '<i class="fas fa-stop"></i><span class="icon-label">Dừng</span>'; 
    }
    if (ttsStatus) { 
      ttsStatus.classList.add('active'); 
    }

    const text = normalizeVietnamese(paper.innerText);
    // Split by punctuation for natural pauses
    const chunks = text.match(/[^.!?:]+[.!?:]+/g) || [text];
    let currentChunk = 0;

    function speakNext() {
      if (!isSpeaking || currentChunk >= chunks.length) {
        stopTTS();
        return;
      }

      const utt = new SpeechSynthesisUtterance(chunks[currentChunk]);
      const voice = getBestViVoice();
      
      utt.lang = 'vi-VN';
      if (voice) {
        utt.voice = voice;
        // Adjust rate for Online voices vs Local voices
        utt.rate = voice.name.includes('Online') ? 0.95 : 0.9;
      } else {
        utt.rate = 0.9;
      }
      
      utt.pitch = 1.0;
      utt.volume = 1.0;

      utt.onend = () => {
        if (isSpeaking) {
          currentChunk++;
          // Small pause between sentences for naturalness
          setTimeout(speakNext, 250);
        }
      };

      utt.onerror = (e) => {
        console.error('TTS Error:', e);
        if (isSpeaking) {
          currentChunk++;
          speakNext();
        }
      };

      if (ttsStatus) {
        const progress = Math.round((currentChunk / chunks.length) * 100);
        ttsStatus.querySelector('span:last-child').textContent = `Đang đọc... ${progress}%`;
      }

      currentUtt = utt;
      synth.speak(utt);
    }

    speakNext();
  }

  function stopTTS() {
    isSpeaking = false;
    synth.cancel();
    if (audioBtn) { audioBtn.classList.remove('active'); audioBtn.innerHTML = '<i class="fas fa-headphones"></i><span class="icon-label">Giọng đọc</span>'; }
    if (ttsStatus) ttsStatus.classList.remove('active');
  }

  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      if (isSpeaking) stopTTS();
      else startTTS();
    });
  }

  // Load voices async
  if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = () => getViVoice();
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
        window.scrollBy({ top: autoScrollSpeed, behavior: 'instant' });
        // Stop at bottom
        if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 10) {
          clearInterval(autoScrollInterval);
          if (toggle) toggle.checked = false;
        }
      }, 20);
    } else {
      clearInterval(autoScrollInterval);
      autoScrollInterval = null;
    }
  };

  window.updateScrollSpeed = (val) => {
    autoScrollSpeed = parseFloat(val);
    const label = document.getElementById('scroll-speed-label');
    if (label) label.textContent = val + 'x';
    // Restart if running
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      window.toggleAutoScroll();
    }
  };

  // ══════════════════════════════════════════════
  // 9. BACKGROUND MUSIC
  // ══════════════════════════════════════════════
  let currentTrack = null;

  window.playTrack = (trackId) => {
    const btn = document.getElementById('btn-music-' + trackId);
    if (currentTrack === trackId && AmbientMusic.isPlaying()) {
      AmbientMusic.stop();
      document.querySelectorAll('.music-track').forEach(t => t.classList.remove('playing'));
      currentTrack = null;
    } else {
      AmbientMusic.play(trackId);
      currentTrack = trackId;
      document.querySelectorAll('.music-track').forEach(t => t.classList.remove('playing'));
      if (btn) btn.classList.add('playing');
    }
  };

  window.updateMusicVolume = (val) => {
    AmbientMusic.setVolume(parseFloat(val));
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