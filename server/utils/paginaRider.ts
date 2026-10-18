/**
 * Página pública de SEO «plantilla de rider técnico» (`/plantilla-rider-tecnico`), generada en el servidor.
 *
 * Captura búsquedas reales de bandas («plantilla rider técnico», «input list») con una plantilla
 * imprimible y editable sin JavaScript (`contenteditable`; imprimir = guardar como PDF) y lleva a
 * la landing con UTM. Función pura, sin I/O ni datos de ninguna banda: todo es contenido fijo.
 */
import { escapeHtml } from './html.js';
import { jsonLdSeguro } from './paginaConcierto.js';

export const RUTA_PLANTILLA_RIDER = '/plantilla-rider-tecnico';

const CANALES = ['Bombo', 'Caja', 'Charles', 'Toms', 'Overheads', 'Bajo (DI)', 'Guitarra 1', 'Guitarra 2', 'Teclados', 'Voz principal', 'Coros 1', 'Coros 2'];

const BACKLINE = ['Batería (kit completo, platos, hardware)', 'Amplificador de bajo', 'Amplificador de guitarra 1', 'Amplificador de guitarra 2', 'Teclado / piano y soporte', 'Pies de micro y cableado'];

const LOGISTICA = ['Camerino con llave y espejo', 'Agua y toallas en el escenario', 'Hora de carga y prueba de sonido', 'Parking para la furgo y acceso de carga', 'Persona de contacto en la sala'];

const FAQ: Array<{ q: string; a: string }> = [
  { q: '¿Qué es un rider técnico?', a: 'Es el documento que le dice a la sala qué necesita tu banda para sonar bien: canales de sonido (input list), backline, monitores, tamaño de escenario y corriente. Se envía junto al dossier antes del concierto.' },
  { q: '¿Qué diferencia hay entre rider técnico y rider de hospitalidad?', a: 'El técnico recoge el sonido, la luz y el escenario. El de hospitalidad recoge lo que necesitáis para estar cómodos: camerino, agua, comida, parking. Conviene mandarlos por separado para que el técnico solo vea lo suyo.' },
  { q: '¿Qué es una input list?', a: 'Es la lista de canales que el técnico de sonido conecta a la mesa: cada instrumento o voz, con su micro o caja de inyección (DI) y su pie. Cuanto más clara, menos tiempo se pierde en la prueba de sonido.' },
  { q: '¿Cuántas páginas debe tener?', a: 'Una o dos. Si la sala tiene que buscar el dato entre cinco páginas, no lo va a leer. Pon primero lo imprescindible y deja el detalle para quien lo pida.' },
];

export const ESTILOS_PAGINA_PUBLICA = `
:root{--bg:#F6F7F9;--surface:#FFFFFF;--sunken:#E8EBEF;--ink:#2A2E35;--ink-2:#5A626E;--acc:#2158DC;--on-acc:#FFFFFF;--acc-ink:#1D4ED8;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--bg:#101216;--surface:#191C21;--sunken:#0B0D10;--ink:#E3E7EC;--ink-2:#A6AEB9;--acc:#60A5FA;--on-acc:#0A1F3D;--acc-ink:#60A5FA;color-scheme:dark}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:"Onest Variable","Onest",system-ui,-apple-system,"Segoe UI",sans-serif;font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased}
main{max-width:44rem;margin:0 auto;padding:1.25rem 1rem 3rem}
h1{font-size:30px;line-height:1.12;margin:.5rem 0 .75rem;font-weight:700;text-wrap:balance}
h2{font-size:20px;margin:0 0 .6rem;font-weight:650}
h3{font-size:15px;margin:1.1rem 0 .4rem;font-weight:650;color:var(--ink-2)}
p{margin:0 0 .9rem}
.intro{color:var(--ink-2);font-size:17px}
.tarjeta{background:var(--surface);border-radius:24px;padding:1.25rem;margin:1.25rem 0}
.acciones{display:flex;flex-wrap:wrap;gap:.6rem;margin:1rem 0 0}
.boton{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 1.4rem;border-radius:999px;font:inherit;font-weight:600;text-decoration:none;cursor:pointer;border:0;transition:transform 120ms cubic-bezier(.23,1,.32,1)}
.boton:active{transform:scale(.97)}
.principal{background:var(--acc);color:var(--on-acc)}
.suave{background:var(--sunken);color:var(--ink)}
table{width:100%;border-collapse:collapse;font-size:14px}
th{text-align:left;font-weight:650;color:var(--ink-2);padding:.4rem .5rem}
td{padding:.55rem .5rem;background:var(--bg)}
tr+tr td{box-shadow:0 2px 0 var(--surface)}
td:first-child{width:2.5rem;font-variant-numeric:tabular-nums;color:var(--ink-2)}
[contenteditable]{min-height:1.4em;border-radius:8px}
[contenteditable]:focus{outline:2px solid var(--acc)}
.campo{display:flex;gap:.6rem;align-items:baseline;padding:.45rem .6rem;border-radius:12px;background:var(--bg);margin:0 0 .4rem}
.campo b{font-weight:600;white-space:nowrap}
.campo span{flex:1;min-width:0;color:var(--ink-2)}
ul.lista{list-style:none;margin:0;padding:0}
ul.lista li{padding:.45rem .6rem;border-radius:12px;background:var(--bg);margin:0 0 .4rem}
details{background:var(--surface);border-radius:18px;padding:.9rem 1.1rem;margin:0 0 .5rem}
summary{font-weight:600;cursor:pointer}
details p{margin:.6rem 0 0;color:var(--ink-2)}
.cta{background:var(--acc);color:var(--on-acc);border-radius:24px;padding:1.5rem;margin:1.5rem 0}
.cta h2{margin-bottom:.4rem}.cta p{opacity:.92}
.cta .boton{background:var(--on-acc);color:var(--acc)}
.pie{margin-top:2rem;text-align:center;font-size:13px;color:var(--ink-2)}
.pie a{color:var(--acc-ink);font-weight:600;text-decoration:none}
:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
@media print{body{background:#fff;color:#000}.no-imprimir{display:none}.tarjeta{padding:0;margin:.5rem 0;background:#fff}td,.campo,ul.lista li{background:#fff}main{max-width:none;padding:0}}
@media (prefers-reduced-motion:reduce){.boton{transition:none}}
`;

function lista(items: string[]): string {
  return `<ul class="lista">${items.map((i) => `<li contenteditable="true">${escapeHtml(i)}</li>`).join('')}</ul>`;
}

export function renderizarPaginaRider(base: string): string {
  const url = `${base}${RUTA_PLANTILLA_RIDER}`;
  const titulo = 'Plantilla de rider técnico para bandas (gratis, editable e imprimible)';
  const descripcion = 'Rider técnico listo para rellenar: input list, backline, monitores, escenario y hospitalidad. Edítalo en pantalla, imprímelo o guárdalo en PDF. Gratis, sin registro.';
  const registro = `${base}/?utm_source=seo&utm_medium=plantilla&utm_campaign=rider_tecnico`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', name: titulo, url, inLanguage: 'es', description: descripcion },
      { '@type': 'FAQPage', mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    ],
  };
  const filasCanales = CANALES.map(
    (c, i) => `<tr><td>${i + 1}</td><td contenteditable="true">${escapeHtml(c)}</td><td contenteditable="true"></td><td contenteditable="true"></td><td contenteditable="true"></td></tr>`
  ).join('');
  const campos = ['Banda', 'Responsable técnico', 'Teléfono', 'Email', 'Número de personas en el escenario']
    .map((c) => `<p class="campo"><b>${escapeHtml(c)}</b><span contenteditable="true"></span></p>`)
    .join('');
  const faq = FAQ.map((f) => `<details><summary>${escapeHtml(f.q)}</summary><p>${escapeHtml(f.a)}</p></details>`).join('');

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(titulo)}</title>
<meta name="description" content="${escapeHtml(descripcion)}">
<link rel="canonical" href="${escapeHtml(url)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:type" content="article">
<meta property="og:site_name" content="BandManager">
<meta property="og:title" content="${escapeHtml(titulo)}">
<meta property="og:description" content="${escapeHtml(descripcion)}">
<meta property="og:url" content="${escapeHtml(url)}">
<meta property="og:image" content="${escapeHtml(base)}/og-cover.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#F6F7F9">
<script type="application/ld+json">${jsonLdSeguro(jsonLd)}</script>
<style>${ESTILOS_PAGINA_PUBLICA}</style>
</head>
<body>
<main>
<header class="no-imprimir">
<h1>Plantilla de rider técnico para bandas</h1>
<p class="intro">Rellénala aquí mismo (toca cualquier campo y escribe), imprímela o guárdala como PDF. Una página que la sala entiende a la primera y que te ahorra media prueba de sonido.</p>
<div class="acciones"><button class="boton principal" type="button" onclick="window.print()">Imprimir o guardar en PDF</button></div>
<noscript><p>Para guardar en PDF, usa Imprimir en tu navegador (Ctrl+P).</p></noscript>
</header>

<section class="tarjeta" aria-labelledby="datos">
<h2 id="datos">Rider técnico</h2>
${campos}

<h3>Input list (canales)</h3>
<table>
<thead><tr><th>Canal</th><th>Fuente</th><th>Micro o DI</th><th>Notas</th></tr></thead>
<tbody>${filasCanales}</tbody>
</table>

<h3>Backline que pedimos a la sala</h3>
${lista(BACKLINE)}

<h3>Monitores y escenario</h3>
<p class="campo"><b>Mezclas de monitor</b><span contenteditable="true"></span></p>
<p class="campo"><b>Escenario mínimo (m)</b><span contenteditable="true"></span></p>
<p class="campo"><b>Tomas de corriente</b><span contenteditable="true"></span></p>

<h3>Logística y hospitalidad</h3>
${lista(LOGISTICA)}
</section>

<section class="no-imprimir">
<h2>Cómo rellenarlo sin liarla</h2>
<p>Pon solo lo que de verdad necesitáis y marca qué es imprescindible y qué es mejor si se puede. Si no hay mesa de monitores, dilo antes: la sala agradece saberlo con tiempo. Y manda el rider junto al dossier, no después.</p>
<h2 style="margin-top:1.5rem">Preguntas frecuentes</h2>
${faq}
<div class="cta">
<h2>El rider, siempre a mano</h2>
<p>En BandManager guardas el rider en el dossier (EPK) de tu banda y lo envías con cada propuesta, sin buscarlo en el correo cada vez.</p>
<div class="acciones"><a class="boton" href="${escapeHtml(registro)}">Probar BandManager gratis</a></div>
</div>
</section>
<p class="pie no-imprimir"><a href="${escapeHtml(base)}/">BandManager.io</a> · el mánager que llevas en el bolsillo</p>
</main>
</body>
</html>`;
}
