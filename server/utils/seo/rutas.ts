/** Rutas públicas de SEO por idioma. Las páginas en inglés viven bajo `/en/` y la landing inglesa es `/en`. */
export type IdiomaSeo = 'es' | 'en';

export const RUTAS = {
  es: { landing: '/', guias: '/guias', guia: (slug: string) => `/guias/${slug}`, rider: '/plantilla-rider-tecnico' },
  en: { landing: '/en', guias: '/en/guides', guia: (slug: string) => `/en/guides/${slug}`, rider: '/en/technical-rider-template' },
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
