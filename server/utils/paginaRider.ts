/**
 * Página pública de SEO «plantilla de rider técnico» (`/plantilla-rider-tecnico` y `/en/technical-rider-template`),
 * generada en el servidor.
 *
 * Captura búsquedas reales de bandas («plantilla rider técnico», «input list») con una plantilla
 * imprimible y editable sin JavaScript (`contenteditable`; imprimir = guardar como PDF) y lleva a
 * la landing con UTM. Función pura, sin I/O ni datos de ninguna banda: todo es contenido fijo.
 */
import { escapeHtml } from './html.js';
import { barraHtml, cabezaHtml } from './seo/cabeza.js';
import { RUTAS, alternativasPar, type IdiomaSeo } from './seo/rutas.js';
import { TEXTOS } from './seo/textos.js';

export const RUTA_PLANTILLA_RIDER = RUTAS.es.rider;

interface ContenidoRider {
  titulo: string;
  descripcion: string;
  h1: string;
  intro: string;
  imprimir: string;
  sinScript: string;
  tarjeta: string;
  contacto: string[];
  inputList: string;
  columnas: string[];
  canales: string[];
  backlineTitulo: string;
  backline: string[];
  monitoresTitulo: string;
  monitores: string[];
  logisticaTitulo: string;
  logistica: string[];
  comoTitulo: string;
  como: string;
  faq: Array<{ q: string; a: string }>;
  cta: { titulo: string; texto: string; boton: string };
}

const CONTENIDO: Record<IdiomaSeo, ContenidoRider> = {
  es: {
    titulo: 'Plantilla de rider técnico para bandas (gratis, editable e imprimible)',
    descripcion: 'Rider técnico listo para rellenar: input list, backline, monitores, escenario y hospitalidad. Edítalo en pantalla, imprímelo o guárdalo en PDF. Gratis, sin registro.',
    h1: 'Plantilla de rider técnico para bandas',
    intro: 'Rellénala aquí mismo (toca cualquier campo y escribe), imprímela o guárdala como PDF. Una página que la sala entiende a la primera y que te ahorra media prueba de sonido.',
    imprimir: 'Imprimir o guardar en PDF',
    sinScript: 'Para guardar en PDF, usa Imprimir en tu navegador (Ctrl+P).',
    tarjeta: 'Rider técnico',
    contacto: ['Banda', 'Responsable técnico', 'Teléfono', 'Email', 'Número de personas en el escenario'],
    inputList: 'Input list (canales)',
    columnas: ['Canal', 'Fuente', 'Micro o DI', 'Notas'],
    canales: ['Bombo', 'Caja', 'Charles', 'Toms', 'Overheads', 'Bajo (DI)', 'Guitarra 1', 'Guitarra 2', 'Teclados', 'Voz principal', 'Coros 1', 'Coros 2'],
    backlineTitulo: 'Backline que pedimos a la sala',
    backline: ['Batería (kit completo, platos, hardware)', 'Amplificador de bajo', 'Amplificador de guitarra 1', 'Amplificador de guitarra 2', 'Teclado / piano y soporte', 'Pies de micro y cableado'],
    monitoresTitulo: 'Monitores y escenario',
    monitores: ['Mezclas de monitor', 'Escenario mínimo (m)', 'Tomas de corriente'],
    logisticaTitulo: 'Logística y hospitalidad',
    logistica: ['Camerino con llave y espejo', 'Agua y toallas en el escenario', 'Hora de carga y prueba de sonido', 'Parking para la furgo y acceso de carga', 'Persona de contacto en la sala'],
    comoTitulo: 'Cómo rellenarlo sin liarla',
    como: 'Pon solo lo que de verdad necesitáis y marca qué es imprescindible y qué es mejor si se puede. Si no hay mesa de monitores, dilo antes: la sala agradece saberlo con tiempo. Y manda el rider junto al dossier, no después.',
    faq: [
      { q: '¿Qué es un rider técnico?', a: 'Es el documento que le dice a la sala qué necesita tu banda para sonar bien: canales de sonido (input list), backline, monitores, tamaño de escenario y corriente. Se envía junto al dossier antes del concierto.' },
      { q: '¿Qué diferencia hay entre rider técnico y rider de hospitalidad?', a: 'El técnico recoge el sonido, la luz y el escenario. El de hospitalidad recoge lo que necesitáis para estar cómodos: camerino, agua, comida, parking. Conviene mandarlos por separado para que el técnico solo vea lo suyo.' },
      { q: '¿Qué es una input list?', a: 'Es la lista de canales que el técnico de sonido conecta a la mesa: cada instrumento o voz, con su micro o caja de inyección (DI) y su pie. Cuanto más clara, menos tiempo se pierde en la prueba de sonido.' },
      { q: '¿Cuántas páginas debe tener?', a: 'Una o dos. Si la sala tiene que buscar el dato entre cinco páginas, no lo va a leer. Pon primero lo imprescindible y deja el detalle para quien lo pida.' },
    ],
    cta: { titulo: 'El rider, siempre a mano', texto: 'En BandManager guardas el rider en el dossier (EPK) de tu banda y lo envías con cada propuesta, sin buscarlo en el correo cada vez.', boton: 'Probar BandManager gratis' },
  },
  en: {
    titulo: 'Technical rider template for bands (free, editable, printable)',
    descripcion: 'A ready-to-fill technical rider: input list, backline, monitors, stage and hospitality. Edit it on screen, print it or save it as a PDF. Free, no sign-up.',
    h1: 'Technical rider template for bands',
    intro: "Fill it in right here (tap any field and type), print it or save it as a PDF. One page the venue understands at a glance, and it saves you half a soundcheck.",
    imprimir: 'Print or save as PDF',
    sinScript: 'To save as a PDF, use Print in your browser (Ctrl+P).',
    tarjeta: 'Technical rider',
    contacto: ['Band', 'Technical contact', 'Phone', 'Email', 'People on stage'],
    inputList: 'Input list (channels)',
    columnas: ['Channel', 'Source', 'Mic or DI', 'Notes'],
    canales: ['Kick', 'Snare', 'Hi-hat', 'Toms', 'Overheads', 'Bass (DI)', 'Guitar 1', 'Guitar 2', 'Keys', 'Lead vocal', 'Backing vocal 1', 'Backing vocal 2'],
    backlineTitulo: 'Backline we ask the venue for',
    backline: ['Drum kit (full kit, cymbals, hardware)', 'Bass amp', 'Guitar amp 1', 'Guitar amp 2', 'Keyboard / piano and stand', 'Mic stands and cables'],
    monitoresTitulo: 'Monitors and stage',
    monitores: ['Monitor mixes', 'Minimum stage size (m)', 'Power outlets'],
    logisticaTitulo: 'Logistics and hospitality',
    logistica: ['Lockable dressing room with a mirror', 'Water and towels on stage', 'Load-in and soundcheck times', 'Parking for the van and load-in access', 'A contact person at the venue'],
    comoTitulo: 'How to fill it in without a mess',
    como: 'List only what you really need and mark what is essential and what is nice to have. If there is no monitor desk, say so up front: venues appreciate knowing early. And send the rider together with your press kit, not after.',
    faq: [
      { q: 'What is a technical rider?', a: 'It is the document that tells the venue what your band needs to sound good: sound channels (input list), backline, monitors, stage size and power. It is sent with your press kit before the show.' },
      { q: "What's the difference between a technical rider and a hospitality rider?", a: 'The technical one covers sound, lighting and stage. The hospitality one covers what you need to be comfortable: dressing room, water, food, parking. Send them separately so the sound engineer only reads their part.' },
      { q: 'What is an input list?', a: 'It is the list of channels the sound engineer plugs into the desk: each instrument or voice, with its mic or direct box (DI) and its stand. The clearer it is, the less time you lose at soundcheck.' },
      { q: 'How long should it be?', a: 'One or two pages. If the venue has to hunt for a detail across five pages, they will not read it. Put the essentials first and keep the detail for whoever asks.' },
    ],
    cta: { titulo: 'Your rider, always at hand', texto: 'In BandManager you keep the rider inside your band’s press kit (EPK) and send it with every proposal, no digging through your inbox.', boton: 'Try BandManager free' },
  },
};

export function renderizarPaginaRider(base: string, idioma: IdiomaSeo = 'es'): string {
  const c = CONTENIDO[idioma];
  const t = TEXTOS[idioma];
  const ruta = RUTAS[idioma].rider;
  const url = `${base}${ruta}`;
  const registro = `${base}${idioma === 'en' ? '/en' : '/'}?utm_source=seo&utm_medium=plantilla&utm_campaign=rider_tecnico`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', name: c.titulo, url, inLanguage: idioma, description: c.descripcion },
      { '@type': 'FAQPage', mainEntity: c.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    ],
  };
  const lista = (items: string[]) => `<ul class="lista">${items.map((i) => `<li contenteditable="true">${escapeHtml(i)}</li>`).join('')}</ul>`;
  const campo = (etiqueta: string) => `<p class="campo"><b>${escapeHtml(etiqueta)}</b><span contenteditable="true"></span></p>`;
  const filas = c.canales.map((canal, i) => `<tr><td>${i + 1}</td><td contenteditable="true">${escapeHtml(canal)}</td><td contenteditable="true"></td><td contenteditable="true"></td><td contenteditable="true"></td></tr>`).join('');

  return `${cabezaHtml({ base, idioma, ruta, titulo: c.titulo, descripcion: c.descripcion, jsonLd, tipoOg: 'article', alternativas: alternativasPar(base, RUTAS.es.rider, RUTAS.en.rider) })}
<body>
<main>
${barraHtml(base, idioma, RUTAS[idioma === 'es' ? 'en' : 'es'].rider, 'rider_tecnico')}
<header class="no-imprimir">
<h1>${escapeHtml(c.h1)}</h1>
<p class="intro">${escapeHtml(c.intro)}</p>
<div class="acciones"><button class="boton principal" type="button" onclick="window.print()">${escapeHtml(c.imprimir)}</button></div>
<noscript><p>${escapeHtml(c.sinScript)}</p></noscript>
</header>

<section class="tarjeta" aria-labelledby="datos">
<h2 id="datos">${escapeHtml(c.tarjeta)}</h2>
${c.contacto.map(campo).join('\n')}

<h3>${escapeHtml(c.inputList)}</h3>
<table>
<thead><tr><th>#</th>${c.columnas.map((x) => `<th>${escapeHtml(x)}</th>`).join('')}</tr></thead>
<tbody>${filas}</tbody>
</table>

<h3>${escapeHtml(c.backlineTitulo)}</h3>
${lista(c.backline)}

<h3>${escapeHtml(c.monitoresTitulo)}</h3>
${c.monitores.map(campo).join('\n')}

<h3>${escapeHtml(c.logisticaTitulo)}</h3>
${lista(c.logistica)}
</section>

<section class="no-imprimir">
<h2>${escapeHtml(c.comoTitulo)}</h2>
<p>${escapeHtml(c.como)}</p>
<h2 style="margin-top:1.5rem">${escapeHtml(t.faq)}</h2>
${c.faq.map((f) => `<details><summary>${escapeHtml(f.q)}</summary><p>${escapeHtml(f.a)}</p></details>`).join('')}
<div class="cta">
<h2>${escapeHtml(c.cta.titulo)}</h2>
<p>${escapeHtml(c.cta.texto)}</p>
<div class="acciones"><a class="boton" href="${escapeHtml(registro)}">${escapeHtml(c.cta.boton)}</a></div>
</div>
</section>
<p class="pie no-imprimir"><a href="${escapeHtml(base)}${RUTAS[idioma].landing}">BandManager.io</a> · <a href="${escapeHtml(base)}${RUTAS[idioma].guias}">${escapeHtml(t.guias)}</a> · ${escapeHtml(t.lema)}</p>
</main>
</body>
</html>`;
}
