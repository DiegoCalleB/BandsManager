/* Elige tu propia aventura (como «Black Mirror: Bandersnatch»): al acabar ciertas escenas la película se para y pregunta.
   Hay 10 s para elegir (si no, sigue la opción de siempre), y las ramas alternativas son cartas de texto con una vuelta atrás.
   deck.js llama a Eleccion.desvia(escena, siguiente, saltar) cuando una escena de la película acaba: si devuelve true, aquí mandan las
   elecciones hasta llamar a saltar(índice). Solo en modo película; con el teclado: 1-3 o flechas + Intro. */
(function () {
  'use strict';
  var SEGUNDOS = 10;
  // Pausa «Entra tú también»: la película espera, con un QR en pantalla, hasta que pulsan «Ya estoy dentro». El QR (img/qr-fans.png, con el logo
  // de Os Herdeiros) se genera con tools/qr_demo.py --hdc y tiene que apuntar a https://bandmanager.io/unete?b=t_AAAAAEAOHUwPAAA7FgwRGgFIOxxMDxs7W1dd. Es la página pública de fans (/unete) de la banda real «Os Herdeiros
  // do Código» (band-os-herdeiros-do-codigo): el único QR que escanea Brais, y el mismo que sale en «Un QR y el público se hace fan».
  var DEMO = { titulo: 'Falta un fan', texto: 'La escena no continúa hasta que alguien escanee el código y se haga fan de Os Herdeiros.' };
  // Cada elección: la primera opción es la de siempre (la que sigue la historia, y la que se toma si nadie responde). Una opción con `final`
  // es un final alternativo: cartas de texto, «Fin», rebobinado y vuelta a la misma decisión con esa opción ya marcada como vista.
  var ELECCIONES = {
    'Prólogo · La llamada': {
      id: 'pelaez', pregunta: 'Peláez les ofrece llevarles los bolos por el 30 %. ¿Qué hace la banda?',
      opciones: [
        { t: 'No firmar nada' },
        { t: 'Aceptar el 30 %', final: true, carta: ['La banda aceptó el treinta por ciento.', 'Peláez eligió el repertorio. Fuera baladas.', 'Fuera también las birras.', 'En verano, Os Herdeiros do Código dejó de existir.', 'Fin.'], ms: 10600 },
      ],
    },
    'Entrevista · El treinta por ciento': {
      id: 'master', pregunta: 'Iago lleva semanas dudando. ¿Se apunta al máster de Desarrollo con IA de The Big School?',
      opciones: [
        { t: 'Sí, me apunto' },
        { t: 'No, paso', final: true, carta: ['Iago no se apuntó al máster.', 'Sin proyecto, no hubo aplicación.', 'Sin aplicación, el sábado siguió sin respuesta.', 'La sala del catorce nunca contestó.', 'Os Herdeiros do Código se separó en octubre.', 'Fin.'], ms: 12200 },
      ],
    },
    'Capítulo 5 · Cómo lo hacemos': {
      id: 'marketing', pregunta: 'La app ya funciona, pero no la conoce nadie. ¿Iago se apunta también al máster de Marketing Digital?',
      opciones: [
        { t: 'Sí, otro máster' },
        { t: 'No, ya tengo bastante', final: true, carta: ['Sin marketing, nadie conoció BandManager.', 'La mejor aplicación para bandas, en un cajón.', 'Ninguna banda la descargó.', 'Ni siquiera Peláez.', 'Fin.'], ms: 10800 },
      ],
    },
    'Un QR y el público se hace fan': { id: 'demo', demo: true },
    'La invitación': {
      id: 'invitacion', pregunta: 'Brais, ¿qué respondes?',
      opciones: [
        { t: 'Sí, me uno' },
        { t: 'Déjame pensarlo', carta: ['Sin prisa, Brais.', 'La invitación sigue en pie.', 'Pero el sábado hay ensayo.'], ms: 7500, vuelve: true },
        { t: 'Los miércoles libro', carta: ['Perfecto.', 'Los sábados, Os Herdeiros do Código.', 'Los miércoles, Master of Prompts.', 'Y BandManager te avisa cuando se pisen.'], ms: 10000 },
      ],
    },
  };
  var TOTAL_FINALES = 3, finales = {};
  var hechas = {}, activa = null;
  var D = function () { return window.Deck; };

  var cierra = function () { document.body.classList.remove('eligiendo'); if (activa) { clearInterval(activa.reloj); activa.el.remove(); activa = null; } };
  var carta = function (lineas, ms, fin) {
    var c = document.createElement('div'); c.id = 'eleccion-carta'; c.setAttribute('role', 'status');
    c.innerHTML = lineas.map(function (l, i) { return '<p style="--d:' + (0.5 + i * 1.7) + 's"></p>'; }).join('');
    [].forEach.call(c.querySelectorAll('p'), function (p, i) { p.textContent = lineas[i]; });
    document.getElementById('stage').appendChild(c);
    setTimeout(function () { c.remove(); fin(); }, ms);
  };
  // Rebobinado tras un final alternativo: franjas de vídeo viejo, «⏪» y vuelta a la decisión
  var rebobina = function (fin) {
    var r = document.createElement('div'); r.id = 'eleccion-rebobina'; r.setAttribute('role', 'status');
    r.innerHTML = '<i aria-hidden="true">◀◀</i><b>Volviendo a la decisión</b>';
    document.getElementById('stage').appendChild(r);
    setTimeout(function () { r.remove(); fin(); }, 2100);
  };

  // Pausa «Falta un fan»: la película se rompe (glitch + aviso de sistema) y no sigue hasta que alguien escanee el QR y se haga fan de verdad.
  // El servidor de la presentación (/fans-contador) dice cuántos fans tiene la banda; cuando sube, la película avanza. Si no hay contador
  // (en local, o sin red), se sigue con el botón «Ya estoy dentro» y, a los 6 s, «Seguir sin entrar».
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
    var tarde = setTimeout(function () { sin.classList.add('on'); }, 6000);
    // «Seguir sin entrar»: reacción amable y con guasa antes de continuar
    var sinFan = function () {
      if (!vivo) return;
      vivo = false; clearInterval(sondeo); clearTimeout(tarde); el.classList.add('dq-sinfan');
      el.querySelector('.dq-sis').textContent = 'Reproducción restablecida';
      h2.textContent = 'Sin problema, Brais'; p.textContent = 'Aquí nadie se hace fan a la fuerza. La plaza nº ' + (base !== null ? base + 1 : 'del fan') + ' queda reservada a tu nombre.';
      q.textContent = '«Tranquilo. El QR no caduca. Tú, tampoco.» — Iago'; esp.textContent = 'Seguimos. Pero te estamos mirando 👀'; ok.hidden = true; sin.hidden = true;
      setTimeout(function () { vivo = true; sigue(); }, 4200);
    };
    ok.addEventListener('click', sigue); sin.addEventListener('click', sinFan);
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
    var el = document.createElement('div'); el.id = 'eleccion'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', cfg.pregunta);
    el.innerHTML = '<p class="el-q"></p><div class="el-ops"></div><i class="el-tiempo"></i><small class="el-fin"></small>';
    el.querySelector('.el-q').textContent = quitadas.length ? 'Vuelve a elegir. ' + cfg.pregunta : cfg.pregunta;
    var n = Object.keys(finales).length;
    if (n) el.querySelector('.el-fin').textContent = 'Finales encontrados: ' + n + ' de ' + TOTAL_FINALES;
    var caja = el.querySelector('.el-ops'), tiempo = el.querySelector('.el-tiempo');
    var libres = cfg.opciones.filter(function (o) { return quitadas.indexOf(o) < 0; });
    var elige = function (op) {
      if (!activa) return;
      cierra(); removeEventListener('keydown', teclas, true);
      var fin = function () {
        if (op.final) { finales[cfg.id] = true; rebobina(function () { pregunta(idx, cfg, quitadas.concat(op), siguiente, saltar); }); }
        else if (op.vuelve) pregunta(idx, cfg, quitadas.concat(op), siguiente, saltar);
        else { hechas[cfg.id] = true; saltar(siguiente); }
      };
      if (op.carta) carta(op.carta, op.ms, fin); else fin();
    };
    var teclas = function (e) {
      var k = e.key, i = parseInt(k, 10) - 1;
      if (i >= 0 && cfg.opciones[i] && quitadas.indexOf(cfg.opciones[i]) < 0) { e.preventDefault(); e.stopPropagation(); elige(cfg.opciones[i]); }
      else if (k === 'Enter') { e.preventDefault(); e.stopPropagation(); elige(libres[0]); }
    };
    cfg.opciones.forEach(function (op, i) {
      var visto = quitadas.indexOf(op) >= 0;
      var b = document.createElement('button'); b.type = 'button'; b.className = 'el-op' + (visto ? ' el-visto' : ''); b.disabled = visto;
      b.innerHTML = '<kbd></kbd><span></span>'; b.querySelector('kbd').textContent = String(i + 1); b.querySelector('span').textContent = op.t + (visto ? ' · final visto' : '');
      if (!visto) { b.addEventListener('click', function () { elige(op); }); if (op === libres[0]) setTimeout(function () { b.focus({ preventScroll: true }); }, 50); }
      caja.appendChild(b);
    });
    document.getElementById('stage').appendChild(el); document.body.classList.add('eligiendo');
    addEventListener('keydown', teclas, true);
    var t0 = performance.now();
    activa = { el: el, reloj: setInterval(function () {
      var k = Math.min(1, (performance.now() - t0) / (SEGUNDOS * 1000));
      tiempo.style.setProperty('--k', String(1 - k));
      if (D().cur !== idx) { cierra(); removeEventListener('keydown', teclas, true); }   // si saltan de escena, se cancela
      else if (k >= 1) elige(libres[0]);                                                  // sin respuesta: la de siempre
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
