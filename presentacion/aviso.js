/* Aviso real de «Alguien está viendo tu TFM»: en la escena «El reloj» (la notificación sale en pantalla a los 11,6 s) la presentación
   pide a /aviso que mande UN correo, para que llegue justo entonces. El servidor (aviso/servidor.mjs) está APAGADO salvo que se active a
   propósito con variables de entorno, así que aquí nunca hay que preocuparse de enviar «antes de tiempo». Solo en la web publicada
   (https, no localhost), solo en modo película y una vez por pestaña; con ?sinaviso no hace nada. */
(function () {
  'use strict';
  var ESCENA = 'El reloj', RETRASO = 8500, CLAVE = 'bm_aviso';
  if (location.protocol !== 'https:' || /^(localhost|127\.|\[::1\])/.test(location.hostname) || /[?&]sinaviso/.test(location.search)) return;
  var visto = 0, hecho = false;
  try { hecho = sessionStorage.getItem(CLAVE) === '1'; } catch (_e) { /* sin almacenamiento: puede repetirse en esta pestaña */ }
  setInterval(function () {
    if (hecho) return;
    var sl = document.querySelector('.slide.active'), b = document.body;
    var aqui = sl && sl.dataset.title === ESCENA && b.classList.contains('pelicula') && !b.classList.contains('scroll') && !b.classList.contains('pausado');
    if (!aqui) { visto = 0; return; }
    if (!visto) visto = Date.now();
    if (Date.now() - visto < RETRASO) return;
    hecho = true;
    try { sessionStorage.setItem(CLAVE, '1'); } catch (_e) { /* nada */ }
    fetch('/aviso', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ escena: ESCENA }), keepalive: true }).catch(function () { /* sin servidor: no pasa nada */ });
  }, 1000);
})();
