/**
 * Calculadoras de las guías. La fórmula vive en una función pura y se usa en dos sitios con el mismo código:
 * los tests la ejecutan y la página la lleva dentro de su <script> (con `Function.prototype.toString`), de modo
 * que lo que ve la persona es exactamente lo que se ha probado. Por eso cada función es autosuficiente: no puede
 * llamar a nada que esté fuera de ella.
 */
import { escapeHtml } from '../html.js';
import type { IdiomaSeo } from './rutas.js';
import type { IdCalculadora } from './tipos.js';

export interface EntradaCache {
  miembros: number;
  gastos: number;
  horas: number;
  valorHora: number;
}

/** Mínimo para que un concierto no te cueste dinero: gastos reales más el valor de tu tiempo. */
export function calcCacheMinimo(v: EntradaCache) {
  const miembros = Math.max(1, Math.round(v.miembros || 0));
  const gastos = Math.max(0, v.gastos || 0);
  const tiempo = Math.max(0, v.horas || 0) * Math.max(0, v.valorHora || 0) * miembros;
  const total = gastos + tiempo;
  return { gastos, tiempo, total, porMiembro: total / miembros, soloGastos: gastos };
}

export interface EntradaSlot {
  slot: number;
  media: number;
  margen?: number;
  transicion?: number;
}

/** Cuántos temas caben: (minutos del slot menos margen) entre (duración media más transición), por abajo. */
export function calcSlotSetlist(v: EntradaSlot) {
  const margen = v.margen ?? 5;
  const transicion = v.transicion ?? 0.5;
  const unidad = Math.max(0.5, v.media || 0) + transicion;
  const temas = Math.max(0, Math.floor(((v.slot || 0) - margen) / unidad + 1e-9));
  return { temas, minutos: Math.round(temas * unidad * 10) / 10, sobra: Math.max(0, Math.round(((v.slot || 0) - temas * unidad) * 10) / 10) };
}

export interface EntradaEmbudo {
  objetivo: number;
  respuesta: number;
  fecha: number;
  meses: number;
}

/**
 * Cuántas salas contactar para llegar a tus bolos: objetivo entre (tasa de respuesta × tasa de fecha tras responder),
 * por arriba. `respuesta` y `fecha` van en porcentaje y `meses` es el plazo para repartir los envíos.
 */
export function calcEmbudoBolos(v: EntradaEmbudo) {
  const objetivo = Math.max(0, Math.round(v.objetivo || 0));
  const respuesta = Math.min(100, Math.max(0, v.respuesta || 0));
  const fecha = Math.min(100, Math.max(0, v.fecha || 0));
  const meses = Math.max(1, v.meses || 1);
  const tasa = (respuesta / 100) * (fecha / 100);
  const salas = tasa > 0 ? Math.ceil(objetivo / tasa - 1e-9) : 0;
  return {
    salas,
    respuestas: Math.ceil((salas * respuesta) / 100 - 1e-9),
    porSemana: Math.round((salas / (meses * 4.345)) * 10) / 10,
    unaDeCada: tasa > 0 ? Math.round((1 / tasa) * 10) / 10 : 0,
  };
}

export interface EntradaEpk {
  escucha: number;
  foto: number;
  video: number;
  dato: number;
  bio: number;
  rider: number;
  contacto: number;
  enlace: number;
}

/** Puntúa un EPK: cada elemento marcado (1) suma una octava parte. */
export function calcEpkChecklist(v: EntradaEpk) {
  const claves = ['escucha', 'foto', 'video', 'dato', 'bio', 'rider', 'contacto', 'enlace'] as const;
  let hechos = 0;
  for (const k of claves) if ((v as unknown as Record<string, number>)[k] > 0) hechos++;
  return { hechos, faltan: claves.length - hechos, porcentaje: Math.round((hechos / claves.length) * 100) };
}

interface DefCalc {
  titulo: string;
  campos: Array<{ nombre: string; etiqueta: string; valor: number; paso: number; casilla?: boolean }>;
  resultados: Array<{ clave: string; etiqueta: string; unidad: string; grande?: boolean }>;
  nota: string;
  /** Muestra un selector de moneda y pone el símbolo elegido donde la unidad es «€» (el cálculo no depende de la moneda). */
  moneda?: boolean;
}

const MONEDAS = ['€', '$', '£', '¥'] as const;
const MONEDA_POR_DEFECTO: Record<IdiomaSeo, string> = { es: '€', en: '$' };
const ETIQUETA_MONEDA: Record<IdiomaSeo, string> = { es: 'Moneda', en: 'Currency' };

const DEFINICIONES: Record<IdiomaSeo, Record<IdCalculadora, DefCalc>> = {
  es: {
    'cache-minimo': {
      titulo: 'Calculadora: tu caché mínimo',
      campos: [
        { nombre: 'miembros', etiqueta: 'Personas en el escenario', valor: 4, paso: 1 },
        { nombre: 'gastos', etiqueta: 'Gastos del concierto', valor: 120, paso: 10 },
        { nombre: 'horas', etiqueta: 'Horas por persona', valor: 10, paso: 0.5 },
        { nombre: 'valorHora', etiqueta: 'Lo que vale tu hora', valor: 10, paso: 1 },
      ],
      resultados: [
        { clave: 'total', etiqueta: 'Tu mínimo para el concierto', unidad: '€', grande: true },
        { clave: 'porMiembro', etiqueta: 'Por persona', unidad: '€' },
        { clave: 'soloGastos', etiqueta: 'Solo para no perder dinero (gastos)', unidad: '€' },
      ],
      nota: 'Cuenta en «gastos» transporte, backline, comida y sonido si lo pones tú. En «horas» suma ensayo, montaje, viaje y concierto. Elige tu moneda: el cálculo es el mismo.',
      moneda: true,
    },
    'embudo-bolos': {
      titulo: 'Calculadora: a cuántas salas escribir',
      campos: [
        { nombre: 'objetivo', etiqueta: 'Bolos que quieres conseguir', valor: 12, paso: 1 },
        { nombre: 'respuesta', etiqueta: 'Salas que contestan (%)', valor: 20, paso: 5 },
        { nombre: 'fecha', etiqueta: 'De las que contestan, acaban en fecha (%)', valor: 30, paso: 5 },
        { nombre: 'meses', etiqueta: 'Plazo en meses', valor: 6, paso: 1 },
      ],
      resultados: [
        { clave: 'salas', etiqueta: 'Salas a contactar', unidad: '', grande: true },
        { clave: 'respuestas', etiqueta: 'Respuestas que recibirás', unidad: '' },
        { clave: 'porSemana', etiqueta: 'Mensajes por semana', unidad: '' },
      ],
      nota: 'Los porcentajes por defecto son de ejemplo. En cuanto tengas tus propios envíos, cámbialos por los tuyos.',
    },
    'epk-checklist': {
      titulo: 'Puntúa tu EPK',
      campos: [
        { nombre: 'escucha', etiqueta: 'Se puede escuchar un tema sin salir de la página', valor: 0, paso: 1, casilla: true },
        { nombre: 'foto', etiqueta: 'Tiene una foto de banda de calidad', valor: 0, paso: 1, casilla: true },
        { nombre: 'video', etiqueta: 'Hay un vídeo de directo de 30 a 60 segundos', valor: 0, paso: 1, casilla: true },
        { nombre: 'dato', etiqueta: 'Cita un dato real de tracción', valor: 0, paso: 1, casilla: true },
        { nombre: 'bio', etiqueta: 'La biografía cabe en cuatro o cinco líneas', valor: 0, paso: 1, casilla: true },
        { nombre: 'rider', etiqueta: 'El rider técnico está a la vista', valor: 0, paso: 1, casilla: true },
        { nombre: 'contacto', etiqueta: 'El contacto se ve sin buscarlo', valor: 0, paso: 1, casilla: true },
        { nombre: 'enlace', etiqueta: 'Se comparte con un enlace, no como PDF pesado', valor: 0, paso: 1, casilla: true },
      ],
      resultados: [
        { clave: 'hechos', etiqueta: 'Elementos cubiertos (de 8)', unidad: '', grande: true },
        { clave: 'porcentaje', etiqueta: 'Tu EPK está al', unidad: '%' },
        { clave: 'faltan', etiqueta: 'Te faltan', unidad: 'elementos' },
      ],
      nota: 'No es una nota oficial: es una lista de comprobación. Lo que no marques es lo primero que arreglar.',
    },
    'slot-setlist': {
      titulo: 'Calculadora: cuántos temas caben',
      campos: [
        { nombre: 'slot', etiqueta: 'Minutos en el escenario', valor: 60, paso: 5 },
        { nombre: 'media', etiqueta: 'Duración media de un tema (min)', valor: 4, paso: 0.5 },
      ],
      resultados: [
        { clave: 'temas', etiqueta: 'Temas que caben', unidad: '', grande: true },
        { clave: 'minutos', etiqueta: 'Minutos de música y transiciones', unidad: 'min' },
      ],
      nota: 'Cuenta medio minuto de transición por tema y deja cinco minutos de margen para imprevistos.',
    },
  },
  en: {
    'cache-minimo': {
      titulo: 'Calculator: your minimum fee',
      campos: [
        { nombre: 'miembros', etiqueta: 'People on stage', valor: 4, paso: 1 },
        { nombre: 'gastos', etiqueta: 'Show costs', valor: 120, paso: 10 },
        { nombre: 'horas', etiqueta: 'Hours per person', valor: 10, paso: 0.5 },
        { nombre: 'valorHora', etiqueta: 'What your hour is worth', valor: 10, paso: 1 },
      ],
      resultados: [
        { clave: 'total', etiqueta: 'Your minimum for the show', unidad: '€', grande: true },
        { clave: 'porMiembro', etiqueta: 'Per person', unidad: '€' },
        { clave: 'soloGastos', etiqueta: 'Just to avoid losing money (costs)', unidad: '€' },
      ],
      nota: 'Count transport, backline, food and sound under "costs" if you provide them. Under "hours" add rehearsal, load-in, travel and the show. Pick your currency: the math is the same.',
      moneda: true,
    },
    'embudo-bolos': {
      titulo: 'Calculator: how many venues to write to',
      campos: [
        { nombre: 'objetivo', etiqueta: 'Gigs you want to book', valor: 12, paso: 1 },
        { nombre: 'respuesta', etiqueta: 'Venues that reply (%)', valor: 20, paso: 5 },
        { nombre: 'fecha', etiqueta: 'Of those, end up with a date (%)', valor: 30, paso: 5 },
        { nombre: 'meses', etiqueta: 'Timeframe in months', valor: 6, paso: 1 },
      ],
      resultados: [
        { clave: 'salas', etiqueta: 'Venues to contact', unidad: '', grande: true },
        { clave: 'respuestas', etiqueta: 'Replies you will get', unidad: '' },
        { clave: 'porSemana', etiqueta: 'Messages per week', unidad: '' },
      ],
      nota: 'The default percentages are examples. As soon as you have sends of your own, swap them for yours.',
    },
    'epk-checklist': {
      titulo: 'Score your press kit',
      campos: [
        { nombre: 'escucha', etiqueta: 'You can hear a track without leaving the page', valor: 0, paso: 1, casilla: true },
        { nombre: 'foto', etiqueta: 'It has a quality band photo', valor: 0, paso: 1, casilla: true },
        { nombre: 'video', etiqueta: 'There is a 30 to 60 second live video', valor: 0, paso: 1, casilla: true },
        { nombre: 'dato', etiqueta: 'It cites one real proof point', valor: 0, paso: 1, casilla: true },
        { nombre: 'bio', etiqueta: 'The bio fits in four or five lines', valor: 0, paso: 1, casilla: true },
        { nombre: 'rider', etiqueta: 'The technical rider is easy to find', valor: 0, paso: 1, casilla: true },
        { nombre: 'contacto', etiqueta: 'Contact details are visible without searching', valor: 0, paso: 1, casilla: true },
        { nombre: 'enlace', etiqueta: 'It is shared as a link, not a heavy PDF', valor: 0, paso: 1, casilla: true },
      ],
      resultados: [
        { clave: 'hechos', etiqueta: 'Items covered (out of 8)', unidad: '', grande: true },
        { clave: 'porcentaje', etiqueta: 'Your press kit is at', unidad: '%' },
        { clave: 'faltan', etiqueta: 'Still missing', unidad: 'items' },
      ],
      nota: 'It is not an official grade: it is a checklist. What you leave unticked is the first thing to fix.',
    },
    'slot-setlist': {
      titulo: 'Calculator: how many songs fit',
      campos: [
        { nombre: 'slot', etiqueta: 'Minutes on stage', valor: 60, paso: 5 },
        { nombre: 'media', etiqueta: 'Average song length (min)', valor: 4, paso: 0.5 },
      ],
      resultados: [
        { clave: 'temas', etiqueta: 'Songs that fit', unidad: '', grande: true },
        { clave: 'minutos', etiqueta: 'Minutes of music and changeovers', unidad: 'min' },
      ],
      nota: 'Count half a minute of changeover per song and keep five minutes of margin for surprises.',
    },
  },
};

const FORMULAS: Record<IdCalculadora, (v: never) => unknown> = {
  'epk-checklist': calcEpkChecklist as (v: never) => unknown,
  'embudo-bolos': calcEmbudoBolos as (v: never) => unknown,
  'cache-minimo': calcCacheMinimo as (v: never) => unknown,
  'slot-setlist': calcSlotSetlist as (v: never) => unknown,
};

/** Formulario de una calculadora. Sin JavaScript queda con los valores de ejemplo y un aviso. */
export function calculadoraHtml(id: IdCalculadora, idioma: IdiomaSeo): string {
  const d = DEFINICIONES[idioma][id];
  const campos = d.campos
    .map((c) =>
      c.casilla
        ? `<label class="casilla"><input type="checkbox" name="${c.nombre}"><span>${escapeHtml(c.etiqueta)}</span></label>`
        : `<label>${escapeHtml(c.etiqueta)}<input type="number" inputmode="decimal" name="${c.nombre}" value="${c.valor}" min="0" step="${c.paso}"></label>`
    )
    .join('');
  const unidad = (u: string) => (!u ? '' : d.moneda && u === '€' ? ` <span data-moneda>${MONEDA_POR_DEFECTO[idioma]}</span>` : ` ${escapeHtml(u)}`);
  // En inglés el símbolo de moneda va delante de la cifra ($520); en español, detrás (520 €).
  const res = d.resultados
    .map((r) => {
      const delante = idioma === 'en' && d.moneda && r.unidad === '€';
      return `<p${r.grande ? ' class="grande"' : ''}>${escapeHtml(r.etiqueta)}: ${delante ? `<span data-moneda>${MONEDA_POR_DEFECTO[idioma]}</span>` : ''}<strong data-r="${r.clave}">–</strong>${delante ? '' : unidad(r.unidad)}</p>`;
    })
    .join('');
  const selector = d.moneda
    ? `<label>${escapeHtml(ETIQUETA_MONEDA[idioma])}<select name="moneda">${MONEDAS.map((m) => `<option value="${m}"${m === MONEDA_POR_DEFECTO[idioma] ? ' selected' : ''}>${m}</option>`).join('')}</select></label>`
    : '';
  return `<form class="calc no-imprimir" data-calc="${id}" onsubmit="return false"><h3>${escapeHtml(d.titulo)}</h3><div class="campos">${selector}${campos}</div><div class="res" aria-live="polite">${res}</div><small>${escapeHtml(d.nota)}</small></form>`;
}

/** Script único de la página: lleva las fórmulas probadas y rellena los resultados al teclear. */
export function scriptCalculadoras(ids: IdCalculadora[], idioma: IdiomaSeo): string {
  if (!ids.length) return '';
  const unicos = [...new Set(ids)];
  const formulas = unicos.map((id) => `'${id}':${FORMULAS[id].toString()}`).join(',');
  const local = idioma === 'es' ? 'es-ES' : 'en-GB';
  return `<script>(function(){var F={${formulas}};var L='${local}';document.querySelectorAll('form.calc').forEach(function(f){var fn=F[f.getAttribute('data-calc')];if(!fn)return;function run(){var v={};f.querySelectorAll('input').forEach(function(i){v[i.name]=i.type==='checkbox'?(i.checked?1:0):(parseFloat(i.value)||0)});var r=fn(v);f.querySelectorAll('[data-r]').forEach(function(e){var n=r[e.getAttribute('data-r')];e.textContent=typeof n==='number'?n.toLocaleString(L,{maximumFractionDigits:1}):'–'});var m=f.querySelector('select[name=moneda]');if(m)f.querySelectorAll('[data-moneda]').forEach(function(e){e.textContent=m.value})}f.addEventListener('input',run);f.addEventListener('change',run);run()})})();</script>`;
}
