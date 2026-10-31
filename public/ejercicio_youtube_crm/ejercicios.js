// Navegación común de los ejercicios del máster: un único listado (aquí) alimenta la barra lateral de cada
// página y el índice. Para publicar un ejercicio: poner su `url` y crear su página; el resto se actualiza solo.
(function () {
  var GRUPOS = [
    { t: 'Redes sociales', items: [
      ['Comunidades'], ['Facebook'], ['Instagram'], ['TikTok'], ['YouTube', '/ejercicio_youtube_crm'], ['X (Twitter)'], ['LinkedIn'],
      ['Herramientas para RRSS'], ['Estrategia RRSS']] },
    { t: 'Marca y estrategia', items: [['Branding e identidad corporativa'], ['Estrategia digital'], ['Marketing de influencers']] },
    { t: 'SEO', items: [
      ['Keyword research'], ['Arquitectura SEO'], ['URLs'], ['Headings'], ['Contenidos'], ['Metadatos'], ['Imágenes'],
      ['Enlazado interno'], ['Robots'], ['Sitemaps'], ['Datos estructurados'], ['Indexación'], ['WPO'], ['Mobile'], ['Blog'],
      ['SEO offpage'], ['Linkbuilding y linkbaiting'], ['Screaming Frog'], ['SEO internacional']] },
    { t: 'Publicidad de pago', items: [
      ['Google Ads'], ['Google Search'], ['Google Display'], ['TikTok Ads'], ['Twitter Ads'], ['Ads para ecommerce'],
      ['PPC para B2B'], ['Retargeting'], ['Estrategia SEM'], ['Copywriting Ads'], ['Copywriting para landing pages']] },
    { t: 'Clientes', items: [['CRM']] }
  ];
  var FILM = '/presentacion_tfm';
  var path = location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  var hechos = [];
  GRUPOS.forEach(function (g) { g.items.forEach(function (i) { if (i[1]) hechos.push(i); }); });

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function item(i) {
    if (!i[1]) return '<li class="ej-it off"><span>' + esc(i[0]) + '</span><em>Próximamente</em></li>';
    var act = path === i[1] ? ' aria-current="page"' : '';
    return '<li class="ej-it"><a href="' + i[1] + '"' + act + '>' + esc(i[0]) + '</a></li>';
  }
  function grupos() {
    return GRUPOS.map(function (g) {
      var hecho = g.items.filter(function (i) { return i[1]; }).length;
      var abierto = g.items.some(function (i) { return i[1] && i[1] === path; }) || path === '/';
      return '<details class="ej-g"' + (abierto ? ' open' : '') + '><summary>' + esc(g.t) + '<span>' + hecho + '/' + g.items.length + '</span></summary><ul>' + g.items.map(item).join('') + '</ul></details>';
    }).join('');
  }
  function vecinos() {
    var k = -1; hechos.forEach(function (i, n) { if (i[1] === path) k = n; });
    if (k < 0 || hechos.length < 2) return '';
    var a = hechos[(k + hechos.length - 1) % hechos.length], b = hechos[(k + 1) % hechos.length];
    return '<div class="ej-pn"><a href="' + a[1] + '">← ' + esc(a[0]) + '</a><a href="' + b[1] + '">' + esc(b[0]) + ' →</a></div>';
  }

  var css = '.ej-nav{position:fixed;left:0;top:0;bottom:0;width:272px;overflow:auto;background:var(--surface);padding:18px 14px 28px;z-index:20;font:400 14px/1.4 Onest,system-ui,sans-serif;color:var(--ink)}' +
    '.ej-nav h2{font-size:13px;margin:6px 8px 10px;color:var(--ink-3);font-weight:700}' +
    '.ej-nav a{color:inherit;text-decoration:none}.ej-home{display:block;padding:9px 12px;border-radius:var(--r-m);font-weight:800}.ej-home:hover,.ej-it a:hover{background:var(--sunken)}' +
    '.ej-nav input{width:100%;margin:10px 0;padding:10px 14px;border:0;border-radius:var(--r-pill);background:var(--sunken);color:var(--ink);font:inherit}' +
    '.ej-g summary{cursor:pointer;list-style:none;display:flex;justify-content:space-between;padding:9px 12px;border-radius:var(--r-m);font-weight:700}.ej-g summary::-webkit-details-marker{display:none}.ej-g summary:hover{background:var(--sunken)}.ej-g summary span{color:var(--ink-3);font-weight:400}' +
    '.ej-g ul{list-style:none;margin:0 0 6px;padding:0}.ej-it a,.ej-it.off{display:flex;justify-content:space-between;gap:8px;padding:7px 12px 7px 20px;border-radius:var(--r-pill)}.ej-it.off{color:var(--ink-3)}.ej-it em{font-size:11px;font-style:normal}' +
    '.ej-it a[aria-current]{background:var(--acc);color:var(--on-acc);font-weight:700}.ej-it.oculto{display:none}' +
    '.ej-film{display:block;margin:10px 0;padding:9px 12px;border-radius:var(--r-m);background:var(--acc-soft);color:var(--acc-ink)!important;font-weight:700}' +
    '.ej-pn{display:flex;justify-content:space-between;gap:12px;margin:40px 0 0}.ej-pn a{padding:10px 18px;border-radius:var(--r-pill);background:var(--sunken);color:var(--ink);text-decoration:none;font-weight:700;font-size:14px}' +
    '.ej-btn{display:none;position:fixed;left:12px;top:12px;z-index:30;border:0;border-radius:var(--r-pill);padding:10px 16px;background:var(--ink);color:var(--bg);font:700 14px Onest,system-ui,sans-serif;cursor:pointer}' +
    '@media(min-width:1100px){body{padding-left:272px}}' +
    '@media(max-width:1099px){.ej-nav{padding-top:64px;transform:translateX(-105%);transition:transform .25s cubic-bezier(.23,1,.32,1);width:min(320px,86vw)}.ej-nav.on{transform:none}.ej-btn{display:block}body{padding-top:56px}}' +
    '@media(prefers-reduced-motion:reduce){.ej-nav{transition:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var nav = document.createElement('nav'); nav.className = 'ej-nav'; nav.id = 'ejNav'; nav.setAttribute('aria-label', 'Ejercicios del máster');
  nav.innerHTML = '<a class="ej-home" href="/ejercicio_youtube_crm">Ejercicios del máster</a><input type="search" id="ejQ" placeholder="Buscar ejercicio" aria-label="Buscar ejercicio">' +
    '<div id="ejG">' + grupos() + '</div><a class="ej-film" href="' + FILM + '">Ver la película del TFM</a>';
  var btn = document.createElement('button'); btn.className = 'ej-btn'; btn.type = 'button'; btn.textContent = 'Ejercicios'; btn.setAttribute('aria-controls', 'ejNav'); btn.setAttribute('aria-expanded', 'false');
  document.body.insertBefore(nav, document.body.firstChild); document.body.insertBefore(btn, nav);
  btn.addEventListener('click', function () { var on = nav.classList.toggle('on'); btn.setAttribute('aria-expanded', on); });
  nav.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a[href^="/"]')) nav.classList.remove('on'); });

  document.getElementById('ejQ').addEventListener('input', function (e) {
    var q = e.target.value.trim().toLowerCase();
    nav.querySelectorAll('.ej-g').forEach(function (g) {
      var any = false;
      g.querySelectorAll('.ej-it').forEach(function (li) { var ok = !q || li.textContent.toLowerCase().indexOf(q) > -1; li.classList.toggle('oculto', !ok); if (ok) any = true; });
      g.style.display = any ? '' : 'none'; if (q && any) g.open = true;
    });
  });

  var pie = document.getElementById('ejPrevNext'); if (pie) pie.innerHTML = vecinos();
  var lista = document.getElementById('ejLista');
  if (lista) lista.innerHTML = GRUPOS.map(function (g) {
    return '<section class="ej-bloque"><h2>' + esc(g.t) + '</h2><div class="ej-chips">' + g.items.map(function (i) {
      return i[1] ? '<a class="ej-chip on" href="' + i[1] + '">' + esc(i[0]) + '</a>' : '<span class="ej-chip">' + esc(i[0]) + '</span>';
    }).join('') + '</div></section>';
  }).join('');
})();
