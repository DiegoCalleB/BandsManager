/* Volver al inicio de «Netflix» y anuncios de BandManager.io: al acabar la película hay un botón para regresar a la pantalla de
   inicio (recarga con ?inicio=1 y salta el «¿quién está viendo?»), y el inicio lleva una fila de anuncios al estilo de «Juegos»
   de Netflix, con un acceso fijo a la app en la barra superior. Sale de cine.js para no pasar de 600 líneas. */
(function () {
  'use strict';
  var WEB = 'https://bandmanager.io';
  var ANUNCIOS = [
    ['🔁', 'Date Swap', 'Booking · cambia fechas con otra banda', '#7a3cff,#ff5fa2'],
    ['🤝', 'Bandas amigas', 'Comunidad · cartel doble', '#00a88f,#4ee0a8'],
    ['🎬', 'Reels Center', 'Promoción · del directo al reel', '#ff5a3c,#ffb347'],
    ['📄', 'Dossier (EPK)', 'Booking · el PDF que contestan', '#2b6bff,#6fd0ff'],
    ['🎼', 'Setlist inteligente', 'Música · repertorio con IA', '#b02bff,#ff6bd6'],
    ['🚐', 'Tour Manager', 'Giras · con la gasolina calculada', '#e8a100,#ff7a3c']
  ];
  var cerrado = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  // Fila de anuncios al principio de las filas del inicio, y acceso fijo en la barra superior
  var mas = document.querySelector('#gate .nx-mas');
  if (mas) {
    var fila = document.createElement('div'); fila.className = 'nx-filas2 nx-ads';
    fila.innerHTML = '<h3>Juega con tu banda <span class="nx-ad-chip">Anuncio · BandManager.io</span></h3><div class="nx-games">' +
      ANUNCIOS.map(function (a) {
        return '<a class="nx-game" href="' + WEB + '" target="_blank" rel="noopener"><i style="--g:' + a[3] + '">' + a[0] + '</i><b>' + cerrado(a[1]) + '</b><small>' + cerrado(a[2]) + '</small><span>Probar gratis</span></a>';
      }).join('') + '</div>';
    mas.insertBefore(fila, mas.firstChild);
  }
  var der = document.querySelector('#gate .nx-der');
  if (der) { var bm = document.createElement('a'); bm.className = 'nx-bm'; bm.href = WEB; bm.target = '_blank'; bm.rel = 'noopener'; bm.textContent = 'Pruébalo con tu banda · BandManager.io'; der.insertBefore(bm, der.firstChild); }

  // Botón «Inicio» en la pantalla final
  var fin = document.getElementById('nf-fin'), otra = fin && fin.querySelector('.nff-otra');
  if (otra) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'nff-inicio'; b.textContent = '⌂ Volver al inicio';
    b.addEventListener('click', function () { location.href = location.pathname + '?inicio=1'; });
    otra.parentNode.insertBefore(b, otra.nextSibling);
  }

  // Al volver al inicio no hace falta elegir perfil otra vez
  if (/[?&]inicio=1/.test(location.search)) {
    try { history.replaceState(null, '', location.pathname); } catch (e) { /* sin history */ }
    var perfil = document.querySelector('#gate .nx-perfil'); if (perfil) setTimeout(function () { perfil.click(); }, 250);
  }
})();
