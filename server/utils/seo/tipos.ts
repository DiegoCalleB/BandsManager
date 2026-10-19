/** Una guía de SEO: contenido fijo y revisable, sin datos de ninguna banda. */
/** Tabla de datos o plantilla copiable dentro de una sección. */
export interface TablaGuia {
  titulo?: string;
  cabeceras: string[];
  filas: string[][];
}

/** Gráfico de líneas definido con datos (ver `graficoLineasFigura`). Las cifras de un ejemplo deben decir que lo son. */
export interface GraficoLineas {
  /** Descripción para lectores de pantalla: qué muestra y qué conclusión se saca. */
  alt: string;
  pie: string;
  ejeX: { titulo: string; etiquetas: string[] };
  ejeY: { titulo: string; max: number; unidad?: string };
  series: Array<{ nombre: string; valores: number[]; tipo?: 'principal' | 'secundaria' | 'neutra' | 'referencia' }>;
  /** Anotación sobre un punto concreto. */
  nota?: { serie: number; indice: number; texto: string };
}

export type IdCalculadora = 'cache-minimo' | 'slot-setlist' | 'embudo-bolos';

export interface SeccionGuia {
  h2: string;
  parrafos?: string[];
  /** Infografía propia (SVG generado en servidor, ver `figuras.ts`). */
  figura?: 'curva-setlist';
  grafico?: GraficoLineas;
  /** Calculadora interactiva (ver `calculadoras.ts`). */
  calculadora?: IdCalculadora;
  /** Recuadro destacado con la idea que no se debe olvidar. */
  aviso?: string;
  tablas?: TablaGuia[];
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
  /** Tres ideas clave para quien no va a leer entera la guía (y para el fragmento destacado). */
  resumen: string[];
  secciones: SeccionGuia[];
  faq: Array<{ q: string; a: string }>;
  /** Slugs de otras guías del mismo idioma, o la ruta de la plantilla de rider, a enlazar al final. */
  relacionadas: string[];
  cta: { titulo: string; texto: string; boton: string };
}

/** Guía en inglés: lleva el slug de su equivalente en español para el `hreflang` recíproco. */
export interface GuiaSeoEn extends GuiaSeo {
  slugEs: string;
}
