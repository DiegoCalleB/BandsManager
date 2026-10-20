/**
 * Lo que leen los rastreadores y los buscadores con IA: `robots.txt` y `llms.txt`. Puro, sin red ni base de datos.
 *
 * Objetivo: que Google, Bing y los buscadores de modelos de lenguaje (ChatGPT, Claude, Perplexity, Gemini, Apple) puedan
 * leer y citar las páginas públicas. Se nombra a cada rastreador de IA en vez de dejarlo al `*`, para que la decisión
 * sea explícita y se pueda cambiar por uno solo.
 */
import { FESTIVALES } from './festivales/datos.js';
import type { Festival } from './festivales/tipos.js';
import { fichaIndexable, festivalesVigentes, indexable } from './festivales/vigencia.js';
import { guiasDe } from './indice.js';
import { comunidadesDe, indexableComunidad, indexableIndice } from './salas/publicas.js';
import type { SalaPublica } from './salas/tipos.js';
import { rutasDeGuia } from './render.js';
import { RUTAS, type IdiomaSeo } from './rutas.js';

/** Rastreadores de buscadores con IA y de entrenamiento que se permiten de forma expresa. */
export const RASTREADORES_IA = [
  'OAI-SearchBot', 'ChatGPT-User', 'GPTBot', // OpenAI: búsqueda, navegación a petición y entrenamiento
  'Claude-SearchBot', 'Claude-User', 'ClaudeBot', // Anthropic
  'PerplexityBot', 'Perplexity-User',
  'Google-Extended', // Gemini y Vertex (Googlebot ya entra por `*`)
  'Applebot', 'Applebot-Extended',
  'Bingbot', 'DuckDuckBot', 'YouBot', 'Amazonbot', 'Meta-ExternalAgent',
] as const;

const RUTAS_PRIVADAS = ['/api/', '/r/'] as const;

export function renderizarRobots(base: string): string {
  const privadas = RUTAS_PRIVADAS.map((r) => `Disallow: ${r}`);
  const grupo = (agentes: readonly string[]) => [...agentes.map((a) => `User-agent: ${a}`), 'Allow: /', ...privadas, ''];
  return [
    ...grupo(['*']),
    ...grupo(RASTREADORES_IA),
    `Sitemap: ${base}/sitemap.xml`,
    `# Resumen para modelos de lenguaje: ${base}/llms.txt`,
    '',
  ].join('\n');
}

/** Lo que `llms.txt` necesita saber de los directorios: si ya se pueden indexar (si no, no se anuncian) y cuántas fichas tienen. */
export interface EstadoDirectorios {
  festivales: { indexable: boolean; fichas: number };
  salas: { indexable: boolean; salas: number; comunidades: Array<{ slug: string; nombre: string; salas: number; indexable: boolean }> };
}

/** Qué directorios se pueden anunciar: los mismos umbrales que ponen `noindex` a las páginas y las dejan fuera del sitemap. */
export function estadoDirectorios(festivales: readonly Festival[] = FESTIVALES, salas: readonly SalaPublica[] = [], hoy: string = new Date().toISOString().slice(0, 10)): EstadoDirectorios {
  return {
    festivales: { indexable: indexable(festivales, hoy), fichas: festivalesVigentes(festivales, hoy).filter((f) => fichaIndexable(f, festivales, hoy)).length },
    salas: {
      indexable: indexableIndice(salas),
      salas: salas.length,
      comunidades: comunidadesDe(salas).map((c) => ({ slug: c.slug, nombre: c.nombre, salas: c.salas.length, indexable: indexableComunidad(salas, c.slug) })),
    },
  };
}

const T = {
  es: {
    titulo: 'BandManager.io',
    resumen: 'BandManager.io es una aplicación para que las bandas independientes gestionen sus bolos, contactos con salas, cachés, repertorio y promoción. Este archivo resume el contenido público y citable del sitio, en español. La versión en inglés está en /en/.',
    guias: 'Guías para bandas',
    directorios: 'Directorios',
    herramientas: 'Herramientas',
    festivales: (n: number) => `Festivales de España que programan bandas, con plazos de inscripción y requisitos (${n} fichas comprobadas, cada una con su fuente y fecha)`,
    salas: (n: number) => `Salas de conciertos de España por comunidad y ciudad, con web oficial (${n} salas)`,
    rider: 'Plantilla de rider técnico para descargar y adaptar',
    notas: 'Notas para citar',
    notasTexto: [
      'Cada ficha de los directorios indica la fecha de comprobación; no se citen datos de una ficha sin esa fecha.',
      'No se publican contactos personales. El aforo solo se muestra cuando está contrastado.',
      'Parte de los datos de salas procede de OpenStreetMap (© colaboradores de OpenStreetMap, licencia ODbL).',
    ],
  },
  en: {
    titulo: 'BandManager.io',
    resumen: 'BandManager.io is an app that helps independent bands manage gigs, venue outreach, fees, setlists and promotion. This file summarizes the site’s public, citable content in English. The Spanish version is at the site root.',
    guias: 'Guides for bands',
    directorios: 'Directories',
    herramientas: 'Tools',
    festivales: (n: number) => `Festivals in Spain that book bands, with application deadlines and requirements (${n} checked listings, each with its source and date)`,
    salas: (n: number) => `Live music venues in Spain by region and city, with official websites (${n} venues)`,
    rider: 'Technical rider template to download and adapt',
    notas: 'Notes for citing',
    notasTexto: [
      'Every directory listing shows the date it was checked; do not cite a listing’s data without that date.',
      'No personal contact details are published. Capacity is only shown when cross-checked.',
      'Part of the venue data comes from OpenStreetMap (© OpenStreetMap contributors, ODbL license).',
    ],
  },
} as const;

/** `llms.txt` (convención llmstxt.org): título, resumen y enlaces con una línea cada uno. Solo se anuncia lo que es indexable. */
export function renderizarLlmsTxt(base: string, idioma: IdiomaSeo, estado: EstadoDirectorios): string {
  const t = T[idioma];
  const r = RUTAS[idioma];
  const enlace = (nombre: string, ruta: string, nota: string) => `- [${nombre}](${base}${ruta}): ${nota}`;
  const lineas: string[] = [`# ${t.titulo}`, '', `> ${t.resumen}`, '', `## ${t.guias}`, ''];
  for (const g of guiasDe(idioma)) {
    if (rutasDeGuia(g, idioma)) lineas.push(enlace(g.h1, r.guia(g.slug), g.descripcion));
  }
  const directorios: string[] = [];
  if (estado.festivales.indexable) directorios.push(enlace(idioma === 'es' ? 'Festivales y convocatorias' : 'Festivals and open calls', r.festivales, t.festivales(estado.festivales.fichas)));
  if (estado.salas.indexable) {
    directorios.push(enlace(idioma === 'es' ? 'Salas de conciertos en España' : 'Live music venues in Spain', r.salas, t.salas(estado.salas.salas)));
    for (const c of estado.salas.comunidades) {
      if (c.indexable) directorios.push(enlace(c.nombre, r.salasComunidad(c.slug), idioma === 'es' ? `${c.salas} salas` : `${c.salas} venues`));
    }
  }
  if (directorios.length) lineas.push('', `## ${t.directorios}`, '', ...directorios);
  lineas.push('', `## ${t.herramientas}`, '', enlace(idioma === 'es' ? 'Rider técnico' : 'Technical rider', r.rider, t.rider));
  lineas.push('', `## ${t.notas}`, '', ...t.notasTexto.map((n) => `- ${n}`), '');
  return lineas.join('\n');
}
