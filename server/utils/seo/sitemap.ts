/** Entradas del sitemap de las páginas de SEO: cada par es/en declara sus alternativas recíprocas. */
import type { EntradaSitemap } from '../paginaConcierto.js';
import { FESTIVALES } from './festivales/datos.js';
import { fichaIndexable, festivalesVigentes, indexable } from './festivales/vigencia.js';
import { GUIAS } from './indice.js';
import { rutasDeGuia } from './render.js';
import { RUTAS, alternativasPar } from './rutas.js';
import { FECHA_CONTENIDO } from './textos.js';

export function entradasSeo(base: string, hoy: string = new Date().toISOString().slice(0, 10)): EntradaSitemap[] {
  const pares: Array<{ es: string; en: string }> = [
    { es: RUTAS.es.rider, en: RUTAS.en.rider },
    { es: RUTAS.es.guias, en: RUTAS.en.guias },
    ...GUIAS.map((g) => rutasDeGuia(g, 'es')).filter((p): p is { es: string; en: string } => !!p),
  ];
  const entradas = pares.flatMap((p) => {
    const alternativas = alternativasPar(base, p.es, p.en);
    return [{ loc: `${base}${p.es}`, lastmod: FECHA_CONTENIDO, alternativas }, { loc: `${base}${p.en}`, lastmod: FECHA_CONTENIDO, alternativas }];
  });
  // El directorio entra en el sitemap solo cuando es indexable (ver MIN_FICHAS_INDEXABLES).
  if (!indexable(FESTIVALES, hoy)) return entradas;
  const vigentes = festivalesVigentes(FESTIVALES, hoy).filter((f) => fichaIndexable(f, FESTIVALES, hoy));
  const ultima = vigentes.map((f) => f.verificadoEn).sort().at(-1) ?? FECHA_CONTENIDO;
  const festivales = [{ es: RUTAS.es.festivales, en: RUTAS.en.festivales, lastmod: ultima }, ...vigentes.map((f) => ({ es: RUTAS.es.festival(f.slug), en: RUTAS.en.festival(f.slug), lastmod: f.verificadoEn }))];
  return [...entradas, ...festivales.flatMap((p) => {
    const alternativas = alternativasPar(base, p.es, p.en);
    return [{ loc: `${base}${p.es}`, lastmod: p.lastmod, alternativas }, { loc: `${base}${p.en}`, lastmod: p.lastmod, alternativas }];
  })];
}
