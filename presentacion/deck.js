/* Motor de la presentación: escala 1920x1080 al viewport, transiciones entre diapositivas,
   animaciones de construcción (auto o por clics, como PowerPoint), navegación por teclado/táctil/hash,
   índice (G), pantalla completa (F), tema claro/oscuro (T), lightbox de capturas y modo scroll (móvil / S). */
(async () => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) { /* sin almacenamiento */ } },
  };

  // Tema: oscuro por defecto, salvo que se haya elegido uno antes (tecla T)
  const setTheme = (t) => { root.dataset.theme = t; store.set('deck_theme_v2', t); };
  setTheme(store.get('deck_theme_v2') || 'dark');
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

  const mobile = () => matchMedia('(max-width: 700px)').matches;
  // Con «reducir movimiento» en el sistema no se apaga la animación: solo se queda en fundidos suaves
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.classList.add('calm');
  const isScroll = () => document.body.classList.contains('scroll');
  const setScroll = (on) => { document.body.classList.toggle('scroll', on); fit(); };

  function fit() {
    if (isScroll()) return;
    stage.style.transform = `scale(${Math.min(innerWidth / 1920, innerHeight / 1080)})`;
  }

  /* ───────── Preparación de las animaciones ─────────
     Los titulares se parten en palabras con máscara. Cada bloque recibe data-a (tipo) y --i (orden).
     En el modo clics, los bloques se agrupan en pasos: titular y etiqueta entran solos y cada bloque
     (o cada viñeta de una lista) es un clic. */
  const PIECES = [
    ['.brand', 'rise'], ['.tag', 'left'],
    ['.lead, .sub, .foot, .slide > p, .copy > p, .pic > p', 'rise'],
    ['li', 'left'],
    ['.card, .step, .stat, .five > div, .arch .col, .grid > div', 'zoom'],
    ['tbody tr', 'rise'], ['pre.code', 'rise'], ['.shot', 'wipe'],
  ];
  const selAll = PIECES.map((p) => p[0]).join(',');

  function splitWords(el, counter) {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((tok) => {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'), i = document.createElement('i');
            w.className = 'w'; i.textContent = tok; i.style.setProperty('--k', counter.n++);
            w.appendChild(i); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
  }

  const plan = slides.map((s) => {
    const head = [];
    $$('h1, h2', s).forEach((h) => { splitWords(h, { n: 0 }); head.push(...$$('.w > i', h)); });
    const items = [];
    $$(selAll, s).forEach((el) => {
      if (items.some((it) => it.el.contains(el))) return; // un bloque ya animado contiene a este
      let kind = PIECES.find((p) => el.matches(p[0]))[1];
      if (kind === 'wipe' && el.closest('.art, .phones')) kind = 'up';
      items.push({ el, kind });
    });
    // Pasos del modo clics: el bloque raíz (hijo directo de la diapositiva o de .copy/.pic/.row) o cada <li>
    const steps = [];
    const keyOf = (el) => {
      if (el.matches('li')) return el;
      let n = el;
      while (n.parentElement && !n.parentElement.matches('.slide, .copy, .pic, .row')) n = n.parentElement;
      return n;
    };
    const tagItems = items.filter((it) => !it.el.matches('.tag, .brand'));
    tagItems.forEach((it) => {
      const k = keyOf(it.el);
      const last = steps[steps.length - 1];
      if (last && last.key === k) last.list.push(it); else steps.push({ key: k, list: [it] });
    });
    items.forEach((it, n) => {
      it.el.dataset.a = it.kind;
      it.el.style.setProperty('--i', Math.min(n, 14));
    });
    return { head, items, steps: steps.map((st) => st.list), shown: 0, timer: 0 };
  });

  // Modo de animación: auto (cascada al entrar) o clics (paso a paso, como PowerPoint)
  let animMode = store.get('deck_anim') === 'clics' ? 'clics' : 'auto';
  const clicksOn = () => animMode === 'clics' && !isScroll();

  function paintHud() {
    const bar = $('#bAnim');
    if (bar) { bar.textContent = clicksOn() || animMode === 'clics' ? 'Por clics' : 'Automática'; bar.setAttribute('aria-pressed', String(animMode === 'clics')); }
    const st = $('#steps'), p = plan[cur];
    if (st) st.textContent = animMode === 'clics' && p.steps.length ? `${p.shown}/${p.steps.length}` : '';
  }

  const setIn = (list, on, base) => list.forEach((it) => {
    const el = it.el || it;
    el.style.setProperty('--b', base);
    el.classList.toggle('in', on);
  });

  function reveal(i, how) {
    const p = plan[i], s = slides[i];
    clearTimeout(p.timer);
    s.classList.toggle('instant', how === 'instant');
    p.head.forEach((w) => { w.style.setProperty('--b', how === 'instant' ? '0ms' : '140ms'); w.classList.add('in'); });
    const tagsAndBrand = p.items.filter((it) => it.el.matches('.tag, .brand'));
    setIn(tagsAndBrand, true, how === 'instant' ? '0ms' : '60ms');
    if (how === 'instant') { setIn(p.items, true, '0ms'); p.shown = p.steps.length; }
    else if (clicksOn()) { p.items.filter((it) => !tagsAndBrand.includes(it)).forEach((it) => it.el.classList.remove('in')); p.shown = 0; }
    else {
      // Con voces, los mensajes del chat no entran en cascada: aparecen cuando su personaje empieza a hablar
      const voces = window.DeckVoces && window.DeckVoces.enabled() && !isScroll();
      setIn(p.items.filter((it) => !tagsAndBrand.includes(it) && !(voces && it.el.matches('.dlg li'))), true, '380ms');
      p.shown = p.steps.length;
      const conVoz = voces && s.querySelector('[data-who][data-say]');
      if (conVoz) window.DeckVoces.play(s, (el) => { if (el.matches('.dlg li')) { el.style.setProperty('--n', 0); el.style.setProperty('--b', '0ms'); el.classList.add('in'); } }, null, () => seguirPelicula(900));
      else if (i === cur) seguirPelicula(durPelicula(s) + (s.querySelectorAll('.dlg li').length * 820));
    }
    if (how !== 'instant' && clicksOn() && window.DeckVoces && window.DeckVoces.enabled()) window.DeckVoces.play(s, null, (el) => !el.matches('.dlg li'));
    // Chat: en automático cada mensaje entra tras el anterior; por clics, cada clic es un mensaje
    $$('.dlg li', s).forEach((li, k) => li.style.setProperty('--n', how === 'instant' || clicksOn() ? 0 : k));
    paintHud();
  }

  function reset(i) {
    const p = plan[i];
    clearTimeout(p.timer);
    p.timer = setTimeout(() => {
      if (slides[i].classList.contains('active') || isScroll()) return;
      p.head.forEach((w) => w.classList.remove('in'));
      p.items.forEach((it) => it.el.classList.remove('in'));
      slides[i].classList.remove('instant');
      p.shown = 0;
    }, 900);
  }

  function stepForward() {
    const p = plan[cur];
    if (!clicksOn() || p.shown >= p.steps.length) return false;
    setIn(p.steps[p.shown], true, '0ms');
    p.steps[p.shown].forEach((it, k) => it.el.style.setProperty('--i', k));
    p.shown += 1; paintHud();
    if (window.DeckSound) window.DeckSound.tick();
    const habla = p.steps[p.shown - 1].map((it) => it.el).find((el) => el.matches('[data-say]'));
    if (habla && window.DeckVoces && window.DeckVoces.enabled()) window.DeckVoces.uno(habla);
    return true;
  }
  function stepBack() {
    const p = plan[cur];
    if (!clicksOn() || p.shown <= 0) return false;
    p.shown -= 1;
    p.steps[p.shown].forEach((it) => it.el.classList.remove('in'));
    paintHud();
    return true;
  }

  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.addEventListener('mousemove', (e) => {
      const dv = document.querySelector('.slide.hero.active .device');
      if (!dv) return;
      dv.style.setProperty('--ry', ((e.clientX / innerWidth - 0.5) * 6).toFixed(2) + 'deg');
      dv.style.setProperty('--rx', ((0.5 - e.clientY / innerHeight) * 4).toFixed(2) + 'deg');
    });
  }

  let delayedVideoTimer = 0;
  // Modo película (P): cada diapositiva pasa sola; con voces, cuando terminan de hablar
  let pelicula = false, pelTimer = 0;
  const durPelicula = (s) => +(s.dataset.dur || (s.classList.contains('trailer') ? 14500 : s.classList.contains('reveal') ? 11000 : 7000));
  const seguirPelicula = (ms) => { clearTimeout(pelTimer); if (pelicula && cur < N - 1) pelTimer = setTimeout(() => show(cur + 1), ms); };
  let soundStarted = false;

  function show(i, push = true, how = 'play') {
    document.querySelectorAll('video').forEach((v) => v.pause());
    if (window.DeckVoces) window.DeckVoces.stop();
    clearTimeout(pelTimer);
    const prev = cur;
    cur = Math.max(0, Math.min(N - 1, i));
    slides.forEach((s, n) => {
      s.classList.toggle('active', n === cur);
      s.classList.toggle('before', n < cur);
      s.classList.toggle('after', n > cur);
    });
    if (prev !== cur) reset(prev);
    reveal(cur, how);
    $('#count').textContent = `${cur + 1} / ${N}`;
    $('#aL').disabled = cur === 0; $('#aR').disabled = cur === N - 1;
    $('#title').textContent = slides[cur].dataset.title || '';
    $('#prog').style.width = `${((cur + 1) / N) * 100}%`;
    if (push) history.replaceState(null, '', '#' + (cur + 1));
    $$('#grid button').forEach((b, n) => b.classList.toggle('cur', n === cur));
    countUp(slides[cur]);
    if (window.DeckSound && !isScroll() && (prev !== cur || !soundStarted)) { soundStarted = true; window.DeckSound.slide(slides[cur]); }
    clearTimeout(delayedVideoTimer);
    slides[cur].querySelectorAll('video[data-delay]').forEach((v) => {
      v.pause(); v.currentTime = 0;
      delayedVideoTimer = setTimeout(() => { if (v.offsetParent) v.play().catch(() => {}); }, Number(v.dataset.delay));
    });
    slides[cur].querySelectorAll('video[data-ambient]').forEach((v) => {
      if (v.dataset.restart !== undefined) v.currentTime = 0;
      if (v.offsetParent) v.play().catch(() => {});
    });
  }

  // Pantalla de entrada: da el gesto que el navegador exige para el sonido y arranca el tráiler a la vez
  const gate = $('#gate');
  if (gate) {
    const startsAtBeginning = !location.hash || location.hash === '#1';
    if (startsAtBeginning && !isScroll()) {
      document.body.classList.add('gate');
      const go = (withSound) => {
        document.body.classList.remove('gate');
        gate.classList.add('out');
        setTimeout(() => gate.remove(), 700);
        if (window.DeckSound) window.DeckSound.enable(withSound);
        soundStarted = false;
        show(cur, false);
      };
      $('#gateSound').onclick = () => go(true);
      $('#gateSilent').onclick = () => go(false);
      $('#gateSound').focus({ preventScroll: true });
    } else gate.remove();
  }

  const next = () => { if (!stepForward()) show(cur + 1); };
  const prev = () => { if (!stepBack()) show(cur - 1, true, clicksOn() ? 'instant' : 'play'); };

  function countUp(slide) {
    $$('[data-count]', slide).forEach((el) => {
      if (el.dataset.done) return;
      el.dataset.done = '1';
      const to = +el.dataset.count, t0 = performance.now() + 500, dur = 1100;
      const tick = (t) => {
        const p = Math.max(0, Math.min(1, (t - t0) / dur)), e = 1 - Math.pow(1 - p, 3);
        const dec = +(el.dataset.dec || 0), v = to * e;
        el.textContent = (dec ? v.toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : Math.round(v).toLocaleString('es-ES')) + (el.dataset.suffix || '');
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  function toggleAnim() {
    animMode = animMode === 'clics' ? 'auto' : 'clics';
    store.set('deck_anim', animMode);
    show(cur, false);
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

  const fs = () => (document.fullscreenElement ? document.exitFullscreen() : root.requestFullscreen?.())?.catch?.(() => {});

  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.body.classList.contains('gate')) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); $('#gateSound').click(); }
      return;
    }
    if (e.target.tagName === 'VIDEO' && (e.key === ' ' || e.key === 'Enter')) return;
    if (e.key === 'Escape') {
      if (lb.classList.contains('on')) return lb.classList.remove('on');
      if ($('#grid').classList.contains('on')) return toggleGrid();
      return;
    }
    switch (e.key) {
      case 'ArrowRight': case 'PageDown': case ' ': case 'Enter': e.preventDefault(); next(); break;
      case 'ArrowLeft': case 'PageUp': case 'Backspace': e.preventDefault(); prev(); break;
      case 'ArrowDown': e.preventDefault(); show(cur + 1); break;
      case 'ArrowUp': e.preventDefault(); show(cur - 1); break;
      case 'Home': show(0); break;
      case 'End': show(N - 1); break;
      case 'f': case 'F': fs(); break;
      case 'g': case 'G': toggleGrid(); break;
      case 't': case 'T': toggleTheme(); break;
      case 'm': case 'M': window.DeckSound && window.DeckSound.toggle(); break;
      case 'p': case 'P': pelicula = !pelicula; document.body.classList.toggle('pelicula', pelicula); if ($('#bPeli')) $('#bPeli').setAttribute('aria-pressed', String(pelicula)); if ($('#bPeli')) $('#bPeli').textContent = pelicula ? 'Película: sí' : 'Película'; if (pelicula) show(cur, false); else clearTimeout(pelTimer); break;
      case 'v': case 'V': if (window.DeckVoces) { window.DeckVoces.toggle(); show(cur, false, 'instant'); } break;
      case 'a': case 'A': toggleAnim(); break;
      case 's': case 'S': setScroll(!isScroll()); show(cur, false); break;
    }
  });
  $('#edgeL').onclick = prev; $('#edgeR').onclick = next;
  $('#bPrev').onclick = prev; $('#bNext').onclick = next; $('#aL').onclick = prev; $('#aR').onclick = next;
  $('#bGrid').onclick = toggleGrid; $('#bFs').onclick = fs; $('#bTheme').onclick = toggleTheme;
  $('#bAnim').onclick = toggleAnim;
  $('#bSound').onclick = () => window.DeckSound && window.DeckSound.toggle();
  if (window.DeckSound) window.DeckSound.onChange((on) => { const b = $('#bSound'); b.textContent = on ? 'Sonido: sí' : 'Sonido'; b.setAttribute('aria-pressed', String(on)); if (!on && window.DeckVoces) window.DeckVoces.stop(); });
  const pintaVoces = () => { const b = $('#bVoces'); if (b && window.DeckVoces) { b.textContent = window.DeckVoces.pref ? 'Voces: sí' : 'Voces: no'; b.setAttribute('aria-pressed', String(window.DeckVoces.pref)); } };
  if (window.DeckVoces) { window.DeckVoces.onChange(pintaVoces); pintaVoces(); }
  if ($('#bPeli')) $('#bPeli').onclick = () => dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }));
  if ($('#bVoces')) $('#bVoces').onclick = () => { if (window.DeckVoces) { window.DeckVoces.toggle(); show(cur, false, 'instant'); } };
  $('#bScroll').onclick = () => { setScroll(true); show(cur, false); };

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

  // Modo scroll (móvil): cada diapositiva se construye al entrar en pantalla
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting || !isScroll()) return;
      const i = slides.indexOf(e.target);
      if (!plan[i].seen) { plan[i].seen = true; reveal(i, 'play'); }
    }), { threshold: 0.18 });
    slides.forEach((s) => io.observe(s));
  }

  if (mobile() || location.search.includes('scroll')) document.body.classList.add('scroll');
  fit();
  show((parseInt(location.hash.slice(1), 10) || 1) - 1, false);
  setTimeout(() => { const h = $('#hint'); if (h) h.style.opacity = 0; }, 5000);
  document.fonts?.ready.then(fit);
})();
