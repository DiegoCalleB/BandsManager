import type { SetlistItem } from "../../../types";
/**
 * Cifrado del tema: transposición, vista de acordes o escaneado y secciones.
 * Extraído de SetlistPerformanceView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";
import { Song } from "../../../types";
import { getSemitoneDifference,processChordText,splitIntoChordSections,transposeChordToken } from "../../../utils/chordUtils";
import { isImageDocument,isPdfDocument } from "../../../utils/documentType";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface ChordSheetParams {
  currentItem: SetlistItem;
  currentSong: Song;
}

/**
 * Cifrado del tema: transposición, vista de acordes o escaneado y secciones.
 * @param params Estado y callbacks del contenedor ({@link ChordSheetParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useChordSheet({ currentItem, currentSong }: ChordSheetParams) {
  // Notación (ES/EN) a mantener al mostrar/transportar un tono — se detecta de la propia
  // tonalidad guardada de la canción, para no forzar"Re" a salir como"D" o viceversa.
  const detectNotation = (key: string): "ES" | "EN" =>
    /^(Do|Re|Mi|Fa|Sol|La|Si)/i.test(key.trim()) ? "ES" : "EN";

  const transposeKey = (key: string, semitones: number): string => {
    if (!key || semitones === 0) return key;
    return transposeChordToken(key, semitones, detectNotation(key));
  };

  // El tono en el que se toca este tema en ESTE repertorio se define en la fila del setlist
  // (RepertorioSetlists), no aquí: cambiar de tono a media canción en directo, con el móvil en
  // la mano y cantando, es justo lo que NO se quiere. El Modo Concierto solo APLICA lo ya
  // decidido de antemano — se calcula de forma derivada a partir de tonalidadDeseada.
  const effectiveTranspose =
    currentItem?.tonalidadDeseada && currentSong
      ? (getSemitoneDifference(
          currentSong.tonalidad,
          currentItem.tonalidadDeseada,
        ) ?? 0)
      : 0;

  // Transposición en tiempo real en escenario (Live Pitch Shift)
  const [liveTransposeOffset, setLiveTransposeOffset] = useState<number>(0);

  // Los acordes en texto son la vista principal: se pueden transportar, agrandar y hacer
  // autoscroll, cosas que una foto/PDF escaneado no permite. El documento original queda como
  // consulta opcional (para comparar contra lo que la IA extrajo) mediante el botón de
  // alternar vista, nunca como vista por defecto. Se calcula de forma puramente derivada (sin
  // useState+useEffect de sincronización) para que no pueda haber un"flash" mostrando el
  // documento antes de que un efecto corrija la vista al valor correcto.
  const hasChordsText = Boolean(currentSong?.cifradoTexto?.trim());

  const hasScannedSheet = Boolean(
    currentSong?.estructuraDocumentoUrl &&
    (isImageDocument(
      currentSong.estructuraDocumentoNombre,
      currentSong.estructuraDocumentoUrl,
    ) ||
      isPdfDocument(
        currentSong.estructuraDocumentoNombre,
        currentSong.estructuraDocumentoUrl,
      )),
  );

  const [manualViewOverride, setManualViewOverride] = useState<
    "chords" | "sheet" | null
  >(null);

  const effectiveViewMode: "chords" | "sheet" =
    manualViewOverride ?? (hasChordsText ? "chords" : "sheet");

  const showScannedSheet = effectiveViewMode === "sheet" && hasScannedSheet;

  // El autoscroll a velocidad fija se desincroniza en cuanto la banda alarga un solo o repite
  // un estribillo — para cuando te das cuenta, la letra ya bajó sola de más. En su lugar, la
  // canción se divide en secciones ([Intro]/[Verso]/[Estribillo]...) y el propio músico avanza
  // de una a otra tocando, con control total y sin depender de ningún temporizador.
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  const totalTranspose = effectiveTranspose + liveTransposeOffset;

  // Transpone los acordes DE VERDAD (las letras Do/Re/Mi... dentro del texto), no solo la
  // etiqueta de tonalidad, aplicando la suma de la tonalidad fijada y el ajuste en vivo.
  const chords = currentSong?.cifradoTexto
    ? processChordText(
        currentSong.cifradoTexto,
        totalTranspose,
        detectNotation(currentSong.tonalidad || "C"),
      )
    : "Sin acordes guardados";

  const chordSections = hasChordsText ? splitIntoChordSections(chords) : [];

  const hasMultipleSections = chordSections.length >= 2;

  const notes = [currentSong?.notasInternas, currentSong?.notasRepertorio]
    .filter(Boolean)
    .join("\n\n");

  const transposedKey = currentSong
    ? transposeKey(currentSong.tonalidad, totalTranspose)
    : "";

  const structure = currentSong?.guiaSustituto?.estructura || "";

  const progression = currentSong?.guiaSustituto?.progresionClave || "";

  return { showScannedSheet, hasMultipleSections, currentSectionIndex, chordSections, setCurrentSectionIndex, setManualViewOverride, setLiveTransposeOffset, notes, hasChordsText, hasScannedSheet, effectiveViewMode, chords, structure, progression, transposedKey, effectiveTranspose, liveTransposeOffset };
}
