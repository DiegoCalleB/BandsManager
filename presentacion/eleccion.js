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
  var DEMO = { titulo: 'Falta un fan', texto: 'La escena no continúa hasta que alguien escanee el código y se haga fan de Os Herdeiros.' };
  var ELECCIONES = {
    'Un QR y el público se hace fan': { id: 'demo', demo: true },
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


  // Pausa «Falta un fan»: la película se rompe (glitch + aviso de sistema) y no sigue hasta que alguien escanee el QR y se haga fan de verdad.
  // El servidor de la presentación (/fans-contador) dice cuántos fans tiene la banda; cuando sube, la película avanza. Si no hay contador
  // (en local, o sin red), se sigue con el botón «Ya estoy dentro» y, a los 25 s, «Seguir sin entrar».
  var pausaQR = function (idx, siguiente, saltar) {
    var el = document.createElement('div'); el.id = 'demo-qr'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', DEMO.titulo);
    el.innerHTML = '<i class="dq-glitch" aria-hidden="true"></i><div class="dq-caja"><img class="dq-qr" src="img/qr-fans.png" alt="QR de fans de Os Herdeiros do Código"><div class="dq-txt"><b class="dq-sis">Fallo de reproducción</b><h2></h2><p></p><q></q><small></small><em class="dq-esp"></em><button type="button" class="dq-ok" hidden>Ya estoy dentro →</button><button type="button" class="dq-sin">Seguir sin entrar</button></div></div>';
    var h2 = el.querySelector('h2'), p = el.querySelector('p'), q = el.querySelector('q'), esp = el.querySelector('.dq-esp'), ok = el.querySelector('.dq-ok'), sin = el.querySelector('.dq-sin');
    h2.textContent = DEMO.titulo; p.textContent = DEMO.texto; el.querySelector('small').textContent = 'bandmanager.io/unete';
    var base = null, vivo = true;
    var contar = function () { return fetch('fans-contador', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { return j && Number.isInteger(j.total) ? j.total : null; }, function () { return null; }); };
    var fin = function () { vivo = false; clearInterval(sondeo); clearTimeout(tarde); removeEventListener('keydown', teclas, true); clearInterval(vigila); el.remove(); };
    var sigue = function () { if (!vivo) return; fin(); hechas.demo = true; saltar(siguiente); };
    var teclas = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); sigue(); } };
    var hecho = function (n) {
      vivo = false; clearInterval(sondeo); el.classList.add('dq-listo');
      h2.textContent = 'Fan nº ' + n; p.textContent = 'Bienvenido, Brais. Ahora sí.'; q.textContent = ''; esp.textContent = ''; ok.hidden = true; sin.hidden = true;
      setTimeout(function () { vivo = true; sigue(); }, 2600);
    };
    var sondeo = setInterval(function () { if (!vivo) return; contar().then(function (t) { if (vivo && base !== null && t !== null && t > base) hecho(t); }); }, 2500);
    var tarde = setTimeout(function () { sin.classList.add('on'); }, 25000);
    ok.addEventListener('click', sigue); sin.addEventListener('click', sigue);
    var vigila = setInterval(function () { if (D().cur !== idx) fin(); }, 400);
    document.getElementById('stage').appendChild(el);
    addEventListener('keydown', teclas, true);
    contar().then(function (t) {
      base = t;
      if (t === null) { ok.hidden = false; esp.textContent = 'Cuando estés dentro, pulsa el botón.'; q.textContent = '«Brais, faltas tú.» — Iago'; sin.classList.add('on'); return; }
      q.textContent = '«Brais, no mires el reloj. Somos ' + t + ' fans… y el ' + (t + 1) + ' estás sentado ahí.» — Iago';
      esp.textContent = 'Esperando al fan nº ' + (t + 1) + '…';
    });
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
