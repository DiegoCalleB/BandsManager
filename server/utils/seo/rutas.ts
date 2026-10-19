/**
 * Rutas públicas de SEO por idioma. Los tramos de la URL de los directorios van en inglés en los dos idiomas; las páginas
 * en inglés viven bajo `/en/` y la landing inglesa es `/en`.
 */
export type IdiomaSeo = 'es' | 'en';

export const RUTAS = {
  es: { landing: '/', guias: '/guias', guia: (slug: string) => `/guias/${slug}`, rider: '/plantilla-rider-tecnico', listados: '/directories', festivales: '/directories/festivals', festival: (slug: string) => `/directories/festivals/${slug}` },
  en: { landing: '/en', guias: '/en/guides', guia: (slug: string) => `/en/guides/${slug}`, rider: '/en/technical-rider-template', listados: '/en/directories', festivales: '/en/directories/festivals', festival: (slug: string) => `/en/directories/festivals/${slug}` },
} as const;

export const OTRO_IDIOMA: Record<IdiomaSeo, IdiomaSeo> = { es: 'en', en: 'es' };

/** `hreflang` recíproco entre las dos versiones de una página; `x-default` apunta al español. */
export function alternativasPar(base: string, rutaEs: string, rutaEn: string): Array<{ hreflang: string; href: string }> {
  return [
    { hreflang: 'es', href: `${base}${rutaEs}` },
    { hreflang: 'en', href: `${base}${rutaEn}` },
    { hreflang: 'x-default', href: `${base}${rutaEs}` },
  ];
}

/** Enlace de alta con UTM: `medio` dice dónde estaba el botón y `campana` qué página lo trajo. */
export function registroUrl(base: string, idioma: IdiomaSeo, medio: string, campana: string): string {
  return `${base}${RUTAS[idioma].landing}?utm_source=seo&utm_medium=${encodeURIComponent(medio)}&utm_campaign=${encodeURIComponent(campana)}`;
}
