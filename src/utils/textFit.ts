// Ajuste de texto a un ancho disponible para las notas manuscritas del repertorio imprimible
// (PdfExportModal.tsx): cada nota (miembro, nota del bolo, nota general) se pinta en su propia
// línea, apiladas una encima de otra — no todas seguidas en una sola línea, y CADA nota se queda
// siempre en una única línea (nunca se parte en dos: un salto de línea en una anotación "escrita
// a mano" no queda natural). Se busca un tamaño de fuente común a todas (para que se vean
// consistentes) encogiendo tanto como haga falta; si ni al tamaño mínimo cabe una nota concreta,
// esa nota (solo esa) se trunca con "…". La función de medición se inyecta para poder testear el
// algoritmo con vitest sin depender de un <canvas> real (ver textFit.test.ts).

export interface NoteSegment {
  text: string;
  className: string;
}

export interface NoteLine {
  text: string;
  className: string;
}

export interface StackedFitResult {
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

/** Trunca un texto con "…" al ancho dado, sin partirlo nunca en más de una línea. */
function truncateToWidth(text: string, fontSizePx: number, maxWidthPx: number, measure: FitOptions['measure']): string {
  if (measure(text, fontSizePx) <= maxWidthPx) return text;
  let truncated = text;
  while (truncated.length > 1 && measure(`${truncated}…`, fontSizePx) > maxWidthPx) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}…`;
}

/**
 * Ajusta cada segmento (nota) a su propia línea, apiladas, con un único tamaño de fuente común
 * a todas (el mayor que permite que CADA nota, individualmente, quepa en una sola línea). Cada
 * nota se queda SIEMPRE en una única línea — nunca se parte en dos, porque un salto de línea en
 * medio de una anotación "escrita a mano" no se ve natural. Si alguna nota concreta ni al tamaño
 * mínimo cabe entera, esa nota (solo esa) se trunca con "…".
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

  const lines: NoteLine[] = nonEmpty.map(seg => ({
    text: truncateToWidth(seg.text, fontSizePx, maxWidthPx, measure),
    className: seg.className
  }));

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
