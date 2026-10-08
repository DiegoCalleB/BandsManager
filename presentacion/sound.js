/* Sonido de la presentación: todo se sintetiza con WebAudio, no hay archivos de audio.
   Apagado por defecto (el navegador exige un gesto para sonar). Tecla M o botón «Sonido». */
(function () {
  const KEY = 'deck_sound';

  function chain(c) {
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.25;
    const master = c.createGain();
    master.gain.value = 0.8;
    comp.connect(master).connect(c.destination);
    return comp;
  }

  function kit(c, out) {
    const nb = (() => {
      const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return b;
    })();
    const noise = (t, dur) => { const s = c.createBufferSource(); s.buffer = nb; s.loop = true; s.start(t); s.stop(t + dur); return s; };
    const env = (g, t, a, peak, d) => {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    };
    return {
      whoosh(t, dur = 0.6, f0 = 300, f1 = 3200, gain = 0.16) {
        const s = noise(t, dur + 0.1), f = c.createBiquadFilter(), g = c.createGain();
        f.type = 'bandpass'; f.Q.value = 1.1;
        f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
        env(g, t, dur * 0.35, gain, dur * 0.65);
        s.connect(f).connect(g).connect(out);
      },
      hit(t, gain = 0.6) {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.55);
        env(g, t, 0.008, gain, 0.9);
        o.connect(g).connect(out); o.start(t); o.stop(t + 1.1);
        const s = noise(t, 0.4), f = c.createBiquadFilter(), g2 = c.createGain();
        f.type = 'lowpass'; f.frequency.setValueAtTime(1800, t); f.frequency.exponentialRampToValueAtTime(120, t + 0.35);
        env(g2, t, 0.004, gain * 0.5, 0.35);
        s.connect(f).connect(g2).connect(out);
      },
      blip(t, freq = 880, gain = 0.1) {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'triangle'; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.09);
        env(g, t, 0.005, gain, 0.14);
        o.connect(g).connect(out); o.start(t); o.stop(t + 0.25);
      },
      tick(t, gain = 0.08) {
        const s = noise(t, 0.05), f = c.createBiquadFilter(), g = c.createGain();
        f.type = 'highpass'; f.frequency.value = 2500;
        env(g, t, 0.002, gain, 0.03);
        s.connect(f).connect(g).connect(out);
      },
      riser(t, dur, gain = 0.14) {
        const s = noise(t, dur + 0.1), f = c.createBiquadFilter(), g = c.createGain();
        f.type = 'highpass'; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(5000, t + dur);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + dur); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.05);
        s.connect(f).connect(g).connect(out);
        const o = c.createOscillator(), lp = c.createBiquadFilter(), g2 = c.createGain();
        o.type = 'sawtooth'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(880, t + dur);
        lp.type = 'lowpass'; lp.frequency.value = 1400;
        g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(gain * 0.5, t + dur); g2.gain.linearRampToValueAtTime(0.0001, t + dur + 0.05);
        o.connect(lp).connect(g2).connect(out); o.start(t); o.stop(t + dur + 0.1);
      },
      chime(t, gain = 0.12) {
        [659.25, 987.77, 1318.5, 1975.5].forEach((fr, i) => {
          const o = c.createOscillator(), g = c.createGain(), at = t + i * 0.06;
          o.type = 'sine'; o.frequency.value = fr;
          env(g, at, 0.01, gain / (1 + i * 0.6), 2.4);
          o.connect(g).connect(out); o.start(at); o.stop(at + 2.6);
        });
      },
      drone(t, dur, gain = 0.2) {
        [55, 55.4, 82.5].forEach((fr, i) => {
          const o = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain();
          o.type = 'sawtooth'; o.frequency.value = fr;
          lp.type = 'lowpass'; lp.frequency.setValueAtTime(120, t); lp.frequency.exponentialRampToValueAtTime(700, t + dur);
          g.gain.setValueAtTime(gain / (1 + i) * 0.35, t); g.gain.linearRampToValueAtTime(gain / (1 + i), t + dur * 0.9); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.4);
          o.connect(lp).connect(g).connect(out); o.start(t); o.stop(t + dur + 0.5);
        });
      },
    };
  }

  // Banda sonora del tráiler: los tiempos coinciden con los planos del CSS (.tr-beat)
  function trailerScore(k) {
    const ev = [
      [0, () => k.drone(0, 14.8)], [0, () => k.hit(0, 0.35)],
      [2.4, () => k.whoosh(2.4, 0.5, 200, 2600, 0.12)], [2.6, () => k.hit(2.6, 0.5)],
      [6.2, () => k.whoosh(6.2, 0.5, 200, 2600, 0.12)], [6.4, () => k.hit(6.4, 0.5)],
      [11.2, () => k.riser(11.2, 1.0, 0.12)], [12.0, () => k.whoosh(12.0, 0.9, 250, 3600, 0.2)], [12.2, () => k.hit(12.2, 0.55)],
      [13.4, () => k.riser(13.4, 1.4, 0.16)], [14.7, () => k.whoosh(14.7, 1.2, 200, 2800, 0.14)],
      [14.8, () => k.hit(14.8, 0.9)], [14.85, () => k.chime(14.85, 0.14)],
    ];
    for (let n = 0; n < 4; n++) {
      const tt = 8.6 + n * 0.9;
      ev.push([tt - 0.15, () => k.whoosh(tt - 0.15, 0.35, 400, 3000, 0.08)], [tt, () => k.tick(tt)], [tt, () => k.blip(tt, 660 + n * 110, 0.07)]);
    }
    return ev;
  }

  let ctx = null, input = null, scene = null, enabled = false, curEl = null, curStart = 0, onChange = () => {};
  try { enabled = localStorage.getItem(KEY) === 'on'; } catch (e) { /* sin almacenamiento */ }

  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC(); input = chain(ctx);
    return true;
  }

  function newScene() {
    if (scene) {
      const old = scene, now = ctx.currentTime;
      old.gain.cancelScheduledValues(now); old.gain.setValueAtTime(old.gain.value, now); old.gain.linearRampToValueAtTime(0.0001, now + 0.25);
      setTimeout(() => { try { old.disconnect(); } catch (e) { /* ya desconectada */ } }, 600);
    }
    scene = ctx.createGain(); scene.gain.value = 1; scene.connect(input);
    return scene;
  }

  function play(el, elapsed) {
    if (!enabled || !ensure() || !el) return;
    if (el.classList.contains('trailer')) { playTrailer(elapsed); return; }
    const k = kit(ctx, newScene()), t0 = ctx.currentTime + 0.04 - elapsed;
    const at = (t) => t0 + t;
    if (el.classList.contains('act')) {
      k.whoosh(at(0.26), 1.4, 180, 2400, 0.18); k.hit(at(0.3), 0.55);
      if (el.querySelector('.act-char')) k.chime(at(1.6), 0.07);
    } else if (el.classList.contains('hero')) {
      k.whoosh(at(0.2), 0.8, 300, 2800, 0.14);
      [740, 880, 1040].forEach((f, n) => k.blip(at(1.55 + n * 0.3), f, 0.09));
    } else {
      k.whoosh(at(0.02), 0.5, 300, 2400, 0.11);
    }
  }

  window.DeckSound = {
    kit, chain, trailerScore,
    get enabled() { return enabled; },
    onChange(fn) { onChange = fn; fn(enabled); },
    slide(el) {
      curEl = el; curStart = performance.now();
      if (document.body.classList.contains('gate')) return;
      play(el, 0);
    },
    enable(on) {
      if (enabled === on) return;
      enabled = on;
      try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { /* sin almacenamiento */ }
      document.body.classList.toggle('sound-on', on);
      if (on) ensure();
      onChange(on);
    },
    tick() { if (enabled && ensure()) kit(ctx, newScene()).tick(ctx.currentTime + 0.01, 0.07); },
    toggle() {
      enabled = !enabled;
      try { localStorage.setItem(KEY, enabled ? 'on' : 'off'); } catch (e) { /* sin almacenamiento */ }
      document.body.classList.toggle('sound-on', enabled);
      if (enabled && ensure() && curEl) {
        play(curEl, curEl.classList.contains('trailer') ? (performance.now() - curStart) / 1000 : 0);
      } else if (!enabled && scene) {
        const now = ctx.currentTime; scene.gain.cancelScheduledValues(now); scene.gain.linearRampToValueAtTime(0.0001, now + 0.15);
      }
      onChange(enabled);
    },
  };

  function playTrailer(elapsed) {
    if (!ensure()) return;
    const bus = newScene(), t0 = ctx.currentTime + 0.04 - elapsed;
    const shifted = Object.fromEntries(Object.entries(kit(ctx, bus)).map(([n, fn]) => [n, (t, ...a) => fn(t0 + t, ...a)]));
    trailerScore(shifted).forEach(([t, fn]) => { if (t >= elapsed - 0.05) fn(); });
  }
  if (enabled) document.body && document.body.classList.add('sound-on');
  addEventListener('pointerdown', () => { if (enabled) ensure(); }, { once: true });
  addEventListener('keydown', () => { if (enabled) ensure(); }, { once: true });
})();
