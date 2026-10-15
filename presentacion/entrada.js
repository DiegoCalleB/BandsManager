/* Pieza suelta de la pantalla de entrada tipo Netflix: sonido sintetizado, cursor de mentira y recorrido por las filas.
   Sale de deck.js para no pasar de 600 líneas. Lo usa deck.js (window.NxAudio) y la grabación (NxCursor, NxExplora). */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const gate = $('#gate');
  if (!gate) return;
  const scr = $('.nx-scroll');
  window.NxAudio = (() => {
    let c = null;
    const ctx = () => { try { if (!c) c = new (window.AudioContext || window.webkitAudioContext)(); return c; } catch (e) { return null; } };
    const nota = (f, t0, dur, g, tipo) => {
      const a = ctx(); if (!a) return;
      const o = a.createOscillator(), v = a.createGain(); o.type = tipo || 'sine'; o.frequency.value = f;
      v.gain.setValueAtTime(0.0001, a.currentTime + t0); v.gain.exponentialRampToValueAtTime(g, a.currentTime + t0 + 0.02); v.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + t0 + dur);
      o.connect(v); v.connect(a.destination); o.start(a.currentTime + t0); o.stop(a.currentTime + t0 + dur + 0.05);
    };
    return {
      tuc: () => { nota(392, 0, 0.18, 0.18, 'triangle'); nota(587, 0.09, 0.3, 0.16, 'triangle'); },
      apaga: () => {},
    };
  })();
  // Cursor de mentira que va hasta «Reproducir» y lo pulsa: la grabación lo usa para que se vea el clic (window.NxCursor)
  window.NxCursor = (btn) => new Promise((res) => {
    const r = btn.getBoundingClientRect(), cur = document.createElement('div');
    cur.className = 'nx-cursor'; cur.style.left = (innerWidth * 0.72) + 'px'; cur.style.top = (innerHeight * 0.9) + 'px'; gate.appendChild(cur);
    requestAnimationFrame(() => { cur.style.transition = 'left 1s cubic-bezier(.3,.7,.2,1), top 1s cubic-bezier(.3,.7,.2,1)'; cur.style.left = (r.left + r.width * 0.55) + 'px'; cur.style.top = (r.top + r.height * 0.6) + 'px'; });
    setTimeout(() => { btn.classList.add('pulsado'); cur.classList.add('clic'); setTimeout(() => { res(); }, 260); }, 1150);
  });

  const nxEspera = (ms) => new Promise((r) => setTimeout(r, ms));
  window.NxExplora = async () => {
    if (!scr) return;
    scr.scrollTo({ top: Math.min(scr.scrollHeight - scr.clientHeight, innerHeight * 0.64), behavior: 'smooth' });
    await nxEspera(1400);
    const c = $$('.nx-top-c .nx-card')[1];
    if (c) { c.classList.add('hover'); await nxEspera(1200); c.classList.remove('hover'); }
    scr.scrollTo({ top: 0, behavior: 'smooth' }); await nxEspera(1000);
  };
})();
