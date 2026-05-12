/* ===== READER SCRIPT - HÌNH VẼ THÔNG MINH ===== */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const content = document.getElementById('book-content');
  if (!content) return;

  // --- 1. THEME TOGGLE ---
  const themeToggle = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('reader_theme') || 'dark';
  document.body.className = savedTheme + '-theme';
  updateThemeIcon(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.body.className = newTheme + '-theme';
      localStorage.setItem('reader_theme', newTheme);
      updateThemeIcon(newTheme);
    });
  }

  function updateThemeIcon(theme) {
    if (!themeToggle) return;
    const icon = themeToggle.querySelector('i');
    if (theme === 'light') {
      icon.className = 'fas fa-moon';
    } else {
      icon.className = 'fas fa-sun';
    }
  }

  // --- 2. READING PROGRESS ---
  const progressBar = document.getElementById('reading-progress');
  const progressText = document.getElementById('reading-progress-text');

  function updateProgress() {
    const scrollTop = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docH > 0 ? Math.round((scrollTop / docH) * 100) : 0;
    if (progressBar) progressBar.style.width = pct + '%';
    if (progressText) progressText.textContent = pct + '%';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });

  // --- 3. AI TTS (Vietnamese) ---
  const ttsBtn = document.getElementById('tts-btn');
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
    if (ttsBtn) {
        ttsBtn.classList.add('active');
        ttsBtn.innerHTML = '<i class="fas fa-stop"></i>';
    }

    const text = content.innerText;
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
    if (ttsBtn) {
        ttsBtn.classList.remove('active');
        ttsBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    }
  }

  if (ttsBtn) {
    ttsBtn.addEventListener('click', () => {
      if (isSpeaking) stopTTS();
      else startTTS();
    });
  }

  // --- 4. AUTO SCROLL ---
  const scrollBtn = document.getElementById('autoscroll-btn');
  let scrollInterval = null;
  let scrollActive = false;

  if (scrollBtn) {
    scrollBtn.addEventListener('click', () => {
      scrollActive = !scrollActive;
      if (scrollActive) {
        scrollBtn.classList.add('active');
        scrollInterval = setInterval(() => {
          window.scrollBy({ top: 1, behavior: 'auto' });
          if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
              clearInterval(scrollInterval);
              scrollActive = false;
              scrollBtn.classList.remove('active');
          }
        }, 30);
      } else {
        scrollBtn.classList.remove('active');
        clearInterval(scrollInterval);
      }
    });
  }

  // --- 5. BACKGROUND MUSIC ---
  const musicBtn = document.getElementById('bg-music-btn');
  const musicPlayer = document.getElementById('music-player');
  const volumeSlider = document.getElementById('music-volume');
  let musicAudio = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
  musicAudio.loop = true;
  let musicPlaying = false;

  if (musicBtn) {
    musicBtn.addEventListener('click', () => {
      musicPlaying = !musicPlaying;
      if (musicPlaying) {
        musicAudio.play().catch(() => {
            alert('Vui lòng tương tác với trang để phát nhạc');
            musicPlaying = false;
        });
        musicBtn.classList.add('active');
        if (musicPlayer) musicPlayer.classList.add('visible');
      } else {
        musicAudio.pause();
        musicBtn.classList.remove('active');
        if (musicPlayer) musicPlayer.classList.remove('visible');
      }
    });
  }

  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      musicAudio.volume = e.target.value;
    });
  }

  // --- 6. BACK TO TOP ---
  const topBtn = document.getElementById('btn-back-to-top');
  if (topBtn) {
    window.addEventListener('scroll', () => {
      topBtn.style.display = window.scrollY > 400 ? 'flex' : 'none';
    }, { passive: true });

    topBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- 7. HIGHLIGHT TEXT ---
  content.addEventListener('mouseup', () => {
      const selection = window.getSelection();
      if (selection.toString().length > 0) {
          const range = selection.getRangeAt(0);
          const span = document.createElement('span');
          span.className = 'text-highlight';
          span.style.background = 'rgba(255, 255, 0, 0.4)';
          span.style.cursor = 'pointer';
          span.onclick = () => span.outerHTML = span.innerHTML;
          try {
              range.surroundContents(span);
          } catch(e) {
              // Handle complex selections
          }
          selection.removeAllRanges();
      }
  });
});