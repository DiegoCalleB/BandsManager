/** Entradas del sitemap de las páginas de SEO: cada par es/en declara sus alternativas recíprocas. */
import type { EntradaSitemap } from '../paginaConcierto.js';
import { FESTIVALES } from './festivales/datos.js';
import { ciudadesDe, comunidadesDe, indexableCiudad, indexableComunidad, indexableIndice } from './salas/publicas.js';
import type { SalaPublica } from './salas/tipos.js';
import type { Festival } from './festivales/tipos.js';
import { fichaIndexable, festivalesVigentes, indexable } from './festivales/vigencia.js';
import { GUIAS } from './indice.js';
import { rutasDeGuia } from './render.js';
import { RUTAS, alternativasPar } from './rutas.js';
import { FECHA_CONTENIDO } from './textos.js';

export function entradasSeo(base: string, hoy: string = new Date().toISOString().slice(0, 10), festivales: readonly Festival[] = FESTIVALES, salas: readonly SalaPublica[] = []): EntradaSitemap[] {
  const pares: Array<{ es: string; en: string }> = [
    { es: RUTAS.es.rider, en: RUTAS.en.rider },
    { es: RUTAS.es.guias, en: RUTAS.en.guias },
    ...GUIAS.map((g) => rutasDeGuia(g, 'es')).filter((p): p is { es: string; en: string } => !!p),
  ];
  const entradas = pares.flatMap((p) => {
    const alternativas = alternativasPar(base, p.es, p.en);
    return [{ loc: `${base}${p.es}`, lastmod: FECHA_CONTENIDO, alternativas }, { loc: `${base}${p.en}`, lastmod: FECHA_CONTENIDO, alternativas }];
  });
  // Cada directorio entra en el sitemap solo cuando es indexable (umbrales en vigencia.ts y salas/publicas.ts).
  const conSalas = [...entradas, ...entradasSalas(base, salas)];
  if (!indexable(festivales, hoy)) return conSalas;
  const vigentes = festivalesVigentes(festivales, hoy).filter((f) => fichaIndexable(f, festivales, hoy));
  const ultima = vigentes.map((f) => f.verificadoEn).sort().at(-1) ?? FECHA_CONTENIDO;
  const paresFestivales = [{ es: RUTAS.es.festivales, en: RUTAS.en.festivales, lastmod: ultima }, ...vigentes.map((f) => ({ es: RUTAS.es.festival(f.slug), en: RUTAS.en.festival(f.slug), lastmod: f.verificadoEn }))];
  return [...conSalas, ...paresFestivales.flatMap((p) => {
    const alternativas = alternativasPar(base, p.es, p.en);
    return [{ loc: `${base}${p.es}`, lastmod: p.lastmod, alternativas }, { loc: `${base}${p.en}`, lastmod: p.lastmod, alternativas }];
  })];
}

/** Solo las listas con volumen suficiente; la ficha de una sala va siempre con `noindex` y no entra. */
function entradasSalas(base: string, salas: readonly SalaPublica[]): EntradaSitemap[] {
  const pares: Array<{ es: string; en: string }> = [];
  if (indexableIndice(salas)) pares.push({ es: RUTAS.es.salas, en: RUTAS.en.salas });
  for (const c of comunidadesDe(salas)) {
    if (!indexableComunidad(salas, c.slug)) continue;
    pares.push({ es: RUTAS.es.salasComunidad(c.slug), en: RUTAS.en.salasComunidad(c.slug) });
    for (const ciudad of ciudadesDe(salas, c.slug)) if (indexableCiudad(salas, c.slug, ciudad.slug)) pares.push({ es: RUTAS.es.salasCiudad(c.slug, ciudad.slug), en: RUTAS.en.salasCiudad(c.slug, ciudad.slug) });
  }
  return pares.flatMap((p) => {
    const alternativas = alternativasPar(base, p.es, p.en);
    return [{ loc: `${base}${p.es}`, lastmod: FECHA_CONTENIDO, alternativas }, { loc: `${base}${p.en}`, lastmod: FECHA_CONTENIDO, alternativas }];
  });
}
