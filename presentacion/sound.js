/* Sonido de la presentación. Todo se sintetiza con WebAudio: no hay archivos de audio.
   Apagado por defecto (el navegador exige un gesto). Tecla M o botón «Sonido». */
(function () {
  const KEY = 'deck_sound';

  // Reverb de sala generada: ruido con caída exponencial estéreo. Da profundidad sin cargar nada.
  function impulse(c, secs = 2.4, decay = 3.2) {
    const len = Math.floor(c.sampleRate * secs), buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  // Curva suave de saturación: el «golpe» gana cuerpo sin distorsionar a lo bruto
  function saturator(c, amount = 2.2) {
    const ws = c.createWaveShaper(), n = 1024, curve = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; curve[i] = Math.tanh(amount * x) / Math.tanh(amount); }
    ws.curve = curve; ws.oversample = '2x';
    return ws;
  }

  function chain(c) {
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.2;
    const master = c.createGain(); master.gain.value = 0.85;
    const dry = c.createGain(); dry.gain.value = 0.82;
    const verb = c.createConvolver(); verb.buffer = impulse(c);
    const wet = c.createGain(); wet.gain.value = 0.28;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 9000;
    const bus = c.createGain(); bus.gain.value = 1;
    bus.connect(dry).connect(comp);
    bus.connect(verb).connect(wet).connect(lp).connect(comp);
    comp.connect(master).connect(c.destination);
    return bus;
  }

  function noiseBuffer(c) {
    const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = (w * 0.6 + last * 2.2) * 0.8; } // ruido rosa aproximado
    return b;
  }

  function kit(c, out) {
    const nb = noiseBuffer(c);
    const noise = (t, dur) => { const s = c.createBufferSource(); s.buffer = nb; s.loop = true; s.start(t); s.stop(t + dur); return s; };
    const env = (g, t, a, peak, d) => {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    };
    const sat = saturator(c);
    sat.connect(out);

    return {
      // Barrido de aire: ruido filtrado que sube y se abre. Transiciones de slide.
      whoosh(t, dur = 0.7, f0 = 260, f1 = 4200, gain = 0.14) {
        const s = noise(t, dur + 0.15), bp = c.createBiquadFilter(), hp = c.createBiquadFilter(), g = c.createGain();
        bp.type = 'bandpass'; bp.Q.setValueAtTime(0.9, t); bp.Q.linearRampToValueAtTime(3.5, t + dur);
        bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.85);
        hp.type = 'highpass'; hp.frequency.value = 120;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain * 4, t + dur * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        s.connect(hp).connect(bp).connect(g).connect(out);
      },
      // Golpe de cine: sub con caída de tono, transitorio de click y cuerpo saturado.
      hit(t, gain = 0.6) {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(34, t + 0.6);
        env(g, t, 0.006, gain, 1.1);
        o.connect(g).connect(sat); o.start(t); o.stop(t + 1.25);
        const o2 = c.createOscillator(), g2 = c.createGain();
        o2.type = 'triangle'; o2.frequency.setValueAtTime(220, t); o2.frequency.exponentialRampToValueAtTime(70, t + 0.12);
        env(g2, t, 0.002, gain * 0.35, 0.16);
        o2.connect(g2).connect(out); o2.start(t); o2.stop(t + 0.3);
        const s = noise(t, 0.12), f = c.createBiquadFilter(), g3 = c.createGain();
        f.type = 'bandpass'; f.frequency.value = 3000; f.Q.value = 0.7;
        env(g3, t, 0.001, gain * 0.45, 0.08);
        s.connect(f).connect(g3).connect(out);
      },
      // Pulso de interfaz: dos parciales con caída suave, para botones y pines.
      blip(t, freq = 880, gain = 0.1) {
        [[1, 1], [2.01, 0.28]].forEach(([m, a]) => {
          const o = c.createOscillator(), g = c.createGain();
          o.type = 'sine'; o.frequency.setValueAtTime(freq * m, t); o.frequency.exponentialRampToValueAtTime(freq * m * 1.04, t + 0.05);
          env(g, t, 0.004, gain * a * 2.2, 0.22);
          o.connect(g).connect(out); o.start(t); o.stop(t + 0.35);
        });
      },
      // Tic mecánico de cambio de paso: click de alta frecuencia con cuerpo corto.
      tick(t, gain = 0.09) {
        const s = noise(t, 0.04), f = c.createBiquadFilter(), g = c.createGain();
        f.type = 'bandpass'; f.frequency.value = 4200; f.Q.value = 1.6;
        env(g, t, 0.001, gain * 5, 0.035);
        s.connect(f).connect(g).connect(out);
        const o = c.createOscillator(), g2 = c.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(1600, t); o.frequency.exponentialRampToValueAtTime(900, t + 0.03);
        env(g2, t, 0.001, gain * 0.4, 0.03);
        o.connect(g2).connect(out); o.start(t); o.stop(t + 0.08);
      },
      // Subida de tensión: sierra desafinada que sube de tono + ruido que se abre.
      riser(t, dur, gain = 0.14) {
        const s = noise(t, dur + 0.1), hp = c.createBiquadFilter(), g = c.createGain();
        hp.type = 'highpass'; hp.frequency.setValueAtTime(300, t); hp.frequency.exponentialRampToValueAtTime(5200, t + dur);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + dur); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.08);
        s.connect(hp).connect(g).connect(out);
        [-7, 0, 7].forEach((det) => {
          const o = c.createOscillator(), lp = c.createBiquadFilter(), g2 = c.createGain();
          o.type = 'sawtooth'; o.detune.value = det;
          o.frequency.setValueAtTime(96, t); o.frequency.exponentialRampToValueAtTime(760, t + dur);
          lp.type = 'lowpass'; lp.frequency.setValueAtTime(260, t); lp.frequency.exponentialRampToValueAtTime(5200, t + dur); lp.Q.value = 3;
          g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(gain * 0.22, t + dur); g2.gain.linearRampToValueAtTime(0.0001, t + dur + 0.08);
          o.connect(lp).connect(g2).connect(out); o.start(t); o.stop(t + dur + 0.12);
        });
      },
      // Campana: parciales inarmónicos (como una campana de metal), caída larga.
      chime(t, gain = 0.12) {
        const base = 523.25;
        [[1, 1, 2.6], [2.76, 0.5, 1.9], [5.4, 0.22, 1.2], [8.93, 0.12, 0.8]].forEach(([m, a, d]) => {
          const o = c.createOscillator(), g = c.createGain();
          o.type = 'sine'; o.frequency.value = base * m;
          env(g, t, 0.004, gain * a, d);
          o.connect(g).connect(out); o.start(t); o.stop(t + d + 0.2);
        });
      },
      // Colchón grave: tres sierras afinadas con filtro que se abre lentamente.
      drone(t, dur, gain = 0.2) {
        [55, 55.35, 82.4].forEach((fr, i) => {
          const o = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain();
          o.type = 'sawtooth'; o.frequency.value = fr;
          lp.type = 'lowpass'; lp.frequency.setValueAtTime(130, t); lp.frequency.exponentialRampToValueAtTime(900, t + dur); lp.Q.value = 1.2;
          g.gain.setValueAtTime(gain / (1 + i) * 0.35, t); g.gain.linearRampToValueAtTime(gain / (1 + i), t + dur * 0.9); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.4);
          o.connect(lp).connect(g).connect(out); o.start(t); o.stop(t + dur + 0.5);
        });
      },
    };
  }

  // Banda sonora del tráiler: los tiempos coinciden con los planos del CSS (.tr-beat y eventos)
  function trailerScore(k) {
    const ev = [
      [0, () => k.drone(0, 14.8)], [0, () => k.hit(0, 0.35)],
      [2.4, () => k.whoosh(2.4, 0.6, 200, 3200, 0.13)], [2.6, () => k.hit(2.6, 0.5)],
      [6.2, () => k.whoosh(6.2, 0.6, 200, 3200, 0.13)], [6.4, () => k.hit(6.4, 0.5)],
      [11.2, () => k.riser(11.2, 1.0, 0.12)], [12.0, () => k.whoosh(12.0, 0.9, 250, 4200, 0.2)], [12.2, () => k.hit(12.2, 0.55)],
      [13.4, () => k.riser(13.4, 1.4, 0.16)], [14.7, () => k.whoosh(14.7, 1.2, 200, 3400, 0.14)],
      [14.8, () => k.hit(14.8, 0.9)], [14.85, () => k.chime(14.85, 0.16)],
    ];
    for (let n = 0; n < 4; n++) {
      const tt = 8.6 + n * 0.9;
      ev.push([tt - 0.15, () => k.whoosh(tt - 0.15, 0.4, 400, 3400, 0.08)], [tt, () => k.tick(tt)], [tt, () => k.blip(tt, 660 + n * 110, 0.07)]);
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

  function playTrailer(elapsed) {
    if (!ensure()) return;
    const bus = newScene(), t0 = ctx.currentTime + 0.04 - elapsed;
    const k = kit(ctx, bus);
    const shifted = Object.fromEntries(Object.entries(k).map(([n, fn]) => [n, (t, ...a) => fn(t0 + t, ...a)]));
    trailerScore(shifted).forEach(([t, fn]) => { if (t >= elapsed - 0.05) fn(); });
  }

  function play(el, elapsed) {
    if (!enabled || !ensure() || !el) return;
    if (el.classList.contains('trailer')) { playTrailer(elapsed); return; }
    const k = kit(ctx, newScene()), t0 = ctx.currentTime + 0.04;
    const at = (t) => t0 + t;
    if (el.classList.contains('act')) {
      k.whoosh(at(0.02), 1.6, 160, 3000, 0.18); k.hit(at(0.3), 0.6);
      if (el.querySelector('.act-char')) k.chime(at(1.5), 0.08);
    } else if (el.classList.contains('hero')) {
      k.whoosh(at(0.02), 0.8, 300, 3400, 0.13);
      [740, 880, 1040].forEach((f, n) => k.blip(at(1.55 + n * 0.3), f, 0.09));
    } else {
      k.whoosh(at(0.02), 0.5, 320, 2800, 0.1);
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

  if (enabled) document.body && document.body.classList.add('sound-on');
  addEventListener('pointerdown', () => { if (enabled) ensure(); }, { once: true });
  addEventListener('keydown', () => { if (enabled) ensure(); }, { once: true });
})();
