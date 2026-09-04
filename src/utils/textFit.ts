// Ajuste de texto a un ancho disponible para las notas manuscritas del repertorio imprimible
// (PdfExportModal.tsx): encoger la fuente antes de partir en una segunda línea, y partir línea
// antes de soltar el segmento de menor prioridad. La función de medición se inyecta para poder
// testear el algoritmo con vitest sin depender de un <canvas> real (ver textFit.test.ts).

export interface NoteSegment {
  text: string;
  className: string;
}

export interface FitResult {
  fontSizePx: number;
  lineOneSegments: NoteSegment[];
  lineTwoSegments: NoteSegment[];
  wrapped: boolean;
}

export interface FitOptions {
  maxWidthPx: number;
  maxFontSizePx: number;
  minFontSizePx: number;
  fontFamily: string;
  fontWeight?: string | number;
  separator?: string;
  fontStepPx?: number;
  measure: (text: string, fontSizePx: number) => number;
}

function joinSegments(segments: NoteSegment[], separator: string): string {
  return segments.map(s => s.text).join(separator);
}

/** Envuelve por palabras el texto combinado de los segmentos en como mucho 2 líneas al ancho dado. */
function wrapToTwoLines(
  segments: NoteSegment[],
  separator: string,
  fontSizePx: number,
  maxWidthPx: number,
  measure: FitOptions['measure']
): { lines: string[]; fitsInTwoLines: boolean } {
  const words = joinSegments(segments, separator).split(/\s+/).filter(Boolean);
  const lines: string[] = [''];

  for (const word of words) {
    const candidate = lines[lines.length - 1] ? `${lines[lines.length - 1]} ${word}` : word;
    if (measure(candidate, fontSizePx) <= maxWidthPx || !lines[lines.length - 1]) {
      lines[lines.length - 1] = candidate;
    } else if (lines.length < 2) {
      lines.push(word);
    } else {
      // Ya hay 2 líneas y la palabra no cabe: no caben las 2 líneas, se reporta arriba.
      return { lines, fitsInTwoLines: false };
    }
  }

  const fitsInTwoLines = lines.length <= 2 && lines.every(l => measure(l, fontSizePx) <= maxWidthPx);
  return { lines, fitsInTwoLines };
}

/** Mayor tamaño de fuente (entre min y max) al que el texto combinado cabe en una sola línea, o null si ni al mínimo cabe. */
function largestFontThatFitsOneLine(
  segments: NoteSegment[],
  separator: string,
  opts: FitOptions
): number | null {
  const { maxFontSizePx, minFontSizePx, maxWidthPx, measure, fontStepPx = 0.5 } = opts;
  const full = joinSegments(segments, separator);
  for (let size = maxFontSizePx; size >= minFontSizePx; size -= fontStepPx) {
    if (measure(full, size) <= maxWidthPx) return size;
  }
  return null;
}

/**
 * Ajusta segments (en orden de prioridad, el primero es el más importante) al ancho disponible:
 * 1. Encoge la fuente buscando que quepa todo en una línea.
 * 2. Si ni al tamaño mínimo cabe en una línea, intenta partir en 2 líneas al tamaño mínimo.
 * 3. Si ni en 2 líneas cabe, suelta el segmento de menor prioridad (el último) y repite desde 1.
 * 4. Si solo queda el segmento de mayor prioridad y aun así no cabe, lo trunca con "…" (único caso de truncado).
 */
export function fitNoteSegments(segments: NoteSegment[], opts: FitOptions): FitResult {
  const separator = opts.separator ?? '  ·  ';
  const nonEmpty = segments.filter(s => s.text && s.text.trim().length > 0);

  if (nonEmpty.length === 0) {
    return { fontSizePx: opts.maxFontSizePx, lineOneSegments: [], lineTwoSegments: [], wrapped: false };
  }

  let candidates = nonEmpty;
  while (candidates.length > 0) {
    const oneLineSize = largestFontThatFitsOneLine(candidates, separator, opts);
    if (oneLineSize !== null) {
      return {
        fontSizePx: oneLineSize,
        lineOneSegments: candidates,
        lineTwoSegments: [],
        wrapped: false
      };
    }

    const { lines, fitsInTwoLines } = wrapToTwoLines(candidates, separator, opts.minFontSizePx, opts.maxWidthPx, opts.measure);
    if (fitsInTwoLines) {
      // Reconstruimos qué segmentos caen en cada línea reasignando el texto combinado partido;
      // el color/clase de cada palabra se pierde en el wrap, así que devolvemos cada línea como
      // un único segmento con la clase del segmento de mayor prioridad (el que manda visualmente).
      const leadClassName = candidates[0].className;
      return {
        fontSizePx: opts.minFontSizePx,
        lineOneSegments: [{ text: lines[0], className: leadClassName }],
        lineTwoSegments: lines[1] ? [{ text: lines[1], className: leadClassName }] : [],
        wrapped: true
      };
    }

    if (candidates.length === 1) {
      // Último recurso: truncar el único segmento restante (el de mayor prioridad) con "…".
      const only = candidates[0];
      let truncated = only.text;
      while (truncated.length > 1 && opts.measure(`${truncated}…`, opts.minFontSizePx) > opts.maxWidthPx) {
        truncated = truncated.slice(0, -1);
      }
      return {
        fontSizePx: opts.minFontSizePx,
        lineOneSegments: [{ text: `${truncated}…`, className: only.className }],
        lineTwoSegments: [],
        wrapped: false
      };
    }

    // Suelta el segmento de menor prioridad (el último) y reintenta.
    candidates = candidates.slice(0, -1);
  }

  return { fontSizePx: opts.maxFontSizePx, lineOneSegments: [], lineTwoSegments: [], wrapped: false };
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
