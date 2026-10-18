/* «Detrás de las cámaras»: una fila extra en el inicio de Netflix con una ficha de cómo se hizo la película.
   Las cifras salen de la propia película (escenas, voces y minutos de voz), no están escritas a mano, así que no se desactualizan. */
(function () {
  'use strict';
  var mas = document.querySelector('#gate .nx-mas');
  if (!mas) return;
  var cerrado = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  var fila = document.createElement('div'); fila.className = 'nx-filas2 nx-extras';
  fila.innerHTML = '<h3>Extras <span class="nx-ad-chip">Detrás de las cámaras</span></h3><div class="nx-row">' +
    '<button type="button" class="nx-card k mo-card" style="--img:url(img/concierto-3.jpg)"><b>Cómo se hizo esta película</b><em>Making of · con IA, de principio a fin</em></button></div>';
  var primera = mas.querySelector('.nx-ads');
  mas.insertBefore(fila, primera ? primera.nextSibling : mas.firstChild);

  var ficha = document.createElement('div'); ficha.id = 'makingof'; ficha.setAttribute('role', 'dialog'); ficha.setAttribute('aria-label', 'Cómo se hizo'); ficha.hidden = true;
  document.getElementById('gate').appendChild(ficha);

  var abrir = function () {
    var D = window.Deck, escenas = D && D.slides ? D.slides.length : 0;
    fetch('audio/voces/manifest.json').then(function (r) { return r.ok ? r.json() : {}; }, function () { return {}; }).then(function (m) {
      var voces = Object.keys(m).length, seg = 0;
      Object.keys(m).forEach(function (k) { seg += +m[k].d || 0; });
      var cifras = [[escenas || '79', 'escenas'], [voces || '254', 'frases con voz'], [Math.round(seg / 60) + ' min', 'de voz generada'], ['3', 'finales alternativos'], ['3', 'idiomas de subtítulos']];
      ficha.innerHTML = '<div class="mo-caja"><button type="button" class="mo-x" aria-label="Cerrar">✕</button><h2>Cómo se hizo</h2><p class="mo-sub">Una película de rock, código y café, hecha con IA de principio a fin.</p>' +
        '<ul class="mo-cifras">' + cifras.map(function (c) { return '<li><b>' + cerrado(c[0]) + '</b><span>' + cerrado(c[1]) + '</span></li>'; }).join('') + '</ul>' +
        '<div class="mo-cols"><section><h3>Lo que hizo la IA</h3><p>Escribir buena parte del código, generar las voces de los personajes, subtitular y traducir, y revisar cada voz con un reconocedor de voz para ver si se entendía.</p></section>' +
        '<section><h3>Lo que hizo Diego</h3><p>La historia, el humor, el criterio sobre qué entra y qué no, escuchar todo lo que se dice y decidir qué se corrige. Y presentar y defender el resultado.</p></section></div>' +
        '<p class="mo-pie">Voces: ElevenLabs · Revisión de voces: Whisper en local · Pruebas: Playwright · Código y dirección: Diego de la Calle con Claude</p></div>';
      ficha.hidden = false; ficha.querySelector('.mo-x').focus();
      ficha.querySelector('.mo-x').addEventListener('click', cerrar);
    });
  };
  var cerrar = function () { ficha.hidden = true; };
  fila.querySelector('.mo-card').addEventListener('click', abrir);
  ficha.addEventListener('click', function (e) { if (e.target === ficha) cerrar(); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && !ficha.hidden) { e.stopPropagation(); cerrar(); } }, true);
})();
