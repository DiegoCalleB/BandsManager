import React, { useEffect, useRef, useState } from "react";
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
  Music,
  Sparkles,
  Image as ImageIcon,
  Sliders,
  Type,
  Palette,
  ShieldCheck,
  Zap,
  AlignLeft,
  AlignCenter,
  Columns2,
} from "lucide-react";
import { Setlist, Song, ThemeColors } from "../../types";
import { buildQrSvg } from "../../utils/qrSvg";
import {
  BandMemberOption,
  resolveBandMembers,
  getSongMemberNote,
  isSongMarkedForMember,
  isSongTonoMarkedForMember,
  isSongBpmMarkedForMember,
  withSongMarkedForMember,
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
  StackedFitResult,
} from "../../utils/textFit";
import {
  ItemKind,
  maxFontPtForWidth,
  planPages,
} from "../../utils/setlistPaginator";
import { escapeHtml } from "../../utils/escapeHtml";
import { apiFetch } from "../../utils/api";
import { mergePrintSettings, type PrintSettings } from "../../utils/printSettings";
import { cleanPrintedNote, cleanSetlistName, isAutoVersionNote } from "../../utils/setlistNoteText";
import { ShowIcon } from '../ui/ShowIcon';
import { Button, Select } from '../ui';

const ptToPx = (pt: number) => (pt * 96) / 72;

// Márgenes del @page. Antes 5mm/7mm (casi sin margen: el texto pegaba al borde y parecía una
// captura de pantalla); ahora los de una hoja maquetada a mano. Todo lo que depende de ellos
// (ancho de fila, alto útil, min-height de la hoja) sale de estas dos constantes.
const PAGE_MARGIN_X_MM = 14;
const PAGE_MARGIN_Y_MM = 9;
// 1mm de colchón de seguridad contra el redondeo del navegador (A4 = 210x297mm).
const PAGE_SHEET_HEIGHT_MM = 297 - 2 * PAGE_MARGIN_Y_MM - 1;
// Ancho de la hoja A4 disponible para contenido: 210mm - 2x margen horizontal del @page - el
// padding de 2px de .sheet-page a cada lado (ver handlePrint). Se usa tanto en el HTML de
// impresión real como en la vista previa en directo para decidir, fila a fila, si la nota cabe
// al lado del título o si esa fila concreta necesita caer a una línea propia debajo (ver
// textFit.ts).
const PAGE_CONTENT_WIDTH_PX = mmToPx(210 - 2 * PAGE_MARGIN_X_MM) - 4;
// Dos columnas: ancho de cada una = (ancho útil - separador) / 2. El separador son 29px: un filete
// de 1px con 14px de aire a cada lado.
// La nota general de la canción es secundaria: nunca más del 80 % del tamaño de las demás.
const GENERAL_NOTE_MAX_SCALE = 0.8;
const COLUMN_GUTTER_PX = 29;
const COLUMN_WIDTH_PX = (PAGE_CONTENT_WIDTH_PX - COLUMN_GUTTER_PX) / 2;
const MIN_USEFUL_RIGHT_LANE_PX = mmToPx(24);
// Hueco mínimo entre el título y la nota: pequeño a propósito — el efecto buscado es que la nota
// parezca escrita a mano justo pegada al título ya impreso, no maquetada como una columna aparte.
const ROW_GAP_PX = 5;

// Letra del título (pt) que usa el motor de maquetación (setlistPaginator.ts). MIN es el mínimo
// legible a ~2m de distancia de escenario; COMFORT, la letra a partir de la cual ya no merece la
// pena partir en más hojas; FLOOR, el último recurso si ni con el máximo de hojas cabe a MIN.
const MIN_TITLE_FONT_PT = 17;
const COMFORT_TITLE_FONT_PT = 17;
const FLOOR_TITLE_FONT_PT = 13;
// Con columnas en automático, solo a partir de aquí (un set corto no gana nada con dos columnas).
const AUTO_COLUMNS_MIN_SONGS = 14;
// Techo de diseño: más grande que esto, un título corto deja de parecer un setlist.
const MAX_DESIGN_TITLE_FONT_PT = 40;
// La nota manuscrita crece con el título, pero con tope: a 44pt de título una nota de 30pt
// competiría con él en vez de acompañarlo.
const deriveNoteFontPt = (titlePt: number) =>
  Math.min(20, Math.round(titlePt * (19 / 28) * 10) / 10);
const deriveSongNumFontPt = (titlePt: number) =>
  Math.round(titlePt * (22 / 28) * 10) / 10;

// Tipografías de la hoja impresa (Google Fonts). OJO: una web font no se descarga hasta que algo
// la usa, y `document.fonts.ready` resuelve ya si no hay nada pendiente — así que esperar solo a
// `ready` medía con la fuente de reserva (alturas ~10 % menores que las impresas, hojas que se
// desbordaban). Hay que pedir cada cara explícitamente con `fonts.load`.
const PRINT_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Anton&family=Caveat:wght@600;700&family=Permanent+Marker&family=Courier+Prime:wght@700&family=Oswald:wght@600;700;800&display=swap";
const PRINT_FONT_FACES = [
  "900 40px Anton",
  "700 40px Oswald",
  "800 40px Oswald",
  "600 40px Caveat",
  "700 40px Caveat",
  "40px 'Permanent Marker'",
  "700 40px 'Courier Prime'",
];

async function ensurePrintFonts(doc: Document): Promise<void> {
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

interface PrintDocument {
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
  // Modo centrado: la nota va SIEMPRE debajo del título, en su propia línea (al lado no tendría
  // eje al que alinearse). Salta directamente a'below' sin intentar'inline' primero.
  forceBelowMode?: boolean;
}

interface NoteLayoutResult {
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
function computeNoteLayout(input: NoteLayoutInput): NoteLayoutResult | null {
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

// El modal solo existe mientras está abierto: así sus hooks (estado, efectos de la vista previa)
// no necesitan convivir con un `return null` intermedio.
export function PdfExportModal(props: PdfExportModalProps) {
  if (!props.isOpen || !props.activeSetlist) return null;
  return <PdfExportModalBody {...props} activeSetlist={props.activeSetlist} />;
}

function PdfExportModalBody({
  isOpen,
  activeSetlist,
  activeSetlistMetrics,
  songs,
  bandMembers = [],
  bandName = "Tu Banda",
  bandLogoUrl = "",
  onClose,
  onUpdateSong,
}: PdfExportModalProps & { activeSetlist: Setlist }) {
  const resolvedMembers = resolveBandMembers(bandMembers);

  // Print mode:'all_members' |'single_member' |'master'
  const [printMode, setPrintMode] = useState<
    "all_members" | "single_member" | "master"
  >("all_members");
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    resolvedMembers[0]?.id || "member-1",
  );

  // Ajustes avanzados (letra manuscrita, tinta, badges de tonalidad/BPM/duración) van ocultos
  // detrás de este toggle SOLO en móvil (ver"sm:flex" más abajo, que los fuerza siempre visibles
  // en pantallas grandes) — en pantallas pequeñas todo junto agobiaba, tapando la vista previa.
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Columnas por hoja: con sets largos en pocas hojas, dos columnas permiten una letra bastante
  // mayor que una sola columna apretada (cada columna se llena de arriba abajo, en orden).
  const [columnsChoice, setColumnsChoice] = useState<"auto" | 1 | 2>("auto");

  // Design & Preset State
  const [stylePreset, setStylePreset] =
    useState<SetlistStylePreset>("rock_stage");
  // El tamaño real de impresión ya no se elige a mano: se auto-ajusta por hoja (ver
  // setlistPaginator.ts, usado en buildPrintDocument). La vista previa en pantalla no
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
  // Tono/BPM en todos los temas o solo en los que cada músico marca (los que le generan dudas).
  const [badgesScope, setBadgesScope] = useState<"all" | "marked">("all");
  const [markedSongs, setMarkedSongs] = useState<Record<string, string[]>>({});
  const [showMarksPanel, setShowMarksPanel] = useState(false);
  const [showSetlistNotes, setShowSetlistNotes] = useState<boolean>(true);
  // Notas generales de la canción (las del repertorio, no las del bolo ni las de cada músico).
  const [showGeneralNotes, setShowGeneralNotes] = useState<boolean>(true);
  const [showAppBranding, setShowAppBranding] = useState<boolean>(true);
  // Alineación del repertorio: "left" (clásico) o "center" (título, número y notas centrados en
  // la hoja, como muchos grupos montan el setlist del escenario). En centrado las notas van
  // siempre en su línea debajo del título (ver forceBelowMode) y sin flecha, que apuntaría a la
  // izquierda en el vacío.
  const [textAlign, setTextAlign] = useState<"left" | "center">("left");
  const isCentered = textAlign === "center";
  // Marca de agua: el logo del grupo, muy suave y detrás del repertorio. Va en gris y con
  // `multiply` para que se funda con el papel; si un logo con fondo oscuro marca su caja, se
  // apaga con el checkbox.
  const [showWatermark, setShowWatermark] = useState<boolean>(true);

  // Ajustes que se recuerdan POR BANDA (tabla band_print_settings, ver printSettings.ts): se cargan
  // al abrir el modal y se guardan, con debounce, cuando cambian. Las claves van en el mismo orden
  // que DEFAULT_PRINT_SETTINGS para que la comparación por JSON no dé falsos cambios.
  const currentPrintSettings: PrintSettings = {
    textAlign,
    columnsChoice,
    showGeneralNotes,
    showTonality,
    showBpm,
    showDuration,
    showBandLogo,
    showWatermark,
    showAppBranding,
    handwritingFont,
    handwritingColor,
    badgesScope,
    markedSongs,
  };
  const printSettingsKey = JSON.stringify(currentPrintSettings);
  // "off": no hay base de datos (desarrollo local) o falló la carga: se usa sin recordar nada.
  const [persist, setPersist] = useState<"loading" | "on" | "off">("loading");
  const [saveFailed, setSaveFailed] = useState(false);
  const lastSavedRef = useRef<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    apiFetch<{ settings: PrintSettings | null }>("/api/bands/print-settings")
      .then((r) => {
        if (cancelled) return;
        if (!r?.settings) {
          setPersist("off");
          return;
        }
        const s = mergePrintSettings(r.settings);
        setTextAlign(s.textAlign);
        setColumnsChoice(s.columnsChoice);
        setShowGeneralNotes(s.showGeneralNotes);
        setShowTonality(s.showTonality);
        setShowBpm(s.showBpm);
        setShowDuration(s.showDuration);
        setShowBandLogo(s.showBandLogo);
        setShowWatermark(s.showWatermark);
        setShowAppBranding(s.showAppBranding);
        setHandwritingFont(s.handwritingFont);
        setHandwritingColor(s.handwritingColor);
        setBadgesScope(s.badgesScope);
        setMarkedSongs(s.markedSongs);
        lastSavedRef.current = JSON.stringify(s);
        setPersist("on");
      })
      .catch(() => {
        if (!cancelled) setPersist("off");
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (persist !== "on" || printSettingsKey === lastSavedRef.current) return;
    const timer = setTimeout(async () => {
      try {
        const r = await apiFetch<{ success: boolean }>("/api/bands/print-settings", {
          method: "PUT",
          body: printSettingsKey,
        });
        if (r?.success) {
          lastSavedRef.current = printSettingsKey;
          setSaveFailed(false);
        } else {
          setSaveFailed(true);
        }
      } catch {
        setSaveFailed(true);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [persist, printSettingsKey]);

  // Preview Pagination
  const [previewPageIndex, setPreviewPageIndex] = useState<number>(0);

  // Quick edit note state
  const [editingSongForNotes, setEditingSongForNotes] = useState<Song | null>(
    null,
  );

  // Hojas por músico: "auto" deja decidir al motor (setlistPaginator.ts); 1-3 las impone el
  // usuario y el motor busca la letra más grande que quepa en ellas.
  const [pagesChoice, setPagesChoice] = useState<"auto" | 1 | 2 | 3>("auto");

  // Vista previa = el MISMO HTML que se imprime (buildPrintDocument), pintado en un iframe como
  // papel A4. Antes era una maqueta aparte que solo se parecía; ahora no puede divergir.
  const [previewDoc, setPreviewDoc] = useState<{
    html: string;
    layout: PrintDocument["layouts"][number] | null;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewHeightPx, setPreviewHeightPx] = useState<number>(
    Math.round(mmToPx(297)),
  );
  const [previewScale, setPreviewScale] = useState(1);
  const hasPreview = previewDoc !== null;
  const previewFrameRef = useRef<HTMLIFrameElement>(null);
  const previewBoxRef = useRef<HTMLDivElement>(null);
  // Marcas "ver tono/BPM" del músico en vista: viven en cada canción (notasPorMiembro.mostrarTono),
  // igual que cuando las pone el propio músico desde sus notas. markedSongs (ajustes de la banda)
  // solo se lee por compatibilidad con lo guardado antes.
  const isMarked = (song: Song) =>
    isSongMarkedForMember(song, currentPreviewMember.id, currentPreviewMember.name) ||
    (markedSongs[currentPreviewMember.id] ?? []).includes(song.id);
  const setMark = (song: Song, marked: boolean) => {
    // Un marcado antiguo (en ajustes) se retira de ahí para que desmarcar funcione de verdad.
    if (!marked && (markedSongs[currentPreviewMember.id] ?? []).includes(song.id)) {
      setMarkedSongs((m) => ({
        ...m,
        [currentPreviewMember.id]: (m[currentPreviewMember.id] ?? []).filter((id) => id !== song.id),
      }));
    }
    const next = withSongMarkedForMember(song, currentPreviewMember.id, currentPreviewMember.name, marked);
    if (next !== song) onUpdateSong?.(next);
  };
  const setAllMarks = (marked: boolean) => {
    activeSetlist.items.forEach((it) => {
      if (it.tipoItem !== "cancion" || !it.songId) return;
      const song = songs.find((x) => x.id === it.songId);
      if (song) setMark(song, marked);
    });
  };
  const markedCountForMember = () =>
    activeSetlist.items.filter((it) => {
      if (it.tipoItem !== "cancion" || !it.songId) return false;
      const song = songs.find((x) => x.id === it.songId);
      return !!song && isMarked(song);
    }).length;
  // Una clave con todo lo que cambia la maquetación (solo primitivos: `bandMembers` y los
  // arrays por defecto son objetos nuevos en cada render y dispararían el efecto sin parar).
  const previewKey = JSON.stringify([
    printMode,
    selectedMemberId,
    previewPageIndex,
    textAlign,
    columnsChoice,
    pagesChoice,
    handwritingFont,
    handwritingColor,
    showBandLogo,
    showSongNumbers,
    showTonality,
    showBpm,
    showDuration,
    badgesScope,
    markedSongs,
    showSetlistNotes,
    showGeneralNotes,
    showAppBranding,
    showWatermark,
    stylePreset,
    bandName,
    customLogoUrl,
    resolvedMembers.map((m) => `${m.id}|${m.name}|${m.instrument}`),
  ]);
  // El iframe avisa de su altura real y de los clics en un tema (editar su nota).
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== previewFrameRef.current?.contentWindow) return;
      const data = e.data as { type?: string; h?: number; id?: string } | null;
      if (data?.type === "bm-preview-height" && data.h && data.h > 0) {
        setPreviewHeightPx(Math.ceil(data.h));
      } else if (data?.type === "bm-edit-song" && data.id) {
        const song = songs.find((x) => x.id === data.id);
        if (song) setEditingSongForNotes(song);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [songs]);

  // Escala el A4 (210mm) al ancho disponible: en móvil se ve la hoja entera, no un trozo.
  useEffect(() => {
    const el = previewBoxRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const fit = () => {
      const free = el.clientWidth - 24;
      if (free > 0) setPreviewScale(Math.min(1, free / mmToPx(210)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isOpen, hasPreview]);


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
        return "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
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

  // Genera el HTML de impresión: mide cada fila en un iframe oculto, deja que setlistPaginator.ts
  // decida hojas, letra y cortes, y abre la ventana de impresión.
  const buildPrintDocument = async (opts: {
    members: typeof membersToExport;
    mode: "print" | "preview";
  }): Promise<PrintDocument | null> => {
    // Si el usuario imprime justo tras abrir el modal, las fuentes web (Anton/Oswald/Caveat) del
    // documento de la app podrían no haber terminado de cargar todavía — el canvas measurer de
    // abajo mediría con la fuente de reserva del sistema (más ancha), haciendo que el título
    //"parezca" ocupar más sitio del real y forzando el modo'below' o el truncado con más
    // frecuencia de la necesaria, lo que infla la altura calculada de cada fila.
    if (typeof document !== "undefined") {
      await ensurePrintFonts(document);
    }

    const measure = makeCanvasMeasurer();
    const noteMinFontSizePx = 11;
    const inkColor = getInkColorHex();
    const handFont = getHandwritingFontFamily();
    const titleFontFamily =
      stylePreset === "rock_stage"
        ? "'Anton', 'Oswald', sans-serif"
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
      cols: 1 | 2,
    ): string => {
      // Ancho real de una fila: toda la hoja o una columna.
      const rowWidthPx = cols === 2 ? COLUMN_WIDTH_PX : PAGE_CONTENT_WIDTH_PX;
      const titleFontSizePx = ptToPx(titleFontPt);
      const noteFontPt = deriveNoteFontPt(titleFontPt);
      const noteMaxFontSizePx = ptToPx(noteFontPt);
      const songNumFontSizePx = ptToPx(deriveSongNumFontPt(titleFontPt));
      // Bloques e interludios escalan con la letra del título: a 11pt de título un divisor de
      // 9pt fijo parecía más grande que las canciones.
      const auxFontPt = Math.max(7.5, Math.min(10, titleFontPt * 0.42));

      if (item.tipoItem === "cancion") {
        const s = songs.find((x) => x.id === item.songId);
        if (!s) return "";

        const memberNote = !isMaster
          ? cleanPrintedNote(getSongMemberNote(s, member.id, member.name))
          : "";
        const rawGeneralNote = s.notasRepertorio || s.notasInternas || "";
        // La nota general autogenerada al importar ("Versión Original: ...") repite el tono y los
        // BPM y no dice nada de cómo toca la banda el tema: no se imprime.
        const generalRepertorioNote =
          showGeneralNotes && !isAutoVersionNote(rawGeneralNote)
            ? cleanPrintedNote(rawGeneralNote)
            : "";
        const setlistNote = cleanPrintedNote((item as any).notaTema || item.notas || "");
        const numberText = showSongNumbers ? `${idx + 1}.` : "";
        // Tono/BPM/duración escalan con el título: a 14pt de título, unos badges de 11pt fijos
        // parecían casi tan grandes como la propia canción.
        const badgePt = Math.max(7.5, Math.min(12, titleFontPt * 0.5));
        // Con "solo marcados", tono y BPM salen únicamente en los temas que ese músico marcó.
        const legacyMarked = (markedSongs[member.id] ?? []).includes(s.id);
        const keyHere =
          showTonality &&
          (badgesScope === "all" || legacyMarked || isSongTonoMarkedForMember(s, member.id, member.name));
        const bpmHere =
          showBpm &&
          (badgesScope === "all" || legacyMarked || isSongBpmMarkedForMember(s, member.id, member.name));
        const badges: NoteLayoutBadge[] = [
          ...(keyHere && s.tonalidad
            ? [{ text: s.tonalidad, fontSizePx: ptToPx(badgePt + 1), extraWidthPx: 22 }]
            : []),
          ...(bpmHere && s.bpm
            ? [{ text: `${s.bpm} BPM`, fontSizePx: ptToPx(badgePt), extraWidthPx: 12 }]
            : []),
          ...(showDuration && s.duracion
            ? [{ text: s.duracion, fontSizePx: ptToPx(badgePt), extraWidthPx: 8 }]
            : []),
        ];
        const badgesHtml = [
          keyHere && s.tonalidad
            ? `<span class="tag-tonality" style="font-size:${badgePt + 1}pt;">${escapeHtml(s.tonalidad)}</span>`
            : "",
          bpmHere && s.bpm
            ? `<span class="tag-bpm" style="font-size:${badgePt}pt;">${escapeHtml(s.bpm)} BPM</span>`
            : "",
          showDuration && s.duracion
            ? `<span class="tag-dur" style="font-size:${badgePt}pt;">${escapeHtml(s.duracion)}</span>`
            : "",
        ].join("");

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
          rowWidthPx,
          measure,
          forceBelowMode: isCentered || cols === 2,
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
                    !isCentered &&
                    ((layout.mode === "below" && i === 0) ||
                      (layout.mode === "inline" &&
                        layout.fit.lines.length > 1 &&
                        i === layout.fit.lines.length - 1));
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
                  return `<div class="note-seg ${line.className}" style="font-size:${line.fontSizePx}px;display:flex;align-items:center;transform:${lineTransform};">${arrow}${escapeHtml(line.text)}</div>`;
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
            <div class="setlist-song-item" data-song-id="${s.id}">
              <div class="song-line">
                <div class="song-left">
                  ${numberText ? `<span class="song-num" style="font-size:${deriveSongNumFontPt(titleFontPt)}pt;">${numberText}</span>` : ""}
                  <span class="song-title" style="${titleStyle}">${escapeHtml(s.titulo.toUpperCase())}</span>
                  ${(isCentered || badgesScope === "marked") && badgesHtml ? `<span class="badges-inline">${badgesHtml}</span>` : ""}
                </div>
                ${layout && layout.mode === "inline" ? notesHtml : ""}
                ${!isCentered && badgesScope !== "marked" && badgesHtml ? `<div class="song-badges">${badgesHtml}</div>` : ""}
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
              <div class="block-title" style="font-size:${auxFontPt}pt;">${escapeHtml((item.tituloCustom || "BLOQUE").toUpperCase())}</div>
              <div class="divider-line"></div>
            </div>
          `;
      } else if (item.tipoItem === "bloque" && item.bloqueSubtipo === "bis") {
        return `
            <div class="bis-divider-item">
              <div class="divider-line"></div>
              <div class="bis-text" style="font-size:${auxFontPt}pt;">${escapeHtml((item.tituloCustom || "BIS / ENCORE").toUpperCase())}</div>
              <div class="divider-line"></div>
            </div>
          `;
      } else {
        return `
            <div class="interlude-item" style="font-size:${auxFontPt + 1}pt;">
              <span class="interlude-title">${escapeHtml((item.tituloCustom || item.notas || (item as any).notaTema || item.tipoItem || "INTERLUDIO").toUpperCase())}</span>
              ${
   (item.notas || (item as any).notaTema) && item.tituloCustom
     ? `
                <span class="interlude-note" style="font-size:${auxFontPt + 1.5}pt;">${escapeHtml(cleanPrintedNote(item.notas || (item as any).notaTema))}</span>
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
 margin: ${PAGE_MARGIN_Y_MM}mm ${PAGE_MARGIN_X_MM}mm;
 }
 * {
 box-sizing: border-box;
 }
 body {
 font-family: ${stylePreset === "rock_stage" ? "'Anton', 'Oswald', -apple-system, sans-serif" : stylePreset === "festival_bold" ? "'Oswald', sans-serif" : "-apple-system, BlinkMacSystemFont, sans-serif"};
 color: #000;
 background: #fff;
 margin: 0;
 padding: 0;
 -webkit-print-color-adjust: exact;
 print-color-adjust: exact;
 }
 .sheet-page {
 position: relative;
 /* isolation: la marca de agua (z-index:-1) debe quedar DETRÁS del contenido pero DELANTE del
 fondo blanco de la hoja; sin stacking context propio se colaba bajo el fondo y no se veía. */
 isolation: isolate;
 width: 100%;
 min-height: ${PAGE_SHEET_HEIGHT_MM}mm;
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
 opacity: 0.14;
 /* grayscale + multiply: el logo se funde con el papel en vez de pintar su caja. */
 filter: grayscale(100%);
 mix-blend-mode: multiply;
 /* Borde difuminado: un logo con fondo opaco no deja un rectángulo duro, se desvanece. */
 -webkit-mask-image: radial-gradient(closest-side, #000 55%, transparent 100%);
 mask-image: radial-gradient(closest-side, #000 55%, transparent 100%);
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
 border-bottom: 1px solid #000;
 padding-bottom: 3px;
 margin-bottom: 5px;
 gap: 12px;
 }
 /* Cabecera centrada y COMPACTA: el logo a un lado del nombre del grupo y del repertorio
 (como una sola pieza centrada) y la copia del músico en una línea fina debajo. Apilar logo,
 nombre, repertorio y músico ocupaba ~115px, un 11 % de la hoja. */
 .page-header.is-centered {
 flex-flow: row wrap;
 justify-content: center;
 gap: 2px 14px;
 padding-bottom: 3px;
 margin-bottom: 5px;
 text-align: center;
 }
 .is-centered .header-left {
 flex-direction: row;
 justify-content: center;
 gap: 10px;
 }
 .is-centered .band-text-block {
 align-items: center;
 text-align: center;
 }
 .is-centered .band-logo-img {
 height: 24px;
 max-width: 80px;
 }
 .is-centered .header-right {
 text-align: center;
 }
 .is-centered .tag-name {
 font-size: 9pt;
 }
 .header-left {
 display: flex;
 align-items: center;
 gap: 8px;
 }
 /* Alto fijo (height), NO max-height: un logo remoto aún sin cargar al MEDIR la hoja contaba como
 0px de alto y luego, ya cargado, empujaba la última canción a una hoja extra. */
 .band-logo-img {
 height: 24px;
 width: auto;
 max-width: 80px;
 object-fit: contain;
 filter: grayscale(100%) contrast(150%);
 }
 .band-text-block {
 display: flex;
 flex-direction: row;
 align-items: baseline;
 gap: 10px;
 min-width: 0;
 }
 .band-heading {
 font-family:'Anton','Oswald', sans-serif;
 font-size: 14pt;
 line-height: 1.1;
 margin: 0;
 letter-spacing: 0.5px;
 white-space: nowrap;
 color: #000;
 }
 /* Solo el nombre del repertorio, en una línea simple — sin badge ni duración/nº de
 temas, que era ruido que no aportaba nada al músico leyendo desde el escenario. */
 .setlist-meta {
 font-family:'Oswald', sans-serif;
 font-size: 9pt;
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
 display: flex;
 align-items: baseline;
 justify-content: flex-end;
 gap: 6px;
 padding: 0;
 background: #fff;
 white-space: nowrap;
 }
 .tag-title {
 font-family:'Oswald', sans-serif;
 font-size: 5.5pt;
 font-weight: 700;
 color: #555;
 letter-spacing: 0.8px;
 }
 .tag-name {
 font-family:'Anton','Oswald', sans-serif;
 font-size: 10pt;
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
 /* Centrado vertical en el hueco entre cabecera y pie: con pocos temas el repertorio queda
 en medio de la hoja en vez de pegado arriba con un tercio de papel en blanco debajo. Si la
 hoja va llena no tiene efecto (no hay hueco que repartir). */
 justify-content: center;
 /* gap:0 a propósito: con 30+ canciones, cada px de gap se multiplica por el nº de
 filas — es lo que más margen aporta para caber en menos hojas (ver ROW_GAP_PX y
 line-height de .song-title, mismo motivo). */
 gap: 0px;
 }

 .setlist-song-item {
 padding: 3px 0;
 /* Red de seguridad de impresión: nuestro propio reparto por páginas (ver
 setlistPaginator.ts) es quien decide qué canción va en qué hoja, así que en el caso
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
 según el motor de maquetación (ver setlistPaginator.ts). */
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
 font-family: ${stylePreset === "rock_stage" ? "'Anton', 'Oswald', sans-serif" : "'Oswald', sans-serif"};
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
 /* Tono y BPM en columna a la derecha (modo izquierda): alineados fila a fila como una tabla,
 no pegados al final de cada título a una distancia distinta. */
 .song-badges {
 margin-left: auto;
 display: flex;
 align-items: baseline;
 justify-content: flex-end;
 gap: 12px;
 padding-left: 12px;
 flex-shrink: 0;
 }
 .song-badges .tag-tonality { min-width: 2.2em; text-align: right; }
 .song-badges .tag-bpm { min-width: 4.4em; text-align: right; }
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
 gap: 2px;
 padding-left: ${showSongNumbers ? "40px" : "6px"};
 margin-top: -10px;
 line-height: 1;
 }
 .note-seg {
 /* overflow:visible a propósito: el texto nunca se trunca (ver textFit.ts). Cada nota
 lleva su propio tamaño. Al lado del título (modo inline) se acepta solo si cabe en una
 línea (nowrap); debajo, si ni al tamaño mínimo legible cabe, baja a una segunda línea
 en vez de encogerse hasta ser ilegible (ver .song-notes-below .note-seg). */
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
 margin: 6px 0;
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
 font-family:'Oswald', sans-serif;
 font-size: 10pt;
 font-weight: 700;
 color: #222;
 padding: 0px 0 0px ${showSongNumbers ? "40px" : "6px"};
 letter-spacing: 0.5px;
 break-inside: avoid;
 page-break-inside: avoid;
 }
 .interlude-title {
 font-weight: 800;
 letter-spacing: 1.5px;
 }
 /* La nota del interludio va en su propia línea, a mano como el resto de notas, y nunca pasa
 de una línea (elipsis): antes salía en monoespaciada y partida en dos. */
 .interlude-note {
 display: block;
 font-size: 11pt;
 font-family: ${handFont};
 font-weight: 600;
 color: #555;
 letter-spacing: 0.2px;
 white-space: nowrap;
 overflow: hidden;
 text-overflow: ellipsis;
 }

 /* Footer */
 /* padding/margin reducidos por el mismo motivo que el header: más espacio libre
 para las canciones. */
 .page-footer {
 display: flex;
 justify-content: space-between;
 align-items: center;
 border-top: 1px solid #000;
 padding-top: 0;
 margin-top: 1px;
 line-height: 1.1;
 font-family: monospace;
 font-size: 6pt;
 color: #444;
 }
 .footer-left {
 display: flex;
 align-items: center;
 gap: 6px;
 }
 .footer-qr { display: inline-flex; line-height: 0; }
 .footer-qr svg { display: block; }
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

 /* Repertorio centrado: número + título en el eje de la hoja, notas debajo también centradas
 (siempre en modo "below", ver forceBelowMode), interludios sin sangría. */
 .is-centered .song-line {
 justify-content: center;
 }
 /* Centrado: número + título como un solo texto en línea. Si el título baja a dos líneas,
 el número se queda pegado a la primera en vez de quedar suelto en el margen. */
 .is-centered .song-left {
 display: block;
 text-align: center;
 overflow: visible;
 }
 .is-centered .song-num {
 display: inline-block;
 min-width: 0;
 margin-right: 8px;
 }
 .is-centered .song-title {
 display: inline;
 white-space: normal;
 overflow: visible;
 text-overflow: clip;
 }
 /* Tono/BPM juntos y sin partirse: si no caben tras el título, bajan como un solo bloque. */
 .badges-inline {
 display: inline-block;
 white-space: nowrap;
 margin-left: 10px;
 }
 .song-left > .badges-inline { flex-shrink: 0; margin-left: 4px; }
 .badges-inline > span + span {
 margin-left: 8px;
 }
 .is-centered .song-notes-below {
 padding-left: 0;
 align-items: center;
 margin-top: -2px;
 }
 .song-notes-below .note-seg {
 white-space: normal;
 line-height: 1.15;
 }
 .is-centered .song-notes-below .note-seg {
 /* sin la inclinación manuscrita no se montan sobre el título ni sobre la fila siguiente */
 transform: none !important;
 }
 .is-centered .interlude-item {
 padding-top: 2px;
 padding-bottom: 2px;
 }
 .page-header.is-centered .band-heading {
 font-size: 15pt;
 letter-spacing: 1px;
 }
 .page-header.is-centered .setlist-meta {
 font-size: 9pt;
 letter-spacing: 0.5px;
 margin-top: 0;
 }
 .is-centered .interlude-item {
 padding-left: 0;
 text-align: center;
 }
 /* Dos columnas: el bloque entero se centra en vertical y las columnas arrancan alineadas
 arriba; un filete fino las separa. */
 .setlist-columns {
 flex: 1;
 display: flex;
 flex-direction: column;
 justify-content: center;
 }
 .setlist-columns-row {
 display: flex;
 align-items: flex-start;
 justify-content: center;
 }
 .setlist-columns-row .setlist-items-container {
 flex: none;
 justify-content: flex-start;
 }
 /* En columna, una nota que ni encogida al mínimo cabe en una línea baja a una segunda en vez de
 salirse hacia el filete o el margen (la fila se mide ya con ese alto). */
 .in-columns .song-notes-below {
 margin-top: -2px;
 }
 .in-columns .note-seg {
 white-space: normal;
 line-height: 1.05;
 }
 .is-centered .note-seg {
 text-align: center;
 }
 .col-divider {
 align-self: stretch;
 width: 1px;
 margin: 0 14px;
 background: #bdbdbd;
 }
 .page-footer.is-centered {
 justify-content: center;
 gap: 14px;
 }
 `;

    // Header/footer de cada hoja: independientes de cuántas páginas necesite el repertorio en
    // sí (el footer sí necesita el número de página final, se rellena tras calcular el plan).
    const buildHeaderHtml = (
      member: (typeof membersToExport)[number],
      isMaster: boolean,
    ): string => `
        <div class="page-header ${isCentered ? "is-centered" : ""}">
          <div class="header-left">
            ${
   showBandLogo && customLogoUrl
     ? `
              <img src="${escapeHtml(customLogoUrl)}" alt="${escapeHtml(bandName)}" class="band-logo-img" onerror="this.style.display='none'" />
            `
     : ""
 }
 <div class="band-text-block">
 <h1 class="band-heading">${escapeHtml(bandName.toUpperCase())}</h1>
              <div class="setlist-meta">${escapeHtml(cleanSetlistName(activeSetlist.nombre).toUpperCase())}</div>
            </div>
          </div>

          <div class="header-right">
            <div class="member-stage-tag">
              <div class="tag-title">${!isMaster ? "COPIA PARA MÚSICO" : "COPIA CONTROL"}</div>
              <div class="tag-name">${escapeHtml(member.name.toUpperCase())}</div>
              <div class="tag-instrument">${escapeHtml(member.instrument.toUpperCase())}</div>
            </div>
          </div>
        </div>
      `;

    // El mismo SVG en todas las hojas: se genera una vez por documento.
    const footerQrSvg = showAppBranding ? buildQrSvg("https://bandmanager.io/?utm_source=setlist&utm_medium=qr", 11) : "";

    const buildFooterHtml = (
      member: (typeof membersToExport)[number],
      pageNum: number,
      totalPages: number,
    ): string =>
      showAppBranding && pageNum < totalPages
        ? // Hojas intermedias: solo numeración, el QR y la marca van en la última hoja de cada copia.
          `
        <div class="page-footer ${isCentered ? "is-centered" : ""}">
          <div class="footer-left"></div>
          <div class="footer-right">
            <span>Hoja ${pageNum} de ${totalPages} (${escapeHtml(member.name)})</span>
          </div>
        </div>
      `
        : showAppBranding
        ? `
        <div class="page-footer ${isCentered ? "is-centered" : ""}">
          <div class="footer-left">
            <span class="footer-qr">${footerQrSvg}</span>
            <span class="app-logo-badge">⚡ BandManager</span>
            <span class="footer-sep">•</span>
            <a href="https://bandmanager.io" target="_blank" class="app-link">bandmanager.io</a>
          </div>
          <div class="footer-right">
            <span>Hoja ${pageNum} de ${totalPages} (${escapeHtml(member.name)})</span>
            <span class="footer-sep">•</span>
            <span>${new Date().toLocaleDateString("es-ES")}</span>
          </div>
        </div>
      `
        : "";

    // Maquetación (ver setlistPaginator.ts): mide la altura REAL del contenido en un iframe
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
      return null;
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
            <link id="measure-fonts-link" href="${PRINT_FONTS_URL}" rel="stylesheet">
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
    await ensurePrintFonts(measureDoc);
    const measureTarget = measureDoc.getElementById("measure-target");

    const measureHtmlHeightPx = (bodyHtml: string): number => {
      if (!measureTarget) return 0;
      measureTarget.innerHTML = bodyHtml;
      const el = measureTarget.firstElementChild as HTMLElement | null;
      return el ? el.getBoundingClientRect().height : 0;
    };

    // Alto total de la hoja menos su padding (2px arriba + 2px abajo): el alto útil real de cada
    // miembro sale de restarle su cabecera y su pie medidos.
    const PAGE_TOTAL_HEIGHT_PX = mmToPx(PAGE_SHEET_HEIGHT_MM) - 4;

    // Motor de maquetación (setlistPaginator.ts): reparte TODOS los items (canciones, bloques e
    // interludios), no solo canciones, así que un encabezado nunca se pierde en un corte.
    const items = activeSetlist.items;
    const itemKinds: ItemKind[] = items.map((it) =>
      it.tipoItem === "cancion"
        ? "song"
        : it.tipoItem === "bloque" && it.bloqueSubtipo === "header"
          ? "header"
          : it.tipoItem === "bloque" && it.bloqueSubtipo === "bis"
            ? "bis"
            : "other",
    );
    let songCounter = 0;
    const songNumberByItem = items.map((it) =>
      it.tipoItem === "cancion" ? songCounter++ : -1,
    );
    // Techo de letra por anchura: los títulos (con su número) deben caber en una línea... salvo los
    // más largos. Un solo "THE HOUSE OF THE RISING SON // A WHITER SHADE OF PALE" no puede hundir
    // la letra de las otras 24 canciones: se ignora el ~10 % más ancho (y un atípico claro), que
    // baja a dos líneas; esa altura extra la mide el motor como cualquier otra fila.
    const titleWidthsAt100 = items
      .map((it) => {
        const s = it.tipoItem === "cancion" ? songs.find((x) => x.id === it.songId) : undefined;
        return s ? measure(s.titulo.toUpperCase(), 100, titleFontFamily, 900) : 0;
      })
      .sort((a, b) => b - a);
    const outliersToSkip = Math.min(
      Math.max(0, titleWidthsAt100.length - 1),
      Math.floor(titleWidthsAt100.length * 0.1) +
        (titleWidthsAt100.length > 1 && titleWidthsAt100[0] > 1.3 * titleWidthsAt100[1] ? 1 : 0),
    );
    const widestTitleAt100 = titleWidthsAt100[outliersToSkip] ?? 0;
    const numberAt100 = showSongNumbers
      ? measure(`${songCounter}.`, 100 * (22 / 28), "Oswald, sans-serif", 800)
      : 0;
    // Ancho que se llevan tono/BPM/duración en su columna de la derecha (modo izquierda).
    const badgesReservePx =
      (showTonality ? 34 : 0) + (showBpm ? 74 : 0) + (showDuration ? 46 : 0) + (showTonality || showBpm || showDuration ? 14 : 0);
    const maxFontFor = (cols: 1 | 2) =>
      Math.min(
        MAX_DESIGN_TITLE_FONT_PT,
        maxFontPtForWidth(
          widestTitleAt100 + numberAt100,
          (cols === 2 ? COLUMN_WIDTH_PX : PAGE_CONTENT_WIDTH_PX) * 0.96 - badgesReservePx,
        ),
      );
    // `in-columns` va en la propia fila medida: las reglas que cambian la altura no pueden colgar
    // de un ancestro que el iframe de medición no tiene.
    const containerClassFor = (cols: 1 | 2) =>
      `setlist-items-container ${isCentered ? "is-centered" : ""} ${cols === 2 ? "in-columns" : ""}`;

    const memberPlans = opts.members.map((member) => {
      const isMaster = member.id === "master";
      const headerHeightPx = measureHtmlHeightPx(
        `<div style="width:${PAGE_CONTENT_WIDTH_PX}px;display:flow-root">${buildHeaderHtml(member, isMaster)}</div>`,
      );
      // El texto exacto del pie ("Hoja X de Y") no cambia su alto, basta con relleno.
      const footerHeightPx = showAppBranding
        ? measureHtmlHeightPx(
            `<div style="width:${PAGE_CONTENT_WIDTH_PX}px;display:flow-root">${buildFooterHtml(member, 1, 1)}</div>`,
          )
        : 0;
      // 6px de colchón: el redondeo de subpíxel de la impresión no debe empujar una fila fuera.
      const pageAvailableHeightPx =
        PAGE_TOTAL_HEIGHT_PX - headerHeightPx - footerHeightPx - 6;

      const heightsAtFor = (cols: 1 | 2) => (titleFontPt: number) =>
        items.map((item, i) =>
          measureHtmlHeightPx(
            `<div class="${containerClassFor(cols)}" style="width:${cols === 2 ? COLUMN_WIDTH_PX : PAGE_CONTENT_WIDTH_PX}px">${buildRowHtml(item, songNumberByItem[i], titleFontPt, member, isMaster, cols)}</div>`,
          ),
        );
      const planFor = (cols: 1 | 2, forcedPages?: number) =>
        planPages({
          kinds: itemKinds,
          heightsAt: heightsAtFor(cols),
          availableHeightPx: pageAvailableHeightPx,
          minFontPt: MIN_TITLE_FONT_PT,
          comfortFontPt: COMFORT_TITLE_FONT_PT,
          columns: cols,
          maxFontPt: maxFontFor(cols),
          floorFontPt: FLOOR_TITLE_FONT_PT,
          forcedPages,
        });
      // 1 o 2 columnas. En automático, 2 columnas solo si el set es largo y aportan algo claro:
      // menos hojas con letra legible, o las mismas hojas con letra bastante mayor.
      const resolveLayout = (forcedPages?: number): { cols: 1 | 2; plan: ReturnType<typeof planFor> } => {
        if (columnsChoice === 1 || columnsChoice === 2) {
          return { cols: columnsChoice, plan: planFor(columnsChoice, forcedPages) };
        }
        const one = planFor(1, forcedPages);
        if (songCounter < AUTO_COLUMNS_MIN_SONGS) return { cols: 1, plan: one };
        const two = planFor(2, forcedPages);
        const better =
          (two.pages.length < one.pages.length && two.fontPt >= MIN_TITLE_FONT_PT + 2) ||
          (two.pages.length === one.pages.length && two.fontPt >= one.fontPt + 3);
        return better ? { cols: 2, plan: two } : { cols: 1, plan: one };
      };
      const forcedPages = pagesChoice === "auto" ? undefined : pagesChoice;
      const { cols, plan } = resolveLayout(forcedPages);
      // Para la etiqueta "Auto (N páginas)" del selector: cuántas hojas elegiría el motor solo.
      const autoPages =
        opts.mode === "preview" && forcedPages
          ? resolveLayout().plan.pages.length
          : plan.pages.length;
      // Con las columnas fijadas por el usuario y letra pequeña, se calcula la otra opción para
      // poder sugerirla en el modal ("con 2 columnas: 18 pt"). Solo en la vista previa.
      let alt: { cols: 1 | 2; fontPt: number; pages: number } | undefined;
      if (opts.mode === "preview" && (columnsChoice === 1 || columnsChoice === 2) && plan.fontPt < MIN_TITLE_FONT_PT) {
        const otherCols: 1 | 2 = columnsChoice === 1 ? 2 : 1;
        const other = planFor(otherCols, forcedPages);
        alt = { cols: otherCols, fontPt: other.fontPt, pages: other.pages.length };
      }
      return { member, isMaster, plan, cols, autoPages, alt };
    });

    document.body.removeChild(measureFrame);

    const totalSheets = memberPlans.reduce((sum, mp) => sum + mp.plan.pages.length, 0);

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
    const watermarkInnerHtml =
      showBandLogo && absoluteLogoUrl
        ? `<img src="${escapeHtml(absoluteLogoUrl)}" alt="" class="page-watermark-logo" data-fallback="${escapeHtml(bandName.toUpperCase())}" onerror="var d=document.createElement('div');d.className='page-watermark-text';d.textContent=this.dataset.fallback;this.parentElement.replaceChildren(d)" />`
        : `<div class="page-watermark-text">${escapeHtml(bandName.toUpperCase())}</div>`;

    let sheetIdx = 0;
    const pagesHtml = memberPlans
      .map(({ member, isMaster, plan, cols }) =>
        plan.pages
          .map((page, pageIdx) => {
            sheetIdx++;
            const columnHtml = (col: { from: number; to: number; rowGapPx: number }, widthPx?: number) => `
                  <div class="${containerClassFor(cols)}" style="${widthPx ? `width:${widthPx}px;` : ""}gap:${col.rowGapPx.toFixed(1)}px">
                    ${items
                      .slice(col.from, col.to)
                      .map((item, k) =>
                        buildRowHtml(item, songNumberByItem[col.from + k], plan.fontPt, member, isMaster, cols),
                      )
                      .join("")}
                  </div>`;
            const bodyHtml =
              page.columns.length > 1
                ? `<div class="setlist-columns"><div class="setlist-columns-row">${page.columns
                    .map((col) => columnHtml(col, COLUMN_WIDTH_PX))
                    .join('<div class="col-divider"></div>')}</div></div>`
                : columnHtml(page.columns[0]);
            return `
                <div class="sheet-page ${sheetIdx !== totalSheets ? "page-break" : ""}">
                  ${showWatermark ? `<div class="page-watermark">${watermarkInnerHtml}</div>` : ""}
                  ${buildHeaderHtml(member, isMaster)}
                  ${bodyHtml}
                  ${buildFooterHtml(member, pageIdx + 1, plan.pages.length)}
                </div>
              `;
          })
          .join(""),
      )
      .join("");

    // Script de la ventana de impresión: espera a que las fuentes estén cargadas antes de
    // llamar a window.print() (si no, imprimiría con la fuente de reserva, más ancha).
    const printScript = `
 <script>
 window.onload = () => {
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
 </script>`;

    // Vista previa: las MISMAS hojas que se imprimen, pintadas como papel A4 (el margen del
    // @page se simula con un borde blanco). Al hacer clic en un tema se avisa al modal para
    // editar su nota, y se informa de la altura para que el marco no necesite scroll interno.
    const previewCss = `
 @media screen {
 html { background: #d4d4d8; }
 body { margin: 0; padding: 16px 0 1px; }
 .sheet-page {
 box-sizing: content-box;
 width: calc(${210 - 2 * PAGE_MARGIN_X_MM}mm - 4px);
 min-height: calc(${PAGE_SHEET_HEIGHT_MM}mm - 4px);
 padding: 2px;
 border: solid #fff;
 border-width: ${PAGE_MARGIN_Y_MM}mm ${PAGE_MARGIN_X_MM}mm;
 background: #fff;
 margin: 0 auto 18px;
 box-shadow: 0 1px 3px rgba(0,0,0,.25), 0 8px 24px rgba(0,0,0,.12);
 }
 [data-song-id] { cursor: pointer; border-radius: 4px; }
 [data-song-id]:hover { background: rgba(242, 202, 80, .2); }
 }`;
    const previewScript = `
 <script>
 (function () {
 var send = function () {
 parent.postMessage({ type: "bm-preview-height", h: document.documentElement.scrollHeight }, "*");
 };
 window.addEventListener("load", send);
 if (document.fonts && document.fonts.ready) document.fonts.ready.then(send);
 document.addEventListener("click", function (e) {
 var el = e.target && e.target.closest ? e.target.closest("[data-song-id]") : null;
 if (el) parent.postMessage({ type: "bm-edit-song", id: el.getAttribute("data-song-id") }, "*");
 });
 })();
 </script>`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${escapeHtml(bandName)} - Setlist ${escapeHtml(cleanSetlistName(activeSetlist.nombre))}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Anton&family=Caveat:wght@600;700&family=Permanent+Marker&family=Courier+Prime:wght@700&family=Oswald:wght@600;700;800&display=swap" rel="stylesheet">
          <style>${printCss}${opts.mode === "preview" ? previewCss : ""}</style>
        </head>
        <body>
          ${pagesHtml}
          ${opts.mode === "preview" ? previewScript : printScript}
</body>
</html>`;
    return {
      html,
      layouts: memberPlans.map(({ member, plan, autoPages, alt }) => ({
        memberId: member.id,
        pages: plan.pages.length,
        fontPt: plan.fontPt,
        autoPages,
        alt,
      })),
    };
  };

  const handlePrint = async (onlyMember?: (typeof membersToExport)[number]) => {
    // La ventana se abre YA, dentro del gesto del usuario: si se abre después de maquetar (varios
    // `await` más tarde) Chrome móvil la bloquea como ventana emergente.
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Tu navegador ha bloqueado la ventana de impresión. Permite las ventanas emergentes para bandmanager.io y vuelve a pulsar Imprimir.");
      return;
    }
    printWindow.document.write(
      '<!DOCTYPE html><meta charset="utf-8"><title>Preparando setlist…</title><body style="font-family:sans-serif;color:#555;display:grid;place-items:center;height:100vh;margin:0">Maquetando el setlist…</body>',
    );
    try {
      const doc = await buildPrintDocument({ members: onlyMember ? [onlyMember] : membersToExport, mode: "print" });
      if (!doc) {
        printWindow.close();
        return;
      }
      printWindow.document.open();
      printWindow.document.write(doc.html);
      printWindow.document.close();
    } catch (err) {
      console.error("Impresión del setlist:", err);
      printWindow.close();
    }
  };

  // Preview page member
  const currentPreviewMember =
    membersToExport[previewPageIndex] || membersToExport[0];

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const member = currentPreviewMember;
      if (!member) return;
      setPreviewLoading(true);
      try {
        const doc = await buildPrintDocument({ members: [member], mode: "preview" });
        if (!cancelled && doc) {
          setPreviewDoc({ html: doc.html, layout: doc.layouts[0] ?? null });
        }
      } catch (err) {
        console.error("Vista previa del setlist:", err);
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // buildPrintDocument y currentPreviewMember se recrean en cada render: lo que de verdad
    // cambia la maquetación está en previewKey (y en el repertorio/canciones).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewKey, activeSetlist, songs]);


  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 bg-[var(--scrim)]/90 flex items-center justify-center p-2 sm:p-4 z-[9999] overflow-y-auto overscroll-contain">
        <div
          className={`w-full max-w-7xl sm:max-h-[96vh] my-auto flex flex-col rounded-[var(--r-l)] sm:overflow-hidden ${"bg-[var(--surface)]"}`}
        >
          {/* Modal Top Header — recortado a lo esencial en móvil (badge decorativo e info extra
 ocultos: ver hidden/sm:inline-block y sm:block más abajo) para que en pantallas
 pequeñas no compita por espacio con los controles y la vista previa, que son lo que
 de verdad hace falta ver de un vistazo. */}
          <div
            className={`p-3 sm:p-3.5 sm:px-6 flex items-center justify-between gap-2 sm:gap-3 shrink-0 max-sm:sticky max-sm:top-0 max-sm:z-10 ${"bg-[var(--sunken)]"}`}
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="hidden sm:flex p-2.5 rounded-[var(--r-m)] bg-[var(--acc)]/15 text-[var(--ink)] shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-sm sm:text-lg text-[var(--ink)] truncate">
                    Generador de repertorios
                  </h3>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded text-micro font-bold font-sans bg-[var(--surface)] text-[var(--ink)] shrink-0">
                    Rock stage edition
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
                className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-[var(--r-pill)] font-sans text-xs font-bold transition-ui flex items-center gap-1.5 sm:gap-2 cursor-pointer bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink)] active:scale-[0.97]/20"
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
              {/* Solo la hoja del músico en vista (con SUS temas marcados): para mandársela o guardar su PDF. */}
              {membersToExport.length > 1 && currentPreviewMember && (
                <button
                  onClick={() => handlePrint(currentPreviewMember)}
                  title={`Imprimir o guardar en PDF solo la hoja de ${currentPreviewMember.name}`}
                  className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-[var(--r-pill)] font-sans text-xs font-bold transition-ui flex items-center gap-1.5 cursor-pointer bg-[var(--surface)] text-[var(--ink)] active:scale-[0.97]"
                >
                  <Printer className="w-4 h-4" />
                  <span className="max-w-[9rem] truncate">Solo {currentPreviewMember.name}</span>
                </button>
              )}
              <Button variant="ghost" size="sm" aria-label="Cerrar"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Customization Control Panel */}
          <div
            className={`p-3 sm:px-6 flex flex-col gap-3 text-xs font-sans shrink-0 ${"bg-[var(--sunken)]"}`}
          >
            {/* Row 1: Mode & Target Selector — en móvil un selector compacto (los 3 botones en
 fila no cabían sin apretarse); en desktop, los botones de siempre, más cómodos con
 mouse y con espacio de sobra en pantallas grandes. */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Select
                size="sm"
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
                wrapperClassName="flex-1 min-w-0"
              >
                <option value="all_members">
                  Todos los Músicos ({resolvedMembers.length} hojas)
                </option>
                <option value="single_member">1 Músico específico</option>
                <option value="master">Master escenario / sonido</option>
              </Select>

              <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-[var(--r-m)] bg-[var(--surface)]">
                <Button
                  variant={printMode === "all_members" ? "neutral" : "ghost"}
                  size="xs"
                  onClick={() => {
                    setPrintMode("all_members");
                    setPreviewPageIndex(0);
                  }}
                  className="items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" /> Todos los Músicos (
                  {resolvedMembers.length} hojas individuales)
                </Button>
                <Button
                  variant={printMode === "single_member" ? "neutral" : "ghost"}
                  size="xs"
                  onClick={() => {
                    setPrintMode("single_member");
                    setPreviewPageIndex(0);
                  }}
                  className="items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5" /> 1 Músico específico
                </Button>
                <Button
                  variant={printMode === "master" ? "neutral" : "ghost"}
                  size="xs"
                  onClick={() => {
                    setPrintMode("master");
                    setPreviewPageIndex(0);
                  }}
                  className="items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" /> Master escenario / sonido
                </Button>
              </div>

              {/* Single member picker */}
              {printMode === "single_member" && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="hidden sm:inline text-[var(--ink-2)] font-bold">
                    Músico:
                  </span>
                  <Select
                    size="sm"
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    wrapperClassName="flex-1 sm:flex-none min-w-0"
                  >
                    {resolvedMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.instrument})
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              {/* Columnas: automático (2 solo en sets largos si aportan), 1 o 2. */}
              <div className="flex items-center gap-1.5 p-1 rounded-[var(--r-m)] bg-[var(--surface)]">
                <Button
                  variant={columnsChoice === "auto" ? "neutral" : "ghost"}
                  size="xs"
                  onClick={() => setColumnsChoice("auto")}
                  className="items-center gap-1.5"
                  title="El motor usa 2 columnas solo cuando el set es largo y así gana letra o ahorra hojas"
                >
                  Columnas auto
                </Button>
                <Button
                  variant={columnsChoice === 1 ? "neutral" : "ghost"}
                  size="xs"
                  onClick={() => setColumnsChoice(1)}
                  className="items-center gap-1.5"
                  title="Una columna de temas"
                >
                  1
                </Button>
                <Button
                  variant={columnsChoice === 2 ? "neutral" : "ghost"}
                  size="xs"
                  onClick={() => setColumnsChoice(2)}
                  className="items-center gap-1.5"
                  title="Dos columnas: cabe más repertorio por hoja con letra mayor (las notas pasan debajo del título)"
                >
                  <Columns2 className="w-3.5 h-3.5" />2
                </Button>
              </div>

              {/* Alineación del texto en la hoja: izquierda (clásico) o centrado. */}
              <div className="flex items-center gap-1.5 p-1 rounded-[var(--r-m)] bg-[var(--surface)]">
                <Button
                  variant={textAlign === "left" ? "neutral" : "ghost"}
                  size="xs"
                  onClick={() => setTextAlign("left")}
                  className="items-center gap-1.5"
                  title="Títulos alineados a la izquierda, notas a su lado"
                >
                  <AlignLeft className="w-3.5 h-3.5" />Izquierda
                </Button>
                <Button
                  variant={textAlign === "center" ? "neutral" : "ghost"}
                  size="xs"
                  onClick={() => setTextAlign("center")}
                  className="items-center gap-1.5"
                  title="Títulos, números y notas centrados en la hoja"
                >
                  <AlignCenter className="w-3.5 h-3.5" />Centrado
                </Button>
              </div>

              {/* Hojas por músico: automático (con el nº que elige el motor) o impuestas. */}
              <div className="flex items-center gap-2">
                <Select
                  size="sm"
                  aria-label="Número de hojas"
                  value={String(pagesChoice)}
                  onChange={(e) =>
                    setPagesChoice(
                      e.target.value === "auto"
                        ? "auto"
                        : (Number(e.target.value) as 1 | 2 | 3),
                    )
                  }
                >
                  <option value="auto">
                    {previewDoc?.layout
                      ? `Auto (${previewDoc.layout.autoPages} ${previewDoc.layout.autoPages === 1 ? "página" : "páginas"})`
                      : "Auto"}
                  </option>
                  <option value="1">1 página</option>
                  <option value="2">2 páginas</option>
                  <option value="3">3 páginas</option>
                </Select>
                {previewDoc?.layout && (
                  <span
                    className={`text-xs font-semibold tabular-nums whitespace-nowrap ${
                      previewDoc.layout.fontPt < MIN_TITLE_FONT_PT
                        ? "text-[var(--alert)]"
                        : "text-[var(--ink-2)]"
                    }`}
                    title="Letra del título resultante en la hoja impresa"
                  >
                    {previewDoc.layout.fontPt} pt
                    {previewDoc.layout.fontPt < MIN_TITLE_FONT_PT && " · letra pequeña"}
                  </span>
                )}
                {previewDoc?.layout?.alt &&
                  previewDoc.layout.alt.fontPt >= previewDoc.layout.fontPt + 3 &&
                  previewDoc.layout.alt.pages <= previewDoc.layout.pages && (
                    <Button
                      variant="soft"
                      size="xs"
                      onClick={() => setColumnsChoice(previewDoc.layout!.alt!.cols)}
                      title="Cambia el número de columnas para que la letra salga más grande en las mismas hojas"
                    >
                      Con {previewDoc.layout.alt.cols} {previewDoc.layout.alt.cols === 1 ? "columna" : "columnas"}:{" "}
                      {previewDoc.layout.alt.fontPt} pt
                    </Button>
                  )}
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
                  className="px-2.5 py-1 rounded text-xs font-bold bg-[var(--acc)]/20 text-[var(--ink)]"
                  title="El tamaño y el número de hojas se calculan automáticamente para aprovechar mejor el espacio El motor decide cuántas hojas usar, la letra (de 17pt en adelante), dónde cortar sin dejar bloques colgando y reparte el espacio sobrante entre las filas."
                >
                  <ShowIcon inline emoji="⚡" />Automático
                </span>
              </div>

              {/* Handwritten Note Style */}
              <div className="flex items-center gap-2">
                <span className="text-[var(--ink-2)] font-bold flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5 text-[var(--ink-2)]" /> Letra
                  Manuscrita:
                </span>
                <Select
                  size="sm"
                  value={handwritingFont}
                  onChange={(e) => setHandwritingFont(e.target.value as any)}
                >
                  <option value="caveat">Rotulador fino (Caveat)</option>
                  <option value="permanent_marker">
                    Sharpie grueso (permanent marker)
                  </option>
                  <option value="courier">Máquina (Courier)</option>
                  <option value="sans">Imprenta limpia (Sans)</option>
                </Select>

                {/* Ink color selector */}
                <div className="flex items-center gap-1 bg-[var(--surface)] p-1 rounded-[var(--r-s)]">
                  <button
                    onClick={() => setHandwritingColor("blue")}
                    className={`w-5 h-5 rounded-[var(--r-pill)] bg-[var(--tentative)] transition-transform cursor-pointer ${
                      handwritingColor === "blue"
                        ? "ring-2 ring-white scale-110"
                        : "opacity-60 hover:opacity-100"
                    }`}
                    title="Tinta azul rotulador"
                  />
                  <button
                    onClick={() => setHandwritingColor("black")}
                    className={`w-5 h-5 rounded-[var(--r-pill)] bg-[var(--sunken)] transition-transform cursor-pointer ${
                      handwritingColor === "black"
                        ? "ring-2 ring-white scale-110"
                        : "opacity-60 hover:opacity-100"
                    }`}
                    title="Tinta negra sharpie"
                  />
                  <button
                    onClick={() => setHandwritingColor("red")}
                    className={`w-5 h-5 rounded-[var(--r-pill)] bg-[var(--alert)] transition-transform cursor-pointer ${
                      handwritingColor === "red"
                        ? "ring-2 ring-white scale-110"
                        : "opacity-60 hover:opacity-100"
                    }`}
                    title="Tinta roja marcador"
                  />
                  <button
                    onClick={() => setHandwritingColor("purple")}
                    className={`w-5 h-5 rounded-[var(--r-pill)] bg-[var(--acc)] transition-transform cursor-pointer ${
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
                  <span>Logo grupo</span>
                </label>

                <label className="flex items-center gap-1.5 text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showWatermark}
                    onChange={(e) => setShowWatermark(e.target.checked)}
                    className="rounded accent-[var(--ok)] cursor-pointer"
                  />
                  <span>Marca de agua</span>
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
                    checked={showGeneralNotes}
                    onChange={(e) => setShowGeneralNotes(e.target.checked)}
                    className="rounded accent-[var(--ok)] cursor-pointer"
                  />
                  <span>Notas generales</span>
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
                {(showTonality || showBpm) && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1 p-0.5 rounded-[var(--r-m)] bg-[var(--surface)]">
                      <Button
                        variant={badgesScope === "all" ? "neutral" : "ghost"}
                        size="xs"
                        onClick={() => setBadgesScope("all")}
                      >
                        En todos los temas
                      </Button>
                      <Button
                        variant={badgesScope === "marked" ? "neutral" : "ghost"}
                        size="xs"
                        onClick={() => {
                          setBadgesScope("marked");
                          setShowMarksPanel(true);
                        }}
                      >
                        Solo marcados
                      </Button>
                    </div>
                    {badgesScope === "marked" && (
                      <Button variant="ghost" size="xs" onClick={() => setShowMarksPanel((v) => !v)}>
                        {showMarksPanel ? "Ocultar temas" : "Elegir temas"} ({markedCountForMember()})
                      </Button>
                    )}
                  </div>
                )}
                {saveFailed && (
                  <span className="text-xs text-[var(--alert)]" role="status">
                    No se pudieron guardar estos ajustes para la banda.
                  </span>
                )}
              </div>
            </div>
          </div>


          {(showTonality || showBpm) && badgesScope === "marked" && showMarksPanel && (
            <div className="px-3 sm:px-6 py-2 shrink-0 text-xs font-sans border-t border-[var(--line)]">
              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <span className="font-bold text-[var(--ink-2)]">
                  Tono/BPM visibles para {currentPreviewMember.name}:
                </span>
                <span className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setAllMarks(true)}
                  >
                    Todos
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setAllMarks(false)}
                  >
                    Ninguno
                  </Button>
                </span>
              </div>
              <div className="max-h-28 overflow-y-auto sm:columns-2 gap-x-4 [&>label]:break-inside-avoid [&>label]:py-0.5">
                {activeSetlist.items
                  .filter((it) => it.tipoItem === "cancion" && it.songId)
                  .map((it, i) => {
                    const song = songs.find((x) => x.id === it.songId);
                    if (!song) return null;
                    const marked = isMarked(song);
                    return (
                      <label
                        key={`${song.id}-${i}`}
                        className="flex items-center gap-1.5 text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer select-none min-w-0"
                      >
                        <input
                          type="checkbox"
                          checked={marked}
                          onChange={(e) => setMark(song, e.target.checked)}
                          className="rounded accent-[var(--ok)] cursor-pointer"
                        />
                        <span className="truncate">
                          {song.titulo}
                          {(song.tonalidad || song.bpm) && (
                            <span className="text-[var(--ink-3)]">
                              {" "}
                              · {[song.tonalidad, song.bpm ? `${song.bpm} BPM` : ""].filter(Boolean).join(" ")}
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
              </div>
            </div>
          )}
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
                <span className="px-2.5 sm:px-3 py-0.5 rounded-[var(--r-pill)] bg-[var(--ok)]/20 text-[var(--ink)] font-bold flex items-center gap-1.5 min-w-0 truncate">
                  <span className="truncate">
                    <ShowIcon inline emoji="👤" />{currentPreviewMember.name}
                  </span>
                  <span className="hidden sm:inline text-[var(--ink-2)] text-micro shrink-0">
                    ({currentPreviewMember.instrument})
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  disabled={previewPageIndex <= 0}
                  onClick={() => setPreviewPageIndex((p) => Math.max(0, p - 1))}
                  className="p-1.5 sm:p-1 sm:px-3 rounded-[var(--r-pill)] bg-[var(--ink)]/10 hover:bg-[var(--ink)]/20 disabled:opacity-30 disabled:cursor-not-allowed font-bold flex items-center gap-1 cursor-pointer transition-colors"
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
                  className="p-1.5 sm:p-1 sm:px-3 rounded-[var(--r-pill)] bg-[var(--ink)]/10 hover:bg-[var(--ink)]/20 disabled:opacity-30 disabled:cursor-not-allowed font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span className="hidden sm:inline">Siguiente</span>{" "}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Vista previa: las hojas reales que se imprimirán (clic en un tema = editar su nota). */}
          <div
            ref={previewBoxRef}
            className="relative sm:flex-1 sm:overflow-y-auto p-3 sm:p-6 flex justify-center bg-[var(--sunken)]"
          >
            {previewDoc ? (
              <div
                className="shrink-0"
                style={{
                  width: mmToPx(210) * previewScale,
                  height: previewHeightPx * previewScale,
                }}
              >
                <iframe
                  ref={previewFrameRef}
                  title="Vista previa del setlist impreso"
                  sandbox="allow-scripts"
                  srcDoc={previewDoc.html}
                  style={{
                    width: mmToPx(210),
                    height: previewHeightPx,
                    border: 0,
                    transform: `scale(${previewScale})`,
                    transformOrigin: "top left",
                    opacity: previewLoading ? 0.55 : 1,
                    transition: "opacity 150ms",
                  }}
                />
              </div>
            ) : (
              <p className="m-auto text-sm text-[var(--ink-2)]">Maquetando el setlist…</p>
            )}
            {previewLoading && previewDoc && (
              <span className="absolute top-3 right-4 rounded-[var(--r-pill)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--ink-2)]">
                Actualizando…
              </span>
            )}
          </div>
        </div>

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
