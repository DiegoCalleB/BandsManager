/* Entrada «como la tele»: perfil enfocado (flechas arriba/abajo, ratón o táctil), ilustración de fondo que cambia con el perfil,
   rayos de colores en el ident y el N con rueda de carga al elegir. La elección en sí (aInicio) sigue en deck.js. */
(function () {
  'use strict';
  var gate = document.getElementById('gate');
  var perfiles = gate ? [].slice.call(gate.querySelectorAll('.nx-perfil')) : [];
  var enfoca = function (b) {
    perfiles.forEach(function (p) { p.classList.toggle('sel', p === b); });
    [].forEach.call(gate.querySelectorAll('.tv-arte i'), function (i) { i.classList.toggle('on', i.dataset.p === b.dataset.p); });
  };
  if (perfiles.length) {
    perfiles.forEach(function (b) {
      b.addEventListener('mouseenter', function () { enfoca(b); });
      b.addEventListener('focus', function () { enfoca(b); });
    });
    enfoca(perfiles[0]);
    gate.addEventListener('keydown', function (e) {
      if (gate.dataset.fase !== 'perfiles') return;
      var i = perfiles.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); e.stopPropagation();
        var n = perfiles[(Math.max(i, 0) + (e.key === 'ArrowDown' ? 1 : perfiles.length - 1)) % perfiles.length];
        n.focus({ preventScroll: true });
      }
    }, true);
  }
  // Rayos de luz del ident: barras verticales de colores que se abren desde el centro
  var ident = document.getElementById('ident');
  if (ident) {
    // Colores por posición, como los rayos del original: cálidos a la izquierda y en el centro, fríos a la derecha
    var paleta = function (x) {
      var cal = ['#ff7a00', '#ffb000', '#ffd23a', '#ff4d2d', '#ff3b7f'], fri = ['#b44bff', '#2f8bff', '#19c7ff', '#1fd1a0', '#3a6bff'];
      var lista = x < 58 ? cal : fri; if (Math.random() < 0.18) lista = cal.concat(fri);
      return lista[Math.floor(Math.random() * lista.length)];
    };
    var rayos = '';
    for (var k = 0; k < 90; k++) {
      var x = 10 + Math.random() * 80, w = 0.2 + Math.random() * 1.3, d = Math.random() * 0.5, v = (x - 50) * 0.5;
      rayos += '<i style="--x:' + x.toFixed(1) + '%;--w:' + w.toFixed(2) + 'vw;--d:' + d.toFixed(2) + 's;--v:' + v.toFixed(1) + 'vw;--r:' + ((x - 50) * 0.12).toFixed(2) + 'deg;--c:' + paleta(x) + '"></i>';
    }
    ident.innerHTML = '<div class="id-rayos" aria-hidden="true">' + rayos + '</div>' +
      '<svg class="id-n" viewBox="0 0 60 100" aria-hidden="true"><path class="n1" d="M0 0h19v98L0 100z"/><path class="n1" d="M41 2L60 0v100H41z"/><path class="n2" d="M0 0h19l41 100H41z"/></svg>';
  }
})();
