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
}

export interface NoteLine {
  text: string;
  className: string;
  /** Tamaño propio de esta línea: igual al `fontSizePx` común salvo para la nota excepcional
   *  que ni al mínimo compartido cupo, que se encoge más por su cuenta (ver fitStackedNoteSegments). */
  fontSizePx: number;
}

export interface StackedFitResult {
  /** Tamaño común/compartido elegido para la fila (referencia; cada línea lleva además el suyo). */
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
 * Suelo absoluto de tamaño de fuente: por debajo de esto el texto deja de ser legible, así que
 * se acepta (excepción rara y documentada, no un bug silencioso) que una nota patológicamente
 * larga se quede en este tamaño aunque no llegue a caber del todo, en vez de truncarse o
 * partirse en dos líneas.
 */
export const NOTE_FONT_HARD_FLOOR_PX = 6;

/** Encoge el tamaño de UNA nota concreta (nunca su texto) hasta que quepa, con suelo absoluto. */
function shrinkFontToFit(text: string, startSizePx: number, maxWidthPx: number, measure: FitOptions['measure'], stepPx: number): number {
  let size = startSizePx;
  while (size > NOTE_FONT_HARD_FLOOR_PX && measure(text, size) > maxWidthPx) {
    size -= stepPx;
  }
  return Math.max(size, NOTE_FONT_HARD_FLOOR_PX);
}

/**
 * Ajusta cada segmento (nota) a su propia línea, apiladas, con un único tamaño de fuente común
 * a todas (el mayor que permite que CADA nota, individualmente, quepa en una sola línea). Cada
 * nota se queda SIEMPRE en una única línea con su texto completo — nunca se parte en dos líneas
 * ni se trunca. Si alguna nota concreta ni al tamaño mínimo compartido cabe entera, esa nota
 * (solo esa) se encoge más por su cuenta (ver shrinkFontToFit) hasta caber, o hasta el suelo
 * absoluto si ni así llega.
 */
export function fitStackedNoteSegments(segments: NoteSegment[], opts: FitOptions): StackedFitResult {
  const nonEmpty = segments.filter(s => s.text && s.text.trim().length > 0);
  if (nonEmpty.length === 0) {
    return { fontSizePx: opts.maxFontSizePx, lines: [] };
  }

  const { maxFontSizePx, minFontSizePx, maxWidthPx, measure, fontStepPx = 0.5 } = opts;

  let fontSizePx = minFontSizePx;
  for (let size = maxFontSizePx; size >= minFontSizePx; size -= fontStepPx) {
    if (nonEmpty.every(seg => measure(seg.text, size) <= maxWidthPx)) {
      fontSizePx = size;
      break;
    }
  }

  const lines: NoteLine[] = nonEmpty.map(seg =>
    measure(seg.text, fontSizePx) <= maxWidthPx
      ? { text: seg.text, className: seg.className, fontSizePx }
      : { text: seg.text, className: seg.className, fontSizePx: shrinkFontToFit(seg.text, fontSizePx, maxWidthPx, measure, fontStepPx) }
  );

  return { fontSizePx, lines };
}

/** Medidor real basado en canvas, para usar en producción (impresión y vista previa). */
export function makeCanvasMeasurer(): (
  text: string,
  fontSizePx: number,
  fontFamily: string,
  fontWeight?: string | number
) => number {
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
