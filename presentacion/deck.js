/* Motor de la presentación: escala 1920x1080 al viewport, navegación por teclado/táctil/hash,
   índice (G), pantalla completa (F), tema claro/oscuro (T), lightbox de capturas y modo scroll (móvil / S). */
(async () => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;

  // Tema: el del sistema, salvo que se haya elegido uno antes
  let saved = null;
  try { saved = localStorage.getItem('deck_theme'); } catch (_) { /* sin almacenamiento */ }
  const setTheme = (t) => {
    root.dataset.theme = t;
    try { localStorage.setItem('deck_theme', t); } catch (_) { /* sin almacenamiento */ }
  };
  setTheme(saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  const toggleTheme = () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');

  // Diapositiva de vídeo opcional: solo existe si hay video/demo.mp4 o un data-embed (YouTube/Vimeo)
  const vs = $('.slide[data-optional="video"]');
  if (vs) {
    const host = $('#videoHost', vs);
    let ok = false;
    if (vs.dataset.embed) {
      const f = document.createElement('iframe');
      f.src = vs.dataset.embed; f.allowFullscreen = true; f.title = 'Vídeo de demostración';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      f.style.cssText = 'width:100%;height:100%;border:0;border-radius:24px';
      host.appendChild(f); ok = true;
    } else {
      try {
        const r = await fetch(vs.dataset.src, { method: 'HEAD' });
        if (r.ok && /video/.test(r.headers.get('content-type') || '')) {
          const v = document.createElement('video');
          v.src = vs.dataset.src; v.controls = true; v.preload = 'metadata';
          v.style.cssText = 'width:100%;height:100%;border-radius:24px;background:#000';
          host.appendChild(v); ok = true;
        }
      } catch (_) { /* sin vídeo */ }
    }
    if (!ok) vs.remove();
  }

  const stage = $('#stage');
  const slides = $$('.slide'), N = slides.length;
  let cur = 0;

  const mobile = () => matchMedia('(max-width: 900px), (max-aspect-ratio: 1/1)').matches;
  const isScroll = () => document.body.classList.contains('scroll');
  const setScroll = (on) => { document.body.classList.toggle('scroll', on); fit(); };

  function fit() {
    if (isScroll()) return;
    stage.style.transform = `scale(${Math.min(innerWidth / 1920, innerHeight / 1080)})`;
  }

  function show(i, push = true) {
    cur = Math.max(0, Math.min(N - 1, i));
    slides.forEach((s, n) => s.classList.toggle('active', n === cur));
    $('#count').textContent = `${cur + 1} / ${N}`;
    $('#title').textContent = slides[cur].dataset.title || '';
    $('#prog').style.width = `${((cur + 1) / N) * 100}%`;
    if (push) history.replaceState(null, '', '#' + (cur + 1));
    $$('#grid button').forEach((b, n) => b.classList.toggle('cur', n === cur));
    countUp(slides[cur]);
  }
  const next = () => show(cur + 1), prev = () => show(cur - 1);

  function countUp(slide) {
    $$('[data-count]', slide).forEach((el) => {
      if (el.dataset.done) return;
      el.dataset.done = '1';
      const to = +el.dataset.count, t0 = performance.now(), dur = 1100;
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(to * e).toLocaleString('es-ES') + (el.dataset.suffix || '');
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  // Índice
  const grid = $('#grid .g');
  slides.forEach((s, n) => {
    const b = document.createElement('button');
    const num = document.createElement('b'), ttl = document.createElement('span');
    num.textContent = String(n + 1).padStart(2, '0');
    ttl.textContent = s.dataset.title || '';
    b.append(num, ttl);
    b.onclick = () => { $('#grid').classList.remove('on'); show(n); };
    grid.appendChild(b);
  });
  const toggleGrid = () => $('#grid').classList.toggle('on');

  // Lightbox
  const lb = $('#lb'), lbImg = $('img', lb);
  $$('.shot').forEach((box) => box.addEventListener('click', () => {
    const img = $$('img', box).find((i) => i.offsetParent !== null) || $('img', box);
    lbImg.src = img.currentSrc || img.src; lb.classList.add('on');
  }));
  lb.onclick = () => lb.classList.remove('on');

  const fs = () => (document.fullscreenElement ? document.exitFullscreen() : root.requestFullscreen?.());

  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Escape') {
      if (lb.classList.contains('on')) return lb.classList.remove('on');
      if ($('#grid').classList.contains('on')) return toggleGrid();
      return;
    }
    switch (e.key) {
      case 'ArrowRight': case 'PageDown': case ' ': case 'Enter': e.preventDefault(); next(); break;
      case 'ArrowLeft': case 'PageUp': case 'Backspace': e.preventDefault(); prev(); break;
      case 'Home': show(0); break;
      case 'End': show(N - 1); break;
      case 'f': case 'F': fs(); break;
      case 'g': case 'G': toggleGrid(); break;
      case 't': case 'T': toggleTheme(); break;
      case 's': case 'S': setScroll(!isScroll()); break;
    }
  });
  $('#edgeL').onclick = prev; $('#edgeR').onclick = next;
  $('#bPrev').onclick = prev; $('#bNext').onclick = next;
  $('#bGrid').onclick = toggleGrid; $('#bFs').onclick = fs; $('#bTheme').onclick = toggleTheme;
  $('#bScroll').onclick = () => setScroll(true);

  let tx = 0, ty = 0;
  addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  addEventListener('touchend', (e) => {
    if (isScroll()) return;
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? next : prev)();
  }, { passive: true });

  // La barra inferior solo aparece al mover el ratón o tocar
  let idleT;
  const wake = () => { document.body.classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(() => document.body.classList.add('idle'), 2600); };
  ['mousemove', 'touchstart', 'keydown'].forEach((ev) => addEventListener(ev, wake, { passive: true }));
  wake();

  addEventListener('resize', fit);
  addEventListener('hashchange', () => { const n = parseInt(location.hash.slice(1), 10); if (n) show(n - 1, false); });

  if (mobile() || location.search.includes('scroll')) document.body.classList.add('scroll');
  fit();
  show((parseInt(location.hash.slice(1), 10) || 1) - 1, false);
  setTimeout(() => { const h = $('#hint'); if (h) h.style.opacity = 0; }, 5000);
  document.fonts?.ready.then(fit);
})();
