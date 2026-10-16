/* En directo, en el local (modo película): ventana de navegador, marco de tele y cuenta atrás sobre las capturas de la app.
   Sale de cine.js para no pasar de 600 líneas; es independiente: solo necesita el DOM y los eventos «voz» y «deckslide». */
(function () {
  var body = document.body, stage = document.getElementById('stage');
  // ── En directo, en el local: los planos de la app son el portátil de Iago puesto en la tele del local de ensayo ──
  // Ventana de navegador (pestaña con la sección y bandmanager.io, el dominio real: la app no tiene una ruta por sección)
  // con marco de tele y el local desenfocado detrás, el aviso «En la tele del local» con la cuenta atrás del cartel, el
  // retrato de quien reacciona (.foco) y un cursor que se mueve y hace clic sobre las capturas fijas.
  // (#llamada, la cuadrícula de caras de videollamada, sigue montada pero oculta: la historia pasa en el local.)
  var MIEMBROS = ['bajo', 'bateria', 'voz', 'guitarra'];
  var directoT0 = 0;
  var mmssD = function (s) { s = Math.max(0, Math.floor(s)); return ('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + s % 60).slice(-2); };
  document.querySelectorAll('.slide.feat .ft-shot:not(.phone)').forEach(function (sh) {
    var sl = sh.closest('.slide'), t = (sl.dataset.title || '').replace(/,.*/, '');
    var b = document.createElement('div'); b.className = 'vent'; b.setAttribute('aria-hidden', 'true');
    b.innerHTML = '<span class="vent-p"><i></i><i></i><i></i></span><span class="vent-tab"><b>BM</b><em></em></span>' +
      '<span class="vent-url"><i>🔒</i>bandmanager.io</span><span class="vent-reloj"></span><span class="vent-vivo"><i></i>En la tele del local · portátil de <b></b></span>';
    b.querySelector('em').textContent = t + ' · BandManager';
    // otra pantalla que no es la de Iago (La invitación: el correo de Brais)
    if (sl.dataset.ventTab) b.querySelector('em').textContent = sl.dataset.ventTab.replace(/\{(\w+)\}/g, function (m, w) { return window.REPARTO && window.REPARTO[w] ? window.REPARTO[w].nombre : m; });
    if (sl.dataset.ventUrl) b.querySelector('.vent-url').lastChild.textContent = sl.dataset.ventUrl;
    var nombres = function (x) { return x.replace(/\{(\w+)\}/g, function (m, w) { return window.REPARTO && window.REPARTO[w] ? window.REPARTO[w].nombre : m; }); };
    if (sl.dataset.ventVivo) b.querySelector('.vent-vivo').innerHTML = '<i></i>' + nombres(sl.dataset.ventVivo);
    sh.insertBefore(b, sh.firstChild);
    if (sh.querySelector('img') && !sh.querySelector('video')) { var c = document.createElement('i'); c.className = 'raton'; c.setAttribute('aria-hidden', 'true'); sh.appendChild(c); }
  });
  var llamada = document.createElement('div'); llamada.id = 'llamada'; llamada.setAttribute('aria-hidden', 'true');
  if (stage) stage.appendChild(llamada);
  var tesela = function (who) {
    var m = window.REPARTO && window.REPARTO[who]; if (!m) return null;
    var d = document.createElement('div'); d.className = 'tesela'; d.dataset.who = who; d.style.setProperty('--c', m.color);
    d.innerHTML = '<img alt=""><span></span><i class="mic"><u></u><u></u><u></u></i>';
    d.querySelector('img').src = m.foto; d.querySelector('span').textContent = m.nombre;
    return d;
  };
  var montarLlamada = function () { if (llamada.childNodes.length) return; MIEMBROS.forEach(function (w) { var t = tesela(w); if (t) llamada.appendChild(t); }); };
  var invitado = function (who) {
    llamada.querySelectorAll('.tesela.invitado').forEach(function (t) { if (t.dataset.who !== who) t.remove(); });
    if (!who || MIEMBROS.indexOf(who) >= 0 || llamada.querySelector('.tesela[data-who="' + who + '"]')) return;
    var t = tesela(who); if (t) { t.classList.add('invitado'); llamada.appendChild(t); }
  };
  var vuRaf = 0;
  var pintarLlamada = function () {
    var sl = document.querySelector('.slide.active');
    var en = !!(sl && sl.classList.contains('feat') && sl.querySelector('.ft-shot:not(.phone)') && body.classList.contains('pelicula') && !body.classList.contains('scroll'));
    body.classList.toggle('compartiendo', en);
    if (!en) return;
    montarLlamada();
    if (!directoT0) directoT0 = Date.now();
    var todas = sl.querySelectorAll('[data-who].habla'), habla = todas[todas.length - 1] || null; // la última que empezó (al solaparse, la nueva)
    if (habla) invitado(habla.dataset.who);
    llamada.querySelectorAll('.tesela').forEach(function (t) { t.classList.toggle('habla', !!habla && t.dataset.who === habla.dataset.who); });
    sl.querySelectorAll('.vent-vivo b').forEach(function (b) { b.textContent = (window.REPARTO && window.REPARTO.bajo && window.REPARTO.bajo.nombre) || 'Iago'; });
    cancelAnimationFrame(vuRaf);
    var t = habla && llamada.querySelector('.tesela[data-who="' + habla.dataset.who + '"]');
    if (t) { var paso = function () { t.style.setProperty('--vu', habla.style.getPropertyValue('--vu') || '0'); if (habla.classList.contains('habla')) vuRaf = requestAnimationFrame(paso); }; paso(); }
  };
  setInterval(function () { if (!body.classList.contains('compartiendo')) return; var u = mmssD((Date.now() - directoT0) / 1000); document.querySelectorAll('.slide.active .vent-vivo u').forEach(function (e) { e.textContent = u; }); }, 1000);
  addEventListener('voz', function () { setTimeout(pintarLlamada, 30); });
  setInterval(function () { if (body.classList.contains('compartiendo')) pintarLlamada(); }, 300);
  addEventListener('deckslide', function () { setTimeout(pintarLlamada, 20); });
})();
