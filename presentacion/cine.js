/* Modo película (tecla P): música de fondo que baja cuando alguien habla y viñeta de cine.
   La cámara (zoom al que habla), el foco sobre él y el fogonazo de cada plano son CSS (styles.css).
   La música son cuatro piezas por escenas (audio/musica/*.mp3, las genera tools/musica.py); solo suena con el sonido activado. */
(function () {
  // ── Banda sonora por escenas ──
  // Cada diapositiva lleva data-musica (tension · tema · noches · lostrego · «-» silencio); al cambiar de pieza se funden.
  // Va por WebAudio: así baja de volumen cuando alguien habla (ducking) y la grabación del MP4 la recoge tal cual.
  // Los BPM coinciden con tools/musica.py: el montaje usa el pulso para que el golpe de cada rampa caiga a tiempo.
  var MUSICA = { tension: 92.5, tema: 185, noches: 72, lostrego: 200, compila: 210, cabalga: 218 };
  // Canciones de verdad (no bucles): «Compila nu bravu» (Os Herdeiros do Código) y «Cabalga o lóstrego» (Master of Prompts).
  // Son la banda sonora de los capítulos (sus versiones sintéticas, «tema» y «lostrego», llevan mucha gaita y quedan solo para algún
  // momento suelto). Arrancan desde el segundo indicado cada vez que se entra en su bloque de escenas.
  var CANCION = { compila: 0, cabalga: 0, giro: 0 }; // giro: segundo desde el que empieza (cámbialo al punto que quieras)
  var ALTO = 0.24, BAJO = 0.09, CANCION_X = 1.8, /* las canciones (con voz y mezcla densa) se perdían bajo el diálogo: suenan más fuertes que las piezas de fondo */ raf = 0, body = document.body, volGlobal = 1;
  var ac = null, master = null, pistas = {}, actual = '';
  var crearAudio = function () {
    if (ac) return true;
    try { var AC = window.AudioContext || window.webkitAudioContext; ac = new AC(); master = ac.createGain(); master.gain.value = 0; if (window.CineMezcla) window.CineMezcla.cadena(ac, master); else master.connect(ac.destination); return true; } catch { ac = null; return false; }
  };
  ['pointerdown', 'keydown'].forEach(function (ev) { addEventListener(ev, function () {
    crearAudio(); if (ac && ac.state === 'suspended') ac.resume();
    // las cuatro piezas se «tocan» dentro del gesto (en silencio): Safari no deja empezar a sonar un audio fuera de un clic
    if (!pistas.__listas) { pistas.__listas = true; Object.keys(MUSICA).forEach(function (n) { var p = pista(n), pr = p.a.play(); if (pr && pr.then) pr.then(function () { if (!p.v) p.a.pause(); }).catch(function () { /* nada */ }); }); }
    if (window.DeckVoces && window.DeckVoces.desbloquear) window.DeckVoces.desbloquear();
  }, true); });
  var pista = function (n) {
    if (pistas[n]) return pistas[n];
    var a = new Audio('audio/musica/' + n + '.mp3?v=3'); a.loop = true; // las canciones también: si un bloque de escenas dura más que la canción, vuelve a empezar a.preload = 'auto'; a.dataset.tap = '1';
    var p = { a: a, g: null, v: 0 };
    if (crearAudio()) { try { var src = ac.createMediaElementSource(a); p.g = ac.createGain(); p.g.gain.value = 0; src.connect(p.g); p.g.connect(master); } catch { p.g = null; } }
    pistas[n] = p; return p;
  };
  var activo = function () {
    return body.classList.contains('pelicula') && !body.classList.contains('scroll') && !!(window.DeckSound && window.DeckSound.enabled);
  };
  // «dramatica»: pieza opcional (audio/musica/dramatica.mp3) para los momentos más emotivos. No va en el repositorio (derechos):
  // quien la tenga la deja ahí y suena; si no está, esas escenas usan «noches».
  var hayDramatica = false, hayGiro = false;
  // «giro»: la canción del momento «el bajista soy yo» (audio/musica/giro.mp3). Tampoco va en el repositorio (derechos): quien la tenga la
  // deja ahí y suena solo en esa escena; si no está, esa escena usa «dramatica» y, si tampoco, «noches».
  try { fetch('audio/musica/dramatica.mp3', { method: 'HEAD' }).then(function (r) { if (r.ok) { MUSICA.dramatica = 46; hayDramatica = true; } }).catch(function () { /* sin ella */ }); } catch { /* sin fetch */ }
  try { fetch('audio/musica/giro.mp3', { method: 'HEAD' }).then(function (r) { if (r.ok) { MUSICA.giro = 100; hayGiro = true; } }).catch(function () { /* sin ella */ }); } catch { /* sin fetch */ }
  var quiere = function () {
    var sl = document.querySelector('.slide.active'), q = sl ? (sl.dataset.musica || '') : '';
    if (q === 'giro' && !hayGiro) q = 'dramatica';
    return q === 'dramatica' && !hayDramatica ? 'noches' : q;
  };
  var objetivo = function () { return !activo() || body.classList.contains('pausado') || body.classList.contains('fin-peli') ? 0 : document.querySelector('.habla, .habla-l') ? BAJO : ALTO; };
  var vol = 0;
  // Volumen general (ducking) y fundido entre piezas (~1,6 s)
  function paso() {
    var o = objetivo(); vol += (o - vol) * (window.CineMezcla ? window.CineMezcla.coef(o, vol) : 0.07); if (Math.abs(o - vol) < 0.003) vol = o;
    var q = activo() ? quiere() : '', antes = actual;
    if (q && q !== '-' && MUSICA[q]) actual = q; else if (q === '-') actual = '';
    if (actual && actual !== antes && actual in CANCION) { try { pista(actual).a.currentTime = CANCION[actual]; } catch { /* aún sin cargar */ } }
    var vivo = false;
    Object.keys(MUSICA).forEach(function (n) {
      var p = pistas[n]; if (!p && n !== actual) return; p = pista(n);
      var meta = n === actual && o > 0 ? 1 : 0;
      p.v += (meta - p.v) * 0.035; if (Math.abs(meta - p.v) < 0.004) p.v = meta;
      if (p.g) p.g.gain.value = p.v * (n in CANCION ? CANCION_X : 1.4); else p.a.volume = Math.max(0, Math.min(1, p.v * vol * volGlobal));
      if (p.v > 0 && p.a.paused && !p.a.ended) p.a.play().catch(function () { /* sin gesto: no suena */ });
      if (p.v === 0 && !p.a.paused) p.a.pause();
      if (p.v > 0) vivo = true;
    });
    if (master) master.gain.value = vol * volGlobal;
    if (window.CineMezcla) window.CineMezcla.dip(vol, ALTO, BAJO);
    if (!vivo && o === 0 && vol === 0) { raf = 0; return; }
    raf = requestAnimationFrame(paso);
  }
  function despertar() { if (!raf) raf = requestAnimationFrame(paso); }
  // Cuántos ms faltan para el siguiente pulso de la pieza que suena (como mínimo «min»): las rampas cortan a tiempo
  window.CineMusica = {
    alPulso: function (min) {
      var p = actual && pistas[actual]; if (!p || p.a.paused || !p.v) return min;
      var bpm = MUSICA[actual]; if (bpm > 150) bpm /= 2; // en las rápidas, el pulso de medio tiempo
      var b = 60 / bpm, t = p.a.currentTime + min / 1000, falta = (b - (t % b)) % b;
      return Math.round(min + falta * 1000);
    },
  };

  // Viñeta: oscurece las esquinas, como una lente de cine
  var stage = document.getElementById('stage');
  if (stage) {
    var v = document.createElement('div'); v.id = 'vineta'; v.setAttribute('aria-hidden', 'true'); stage.appendChild(v);
    // Etalonaje único (sombras frías, luces cálidas) y grano de película, igual en todos los planos
    var gr = document.createElement('div'); gr.id = 'etalon'; gr.setAttribute('aria-hidden', 'true'); stage.appendChild(gr);
    var gn = document.createElement('div'); gn.id = 'grano'; gn.setAttribute('aria-hidden', 'true'); stage.appendChild(gn);
  }

  // Logotipo animado con su «ta-dum», antes de empezar: un golpe grave, otro más bajo y un brillo, sintetizados con WebAudio
  var ident = document.createElement('div'); ident.id = 'ident'; ident.setAttribute('aria-hidden', 'true');
  ident.innerHTML = '<div class="id-mark">N</div><div class="id-sub">UNA PELÍCULA ORIGINAL</div>';
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
      // «Tu-dum»: dos golpes graves seguidos (el segundo, más hondo y largo), con ataque seco y una cola que se abre
      var ataque = function (t0, g) {
        var b = c.createBufferSource(), nb = c.createBuffer(1, c.sampleRate * 0.12, c.sampleRate), dd = nb.getChannelData(0);
        for (var j = 0; j < dd.length; j++) dd[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / dd.length, 3);
        b.buffer = nb; var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
        var ga = c.createGain(); ga.gain.value = g; b.connect(lp); lp.connect(ga); ga.connect(out); b.start(t0);
      };
      golpe(t, 98, 49, 1.1, 0.8); golpe(t, 196, 98, 0.5, 0.3); ataque(t, 0.5);
      golpe(t + 0.36, 73, 36, 2.8, 1.0); golpe(t + 0.36, 146, 73, 1.4, 0.35); golpe(t + 0.36, 293, 146, 0.8, 0.12); ataque(t + 0.36, 0.7);
      var ruido = c.createBufferSource(), n = c.createBuffer(1, c.sampleRate * 2.6, c.sampleRate), d = n.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
      ruido.buffer = n; var f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(500, t + 0.4); f.frequency.exponentialRampToValueAtTime(2400, t + 2.2);
      var g = c.createGain(); g.gain.setValueAtTime(0.0001, t + 0.4); g.gain.exponentialRampToValueAtTime(0.14, t + 1.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.7);
      ruido.connect(f); f.connect(g); g.connect(out); ruido.start(t + 0.4);
      setTimeout(function () { c.close(); }, 4500);
    } catch { /* sin audio: solo se ve */ }
  };
  window.CineIdent = { play: function (fin, conSonido) {
    ident.classList.add('on'); if (conSonido !== false) sting();
    setTimeout(function () { fin(); ident.classList.remove('on'); }, 3300);
  } };

  // ── Subtítulos estilo Netflix ──
  // Siguen a lo que se oye: salen mientras suena cada frase (con dos a la vez, dos líneas con guion, como en el cine)
  // y dicen lo que dice la voz, escrito bien (el guion hablado escribe algunas marcas como suenan).
  var ESCRITO = [[/Band Mánayer/g, 'BandManager'], [/mánayers/gi, 'mánagers'], [/Mánayer/g, 'Mánager'], [/\bmánayer\b/g, 'mánager'], [/Spótifai/g, 'Spotify'], [/Yutub/g, 'YouTube'],
    [/Taipscript/g, 'TypeScript'], [/Riact/g, 'React'], [/\bVit\b/g, 'Vite'], [/Supabeis/g, 'Supabase'], [/Séntri/g, 'Sentry'], [/\bbild\b/g, 'build'],
    [/Traicaunt/g, 'Tricount'], [/Splitguais/g, 'Splitwise'], [/Scaut/g, 'Scout'], [/Deit Suap/g, 'Date Swap'], [/buquin/g, 'booking'],
    [/ráider/g, 'rider'], [/Resurrécshon/g, 'Resurrection'], [/Big Scul/g, 'Big School'], [/Mure Dev/g, 'MoureDev'], [/Gúgel/g, 'Google'],
    [/Pley Stor/g, 'Play Store'], [/scrol chálench/gi, 'Scroll Challenge'], [/Últimeit Guitar/g, 'Ultimate Guitar'], [/Eslash/g, 'Slash'],
    [/guasap/gi, 'WhatsApp'], [/efe eme/g, 'FM'], [/agents punto eme de/gi, 'AGENTS.md'], [/punto io/g, '.io'], [/[Bb]e tu ci/g, 'B2C'],
    [/[Bb]e tu bi/g, 'B2B'], [/be pe eme/gi, 'BPM'], [/Máster of Prompts/g, 'Master of Prompts'], [/\bpdf\b/g, 'PDF'], [/el cú-erre/g, 'el QR'], [/\bRolin\b/g, 'Rolling'],
    [/jevi metal/g, 'heavy metal'], [/\brifs\b/g, 'riffs'], [/\brif\b/g, 'riff'], [/Moisés/g, 'Moises'], [/Ché/g, 'Che'], [/Metálica/g, 'Metallica'], [/Áci Dici/g, 'AC/DC'], [/ÁironMéiden/g, 'Iron Maiden'], [/Jáiguei tu Diplói/g, 'Highway to Deploy'],
    [/Máster of Pul Ricuests/g, 'Master of Pull Requests'], [/Fíar of de Dédlain/g, 'Fear of the Deadline'], [/Sáicosóket/g, 'Psychosocket'], [/Frík on a Bránch/g, 'Freak on a Branch'],
    [/Slípnot/g, 'Slipknot'], [/\bCorn\b/g, 'Korn'], [/sétlist/g, 'setlist'], [/ \.io\b/g, '.io'], [/\[pi\]/g, '***'], [/\[[a-z ]+\]\s*/g, '']];
  var escrito = function (t) { ESCRITO.forEach(function (r) { t = t.replace(r[0], r[1]); }); return t.replace(/\s+/g, ' ').trim(); };
  // Subtítulos: español por defecto (en una película el diálogo va subtitulado, sin burbujas); también en inglés o desactivados.
  // La preferencia solo se guarda cuando el espectador la cambia (bm_subs2), así el valor por defecto manda mientras no toque nada.
  var SUBS_KEY = 'bm_subs2', subsLang = 'es', subsOn = true;
  try { var guardado = localStorage.getItem(SUBS_KEY); if (guardado === 'es' || guardado === 'en' || guardado === 'gl' || guardado === 'off') { subsLang = guardado; subsOn = guardado !== 'off'; } } catch { /* sin almacenamiento: español */ }
  var traduccion = function (mapa, t) { var m = window[mapa]; return (m && m[t.replace(/\[[^\]]*\]\s*/g, '').trim()]) || ''; };
  var enIngles = function (t) { return traduccion('SUBS_EN', t); }, enGalego = function (t) { return traduccion('SUBS_GL', t); };
  // Plano y contraplano: en las escenas de la app, cuando pregunta un músico se corta a la banda mirando el portátil de Iago
  // (un solo clip, encuadrado en quien habla); cuando contesta Iago, vuelve la pantalla. El corte lo hace el CSS según quién habla.
  var rx = document.createElement('div'); rx.id = 'reaccion'; rx.setAttribute('aria-hidden', 'true');
  var rv = document.createElement('video'); rv.muted = true; rv.loop = true; rv.playsInline = true; rv.preload = 'auto'; rv.setAttribute('muted', ''); rv.setAttribute('playsinline', '');
  rv.poster = 'video/actores/local.jpg'; rv.src = 'video/actores/local.mp4'; rx.appendChild(rv);
  // Contraplano con la cara de quien pregunta: su primer plano (video/actores/<x>-cu.mp4). El plano de grupo queda de reserva.
  var CARAS = { bateria: 'brais-cu', voz: 'alan-cu', guitarra: 'alvaro-cu' }, vids = [rv];
  Object.keys(CARAS).forEach(function (w) {
    var v = document.createElement('video'); v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.dataset.who = w;
    v.poster = 'video/actores/' + CARAS[w] + '.jpg'; v.src = 'video/actores/' + CARAS[w] + '.mp4'; rx.appendChild(v); vids.push(v);
  });
  // El cantante de Master of Prompts no tiene vídeo: su foto hace de contraplano cuando habla
  var mop = document.createElement('img'); mop.className = 'rx-mop'; mop.dataset.who = 'voz_mop'; mop.alt = ''; mop.src = 'img/personaje-cantante.jpg'; rx.appendChild(mop);
  rx.classList.add('con-caras');
  if (stage) stage.appendChild(rx);
  var vivaReaccion = function () {
    var peli = body.classList.contains('pelicula');
    vids.forEach(function (v) {
      if (peli && v.paused) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () { /* sin autoplay: se queda en el póster */ }); } else if (!peli && !v.paused) v.pause();
    });
    // Entrevistas: el plano de quien habla se queda puesto hasta que habla otro (sin volver al primero en las pausas)
    var hab = document.querySelector('.slide.entrevista.active .ent.habla, .slide.entrevista.active .ent.habla-l');
    if (hab && !hab.classList.contains('on')) {
      hab.parentNode.querySelectorAll('.ent.on').forEach(function (f) { f.classList.remove('on'); });
      hab.classList.add('on');
    }
    document.querySelectorAll('.slide.entrevista:not(.active) .ent.on, .slide.entrevista:not(.active) .ent.ins').forEach(function (f) { f.classList.remove('on', 'ins'); });
  };
  // Insertos de la app en las entrevistas: a mitad de la frase se corta a la pantalla de BandManager de la que se habla
  // (data-a/data-b: fracción de la duración de la voz) y, si queda remate, se vuelve a la cara para decirlo.
  // Escenas en dos pasos (clase con-paso): la línea «paso» cambia de plano (p. ej. de la curva en pantalla a las hojas impresas)
  addEventListener('voz', function () { var e = document.querySelector('.slide.active.con-paso li.paso.habla'); if (e) e.closest('.slide').classList.add('paso2'); });
  addEventListener('hashchange', function () { document.querySelectorAll('.slide.paso2:not(.active)').forEach(function (s) { s.classList.remove('paso2'); }); });
  var insT = [];
  addEventListener('voz', function () {
    var f = document.querySelector('.slide.entrevista.active .ent.habla'); if (!f) return;
    insT.forEach(clearTimeout); insT = [];
    document.querySelectorAll('.ent.ins').forEach(function (x) { x.classList.remove('ins'); });
    var ins = f.querySelector('.ent-ins'), d = f._dur || 0; if (!ins || !d) return;
    insT.push(setTimeout(function () { if (f.closest('.slide.active')) f.classList.add('ins'); }, d * +ins.dataset.a));
    if (+ins.dataset.b < 0.97) insT.push(setTimeout(function () { f.classList.remove('ins'); }, d * +ins.dataset.b + 300));
  });
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
    var hablan = Array.prototype.slice.call(document.querySelectorAll('.slide [data-who].habla, .slide [data-who].habla-l')).slice(-2);
    if (!hablan.length) { if (sub.childNodes.length) sub.textContent = ''; return; }
    var html = hablan.map(function (el) {
      var nom = window.REPARTO && window.REPARTO[el.dataset.who];
      var frase = (subsLang === 'en' && enIngles(el.dataset.say || '')) || (subsLang === 'gl' && enGalego(el.dataset.say || '')) || escrito(el.dataset.say || ''); if (!frase) return '';
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
  new MutationObserver(function () { if (!raf2) raf2 = requestAnimationFrame(function () { raf2 = 0; pintarSubs(); vivaReaccion(); }); })
    .observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
  var ponerSubs = function (lang, guardar) {
    subsLang = lang; subsOn = lang !== 'off'; body.classList.toggle('subs', subsOn);
    if (guardar) { try { localStorage.setItem(SUBS_KEY, lang); } catch { /* da igual */ } }
    pintarMenu();
  };

  // ── Reproductor estilo Netflix (en modo película) ──
  // Barra abajo que aparece al mover el ratón: tiempo real de la película (transcurrido y restante) con los capítulos,
  // play/pausa, −15 s / +15 s, volumen, siguiente escena, capítulos, audio y subtítulos, velocidad y pantalla completa.
  // Además, como en Netflix: «Saltar intro» y «Saltar créditos», el icono que salta en el centro y las teclas de siempre.
  var ico = {
    play: '<svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z"/></svg>',
    pausa: '<svg viewBox="0 0 24 24"><path d="M6 4h4.5v16H6zM13.5 4H18v16h-4.5z"/></svg>',
    menos: '<svg viewBox="0 0 24 24"><path d="M12 4.5a7.5 7.5 0 1 1-7.3 9.3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 1.5v6l-4-3z"/><text x="12" y="16.2" font-size="7.4" font-weight="700" text-anchor="middle" font-family="Arial">15</text></svg>',
    mas: '<svg viewBox="0 0 24 24"><path d="M12 4.5a7.5 7.5 0 1 0 7.3 9.3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 1.5v6l4-3z"/><text x="12" y="16.2" font-size="7.4" font-weight="700" text-anchor="middle" font-family="Arial">15</text></svg>',
    sonido: '<svg viewBox="0 0 24 24"><path d="M3 9h4l5-4.5v15L7 15H3z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    mudo: '<svg viewBox="0 0 24 24"><path d="M3 9h4l5-4.5v15L7 15H3z"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    sig: '<svg viewBox="0 0 24 24"><path d="M4 5v14l11-7zM17 5h3v14h-3z"/></svg>',
    caps: '<svg viewBox="0 0 24 24"><path d="M3 5h3v3H3zM8 5.5h13v2H8zM3 10.5h3v3H3zM8 11h13v2H8zM3 16h3v3H3zM8 16.5h13v2H8z"/></svg>',
    subs: '<svg viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 13h5M13 13h5M6 16h8M16 16h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    vel: '<svg viewBox="0 0 24 24"><path d="M12 5a9 9 0 0 0-9 9h2a7 7 0 0 1 14 0h2a9 9 0 0 0-9-9z"/><path d="M12 14l4.5-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="14" r="1.8"/></svg>',
    fs: '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'
  };
  var nf = document.createElement('div'); nf.id = 'nf'; nf.setAttribute('aria-label', 'Controles de la película');
  nf.innerHTML = '<div class="nf-top"><span class="nf-n">N</span><span class="nf-serie">Os Herdeiros do Código</span><span class="nf-cap"></span><a class="nf-ir" href="https://bandmanager.io" target="_blank" rel="noopener" aria-label="Ir a BandManager.io (se abre en una pestaña nueva)">BandManager.io ↗</a><button type="button" class="nf-def" aria-label="Defensa técnica (tecla D)">Defensa técnica · D</button></div>' +
    '<div class="nf-bar"><div class="nf-prog" role="slider" aria-label="Tiempo de la película" tabindex="0"><div class="nf-buffer"></div><div class="nf-lleno"></div><div class="nf-caps"></div><div class="nf-bola"></div><div class="nf-tip"></div></div><span class="nf-cuenta"></span></div>' +
    '<div class="nf-centro"><button class="nf-c" data-nf="menos" aria-label="Retroceder 15 segundos">' + ico.menos + '</button><button class="nf-c gran" data-nf="play" aria-label="Pausa"></button><button class="nf-c" data-nf="mas" aria-label="Avanzar 15 segundos">' + ico.mas + '</button></div>' +
    '<div class="nf-ctrl"><button class="nf-b" data-nf="play" aria-label="Pausa"></button>' +
    '<button class="nf-b" data-nf="menos" aria-label="Retroceder 15 segundos">' + ico.menos + '</button>' +
    '<button class="nf-b" data-nf="mas" aria-label="Avanzar 15 segundos">' + ico.mas + '</button>' +
    '<div class="nf-vol"><button class="nf-b" data-nf="sonido" aria-label="Silenciar"></button><input class="nf-vr" type="range" min="0" max="100" value="100" aria-label="Volumen"></div>' +
    '<span class="nf-titulo"></span>' +
    '<button class="nf-b" data-nf="sig" aria-label="Siguiente escena">' + ico.sig + '</button>' +
    '<button class="nf-b" data-nf="caps" aria-label="Capítulos" aria-haspopup="true">' + ico.caps + '</button>' +
    '<button class="nf-b" data-nf="subs" aria-label="Audio y subtítulos" aria-haspopup="true">' + ico.subs + '</button>' +
    '<button class="nf-b" data-nf="vel" aria-label="Velocidad de reproducción" aria-haspopup="true">' + ico.vel + '</button>' +
    '<button class="nf-b" data-nf="fs" aria-label="Pantalla completa">' + ico.fs + '</button></div>' +
    '<div class="nf-menu nf-m-subs" role="menu"><div><h4>Audio</h4><p class="on">Español (original)</p></div><div><h4>Subtítulos</h4>' +
    '<p role="menuitemradio" data-s="off">Desactivados</p><p role="menuitemradio" data-s="es">Español</p><p role="menuitemradio" data-s="en">English</p><p role="menuitemradio" data-s="gl">Galego</p></div></div>' +
    '<div class="nf-menu nf-m-vel" role="menu"><div><h4>Velocidad de reproducción</h4><div class="nf-vels">' +
    [0.75, 1, 1.25, 1.5].map(function (v) { return '<p role="menuitemradio" data-v="' + v + '">' + String(v).replace('.', ',') + '×' + (v === 1 ? ' (normal)' : '') + '</p>'; }).join('') + '</div></div></div>' +
    '<div class="nf-menu nf-m-caps" role="menu"><div><h4>Os Herdeiros do Código</h4><ol class="nf-lista"></ol></div></div>' +
    '<button class="nf-saltar" type="button"></button>' +
    '<div class="nf-flash" aria-hidden="true"></div>' +
    '<div class="nf-pausa" aria-hidden="true"><small>Estás viendo</small><b>BandManager.io</b><span class="nf-pcap"></span><em>Os Herdeiros do Código</em>' +
    '<p class="nf-sinop">Cuatro amigos, una banda de rock y una sala que no contesta. Hasta que uno decide construir la herramienta que lo cambie todo.</p>' +
    '<p class="nf-rep"><b>Reparto</b> Iago · Brais · Alan · Álvaro · Programador &nbsp;|&nbsp; <b>Género</b> Rock, código y café</p></div>';
  if (stage) stage.appendChild(nf);
  // el botón de saltar va fuera de la barra: se ve aunque los controles estén escondidos
  var saltarBtn = nf.querySelector('.nf-saltar'); if (stage) stage.appendChild(saltarBtn);
  saltarBtn.addEventListener('click', function () { var d = D(); if (d) d.show(+saltarBtn.dataset.i); });
  // Botón a la web (créditos y post-créditos): BandManager.io, para que Brais entre a su perfil
  var WEB = 'https://bandmanager.io';
  var webBtn = document.createElement('a'); webBtn.className = 'nf-web'; webBtn.href = WEB; webBtn.target = '_blank'; webBtn.rel = 'noopener';
  webBtn.innerHTML = '<b>Ir a BandManager.io</b><small>Accede a tu perfil o crea tu banda</small>';
  if (stage) stage.appendChild(webBtn);
  var $n = function (q) { return nf.querySelector(q); };
  var D = function () { return window.Deck; };
  var mmss = function (s) { s = Math.max(0, Math.round(s)); var h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60; return (h ? h + ':' + ('0' + m).slice(-2) : m) + ':' + ('0' + x).slice(-2); };
  var titulo = function (i) { var d = D(); return d && d.slides[i] ? d.slides[i].dataset.title || '' : ''; };
  // Capítulos de la lista: el prólogo, cada capítulo (diapositiva .act) y el final
  var capitulos = function () {
    var d = D(); if (!d) return [];
    var L = d.lista(), out = [], t = 0;
    L.forEach(function (i, k) {
      var s = d.slides[i], nombre = null;
      if (k === 0) nombre = 'Prólogo';
      else if (s.classList.contains('act')) nombre = s.dataset.title;
      else if (/^El festival/.test(s.dataset.title || '')) nombre = 'Seis meses después';
      if (nombre) out.push({ i: i, t: t, nombre: nombre });
      t += d.durEscena(i);
    });
    return out;
  };
  var capActual = function () { var d = D(), c = capitulos(); if (!d) return null; var L = d.lista(), pos = L.indexOf(d.cur); return c.filter(function (x) { return L.indexOf(x.i) <= pos; }).pop() || null; };
  var volUsu = 1, velocidad = 1;
  try { volUsu = Math.max(0, Math.min(1, +(localStorage.getItem('bm_vol') || 1))); } catch { /* por defecto, al máximo */ }
  var aplicarVol = function () {
    if (window.DeckVoces && window.DeckVoces.volumen) window.DeckVoces.volumen(volUsu);
    if (window.DeckSound && window.DeckSound.volumen) window.DeckSound.volumen(volUsu);
    volGlobal = volUsu; $n('.nf-vr').value = Math.round(volUsu * 100);
    try { localStorage.setItem('bm_vol', String(volUsu)); } catch { /* da igual */ }
  };
  var pintarMenu = function () {
    nf.querySelectorAll('.nf-menu [data-s]').forEach(function (p) { var act = p.dataset.s === subsLang; p.classList.toggle('on', act); p.setAttribute('aria-checked', String(act)); });
    nf.querySelectorAll('.nf-menu [data-v]').forEach(function (p) { p.classList.toggle('on', +p.dataset.v === velocidad); });
    $n('[data-nf="subs"]').classList.toggle('activo', subsOn);
    var lista = $n('.nf-lista'), ca = capActual(); lista.textContent = '';
    capitulos().forEach(function (c, k) {
      var li = document.createElement('li'); li.dataset.i = c.i; li.classList.toggle('on', !!ca && ca.i === c.i);
      li.innerHTML = '<b>' + (k + 1) + '</b><span></span><em>' + mmss(c.t) + '</em>'; li.querySelector('span').textContent = c.nombre.replace(/^Capítulo \d+ · /, '');
      lista.appendChild(li);
    });
  };
  // «Saltar intro» en el tráiler y el reparto; «Saltar créditos» en los créditos (a la escena post-créditos)
  var salto = function () {
    var d = D(); if (!d) return null; var t = titulo(d.cur);
    var idx = function (n) { return d.slides.findIndex(function (s) { return s.dataset.title === n; }); };
    if (t === 'Título' || t === 'Prólogo · La banda') { var j = idx('Prólogo · La decisión'); return j > d.cur ? { txt: 'Saltar intro', i: j } : null; }
    if (t === 'Créditos') { var p = idx('Escena post-créditos'); return p > d.cur ? { txt: 'Saltar créditos', i: p } : null; }
    return null;
  };
  var pintar = function () {
    var d = D(); if (!d || !d.total) return;
    var tot = d.total(), t = Math.min(tot, d.tiempo()), pct = tot ? t / tot * 100 : 0;
    $n('.nf-lleno').style.width = pct + '%'; $n('.nf-bola').style.left = pct + '%';
    $n('.nf-buffer').style.width = Math.min(100, pct + 6) + '%';
    $n('.nf-cuenta').textContent = '-' + mmss(tot - t);
    var ca = capActual();
    var esc = titulo(d.cur), pre = ca && esc.indexOf(ca.nombre) !== 0 && esc.indexOf(ca.nombre.replace(/ ·.*/, '')) !== 0 ? ca.nombre + ' · ' : '';
    $n('.nf-titulo').innerHTML = '<b>BandManager.io</b> <span></span>'; $n('.nf-titulo span').textContent = pre + esc;
    $n('.nf-cap').textContent = ca ? ca.nombre : '';
    $n('.nf-pcap').textContent = pre + esc;
    nf.querySelectorAll('[data-nf="play"]').forEach(function (b) { b.innerHTML = d.pausado ? ico.play : ico.pausa; b.setAttribute('aria-label', d.pausado ? 'Reproducir' : 'Pausa'); });
    var son = !!(window.DeckSound && window.DeckSound.enabled) && volUsu > 0;
    $n('[data-nf="sonido"]').innerHTML = son ? ico.sonido : ico.mudo;
    $n('[data-nf="sig"]').disabled = d.proximo(d.cur) === null;
    var marcas = capitulos().map(function (c) { return tot ? (c.t / tot * 100).toFixed(2) : 0; }).join(',');
    if ($n('.nf-caps').dataset.m !== marcas) {
      $n('.nf-caps').dataset.m = marcas; $n('.nf-caps').textContent = '';
      marcas.split(',').slice(1).forEach(function (x) { var i = document.createElement('i'); i.style.left = x + '%'; $n('.nf-caps').appendChild(i); });
    }
    var sl = salto(), b = saltarBtn;
    b.classList.toggle('on', !!sl && body.classList.contains('pelicula')); if (sl) { b.textContent = sl.txt; b.dataset.i = sl.i; }
    var tt = titulo(d.cur); webBtn.classList.toggle('on', body.classList.contains('pelicula') && (tt === 'Créditos' || tt === 'Escena post-créditos'));
  };
  // El icono que salta un momento en el centro, como en Netflix
  var flash = function (svg, txt) { var f = $n('.nf-flash'); f.innerHTML = svg + (txt ? '<b>' + txt + '</b>' : ''); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); };
  // Desde la pantalla final («Más como esta») cualquier mando de navegación vuelve a la película: antes ⟲15 saltaba por debajo y la pantalla negra se quedaba encima
  var salirDelFinal = function () { if (body.classList.contains('fin-peli')) { body.classList.remove('fin-peli'); delete body.dataset.fin; } };
  var saltar = function (seg) { var d = D(); if (!d) return; salirDelFinal(); d.irA(Math.max(0, Math.min(d.total() - 0.5, d.tiempo() + seg))); flash(seg < 0 ? ico.menos : ico.mas); setTimeout(pintar, 60); };
  var cerrarMenus = function () { nf.classList.remove('menu', 'menu-vel', 'menu-caps'); };
  var acciones = {
    // en la pantalla final, ▶ es «Ver otra vez» (como el icono de repetir de Netflix); antes solo pausaba la nada
    play: function () { var d = D(); if (!d) return; if (body.classList.contains('fin-peli')) { salirDelFinal(); if (d.pausado) d.pausar(false); d.show(0); return; } d.pausar(!d.pausado); flash(d.pausado ? ico.pausa : ico.play); },
    menos: function () { saltar(-15); },
    mas: function () { saltar(15); },
    sig: function () { var d = D(), a = d && d.proximo(d.cur); salirDelFinal(); if (a !== null && a !== undefined) d.show(a); },
    sonido: function () {
      if (window.DeckSound && !window.DeckSound.enabled) { window.DeckSound.toggle(); if (!volUsu) volUsu = 1; }
      else volUsu = volUsu > 0 ? 0 : (+nf.dataset.volPrev || 1);
      if (volUsu) nf.dataset.volPrev = volUsu; aplicarVol();
    },
    subs: function () { var on = nf.classList.contains('menu'); cerrarMenus(); if (!on) nf.classList.add('menu'); },
    vel: function () { var on = nf.classList.contains('menu-vel'); cerrarMenus(); if (!on) nf.classList.add('menu-vel'); },
    caps: function () { var on = nf.classList.contains('menu-caps'); cerrarMenus(); if (!on) { pintarMenu(); nf.classList.add('menu-caps'); } },
    fs: function () { var r = document.documentElement; if (document.fullscreenElement) document.exitFullscreen(); else if (r.requestFullscreen) r.requestFullscreen(); }
  };
  nf.addEventListener('click', function (e) {
    var b = e.target.closest('[data-nf]'), s = e.target.closest('[data-s]'), v = e.target.closest('[data-v]'), c = e.target.closest('.nf-lista li');
    if (s) { ponerSubs(s.dataset.s, true); cerrarMenus(); return; }
    if (v) { velocidad = +v.dataset.v; if (window.DeckVoces && window.DeckVoces.velocidad) window.DeckVoces.velocidad(velocidad); pintarMenu(); cerrarMenus(); flash(ico.vel, String(velocidad).replace('.', ',') + '×'); return; }
    if (c) { var d = D(); cerrarMenus(); if (d) d.show(+c.dataset.i); return; }
    if (b) { e.stopPropagation(); acciones[b.dataset.nf](); pintar(); pintarMenu(); despierta(); }
  });
  $n('.nf-vr').addEventListener('input', function (e) { volUsu = +e.target.value / 100; if (volUsu && window.DeckSound && !window.DeckSound.enabled) window.DeckSound.toggle(); aplicarVol(); pintar(); });
  var prog = $n('.nf-prog');
  var tiempoEn = function (e) { var r = prog.getBoundingClientRect(), d = D(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * (d ? d.total() : 0); };
  // Imagen de una escena para la vista previa: su fondo o su primera imagen
  var miniatura = function (i) {
    var d = D(), sl = d && d.slides[i]; if (!sl) return '';
    var bg = sl.querySelector('.scene-bg, .act-bg'), m = bg && /url\(["']?([^"')]+)/.exec(bg.style.backgroundImage || getComputedStyle(bg).backgroundImage || '');
    if (m) return m[1];
    var im = sl.querySelector('img'); return im ? im.getAttribute('src') : '';
  };
  // ── Final de película (estilo Netflix): negro, la N y «Más como esta»; se para todo (voces, música y vídeos) ──
  var finEl = document.createElement('div'); finEl.id = 'nf-fin'; finEl.setAttribute('aria-hidden', 'true');
  finEl.innerHTML = '<span class="nff-n">N</span><p class="nff-t">Más como esta</p><div class="nff-fila"></div><button type="button" class="nff-otra">↺ Ver otra vez</button>'+
    '<p class="nff-mus-t">Escucha las canciones</p><div class="nff-mus">'+
    '<a href="audio/musica/compila.mp3" target="_blank" rel="noopener"><b>▶ Compila nu bravu</b><small>Os Herdeiros do Código</small></a>'+
    '<a href="audio/musica/cabalga.mp3" target="_blank" rel="noopener"><b>▶ Cabalga o lóstrego</b><small>Master of Prompts</small></a></div>'+
    '<a class="nff-web" href="'+WEB+'" target="_blank" rel="noopener">Accede a tu perfil o crea tu banda → bandmanager.io</a>';
  if (stage) stage.appendChild(finEl);
  var ANEXO_FIN = ['Arquitectura', 'Cómo se construyó con IA', 'Seguridad', 'Calidad en cifras'];
  var montarFin = function () {
    var d = D(), fila = finEl.querySelector('.nff-fila'); if (!d || fila.childNodes.length) return;
    d.slides.forEach(function (sl, i) {
      var t = sl.dataset.title; if (ANEXO_FIN.indexOf(t) < 0) return;
      var b = document.createElement('button'); b.type = 'button'; b.className = 'nff-card'; b.dataset.i = i;
      var th = miniatura(i); if (th) b.style.backgroundImage = 'linear-gradient(transparent 40%, rgba(0,0,0,.85)), url("' + th + '")';
      b.innerHTML = '<b></b><small>Defensa técnica</small>'; b.firstChild.textContent = t; fila.appendChild(b);
    });
  };
  var acabar = function () {
    if (body.classList.contains('fin-peli')) return;
    montarFin(); body.classList.add('fin-peli');
    if (window.DeckVoces && window.DeckVoces.stop) window.DeckVoces.stop();
    document.querySelectorAll('video').forEach(function (v) { v.pause(); });
    despertar();
  };
  var reanudar = function () { body.classList.remove('fin-peli'); delete body.dataset.fin; };
  new MutationObserver(function () { if (body.dataset.fin === '1' && body.classList.contains('pelicula')) acabar(); }).observe(body, { attributes: true, attributeFilter: ['data-fin'] });
  finEl.addEventListener('click', function (e) {
    var d = D(), card = e.target.closest('.nff-card'), otra = e.target.closest('.nff-otra'); if (!d) return;
    if (otra) { reanudar(); d.show(0); }
    else if (card) { reanudar(); var p = document.getElementById('bPeli'); if (p && body.classList.contains('pelicula')) p.click(); d.show(+card.dataset.i); }
  });
  var escenaEnTiempo = function (seg) { var d = D(), t = 0, L = d.lista(); for (var k = 0; k < L.length; k++) { t += d.durEscena(L[k]); if (seg < t) return L[k]; } return L[L.length - 1]; };
  prog.addEventListener('click', function (e) { var d = D(); if (d) { salirDelFinal(); d.irA(tiempoEn(e)); setTimeout(pintar, 60); } });
  prog.addEventListener('mousemove', function (e) {
    var d = D(); if (!d) return; var seg = tiempoEn(e), tip = $n('.nf-tip'), r = prog.getBoundingClientRect();
    var ie = escenaEnTiempo(seg), th = miniatura(ie);
    tip.innerHTML = (th ? '<img src="' + th + '" alt="">' : '') + '<span></span>'; tip.querySelector('span').textContent = mmss(seg) + ' · ' + titulo(ie);
    var w = r.width, x = e.clientX - r.left; tip.style.left = Math.max(140, Math.min(w - 140, x)) / w * 100 + '%';
  });
  prog.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); saltar(e.key === 'ArrowLeft' ? -15 : 15); } });
  // «Siguiente capítulo en 5…»: tarjeta con cuenta atrás en los últimos segundos de cada capítulo
  var sig = document.createElement('button'); sig.type = 'button'; sig.className = 'nf-sig-ep'; sig.setAttribute('aria-live', 'polite');
  sig.innerHTML = '<img alt=""><span><small>Siguiente capítulo · <b></b></small><em></em></span>'; if (stage) stage.appendChild(sig);
  var sigI = -1;
  sig.addEventListener('click', function () { var d = D(); if (d && sigI >= 0) d.show(sigI); });
  var pintarSig = function () {
    var d = D(), on = false;
    if (d && d.total && !d.pausado) {
      var t = d.tiempo(), cs = capitulos().filter(function (c) { return c.t > t; }), c = cs[0];
      if (c && c.t - t <= 6 && c.t - t > 0.3 && t > 3) {
        on = true; sigI = c.i; sig.querySelector('b').textContent = Math.ceil(c.t - t);
        sig.querySelector('em').textContent = c.nombre.replace(/^Capítulo \d+ · /, '');
        var th = miniatura(c.i), im = sig.querySelector('img'); if (th) im.src = th; im.style.display = th ? '' : 'none';
      }
    }
    sig.classList.toggle('on', on);
  };
  setInterval(function () { if (body.classList.contains('pelicula') && !body.classList.contains('scroll')) pintarSig(); else sig.classList.remove('on'); }, 250);
  try { localStorage.removeItem('bm_pos'); } catch { /* sin almacenamiento */ } // antes se guardaba la posición para «Continuar viendo»; ya no
  // «Defensa técnica» (tecla D o botón de arriba): panel de apoyo con arquitectura, seguridad, agentes, calidad, negocio y preguntas del tribunal.
  // Pausa la película al abrirse y la reanuda al cerrarse. El contenido lo genera tools/guion/defensa.py
  var df = document.getElementById('defensa'), dfPausada = false;
  var dfPestana = function (id) {
    df.querySelectorAll('.df-tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.df === id); });
    df.querySelectorAll('.df-cuerpo section').forEach(function (x) { x.hidden = x.dataset.df !== id; });
  };
  var dfAbrir = function () {
    if (!df) return; var d = D();
    dfPausada = !!(d && d.pelicula && !d.pausado); if (dfPausada) d.pausar(true);
    df.hidden = false; document.body.classList.add('df-abierto'); dfPestana(df.dataset.ult || 'arq'); df.querySelector('.df-x').focus();
  };
  var dfCerrar = function () {
    if (!df || df.hidden) return; df.dataset.ult = (df.querySelector('.df-tabs .on') || {}).dataset ? df.querySelector('.df-tabs .on').dataset.df : 'arq';
    df.hidden = true; document.body.classList.remove('df-abierto'); var d = D(); if (dfPausada && d) d.pausar(false); dfPausada = false;
  };
  if (df) {
    df.querySelectorAll('.df-tabs button').forEach(function (b) { b.addEventListener('click', function () { dfPestana(b.dataset.df); }); });
    df.querySelector('.df-x').addEventListener('click', dfCerrar);
    var dfBtn = nf.querySelector('.nf-def'); if (dfBtn) dfBtn.addEventListener('click', function (e) { e.stopPropagation(); dfAbrir(); });
    addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey || /input|textarea/i.test((e.target || {}).tagName || '')) return;
      if (e.key === 'Escape' && !df.hidden) { e.preventDefault(); e.stopImmediatePropagation(); dfCerrar(); }
      else if ((e.key === 'd' || e.key === 'D') && (body.classList.contains('pelicula') || body.classList.contains('scroll') || document.getElementById('stage'))) { e.preventDefault(); e.stopImmediatePropagation(); if (df.hidden) dfAbrir(); else dfCerrar(); }
      else if (!df.hidden && /^(ArrowLeft|ArrowRight|ArrowUp|ArrowDown| |PageUp|PageDown)$/.test(e.key) && !/button|summary/i.test((e.target || {}).tagName || '')) { e.stopImmediatePropagation(); }
    }, true);
  }
  // Doble toque en móvil: izquierda −15 s, derecha +15 s, como en Netflix
  var ultimoToque = { t: 0, x: 0 };
  addEventListener('touchend', function (e) {
    if (!body.classList.contains('pelicula') || body.classList.contains('scroll') || !e.changedTouches[0]) return;
    if (e.target.closest && e.target.closest('.nf-b, .nf-c, .nf-prog, .nf-menu, .nf-saltar, .nf-web, .nf-ir, .nf-sig-ep, input')) return;
    var x = e.changedTouches[0].clientX, ahora = Date.now(), w = innerWidth;
    if (ahora - ultimoToque.t < 320 && Math.abs(x - ultimoToque.x) < 90) { saltar(x < w / 2 ? -15 : 15); ultimoToque.t = 0; }
    else ultimoToque = { t: ahora, x: x };
  }, { passive: true });
  setInterval(function () { if (body.classList.contains('pelicula') && !body.classList.contains('scroll')) pintar(); }, 250);
  // Se esconde a los 2,5 s sin mover el ratón, como en Netflix (en pausa o con un menú abierto se queda)
  var oculto = 0;
  var despierta = function () { nf.classList.add('ver'); body.classList.add('nf-ver'); clearTimeout(oculto); oculto = setTimeout(function () { if (!/menu/.test(nf.className) && !(D() && D().pausado)) { nf.classList.remove('ver'); body.classList.remove('nf-ver'); } }, 2500); };
  addEventListener('mousemove', function () { if (body.classList.contains('pelicula')) despierta(); });
  addEventListener('touchstart', function () { if (body.classList.contains('pelicula')) despierta(); }, { passive: true });
  // Reloj de cuenta atrás (Nolan): el sábado el Resurrection Fest cierra el cartel a las 14:00 y cada plano marca la hora
  var reloj = document.createElement('div'); reloj.id = 'reloj'; reloj.setAttribute('aria-hidden', 'true');
  reloj.innerHTML = '<small>CIERRE DEL CARTEL · RESURRECTION FEST</small><span></span>';
  if (stage) stage.appendChild(reloj);
  var relojT0 = 0, relojRest = 0;
  var pintarReloj = function () {
    if (!relojT0) return;
    var seg = Math.max(0, relojRest - Math.floor((Date.now() - relojT0) / 1000));
    var h = Math.floor(seg / 3600), m = Math.floor(seg / 60) % 60, s2 = seg % 60;
    reloj.querySelector('span').textContent = '-' + ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2) + ':' + ('0' + s2).slice(-2);
    document.querySelectorAll('.slide.active .vent-reloj').forEach(function (e) { e.textContent = reloj.classList.contains('on') ? 'Cierre del cartel ' + reloj.querySelector('span').textContent : ''; });
    reloj.classList.toggle('fin', seg === 0);
  };
  var ajustarReloj = function () {
    var sl = document.querySelector('.slide.active'), tag = sl && sl.querySelector('.tag');
    var mt = tag && /S[áa]bado[^0-9]{1,5}(\d{1,2}):(\d{2})/.exec(tag.textContent);
    var txt = (tag ? tag.textContent : '') + ' ' + (sl ? sl.dataset.title || '' : '');
    var fuera = /Seis meses|Domingo|Otro jueves|Fin de la historia|Prólogo|Gracias|Créditos|Escena post|El reloj/.test(txt) && !mt;
    if (mt && /Seis meses/.test(tag.textContent)) fuera = true;
    if (sl && (sl.classList.contains('noches') || sl.classList.contains('entrevista') || sl.classList.contains('plano'))) { reloj.classList.remove('on', 'fin'); return; } // la escena íntima va sin cuenta atrás; el reloj sigue corriendo debajo
    if (fuera || (!mt && !relojT0)) { reloj.classList.remove('on', 'fin'); relojT0 = 0; return; }
    if (!mt) return; // plano sin hora (capítulos, negocio…): el reloj sigue corriendo
    relojRest = Math.max(0, (14 * 60 - (+mt[1] * 60 + +mt[2])) * 60); relojT0 = Date.now(); reloj.classList.add('on'); pintarReloj();
  };
  setInterval(pintarReloj, 1000);
  addEventListener('hashchange', function () { setTimeout(ajustarReloj, 40); });
  addEventListener('deckslide', function () { setTimeout(ajustarReloj, 40); setTimeout(camara, 30); pintar(); despertar(); });

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
  addEventListener('deckpausa', function () { pintar(); despierta(); if (D() && D().pausado) Object.keys(pistas).forEach(function (n) { try { pistas[n].a.pause(); } catch { /* sin pista */ } }); });
  addEventListener('voz', pintar);
  // Teclas de Netflix en modo película: espacio o K pausa · ← / J −15 s · → / L +15 s · ↑ ↓ volumen · M silencio ·
  // N siguiente escena · S saltar intro o créditos · F pantalla completa · C subtítulos · Esc cierra los menús
  addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA/.test(e.target.tagName) || body.classList.contains('gate')) return;
    if ((e.key === 'c' || e.key === 'C')) { ponerSubs(subsOn ? 'off' : (subsLang === 'off' ? 'es' : subsLang), true); despierta(); return; }
    if (!body.classList.contains('pelicula') || body.classList.contains('scroll')) return;
    var k = e.key, hecho = true;
    if (k === ' ' || k === 'k' || k === 'K' || k === 'Enter') acciones.play();
    else if (k === 'ArrowLeft' || k === 'j' || k === 'J') saltar(-15);
    else if (k === 'ArrowRight' || k === 'l' || k === 'L') saltar(15);
    else if (k === 'ArrowUp' || k === 'ArrowDown') { volUsu = Math.max(0, Math.min(1, Math.round((volUsu + (k === 'ArrowUp' ? 0.1 : -0.1)) * 10) / 10)); if (volUsu && window.DeckSound && !window.DeckSound.enabled) window.DeckSound.toggle(); aplicarVol(); flash(volUsu ? ico.sonido : ico.mudo, Math.round(volUsu * 100) + ' %'); }
    else if (k === 'm' || k === 'M') { acciones.sonido(); flash(volUsu ? ico.sonido : ico.mudo); }
    else if (k === 'n' || k === 'N') acciones.sig();
    else if ((k === 's' || k === 'S') && salto()) { var d = D(); d.show(salto().i); }
    else if (k === 'Escape' && /menu/.test(nf.className)) cerrarMenus();
    else hecho = false;
    if (hecho) { e.preventDefault(); e.stopImmediatePropagation(); pintar(); despierta(); }
  }, true);
  ponerSubs(subsLang); aplicarVol();
  setTimeout(pintar, 0); addEventListener('load', pintar);

  new MutationObserver(despertar).observe(body, { attributes: true, attributeFilter: ['class'] });
  addEventListener('voz', despertar);
  document.addEventListener('visibilitychange', function () { if (document.hidden) Object.keys(pistas).forEach(function (n) { if (pistas[n] && pistas[n].a) pistas[n].a.pause(); }); else despertar(); });
})();

// La ficha de cada función (modo película) entra con un golpe grave suave
document.addEventListener('animationstart', function (e) {
  if ((e.animationName === 'fichaentra' || e.animationName === 'rafagaentra' || e.animationName === 'rafagafin') && window.DeckSound && window.DeckSound.ficha) window.DeckSound.ficha();
});
