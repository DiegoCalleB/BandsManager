// Chat guiado de los ejercicios (sin backend ni IA): Eco responde SOLO con lo que está en estas páginas.
// Entiende el número de vídeo o palabras de su título y qué se pregunta (por qué, etiquetas, fecha...),
// y si no lo sabe lo dice. Datos: window.EJ_VIDEOS (los vídeos de la página) y window.EJ_GRUPOS (la navegación).
(function () {
  var AVATAR = '/eco-avatar.webp';
  var norm = function (s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9€ ]+/g, ' ').replace(/\s+/g, ' ').trim(); };
  var vids = function () { return window.EJ_VIDEOS || {}; };
  var grupos = function () { return window.EJ_GRUPOS || []; };

  var GENERAL = [
    { k: ['objetivo', 'para que sirve', 'de que va', 'de que trata', 'que es este ejercicio', 'keyword', 'posicionar'], a: 'El objetivo es posicionar la keyword «CRM» desde un nicho sin competencia, el CRM para bandas, con vídeos para el canal de BandManager. «CRM» va en la voz, la descripción, las etiquetas y el título de respaldo de cada vídeo.' },
    { k: ['idea', 'estrategia', 'ctr', 'titulo y miniatura', 'como funciona', 'curiosidad'], a: 'Cada vídeo enseña una pieza distinta de lo que un CRM puede hacer por una banda. El título y la miniatura abren una pregunta, el vídeo la responde en 30 segundos y, a las 48 horas, se compara el título principal con el de respaldo para SEO.' },
    { k: ['publico', 'buyer', 'persona', 'lucia', 'a quien', 'audiencia', 'target'], a: 'El público es Lucía, 27 años, bajista indie en España o Latinoamérica. Escribe a salas desde Gmail, lo apunta en un Excel y pierde fechas por no hacer seguimiento.' },
    { k: ['calendario', 'fechas', 'cuando', 'publica', 'semanas', 'martes', 'jueves'], a: 'Se publica martes y jueves, del 17 de noviembre al 10 de diciembre (ocho vídeos en cuatro semanas), y el noveno el 15 de diciembre.' },
    { k: ['miniatura', 'miniaturas', 'thumbnail', 'cinta americana'], a: 'Todas las miniaturas siguen el mismo formato: máximo 4 palabras a rotulador sobre cinta americana, una pieza de la app dibujada y Eco con la emoción del vídeo. El texto nunca repite el título: lo completa. Son concept art; la versión final lleva fotos reales y capturas de la app.' },
    { k: ['kpi', 'kpis', 'medicion', 'medir', 'exito', 'resultados', 'metricas', 'objetivos de'], a: 'Se mide con el CTR de la miniatura (más de un 5 %), la retención a los 30 segundos (más de un 60 %), los clics por UTM y los registros a la prueba. A las 48 horas se compara el título principal con el de respaldo.' },
    { k: ['riesgo', 'riesgos', 'legal', 'lssi', 'rgpd', 'reglas', 'limites', 'cuidado'], a: 'Reglas: toda cifra de un título es real (las del vídeo 6 son un ejemplo hasta tener el envío hecho), la polémica es con ideas y no con nombres, y los emails en frío de los vídeos 6 y 8 deben cumplir LSSI y RGPD. El «10 minutos» se cronometra antes de grabar. La prueba gratis de 14 días es una propuesta de marketing: hoy la app no la incluye.' },
    { k: ['eco', 'mascota', 'murcielago', 'duo', 'duolingo', 'tiktok', 'tik tok'], a: 'Eco es el murciélago rockero de BandManager y la mascota del canal: tiene una emoción por vídeo y es la cara del agente de IA de la app. En TikTok haría lo que Duo en Duolingo: apuntarse a las tendencias con humor, por ejemplo «Notificación a las 3 a.m.», «POV» y «Corrección de examen». Pulsa «Dale ritmo» y lo verás bailar.' },
    { k: ['crm', 'que es un crm', 'definicion'], a: 'Un CRM es el sistema para no perder clientes. Para una banda es una lista de salas que sabe en qué punto estás con cada una (nuevo, contactado, respondido, negociando, confirmado) y te avisa cuándo toca volver a escribir.' },
    { k: ['agente', 'agentes', 'scout', 'redactor', 'enviador', 'lector', 'ia escribe'], a: 'Los agentes de BandManager son cuatro: Scout descubre salas, Redactor escribe el pitch con el tono de la banda, Enviador lo despacha solo cuando tú lo apruebas y Lector lee la respuesta y propone la réplica. Ningún email sale sin aprobación humana.' },
    { k: ['contrato', 'contratos', 'firma', 'firmar', 'cobrar', 'pagar', 'pago', 'acuerdo'], a: 'El acuerdo de concierto de BandManager recoge caché o taquilla, forma de pago, rider y hospitalidad. La sala lo firma desde un enlace, sin cuenta, con nombre, cargo y firma dibujada; queda guardado con fecha, hora, IP y la huella del contrato, se avisa por email a las dos partes y el concierto entra en el calendario con su estado de pago. Una firma da pruebas, no garantiza el cobro: para casos serios, consulta con un abogado.' },
    { k: ['epk', 'dossier', 'qr', 'fans', 'landing'], a: 'El dossier EPK es la web de la banda para enlazar en el pie de los emails a las salas, y la landing de fans lleva un QR para el concierto: cada fan que se apunta entra en el CRM. BandManager también registra cuándo se abre el email y cuántas veces se visita el dossier.' },
    { k: ['quien eres', 'quien eres tu', 'que eres', 'hola', 'ayuda', 'que puedes'], a: 'Soy Eco. Respondo solo con lo que hay en estos ejercicios: no invento nada fuera de ellos. Pregúntame por un vídeo («¿por qué el vídeo 6?»), por el público, la estrategia, el calendario o las miniaturas.' },
    { k: ['master', 'marketing digital', 'profesor', 'ejercicio de youtube'], a: 'Estos son los ejercicios del Máster de Marketing Digital con IA, hechos con BandManager como caso real: una aplicación para que las bandas gestionen conciertos, salas y fans.' }
  ];
  var CAMPOS = [
    { re: /(por que|porque|motivo|razon|sentido)/, f: 'por', e: 'Por qué' },
    { re: /(etiqueta|tags|hashtag)/, f: 'tags', e: 'Etiquetas' },
    { re: /(descripcion|descri)/, f: 'd', e: 'Descripción' },
    { re: /(pieza|bandmanager ensena|que ensena|app|funcion)/, f: 'pieza', e: 'Pieza de BandManager' },
    { re: /(respaldo|seo|backup)/, f: 'resp', e: 'Título de respaldo' },
    { re: /(cuando|fecha|dia|publica)/, f: 'dia', e: 'Fecha' }
  ];

  function listaVideos() {
    var v = vids(), ks = Object.keys(v); if (!ks.length) return null;
    return 'Los vídeos son: ' + ks.map(function (k) { return k + ') ' + v[k].t; }).join(' · ');
  }
  function listaEjercicios() {
    var g = grupos(), tot = 0, hechos = 0; if (!g.length) return null;
    g.forEach(function (x) { x.items.forEach(function (i) { tot++; if (i[1]) hechos++; }); });
    return 'Hay ' + tot + ' ejercicios en ' + g.length + ' módulos (' + g.map(function (x) { return x.t; }).join(', ') + '). Por ahora está publicado ' + hechos + ': YouTube. El resto aparece como «Próximamente» en el menú.';
  }
  function videoDe(q) {
    var v = vids(), ks = Object.keys(v), m = q.match(/\b(?:video|v)\s*([1-9])\b/) || q.match(/\b([1-9])\s*(?:o|º)?\s*video\b/);
    if (m && v[m[1]]) return v[m[1]];
    var toks = q.split(' ').filter(function (w) { return w.length > 3; }), mejor = null, mejorN = 0;
    ks.forEach(function (k) { var t = norm(v[k].t), n = toks.filter(function (w) { return t.indexOf(w) > -1; }).length; if (n > mejorN) { mejorN = n; mejor = v[k]; } });
    return mejorN >= 2 ? mejor : null;
  }
  function responder(texto) {
    var q = norm(texto); if (!q) return null;
    if (/(que|cuales|cuantos) (videos|ejercicios) hay|lista|todos los videos/.test(q) && /video/.test(q)) { var l = listaVideos(); return { a: l || 'Los vídeos están en el ejercicio de YouTube: ábrelo desde el menú y pregúntame por cualquiera de ellos.' }; }
    if (/ejercicios (hay|tienes|disponibles)|que ejercicios|modulos/.test(q)) { var e = listaEjercicios(); if (e) return { a: e }; }
    var vid = videoDe(q);
    if (vid) {
      var campo = CAMPOS.filter(function (c) { return c.re.test(q); })[0];
      if (!campo) return { a: 'Vídeo ' + vid.n + ' (' + vid.dia + '): «' + vid.t + '». Enseña: ' + vid.pieza + '. Puedes preguntarme su porqué, la descripción, las etiquetas o el título de respaldo.', href: '#v' + vid.n, n: vid.n };
      var val = vid[campo.f]; if (campo.f === 'tags') val = val.join(', ');
      return { a: campo.e + ' del vídeo ' + vid.n + ' («' + vid.t + '»): ' + (campo.f === 'resp' ? '«' + val + '»' : val), href: '#v' + vid.n, n: vid.n };
    }
    var pe = q.match(/\b(instagram|facebook|linkedin|twitter|x|seo|google ads|branding|comunidades|influencers)\b/);
    if (pe && !/youtube|video/.test(q)) return { a: 'De momento solo está publicado el ejercicio de YouTube. «' + pe[1] + '» aparece como «Próximamente» en el menú.' };
    var mejor = null, mejorN = 0;
    GENERAL.forEach(function (g) {
      var n = g.k.filter(function (k) { return (' ' + q + ' ').indexOf(' ' + k + ' ') > -1 || (k.indexOf(' ') > -1 && q.indexOf(k) > -1); }).length;
      if (n > mejorN) { mejorN = n; mejor = g; }
    });
    return mejor ? { a: mejor.a } : null;
  }

  var SUGERENCIAS = ['¿De qué va este ejercicio?', '¿Quién es el público?', '¿Qué vídeos hay?', '¿Por qué el vídeo 6?', '¿Qué es Eco?', '¿Cómo se mide el éxito?', '¿Qué ejercicios hay?'];
  var css = '.ec-btn{position:fixed;z-index:60;right:12px;bottom:18px;display:flex;align-items:center;gap:8px;border:0;border-radius:999px;padding:6px 16px 6px 6px;background:var(--acc);color:var(--on-acc);font:700 14px Onest,system-ui,sans-serif;cursor:pointer}' +
    '.ec-btn img{width:40px;height:40px;border-radius:999px;background:var(--acc-soft)}.ec-btn:focus-visible,.ec-send:focus-visible,.ec-chip:focus-visible,.ec-x:focus-visible{outline:3px solid var(--acc);outline-offset:2px}' +
    '.ec-pan{position:fixed;z-index:61;right:12px;bottom:84px;width:min(24rem,calc(100vw - 24px));max-height:min(34rem,calc(100dvh - 110px));display:flex;flex-direction:column;overflow:hidden;border-radius:32px;background:var(--surface);color:var(--ink);font:400 14px/1.45 Onest,system-ui,sans-serif;box-shadow:none}' +
    '.ec-pan[hidden]{display:none}.ec-h{display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--acc);color:var(--on-acc)}.ec-h img{width:36px;height:36px;border-radius:999px;background:var(--acc-soft)}.ec-h b{flex:1;font-size:15px}' +
    '.ec-x{border:0;background:transparent;color:inherit;font-size:22px;line-height:1;cursor:pointer;border-radius:999px;width:32px;height:32px}' +
    '.ec-l{flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:10px}.ec-m{max-width:88%;padding:9px 13px;border-radius:18px;white-space:pre-wrap}.ec-m.bot{background:var(--sunken);align-self:flex-start}.ec-m.yo{background:var(--acc);color:var(--on-acc);align-self:flex-end}.ec-m a{color:var(--acc-ink);font-weight:700}' +
    '.ec-c{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 8px}.ec-chip{border:0;border-radius:999px;padding:6px 12px;background:var(--acc-soft);color:var(--acc-ink);font:700 12.5px Onest,system-ui,sans-serif;cursor:pointer}' +
    '.ec-f{display:flex;gap:8px;padding:10px 14px 14px}.ec-f input{flex:1;border:0;border-radius:999px;padding:10px 14px;background:var(--sunken);color:var(--ink);font:inherit}.ec-send{border:0;border-radius:999px;padding:0 16px;background:var(--ink);color:var(--bg);font:700 14px Onest,system-ui,sans-serif;cursor:pointer}' +
    '.ec-btn.con-guia{right:116px}@media(min-width:1100px){.ec-btn.con-guia{right:176px;bottom:36px}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var btn = document.createElement('button'); btn.className = 'ec-btn'; btn.type = 'button'; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'ecPan'); if (document.getElementById('guia')) btn.classList.add('con-guia');
  btn.innerHTML = '<img src="' + AVATAR + '" alt="" width="40" height="40"><span>Pregúntale a Eco</span>';
  var pan = document.createElement('div'); pan.className = 'ec-pan'; pan.id = 'ecPan'; pan.hidden = true; pan.setAttribute('role', 'dialog'); pan.setAttribute('aria-label', 'Chat con Eco sobre los ejercicios');
  pan.innerHTML = '<div class="ec-h"><img src="' + AVATAR + '" alt="" width="36" height="36"><b>Eco · Preguntas sobre los ejercicios</b><button class="ec-x" type="button" aria-label="Cerrar">×</button></div>' +
    '<div class="ec-l" id="ecL" role="log" aria-live="polite"></div><div class="ec-c" id="ecC"></div>' +
    '<form class="ec-f" id="ecF"><input id="ecI" type="text" placeholder="Pregunta sobre un ejercicio" aria-label="Tu pregunta" autocomplete="off"><button class="ec-send" type="submit">Enviar</button></form>';
  document.body.appendChild(btn); document.body.appendChild(pan);
  var L = pan.querySelector('#ecL'), C = pan.querySelector('#ecC'), F = pan.querySelector('#ecF'), I = pan.querySelector('#ecI');

  function msg(txt, quien, href) {
    var d = document.createElement('div'); d.className = 'ec-m ' + quien; d.textContent = txt;
    if (href) { d.appendChild(document.createTextNode(' ')); var a = document.createElement('a'); a.href = href; a.textContent = 'Ver ficha'; a.addEventListener('click', function (ev) { var n = href.replace('#v', ''), t = document.querySelector('.card[data-n="' + n + '"]'); if (t) { ev.preventDefault(); pan.hidden = true; btn.setAttribute('aria-expanded', 'false'); t.click(); } }); d.appendChild(a); }
    L.appendChild(d); L.scrollTop = L.scrollHeight;
  }
  function preguntar(t) {
    msg(t, 'yo'); var r = responder(t);
    if (r) { msg(r.a, 'bot', r.href); return; }
    msg('Eso no lo tengo en los ejercicios, y no quiero inventármelo. Prueba con una de estas preguntas o con «vídeo 3».', 'bot');
  }
  SUGERENCIAS.forEach(function (s) { var b = document.createElement('button'); b.type = 'button'; b.className = 'ec-chip'; b.textContent = s; b.addEventListener('click', function () { preguntar(s); }); C.appendChild(b); });
  F.addEventListener('submit', function (e) { e.preventDefault(); var t = I.value.trim(); if (!t) return; I.value = ''; preguntar(t); });
  function abrir(on) { pan.hidden = !on; btn.setAttribute('aria-expanded', on); if (on) { if (!L.children.length) msg('Hola, soy Eco. Pregúntame por los ejercicios: respondo solo con lo que hay en ellos.', 'bot'); I.focus(); } else btn.focus(); }
  btn.addEventListener('click', function () { abrir(pan.hidden); });
  pan.querySelector('.ec-x').addEventListener('click', function () { abrir(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pan.hidden) abrir(false); });
})();
