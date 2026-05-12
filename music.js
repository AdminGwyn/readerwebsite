/* ===== MUSIC GENERATOR - Ambient Web Audio ===== */
const AmbientMusic = (() => {
  let ctx = null, gainNode = null, playing = false, nodes = [];

  const tracks = {
    rain: { label: '🌧️ Mưa nhẹ', fn: playRain },
    forest: { label: '🌿 Rừng xanh', fn: playForest },
    cafe: { label: '☕ Quán cà phê', fn: playCafe },
    ocean: { label: '🌊 Biển đêm', fn: playOcean },
  };

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = ctx.createGain();
    gainNode.gain.value = 0.25;
    gainNode.connect(ctx.destination);
  }

  function stopAll() {
    nodes.forEach(n => { try { n.stop(); } catch(e){} });
    nodes = []; playing = false;
  }

  function playRain() {
    stopAll();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.12;
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 1200;
    src.connect(filter); filter.connect(gainNode);
    src.start(); nodes.push(src); playing = true;
  }

  function playForest() {
    stopAll();
    [200, 280, 320, 450].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq;
      g.gain.value = 0.04 + i * 0.01;
      osc.connect(g); g.connect(gainNode);
      osc.start(); nodes.push(osc);
      // LFO modulation
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.1 + i * 0.05;
      lfoGain.gain.value = 5;
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
      lfo.start(); nodes.push(lfo);
    });
    playing = true;
  }

  function playCafe() {
    stopAll();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.05;
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const hi = ctx.createBiquadFilter();
    hi.type = 'highpass'; hi.frequency.value = 800;
    const lo = ctx.createBiquadFilter();
    lo.type = 'lowpass'; lo.frequency.value = 3000;
    src.connect(hi); hi.connect(lo); lo.connect(gainNode);
    src.start(); nodes.push(src); playing = true;
  }

  function playOcean() {
    stopAll();
    const buf = ctx.createBuffer(2, ctx.sampleRate * 6, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.08;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 600;
    src.connect(f); f.connect(gainNode);
    src.start(); nodes.push(src); playing = true;
  }

  return {
    play(trackId) { init(); tracks[trackId]?.fn(); },
    stop() { stopAll(); },
    setVolume(v) { if (gainNode) gainNode.gain.value = v; },
    isPlaying() { return playing; },
    tracks
  };
})();

window.AmbientMusic = AmbientMusic;
