/* Repetición del ensayo general (ensayo.mjs): monta la página como estaba en el instante T de la película.
   Sin los scripts del deck: el estado sale de las notas (cambios del DOM, inicio de cada animación CSS y posición
   de cada vídeo), así que cada fotograma es siempre el mismo, vaya la máquina como vaya.
   Uso: await Replay.listo; await Replay.ir(segundos) */
(function () {
  'use strict';
  let N = null, foto = null, i = 0, ultimo = -1, porId = new Map(), animas = new Map(), medios = new Map();

  const indexar = (raiz) => {
    if (raiz.nodeType !== 1) return;
    if (raiz.dataset.rid) porId.set(raiz.dataset.rid, raiz);
    for (const el of raiz.querySelectorAll('[data-rid]')) porId.set(el.dataset.rid, el);
  };
  // los .mp4 del deck se ven aquí en .webm (el Chromium del render no reproduce H.264)
  const webm = (raiz) => {
    for (const el of raiz.querySelectorAll('video source[src], video[src]')) {
      const s = el.getAttribute('src');
      if (/\.mp4$/.test(s)) el.setAttribute('src', 'webm/' + s.split('/').pop().replace(/\.mp4$/, '.webm'));
    }
    for (const v of raiz.querySelectorAll('video')) { v.removeAttribute('autoplay'); v.muted = true; v.preload = 'auto'; }
    for (const im of raiz.querySelectorAll('img[loading]')) im.removeAttribute('loading'); // sin carga perezosa: cada fotograma, completo
  };
  const montar = async () => {
    const doc = new DOMParser().parseFromString(foto, 'text/html');
    doc.querySelectorAll('script, noscript').forEach((s) => s.remove()); // DOMParser no ejecuta JS: el <noscript> se aplicaría
    webm(doc);
    // las fuentes, servidas aquí (el Chromium del render no llega a Google Fonts y así no dependen de la red)
    doc.querySelectorAll('link[href*="fonts.googleapis"]').forEach((l) => l.setAttribute('href', 'fuentes/fuentes.css'));
    doc.querySelectorAll('link[rel=preconnect]').forEach((l) => l.remove());
    const nuevo = document.importNode(doc.documentElement, true);
    document.replaceChild(nuevo, document.documentElement);
    porId = new Map(); indexar(document.documentElement);
    i = 0; ultimo = -1;
    await Promise.all([...document.querySelectorAll('link[rel=stylesheet]')].map((l) => (l.sheet ? 1 : new Promise((r) => { l.onload = l.onerror = r; }))));
    await document.fonts.ready;
  };
  const html = (s) => { const t = document.createElement('template'); t.innerHTML = s; webm(t.content); return t.content; };
  const aplicar = (o) => {
    const el = porId.get(o.id || o.p);
    if (o.k === 'a') { if (!el) return; if (o.v === null) el.removeAttribute(o.n); else el.setAttribute(o.n, o.v); }
    else if (o.k === 'rm') { if (el) { el.remove(); } }
    else if (o.k === 'h') { if (!el) return; el.innerHTML = ''; el.appendChild(html(o.html)); indexar(el); }
    else if (o.k === 'add') {
      if (!el) return;
      const f = html(o.html), nodo = f.firstElementChild, tras = o.tras && porId.get(o.tras);
      if (tras && tras.parentNode === el) tras.after(f); else el.prepend(f);
      if (nodo) indexar(nodo);
    }
  };
  const esperar = (v, ev, ms) => new Promise((r) => { const t = setTimeout(r, ms); v.addEventListener(ev, () => { clearTimeout(t); r(); }, { once: true }); });

  async function ir(seg) {
    const t = N.t0 + seg * 1000; // reloj de la página
    if (t < ultimo) await montar();
    while (i < N.ops.length && N.ops[i].t <= t) aplicar(N.ops[i++]);
    ultimo = t;
    // cada animación CSS, en su punto: desde su inicio anotado (o desde el principio, si ya estaba en marcha)
    for (const a of document.getAnimations()) {
      const ef = a.effect, el = ef && ef.target;
      a.pause();
      if (!el || !el.dataset) continue;
      const lista = animas.get(el.dataset.rid + '|' + (ef.pseudoElement || '') + '|' + (a.animationName || a.transitionProperty || a.id || ''));
      let s = N.t0;
      if (lista) for (const x of lista) { if (x <= t) s = x; else break; }
      try { a.currentTime = Math.max(0, t - s); } catch (e) { /* animación ya terminada */ }
    }
    // cada vídeo, en su fotograma
    const vids = [...document.querySelectorAll('.slide.active video, video:not(.slide video)')];
    await Promise.all(vids.map(async (v) => {
      v.pause();
      const notas = medios.get(v.dataset.rid);
      let pos = 0;
      if (notas) {
        let n = null; for (const x of notas) { if (x.t <= t) n = x; else break; }
        if (n) pos = n.ct + (n.p ? 0 : ((t - n.t) / 1000) * n.r);
      }
      if (v.readyState < 1) await esperar(v, 'loadedmetadata', 4000);
      if (v.loop && v.duration) pos %= v.duration; else if (v.duration) pos = Math.min(pos, v.duration - 0.04);
      if (Math.abs(v.currentTime - pos) > 0.002) { v.currentTime = pos; await esperar(v, 'seeked', 4000); }
      if (v.readyState < 2) await esperar(v, 'loadeddata', 4000);
    }));
    // y las imágenes de la escena, cargadas
    await Promise.all([...document.querySelectorAll('.slide.active img, .slide.active ~ * img')].map((im) => (im.complete ? 1 : esperar(im, 'load', 4000))));
  }

  window.Replay = {
    ir,
    listo: (async () => {
      [N, foto] = await Promise.all([fetch('ensayo/notas.json').then((r) => r.json()), fetch('ensayo/foto.html').then((r) => r.text())]);
      // inicio de cada animación en el reloj de la página (startTime va en el reloj de las animaciones)
      for (const a of N.anims) {
        const k = a.id + '|' + a.ps + '|' + a.n;
        if (!animas.has(k)) animas.set(k, []);
        animas.get(k).push(a.s + N.reloj);
      }
      for (const l of animas.values()) l.sort((x, y) => x - y);
      for (const m of N.media) { if (!medios.has(m.id)) medios.set(m.id, []); medios.get(m.id).push(m); }
      await montar();
      return (N.fin - N.t0) / 1000;
    })(),
  };
})();
