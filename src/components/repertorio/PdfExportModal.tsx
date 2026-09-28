import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Printer,
  X,
  Users,
  User,
  FileText,
  Settings,
  Eye,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Edit3,
  Music,
  Sparkles,
  Image as ImageIcon,
  Sliders,
  Type,
  Palette,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Setlist, Song, ThemeColors } from "../../types";
import {
  BandMemberOption,
  resolveBandMembers,
  getSongMemberNote,
} from "../../utils/repertorioUtils";
import { MemberNotesModal } from "./MemberNotesModal";
import { ModalPortal } from "../common/ModalPortal";
import {
  fitStackedNoteSegments,
  makeCanvasMeasurer,
  mmToPx,
  deterministicRotationDeg,
  deterministicOffsetPx,
  NoteSegment,
  NoteLine,
  StackedFitResult,
} from "../../utils/textFit";
import {
  computeAutoFitPlan,
  computeExpandedPlan,
  tryFitInPageCount,
  MeasureRangeFn,
} from "../../utils/setlistAutoFit";

const ptToPx = (pt: number) => (pt * 96) / 72;

// Ancho de la hoja A4 disponible para contenido: 210mm - 2x7mm de margen del @page (recortado al
// mínimo razonable para"Guardar como PDF" — no hay limitación física de impresora de por medio,
// así que cada mm de margen que se quita es un mm real ganado) - el padding de 2px de .sheet-page
// a cada lado (ver handlePrint). Se usa tanto en el HTML de impresión real como en la vista previa
// en directo para decidir, fila a fila, si la nota cabe al lado del título o si esa fila concreta
// necesita caer a una línea propia debajo (ver textFit.ts).
const PAGE_CONTENT_WIDTH_PX = mmToPx(196) - 4;
const MIN_USEFUL_RIGHT_LANE_PX = mmToPx(24);
// Hueco mínimo entre el título y la nota: pequeño a propósito — el efecto buscado es que la nota
// parezca escrita a mano justo pegada al título ya impreso, no maquetada como una columna aparte.
const ROW_GAP_PX = 5;

// Auto-ajuste de tamaño e impresión (ver setlistAutoFit.ts): candidatos de tamaño de título en
// pt, de mayor a menor. 17pt es el mínimo IDEAL, legible a distancia de escenario (~2 metros) —
// el reparto en VARIAS páginas nunca baja de ahí; se prefiere repartir el repertorio en más
// páginas antes que una letra más pequeña. noteFontPt/songNumFontPt se derivan proporcionalmente
// del título, manteniendo las mismas proporciones que tenían los 3 niveles fijos anteriores
// (28/19/22 en"gigante").
const TITLE_FONT_CANDIDATES_PT = [28, 25, 22, 19, 17];
// Tamaño de ÚLTIMO RECURSO (más pequeño que el mínimo ideal), aceptado explícitamente por Diego
// como trade-off: se prueba SOLO para intentar que el repertorio quepa en una sola página cuando
// ni siquiera 17pt lo consigue por poco margen — nunca se usa para repartir en varias páginas
// (ver EMERGENCY_TITLE_FONT_PT en computeAutoFitPlan/setlistAutoFit.ts).
const EMERGENCY_TITLE_FONT_PT = 15;
// Techo de letra para el modo"de pie" (ver viewDensity): ese modo sube cada página tanto como
// quepa MÁS ALLÁ del mayor candidato de arriba (28pt), ya que ahí no hay una letra"estándar" que
// respetar entre páginas — cuantas menos canciones tenga una página, más grande puede verse. 44pt
// es un techo generoso (evita que una página con muy pocos temas acabe con una letra desmedida)
// sin dejar de sentirse"mucho más grande" que el máximo de sentado.
const MAX_EXPANDED_TITLE_FONT_PT = 44;
const deriveNoteFontPt = (titlePt: number) =>
  Math.round(titlePt * (19 / 28) * 10) / 10;
const deriveSongNumFontPt = (titlePt: number) =>
  Math.round(titlePt * (22 / 28) * 10) / 10;
// Tamaño de referencia para la vista previa en pantalla (no imprime, no pagina de verdad — es
// solo scroll continuo), un punto intermedio entre los antiguos"gigante" y"compacto".
const PREVIEW_TITLE_FONT_PT = 22;

interface NoteLayoutBadge {
  text: string;
  fontSizePx: number;
  fontFamily?: string;
  fontWeight?: string | number;
  extraWidthPx?: number; // borde/padding que measureText no contempla
}

interface NoteLayoutInput {
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
  // Modo"de pie" (ver viewDensity en el componente): sin restricción de espacio real (letra
  // grande, más hojas aceptadas a cambio), así que la nota va SIEMPRE debajo del título en su
  // propia línea — nunca compitiendo por ancho al lado, que es justo la limitación que ese modo
  // existe para evitar. Salta directamente a'below' sin intentar'inline' primero.
  forceBelowMode?: boolean;
}

interface NoteLayoutResult {
  mode: "inline" | "below";
  maxWidthPx: number;
  fit: StackedFitResult;
  /** Presente solo si el título se truncó para dejar hueco a la nota al lado (modo'inline') —
   * nunca por debajo de MIN_TITLE_CHARS, para que la canción siga siendo reconocible. */
  truncatedTitle?: string;
}

// Mínimo de caracteres visibles del título cuando se trunca para hacer hueco a una nota al
// lado — un músico debe poder reconocer la canción en escena aunque el título se acorte.
const MIN_TITLE_CHARS = 16;

function truncateTitleToWidth(
  titleText: string,
  maxWidthPx: number,
  titleFontSizePx: number,
  titleFontFamily: string,
  measure: NoteLayoutInput["measure"],
): string {
  const minLen = Math.min(MIN_TITLE_CHARS, titleText.length);
  for (let len = titleText.length; len >= minLen; len--) {
    const candidate =
      len === titleText.length
        ? titleText
        : `${titleText.slice(0, len).trimEnd()}…`;
    if (
      measure(candidate, titleFontSizePx, titleFontFamily, 900) <= maxWidthPx
    ) {
      return candidate;
    }
  }
  return `${titleText.slice(0, minLen).trimEnd()}…`;
}

/**
 * Decide, para una fila de canción concreta, si la nota (miembro, nota del bolo, nota general)
 * cabe en una columna a la derecha del título o si esa fila necesita caer a una línea propia
 * debajo — y calcula, con fitStackedNoteSegments, el tamaño de fuente común y las líneas ya
 * apiladas (una por nota, cada una en su propia línea; el texto de una nota nunca se pierde: no
 * se parte en dos líneas ni se trunca). Si el título completo no deja hueco útil al lado, se
 * intenta truncarlo (nunca por debajo de MIN_TITLE_CHARS) antes de rendirse: la mayoría de las
 * canciones así consigue quedarse en modo'inline' con el título ligeramente acortado, en vez de
 * caer a'below'. Solo si ni truncando el título al mínimo cabe la nota, esta cae a su propia
 * línea debajo (con flecha hacia el título, ver render) — excepción rara y controlada. Devuelve
 * null si no hay ninguna nota que mostrar.
 */
function computeNoteLayout(input: NoteLayoutInput): NoteLayoutResult | null {
  const segments: NoteSegment[] = [];
  if (input.memberNote && input.memberNote.trim()) {
    segments.push({ text: input.memberNote.trim(), className: "note-member" });
  }
  if (input.showSetlistNotes && input.setlistNote && input.setlistNote.trim()) {
    segments.push({
      text: `*** ${input.setlistNote.trim()} ***`,
      className: "note-cue",
    });
  } else if (
    input.showSetlistNotes &&
    input.generalNote &&
    input.generalNote.trim()
  ) {
    // Solo mostrar nota general si NO hay nota/cue de setlist para no saturar con líneas duplicadas
    segments.push({
      text: `[${input.generalNote.trim()}]`,
      className: "note-general",
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
    // El título completo no deja hueco para los badges: truncarlo (nunca por debajo del mínimo
    // legible) para que sigan cabiendo en la misma fila en vez de quedar empujados aparte.
    const maxTitleWidthForBadges =
      input.rowWidthPx - fixedLeftWidthPx - ROW_GAP_PX;
    const truncatedTitle =
      maxTitleWidthForBadges > 0
        ? truncateTitleToWidth(
            input.titleText,
            maxTitleWidthForBadges,
            input.titleFontSizePx,
            input.titleFontFamily,
            input.measure,
          )
        : undefined;
    return truncatedTitle && truncatedTitle !== input.titleText
      ? { mode: "inline", maxWidthPx: 0, fit: emptyFit, truncatedTitle }
      : { mode: "inline", maxWidthPx: 0, fit: emptyFit };
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
  const EXTREME_SHRINK_TOLERANCE = 0.8; // 80% del mínimo es el piso antes de rechazar inline
  const tryInline = (titleWidthPx: number) => {
    const rightSpaceAvailable =
      input.rowWidthPx - fixedLeftWidthPx - titleWidthPx - ROW_GAP_PX;
    if (rightSpaceAvailable < MIN_USEFUL_RIGHT_LANE_PX) return null;
    const inlineFit = fitAt(rightSpaceAvailable);
    // Permitir que notas se encogan hasta 20% por debajo del mínimo, manteniendo inline
    const extremeThreshold = input.noteMinFontSizePx * EXTREME_SHRINK_TOLERANCE;
    if (inlineFit.lines.some((l) => l.fontSizePx < extremeThreshold))
      return null;
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

  // El título completo no deja hueco útil: probar a truncarlo hasta el mínimo legible antes de
  // rendirse y mandar la nota a su propia línea debajo.
  const maxTitleWidthForNote =
    input.rowWidthPx - fixedLeftWidthPx - ROW_GAP_PX - MIN_USEFUL_RIGHT_LANE_PX;
  if (maxTitleWidthForNote > 0) {
    const truncatedTitle = truncateTitleToWidth(
      input.titleText,
      maxTitleWidthForNote,
      input.titleFontSizePx,
      input.titleFontFamily,
      input.measure,
    );
    if (truncatedTitle !== input.titleText) {
      const truncatedTitleWidth = input.measure(
        truncatedTitle,
        input.titleFontSizePx,
        input.titleFontFamily,
        900,
      );
      const truncatedAttempt = tryInline(truncatedTitleWidth);
      if (truncatedAttempt) {
        return {
          mode: "inline",
          maxWidthPx: truncatedAttempt.rightSpaceAvailable,
          fit: truncatedAttempt.inlineFit,
          truncatedTitle,
        };
      }
    }
  }

  // Ni truncando el título al mínimo legible cupo la nota al lado: excepción rara y controlada,
  // la nota cae a su propia línea debajo con flecha hacia el título (ver render).
  return {
    mode: "below",
    maxWidthPx: belowMaxWidthPx,
    fit: fitAt(belowMaxWidthPx),
  };
}

interface PdfExportModalProps {
  isOpen: boolean;
  activeSetlist: Setlist | null;
  activeSetlistMetrics: {
    formattedTime: string;
    songCount: number;
    avgBpm?: number;
    totalSeconds?: number;
  };
  songs: Song[];
  bandMembers?: BandMemberOption[];
  bandName?: string;
  bandLogoUrl?: string;
  onClose: () => void;
  onUpdateSong?: (updatedSong: Song) => void;
}

export type SetlistStylePreset =
  | "rock_stage"
  | "festival_bold"
  | "clean_stand"
  | "sound_foh";

export function PdfExportModal({
  isOpen,
  activeSetlist,
  activeSetlistMetrics,
  songs,
  bandMembers = [],
  bandName = "Tu Banda",
  bandLogoUrl = "",
  onClose,
  onUpdateSong,
}: PdfExportModalProps) {
  const resolvedMembers = resolveBandMembers(bandMembers);

  // Print mode:'all_members' |'single_member' |'master'
  const [printMode, setPrintMode] = useState<
    "all_members" | "single_member" | "master"
  >("all_members");
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    resolvedMembers[0]?.id || "member-1",
  );

  // Cuando el auto-ajuste (ver computeAutoFitPlan/EMERGENCY_TITLE_FONT_PT) detecta el caso
  // AMBIGUO — el repertorio cabe en 1 sola hoja solo apretando la letra por debajo del mínimo
  // ideal — se pausa el flujo de impresión y se guarda aquí cuántas páginas tendría cada opción,
  // para que el usuario elija con info real en vez de decidir en su nombre.
  const [sizeChoiceDialog, setSizeChoiceDialog] = useState<{
    singleTotalPages: number;
    multiTotalPages: number;
  } | null>(null);

  // Ajustes avanzados (letra manuscrita, tinta, badges de tonalidad/BPM/duración) van ocultos
  // detrás de este toggle SOLO en móvil (ver"sm:flex" más abajo, que los fuerza siempre visibles
  // en pantallas grandes) — en pantallas pequeñas todo junto agobiaba, tapando la vista previa.
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Densidad de vista:'sentado' (por defecto) usa el auto-ajuste normal — el mínimo nº de hojas
  // posible, pensado para leerse de cerca (atril, mesa de sonido).'de_pie' fuerza el tamaño de
  // título MÁS GRANDE de TITLE_FONT_CANDIDATES_PT como base y luego sube CADA página tanto como
  // quepa por su cuenta (sin techo fijo — ver MAX_EXPANDED_TITLE_FONT_PT/computeExpandedPlan en
  // setlistAutoFit.ts), repartiendo en tantas hojas como haga falta. Al no competir ya por espacio
  // horizontal contra el título, las notas van siempre en su propia línea debajo (forceBelowMode
  // en computeNoteLayout) — pensado para leerse desde lejos, de pie en el escenario, aceptando más
  // páginas a cambio de letra mucho mayor.
  const [viewDensity, setViewDensity] = useState<"sentado" | "de_pie">(
    "sentado",
  );

  // Design & Preset State
  const [stylePreset, setStylePreset] =
    useState<SetlistStylePreset>("rock_stage");
  // El tamaño real de impresión ya no se elige a mano: se auto-ajusta por hoja (ver
  // computeAutoFitPlan / setlistAutoFit.ts, usado en handlePrint). La vista previa en pantalla no
  // reproduce esa paginación 1:1 (no hay salto de página visible aquí, solo scroll), así que usa
  // un tamaño de referencia fijo — PREVIEW_TITLE_FONT_PT, más abajo.
  const [handwritingFont, setHandwritingFont] = useState<
    "caveat" | "permanent_marker" | "courier" | "sans"
  >("caveat");
  const [handwritingColor, setHandwritingColor] = useState<
    "blue" | "black" | "red" | "purple"
  >("blue");

  // Customization Toggles (Duration and BPM OFF by default as requested)
  const [showBandLogo, setShowBandLogo] = useState<boolean>(true);
  // customLogoUrl usaba a ser un useState propio inicializado con bandLogoUrl — pero nada más lo
  // reasignaba, así que solo copiaba el prop una vez en el primer render y se quedaba pegado en
  // vacío si el modal se montaba antes de que epkConfig.logoUrl terminara de cargar (fetch
  // asíncrono en el componente padre), aunque el prop se actualizara después con la URL real del
  // logo ya subido. Al no haber ningún uploader propio que lo reasigne, es un simple alias del
  // prop — usarlo directamente evita ese desajuste sin necesitar sincronizarlo a mano.
  const customLogoUrl = bandLogoUrl;
  const [showSongNumbers, setShowSongNumbers] = useState<boolean>(true);
  const [showBlockLines, setShowBlockLines] = useState<boolean>(true);
  const [showTonality, setShowTonality] = useState<boolean>(false);
  const [showBpm, setShowBpm] = useState<boolean>(false);
  const [showDuration, setShowDuration] = useState<boolean>(false);
  const [showSetlistNotes, setShowSetlistNotes] = useState<boolean>(true);
  const [showAppBranding, setShowAppBranding] = useState<boolean>(true);

  // Preview Pagination
  const [previewPageIndex, setPreviewPageIndex] = useState<number>(0);

  // Quick edit note state
  const [editingSongForNotes, setEditingSongForNotes] = useState<Song | null>(
    null,
  );

  // Medidor de texto (canvas) para el ajuste de notas manuscritas de la vista previa — se crea
  // una sola vez y se reutiliza en cada canción del repertorio (ver computeNoteLayout/textFit.ts).
  const measureText = useMemo(() => makeCanvasMeasurer(), []);
  // Las fuentes web (Caveat, Permanent Marker...) tardan en cargar de forma asíncrona; si se mide
  // antes de que terminen de cargar, el canvas usa la fuente de reserva del sistema y el ajuste
  // sale descuadrado. Este contador fuerza un recálculo (nuevo `measureText` con las métricas
  // reales) en cuanto document.fonts confirma que ya están listas.
  const [, setFontsReadyTick] = useState(0);
  useEffect(() => {
    if (typeof document === "undefined" || !document.fonts) return;
    document.fonts.ready.then(() => setFontsReadyTick((t) => t + 1));
  }, []);

  // Ancho REAL de contenido de la hoja en la vista previa, medido del DOM en vez de asumido en
  // mm: a diferencia del HTML de impresión (dimensiones fijas de @page), este contenedor tiene
  // padding responsive de Tailwind (p-8 sm:p-12), así que una constante fija sobrestimaba el
  // hueco libre y hacía que el título se aplastara en vez de la nota caer a la línea de abajo
  // (Ronda 2 del plan). Se mide el ancho de la hoja y se le resta el padding calculado.
  const sheetRef = useRef<HTMLDivElement>(null);
  const [previewContentWidthPx, setPreviewContentWidthPx] = useState<number>(
    PAGE_CONTENT_WIDTH_PX,
  );
  useEffect(() => {
    const el = sheetRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const cs = window.getComputedStyle(el);
      const paddingX =
        parseFloat(cs.paddingLeft || "0") + parseFloat(cs.paddingRight || "0");
      const width = rect.width - paddingX;
      if (width > 0) setPreviewContentWidthPx(width);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isOpen]);

  // Los hooks de arriba tienen que ejecutarse siempre (ver react-hooks/rules-of-hooks): este
  // guard vivía antes de ellos, así que abrir/cerrar el modal o cambiar de repertorio activo
  // cambiaba cuántos hooks corrían entre renders.
  if (!isOpen || !activeSetlist) return null;

  const selectedMember = resolvedMembers.find(
    (m) => m.id === selectedMemberId,
  ) ||
    resolvedMembers[0] || {
      id: "usr-1",
      name: "Músico",
      instrument: "Instrumento",
    };

  const membersToExport =
    printMode === "single_member"
      ? [selectedMember]
      : printMode === "all_members"
        ? resolvedMembers
        : [
            {
              id: "master",
              name: "Master Escenario / Sonido",
              instrument: "Técnico FOH / Backstage",
            },
          ];

  // Font helper mappings
  const getHandwritingFontFamily = () => {
    switch (handwritingFont) {
      case "caveat":
        return "'Caveat', cursive, sans-serif";
      case "permanent_marker":
        return "'Permanent Marker', cursive, sans-serif";
      case "courier":
        return "'Courier Prime', monospace";
      default:
        return "-apple-system, BlinkMacSystemFont,'Segoe UI', Roboto, sans-serif";
    }
  };

  const getInkColorHex = () => {
    switch (handwritingColor) {
      case "blue":
        return "#0038a8"; // Classic Pilot Blue / Sharpie Blue
      case "black":
        return "#111827";
      case "red":
        return "#dc2626";
      case "purple":
        return "#7c3aed";
      default:
        return "#0038a8";
    }
  };

  // Generate HTML for printing. `forcedSizeChoice` llega definido solo en el reintento tras el
  // diálogo de"1 hoja vs varias" (ver sizeChoiceDialog más abajo) — en la llamada normal (botón
  // Imprimir) va indefinido, y si se detecta el caso ambiguo el flujo se pausa antes de abrir
  // ninguna ventana de impresión.
  const handlePrint = async (forcedSizeChoice?: "single" | "multi") => {
    // Si el usuario imprime justo tras abrir el modal, las fuentes web (Anton/Oswald/Caveat) del
    // documento de la app podrían no haber terminado de cargar todavía — el canvas measurer de
    // abajo mediría con la fuente de reserva del sistema (más ancha), haciendo que el título
    //"parezca" ocupar más sitio del real y forzando el modo'below' o el truncado con más
    // frecuencia de la necesaria, lo que infla la altura calculada de cada fila.
    if (typeof document !== "undefined" && document.fonts) {
      await document.fonts.ready;
    }

    const measure = makeCanvasMeasurer();
    const noteMinFontSizePx = 11;
    const inkColor = getInkColorHex();
    const handFont = getHandwritingFontFamily();
    const titleFontFamily =
      stylePreset === "rock_stage"
        ? "'Anton','Oswald', sans-serif"
        : "'Oswald', sans-serif";

    // Construye el HTML de UNA fila (canción o divisor) a un tamaño de título dado — reutilizada
    // tanto para el HTML final de impresión como para medir alturas candidatas del auto-ajuste
    // (computeAutoFitPlan, ver más abajo). Antes esto vivía inline dentro de un único
    // `activeSetlist.items.map`, atado al fontSizeScale fijo elegido a mano; ahora titleFontPt
    // llega como parámetro porque el auto-ajuste puede decidir un tamaño distinto por miembro
    // (cada uno tiene sus propias notas, que ocupan distinto espacio).
    const buildRowHtml = (
      item: (typeof activeSetlist.items)[number],
      idx: number,
      titleFontPt: number,
      member: (typeof membersToExport)[number],
      isMaster: boolean,
    ): string => {
      const titleFontSizePx = ptToPx(titleFontPt);
      const noteFontPt = deriveNoteFontPt(titleFontPt);
      const noteMaxFontSizePx = ptToPx(noteFontPt);
      const songNumFontSizePx = ptToPx(deriveSongNumFontPt(titleFontPt));

      if (item.tipoItem === "cancion") {
        const s = songs.find((x) => x.id === item.songId);
        if (!s) return "";

        const memberNote = !isMaster
          ? getSongMemberNote(s, member.id, member.name)
          : "";
        const generalRepertorioNote =
          s.notasRepertorio || s.notasInternas || "";
        const setlistNote = (item as any).notaTema || item.notas || "";
        const numberText = showSongNumbers ? `${idx + 1}.` : "";
        const badges: NoteLayoutBadge[] = [
          ...(showTonality && s.tonalidad
            ? [{ text: s.tonalidad, fontSizePx: ptToPx(11), extraWidthPx: 14 }]
            : []),
          ...(showBpm && s.bpm
            ? [{ text: `${s.bpm} BPM`, fontSizePx: ptToPx(10) }]
            : []),
          ...(showDuration && s.duracion
            ? [{ text: s.duracion, fontSizePx: ptToPx(10) }]
            : []),
        ];

        const layout = computeNoteLayout({
          memberNote,
          setlistNote,
          generalNote: generalRepertorioNote,
          showSetlistNotes,
          numberText,
          numberFontSizePx: songNumFontSizePx,
          titleText: s.titulo.toUpperCase(),
          titleFontSizePx,
          titleFontFamily,
          badges,
          noteFontFamily: handFont,
          noteMaxFontSizePx,
          noteMinFontSizePx,
          rowWidthPx: PAGE_CONTENT_WIDTH_PX,
          measure,
          forceBelowMode: viewDensity === "de_pie",
        });

        // Cada nota en su propia línea, apiladas — no todas seguidas en una sola línea. El
        // tamaño de fuente va por línea (no en el contenedor): la nota excepcional que
        // necesitó encogerse más que las demás para caber entera lo hace sola, sin afectar
        // al tamaño de sus vecinas.
        // Flecha manuscrita apuntando al título de arriba: en modo'below' va en la primera
        // línea (nota separada del título); en modo'inline' con varias notas apiladas va en
        // la ÚLTIMA (la más cerca de la canción siguiente, donde puede haber duda de a qué
        // tema pertenece) — ver referencia real de setlist: flechas"← nota" a mano.
        const noteLineColor = (className: string) =>
          className === "note-member"
            ? inkColor
            : className === "note-cue"
              ? "#b45309"
              : "#555";
        const arrowSvg = (color: string) =>
          `<svg width="14" height="14" viewBox="0 0 16 16" style="flex-shrink:0;margin-right:4px;"><path d="M13 13 L4 5 M4 5 L4.5 8.5 M4 5 L7.5 4.5" stroke="${color}" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        // Rotación + desplazamiento por LÍNEA (no un único transform para todo el bloque): así
        // las tres notas no giran como una pieza rígida, sino que cada una parece garabateada
        // por separado, en un momento distinto — más orgánico y menos"maquetado".
        // layout puede venir en modo'inline' con fit.lines vacío (caso"solo badges, sin
        // notas" — ver computeNoteLayout): ahí no hay nada que pintar como nota manuscrita,
        // solo se usó layout para calcular cuánto debía ceder el título ante los badges.
        const notesHtml =
          layout && layout.fit.lines.length > 0
            ? `<div class="${layout.mode === "inline" ? "song-notes-right" : "song-notes-below"}" style="max-width:${layout.mode === "inline" ? `${layout.maxWidthPx}px` : "none"};">${layout.fit.lines
                .map((line, i) => {
                  const color = noteLineColor(line.className);
                  // Flecha hacia el título: en modo'below' en la primera línea (todo el bloque
                  // está separado del título). En modo'inline' con varias notas apiladas, en la
                  // ÚLTIMA línea — es la que queda más lejos del título y más cerca de la canción
                  // siguiente, donde puede haber duda de a qué tema pertenece.
                  const showArrow =
                    (layout.mode === "below" && i === 0) ||
                    (layout.mode === "inline" &&
                      layout.fit.lines.length > 1 &&
                      i === layout.fit.lines.length - 1);
                  const arrow = showArrow ? arrowSvg(color) : "";
                  const seed = `${s.id}-${line.className}`;
                  // Solo hacia arriba (o recta), nunca hacia abajo: rotate() positivo gira en
                  // sentido horario, o sea el extremo derecho del texto cae hacia abajo — se veía
                  // como una nota"torcida hacia abajo" en vez de la escritura ascendente natural.
                  const lineRotationDeg = -Math.abs(
                    deterministicRotationDeg(seed, 3),
                  );
                  const lineOffsetXPx = deterministicOffsetPx(`${seed}-x`, 2);
                  // Solo hacia arriba (o recta), nunca hacia abajo: un desplazamiento positivo se
                  // veía como un salto de línea/desalineación entre notas — justo el efecto que se
                  // había quitado a propósito (ver line-height:1 más arriba).
                  const lineOffsetYPx = -Math.abs(
                    deterministicOffsetPx(`${seed}-y`, 2),
                  );
                  const lineTransform = `rotate(${lineRotationDeg}deg) translate(${lineOffsetXPx}px, ${lineOffsetYPx}px)`;
                  return `<div class="note-seg ${line.className}" style="font-size:${line.fontSizePx}px;display:flex;align-items:center;transform:${lineTransform};">${arrow}${line.text}</div>`;
                })
                .join("")}</div>`
            : "";
        // El título solo se fuerza a una sola línea (con"…" si hace falta) cuando de verdad
        // compite por sitio con una nota en la misma fila (layout.mode ==='inline'). Si esa
        // fila no tiene nota, o la nota cae debajo, el título vuelve a poder ocupar toda su
        // anchura natural — nunca se pidió tocarlo salvo por esa convivencia. font-size inline
        // (no una clase CSS global): titleFontPt ahora puede variar por miembro/página según
        // el auto-ajuste (ver computeAutoFitPlan), a diferencia de los 3 tamaños fijos de antes.
        const titleStyle =
          layout && layout.mode === "inline"
            ? `font-size:${titleFontPt}pt;`
            : `font-size:${titleFontPt}pt;white-space:normal;overflow:visible;text-overflow:clip;`;

        return `
 <div class="setlist-song-item">
 <div class="song-line">
 <div class="song-left">
 ${numberText ? `<span class="song-num" style="font-size:${deriveSongNumFontPt(titleFontPt)}pt;">${numberText}</span>` : ""}
 <span class="song-title" style="${titleStyle}">${layout?.truncatedTitle ?? s.titulo.toUpperCase()}</span>
 ${showTonality && s.tonalidad ? `<span class="tag-tonality">${s.tonalidad}</span>` : ""}
 ${showBpm && s.bpm ? `<span class="tag-bpm">${s.bpm} BPM</span>` : ""}
 ${showDuration && s.duracion ? `<span class="tag-dur">${s.duracion}</span>` : ""}
 </div>
 ${layout && layout.mode === "inline" ? notesHtml : ""}
 </div>
 ${layout && layout.mode === "below" ? notesHtml : ""}
 </div>
 `;
      } else if (
        item.tipoItem === "bloque" &&
        item.bloqueSubtipo === "header"
      ) {
        return `
 <div class="block-divider-item">
 <div class="divider-line"></div>
 <div class="block-title">${(item.tituloCustom || "BLOQUE").toUpperCase()}</div>
 <div class="divider-line"></div>
 </div>
 `;
      } else if (item.tipoItem === "bloque" && item.bloqueSubtipo === "bis") {
        return `
 <div class="bis-divider-item">
 <div class="divider-line"></div>
 <div class="bis-text">${(item.tituloCustom || "BIS / ENCORE").toUpperCase()}</div>
 <div class="divider-line"></div>
 </div>
 `;
      } else {
        return `
 <div class="interlude-item">
 <span class="interlude-bracket">****</span>
 <span class="interlude-title">${(item.tituloCustom || item.notas || (item as any).notaTema || item.tipoItem || "INTERLUDIO").toUpperCase()}</span>
 <span class="interlude-bracket">****</span>
 ${
   (item.notas || (item as any).notaTema) && item.tituloCustom
     ? `
 <span class="interlude-note">(${item.notas || (item as any).notaTema})</span>
 `
     : ""
 }
 </div>
 `;
      }
    };

    // CSS de impresión: extraído a variable (en vez de embebido directamente en el HTML final
    // más abajo) para poder inyectar EXACTAMENTE el mismo CSS en el iframe de medición oculto
    // de auto-ajuste — misma altura real, no una aproximación heurística.
    const printCss = `
 @page {
 size: A4 portrait;
 /* Recortado al mínimo razonable: esto se"Guarda como PDF", no hay tolerancia física
 de impresora que respetar, así que cada mm de margen es un mm real que se le quita
 al repertorio sin tocar ni un punto de la tipografía. */
 margin: 5mm 7mm;
 }
 * {
 box-sizing: border-box;
 }
 body {
 font-family: ${stylePreset === "rock_stage" ? "'Anton','Oswald', -apple-system, sans-serif" : stylePreset === "festival_bold" ? "'Oswald', sans-serif" : "-apple-system, BlinkMacSystemFont, sans-serif"};
 color: #000;
 background: #fff;
 margin: 0;
 padding: 0;
 -webkit-print-color-adjust: exact;
 print-color-adjust: exact;
 }
 .sheet-page {
 position: relative;
 width: 100%;
 min-height: 286mm;
 display: flex;
 flex-direction: column;
 justify-content: space-between;
 padding: 2px;
 overflow: hidden;
 }
 .page-break {
 page-break-after: always;
 break-after: page;
 }

 /* Marca de agua: muy suave, de fondo, centrada — se nota que está pero no compite con
 la lectura. position:absolute la saca del flujo (no afecta en nada a la medición del
 auto-ajuste, que solo mide header/filas/footer por separado) y z-index negativo la
 deja detrás del contenido normal dentro del propio stacking context de .sheet-page.
 Si el grupo tiene logo lo usa en alta resolución (misma imagen original que en la
 cabecera, no una miniatura) — el texto con el nombre queda como alternativa cuando
 no hay logo subido. */
 .page-watermark {
 position: absolute;
 inset: 0;
 z-index: -1;
 display: flex;
 align-items: center;
 justify-content: center;
 pointer-events: none;
 user-select: none;
 overflow: hidden;
 }
 .page-watermark-logo {
 max-width: 65%;
 max-height: 65%;
 object-fit: contain;
 /* 0.09 se veía casi invisible en papel real (la pantalla ilumina el mismo valor de
 opacidad más de lo que refleja la tinta impresa) — subido a 0.16, todavía sutil
 como marca de agua de fondo, pero perceptible sin competir con el texto negro. */
 opacity: 0.16;
 }
 .page-watermark-text {
 font-family:'Anton','Oswald', sans-serif;
 font-size: 80pt;
 font-weight: 900;
 letter-spacing: 4px;
 color: ${inkColor};
 opacity: 0.14;
 transform: rotate(-20deg);
 white-space: nowrap;
 }

 /* Header — padding/margin reducidos a propósito: cada mm que se ahorra aquí es un mm
 más de margen para las canciones, y así menos probabilidad de que una hoja con
 contenido ajustado necesite una segunda hoja casi vacía. */
 .page-header {
 display: flex;
 justify-content: space-between;
 align-items: center;
 border-bottom: 1.5px solid #000;
 padding-bottom: 2px;
 margin-bottom: 2px;
 }
 .header-left {
 display: flex;
 align-items: center;
 gap: 8px;
 }
 .band-logo-img {
 max-height: 30px;
 max-width: 85px;
 object-fit: contain;
 filter: grayscale(100%) contrast(150%);
 }
 .band-text-block {
 display: flex;
 flex-direction: column;
 }
 .band-heading {
 font-family:'Anton','Oswald', sans-serif;
 font-size: 16pt;
 line-height: 1;
 margin: 0;
 letter-spacing: 0.5px;
 color: #000;
 }
 /* Solo el nombre del repertorio, en una línea simple — sin badge ni duración/nº de
 temas, que era ruido que no aportaba nada al músico leyendo desde el escenario. */
 .setlist-meta {
 font-family:'Oswald', sans-serif;
 font-size: 7.5pt;
 font-weight: 700;
 color: #333;
 margin-top: 0px;
 white-space: nowrap;
 overflow: hidden;
 text-overflow: ellipsis;
 max-width: 100%;
 }

 .header-right {
 text-align: right;
 }
 .member-stage-tag {
 padding: 1px 6px;
 background: #fff;
 border-radius: 3px;
 text-align: right;
 white-space: nowrap;
 }
 .tag-title {
 font-family:'Oswald', sans-serif;
 font-size: 6pt;
 font-weight: 700;
 color: #555;
 letter-spacing: 1px;
 }
 .tag-name {
 font-family:'Anton','Oswald', sans-serif;
 font-size: 11pt;
 line-height: 1.1;
 color: #000;
 margin-top: 0;
 }
 .tag-instrument {
 font-family: monospace;
 font-size: 7pt;
 font-weight: 800;
 color: #333;
 }

 /* Setlist Container: el ritmo vertical"sin nota" es el de una lista impresa normal
 y apretada (como si se hubiera impreso ANTES de añadir ninguna anotación) — el
 espacio para las notas manuscritas no se reserva aquí, se aprovecha el hueco que
 ya deja el propio interlineado del título (ver .song-notes-below más abajo). */
 .setlist-items-container {
 flex: 1;
 display: flex;
 flex-direction: column;
 justify-content: flex-start;
 /* gap:0 a propósito: con 30+ canciones, cada px de gap se multiplica por el nº de
 filas — es lo que más margen aporta para caber en menos hojas (ver ROW_GAP_PX y
 line-height de .song-title, mismo motivo). */
 gap: 0px;
 }

 .setlist-song-item {
 padding: 0;
 /* Red de seguridad de impresión: nuestro propio reparto por páginas (ver
 setlistAutoFit.ts) es quien decide qué canción va en qué hoja, así que en el caso
 normal el navegador nunca tiene que partir nada por su cuenta. Pero si, por lo
 que sea (una fuente que tarda un pelín más en cargar, redondeo de subpíxel), el
 contenido real se pasa unos px del físico de la hoja, esto evita que sea una fila
 CONCRETA la que se parta a la mitad entre dos hojas — la empuja entera a la
 siguiente en vez de partirla visualmente por la mitad. */
 break-inside: avoid;
 page-break-inside: avoid;
 }

 /* .song-line nunca envuelve: el título se trunca con"..." antes de saltar a una
 segunda línea, así la fila mide siempre lo mismo y nada se monta encima de la
 canción anterior, sea cual sea la longitud del título o de las notas. Sin
 justify-content:space-between a propósito: la nota debe quedar pegada justo detrás
 del título (como un boli escribiendo a continuación), no flotando contra el margen
 derecho de la hoja con un hueco en blanco en medio. */
 .song-line {
 display: flex;
 align-items: baseline;
 gap: 5px;
 flex-wrap: nowrap;
 }
 .song-left {
 display: flex;
 align-items: baseline;
 flex-wrap: nowrap;
 gap: 8px;
 min-width: 0;
 flex: 0 1 auto;
 overflow: hidden;
 }
 .song-num {
 /* font-size inline por fila (no aquí): titleFontPt puede variar por miembro/página
 según el auto-ajuste (ver computeAutoFitPlan / setlistAutoFit.ts). */
 font-family:'Oswald', sans-serif;
 font-weight: 800;
 color: #444;
 min-width: 32px;
 flex-shrink: 0;
 }
 .song-title {
 /* font-size inline por fila (no aquí): mismo motivo que .song-num de arriba.
 line-height:1 (antes 1.1) por el mismo motivo que el gap:0 de arriba — con
 muchas filas, cada décima de interlineado de sobra se multiplica. */
 font-family: ${stylePreset === "rock_stage" ? "'Anton','Oswald', sans-serif" : "'Oswald', sans-serif"};
 font-weight: 900;
 letter-spacing: 0.5px;
 color: #000;
 line-height: 1;
 min-width: 0;
 flex-shrink: 1;
 overflow: hidden;
 text-overflow: ellipsis;
 white-space: nowrap;
 }

 /* Badges: nunca se encogen ni desaparecen — el título es el único que cede espacio */
 .tag-tonality {
 font-family: monospace;
 font-size: 11pt;
 font-weight: 800;
 padding: 1px 5px;
 border-radius: 3px;
 background: #fff;
 color: #000;
 flex-shrink: 0;
 }
 .tag-bpm {
 font-family: monospace;
 font-size: 10pt;
 font-weight: 700;
 color: #444;
 flex-shrink: 0;
 }
 .tag-dur {
 font-family: monospace;
 flex-shrink: 0;
 font-size: 10pt;
 font-weight: 700;
 color: #666;
 }

 /* Notas"escritas a mano encima del repertorio ya impreso": las tres (miembro, nota
 del bolo, nota general) comparten la fuente manuscrita y solo se distinguen por su
 color de tinta. El tamaño de fuente (por línea, no por bloque) y si van al lado
 del título o en su propia línea debajo se calculan fila a fila en JS (ver
 computeNoteLayout/textFit.ts): se encoge la fuente tanto como haga falta — nunca
 se parte una nota en 2 líneas ni se trunca su texto. Por eso aquí no hay font-size
 ni max-width fijos: llegan inline por fila/línea. */
 /* Cada nota apilada en su propia línea (no todas seguidas), justo detrás del título
 (align-items:flex-start: el texto arranca pegado al título, no alineado contra el
 margen derecho del carril calculado — eso dejaba un hueco en blanco en medio).
 overflow:visible a propósito (ver .note-seg): en el caso raro de una nota
 patológicamente larga que ni encogida al mínimo cabe, se deja que asome un poco
 fuera de su carril en vez de recortarla sin avisar. */
 .song-notes-right {
 display: flex;
 flex-direction: column;
 align-items: flex-start;
 /* align-self:flex-start a propósito: .song-line usa align-items:baseline, y al ser
 este un contenedor flex-column con varias líneas apiladas, su"baseline" para el
 padre se toma de la ÚLTIMA línea — eso empujaba toda la columna hacia abajo,
 dejando un hueco entre el título y la primera nota. Con flex-start se ignora ese
 baseline y la columna se pega arriba, junto al título. */
 align-self: flex-start;
 gap: 0px;
 flex-shrink: 0;
 overflow: visible;
 line-height: 1;
 }
 /* margin-top negativo a propósito:"muerde" el hueco que ya deja el descendente/
 interlineado del título de arriba, para que la nota parezca escrita justo pegada
 a la línea impresa en vez de maquetada como una fila nueva con su propio aire. */
 .song-notes-below {
 display: flex;
 flex-direction: column;
 gap: 0px;
 padding-left: ${showSongNumbers ? "40px" : "6px"};
 margin-top: -10px;
 line-height: 1;
 }
 .note-seg {
 /* overflow:visible a propósito: el texto nunca se trunca en JS (ver textFit.ts),
 así que tampoco debe cortarse aquí con elipsis por un posible desajuste de 1px
 entre la medición por canvas y el render real. white-space:nowrap sigue
 garantizando que una nota nunca salta a una segunda línea. */
 overflow: visible;
 white-space: nowrap;
 min-width: 0;
 max-width: 100%;
 }
 .note-member {
 font-family: ${handFont};
 font-weight: 700;
 color: ${inkColor} !important;
 letter-spacing: 0.2px;
 }
 .note-cue {
 font-family: ${handFont};
 font-weight: 700;
 color: #b45309;
 letter-spacing: 0.2px;
 }
 .note-general {
 font-family: ${handFont};
 font-weight: 600;
 color: #555;
 letter-spacing: 0.2px;
 }

 /* Dividers & Interludes — línea fina con el texto en medio, ocupando lo mínimo
 posible: son separadores de estructura, no canciones, no deben competir por
 espacio vertical con el repertorio. */
 .block-divider-item, .bis-divider-item {
 display: flex;
 align-items: center;
 gap: 8px;
 margin: 1px 0;
 break-inside: avoid;
 page-break-inside: avoid;
 }
 .divider-line {
 flex: 1;
 height: 1px;
 background: #000;
 }
 .block-title {
 font-family:'Oswald', sans-serif;
 font-size: 9pt;
 font-weight: 800;
 letter-spacing: 1px;
 color: #000;
 white-space: nowrap;
 }
 .bis-text {
 font-family:'Oswald', sans-serif;
 font-size: 9pt;
 font-weight: 800;
 letter-spacing: 1px;
 color: #000;
 white-space: nowrap;
 }

 .interlude-item {
 font-family:'Oswald', monospace, sans-serif;
 font-size: 10pt;
 font-weight: 700;
 color: #222;
 padding: 0px 0 0px ${showSongNumbers ? "40px" : "6px"};
 letter-spacing: 0.5px;
 break-inside: avoid;
 page-break-inside: avoid;
 }
 .interlude-bracket {
 color: #666;
 }
 .interlude-title {
 font-weight: 800;
 }
 .interlude-note {
 font-size: 10.5pt;
 font-family: monospace;
 color: #555;
 font-style: italic;
 margin-left: 6px;
 }

 /* Footer */
 /* padding/margin reducidos por el mismo motivo que el header: más espacio libre
 para las canciones. */
 .page-footer {
 display: flex;
 justify-content: space-between;
 align-items: center;
 border-top: 1px solid #000;
 padding-top: 1px;
 margin-top: 2px;
 font-family: monospace;
 font-size: 6.5pt;
 color: #444;
 }
 .footer-left {
 display: flex;
 align-items: center;
 gap: 6px;
 }
 .app-logo-badge {
 font-weight: 900;
 color: #000;
 }
 .app-link {
 color: #000;
 text-decoration: none;
 font-weight: 700;
 }
 .footer-sep {
 color: #999;
 }
 .footer-right {
 display: flex;
 align-items: center;
 gap: 6px;
 font-weight: 700;
 }
 `;

    // Header/footer de cada hoja: independientes de cuántas páginas necesite el repertorio en
    // sí (el footer sí necesita el número de página final, se rellena tras calcular el plan).
    const buildHeaderHtml = (
      member: (typeof membersToExport)[number],
      isMaster: boolean,
    ): string => `
 <div class="page-header">
 <div class="header-left">
 ${
   showBandLogo && customLogoUrl
     ? `
 <img src="${customLogoUrl}" alt="${bandName}" class="band-logo-img" onerror="this.style.display='none'" />
 `
     : ""
 }
 <div class="band-text-block">
 <h1 class="band-heading">${bandName.toUpperCase()}</h1>
 <div class="setlist-meta">${activeSetlist.nombre.toUpperCase()}</div>
 </div>
 </div>

 <div class="header-right">
 <div class="member-stage-tag">
 <div class="tag-title">${!isMaster ? "COPIA PARA MÚSICO" : "COPIA CONTROL"}</div>
 <div class="tag-name">${member.name.toUpperCase()}</div>
 <div class="tag-instrument">${member.instrument.toUpperCase()}</div>
 </div>
 </div>
 </div>
 `;

    const buildFooterHtml = (
      member: (typeof membersToExport)[number],
      pageNum: number,
      totalPages: number,
    ): string =>
      showAppBranding
        ? `
 <div class="page-footer">
 <div class="footer-left">
 <span class="app-logo-badge">⚡ BandManager</span>
 <span class="footer-sep">•</span>
 <a href="https://www.bandmanager.app" target="_blank" class="app-link">www.bandmanager.app</a>
 </div>
 <div class="footer-right">
 <span>Hoja ${pageNum} de ${totalPages} (${member.name})</span>
 <span class="footer-sep">•</span>
 <span>${new Date().toLocaleDateString("es-ES")}</span>
 </div>
 </div>
 `
        : "";

    // Auto-ajuste (ver setlistAutoFit.ts): mide la altura REAL del contenido en un iframe
    // oculto (aislado del resto de la app — un <div> con <style> inyectado contaminaría los
    // estilos globales) para decidir, por cada hoja de miembro, el mayor tamaño de título que
    // hace que el repertorio quepa en una sola página — y si ni el mínimo cabe, en cuántas
    // páginas repartirlo y qué canciones va en cada una.
    const measureFrame = document.createElement("iframe");
    // Dimensiones reales (no 0x0): algunos navegadores — sobre todo Chrome en Android — no
    // calculan el layout interno de un iframe de tamaño cero con fiabilidad, y acaban midiendo
    // con un viewport por defecto en vez del ancho real que le pasamos al contenido. Se mantiene
    // fuera de la pantalla visible con left/top muy negativos en vez de con tamaño cero.
    measureFrame.style.cssText = `position:fixed;left:-99999px;top:-99999px;width:${PAGE_CONTENT_WIDTH_PX + 40}px;height:3000px;visibility:hidden;`;
    document.body.appendChild(measureFrame);

    const measureDoc = measureFrame.contentDocument;
    if (!measureDoc) {
      document.body.removeChild(measureFrame);
      return;
    }
    // El documento del iframe se escribe UNA sola vez (con las mismas Google Fonts que la
    // impresión real) y se espera a que carguen antes de medir nada — si no, todas las
    // mediciones se harían con la fuente de reserva del sistema (más ancha que Anton/Oswald,
    // que son condensadas), lo que sobreestima cuánto ocupa cada fila y hace que el algoritmo
    // decida más páginas de las que realmente hacen falta. Las mediciones posteriores solo
    // cambian el innerHTML de un contenedor reusable (#measure-target) en vez de reescribir
    // todo el documento cada vez — recargarlo por medición sería lentísimo y volvería a perder
    // las fuentes ya cargadas.
    measureDoc.open();
    measureDoc.write(`
 <!DOCTYPE html>
 <html>
 <head>
 <link rel="preconnect" href="https://fonts.googleapis.com">
 <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
 <link id="measure-fonts-link" href="https://fonts.googleapis.com/css2?family=Anton&family=Caveat:wght@600;700&family=Permanent+Marker&family=Courier+Prime:wght@700&family=Oswald:wght@600;700;800&display=swap" rel="stylesheet">
 <style>${printCss}</style>
 </head>
 <body><div id="measure-target"></div></body>
 </html>
 `);
    measureDoc.close();
    // Esperar solo a `fonts.ready` no basta: si en ese momento el navegador aún no ha
    // descargado/parseado la hoja de estilos externa del <link> de Google Fonts, esa promesa
    // puede resolver de inmediato sin haber registrado ninguna fuente todavía. Por eso primero
    // se espera a que el <link> termine de cargar (evento load/error, con timeout de seguridad
    // por si falla la red) y solo entonces a fonts.ready.
    const fontsLink = measureDoc.getElementById("measure-fonts-link");
    if (fontsLink) {
      await new Promise<void>((resolve) => {
        const done = () => resolve();
        fontsLink.addEventListener("load", done, { once: true });
        fontsLink.addEventListener("error", done, { once: true });
        setTimeout(done, 2000);
      });
    }
    if (measureDoc.fonts) {
      await measureDoc.fonts.ready;
    }
    const measureTarget = measureDoc.getElementById("measure-target");

    const measureHtmlHeightPx = (bodyHtml: string): number => {
      if (!measureTarget) return 0;
      measureTarget.innerHTML = bodyHtml;
      const el = measureTarget.firstElementChild as HTMLElement | null;
      return el ? el.getBoundingClientRect().height : 0;
    };

    // .sheet-page min-height (286mm, con @page a 5mm de margen vertical: 297-10=287mm reales,
    // 1mm de colchón de seguridad) menos su padding (2px arriba + 2px abajo): alto total
    // disponible en la hoja, antes de descontar el header/footer real de cada miembro. Margen
    // y padding recortados al mínimo razonable (de 6mm/4px a 5mm/2px) para ganar cada mm/px
    // real posible — esto se"Guarda como PDF", no hay tolerancia física de impresora que
    // respetar, y cada pixel ganado aquí es uno menos de riesgo de necesitar una hoja extra.
    const PAGE_TOTAL_HEIGHT_PX = mmToPx(286) - 4;

    const memberPlans = membersToExport.map((member) => {
      const isMaster = member.id === "master";
      const headerHtml = buildHeaderHtml(member, isMaster);
      // Placeholder de footer solo para medir: el texto exacto ("Hoja X de Y") no cambia su
      // alto, solo su ancho, así que basta con valores de relleno para la medición.
      const footerHtmlForMeasure = buildFooterHtml(member, 1, 1);
      const headerHeightPx = measureHtmlHeightPx(
        `<div style="width:${PAGE_CONTENT_WIDTH_PX}px">${headerHtml}</div>`,
      );
      const footerHeightPx = showAppBranding
        ? measureHtmlHeightPx(
            `<div style="width:${PAGE_CONTENT_WIDTH_PX}px">${footerHtmlForMeasure}</div>`,
          )
        : 0;
      const pageAvailableHeightPx =
        PAGE_TOTAL_HEIGHT_PX - headerHeightPx - footerHeightPx;

      // Filtrar solo canciones (tipoItem ==='cancion') — el conteo para paginación debe
      // ser de canciones, no del total de items (bloques no cuentan para numeración)
      const songsOnly = activeSetlist.items.filter(
        (item) => item.tipoItem === "cancion",
      );

      const measureFn: MeasureRangeFn = (
        titleFontPt,
        fromIndex,
        toIndexExclusive,
      ) => {
        const rowsHtml = songsOnly
          .slice(fromIndex, toIndexExclusive)
          .map((item, i) =>
            buildRowHtml(item, fromIndex + i, titleFontPt, member, isMaster),
          )
          .join("");
        return measureHtmlHeightPx(
          `<div class="setlist-items-container" style="width:${PAGE_CONTENT_WIDTH_PX}px">${rowsHtml}</div>`,
        );
      };

      //"De pie": fuerza el tamaño de título más grande y reparte en tantas hojas como haga
      // falta a ese tamaño — nunca hay ambigüedad que preguntar aquí (a diferencia del modo
      //"sentado", no se busca el mínimo nº de páginas, así que el diálogo de 1-hoja-vs-varias
      // no aplica en este modo).
      const plan =
        viewDensity === "de_pie"
          ? computeExpandedPlan(songsOnly.length, measureFn, {
              titleFontPt: TITLE_FONT_CANDIDATES_PT[0],
              pageAvailableHeightPx,
              maxTitleFontPt: MAX_EXPANDED_TITLE_FONT_PT,
            })
          : computeAutoFitPlan(songsOnly.length, measureFn, {
              candidateTitleFontPt: TITLE_FONT_CANDIDATES_PT,
              pageAvailableHeightPx,
              emergencyFontPt: EMERGENCY_TITLE_FONT_PT,
            });

      return { member, isMaster, plan, measureFn, pageAvailableHeightPx };
    });

    // Igualar nº de hojas entre miembros: si el repertorio de ALGUNO cabe en menos páginas
    // (normalmente porque sus notas personales son más cortas), lo lógico es intentar apretar
    // también las de los demás para que todos usen ese mismo nº de hojas — como haría un músico
    // montando cada set a mano, no dejar a unos en 1 hoja y a otros en 2 por el mismo repertorio
    // si de verdad se puede evitar. Cada miembro sigue calculándose de forma independiente (esto
    // solo intenta un reparto MÁS APRETADO para quien lo necesite, nunca al revés) y nunca se
    // acepta un desborde real de página — si ni con tolerancia extra encaja, ese miembro se
    // queda con su plan original de más páginas.
    // En modo"de pie" esta igualación NO se aplica: su única promesa es"letra siempre al
    // tamaño más grande posible", y apretar a un miembro a menos páginas implicaría buscar
    // entre TODOS los candidatos de fuente (incluyendo tamaños más pequeños que el forzado),
    // rompiendo esa promesa. Que cada miembro use un nº de páginas distinto en este modo es
    // esperado (unos tienen más notas que otros) y no un desequilibrio a corregir.
    const EQUALIZE_MAX_OVERFLOW_TOLERANCE = 0.12;
    const bestPageCount = Math.min(
      ...memberPlans.map((mp) => mp.plan.pageItemCounts.length),
    );
    const songsOnlyCount = activeSetlist.items.filter(
      (item) => item.tipoItem === "cancion",
    ).length;
    const equalizedMemberPlans =
      viewDensity === "de_pie"
        ? memberPlans
        : memberPlans.map((mp) => {
            if (mp.plan.pageItemCounts.length <= bestPageCount) return mp;
            const forced = tryFitInPageCount(songsOnlyCount, mp.measureFn, {
              candidateTitleFontPt: TITLE_FONT_CANDIDATES_PT,
              pageAvailableHeightPx: mp.pageAvailableHeightPx,
              forcedPageCount: bestPageCount,
              maxOverflowTolerance: EQUALIZE_MAX_OVERFLOW_TOLERANCE,
            });
            return forced ? { ...mp, plan: forced } : mp;
          });

    // Detectar el caso AMBIGUO: algún miembro cabe en 1 sola hoja solo gracias al tamaño de
    // emergencia (ver EMERGENCY_TITLE_FONT_PT), pero también existe la alternativa real de
    // repartir en varias hojas al tamaño ideal, más grande. Si el usuario no ha decidido
    // todavía (primera pasada, forcedSizeChoice indefinido), se pausa el flujo ANTES de abrir
    // ninguna ventana de impresión y se le muestra el nº real de páginas de cada opción — la
    // decisión nunca se toma en su nombre. Al elegir, se vuelve a llamar a handlePrint con la
    // decisión ya resuelta (ver el diálogo en el JSX del modal).
    const hasAmbiguousChoice = equalizedMemberPlans.some(
      (mp) => mp.plan.alternativePlan,
    );
    if (hasAmbiguousChoice && forcedSizeChoice === undefined) {
      const singleTotalPages = equalizedMemberPlans.reduce(
        (sum, mp) => sum + mp.plan.pageItemCounts.filter((c) => c > 0).length,
        0,
      );
      const multiTotalPages = equalizedMemberPlans.reduce(
        (sum, mp) =>
          sum +
          (mp.plan.alternativePlan ?? mp.plan).pageItemCounts.filter(
            (c) => c > 0,
          ).length,
        0,
      );
      document.body.removeChild(measureFrame);
      setSizeChoiceDialog({ singleTotalPages, multiTotalPages });
      return;
    }

    // Resolver la decisión: si el usuario eligió"varias hojas", cambiar cada plan ambiguo por
    // su alternativa — el plan principal ya ES la opción"1 sola hoja" por defecto, así que
    //"single" (o ninguna decisión, cuando no hubo ambigüedad) no necesita ningún cambio.
    const resolvedMemberPlans =
      forcedSizeChoice === "multi"
        ? equalizedMemberPlans.map((mp) =>
            mp.plan.alternativePlan
              ? { ...mp, plan: mp.plan.alternativePlan }
              : mp,
          )
        : equalizedMemberPlans;

    document.body.removeChild(measureFrame);

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Contar solo páginas con contenido (excluir páginas vacías con count === 0)
    const totalPagesCount = resolvedMemberPlans.reduce(
      (sum, mp) =>
        sum + mp.plan.pageItemCounts.filter((count) => count > 0).length,
      0,
    );

    // Resolver URLs relativas a absolutas para que funcionen en la ventana de impresión
    // Usar window.location.origin + ruta si es relativa, sino usar URL tal cual
    const absoluteLogoUrl = customLogoUrl?.trim()
      ? customLogoUrl.startsWith("http")
        ? customLogoUrl
        : `${window.location.origin}${customLogoUrl.startsWith("/") ? "" : "/"}${customLogoUrl}`
      : null;

    // Marca de agua: el logo del grupo en alta resolución (la misma imagen original que la
    // cabecera, no una miniatura reescalada) si hay uno subido y activo; si no, el nombre del
    // grupo como texto de respaldo. Si la imagen falla en cargar (404, CORS, etc.), el onerror
    // reemplaza todo el contenedor con el nombre como fallback.
    // Importante: HTML no entiende \" como escape (eso es solo JS) — dentro de un atributo
    // delimitado por comillas dobles, un \" corta el atributo en esa comilla real y deja el
    // resto del código como texto suelto visible en la página (bug real: al fallar la carga
    // del logo, aparecía literalmente `'" />` como texto en la hoja). Las comillas dobles del
    // HTML embebido en el onerror deben ir como entidad &quot;, y cualquier apóstrofe del
    // nombre del grupo debe escaparse para no romper el string JS (delimitado por comillas
    // simples) del propio onerror.
    const safeBandNameForOnerror = bandName
      .toUpperCase()
      .replace(/'/g, "&#39;");
    const watermarkInnerHtml =
      showBandLogo && absoluteLogoUrl
        ? `<img src="${absoluteLogoUrl}" alt="" class="page-watermark-logo" onerror="this.parentElement.innerHTML='<div class=&quot;page-watermark-text&quot;>${safeBandNameForOnerror}</div>'" />`
        : `<div class="page-watermark-text">${bandName.toUpperCase()}</div>`;

    let globalPageIdx = 0;
    const pagesHtml = resolvedMemberPlans
      .map(({ member, isMaster, plan }) => {
        let cursor = 0;
        return plan.pageItemCounts
          .map((count, pageIdx) => {
            const startIdx = cursor;
            cursor += count;
            // Saltar páginas vacías (sin canciones)
            if (count === 0) return "";

            globalPageIdx++;
            // Cada página usa su propio tamaño de fuente (ver pageFontSizes en
            // computeAutoFitPlan/setlistAutoFit.ts): con menos canciones que el repertorio
            // completo, una página concreta suele tener margen para una letra MAYOR que la
            // elegida para el conjunto total — se aprovecha en vez de dejarla al mínimo.
            const pageFontPt = plan.pageFontSizes[pageIdx] ?? plan.titleFontPt;

            // Mapear índices de canciones [startIdx, startIdx+count) a índices reales en
            // activeSetlist.items (que incluye bloques intercalados). Encontrar dónde comienza
            // la canción startIdx y dónde termina la canción startIdx+count-1.
            const songIndicesByRealIdx = activeSetlist.items
              .map((item, idx) => (item.tipoItem === "cancion" ? idx : -1))
              .filter((idx) => idx !== -1);

            const firstSongRealIdx = songIndicesByRealIdx[startIdx] ?? 0;
            const lastSongRealIdx =
              songIndicesByRealIdx[startIdx + count - 1] ??
              activeSetlist.items.length - 1;
            const pageItems = activeSetlist.items.slice(
              firstSongRealIdx,
              lastSongRealIdx + 1,
            );

            let songIndex = startIdx;
            const rowsHtml = pageItems
              .map((item) => {
                if (item.tipoItem === "cancion") {
                  const html = buildRowHtml(
                    item,
                    songIndex,
                    pageFontPt,
                    member,
                    isMaster,
                  );
                  songIndex++;
                  return html;
                } else {
                  return buildRowHtml(item, -1, pageFontPt, member, isMaster);
                }
              })
              .join("");
            const isLastPageOverall = globalPageIdx === totalPagesCount;

            return `
 <div class="sheet-page ${!isLastPageOverall ? "page-break" : ""}">
 <div class="page-watermark">${watermarkInnerHtml}</div>
 ${buildHeaderHtml(member, isMaster)}
 <div class="setlist-items-container">
 ${rowsHtml}
 </div>
 ${buildFooterHtml(member, globalPageIdx, totalPagesCount)}
 </div>
 `;
          })
          .filter((html) => html !== "")
          .join("");
      })
      .join("");

    printWindow.document.write(`
 <!DOCTYPE html>
 <html>
 <head>
 <meta charset="utf-8">
 <title>${bandName} - Setlist ${activeSetlist.nombre}</title>
 <link rel="preconnect" href="https://fonts.googleapis.com">
 <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
 <link href="https://fonts.googleapis.com/css2?family=Anton&family=Caveat:wght@600;700&family=Permanent+Marker&family=Courier+Prime:wght@700&family=Oswald:wght@600;700;800&display=swap" rel="stylesheet">
 <style>${printCss}</style>
 </head>
 <body>
 ${pagesHtml}
 <script>
 window.onload = () => {
 //'onload' solo garantiza que el CSS de Google Fonts (el texto de las reglas
 // @font-face) ya se descargó — NO que los archivos de fuente (woff2) referenciados
 // ya estén descargados/parseados. Sin esperar a'fonts.ready', window.print() podía
 // disparar con la fuente de reserva del sistema todavía puesta (más ancha que
 // Anton/Oswald/Caveat), reflowing el texto más alto de lo medido en el iframe oculto
 // y desbordando la última canción a una hoja nueva — el bug real detrás de que tres
 // ajustes distintos de tamaño/espaciado dieran siempre el mismo resultado: ninguno
 // tocaba esta carrera, así que el contenido real seguía siendo más alto de lo medido.
 var go = function () {
 window.print();
 setTimeout(function () { window.close(); }, 800);
 };
 if (document.fonts && document.fonts.ready) {
 var done = false;
 var proceed = function () { if (!done) { done = true; go(); } };
 document.fonts.ready.then(proceed);
 setTimeout(proceed, 2000);
 } else {
 go();
 }
 };
 </script>
 </body>
 </html>
 `);
    printWindow.document.close();
  };

  // Preview page member
  const currentPreviewMember =
    membersToExport[previewPageIndex] || membersToExport[0];
  const isCurrentMaster = currentPreviewMember?.id === "master";

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 bg-[var(--scrim)]/90 flex items-center justify-center p-2 sm:p-4 z-[9999] overflow-y-auto overscroll-contain">
        <div
          className={`w-full max-w-7xl max-h-[96vh] my-auto flex flex-col rounded-[var(--r-l)] overflow-hidden ${"bg-[var(--surface)]"}`}
        >
          {/* Modal Top Header — recortado a lo esencial en móvil (badge decorativo e info extra
 ocultos: ver hidden/sm:inline-block y sm:block más abajo) para que en pantallas
 pequeñas no compita por espacio con los controles y la vista previa, que son lo que
 de verdad hace falta ver de un vistazo. */}
          <div
            className={`p-3 sm:p-3.5 sm:px-6 flex items-center justify-between gap-2 sm:gap-3 shrink-0 ${"bg-[var(--surface)]"}`}
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="hidden sm:flex p-2.5 rounded-[var(--r-m)] bg-[var(--acc)]/15 text-[var(--acc)] shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-black text-sm sm:text-lg tracking-wider text-[var(--ink)] truncate">
                    Generador de Repertorios
                  </h3>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-black font-sans bg-[var(--surface)] text-[var(--ink)] shrink-0">
                    Rock Stage Edition
                  </span>
                </div>
                <p className="text-xs text-[var(--ink-2)] font-sans mt-0.5 truncate">
                  <span className="font-bold text-[var(--ink)]">
                    {activeSetlist.nombre}
                  </span>
                  <span className="hidden sm:inline">
                    {" "}
                    ({activeSetlistMetrics.songCount} temas • Letras grandes
                    para el suelo de escenario con notas a mano)
                  </span>
                  <span className="sm:hidden">
                    {" "}
                    · {activeSetlistMetrics.songCount} temas
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <button
                onClick={() => handlePrint()}
                className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-[var(--r-m)] font-sans text-xs font-black transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink)] active:scale-95 hover:shadow-[var(--ok)]/20"
              >
                <Printer className="w-4 h-4" />
                {/*"Músico(s)", no"Hoja(s)": cada uno puede generar más de una página física según
 el auto-ajuste (ver computeAutoFitPlan) — el número real de páginas no se sabe
 hasta medir el contenido, así que no se promete aquí. Texto completo solo en
 desktop; en móvil solo"Imprimir" para no competir por ancho con el resto del
 header. */}
                <span className="hidden sm:inline">
                  Imprimir para {membersToExport.length}{" "}
                  {membersToExport.length === 1 ? "Músico" : "Músicos"} (PDF)
                </span>
                <span className="sm:hidden">Imprimir</span>
              </button>
              <button
                onClick={onClose}
                className={`p-2 rounded-[var(--r-m)] transition-colors active:scale-95 cursor-pointer ${"hover:bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink-2)]"}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Customization Control Panel */}
          <div
            className={`p-3 sm:px-6 flex flex-col gap-3 text-xs font-sans shrink-0 ${"bg-[var(--surface)]"}`}
          >
            {/* Row 1: Mode & Target Selector — en móvil un <select> compacto (los 3 botones en
 fila no cabían sin apretarse); en desktop, los botones de siempre, más cómodos con
 mouse y con espacio de sobra en pantallas grandes. */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <select
                value={printMode}
                onChange={(e) => {
                  setPrintMode(
                    e.target.value as
                      | "all_members"
                      | "single_member"
                      | "master",
                  );
                  setPreviewPageIndex(0);
                }}
                className={`sm:hidden flex-1 min-w-0 p-2 rounded-[var(--r-s)] font-bold cursor-pointer ${"bg-[var(--surface)] text-[var(--ink)]"}`}
              >
                <option value="all_members">
                  👥 Todos los Músicos ({resolvedMembers.length} hojas)
                </option>
                <option value="single_member">👤 1 Músico Específico</option>
                <option value="master">📄 Master Escenario / Sonido</option>
              </select>

              <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-[var(--r-m)] bg-[var(--sunken)]">
                <button
                  onClick={() => {
                    setPrintMode("all_members");
                    setPreviewPageIndex(0);
                  }}
                  className={`px-3 py-1.5 rounded-[var(--r-s)] font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    printMode === "all_members"
                      ? "bg-[var(--surface)] text-[var(--ink)]"
                      : "text-[var(--ink-2)] hover:text-[var(--ink)]"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> Todos los Músicos (
                  {resolvedMembers.length} hojas individuales)
                </button>
                <button
                  onClick={() => {
                    setPrintMode("single_member");
                    setPreviewPageIndex(0);
                  }}
                  className={`px-3 py-1.5 rounded-[var(--r-s)] font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    printMode === "single_member"
                      ? "bg-[var(--surface)] text-[var(--ink)]"
                      : "text-[var(--ink-2)] hover:text-[var(--ink)]"
                  }`}
                >
                  <User className="w-3.5 h-3.5" /> 1 Músico Específico
                </button>
                <button
                  onClick={() => {
                    setPrintMode("master");
                    setPreviewPageIndex(0);
                  }}
                  className={`px-3 py-1.5 rounded-[var(--r-s)] font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    printMode === "master"
                      ? "bg-[var(--surface)] text-[var(--ink)]"
                      : "text-[var(--ink-2)] hover:text-[var(--ink)]"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> Master Escenario / Sonido
                </button>
              </div>

              {/* Single member picker */}
              {printMode === "single_member" && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="hidden sm:inline text-[var(--ink-2)] font-bold">
                    Músico:
                  </span>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className={`flex-1 sm:flex-none min-w-0 p-1.5 px-3 rounded-[var(--r-s)] font-bold cursor-pointer ${"bg-[var(--surface)] text-[var(--ink)]"}`}
                  >
                    {resolvedMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        👤 {m.name} ({m.instrument})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Densidad de vista:"sentado" busca el mínimo nº de hojas posible (para leer de
 cerca — atril, mesa de sonido);"de pie" fuerza la letra más grande de todas,
 aceptando más hojas a cambio — para leerlo desde lejos, de pie en el escenario. */}
              <div className="flex items-center gap-1.5 p-1 rounded-[var(--r-m)] bg-[var(--sunken)]">
                <button
                  onClick={() => setViewDensity("sentado")}
                  className={`px-3 py-1.5 rounded-[var(--r-s)] font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    viewDensity === "sentado"
                      ? "bg-[var(--surface)] text-[var(--ink)]"
                      : "text-[var(--ink-2)] hover:text-[var(--ink)]"
                  }`}
                  title="Menos hojas posible, letra automática — para leer de cerca (atril, mesa de sonido)"
                >
                  🪑 Sentado
                </button>
                <button
                  onClick={() => setViewDensity("de_pie")}
                  className={`px-3 py-1.5 rounded-[var(--r-s)] font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    viewDensity === "de_pie"
                      ? "bg-[var(--surface)] text-[var(--ink)]"
                      : "text-[var(--ink-2)] hover:text-[var(--ink)]"
                  }`}
                  title="Letra lo más grande posible (sube por página, sin techo fijo) y notas siempre debajo del título, aceptando más hojas — para leer desde lejos, de pie en el escenario"
                >
                  🧍 De pie
                </button>
              </div>
            </div>

            {/* Botón"Ajustes" — solo en móvil (sm:hidden): colapsa tipografía/tinta/badges detrás
 de un toggle para no agobiar la pantalla pequeña con todo a la vez. En desktop esos
 ajustes están siempre visibles (ver"sm:flex" en el Row 2 de abajo, que los muestra
 sin importar showAdvancedSettings). */}
            <button
              onClick={() => setShowAdvancedSettings((v) => !v)}
              className={`sm:hidden w-full flex items-center justify-between px-3 py-2 rounded-[var(--r-s)] font-bold cursor-pointer transition-colors ${"bg-[var(--surface)] text-[var(--ink-2)]"}`}
            >
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[var(--ink-2)]" /> Ajustes
                (letra, tinta, badges)
              </span>
              {showAdvancedSettings ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Row 2: Typography, Handwritten Sharpie Ink & Toggles — en móvil apilado en columna
 (3 grupos en una sola fila se apretaban demasiado en pantallas pequeñas), en
 desktop en fila con espacio de sobra. */}
            <div
              className={`${showAdvancedSettings ? "flex" : "hidden"} flex-col sm:flex-row sm:flex-wrap items-start sm:items-center sm:justify-between gap-3 sm:gap-4 pt-2 w-full sm:flex`}
            >
              {/* Tamaño de título: ya no se elige a mano — se auto-ajusta por hoja (ver
 computeAutoFitPlan) para llenar la página lo mejor posible, priorizando el
 mínimo ideal de 17pt (legible a ~2m en escenario) para repartir en varias hojas.
 Solo cuando eso evitaría caber en una sola hoja por muy poco margen, prueba un
 tamaño de emergencia (15pt) como último recurso — nunca para repartir en más de
 1 página, solo para intentar mantenerlo en una sola. */}
              <div className="flex items-center gap-2">
                <span className="text-[var(--ink-2)] font-bold flex items-center gap-1">
                  <Type className="w-3.5 h-3.5 text-[var(--acc)]" /> Tamaño
                  Títulos:
                </span>
                <span
                  className="px-2.5 py-1 rounded text-[11px] font-bold bg-[var(--acc)]/20 text-[var(--acc)]/70"
                  title="El tamaño y el número de hojas se calculan automáticamente para aprovechar mejor el espacio (mínimo ideal 17pt; solo baja a 15pt como último recurso si eso evita saltar a una hoja extra)."
                >
                  ⚡ Automático
                </span>
              </div>

              {/* Handwritten Note Style */}
              <div className="flex items-center gap-2">
                <span className="text-[var(--ink-2)] font-bold flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5 text-[var(--ink-2)]" /> Letra
                  Manuscrita:
                </span>
                <select
                  value={handwritingFont}
                  onChange={(e) => setHandwritingFont(e.target.value as any)}
                  className="p-1 px-2.5 rounded-[var(--r-s)] bg-[var(--sunken)] text-[var(--ink)] font-bold text-[11px] cursor-pointer"
                >
                  <option value="caveat">✍️ Rotulador Fino (Caveat)</option>
                  <option value="permanent_marker">
                    🖊️ Sharpie Grueso (Permanent Marker)
                  </option>
                  <option value="courier">⌨️ Máquina (Courier)</option>
                  <option value="sans">🔤 Imprenta Limpia (Sans)</option>
                </select>

                {/* Ink color selector */}
                <div className="flex items-center gap-1 bg-[var(--sunken)] p-1 rounded-[var(--r-s)]">
                  <button
                    onClick={() => setHandwritingColor("blue")}
                    className={`w-5 h-5 rounded-full bg-[var(--tentative)] transition-transform cursor-pointer ${
                      handwritingColor === "blue"
                        ? "ring-2 ring-white scale-110"
                        : "opacity-60 hover:opacity-100"
                    }`}
                    title="Tinta Azul Rotulador"
                  />
                  <button
                    onClick={() => setHandwritingColor("black")}
                    className={`w-5 h-5 rounded-full bg-[var(--surface)] transition-transform cursor-pointer ${
                      handwritingColor === "black"
                        ? "ring-2 ring-white scale-110"
                        : "opacity-60 hover:opacity-100"
                    }`}
                    title="Tinta Negra Sharpie"
                  />
                  <button
                    onClick={() => setHandwritingColor("red")}
                    className={`w-5 h-5 rounded-full bg-[var(--alert)] transition-transform cursor-pointer ${
                      handwritingColor === "red"
                        ? "ring-2 ring-white scale-110"
                        : "opacity-60 hover:opacity-100"
                    }`}
                    title="Tinta Roja Marcador"
                  />
                  <button
                    onClick={() => setHandwritingColor("purple")}
                    className={`w-5 h-5 rounded-full bg-[var(--acc)] transition-transform cursor-pointer ${
                      handwritingColor === "purple"
                        ? "ring-2 ring-white scale-110"
                        : "opacity-60 hover:opacity-100"
                    }`}
                    title="Tinta Violeta"
                  />
                </div>
              </div>

              {/* Feature Toggles (BPM & Duration optional, Logo, etc.) */}
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1.5 text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showBandLogo}
                    onChange={(e) => setShowBandLogo(e.target.checked)}
                    className="rounded accent-[var(--ok)] cursor-pointer"
                  />
                  <span>Logo Grupo</span>
                </label>

                <label className="flex items-center gap-1.5 text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showTonality}
                    onChange={(e) => setShowTonality(e.target.checked)}
                    className="rounded accent-[var(--ok)] cursor-pointer"
                  />
                  <span>Tono</span>
                </label>

                <label className="flex items-center gap-1.5 text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showBpm}
                    onChange={(e) => setShowBpm(e.target.checked)}
                    className="rounded accent-[var(--ok)] cursor-pointer"
                  />
                  <span>BPM</span>
                </label>

                <label className="flex items-center gap-1.5 text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showDuration}
                    onChange={(e) => setShowDuration(e.target.checked)}
                    className="rounded accent-[var(--ok)] cursor-pointer"
                  />
                  <span>Duración</span>
                </label>

                <label className="flex items-center gap-1.5 text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showAppBranding}
                    onChange={(e) => setShowAppBranding(e.target.checked)}
                    className="rounded accent-[var(--ok)] cursor-pointer"
                  />
                  <span>Pie BandManager</span>
                </label>
              </div>
            </div>
          </div>

          {/* Pager Navigation for Multiple Sheets — recortado en móvil: sin el texto largo"Previsualizando hoja X de Y", y los botones Anterior/Siguiente solo con icono (el
 texto competía por ancho con el badge del músico en pantallas pequeñas). */}
          {membersToExport.length > 1 && (
            <div
              className={`px-3 sm:px-6 py-1.5 sm:py-2 flex items-center justify-between gap-2 text-xs font-sans shrink-0 ${"bg-[var(--sunken)]"}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="hidden sm:inline font-bold text-[var(--ink-2)] shrink-0">
                  Previsualizando hoja {previewPageIndex + 1} de{" "}
                  {membersToExport.length}:
                </span>
                <span className="sm:hidden font-bold text-[var(--ink-2)] shrink-0">
                  {previewPageIndex + 1}/{membersToExport.length}
                </span>
                <span className="px-2.5 sm:px-3 py-0.5 rounded-full bg-[var(--ok)]/20 text-[var(--ink-2)] font-bold flex items-center gap-1.5 min-w-0 truncate">
                  <span className="truncate">
                    👤 {currentPreviewMember.name}
                  </span>
                  <span className="hidden sm:inline text-[var(--ink-2)] text-[10px] shrink-0">
                    ({currentPreviewMember.instrument})
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  disabled={previewPageIndex <= 0}
                  onClick={() => setPreviewPageIndex((p) => Math.max(0, p - 1))}
                  className="p-1.5 sm:p-1 sm:px-3 rounded-[var(--r-s)] bg-[var(--ink)]/10 hover:bg-[var(--ink)]/20 disabled:opacity-30 disabled:cursor-not-allowed font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />{" "}
                  <span className="hidden sm:inline">Anterior</span>
                </button>
                <button
                  disabled={previewPageIndex >= membersToExport.length - 1}
                  onClick={() =>
                    setPreviewPageIndex((p) =>
                      Math.min(membersToExport.length - 1, p + 1),
                    )
                  }
                  className="p-1.5 sm:p-1 sm:px-3 rounded-[var(--r-s)] bg-[var(--ink)]/10 hover:bg-[var(--ink)]/20 disabled:opacity-30 disabled:cursor-not-allowed font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span className="hidden sm:inline">Siguiente</span>{" "}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Modal Body: A4 Stage Sheet Real Preview Container */}
          <div
            className={`flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center ${"bg-[var(--sunken)]"}`}
          >
            {/* Authentic Real Stage Paper Sheet */}
            <div
              ref={sheetRef}
              className="relative overflow-hidden bg-[var(--surface)] text-[var(--ink)] p-8 sm:p-12 rounded-sm w-full max-w-[210mm] min-h-[297mm] flex flex-col justify-between border-text-[var(--ink-2)] transition-all"
              style={{
                width: "210mm",
                minHeight: "297mm",
                fontFamily:
                  stylePreset === "rock_stage"
                    ? "'Anton','Oswald', sans-serif"
                    : "'Oswald', sans-serif",
              }}
            >
              {/* Marca de agua: muy suave, centrada, de fondo — mismo tratamiento que en el HTML de
 impresión (position:absolute, no forma parte del flujo ni del cálculo de alto). El
 logo del grupo en alta resolución (misma imagen original que la cabecera) si hay
 uno subido y activo; si no, el nombre como texto de respaldo. */}
              <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none select-none overflow-hidden">
                {showBandLogo && customLogoUrl ? (
                  <img
                    src={customLogoUrl}
                    alt=""
                    className="max-w-[65%] max-h-[65%] object-contain"
                    // 0.09 se veía casi invisible al imprimir en papel real (la pantalla ilumina el
                    // mismo valor más de lo que refleja la tinta) — subido a 0.16, mismo valor que
                    // el HTML de impresión real, para que la vista previa no engañe sobre cómo sale.
                    style={{ opacity: 0.16 }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <span
                    className="whitespace-nowrap font-['Anton',sans-serif] font-black"
                    style={{
                      fontSize: "70pt",
                      letterSpacing: "4px",
                      color: getInkColorHex(),
                      opacity: 0.14,
                      transform: "rotate(-20deg)",
                    }}
                  >
                    {bandName}
                  </span>
                )}
              </div>

              {/* Top Sheet Header — compacta a propósito: cada mm que se ahorra aquí es un mm
 menos de riesgo de que el repertorio se desborde a una hoja extra. */}
              <div>
                <div className="flex items-center justify-between pb-0.5 mb-1">
                  <div className="flex items-center gap-2">
                    {showBandLogo && customLogoUrl && (
                      <img
                        src={customLogoUrl}
                        alt={bandName}
                        className="max-h-7 max-w-[80px] object-contain filter grayscale contrast-150"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    )}
                    <div>
                      <h1 className="text-[14pt] font-black tracking-tighter m-0 leading-none text-[var(--ink)] font-['Anton',sans-serif]">
                        {bandName.toUpperCase()}
                      </h1>
                      <div className="text-[9pt] font-bold text-[var(--ink-2)] mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-full font-['Oswald',sans-serif]">
                        {activeSetlist.nombre.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div className="border-2 bg-[var(--surface)] p-1 px-2 rounded text-right min-w-[110px] whitespace-nowrap">
                    <div className="text-[6pt] font-sans font-bold text-[var(--ink-2)] tracking-widest">
                      {!isCurrentMaster
                        ? "REPERTORIO PERSONALIZADO"
                        : "COPIA DE CONTROL"}
                    </div>
                    <div className="text-[10pt] font-black text-[var(--ink)] leading-tight font-['Anton',sans-serif]">
                      👤 {currentPreviewMember.name}
                    </div>
                    <div className="text-[7pt] font-sans font-bold text-[var(--ink)]">
                      🎵 {currentPreviewMember.instrument}
                    </div>
                  </div>
                </div>

                {/* Setlist Song List (Large High-Impact Typography). El ritmo vertical"sin nota"
 es el de una lista impresa apretada — no se reserva hueco para notas aquí, se
 aprovecha el que ya deja el interlineado del título (ver modo'below' abajo). */}
                <div className="space-y-0">
                  {(() => {
                    let songIndex = 0; // Contador solo para canciones, no para todos los items
                    return activeSetlist.items.map((item, index) => {
                      if (item.tipoItem === "cancion") {
                        const s = songs.find((x) => x.id === item.songId);
                        if (!s) return null;

                        songIndex++; // Incrementar solo cuando es una canción

                        const memberNote = !isCurrentMaster
                          ? getSongMemberNote(
                              s,
                              currentPreviewMember.id,
                              currentPreviewMember.name,
                            )
                          : "";
                        const generalRepertorioNote =
                          s.notasRepertorio || s.notasInternas || "";
                        const setlistNote =
                          (item as any).notaTema || item.notas || "";

                        // La vista previa no pagina de verdad (scroll continuo), así que no puede
                        // reflejar el nº real de hojas — pero al menos usa un tamaño de referencia
                        // mayor en modo"de pie" para dar una idea de que la letra sale más grande.
                        const titleFontPt =
                          viewDensity === "de_pie"
                            ? TITLE_FONT_CANDIDATES_PT[0]
                            : PREVIEW_TITLE_FONT_PT;
                        const noteFontPt = deriveNoteFontPt(titleFontPt);
                        const numberText = showSongNumbers
                          ? `${songIndex}.`
                          : "";
                        const badges: NoteLayoutBadge[] = [
                          ...(showTonality && s.tonalidad
                            ? [
                                {
                                  text: s.tonalidad,
                                  fontSizePx: ptToPx(11),
                                  extraWidthPx: 14,
                                },
                              ]
                            : []),
                          ...(showBpm && s.bpm
                            ? [
                                {
                                  text: `${s.bpm} BPM`,
                                  fontSizePx: ptToPx(10.5),
                                },
                              ]
                            : []),
                          ...(showDuration && s.duracion
                            ? [{ text: s.duracion, fontSizePx: ptToPx(10.5) }]
                            : []),
                        ];
                        const noteLayout = computeNoteLayout({
                          memberNote,
                          setlistNote,
                          generalNote: generalRepertorioNote,
                          showSetlistNotes,
                          numberText,
                          numberFontSizePx: ptToPx(20),
                          titleText: s.titulo,
                          titleFontSizePx: ptToPx(titleFontPt),
                          titleFontFamily: "'Anton','Oswald', sans-serif",
                          badges,
                          noteFontFamily: getHandwritingFontFamily(),
                          noteMaxFontSizePx: ptToPx(noteFontPt),
                          noteMinFontSizePx: 11,
                          rowWidthPx: previewContentWidthPx,
                          measure: measureText,
                          forceBelowMode: viewDensity === "de_pie",
                        });
                        // Cada nota (miembro / nota del bolo / general) apilada en su propia línea,
                        // una encima de otra, en vez de todas seguidas en una sola línea. El texto
                        // nunca se trunca: sin `truncate`/`overflow-hidden` a propósito, para que una
                        // nota patológicamente larga (caso raro, ya encogida al suelo mínimo en
                        // computeNoteLayout) pueda asomar un poco fuera de su carril en vez de
                        // recortarse sin avisar. whitespace-nowrap sí se mantiene: eso es lo que
                        // garantiza que nunca salta a una segunda línea.
                        // Rotación + desplazamiento por LÍNEA (no un único transform para todo el
                        // bloque): así"nota de fer","*** ... ***" y"[General: ...]" no giran como
                        // una pieza rígida, sino que cada una parece garabateada por separado, en un
                        // momento distinto — más orgánico y menos"maquetado". Seed = id de canción +
                        // tipo de nota, para que sea estable entre repintados pero distinto entre las
                        // tres notas de la misma fila.
                        const renderNoteLine = (
                          line: NoteLine,
                          key: string,
                          showArrow: boolean = false,
                        ) => {
                          const noteColor =
                            line.className === "note-member"
                              ? getInkColorHex()
                              : line.className === "note-cue"
                                ? "#b45309"
                                : "#555";
                          const seed = `${s.id}-${line.className}`;
                          // Solo hacia arriba (o recta), nunca hacia abajo: rotate() positivo gira en
                          // sentido horario, o sea el extremo derecho del texto cae hacia abajo — se veía
                          // como una nota"torcida hacia abajo" en vez de la escritura ascendente natural.
                          const lineRotationDeg = -Math.abs(
                            deterministicRotationDeg(seed, 3),
                          );
                          const lineOffsetXPx = deterministicOffsetPx(
                            `${seed}-x`,
                            2,
                          );
                          // Solo hacia arriba (o recta), nunca hacia abajo: un desplazamiento positivo se
                          // veía como un salto de línea/desalineación entre notas — justo el efecto que se
                          // había quitado a propósito (ver line-height:1 más arriba).
                          const lineOffsetYPx = -Math.abs(
                            deterministicOffsetPx(`${seed}-y`, 2),
                          );
                          return (
                            <div
                              key={key}
                              className={`flex items-center min-w-0 max-w-full font-bold whitespace-nowrap ${
                                line.className === "note-general"
                                  ? "italic font-semibold"
                                  : ""
                              }`}
                              style={{
                                fontFamily: getHandwritingFontFamily(),
                                fontSize: line.fontSizePx,
                                color: noteColor,
                                transform: `rotate(${lineRotationDeg}deg) translate(${lineOffsetXPx}px, ${lineOffsetYPx}px)`,
                              }}
                            >
                              {/* Flecha manuscrita apuntando al título de arriba: en modo'below'
 (nota separada del título) va en la primera línea; en modo'inline'
 con varias notas apiladas va en la ÚLTIMA (la que queda más cerca de
 la canción siguiente, donde puede haber duda de a qué tema
 pertenece) — ver referencia visual de setlist real (flechas"← nota" a mano). Un único trazo doblado, no una V simétrica de
 línea técnica, para no romper el efecto manuscrito. */}
                              {showArrow && (
                                <svg
                                  width={line.fontSizePx * 0.75}
                                  height={line.fontSizePx * 0.75}
                                  viewBox="0 0 16 16"
                                  style={{ flexShrink: 0, marginRight: 3 }}
                                >
                                  <path
                                    d="M13 13 L4 5 M4 5 L4.5 8.5 M4 5 L7.5 4.5"
                                    stroke={noteColor}
                                    strokeWidth="1.3"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                              <span>{line.text}</span>
                            </div>
                          );
                        };

                        return (
                          <div key={item.id} className="group relative">
                            {/* flex-nowrap en la fila del título: se trunca con"..." (min-w-0 +
 truncate) en vez de saltar de línea, así la fila nunca crece de alto
 ni se monta sobre la canción de arriba. Sin justify-between a
 propósito: la nota debe quedar pegada justo detrás del título (como
 un boli escribiendo a continuación), no flotando contra el margen
 derecho con un hueco en blanco en medio (ver noteLayout más abajo). */}
                            <div className="flex items-baseline gap-1.5 flex-nowrap">
                              <div className="flex items-baseline gap-2.5 min-w-0 flex-nowrap overflow-hidden">
                                {showSongNumbers && (
                                  <span className="font-sans text-[20pt] text-[var(--ink-2)] font-black min-w-[32px] shrink-0">
                                    {index + 1}.
                                  </span>
                                )}
                                {/* truncate/min-w-0 solo cuando de verdad hay una nota compitiendo
 por sitio en esta fila (noteLayout.mode ==='inline'); si no,
 el título vuelve a poder ocupar toda su anchura natural. */}
                                <span
                                  className={`font-black tracking-wide text-[var(--ink)] leading-none ${
                                    noteLayout && noteLayout.mode === "inline"
                                      ? "truncate min-w-0"
                                      : ""
                                  }`}
                                  style={{
                                    fontFamily: "'Anton','Oswald', sans-serif",
                                    fontSize: `${titleFontPt}pt`,
                                  }}
                                >
                                  {noteLayout?.truncatedTitle ?? s.titulo}
                                </span>

                                {showTonality && s.tonalidad && (
                                  <span className="font-sans text-[11pt] font-black px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--ink)] leading-none ml-1 shrink-0">
                                    {s.tonalidad}
                                  </span>
                                )}

                                {showBpm && s.bpm && (
                                  <span className="font-sans text-[10.5pt] font-bold text-[var(--ink-2)] ml-1 shrink-0">
                                    {s.bpm} BPM
                                  </span>
                                )}

                                {showDuration && s.duracion && (
                                  <span className="font-sans text-[10.5pt] font-bold text-[var(--ink-2)] ml-1 shrink-0">
                                    {s.duracion}
                                  </span>
                                )}
                              </div>

                              {/* Notas"escritas a mano" a la derecha, cuando cabe con hueco de sobra
 (ver computeNoteLayout) — apiladas, una por línea, tamaño ya
 decidido por textFit, aquí solo se pintan. */}
                              {/* self-start a propósito: el padre usa items-baseline, y al ser este
 un contenedor flex-column con varias líneas, su"baseline" para el
 padre se toma de la ÚLTIMA línea — empujaba toda la columna hacia
 abajo, dejando hueco entre el título y la primera nota. */}
                              {/* noteLayout puede venir en modo'inline' con fit.lines vacío (caso"solo badges, sin notas" — ver computeNoteLayout): ahí no hay nada
 que pintar como nota manuscrita, solo se usó el layout para decidir
 cuánto debía ceder el título ante los badges. */}
                              {noteLayout &&
                                noteLayout.mode === "inline" &&
                                noteLayout.fit.lines.length > 0 && (
                                  <div
                                    className="flex flex-col items-start self-start shrink-0"
                                    style={{
                                      maxWidth: noteLayout.maxWidthPx,
                                      lineHeight: 1,
                                    }}
                                  >
                                    {noteLayout.fit.lines.map((line, i) =>
                                      renderNoteLine(
                                        line,
                                        `l${i}`,
                                        noteLayout.fit.lines.length > 1 &&
                                          i === noteLayout.fit.lines.length - 1,
                                      ),
                                    )}
                                  </div>
                                )}

                              {/* Quick note edit trigger on hover — ml-auto lo mantiene pegado al
 margen derecho ahora que el título y la nota ya no usan
 justify-between entre sí (ver arriba). */}
                              {onUpdateSong && (
                                <button
                                  onClick={() => setEditingSongForNotes(s)}
                                  title="Editar notas manuscritas de esta canción"
                                  className="ml-auto opacity-0 group-hover:opacity-100 text-xs px-2.5 py-1 bg-[var(--sunken)] hover:bg-[var(--sunken)] border-text-[var(--ink-2)] rounded font-sans text-[var(--ink)] flex items-center gap-1.5 cursor-pointer transition-opacity shrink-0"
                                >
                                  <Edit3 className="w-3 h-3 text-[var(--ok)]" />
                                  <span>Editar Nota</span>
                                </button>
                              )}
                            </div>

                            {/* Excepción rara y controlada: el título de esta fila concreta no dejó
 hueco razonable al lado. La nota no abre una fila nueva con su propio
 aire: muerde (margin-top negativo) el hueco que ya deja el
 interlineado del título de arriba, para parecer escrita a mano justo
 pegada a la línea impresa. */}
                            {noteLayout && noteLayout.mode === "below" && (
                              <div
                                className="pl-9"
                                style={{ lineHeight: 1, marginTop: "-10px" }}
                              >
                                {noteLayout.fit.lines.map((line, i) =>
                                  renderNoteLine(line, `l${i}`, i === 0),
                                )}
                              </div>
                            )}
                          </div>
                        );
                      } else if (
                        item.tipoItem === "bloque" &&
                        item.bloqueSubtipo === "header"
                      ) {
                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 my-0.5"
                          >
                            <div className="flex-1 h-px bg-black" />
                            <span className="font-['Oswald',sans-serif] text-[10pt] font-black tracking-wider text-[var(--ink)] whitespace-nowrap">
                              {item.tituloCustom || "BLOQUE"}
                            </span>
                            <div className="flex-1 h-px bg-black" />
                          </div>
                        );
                      } else if (
                        item.tipoItem === "bloque" &&
                        item.bloqueSubtipo === "bis"
                      ) {
                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 my-0.5"
                          >
                            <div className="flex-1 h-px bg-black" />
                            <span className="font-['Oswald',sans-serif] text-[10pt] font-black tracking-wider text-[var(--ink)] whitespace-nowrap">
                              {item.tituloCustom || "BIS / ENCORE"}
                            </span>
                            <div className="flex-1 h-px bg-black" />
                          </div>
                        );
                      } else {
                        return (
                          <div
                            key={item.id}
                            className="pl-9 py-0.5 text-[var(--ink)] font-sans text-[11pt] font-bold"
                          >
                            <span className="text-[var(--ink-2)]">****</span>{" "}
                            {(
                              item.tituloCustom ||
                              item.notas ||
                              (item as any).notaTema ||
                              item.tipoItem ||
                              "INTERLUDIO"
                            ).toUpperCase()}{" "}
                            <span className="text-[var(--ink-2)]">****</span>
                            {(item.notas || (item as any).notaTema) &&
                              item.tituloCustom && (
                                <span className="text-[10pt] text-[var(--ink-2)] font-normal italic ml-2">
                                  ({item.notas || (item as any).notaTema})
                                </span>
                              )}
                          </div>
                        );
                      }
                    }); // end map
                  })()}
                </div>
              </div>

              {/* Bottom Footer with BandManager & link */}
              {showAppBranding && (
                <div className="flex justify-between items-center pt-1 mt-2 font-sans text-[7.5pt] text-[var(--ink-2)]">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[var(--ink)]">
                      ⚡ BandManager
                    </span>
                    <span>•</span>
                    <a
                      href="https://www.bandmanager.app"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--ink)] font-bold underline"
                    >
                      www.bandmanager.app
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>
                      Hoja {previewPageIndex + 1} de {membersToExport.length} (
                      {currentPreviewMember.name})
                    </span>
                    <span>•</span>
                    <span>{new Date().toLocaleDateString("es-ES")}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Diálogo de decisión ambigua"1 hoja apretada vs varias hojas con letra ideal" (ver
 sizeChoiceDialog / EMERGENCY_TITLE_FONT_PT en handlePrint). Solo aparece cuando el
 auto-ajuste detecta ese caso límite real — nunca decide en nombre del usuario. */}
        {sizeChoiceDialog && (
          <div className="fixed inset-0 bg-[var(--scrim)]/80 flex items-center justify-center z-[10000] p-4">
            <div
              className={`rounded-[var(--r-l)] max-w-lg w-full p-6 ${"bg-[var(--surface)]"}`}
            >
              <h3
                className={`text-lg font-black mb-2 flex items-center gap-2 ${"text-[var(--ink)]"}`}
              >
                <Zap className="w-5 h-5 text-[var(--acc)]" />
                ¿Cómo prefieres el repertorio?
              </h3>
              <p className={`text-sm mb-5 ${"text-[var(--ink-2)]"}`}>
                El repertorio casi cabe en una sola hoja, pero necesitaría una
                letra algo más pequeña de lo recomendado para leerse cómodo en
                escena (~2m). Elige qué prefieres:
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setSizeChoiceDialog(null);
                    handlePrint("single");
                  }}
                  className="p-4 rounded-[var(--r-m)]  bg-[var(--acc)]/10 hover:bg-[var(--acc)]/20 text-left transition-colors cursor-pointer"
                >
                  <div
                    className={`font-black text-sm mb-1 ${"text-[var(--ink)]"}`}
                  >
                    📄 1 sola hoja (letra más pequeña)
                  </div>
                  <div className={`text-xs ${"text-[var(--ink-2)]"}`}>
                    {sizeChoiceDialog.singleTotalPages} hoja
                    {sizeChoiceDialog.singleTotalPages !== 1 ? "s" : ""} en
                    total — todo el repertorio de un vistazo
                  </div>
                </button>
                <button
                  onClick={() => {
                    setSizeChoiceDialog(null);
                    handlePrint("multi");
                  }}
                  className="p-4 rounded-[var(--r-m)]/40 bg-[var(--acc)]/10 hover:bg-[var(--acc)]/20 text-left transition-colors cursor-pointer"
                >
                  <div
                    className={`font-black text-sm mb-1 ${"text-[var(--ink)]"}`}
                  >
                    📄📄 Varias hojas (letra más grande)
                  </div>
                  <div className={`text-xs ${"text-[var(--ink-2)]"}`}>
                    {sizeChoiceDialog.multiTotalPages} hojas en total — letra al
                    tamaño ideal para leer desde ~2m
                  </div>
                </button>
              </div>
              <button
                onClick={() => setSizeChoiceDialog(null)}
                className={`mt-4 text-xs font-sans cursor-pointer ${"text-[var(--ink-2)] hover:text-[var(--ink-2)]"}`}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Edit Member Notes Modal if clicked from preview */}
        {editingSongForNotes && (
          <MemberNotesModal
            isOpen={Boolean(editingSongForNotes)}
            song={editingSongForNotes}
            colors={
              { card: "bg-[var(--surface)]", text: "text-[var(--ink)]" } as any
            }
            bandMembers={resolvedMembers}
            onClose={() => setEditingSongForNotes(null)}
            onSaveSongNotes={(updated) => {
              if (onUpdateSong) {
                onUpdateSong(updated);
              }
              setEditingSongForNotes(null);
            }}
          />
        )}
      </div>
    </ModalPortal>
  );
}
