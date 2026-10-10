/* Voces de la banda: cada mensaje del chat se oye con la voz de su personaje.
   Los audios los genera tools/voces.py en audio/voces/ (manifest.json → mp3). Cada frase se busca por
   el hash de «personaje|frase hablada», el mismo que calcula el generador.
   Si falta un audio (por ejemplo, una frase recién cambiada), habla la voz del navegador como respaldo.
   Solo suena con el sonido activado (tecla M) y se puede apagar aparte con la tecla V. */
(function () {
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (_) { /* sin almacenamiento */ } },
  };
  var fnv = function (s) {
    var h = 0x811c9dc5, bytes = new TextEncoder().encode(s);
    for (var i = 0; i < bytes.length; i++) { h ^= bytes[i]; h = Math.imul(h, 16777619) >>> 0; }
    return ('0000000' + h.toString(16)).slice(-8);
  };
  var manifest = {};
  fetch('audio/voces/manifest.json').then(function (r) { return r.ok ? r.json() : {}; })
    .then(function (m) { manifest = m || {}; }).catch(function () { /* sin voces grabadas */ });

  var pref = store.get('deck_voces') !== 'off';
  // Dos reproductores que se turnan: así una frase puede empezar mientras la anterior todavía termina,
  // como en una conversación real en la que la gente se pisa un poco
  var pista = [new Audio(), new Audio()], turno = 0;
  pista.forEach(function (a) { a.preload = 'auto'; a.preservesPitch = true; });
  // Ritmo: voces un poco más rápidas; PISAR = cuánto se solapa con la anterior cuando cambia quien habla
  var VEL = 1.12, PISAR = 0.28;
  var retardo = function (el) { return el && el.matches('.dlg li') ? Math.min(420, 140 + (el.dataset.say || '').length * 1.3) : 0; };
  var run = 0, timer = 0, avisar = function () {};

  var enabled = function () { return pref && !!(window.DeckSound && window.DeckSound.enabled); };

  // Boca: el volumen de la voz (envolvente que guarda el generador, 25 por segundo) mueve el avatar.
  // Se pinta en --vu del que habla y de su diapositiva (el ecualizador de la radio también lo sigue).
  // casi(): se llama cuando a la frase le quedan `antes` segundos reales, para preparar la siguiente
  function mover(el, e, audio, casi, antes) {
    cancelAnimationFrame(el._boca);
    var slide = el.closest('.slide');
    var paso = function () {
      if (casi && audio && audio.duration && (audio.duration - audio.currentTime) / VEL < antes) casi();
      var t = audio ? audio.currentTime : 0;
      var v = e ? +(e.charAt(Math.floor(t * 25)) || 0) / 9 : 0.35 + 0.35 * Math.sin(Date.now() / 90) * Math.sin(Date.now() / 37);
      el.style.setProperty('--vu', v.toFixed(2));
      if (slide) slide.style.setProperty('--vu', v.toFixed(2));
      el._boca = requestAnimationFrame(paso);
    };
    paso();
  }
  function callar(el) {
    cancelAnimationFrame(el._boca);
    el.style.removeProperty('--vu');
    var slide = el.closest('.slide'); if (slide) slide.style.removeProperty('--vu');
  }

  // Plató: el que habla en el chat sale en grande en un hueco libre de la diapositiva y se mueve a su manera.
  // El hueco se busca midiendo lo que hay en pantalla: así no tapa texto aunque cambie el guion o el reparto.
  var OBST = 'li, h1, h2, h3, p, img, figure, svg, video, canvas, table, pre, .tag, .sheet, .ft-shot, .qrcard, .cartel, .paperwrap, ' +
    '.bs-grid, .biz-cols, .tech-vis, .scene-foot, .bs-foot, .fin-crowd, .enrol, .act-msg, .rm-say, .react';
  function hueco(slide) {
    if (slide._hueco !== undefined) return slide._hueco;
    var st = slide.getBoundingClientRect(), k = st.width / 1920 || 1, obs = [];
    slide.querySelectorAll(OBST).forEach(function (e) {
      if (e.closest('.foco, .scene-bg, .hero-bg, [class*="-bg"]')) return;
      var r = e.getBoundingClientRect();
      var o = { x: (r.left - st.left) / k, y: (r.top - st.top) / k, w: r.width / k, h: r.height / k };
      if (o.w < 4 || o.h < 4 || o.w * o.h > 1920 * 1080 * 0.6) return;
      obs.push(o);
    });
    var libre = function (x, y, t) {
      return obs.every(function (o) { return x + t + 24 < o.x || x - 24 > o.x + o.w || y + t + 24 + 40 < o.y || y - 24 > o.y + o.h; });
    };
    slide._hueco = null;
    [230, 190, 150, 120].some(function (t) {
      for (var y = 1080 - 78 - t - 40; y >= 280; y -= 30) {
        for (var x = 1920 - 70 - t; x >= 60; x -= 30) {
          if (libre(x, y, t)) { slide._hueco = { x: x, y: y, t: t }; return true; }
        }
      }
      return false;
    });
    return slide._hueco;
  }
  function foco(el) {
    var slide = el.closest('.slide'), m = window.REPARTO && window.REPARTO[el.dataset.who];
    if (!slide || document.body.classList.contains('scroll')) return;
    var h = m && m.foto && hueco(slide);
    var f = slide.querySelector('.foco');
    if (!h) { if (f) f.classList.remove('in'); return; }
    if (!f) {
      f = document.createElement('div'); f.className = 'foco'; f.setAttribute('aria-hidden', 'true');
      f.innerHTML = '<img alt=""><b></b>'; slide.appendChild(f);
    }
    if (f.dataset.who === el.dataset.who && f.classList.contains('in')) return;
    f.classList.remove('in'); void f.offsetWidth; // reinicia la entrada si cambia el que habla
    f.dataset.who = el.dataset.who; f.dataset.mov = m.mov || 'calma';
    // plano y contraplano: quien escribe desde su lado (yo) entra por la derecha, los demás por la izquierda
    f.style.cssText = '--c:' + m.color + ';--t:' + h.t + 'px;left:' + h.x + 'px;top:' + h.y + 'px;--dx:' + (el.classList.contains('me') ? 160 : -160) + 'px';
    f.querySelector('img').src = m.foto; f.querySelector('b').textContent = m.nombre + ' · ' + m.rol;
    f.classList.add('in');
  }
  function sinfoco(slide) {
    var f = slide && slide.querySelector('.foco'); if (f) { f.classList.remove('in'); delete f.dataset.who; }
  }

  function hablar(el, fin, antes) {
    var who = el.dataset.who, say = el.dataset.say || '';
    var m = manifest[fnv(who + '|' + say)];
    var hecho = false, avanzado = false;
    var avanzar = function () { if (avanzado) return; avanzado = true; if (fin) fin(); };
    var acabar = function () { if (hecho) return; hecho = true; callar(el); el.classList.remove('habla'); avanzar(); };
    el.classList.add('habla');
    dispatchEvent(new Event('voz'));
    if (el.matches('.dlg li')) foco(el);
    var leer = function () { mover(el, null); setTimeout(acabar, Math.max(900, say.length * 42)); };
    if (m) {
      var audio = pista[turno]; turno = 1 - turno;
      audio.onended = acabar; audio.onerror = function () { leer(); };
      audio.src = 'audio/voces/' + m.f;
      audio.playbackRate = VEL;
      audio.play().then(function () { mover(el, m.e || null, audio, avanzar, antes || 0); }).catch(function () { leer(); });
      return;
    }
    // Sin audio grabado: voz española del navegador o, si no hay, el tiempo de leer la frase
    var v = 'speechSynthesis' in window && speechSynthesis.getVoices().filter(function (x) { return /^es(-|_)?ES/i.test(x.lang); })[0];
    if (v) { // respaldo: voz del navegador, con el tono y la velocidad del personaje
      var u = new SpeechSynthesisUtterance(say.replace(/\[pi\]/g, '…'));
      u.lang = 'es-ES';
      u.voice = v;
      var t = (window.REPARTO && window.REPARTO[who] && window.REPARTO[who].tts) || {};
      u.pitch = Math.max(0, Math.min(2, 1 + (t.tono || 0) / 10));
      u.rate = t.vel || 1;
      u.onstart = function () { mover(el, null); };
      u.onend = acabar; u.onerror = leer;
      speechSynthesis.speak(u);
      return;
    }
    leer();
  }

  function stop() {
    run++;
    clearTimeout(timer);
    pista.forEach(function (a) { a.onended = null; a.onerror = null; try { a.pause(); } catch (_) { /* nada que parar */ } });
    try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (_) { /* sin síntesis */ }
    document.querySelectorAll('.habla, .typing').forEach(function (e) { e.classList.remove('habla', 'typing'); callar(e); });
    document.querySelectorAll('.foco.in').forEach(function (f) { f.classList.remove('in'); delete f.dataset.who; });
  }

  // Habla la diapositiva entera: cada frase se muestra (mostrar) justo cuando empieza a sonar
  function play(slide, mostrar, filtro, alFinal) {
    stop();
    var id = ++run;
    slide._hueco = undefined; // se vuelve a medir el hueco libre (puede haber cambiado el tamaño de la ventana)
    var cola = Array.prototype.slice.call(slide.querySelectorAll('[data-who][data-say]'));
    if (filtro) cola = cola.filter(filtro);
    var i = 0;
    var siguiente = function () {
      if (id !== run) return;
      if (i >= cola.length) { timer = setTimeout(function () { sinfoco(slide); }, 700); if (alFinal) alFinal(); return; }
      var el = cola[i++], prox = cola[i];
      var luego = function () { if (id === run) timer = setTimeout(siguiente, 0); };
      // La siguiente se prepara a tiempo para empezar justo al acabar esta, o pisándola un poco si habla otro
      var antes = prox ? retardo(prox) / 1000 + (prox.dataset.who !== el.dataset.who ? PISAR : 0) : 0;
      if (!el.matches('.dlg li')) { if (mostrar) mostrar(el); hablar(el, luego, antes); return; }
      // Mensaje de chat: primero «escribiendo…», luego la burbuja y la voz, como en el móvil
      el.classList.add('typing');
      if (mostrar) mostrar(el);
      timer = setTimeout(function () {
        if (id !== run) return;
        el.classList.remove('typing');
        if (window.DeckSound && window.DeckSound.msg) window.DeckSound.msg(el.classList.contains('me'));
        hablar(el, luego, antes);
      }, retardo(el));
    };
    timer = setTimeout(siguiente, 200);
  }

  function uno(el) { stop(); run++; hablar(el); }

  window.DeckVoces = {
    enabled: enabled, play: play, stop: stop, uno: uno,
    get pref() { return pref; },
    toggle: function () { pref = !pref; store.set('deck_voces', pref ? 'on' : 'off'); if (!pref) stop(); avisar(pref); return pref; },
    onChange: function (f) { avisar = f; },
  };
})();
