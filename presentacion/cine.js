/* Modo película (tecla P): música de fondo que baja cuando alguien habla y viñeta de cine.
   La cámara (zoom al que habla), el foco sobre él y el fogonazo de cada plano son CSS (styles.css).
   La música es audio/musica/rock.mp3 (la genera tools/musica.py); solo suena con el sonido activado. */
(function () {
  var bgm = new Audio('audio/musica/rock.mp3?v=2');
  bgm.loop = true; bgm.preload = 'auto'; bgm.volume = 0;
  var ALTO = 0.2, BAJO = 0.07, raf = 0;
  var body = document.body;

  var activo = function () {
    return body.classList.contains('pelicula') && !body.classList.contains('scroll') && !!(window.DeckSound && window.DeckSound.enabled);
  };
  var objetivo = function () { return !activo() || body.classList.contains('pausado') ? 0 : document.querySelector('.habla') ? BAJO : ALTO; };

  // El volumen persigue al objetivo con suavidad: baja cuando habla alguien y sube entre frases
  function paso() {
    var o = objetivo(), v = bgm.volume + (o - bgm.volume) * 0.07;
    if (Math.abs(o - v) < 0.003) v = o;
    bgm.volume = Math.max(0, Math.min(1, v));
    if (o > 0 && bgm.paused) bgm.play().catch(function () { /* sin gesto del usuario: no suena */ });
    if (o === 0 && v === 0) { bgm.pause(); raf = 0; return; }
    raf = requestAnimationFrame(paso);
  }
  function despertar() { if (!raf) raf = requestAnimationFrame(paso); }

  // Viñeta: oscurece las esquinas, como una lente de cine
  var stage = document.getElementById('stage');
  if (stage) {
    var v = document.createElement('div'); v.id = 'vineta'; v.setAttribute('aria-hidden', 'true'); stage.appendChild(v);
  }

  // Logotipo animado con su «ta-dum», antes de empezar: un golpe grave, otro más bajo y un brillo, sintetizados con WebAudio
  var ident = document.createElement('div'); ident.id = 'ident'; ident.setAttribute('aria-hidden', 'true');
  ident.innerHTML = '<div class="id-mark">BM</div><div class="id-sub">BANDMANAGER ORIGINALS</div>';
  document.body.appendChild(ident);
  var sting = function () {
    try {
      var AC = window.AudioContext || window.webkitAudioContext, c = new AC(), t = c.currentTime + 0.05, out = c.createGain();
      out.gain.value = 0.9; out.connect(c.destination);
      var golpe = function (t0, f0, f1, dur, g) {
        var o = c.createOscillator(), a = c.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + dur * 0.6);
        a.gain.setValueAtTime(0.0001, t0); a.gain.exponentialRampToValueAtTime(g, t0 + 0.012); a.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(a); a.connect(out); o.start(t0); o.stop(t0 + dur + 0.05);
      };
      golpe(t, 110, 44, 1.8, 0.85); golpe(t + 0.5, 82, 38, 2.6, 0.95); golpe(t + 0.5, 164, 82, 1.2, 0.25);
      var ruido = c.createBufferSource(), n = c.createBuffer(1, c.sampleRate * 2.4, c.sampleRate), d = n.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
      ruido.buffer = n; var f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(400, t + 0.5); f.frequency.exponentialRampToValueAtTime(5200, t + 1.9);
      var g = c.createGain(); g.gain.setValueAtTime(0.0001, t + 0.4); g.gain.exponentialRampToValueAtTime(0.18, t + 1.0); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.3);
      ruido.connect(f); f.connect(g); g.connect(out); ruido.start(t + 0.4);
      [523.25, 783.99, 1046.5].forEach(function (fr, k) { var o = c.createOscillator(), a = c.createGain(); o.type = 'triangle'; o.frequency.value = fr;
        a.gain.setValueAtTime(0.0001, t + 1.5 + k * 0.05); a.gain.exponentialRampToValueAtTime(0.06, t + 1.6 + k * 0.05); a.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
        o.connect(a); a.connect(out); o.start(t + 1.5); o.stop(t + 3.3); });
      setTimeout(function () { c.close(); }, 4500);
    } catch (e) { /* sin audio: solo se ve */ }
  };
  window.CineIdent = { play: function (fin, conSonido) {
    ident.classList.add('on'); if (conSonido !== false) sting();
    setTimeout(function () { fin(); ident.classList.remove('on'); }, 3300);
  } };

  // ── Subtítulos estilo Netflix ──
  // Siguen a lo que se oye: salen mientras suena cada frase (con dos a la vez, dos líneas con guion, como en el cine)
  // y dicen lo que dice la voz, escrito bien (el guion hablado escribe algunas marcas como suenan).
  var ESCRITO = [[/Band Mánayer/g, 'BandManager'], [/mánayers/gi, 'mánagers'], [/Mánayer/g, 'Manager'], [/Spótifai/g, 'Spotify'], [/Yutub/g, 'YouTube'],
    [/Taipscript/g, 'TypeScript'], [/Riact/g, 'React'], [/\bVit\b/g, 'Vite'], [/Supabeis/g, 'Supabase'], [/Séntri/g, 'Sentry'], [/\bbild\b/g, 'build'],
    [/Traicaunt/g, 'Tricount'], [/Splitguais/g, 'Splitwise'], [/Scaut/g, 'Scout'], [/Deit Suap/g, 'Date Swap'], [/buquin/g, 'booking'],
    [/ráider/g, 'rider'], [/Resurrécshon/g, 'Resurrection'], [/Big Scul/g, 'Big School'], [/Mure Dev/g, 'MoureDev'], [/Gúgel/g, 'Google'],
    [/Pley Stor/g, 'Play Store'], [/scrol chálench/gi, 'Scroll Challenge'], [/Últimeit Guitar/g, 'Ultimate Guitar'], [/Eslash/g, 'Slash'],
    [/guasap/gi, 'WhatsApp'], [/efe eme/g, 'FM'], [/agents punto eme de/gi, 'AGENTS.md'], [/punto io/g, '.io'], [/[Bb]e tu ci/g, 'B2C'],
    [/[Bb]e tu bi/g, 'B2B'], [/be pe eme/gi, 'BPM'], [/Máster of Prompts/g, 'Master of Prompts'], [/\[pi\]/g, '***'], [/\[[a-z ]+\]\s*/g, '']];
  var escrito = function (t) { ESCRITO.forEach(function (r) { t = t.replace(r[0], r[1]); }); return t.replace(/\s+/g, ' ').trim(); };
  var SUBS_KEY = 'bm_subs', subsOn = false;
  try { subsOn = localStorage.getItem(SUBS_KEY) === 'es'; } catch (e) { /* sin almacenamiento: desactivados */ }
  var sub = document.createElement('div'); sub.id = 'subtitulo'; sub.setAttribute('aria-live', 'polite');
  if (stage) stage.appendChild(sub);
  // Como en Netflix, la frase va en trozos de dos líneas como mucho, y cada trozo sale cuando toca según el audio
  var trozos = function (t, max) {
    var partes = t.match(/[^.!?…;:]+[.!?…;:]*["»”]?\s*/g) || [t], out = [], acc = '';
    partes.forEach(function (p) {
      if ((acc + p).length <= max || !acc) acc += p; else { out.push(acc.trim()); acc = p; }
      while (acc.length > max * 1.15) { var c = acc.lastIndexOf(', ', max); if (c < max * 0.4) c = acc.lastIndexOf(' ', max); out.push(acc.slice(0, c + 1).trim()); acc = acc.slice(c + 1); }
    });
    if (acc.trim()) out.push(acc.trim());
    return out;
  };
  var pintarSubs = function () {
    var hablan = Array.prototype.slice.call(document.querySelectorAll('.slide.active [data-who].habla')).slice(-2);
    if (!hablan.length) { if (sub.childNodes.length) sub.textContent = ''; return; }
    var html = hablan.map(function (el) {
      var nom = window.REPARTO && window.REPARTO[el.dataset.who];
      var frase = escrito(el.dataset.say || ''); if (!frase) return '';
      var ts = el._trozos && el._fr === frase ? el._trozos : (el._fr = frase, el._trozos = trozos(frase, hablan.length > 1 ? 52 : 84));
      // el trozo que toca: reparte la duración del audio según lo largo que es cada trozo
      var total = ts.join('').length, pasado = el._dur ? (performance.now() - el._t0) / el._dur * total : 0, k = 0, suma = 0;
      for (; k < ts.length - 1; k++) { suma += ts[k].length; if (pasado < suma) break; }
      var p = document.createElement('p');
      if (hablan.length > 1) p.appendChild(document.createTextNode('- '));
      if (nom) { var b = document.createElement('b'); b.style.color = nom.color; b.textContent = nom.nombre.toUpperCase() + ': '; p.appendChild(b); }
      p.appendChild(document.createTextNode(ts[k]));
      return p.outerHTML;
    }).join('');
    if (sub.innerHTML !== html) sub.innerHTML = html;
  };
  setInterval(function () { if (subsOn && body.classList.contains('pelicula')) pintarSubs(); }, 150);
  addEventListener('voz', function () { if (subsOn) pintarSubs(); }); // sin esperar al siguiente tic: el nombre sale con la primera palabra
  var raf2 = 0;
  new MutationObserver(function () { if (!raf2) raf2 = requestAnimationFrame(function () { raf2 = 0; pintarSubs(); }); })
    .observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
  var ponerSubs = function (on) {
    subsOn = on; body.classList.toggle('subs', on);
    try { localStorage.setItem(SUBS_KEY, on ? 'es' : 'off'); } catch (e) { /* da igual */ }
    pintarMenu();
  };

  // ── Reproductor estilo Netflix (en modo película) ──
  // Barra abajo que aparece al mover el ratón: play/pausa, escena anterior/siguiente, sonido, título,
  // progreso con los capítulos, subtítulos (como «Audio y subtítulos») y pantalla completa.
  var ico = {
    play: '<svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z"/></svg>',
    pausa: '<svg viewBox="0 0 24 24"><path d="M6 4h4.5v16H6zM13.5 4H18v16h-4.5z"/></svg>',
    atras: '<svg viewBox="0 0 24 24"><path d="M6 5h2.5v14H6zM20 5v14L9.5 12z"/></svg>',
    alante: '<svg viewBox="0 0 24 24"><path d="M15.5 5H18v14h-2.5zM4 5v14l10.5-7z"/></svg>',
    sonido: '<svg viewBox="0 0 24 24"><path d="M3 9h4l5-4.5v15L7 15H3zM15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M3 9h4l5-4.5v15L7 15H3z"/></svg>',
    mudo: '<svg viewBox="0 0 24 24"><path d="M3 9h4l5-4.5v15L7 15H3z"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    subs: '<svg viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 13h5M13 13h5M6 16h8M16 16h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    fs: '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'
  };
  var nf = document.createElement('div'); nf.id = 'nf'; nf.setAttribute('aria-label', 'Controles de la película');
  nf.innerHTML = '<div class="nf-top"><span class="nf-n">B</span><span class="nf-serie">Os Herdeiros do Código</span><span class="nf-cap"></span></div>' +
    '<div class="nf-bar"><div class="nf-prog" role="slider" aria-label="Escena" tabindex="0"><div class="nf-lleno"></div><div class="nf-bola"></div><div class="nf-caps"></div><div class="nf-tip"></div></div><span class="nf-cuenta"></span></div>' +
    '<div class="nf-ctrl"><button class="nf-b" data-nf="play" aria-label="Pausa"></button><button class="nf-b" data-nf="atras" aria-label="Escena anterior">' + ico.atras + '</button>' +
    '<button class="nf-b" data-nf="alante" aria-label="Escena siguiente">' + ico.alante + '</button><button class="nf-b" data-nf="sonido" aria-label="Sonido"></button>' +
    '<span class="nf-titulo"></span><button class="nf-b" data-nf="subs" aria-label="Audio y subtítulos" aria-haspopup="true">' + ico.subs + '</button>' +
    '<button class="nf-b" data-nf="fs" aria-label="Pantalla completa">' + ico.fs + '</button></div>' +
    '<div class="nf-menu" role="menu"><div><h4>Audio</h4><p class="on">Español (original)</p></div><div><h4>Subtítulos</h4>' +
    '<p role="menuitemradio" data-s="off">Desactivados</p><p role="menuitemradio" data-s="es">Español</p></div></div>' +
    '<div class="nf-pausa" aria-hidden="true"><small>Estás viendo</small><b>BandManager.io</b><span class="nf-pcap"></span><em>Os Herdeiros do Código</em></div>';
  if (stage) stage.appendChild(nf);
  var $n = function (q) { return nf.querySelector(q); };
  var D = function () { return window.Deck; };
  var capitulos = function () {
    var d = D(); if (!d) return [];
    return d.slides.map(function (s, i) { return { i: i, t: s.dataset.title || '', act: s.classList.contains('act') }; });
  };
  var pintarMenu = function () {
    nf.querySelectorAll('.nf-menu [data-s]').forEach(function (p) { p.classList.toggle('on', (p.dataset.s === 'es') === subsOn); p.setAttribute('aria-checked', String((p.dataset.s === 'es') === subsOn)); });
    $n('[data-nf="subs"]').classList.toggle('activo', subsOn);
  };
  var pintar = function () {
    var d = D(); if (!d) return;
    var caps = capitulos(), cap = caps.filter(function (c) { return c.act && c.i <= d.cur; }).pop();
    var pct = d.N > 1 ? d.cur / (d.N - 1) * 100 : 0;
    $n('.nf-lleno').style.width = pct + '%'; $n('.nf-bola').style.left = pct + '%';
    $n('.nf-cuenta').textContent = (d.cur + 1) + ' / ' + d.N;
    $n('.nf-titulo').innerHTML = '<b>BandManager.io</b> ' + (cap ? cap.t.replace(/·.*/, '').trim() : 'Prólogo') + ' <span>' + (caps[d.cur] ? caps[d.cur].t : '') + '</span>';
    $n('.nf-cap').textContent = cap ? cap.t : '';
    $n('.nf-pcap').textContent = (cap ? cap.t + ' · ' : '') + (caps[d.cur] ? caps[d.cur].t : '');
    $n('[data-nf="play"]').innerHTML = d.pausado ? ico.play : ico.pausa;
    $n('[data-nf="play"]').setAttribute('aria-label', d.pausado ? 'Reproducir' : 'Pausa');
    var son = !!(window.DeckSound && window.DeckSound.enabled);
    $n('[data-nf="sonido"]').innerHTML = son ? ico.sonido : ico.mudo;
    if (!$n('.nf-caps').childNodes.length) {
      caps.forEach(function (c) { if (c.act && c.i) { var t = document.createElement('i'); t.style.left = (c.i / (d.N - 1) * 100) + '%'; $n('.nf-caps').appendChild(t); } });
    }
  };
  var acciones = {
    play: function () { var d = D(); if (d) d.pausar(!d.pausado); },
    atras: function () { var d = D(); if (d) d.show(Math.max(0, d.cur - 1)); },
    alante: function () { var d = D(); if (d) d.show(Math.min(d.N - 1, d.cur + 1)); },
    sonido: function () { if (window.DeckSound) window.DeckSound.toggle(); setTimeout(pintar, 50); },
    subs: function () { nf.classList.toggle('menu'); },
    fs: function () { var r = document.documentElement; (document.fullscreenElement ? document.exitFullscreen() : r.requestFullscreen && r.requestFullscreen()); }
  };
  nf.addEventListener('click', function (e) {
    var b = e.target.closest('[data-nf]'), s = e.target.closest('[data-s]');
    if (s) { ponerSubs(s.dataset.s === 'es'); nf.classList.remove('menu'); return; }
    if (b) { e.stopPropagation(); acciones[b.dataset.nf](); pintar(); despierta(); }
  });
  var prog = $n('.nf-prog');
  var escenaEn = function (e) { var r = prog.getBoundingClientRect(), d = D(); return Math.round(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * (d.N - 1)); };
  prog.addEventListener('click', function (e) { var d = D(); if (d) d.show(escenaEn(e)); });
  prog.addEventListener('mousemove', function (e) {
    var d = D(); if (!d) return; var i = escenaEn(e), tip = $n('.nf-tip');
    tip.textContent = (i + 1) + ' · ' + (d.slides[i].dataset.title || ''); tip.style.left = (i / (d.N - 1) * 100) + '%';
  });
  // Se esconde a los 2,5 s sin mover el ratón, como en Netflix (en pausa se queda)
  var oculto = 0;
  var despierta = function () { nf.classList.add('ver'); body.classList.add('nf-ver'); clearTimeout(oculto); oculto = setTimeout(function () { if (!nf.classList.contains('menu') && !(D() && D().pausado)) { nf.classList.remove('ver'); body.classList.remove('nf-ver'); } }, 2500); };
  addEventListener('mousemove', function () { if (body.classList.contains('pelicula')) despierta(); });
  // Reloj de cuenta atrás (Nolan): el sábado el Resurrección Fest cierra el cartel a las 14:00 y cada plano marca la hora
  var reloj = document.createElement('div'); reloj.id = 'reloj'; reloj.setAttribute('aria-hidden', 'true');
  reloj.innerHTML = '<small>CIERRE DEL CARTEL · RESURRECCIÓN FEST</small><span></span>';
  if (stage) stage.appendChild(reloj);
  var relojT0 = 0, relojRest = 0;
  var pintarReloj = function () {
    if (!relojT0) return;
    var seg = Math.max(0, relojRest - Math.floor((Date.now() - relojT0) / 1000));
    var h = Math.floor(seg / 3600), m = Math.floor(seg / 60) % 60, s2 = seg % 60;
    reloj.querySelector('span').textContent = '-' + ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2) + ':' + ('0' + s2).slice(-2);
    reloj.classList.toggle('fin', seg === 0);
  };
  var ajustarReloj = function () {
    var sl = document.querySelector('.slide.active'), tag = sl && sl.querySelector('.tag');
    var mt = tag && /S[áa]bado[^0-9]{1,5}(\d{1,2}):(\d{2})/.exec(tag.textContent);
    var txt = (tag ? tag.textContent : '') + ' ' + (sl ? sl.dataset.title || '' : '');
    var fuera = /Seis meses|Domingo|Otro jueves|Fin de la historia|Prólogo|Gracias|Créditos|Escena post/.test(txt) && !mt;
    if (mt && /Seis meses/.test(tag.textContent)) fuera = true;
    if (fuera || (!mt && !relojT0)) { reloj.classList.remove('on', 'fin'); relojT0 = 0; return; }
    if (!mt) return; // plano sin hora (capítulos, negocio…): el reloj sigue corriendo
    relojRest = Math.max(0, (14 * 60 - (+mt[1] * 60 + +mt[2])) * 60); relojT0 = Date.now(); reloj.classList.add('on'); pintarReloj();
  };
  setInterval(pintarReloj, 1000);
  addEventListener('hashchange', function () { setTimeout(ajustarReloj, 40); });

  // La cámara recorre la captura (de arriba abajo) durante lo que dura la escena, para que se vea entera
  var camara = function () {
    var sl = document.querySelector('.slide.active');
    if (!sl || !window.DeckVoces) return;
    var d = Math.max(8, window.DeckVoces.duracion(sl) + 1);
    sl.style.setProperty('--pan', d.toFixed(1) + 's');
  };
  addEventListener('hashchange', function () { setTimeout(camara, 30); });
  addEventListener('voz', camara);
  addEventListener('hashchange', pintar);
  addEventListener('deckpausa', function () { pintar(); despierta(); });
  addEventListener('voz', pintar);
  // Teclas de Netflix en modo película: espacio o K pausa; C, subtítulos (la tecla de siempre)
  addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA/.test(e.target.tagName) || body.classList.contains('gate')) return;
    if ((e.key === 'c' || e.key === 'C')) { ponerSubs(!subsOn); despierta(); return; }
    if (!body.classList.contains('pelicula') || body.classList.contains('scroll')) return;
    if (e.key === ' ' || e.key === 'k' || e.key === 'K') { e.preventDefault(); e.stopImmediatePropagation(); acciones.play(); pintar(); despierta(); }
  }, true);
  ponerSubs(subsOn);
  setTimeout(pintar, 0); addEventListener('load', pintar);

  new MutationObserver(despertar).observe(body, { attributes: true, attributeFilter: ['class'] });
  addEventListener('voz', despertar);
  document.addEventListener('visibilitychange', function () { if (document.hidden) bgm.pause(); else despertar(); });
})();
