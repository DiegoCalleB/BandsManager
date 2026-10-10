/* Modo película (tecla P): música de fondo que baja cuando alguien habla y viñeta de cine.
   La cámara (zoom al que habla), el foco sobre él y el fogonazo de cada plano son CSS (styles.css).
   La música es audio/musica/rock.mp3 (la genera tools/musica.py); solo suena con el sonido activado. */
(function () {
  var bgm = new Audio('audio/musica/rock.mp3');
  bgm.loop = true; bgm.preload = 'auto'; bgm.volume = 0;
  var ALTO = 0.2, BAJO = 0.07, raf = 0;
  var body = document.body;

  var activo = function () {
    return body.classList.contains('pelicula') && !body.classList.contains('scroll') && !!(window.DeckSound && window.DeckSound.enabled);
  };
  var objetivo = function () { return !activo() ? 0 : document.querySelector('.habla') ? BAJO : ALTO; };

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

  new MutationObserver(despertar).observe(body, { attributes: true, attributeFilter: ['class'] });
  addEventListener('voz', despertar);
  document.addEventListener('visibilitychange', function () { if (document.hidden) bgm.pause(); else despertar(); });
})();
