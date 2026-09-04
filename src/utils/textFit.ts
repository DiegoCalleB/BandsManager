// Ajuste de texto a un ancho disponible para las notas manuscritas del repertorio imprimible
// (PdfExportModal.tsx): cada nota (miembro, nota del bolo, nota general) se pinta en su propia
// línea, apiladas una encima de otra — no todas seguidas en una sola línea. Se busca un tamaño
// de fuente común a todas (para que se vean consistentes) encogiendo antes de partir una nota
// concreta en dos líneas, y partiendo antes de truncar con "…" como último recurso. La función
// de medición se inyecta para poder testear el algoritmo con vitest sin depender de un <canvas>
// real (ver textFit.test.ts).

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

/** Envuelve un único texto por palabras en como mucho 2 líneas al ancho dado; trunca con "…" la segunda si ni así cabe todo. */
function wrapSingleSegment(text: string, fontSizePx: number, maxWidthPx: number, measure: FitOptions['measure']): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [''];
  let overflowed = false;

  for (const word of words) {
    const current = lines[lines.length - 1];
    const candidate = current ? `${current} ${word}` : word;
    if (measure(candidate, fontSizePx) <= maxWidthPx || !current) {
      lines[lines.length - 1] = candidate;
    } else if (lines.length < 2) {
      lines.push(word);
    } else {
      overflowed = true;
      break;
    }
  }

  const lastIdx = lines.length - 1;
  if (overflowed || measure(lines[lastIdx], fontSizePx) > maxWidthPx) {
    let last = lines[lastIdx];
    while (last.length > 1 && measure(`${last}…`, fontSizePx) > maxWidthPx) {
      last = last.slice(0, -1);
    }
    lines[lastIdx] = `${last}…`;
  }

  return lines;
}

/**
 * Ajusta cada segmento (nota) a su propia línea, apiladas, con un único tamaño de fuente común
 * a todas (el mayor que permite que CADA nota, individualmente, quepa en una sola línea). Si
 * alguna nota concreta ni al tamaño mínimo cabe en una línea, esa nota (solo esa) se parte en 2
 * líneas; si ni así cabe entera, se trunca con "…" como último recurso — nunca antes.
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

  const lines: NoteLine[] = [];
  for (const seg of nonEmpty) {
    if (measure(seg.text, fontSizePx) <= maxWidthPx) {
      lines.push({ text: seg.text, className: seg.className });
    } else {
      wrapSingleSegment(seg.text, fontSizePx, maxWidthPx, measure).forEach(text =>
        lines.push({ text, className: seg.className })
      );
    }
  }

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
