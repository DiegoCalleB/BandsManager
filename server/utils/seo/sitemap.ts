/** Entradas del sitemap de las páginas de SEO: cada par es/en declara sus alternativas recíprocas. */
import type { EntradaSitemap } from '../paginaConcierto.js';
import { GUIAS } from './indice.js';
import { rutasDeGuia } from './render.js';
import { RUTAS, alternativasPar } from './rutas.js';

export function entradasSeo(base: string): EntradaSitemap[] {
  const pares: Array<{ es: string; en: string }> = [
    { es: RUTAS.es.rider, en: RUTAS.en.rider },
    { es: RUTAS.es.guias, en: RUTAS.en.guias },
    ...GUIAS.map((g) => rutasDeGuia(g, 'es')).filter((p): p is { es: string; en: string } => !!p),
  ];
  return pares.flatMap((p) => {
    const alternativas = alternativasPar(base, p.es, p.en);
    return [{ loc: `${base}${p.es}`, alternativas }, { loc: `${base}${p.en}`, alternativas }];
  });
}
