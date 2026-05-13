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

  let currentLineHeight = parseFloat(localStorage.getItem('reader_lh')) || 1.85;

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
  const bottomSlider = document.getElementById('bottom-slider');
  const bottomPctText = document.getElementById('bottom-pct');

  function updateProgress() {
    const scrollTop = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docH > 0 ? Math.round((scrollTop / docH) * 100) : 0;
    if (progressBar) progressBar.style.width = pct + '%';
    if (progressText) progressText.textContent = pct + '%';
    if (bottomSlider) bottomSlider.value = pct;
    if (bottomPctText) bottomPctText.textContent = pct + '%';
    localStorage.setItem('reader_progress_' + location.pathname, pct);
  }
  window.addEventListener('scroll', updateProgress, { passive: true });

  if (bottomSlider) {
    bottomSlider.addEventListener('input', (e) => {
      const pct = e.target.value;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const targetScroll = (pct / 100) * docH;
      window.scrollTo({ top: targetScroll, behavior: 'auto' });
    });
  }

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
  let isHighlighting = false;

  window.setHLColor = (color) => {
    activeHLColor = 'hl-' + color + '-mark';
    document.querySelectorAll('.hl-color').forEach(b => b.classList.remove('active'));
    document.querySelector('.hl-' + color)?.classList.add('active');
  };

  function highlightTextNode(textNode, startOffset, endOffset) {
    const span = document.createElement('span');
    span.className = 'user-highlight ' + activeHLColor;
    span.title = 'Click để xóa highlight';
    span.addEventListener('click', (e) => {
      e.stopPropagation();
      span.replaceWith(...span.childNodes);
      paper.normalize();
      saveHighlights();
    });
    const range = document.createRange();
    range.setStart(textNode, startOffset);
    range.setEnd(textNode, endOffset);
    range.surroundContents(span);
    return span;
  }

  window.doHighlight = () => {
    if (isHighlighting) return;
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    if (!paper.contains(range.commonAncestorContainer)) return;

    isHighlighting = true;
    try {
      // Collect all text nodes within the selection range
      const textNodes = [];
      const walker = document.createTreeWalker(
        range.commonAncestorContainer.nodeType === 3 
          ? range.commonAncestorContainer.parentNode 
          : range.commonAncestorContainer,
        NodeFilter.SHOW_TEXT
      );
      let started = false;
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node === range.startContainer) started = true;
        if (started) textNodes.push(node);
        if (node === range.endContainer) break;
      }
      // If start and end are same node
      if (textNodes.length === 0 && range.startContainer.nodeType === 3) {
        textNodes.push(range.startContainer);
      }

      // Highlight each text node
      for (let i = textNodes.length - 1; i >= 0; i--) {
        const node = textNodes[i];
        const start = (node === range.startContainer) ? range.startOffset : 0;
        const end = (node === range.endContainer) ? range.endOffset : node.nodeValue.length;
        if (start < end && node.nodeValue.trim().length > 0) {
          highlightTextNode(node, start, end);
        }
      }
    } catch (err) {
      // Fallback: extract and wrap
      try {
        const span = document.createElement('span');
        span.className = 'user-highlight ' + activeHLColor;
        span.title = 'Click để xóa highlight';
        span.addEventListener('click', (e) => {
          e.stopPropagation();
          span.replaceWith(...span.childNodes);
          paper.normalize();
          saveHighlights();
        });
        const contents = range.extractContents();
        span.appendChild(contents);
        range.insertNode(span);
      } catch (e2) { /* silently fail */ }
    }
    sel.removeAllRanges();
    paper.normalize();
    saveHighlights();
    isHighlighting = false;
  };

  // Automatic highlight on mouseup
  paper.addEventListener('mouseup', () => {
    setTimeout(() => {
        if (isHighlighting) return;
        const sel = window.getSelection();
        if (sel && sel.toString().trim().length > 0) {
            window.doHighlight();
        }
    }, 50);
  });

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
  // 6. SEARCH WITH FIND-NEXT
  // ══════════════════════════════════════════════
  let searchCurrentIndex = -1;
  let lastSearchKey = '';

  window.handleSearch = () => {
    const input = document.getElementById('input-search');
    const key = input?.value.trim();
    const counter = document.getElementById('search-counter');

    // If same keyword, jump to next
    if (key && key === lastSearchKey) {
      const allResults = paper.querySelectorAll('.find-result');
      if (allResults.length > 0) {
        // Remove active from current
        allResults.forEach(r => r.classList.remove('active-find'));
        // Move to next
        searchCurrentIndex = (searchCurrentIndex + 1) % allResults.length;
        allResults[searchCurrentIndex].classList.add('active-find');
        allResults[searchCurrentIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (counter) counter.textContent = `${searchCurrentIndex + 1} / ${allResults.length} kết quả`;
      }
      return;
    }

    // New search - clear old results
    paper.querySelectorAll('.find-result').forEach(m => m.replaceWith(...m.childNodes));
    paper.normalize();
    lastSearchKey = key;
    searchCurrentIndex = 0;

    if (!key) {
      if (counter) counter.textContent = '';
      return;
    }

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

    const allResults = paper.querySelectorAll('.find-result');
    if (allResults.length > 0) {
      searchCurrentIndex = 0;
      allResults[0].classList.add('active-find');
      allResults[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (counter) counter.textContent = `1 / ${allResults.length} kết quả`;
    } else {
      if (counter) counter.textContent = 'Không tìm thấy';
    }
  };

  // Also allow Enter key to trigger search
  const searchInput = document.getElementById('input-search');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        window.handleSearch();
      }
    });
    // Reset search when input changes
    searchInput.addEventListener('input', () => {
      const key = searchInput.value.trim();
      if (key !== lastSearchKey) {
        lastSearchKey = '';
        searchCurrentIndex = -1;
      }
    });
  }

  // ══════════════════════════════════════════════
  // 7. AI TEXT-TO-SPEECH (Vietnamese - Improved)
  // ══════════════════════════════════════════════
  const audioBtn = document.getElementById('btn-audio');
  const ttsStatus = document.getElementById('tts-status');
  let synth = window.speechSynthesis;
  let isSpeaking = false;
  let cachedVoice = { 'vi-VN': null, 'en-US': null };

  // Wait for voices to load (Chrome loads them async)
  function loadVoices() {
    return new Promise(resolve => {
      let voices = synth.getVoices();
      if (voices.length > 0) { resolve(voices); return; }
      
      let resolved = false;
      synth.onvoiceschanged = () => {
        if (!resolved) {
          resolved = true;
          resolve(synth.getVoices());
        }
      };
      
      // Timeout fallback
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(synth.getVoices());
        }
      }, 1500);
    });
  }

  async function getBestVoice(lang) {
    if (cachedVoice[lang]) return cachedVoice[lang];
    const voices = await loadVoices();
    
    if (!voices || voices.length === 0) return null;

    let priorityNames = [];
    let langPrefix = '';
    
    if (lang === 'vi-VN') {
      priorityNames = ['Google Tiếng Việt', 'Microsoft An', 'Microsoft NamMinh', 'HoaiMy', 'Wavenet', 'Natural'];
      langPrefix = 'vi';
    } else if (lang === 'en-US') {
      priorityNames = ['Google US English', 'Microsoft Zira', 'Microsoft David', 'Microsoft Mark', 'Wavenet', 'Natural'];
      langPrefix = 'en';
    }
    
    // Helper to check if a voice matches the requested language
    const isMatchingLang = (v) => {
      const vLang = (v.lang || '').toLowerCase();
      const vName = (v.name || '').toLowerCase();
      
      if (vLang.includes(langPrefix)) return true;
      
      // Fallback for Windows voices that might have empty lang but name indicates language
      if (langPrefix === 'vi' && (vName.includes('vietnamese') || vName.includes(' vi ') || vName.includes(' an ') || vName.includes('hoaimy'))) return true;
      if (langPrefix === 'en' && (vName.includes('english') || vName.includes(' en ') || vName.includes('zira') || vName.includes('david'))) return true;
      return false;
    };
    
    // First pass: try priority names
    for (const name of priorityNames) {
      const found = voices.find(v => (v.name || '').toLowerCase().includes(name.toLowerCase()) && isMatchingLang(v));
      if (found) { cachedVoice[lang] = found; return found; }
    }
    
    // Second pass: any voice matching the language prefix
    const matchedVoices = voices.filter(isMatchingLang);
    if (matchedVoices.length > 0) {
      const remote = matchedVoices.find(v => !v.localService);
      cachedVoice[lang] = remote || matchedVoices[0];
      return cachedVoice[lang];
    }
    
    // ULTIMATE FALLBACK: just return the first available voice instead of failing
    // It might sound terrible (reading Vietnamese with an English voice), but it's better than an error.
    cachedVoice[lang] = voices[0];
    return voices[0];
  }

  async function startTTS() {
    synth.cancel();
    
    const langSelect = document.getElementById('tts-lang-select');
    const selectedVal = langSelect ? langSelect.value : 'vi-VN';
    let voice = null;
    let selectedLang = 'vi-VN';
    
    // If user explicitly picked a specific voice
    if (selectedVal.startsWith('voice:')) {
      const voiceName = selectedVal.replace('voice:', '');
      const voices = await loadVoices();
      voice = voices.find(v => v.name === voiceName);
      if (voice) {
        selectedLang = voice.lang || 'vi-VN';
      }
    }
    
    // Fallback to automatic
    if (!voice) {
      selectedLang = selectedVal.startsWith('voice:') ? 'vi-VN' : selectedVal;
      voice = await getBestVoice(selectedLang);
    }

    if (!voice) {
      alert('⚠️ Trình duyệt của bạn không hỗ trợ giọng đọc.\n\nĐể có trải nghiệm tốt nhất:\n• Dùng Google Chrome (khuyến nghị)\n• Hoặc Microsoft Edge\n• Kiểm tra cài đặt ngôn ngữ trong hệ thống');
      return;
    }
    
    isSpeaking = true;
    if (audioBtn) {
      audioBtn.classList.add('active');
      audioBtn.innerHTML = '<i class="fas fa-stop"></i><span class="icon-label">Dừng</span>';
    }
    if (ttsStatus) ttsStatus.classList.add('active');

    const text = paper.innerText;
    // Better chunking: split by sentences (punctuation aware)
    const chunks = text.match(/[^.!?;:\n]+[.!?;:\n]*/g) || [text];
    // Filter out empty/whitespace-only chunks
    const validChunks = chunks.filter(c => c.trim().length > 2);
    let currentChunk = 0;

    function speakNext() {
      if (!isSpeaking || currentChunk >= validChunks.length) {
        stopTTS();
        return;
      }
      const utt = new SpeechSynthesisUtterance(validChunks[currentChunk].trim());
      utt.voice = voice;
      utt.lang = selectedLang;
      utt.rate = 1.0;   // Normal speed
      utt.pitch = 1.0;
      utt.volume = 1.0;
      utt.onend = () => { 
        if (isSpeaking) { 
          currentChunk++; 
          // Chrome bug: speechSynthesis can pause, need to keep it alive
          setTimeout(speakNext, 100); 
        } 
      };
      utt.onerror = (e) => {
        if (e.error !== 'interrupted') stopTTS();
      };
      synth.speak(utt);
    }
    speakNext();
    
    // Chrome workaround: prevent speech from pausing after ~15 seconds
    const keepAlive = setInterval(() => {
      if (!isSpeaking) { clearInterval(keepAlive); return; }
      if (synth.speaking) { synth.pause(); synth.resume(); }
    }, 10000);
  }

  // Populate the language dropdown with specific voices
  async function populateVoiceList() {
    const langSelect = document.getElementById('tts-lang-select');
    if (!langSelect) return;
    
    const voices = await loadVoices();
    
    // Create voice options
    let html = '<optgroup label="Tự động (Khuyên dùng)">';
    html += '<option value="vi-VN">Tiếng Việt (Tự động)</option>';
    html += '<option value="en-US">Tiếng Anh (Tự động)</option>';
    html += '</optgroup>';
    
    // Group by language
    const viVoices = voices.filter(v => 
      (v.lang || '').toLowerCase().includes('vi') || 
      (v.name || '').toLowerCase().includes('vietnamese') || 
      (v.name || '').toLowerCase().includes(' an ') ||
      (v.name || '').toLowerCase().includes('hoaimy')
    );
    const otherVoices = voices.filter(v => !viVoices.includes(v));
    
    if (viVoices.length > 0) {
      html += '<optgroup label="Giọng Tiếng Việt (Cụ thể)">';
      viVoices.forEach(v => {
        html += `<option value="voice:${v.name}">${v.name}</option>`;
      });
      html += '</optgroup>';
    }
    
    if (otherVoices.length > 0) {
      html += '<optgroup label="Giọng Khác (Cụ thể)">';
      otherVoices.forEach(v => {
        html += `<option value="voice:${v.name}">${v.name} (${v.lang || 'Unknown'})</option>`;
      });
      html += '</optgroup>';
    }
    
    // Keep current selection if possible
    const currentVal = langSelect.value;
    langSelect.innerHTML = html;
    if (langSelect.querySelector(`option[value="${currentVal}"]`)) {
        langSelect.value = currentVal;
    }
  }
  
  // Call immediately to populate
  populateVoiceList();

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
  
  // Preload voices
  loadVoices();

  // ══════════════════════════════════════════════
  // 8. AUTO SCROLL (faster speeds)
  // ══════════════════════════════════════════════
  let autoScrollRAF = null;
  let autoScrollSpeed = 1.5;
  let autoScrollActive = false;

  function autoScrollStep() {
    if (!autoScrollActive) return;
    // Speed: pixels per frame. At 1x = 0.8px, at 10x = 8px per frame
    const pxPerFrame = autoScrollSpeed * 0.8;
    window.scrollBy({ top: pxPerFrame, behavior: 'auto' });
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 10) {
      autoScrollActive = false;
      const toggle = document.getElementById('autoscroll-toggle');
      if (toggle) toggle.checked = false;
      return;
    }
    autoScrollRAF = requestAnimationFrame(autoScrollStep);
  }

  window.toggleAutoScroll = () => {
    const toggle = document.getElementById('autoscroll-toggle');
    if (toggle?.checked) {
      autoScrollActive = true;
      autoScrollRAF = requestAnimationFrame(autoScrollStep);
    } else {
      autoScrollActive = false;
      if (autoScrollRAF) cancelAnimationFrame(autoScrollRAF);
      autoScrollRAF = null;
    }
  };

  window.updateScrollSpeed = (val) => {
    autoScrollSpeed = parseFloat(val);
    const label = document.getElementById('scroll-speed-label');
    if (label) label.textContent = val + 'x';
    // No need to restart, speed is read each frame
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
    const volLabel = document.getElementById('vol-pct');
    if (volLabel) volLabel.textContent = Math.round(parseFloat(val) * 100) + '%';
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