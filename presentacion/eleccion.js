/* Elige tu propia aventura (como «Black Mirror: Bandersnatch»): al acabar ciertas escenas la película se para y pregunta.
   Hay 10 s para elegir (si no, sigue la opción de siempre), y las ramas alternativas son cartas de texto con una vuelta atrás.
   deck.js llama a Eleccion.desvia(escena, siguiente, saltar) cuando una escena de la película acaba: si devuelve true, aquí mandan las
   elecciones hasta llamar a saltar(índice). Solo en modo película; con el teclado: 1-3 o flechas + Intro. */
(function () {
  'use strict';
  var SEGUNDOS = 10;
  // Pausa «Entra tú también»: la película espera, con un QR en pantalla, hasta que pulsan «Ya estoy dentro». El QR (img/qr-fans.png, con el logo
  // de Os Herdeiros) se genera con tools/qr_demo.py --hdc y tiene que apuntar a la misma dirección que DEMO_URL. Es la página pública de fans (/unete) de la banda real «Os Herdeiros
  // do Código» (band-os-herdeiros-do-codigo): el único QR que escanea Brais, y el mismo que sale en «Un QR y el público se hace fan».
  var DEMO_URL = 'https://bandmanager.io/unete?b=t_AAAAAEAOHUwPAAA7FgwRGgFIOxxMDxs7W1dd';
  var DEMO = { titulo: 'Entra tú también', texto: 'Escanea el código y hazte fan de Os Herdeiros, como el público del festival. La película espera.' };
  var ELECCIONES = {
    'Prólogo · Sábado, 11:00 en el local': { id: 'demo', demo: true },
    'Prólogo · La decisión': {
      id: 'decision', pregunta: '¿Qué hace Iago?',
      opciones: [
        { t: 'Empezar esta noche' },
        { t: 'Dejarlo para el lunes', carta: ['El lunes se convirtió en martes.', 'Y el martes, en nunca.', 'La sala del catorce no contestó.', 'Esto no es lo que pasó.'], ms: 9000, vuelve: true },
      ],
    },
    'La invitación': {
      id: 'invitacion', pregunta: 'Brais, ¿qué respondes?',
      opciones: [
        { t: 'Sí, me uno' },
        { t: 'Déjame pensarlo', carta: ['Sin prisa, Brais.', 'La invitación sigue en pie.', 'Pero el sábado hay ensayo.'], ms: 7500, vuelve: true },
        { t: 'Los miércoles libro', carta: ['Perfecto.', 'Los sábados, Os Herdeiros do Código.', 'Los miércoles, Master of Prompts.', 'Y BandManager te avisa cuando se pisen.'], ms: 10000 },
      ],
    },
  };
  var hechas = {}, activa = null;
  var D = function () { return window.Deck; };

  var cierra = function () { if (activa) { clearInterval(activa.reloj); activa.el.remove(); activa = null; } };
  var carta = function (lineas, ms, fin) {
    var c = document.createElement('div'); c.id = 'eleccion-carta'; c.setAttribute('role', 'status');
    c.innerHTML = lineas.map(function (l, i) { return '<p style="--d:' + (0.4 + i * 1.6) + 's"></p>'; }).join('');
    [].forEach.call(c.querySelectorAll('p'), function (p, i) { p.textContent = lineas[i]; });
    document.getElementById('stage').appendChild(c);
    setTimeout(function () { c.remove(); fin(); }, ms);
  };


  var pausaQR = function (idx, siguiente, saltar) {
    var el = document.createElement('div'); el.id = 'demo-qr'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', DEMO.titulo);
    el.innerHTML = '<div class="dq-caja"><img class="dq-qr" src="img/qr-fans.png" alt="QR de fans de Os Herdeiros do Código"><div class="dq-txt"><h2></h2><p></p><small></small><button type="button" class="dq-ok">Ya estoy dentro →</button><button type="button" class="dq-sin">Seguir sin entrar</button></div></div>';
    el.querySelector('h2').textContent = DEMO.titulo; el.querySelector('p').textContent = DEMO.texto; el.querySelector('small').textContent = 'bandmanager.io/unete';
    var sigue = function () { removeEventListener('keydown', teclas, true); clearInterval(vigila); el.remove(); hechas.demo = true; saltar(siguiente); };
    var teclas = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); sigue(); } };
    el.querySelector('.dq-ok').addEventListener('click', sigue); el.querySelector('.dq-sin').addEventListener('click', sigue);
    var vigila = setInterval(function () { if (D().cur !== idx) { removeEventListener('keydown', teclas, true); clearInterval(vigila); el.remove(); } }, 400);
    document.getElementById('stage').appendChild(el);
    addEventListener('keydown', teclas, true);
    setTimeout(function () { var b = el.querySelector('.dq-ok'); if (b) b.focus({ preventScroll: true }); }, 50);
  };

  var pregunta = function (idx, cfg, quitadas, siguiente, saltar) {
    var ops = cfg.opciones.filter(function (o) { return quitadas.indexOf(o) < 0; });
    var el = document.createElement('div'); el.id = 'eleccion'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', cfg.pregunta);
    el.innerHTML = '<p class="el-q"></p><div class="el-ops"></div><i class="el-tiempo"></i>';
    el.querySelector('.el-q').textContent = quitadas.length ? 'Vuelve a elegir. ' + cfg.pregunta : cfg.pregunta;
    var caja = el.querySelector('.el-ops'), tiempo = el.querySelector('.el-tiempo');
    var elige = function (op) {
      if (!activa) return;
      cierra(); removeEventListener('keydown', teclas, true);
      var sigue = function () { if (op.vuelve) pregunta(idx, cfg, quitadas.concat(op), siguiente, saltar); else { hechas[cfg.id] = true; saltar(siguiente); } };
      if (op.carta) carta(op.carta, op.ms, sigue); else sigue();
    };
    var teclas = function (e) {
      var k = e.key, n = parseInt(k, 10);
      if (n >= 1 && n <= ops.length) { e.preventDefault(); e.stopPropagation(); elige(ops[n - 1]); }
      else if (k === 'Enter') { e.preventDefault(); e.stopPropagation(); elige(ops[0]); }
    };
    ops.forEach(function (op, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'el-op'; b.textContent = op.t;
      b.addEventListener('click', function () { elige(op); }); caja.appendChild(b);
      if (i === 0) setTimeout(function () { b.focus({ preventScroll: true }); }, 50);
    });
    document.getElementById('stage').appendChild(el);
    addEventListener('keydown', teclas, true);
    var t0 = performance.now();
    activa = { el: el, reloj: setInterval(function () {
      var k = Math.min(1, (performance.now() - t0) / (SEGUNDOS * 1000));
      tiempo.style.setProperty('--k', String(1 - k));
      if (D().cur !== idx) { cierra(); removeEventListener('keydown', teclas, true); }   // si saltan de escena, se cancela
      else if (k >= 1) elige(ops[0]);                                                  // sin respuesta: la de siempre
    }, 80) };
  };

  window.Eleccion = {
    desvia: function (idx, siguiente, saltar) {
      var sl = D().slides[idx], cfg = sl && ELECCIONES[sl.dataset.title];
      if (!cfg || hechas[cfg.id] || activa || /[?&]grabando/.test(location.search)) return false; // al grabar el MP4 de respaldo no hay pausas ni preguntas
      if (cfg.demo) pausaQR(idx, siguiente, saltar); else pregunta(idx, cfg, [], siguiente, saltar);
      return true;
    },
  };
})();
