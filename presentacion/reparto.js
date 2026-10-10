/* Reparto de la presentación: el ÚNICO sitio donde cambiar a un músico.
   Si cambia un miembro de la banda (nombre, instrumento o foto), se edita aquí y se actualiza en todas
   las diapositivas: chats, reparto, escena del local, tráiler y créditos.

   Cómo se usa en index.html:
   - Mensaje de chat:  <li data-who="bateria" data-t="23:58">Texto del mensaje</li>
   - Nombre o rol en cualquier texto:  {bateria} → nombre, {bateria:rol} → «batería», {bateria:Rol} → «Batería»,
     {bateria:cargo} → cargo largo (para el reparto).
   - Foto:  <img data-foto="bateria" alt="{bateria}">

   Las claves son papeles (bajo, bateria, voz, guitarra), no nombres, para que sobrevivan a un cambio de músico.
   Los chistes del guion dependen de la personalidad de cada personaje: si entra alguien nuevo, revisar los
   mensajes que lo mencionan. El nombre «Brais» de The Big School by Brais Moure es el del profesor, no el del batería:
   no pasa por aquí.

   Voces (`tts`): cada personaje habla con su voz. Los audios se generan con
   `python3 presentacion/tools/voces.py` (ver presentacion/tools/README.md) y van a `audio/voces/`.
   Si cambias un músico o su voz, vuelve a ejecutarlo: solo regenera las frases que han cambiado.
   - motor: 'kokoro' (sid 29 em_alex, 53 em_santa, 28 ef_dora) o 'piper' (modelo es_ES-davefx-medium,
     es_ES-sharvard-medium con sid 0 hombre / 1 mujer)
   - tono: semitonos (+ agudo, − grave) · vel: velocidad · efecto: 'telefono' | 'radio' | 'robot' | ninguno */
(function () {
  var R = window.REPARTO = {
    bajo:     { nombre: 'Iago',    rol: 'bajo',      cargo: 'Bajo',            foto: 'img/miembro-iago.jpg',    color: '#8fb6ff', yo: true,
                tts: { motor: 'kokoro', sid: 29, tono: 0, vel: 1.0 } },
    bateria:  { nombre: 'Brais',   rol: 'batería',   cargo: 'Batería',         foto: 'img/miembro-brais.jpg',   color: '#ffd596',
                tts: { motor: 'kokoro', sid: 53, tono: 0, vel: 1.02 } },
    voz:      { nombre: 'Xandre',  rol: 'voz',       cargo: 'Voz y guitarra',  foto: 'img/miembro-xandre.jpg',  color: '#ff9ec4',
                tts: { motor: 'piper', modelo: 'es_ES-sharvard-medium', sid: 0, tono: 1, vel: 1.0 } },
    guitarra: { nombre: 'Álvaro',  rol: 'guitarra',  cargo: 'Guitarra solista', foto: 'img/miembro-alvaro.jpg', color: '#8be0a4',
                tts: { motor: 'piper', modelo: 'es_ES-davefx-medium', sid: 0, tono: 0, vel: 1.0 } },
    manager:  { nombre: 'Manager', rol: 'Os Herdeiros do Código', cargo: 'Manager', foto: 'img/personaje-manager.jpg', color: '#c9a6ff',
                tts: { motor: 'kokoro', sid: 29, tono: -3, vel: 0.95, efecto: 'telefono' } },
    voz_mop:  { nombre: 'Master of Prompts', rol: 'voz', cargo: 'Voz de Master of Prompts', foto: 'img/personaje-cantante.jpg', color: '#ffb36a',
                tts: { motor: 'piper', modelo: 'es_ES-sharvard-medium', sid: 0, tono: -3, vel: 0.97 } },
    ia_claude: { nombre: 'Claudio', rol: 'Claude Code', cargo: 'Asistente de IA', foto: null, color: '#f0a27c',
                tts: { motor: 'piper', modelo: 'es_ES-davefx-medium', sid: 0, tono: 2, vel: 0.95, efecto: 'robot' } },
    ia_gemini: { nombre: 'Guglio',  rol: 'Gemini',      cargo: 'Asistente de IA', foto: null, color: '#7fc0ff',
                tts: { motor: 'piper', modelo: 'es_ES-sharvard-medium', sid: 0, tono: 3, vel: 1.05, efecto: 'robot' } },
    locutor:  { nombre: 'Rock FM', rol: 'locutor', cargo: 'Locutor', foto: null, color: '#ffb36a',
                tts: { motor: 'kokoro', sid: 53, tono: -1, vel: 1.04, efecto: 'radio' } },
  };

  var cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
  var valor = function (k, f) {
    var m = R[k];
    if (!m) return null;
    if (!f || f === 'nombre') return m.nombre;
    if (f === 'rol') return m.rol;
    if (f === 'Rol') return cap(m.rol);
    if (f === 'cargo') return m.cargo;
    return null;
  };
  var sustituir = function (s) {
    return s.indexOf('{') < 0 ? s : s.replace(/\{(\w+)(?::(\w+))?\}/g, function (todo, k, f) {
      var v = valor(k, f); return v == null ? todo : v;
    });
  };

  window.REPARTO_TEXTO = sustituir;
  if (typeof document === 'undefined') return; // en Node (generador de voces) solo hacen falta los datos

  // 1) Textos y atributos con {clave}
  var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: function (n) {
      var p = n.parentNode && n.parentNode.nodeName;
      return p === 'SCRIPT' || p === 'STYLE' || p === 'NOSCRIPT' || n.nodeValue.indexOf('{') < 0 ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    },
  });
  var nodos = [], n;
  while ((n = walker.nextNode())) nodos.push(n);
  nodos.forEach(function (t) { t.nodeValue = sustituir(t.nodeValue); });
  document.querySelectorAll('[alt],[title],[aria-label],[data-title],[data-say]').forEach(function (el) {
    ['alt', 'title', 'aria-label', 'data-title', 'data-say'].forEach(function (a) {
      var v = el.getAttribute(a); if (v && v.indexOf('{') >= 0) el.setAttribute(a, sustituir(v));
    });
  });

  // 2) Fotos del reparto
  document.querySelectorAll('img[data-foto]').forEach(function (img) {
    var m = R[img.dataset.foto]; if (m && m.foto) img.src = m.foto;
  });

  // 3) Mensajes de chat: <li data-who="clave">texto</li> → avatar + burbuja con «Nombre · rol»
  document.querySelectorAll('.dlg > li[data-who]').forEach(function (li) {
    var m = R[li.dataset.who]; if (!m) return;
    var hora = li.dataset.t;
    li.style.setProperty('--c', m.color);
    if (m.yo) li.classList.add('me');
    var av;
    if (m.foto) { av = document.createElement('img'); av.src = m.foto; av.alt = m.nombre; }
    else { av = document.createElement('span'); av.setAttribute('aria-hidden', 'true'); av.textContent = m.nombre.charAt(0); }
    av.className = 'av';
    var b = document.createElement('div'); b.className = 'bub';
    var et = document.createElement('b'); et.textContent = m.nombre + ' · ' + m.rol;
    if (hora) { var i = document.createElement('i'); i.textContent = hora; et.appendChild(i); }
    b.appendChild(et);
    var txt = document.createElement('span'); txt.className = 'txt';
    while (li.firstChild) txt.appendChild(li.firstChild); // el texto del mensaje (con su marcado) pasa a la burbuja
    b.appendChild(txt);
    li.appendChild(av); li.appendChild(b);
  });
})();
