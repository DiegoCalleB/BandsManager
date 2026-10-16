/* Volver al inicio de «Netflix» y anuncios de BandManager.io: al acabar la película hay un botón para regresar a la pantalla de
   inicio (recarga con ?inicio=1 y salta el «¿quién está viendo?»), y el inicio lleva una fila de anuncios al estilo de «Juegos»
   de Netflix, con un acceso fijo a la app en la barra superior. Sale de cine.js para no pasar de 600 líneas. */
(function () {
  'use strict';
  var WEB = 'https://bandmanager.io';
  // [icono SVG (trazo), nombre, subtítulo, colores del degradado, captura de fondo, encuadre]
  var ICONOS = {
    swap: '<path d="M17 3l4 4-4 4M21 7H8a4 4 0 00-4 4M7 21l-4-4 4-4M3 17h13a4 4 0 004-4"/>',
    amigas: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 14.2c2.7 0 4.5 2 4.5 5"/>',
    reels: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M3 9h18M9 3l3 6M15 3l3 6"/><path d="M10 13.5l4.5 2.5-4.5 2.5z"/>',
    dossier: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
    setlist: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
    tour: '<path d="M2 16V8a2 2 0 012-2h9l5 5h3a1 1 0 011 1v4"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 17h6M2 16h3"/>'
  };
  var ANUNCIOS = [
    ['swap', 'Date Swap', 'Booking · cambia fechas con otra banda', '#6a2bff,#ff4f9a', 'img/d-h-swap.jpg', '50% 55%', '260%'],
    ['amigas', 'Bandas amigas', 'Comunidad · cartel doble', '#007f6e,#2fd6a0', 'img/d-h-amigas.jpg', '50% 40%', '240%'],
    ['reels', 'Reels Center', 'Promoción · del directo al reel', '#e8402a,#ffa940', 'img/d-h-reels.jpg', '84% 55%', '420%'],
    ['dossier', 'Dossier (EPK)', 'Booking · el PDF que contestan', '#1f55e8,#5cc8ff', 'img/d-h-dossier-top.jpg', '50% 30%', '240%'],
    ['setlist', 'Setlist inteligente', 'Música · repertorio con IA', '#9a1fe0,#ff5fc8', 'img/d-h-repertorio.jpg', '50% 50%', '260%'],
    ['tour', 'Tour Manager', 'Giras · con la gasolina calculada', '#d98a00,#ff6a2f', 'img/d-h-giras-coches.jpg', '50% 50%', '260%']
  ];
  var cerrado = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  // Fila de anuncios al principio de las filas del inicio, y acceso fijo en la barra superior
  var mas = document.querySelector('#gate .nx-mas');
  if (mas) {
    var fila = document.createElement('div'); fila.className = 'nx-filas2 nx-ads';
    fila.innerHTML = '<h3>Juega con tu banda <span class="nx-ad-chip">Anuncio · BandManager.io</span></h3><div class="nx-games">' +
      ANUNCIOS.map(function (a) {
        return '<a class="nx-game" href="' + WEB + '" target="_blank" rel="noopener"><i style="--c1:' + a[3].split(',')[0] + ';--c2:' + a[3].split(',')[1] + '"><img src="img/logo.png" alt=""><svg viewBox="0 0 24 24" aria-hidden="true">' + ICONOS[a[0]] + '</svg></i><b>' + cerrado(a[1]) + '</b><small>' + cerrado(a[2]) + '</small><span>Probar gratis</span></a>';
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
