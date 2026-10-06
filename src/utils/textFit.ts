// Ajuste de texto a un ancho disponible para las notas manuscritas del repertorio imprimible
// (PdfExportModal.tsx): cada nota (miembro, nota del bolo, nota general) se pinta en su propia
// línea, apiladas una encima de otra — no todas seguidas en una sola línea, y CADA nota se queda
// siempre en una única línea (nunca se parte en dos: un salto de línea en una anotación "escrita
// a mano" no queda natural). El texto de una nota NUNCA se trunca ni se pierde: se busca un
// tamaño de fuente común a todas (para que se vean consistentes) encogiendo tanto como haga
// falta, y si ni al tamaño mínimo compartido cabe una nota concreta, esa nota (solo esa) se
// encoge aún más por su cuenta hasta caber entera — con un suelo absoluto (NOTE_FONT_HARD_FLOOR_PX)
// solo para evitar tamaños ilegibles/cero, nunca para cortar texto. La función de medición se
// inyecta para poder testear el algoritmo con vitest sin depender de un <canvas> real (ver
// textFit.test.ts).

export interface NoteSegment {
  text: string;
  className: string;
  /**
   * Fracción (0-1) del tamaño máximo que esta nota puede usar. Las notas secundarias (la nota
   * general de la canción) llevan menos de 1 para no competir con la del músico o la del bolo.
   */
  maxScale?: number;
}

export interface NoteLine {
  text: string;
  className: string;
  /** Tamaño propio de esta línea: el mayor (hasta su tope) con el que cabe en una línea, sin
   * bajar nunca del mínimo legible. Si ni al mínimo cabe, se queda en el mínimo y el texto baja a
   * una segunda línea (white-space normal en el CSS) en vez de encogerse hasta ser ilegible. */
  fontSizePx: number;
}

export interface StackedFitResult {
  /** Tamaño de la nota más grande de la fila (referencia; cada línea lleva el suyo). */
  fontSizePx: number;
  lines: NoteLine[];
}

export interface FitOptions {
  maxWidthPx: number;
  maxFontSizePx: number;
  minFontSizePx: number;
  fontFamily: string;
  fontWeight?: string | number;
  fontStepPx?: number;
  measure: (text: string, fontSizePx: number) => number;
}

/**
 * Ajusta cada nota a su propia línea, apiladas, con un tamaño de fuente PROPIO para cada una: el
 * mayor, hasta su tope (`maxFontSizePx` por su `maxScale`), con el que cabe en `maxWidthPx`.
 * Antes todas compartían un único tamaño, así que una nota general larga arrastraba a la nota
 * del músico (la que más importa leer) hasta el mínimo y salía diminuta.
 * Nunca baja de `minFontSizePx`: si una nota ni a ese tamaño cabe en una línea, conserva su
 * texto íntegro (jamás se trunca con "…") y el CSS la baja a una segunda línea.
 */
export function fitStackedNoteSegments(segments: NoteSegment[], opts: FitOptions): StackedFitResult {
  const nonEmpty = segments.filter((s) => s.text && s.text.trim().length > 0);
  if (nonEmpty.length === 0) {
    return { fontSizePx: opts.maxFontSizePx, lines: [] };
  }

  const { maxFontSizePx, minFontSizePx, maxWidthPx, measure, fontStepPx = 0.5 } = opts;

  const lines: NoteLine[] = nonEmpty.map((seg) => {
    const cap = Math.max(minFontSizePx, maxFontSizePx * (seg.maxScale ?? 1));
    let size = minFontSizePx;
    for (let s = cap; s >= minFontSizePx; s -= fontStepPx) {
      if (measure(seg.text, s) <= maxWidthPx) {
        size = s;
        break;
      }
    }
    return { text: seg.text, className: seg.className, fontSizePx: size };
  });

  return { fontSizePx: Math.max(...lines.map((l) => l.fontSizePx)), lines };
}

/** Medidor real basado en canvas, para usar en producción (impresión y vista previa). */
export function makeCanvasMeasurer(): (text: string, fontSizePx: number, fontFamily: string, fontWeight?: string | number) => number {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  return (text, fontSizePx, fontFamily, fontWeight = 400) => {
    if (!ctx) return text.length * fontSizePx * 0.55;
    ctx.font = `${fontWeight} ${fontSizePx}px ${fontFamily}`;
    return ctx.measureText(text).width;
  };
}

export function mmToPx(mm: number): number {
  return (mm * 96) / 25.4;
}

/**
 * Rotación pequeña y determinista (-maxDeg a +maxDeg) derivada de un id, para que cada nota
 * manuscrita se vea "garabateada" con un ángulo ligeramente distinto sin que cambie entre
 * repintados o reimpresiones de la misma canción (nada de Math.random()).
 */
export function deterministicRotationDeg(id: string, maxDeg = 1.2): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  const normalized = (Math.abs(hash) % 1000) / 1000; // 0..1
  return (normalized * 2 - 1) * maxDeg;
}

/**
 * Desplazamiento pequeño y determinista (-maxPx a +maxPx) derivado de un id — mismo mecanismo de
 * hash que deterministicRotationDeg pero con una constante de mezcla distinta (37 en vez de 31)
 * para que, aplicados al mismo id, rotación y desplazamiento no queden correlados (evita que
 * "más rotado" implique siempre "más desplazado"). Usado junto a la rotación para que cada nota
 * manuscrita "flote" ligeramente fuera de la línea base, como una anotación escrita a mano en un
 * momento distinto — no una fila de texto perfectamente alineada. Nada de Math.random(): debe
 * dar siempre el mismo resultado para el mismo id, entre repintados e impresiones.
 */
export function deterministicOffsetPx(id: string, maxPx = 2.5): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 37 + id.charCodeAt(i)) | 0;
  }
  const normalized = (Math.abs(hash) % 1000) / 1000; // 0..1
  return (normalized * 2 - 1) * maxPx;
}
