/* Volver al inicio de «Netflix» y anuncios de BandManager.io: al acabar la película hay un botón para regresar a la pantalla de
   inicio (recarga con ?inicio=1 y salta el «¿quién está viendo?»), y el inicio lleva una fila de anuncios al estilo de «Juegos»
   de Netflix, con un acceso fijo a la app en la barra superior. Sale de cine.js para no pasar de 600 líneas. */
(function () {
  'use strict';
  var WEB = 'https://bandmanager.io/tfm'; // landing del TFM
  // [icono SVG (trazo), nombre, subtítulo, colores del degradado, captura de fondo, encuadre]
  var ICONOS = {
    swap: '<path d="M17 3l4 4-4 4M21 7H8a4 4 0 00-4 4M7 21l-4-4 4-4M3 17h13a4 4 0 004-4"/>',
    amigas: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 14.2c2.7 0 4.5 2 4.5 5"/>',
    reels: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M3 9h18M9 3l3 6M15 3l3 6"/><path d="M10 13.5l4.5 2.5-4.5 2.5z"/>',
    dossier: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
    setlist: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
    tour: '<path d="M2 16V8a2 2 0 012-2h9l5 5h3a1 1 0 011 1v4"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 17h6M2 16h3"/>'
  };
  // Ilustraciones propias (vectoriales) para los juegos que aún no tienen su icono real en img/juegos/: ocupan todo el icono
  var ARTE = {
    'speedy-whales': '<rect width="100" height="100" fill="#d4efec"/><path d="M0 62q8-6 16 0t16 0 16 0 16 0 16 0 16 0 4-2v40H0z" fill="#7cc7c9"/><path d="M0 74q8-6 16 0t16 0 16 0 16 0 16 0 16 0 4-2v28H0z" fill="#5da3b0"/><path d="M20 56q0-22 22-22h18q20 0 20 22v4q0 12-14 12H36q-16 0-16-16z" fill="#fff"/><path d="M26 50q-14-2-17-16 12-2 20 8z" fill="#fff"/><circle cx="72" cy="52" r="2.6" fill="#5da3b0"/><path d="M44 34q-2-10 6-14M52 34q0-9 8-11" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none"/>',
    'tiny-pirates': '<rect width="100" height="100" fill="#9bd9f0"/><circle cx="20" cy="22" r="8" fill="#fff"/><circle cx="30" cy="25" r="7" fill="#fff"/><circle cx="76" cy="18" r="7" fill="#fff"/><circle cx="85" cy="21" r="6" fill="#fff"/><path d="M0 66q8-6 16 0t16 0 16 0 16 0 16 0 16 0 4-2v36H0z" fill="#3f9dc0"/><path d="M26 64h48l-8 14H34z" fill="#8a5a2b"/><path d="M50 62V28" stroke="#4a2f14" stroke-width="3"/><path d="M52 30h20v22H52z" fill="#fff"/><rect x="26" y="26" width="22" height="18" rx="2" fill="#111"/><circle cx="37" cy="33" r="3.4" fill="#fff"/><path d="M31 38l12 4M43 38l-12 4" stroke="#fff" stroke-width="2"/><circle cx="73" cy="66" r="5" fill="#111"/>',
    'flappy-bird': '<rect width="100" height="100" fill="#4ec0ca"/><rect x="62" y="64" width="22" height="40" rx="3" fill="#74bf2e"/><rect x="58" y="60" width="30" height="12" rx="3" fill="#8fdc4f"/><path d="M0 84h100v16H0z" fill="#ded895"/><path d="M0 84h100v5H0z" fill="#8fdc4f"/><ellipse cx="42" cy="46" rx="22" ry="17" fill="#f8d12f"/><path d="M60 44l16 4-16 6z" fill="#f08a1e"/><ellipse cx="50" cy="38" rx="8" ry="9" fill="#fff"/><circle cx="52" cy="38" r="3.4" fill="#111"/><path d="M26 48q8-8 18 0-8 10-18 0z" fill="#fff6c8"/>',
    'scroll-challenge': '<rect width="100" height="100" fill="#14122b"/><circle cx="50" cy="50" r="42" fill="#ff3d71" opacity=".25"/><rect x="30" y="12" width="40" height="76" rx="9" fill="#10243a" stroke="#34d4ff" stroke-width="3"/><path d="M50 62V32M40 42l10-11 10 11" stroke="#34d4ff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M58 70q6-16 16-14t4 14-12 16z" fill="#f4b183"/>'
  };
  var ANUNCIOS = [
    ['swap', 'Date Swap', 'Booking · cambia fechas con otra banda', '#6a2bff,#ff4f9a', 'img/d-h-swap.jpg', '50% 40%', '150%'],
    ['amigas', 'Bandas amigas', 'Comunidad · cartel doble', '#007f6e,#2fd6a0', 'img/d-h-amigas.jpg', '50% 25%', 'cover'],
    ['reels', 'Reels Center', 'Promoción · del directo al reel', '#e8402a,#ffa940', 'img/d-h-reels.jpg', '92% 40%', '170%'],
    ['dossier', 'Dossier (EPK)', 'Booking · el PDF que contestan', '#1f55e8,#5cc8ff', 'img/d-h-dossier-top.jpg', '50% 20%', 'cover'],
    ['setlist', 'Setlist inteligente', 'Música · repertorio con IA', '#9a1fe0,#ff5fc8', 'img/d-h-repertorio.jpg', '50% 30%', '135%'],
    ['tour', 'Tour Manager', 'Giras · con la gasolina calculada', '#d98a00,#ff6a2f', 'img/d-h-giras-coches.jpg', '50% 40%', 'cover']
  ];
  var cerrado = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  // Fila de anuncios al principio de las filas del inicio, y acceso fijo en la barra superior
  var mas = document.querySelector('#gate .nx-mas');
  if (mas) {
    var fila = document.createElement('div'); fila.className = 'nx-filas2 nx-ads';
    fila.innerHTML = '<h3>Juega con tu banda <span class="nx-ad-chip">Anuncio · BandManager.io</span></h3><div class="nx-games">' +
      ANUNCIOS.map(function (a) {
        return '<a class="nx-game" href="' + WEB + '" target="_blank" rel="noopener"><i class="foto" style="--c1:' + a[3].split(',')[0] + ';--c2:' + a[3].split(',')[1] + ';background-image:url(' + a[4] + ');background-position:' + a[5] + ';background-size:' + a[6] + '"><img src="img/logo.png" alt=""></i><b>' + cerrado(a[1]) + '</b><small>' + cerrado(a[2]) + '</small><span>Probar gratis</span></a>';
      }).join('') + '</div>';
    mas.insertBefore(fila, mas.firstChild);
  }
  // Top 10 en Monforte de Lemos: las cuatro últimas son películas gallegas inventadas (pósters tipográficos), y una fila de recomendados
  var POSTERS = [
    ['Pulpo a feira 2: la venganza del cachelo', '#8a1c1c,#ff7a3c'],
    ['Terminator: hasta la queimada, baby', '#1b2a49,#4a7bd0'],
    ['Padrón non pica', '#0f5a2a,#7fd04a'],
    ['Mamma Mía, qué lacón', '#5b1f6e,#ff7eb3']
  ];
  var RECOMENDADAS = [
    ['Fast & Furious: Monforte Drift', 'Acción · Tres bandas, una furgoneta y cero seguros', '#a31515,#ff6a3c'],
    ['El Señor de los Callos', 'Fantasía · Una sola tripa para dominarlos a todos', '#4b2a0b,#d69a3c'],
    ['Queimada Club', 'Thriller · La primera regla: no hablar del orujo', '#1c1033,#7a4bd6'],
    ['Gaiteiros del Caribe', 'Aventura · La maldición del pulpo muerto', '#04435a,#2fc2c9'],
    ['Misión imposible: aparcar en Santiago', 'Acción · Nadie lo ha conseguido', '#2b3a14,#9bd04a'],
    ['La Santa Compaña vs. el Scrum Master', 'Terror · Reuniones diarias a las 3 de la madrugada', '#101a2b,#c0392b'],
    ['Cuatro bodas y un pulpo', 'Comedia romántica · Catering de pulpo á feira', '#7a1f3d,#ff8fa3'],
    ['Matrix: pastilla azul o empanada', 'Ciencia ficción · Elige empanada', '#05260f,#2fcf6a'],
    ['Titanic: se hunde el furgón', 'Drama · Y la banda no cabe en la balsa', '#0b2a4a,#6fb7ff'],
    ['Gladiator: Ultreia', 'Épica · Camino de Santiago, etapa 4', '#5a3a12,#e0b050'],
    ['Jurassic Park: el último percebeiro', 'Aventura · Solo con marea viva', '#0f3d2e,#6fd0a0'],
    ['El día de la marmota (pero en Lugo)', 'Comedia · Sigue lloviendo', '#2c3441,#8fa3bf']
  ];
  var MORRINA = [
    ['Sempre chove en Vilalba', 'Comedia · Paraguas incluido', '#16324f,#4f8fc0'],
    ['Chorizos y cachelos 3', 'Comedia · Ya no queda guion', '#6b1d12,#f08a4b'],
    ['Mi tío el gaiteiro', 'Familiar · Soplaba demasiado', '#3b2a6b,#b48cff'],
    ['Tres lacóns para un destino', 'Aventura · Con grelos', '#134a2b,#8fdc6a'],
    ['A boda do ano en Ourense', 'Romance · Con orquesta de verbena', '#7a2a5a,#ff9ad0'],
    ['Operación orujo', 'Acción · Que no se entere el abuelo', '#5a1a1a,#ff5a3c'],
    ['La gran evasión de la rotonda de Lalín', 'Suspense · Todavía están dando vueltas', '#2b2b2b,#9a9a9a'],
    ['El club de los poetas sin cobertura', 'Drama · Aquí no pilla ni el WhatsApp', '#1f3a4d,#5fb8c9'],
    ['El exorcista: la queimada se fue de las manos', 'Terror · Con conxuro y todo', '#240a0a,#e04a2a'],
    ['Origen: soñar con cobrar el día 1', 'Ciencia ficción · Imposible, pero bonito', '#10124a,#7a6bff'],
    ['Hasta la vista, vermú', 'Comedia · Volveré después del aperitivo', '#6a4a10,#ffcf5a'],
    ['Cuarenta y tres grados en la Ribeira Sacra', 'Documental · Nadie baja a la playa fluvial', '#5a2a0a,#ff9a3c']
  ];
  var top = document.querySelector('#gate .nx-row.top');
  if (top) {
    var h = top.parentNode.querySelector('h3'); if (h) h.textContent = 'Top 10 en Monforte de Lemos hoy';
    var n0 = top.querySelectorAll('.nx-top-c').length;
    POSTERS.forEach(function (p, k) {
      var c = document.createElement('div'); c.className = 'nx-top-c';
      c.innerHTML = '<span class="nx-num">' + (n0 + k + 1) + '</span><div class="nx-card k fake" style="--c1:' + p[1].split(',')[0] + ';--c2:' + p[1].split(',')[1] + '"><i>N</i><b>' + cerrado(p[0]) + '</b></div>';
      top.appendChild(c);
    });
  }
  var filaPelis = function (titulo, lista) {
    var d = document.createElement('div'); d.className = 'nx-filas2';
    d.innerHTML = '<h3>' + cerrado(titulo) + '</h3><div class="nx-row">' + lista.map(function (r) {
      return '<div class="nx-card k fake" style="--c1:' + r[2].split(',')[0] + ';--c2:' + r[2].split(',')[1] + '"><i>N</i><b>' + cerrado(r[0]) + '</b><span class="nx-mini"><b>97 % para ti</b> ' + cerrado(r[1]) + '</span></div>';
    }).join('') + '</div>';
    return d;
  };
  if (mas) {
    var rec = filaPelis('Porque viste Os Herdeiros do Código', RECOMENDADAS), ads = mas.querySelector('.nx-ads');
    mas.insertBefore(rec, ads ? ads.nextSibling : mas.firstChild);
    mas.appendChild(filaPelis('Comedias con morriña', MORRINA));
  }
  // Fila «Juegos y apps» (antes «Juegos móviles»): el juego de Diego (Scroll Challenge, con su enlace de Google Play) y las apps de MoureDev. Cada una abre su ficha; el icono real, si existe, va en img/juegos/<id>.jpg (o .png)
  // (sin él sale el icono dibujado). Para poner el enlace directo a cada tienda basta cambiar el último campo.
  var PORTFOLIO = 'https://mouredev.com/portfolio/';
  var JUEGOS = [
    ['scroll-challenge', 'Scroll Challenge', 'Juego móvil · Google Play', '#ff3d71,#ffb142', 'juego', 'https://play.google.com/store/apps/details?id=com.scrollchallenge.game'],
    ['flappy-bird', 'Flappy Bird', 'Autor: Brais Moure* (*no, pero le habría encantado)', '#1e90d8,#8fdc4f', 'pajaro', PORTFOLIO],
    ['chimpy-jump', 'Chimpy Jump', 'Juego móvil · salta, mono, salta · Google Play', '#4caf50,#b6e08a', 'juego', 'https://play.google.com/store/apps/details?id=com.braismoure.ChimpyJump&hl=es'],
    ['speedy-whales', 'Speedy Whales', 'Juego móvil · ballenas con prisa · App Store', '#2f8f9a,#9fe0dc', 'juego', 'https://itunes.apple.com/es/app/speedy-whales/id1065767426?mt=8'],
    ['tiny-pirates', 'Tiny Pirates', 'Juego móvil · cañonazos y mar · App Store', '#1c9bd0,#8fd8f0', 'juego', 'https://itunes.apple.com/us/app/tiny-pirates!-pirate-cannons/id1055590186?l=es&ls=1&mt=8'],
    ['wookieator', 'Wookieator', 'App móvil · el traductor wookiee · App Store', '#c99a1c,#2a2a2a', 'app', 'https://itunes.apple.com/lr/app/wookieator-the-wookiee-translator/id919286486?mt=8'],
    ['tpcast', 'TP Cast', 'App móvil · Todopoderosos', '#d8c000,#222', 'app', 'https://tpcast.app/'],
    ['pumpkin', 'Pumpkin', 'App móvil · para socios de Pilbeo · Google Play', '#f0a020,#555', 'app', 'https://play.google.com/store/apps/details?id=com.pilbeo.pilbeo_pumpkin_android&hl=es'],
    ['pilbeo', 'Pilbeo', 'App móvil · Camino de Santiago', '#f0b030,#4a9a3a', 'app', PORTFOLIO],
    ['silvestre', 'Silvestre', 'App web · reservas y carta del restaurante', '#1a1a1a,#c8a64b', 'app', 'https://restaurantes-silvestre.up.railway.app/']
  ];
  ICONOS.juego = '<rect x="2" y="7" width="20" height="11" rx="5.5"/><path d="M7 10.5v4M5 12.5h4"/><circle cx="16" cy="11.5" r=".6"/><circle cx="18.2" cy="13.8" r=".6"/>';
  ICONOS.pajaro = '<ellipse cx="11" cy="13" rx="7" ry="5.5"/><circle cx="14" cy="11" r="1"/><path d="M18 13l3.5 1.2-3.5 1.4M8 13c1.5 2 4 2 5 0M6 17.5l-2 2.5M10 18.5l-1 2.5"/>';
  ICONOS.app = '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>';
  if (mas) {
    var jg = document.createElement('div'); jg.className = 'nx-filas2 nx-ads';
    jg.innerHTML = '<h3>Juegos y apps <span class="nx-ad-chip">Android · iOS · Web</span></h3><div class="nx-games">' + JUEGOS.map(function (g) {
      return '<a class="nx-game" href="' + g[5] + '" target="_blank" rel="noopener"><i style="--c1:' + g[3].split(',')[0] + ';--c2:' + g[3].split(',')[1] + '"' + (ARTE[g[0]] ? ' class="arte"><svg viewBox="0 0 100 100" aria-hidden="true">' + ARTE[g[0]] : '><svg viewBox="0 0 24 24" aria-hidden="true">' + ICONOS[g[4]]) + '</svg><img class="nx-gicono" src="img/juegos/' + g[0] + '.jpg" alt="" onerror="if(!this.dataset.r){this.dataset.r=1;this.src=this.src.replace(\'.jpg\',\'.png\')}else this.remove()"></i><b>' + cerrado(g[1]) + '</b><small>' + cerrado(g[2]) + '</small><span>Obtener</span></a>';
    }).join('') + '</div>';
    var ads0 = mas.querySelector('.nx-ads'); mas.insertBefore(jg, ads0 ? ads0.nextSibling : mas.firstChild);
  }
  var der = document.querySelector('#gate .nx-der');
  if (der) { var bm = document.createElement('a'); bm.className = 'nx-bm'; bm.href = WEB; bm.target = '_blank'; bm.rel = 'noopener'; bm.textContent = 'Pruébalo con tu banda · BandManager.io'; der.insertBefore(bm, der.firstChild); }

  // Flechas para desplazar cada fila de lado a lado (como en Netflix; con el ratón solo no se puede ir hacia el lado)
  document.querySelectorAll('#gate .nx-filas2').forEach(function (bloque) {
    var row = bloque.querySelector('.nx-row, .nx-games'); if (!row) return;
    bloque.classList.add('con-flechas');
    [['ant', '‹', -1], ['sig', '›', 1]].forEach(function (f) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'nx-flecha-fila ' + f[0]; b.setAttribute('aria-label', f[0] === 'ant' ? 'Anterior' : 'Siguiente'); b.textContent = f[1];
      b.addEventListener('click', function () { row.scrollBy({ left: f[2] * row.clientWidth * 0.85, behavior: 'smooth' }); });
      bloque.appendChild(b);
    });
  });

  // Botón «Inicio» en la pantalla final
  var fin = document.getElementById('nf-fin'), otra = fin && fin.querySelector('.nff-otra');
  if (otra) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'nff-inicio'; b.textContent = '⌂ Volver al inicio';
    b.addEventListener('click', function () { location.href = location.pathname + '?inicio=1'; });
    otra.parentNode.insertBefore(b, otra.nextSibling);
  }

  // Al volver al inicio no se elige perfil otra vez: directo al inicio con todas las filas (y el tráiler arrancando como siempre)
  if (/[?&]inicio=1/.test(location.search)) {
    try { history.replaceState(null, '', location.pathname); } catch (_e) { /* sin history */ }
    var puerta = document.getElementById('gate');
    if (puerta) {
      puerta.dataset.fase = 'home';
      var trailer = puerta.querySelector('.nx-vid');
      if (trailer) setTimeout(function () { trailer.play().then(function () { puerta.classList.add('trailer'); }).catch(function () { /* sin autoplay */ }); }, 2600);
      var reproducir = document.getElementById('gatePeli'); if (reproducir) reproducir.focus({ preventScroll: true });
    }
  }
})();
