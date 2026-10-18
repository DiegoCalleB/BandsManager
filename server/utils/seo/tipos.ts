/** Una guía de SEO (`/guias/<slug>`): contenido fijo y revisable, sin datos de ninguna banda. */
export interface SeccionGuia {
  h2: string;
  parrafos?: string[];
  /** Lista con viñetas. */
  lista?: string[];
  /** Lista numerada. */
  pasos?: string[];
}

export interface GuiaSeo {
  slug: string;
  /** `<title>` y `og:title`: lleva la palabra clave al principio. */
  titulo: string;
  h1: string;
  /** Meta description (≤ 160 caracteres). */
  descripcion: string;
  intro: string;
  secciones: SeccionGuia[];
  faq: Array<{ q: string; a: string }>;
  /** Slugs de otras guías (o la ruta de la plantilla de rider) a enlazar al final. */
  relacionadas: string[];
  cta: { titulo: string; texto: string; boton: string };
}
