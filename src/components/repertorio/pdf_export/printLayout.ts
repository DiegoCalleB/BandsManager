/**
 * Constantes y cálculo de maquetación de la hoja impresa del setlist (márgenes, columnas, tipografías y nota por canción).
 * Son funciones puras sin estado: viven fuera del modal para poder probarlas y reutilizarlas en la vista previa y la impresión.
 */
import { fitStackedNoteSegments, mmToPx, NoteSegment, StackedFitResult } from "../../../utils/textFit";

export const ptToPx = (pt: number) => (pt * 96) / 72;

// Márgenes del @page. Antes 5mm/7mm (casi sin margen: el texto pegaba al borde y parecía una
// captura de pantalla); ahora los de una hoja maquetada a mano. Todo lo que depende de ellos
// (ancho de fila, alto útil, min-height de la hoja) sale de estas dos constantes.
export const PAGE_MARGIN_X_MM = 14;
export const PAGE_MARGIN_Y_MM = 9;
// 1mm de colchón de seguridad contra el redondeo del navegador (A4 = 210x297mm).
export const PAGE_SHEET_HEIGHT_MM = 297 - 2 * PAGE_MARGIN_Y_MM - 1;
// Ancho de la hoja A4 disponible para contenido: 210mm - 2x margen horizontal del @page - el
// padding de 2px de .sheet-page a cada lado (ver handlePrint). Se usa tanto en el HTML de
// impresión real como en la vista previa en directo para decidir, fila a fila, si la nota cabe
// al lado del título o si esa fila concreta necesita caer a una línea propia debajo (ver
// textFit.ts).
export const PAGE_CONTENT_WIDTH_PX = mmToPx(210 - 2 * PAGE_MARGIN_X_MM) - 4;
// Dos columnas: ancho de cada una = (ancho útil - separador) / 2. El separador son 29px: un filete
// de 1px con 14px de aire a cada lado.
// La nota general de la canción es secundaria: nunca más del 80 % del tamaño de las demás.
export const GENERAL_NOTE_MAX_SCALE = 0.8;
export const COLUMN_GUTTER_PX = 29;
export const COLUMN_WIDTH_PX = (PAGE_CONTENT_WIDTH_PX - COLUMN_GUTTER_PX) / 2;
export const MIN_USEFUL_RIGHT_LANE_PX = mmToPx(24);
// Hueco mínimo entre el título y la nota: pequeño a propósito — el efecto buscado es que la nota
// parezca escrita a mano justo pegada al título ya impreso, no maquetada como una columna aparte.
export const ROW_GAP_PX = 5;

// Letra del título (pt) que usa el motor de maquetación (setlistPaginator.ts). MIN es el mínimo
// legible a ~2m de distancia de escenario; COMFORT, la letra a partir de la cual ya no merece la
// pena partir en más hojas; FLOOR, el último recurso si ni con el máximo de hojas cabe a MIN.
export const MIN_TITLE_FONT_PT = 17;
export const COMFORT_TITLE_FONT_PT = 17;
export const FLOOR_TITLE_FONT_PT = 13;
// Con columnas en automático, solo a partir de aquí (un set corto no gana nada con dos columnas).
export const AUTO_COLUMNS_MIN_SONGS = 14;
// Techo de diseño: más grande que esto, un título corto deja de parecer un setlist.
export const MAX_DESIGN_TITLE_FONT_PT = 40;
// La nota manuscrita crece con el título, pero con tope: a 44pt de título una nota de 30pt
// competiría con él en vez de acompañarlo.
export const deriveNoteFontPt = (titlePt: number) =>
  Math.min(20, Math.round(titlePt * (19 / 28) * 10) / 10);
export const deriveSongNumFontPt = (titlePt: number) =>
  Math.round(titlePt * (22 / 28) * 10) / 10;

// Tipografías de la hoja impresa (Google Fonts). OJO: una web font no se descarga hasta que algo
// la usa, y `document.fonts.ready` resuelve ya si no hay nada pendiente — así que esperar solo a
// `ready` medía con la fuente de reserva (alturas ~10 % menores que las impresas, hojas que se
// desbordaban). Hay que pedir cada cara explícitamente con `fonts.load`.
export const PRINT_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Anton&family=Caveat:wght@600;700&family=Permanent+Marker&family=Courier+Prime:wght@700&family=Oswald:wght@600;700;800&display=swap";
export const PRINT_FONT_FACES = [
  "900 40px Anton",
  "700 40px Oswald",
  "800 40px Oswald",
  "600 40px Caveat",
  "700 40px Caveat",
  "40px 'Permanent Marker'",
  "700 40px 'Courier Prime'",
];

export async function ensurePrintFonts(doc: Document): Promise<void> {
  if (!doc.fonts) return;
  if (!doc.getElementById("bm-print-fonts") && !doc.getElementById("measure-fonts-link")) {
    const link = doc.createElement("link");
    link.id = "bm-print-fonts";
    link.rel = "stylesheet";
    link.href = PRINT_FONTS_URL;
    doc.head.appendChild(link);
    await new Promise<void>((resolve) => {
      link.addEventListener("load", () => resolve(), { once: true });
      link.addEventListener("error", () => resolve(), { once: true });
      setTimeout(resolve, 2500);
    });
  }
  await Promise.race([
    Promise.all(PRINT_FONT_FACES.map((f) => doc.fonts.load(f).catch(() => []))),
    new Promise((resolve) => setTimeout(resolve, 4000)),
  ]);
  await doc.fonts.ready;
}

export interface PrintDocument {
  html: string;
  layouts: {
    memberId: string;
    pages: number;
    fontPt: number;
    /** Hojas que elegiría el motor en automático (para la etiqueta "Auto (N páginas)"). */
    autoPages: number;
    /** Si las columnas están fijadas, cómo saldría con el otro nº de columnas (para sugerirlo). */
    alt?: { cols: 1 | 2; fontPt: number; pages: number };
  }[];
}

export interface NoteLayoutBadge {
  text: string;
  fontSizePx: number;
  fontFamily?: string;
  fontWeight?: string | number;
  extraWidthPx?: number; // borde/padding que measureText no contempla
}

export interface NoteLayoutInput {
  memberNote: string;
  setlistNote: string;
  generalNote: string;
  showSetlistNotes: boolean;
  numberText: string;
  numberFontSizePx: number;
  titleText: string;
  titleFontSizePx: number;
  titleFontFamily: string;
  badges: NoteLayoutBadge[];
  noteFontFamily: string;
  noteMaxFontSizePx: number;
  noteMinFontSizePx: number;
  // Ancho real de contenido disponible en ESE renderizado concreto (impresión vs vista previa
  // tienen paddings distintos — ver Ronda 2 del plan, no asumir un ancho fijo compartido).
  rowWidthPx: number;
  measure: (
    text: string,
    fontSizePx: number,
    fontFamily: string,
    fontWeight?: string | number,
  ) => number;
  // Modo centrado: la nota va SIEMPRE debajo del título, en su propia línea (al lado no tendría
  // eje al que alinearse). Salta directamente a'below' sin intentar'inline' primero.
  forceBelowMode?: boolean;
}

export interface NoteLayoutResult {
  mode: "inline" | "below";
  maxWidthPx: number;
  fit: StackedFitResult;
}

/**
 * Decide, para una fila de canción concreta, si las notas (músico, bolo, general) caben en una
 * columna a la derecha del título o si esa fila necesita caer a una línea propia debajo — y
 * calcula, con fitStackedNoteSegments, el tamaño de cada nota y las líneas ya apiladas. El título
 * nunca se trunca: si no deja hueco útil al lado, la nota va debajo. Devuelve null si no hay
 * ninguna nota que mostrar (ni badges que compitan por sitio).
 */
export function computeNoteLayout(input: NoteLayoutInput): NoteLayoutResult | null {
  const segments: NoteSegment[] = [];
  if (input.memberNote && input.memberNote.trim()) {
    segments.push({ text: input.memberNote.trim(), className: "note-member" });
  }
  if (input.showSetlistNotes && input.setlistNote && input.setlistNote.trim()) {
    segments.push({
      text: input.setlistNote.trim(),
      className: "note-cue",
    });
  } else if (
    input.showSetlistNotes &&
    input.generalNote &&
    input.generalNote.trim()
  ) {
    // Solo mostrar nota general si NO hay nota/cue de setlist para no saturar con líneas duplicadas
    segments.push({
      text: input.generalNote.trim(),
      className: "note-general",
      maxScale: GENERAL_NOTE_MAX_SCALE,
    });
  }

  const numberWidth = input.numberText
    ? input.measure(
        input.numberText,
        input.numberFontSizePx,
        "Oswald, sans-serif",
        800,
      ) + ROW_GAP_PX
    : 0;
  const badgesWidth = input.badges.reduce(
    (sum, b) =>
      sum +
      input.measure(
        b.text,
        b.fontSizePx,
        b.fontFamily || "monospace",
        b.fontWeight ?? 800,
      ) +
      ROW_GAP_PX +
      (b.extraWidthPx || 0),
    0,
  );
  const fixedLeftWidthPx = numberWidth + badgesWidth;
  const belowMaxWidthPx = input.rowWidthPx - (input.numberText ? 40 : 6);

  if (segments.length === 0) {
    // Sin notas que mostrar — pero puede haber badges (tonalidad/BPM/duración) que igual ocupan
    // espacio fijo en la fila. Sin este caso, el llamador trataría `layout === null` como"nada
    // compite por sitio" y dejaría el título en white-space:normal (libre de envolver), cuando en
    // realidad el badge sigue ahí con flex-shrink:0 — el título envuelto empujaba el badge a su
    // propia línea, aunque el título fuera corto y hubiese hueco de sobra sin el badge.
    if (input.badges.length === 0) return null;
    const emptyFit: StackedFitResult = {
      fontSizePx: input.noteMaxFontSizePx,
      lines: [],
    };
    const fullTitleWidth = input.measure(
      input.titleText,
      input.titleFontSizePx,
      input.titleFontFamily,
      900,
    );
    if (fixedLeftWidthPx + fullTitleWidth + ROW_GAP_PX <= input.rowWidthPx) {
      return { mode: "inline", maxWidthPx: 0, fit: emptyFit };
    }
    // El título completo no deja hueco junto a los badges: null = nada compite por sitio y el
    // título baja a dos líneas (white-space normal). Nunca se corta con "…": un setlist con el
    // nombre de un tema cortado no lo imprimiría nadie a mano.
    return null;
  }

  const fitAt = (maxWidthPx: number) =>
    fitStackedNoteSegments(segments, {
      maxWidthPx,
      maxFontSizePx: input.noteMaxFontSizePx,
      minFontSizePx: input.noteMinFontSizePx,
      fontFamily: input.noteFontFamily,
      fontWeight: 700,
      measure: (text, size) =>
        input.measure(text, size, input.noteFontFamily, 700),
    });

  // Modo"de pie": nunca hay problema real de espacio (letra grande, más hojas aceptadas a
  // cambio), así que la nota va siempre a su propia línea debajo — ni se intenta ponerla al lado
  // del título ni se trunca nada para hacerle hueco ahí.
  if (input.forceBelowMode) {
    return {
      mode: "below",
      maxWidthPx: belowMaxWidthPx,
      fit: fitAt(belowMaxWidthPx),
    };
  }

  // Intenta modo inline con un ancho de título dado; null si no deja hueco útil o si obligaría
  // a encoger la nota DEMASIADO por debajo del mínimo compartido. Se permite un pequeño margen
  // (hasta 20% menos del mínimo) para mantener notas inline cuando hay badges que reducen espacio.
  // Una nota al lado del título solo se acepta si se lee con comodidad: nunca por debajo del 75 %
  // de su tamaño natural (ni del mínimo absoluto). Si no, va debajo, a tamaño completo.
  const INLINE_MIN_NOTE_FRACTION = 0.75;
  const INLINE_SAFETY_PX = 24;
  const tryInline = (titleWidthPx: number) => {
    // Colchón: el canvas no mide el letter-spacing del título (0.5px por letra) ni el hueco
    // real entre número y título; sin él la nota se salía del margen derecho.
    const rightSpaceAvailable =
      input.rowWidthPx -
      fixedLeftWidthPx -
      titleWidthPx -
      ROW_GAP_PX -
      INLINE_SAFETY_PX -
      input.titleText.length * 0.5;
    if (rightSpaceAvailable < MIN_USEFUL_RIGHT_LANE_PX) return null;
    const inlineFit = fitAt(rightSpaceAvailable);
    // Al lado del título solo vale si TODAS las notas caben en una línea y las principales se
    // leen con comodidad; si alguna tendría que partirse, mejor debajo, donde hay más ancho.
    const inlineFloorPx = Math.max(
      input.noteMinFontSizePx,
      input.noteMaxFontSizePx * INLINE_MIN_NOTE_FRACTION,
    );
    const unreadable = inlineFit.lines.some((l) => {
      const floor = l.className === "note-general" ? input.noteMinFontSizePx : inlineFloorPx;
      const overflows =
        input.measure(l.text, l.fontSizePx, input.noteFontFamily, 700) > rightSpaceAvailable;
      return l.fontSizePx < floor || overflows;
    });
    if (unreadable) return null;
    return { rightSpaceAvailable, inlineFit };
  };

  const fullTitleWidth = input.measure(
    input.titleText,
    input.titleFontSizePx,
    input.titleFontFamily,
    900,
  );
  const fullAttempt = tryInline(fullTitleWidth);
  if (fullAttempt) {
    return {
      mode: "inline",
      maxWidthPx: fullAttempt.rightSpaceAvailable,
      fit: fullAttempt.inlineFit,
    };
  }

  // El título completo no deja hueco útil al lado: la nota cae a su propia línea debajo. Nunca se
  // trunca un título con "…" para hacerle sitio a una nota: un setlist con el nombre de un tema
  // cortado no lo imprimiría nadie a mano.
  return {
    mode: "below",
    maxWidthPx: belowMaxWidthPx,
    fit: fitAt(belowMaxWidthPx),
  };
}

/** Preajustes de estilo visual de la hoja de setlist. */
export type SetlistStylePreset =
  | "rock_stage"
  | "festival_bold"
  | "clean_stand"
  | "sound_foh";
