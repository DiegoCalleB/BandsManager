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
  var audio = new Audio();
  audio.preload = 'auto';
  var run = 0, timer = 0, avisar = function () {};

  var enabled = function () { return pref && !!(window.DeckSound && window.DeckSound.enabled); };

  function hablar(el, fin) {
    var who = el.dataset.who, say = el.dataset.say || '';
    var m = manifest[fnv(who + '|' + say)];
    var hecho = false;
    var acabar = function () { if (hecho) return; hecho = true; el.classList.remove('habla'); if (fin) fin(); };
    el.classList.add('habla');
    var leer = function () { setTimeout(acabar, Math.max(1400, say.length * 55)); };
    if (m) {
      audio.onended = acabar; audio.onerror = function () { leer(); };
      audio.src = 'audio/voces/' + m.f;
      audio.play().catch(function () { leer(); });
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
      u.onend = acabar; u.onerror = leer;
      speechSynthesis.speak(u);
      return;
    }
    leer();
  }

  function stop() {
    run++;
    clearTimeout(timer);
    audio.onended = null; audio.onerror = null;
    try { audio.pause(); } catch (_) { /* nada que parar */ }
    try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (_) { /* sin síntesis */ }
    document.querySelectorAll('.habla').forEach(function (e) { e.classList.remove('habla'); });
  }

  // Habla la diapositiva entera: cada frase se muestra (mostrar) justo cuando empieza a sonar
  function play(slide, mostrar, filtro, alFinal) {
    stop();
    var id = ++run;
    var cola = Array.prototype.slice.call(slide.querySelectorAll('[data-who][data-say]'));
    if (filtro) cola = cola.filter(filtro);
    var i = 0;
    var siguiente = function () {
      if (id !== run) return;
      if (i >= cola.length) { if (alFinal) alFinal(); return; }
      var el = cola[i++];
      if (mostrar) mostrar(el);
      if (window.DeckSound && window.DeckSound.msg && el.matches('.dlg li')) window.DeckSound.msg(el.classList.contains('me'));
      hablar(el, function () { if (id === run) timer = setTimeout(siguiente, 280); });
    };
    timer = setTimeout(siguiente, 950);
  }

  function uno(el) { stop(); run++; hablar(el); }

  window.DeckVoces = {
    enabled: enabled, play: play, stop: stop, uno: uno,
    get pref() { return pref; },
    toggle: function () { pref = !pref; store.set('deck_voces', pref ? 'on' : 'off'); if (!pref) stop(); avisar(pref); return pref; },
    onChange: function (f) { avisar = f; },
  };
})();
