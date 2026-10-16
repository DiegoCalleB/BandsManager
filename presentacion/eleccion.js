/* Elige tu propia aventura (como «Black Mirror: Bandersnatch»): al acabar ciertas escenas la película se para y pregunta.
   Hay 10 s para elegir (si no, sigue la opción de siempre), y las ramas alternativas son cartas de texto con una vuelta atrás.
   deck.js llama a Eleccion.desvia(escena, siguiente, saltar) cuando una escena de la película acaba: si devuelve true, aquí mandan las
   elecciones hasta llamar a saltar(índice). Solo en modo película; con el teclado: 1-3 o flechas + Intro. */
(function () {
  'use strict';
  var SEGUNDOS = 10;
  var ELECCIONES = {
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
      if (!cfg || hechas[cfg.id] || activa) return false;
      pregunta(idx, cfg, [], siguiente, saltar);
      return true;
    },
  };
})();
