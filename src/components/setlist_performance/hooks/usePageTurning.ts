import type { SetlistItem } from "../../../types";
import type { ChordSection } from "../../../utils/chordUtils";
/**
 * Pasar página: teclado y pedal, gestos de swipe y avance por secciones.
 * Extraído de SetlistPerformanceView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React,{ Dispatch,SetStateAction,useEffect,useRef } from "react";
import { accionDeTecla,direccionDeSwipe } from "../../../utils/pasarPagina";
import { SWIPE_THRESHOLD } from "../performanceModel";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface PageTurningParams {
  isBlock: boolean;
  showScannedSheet: boolean;
  hasMultipleSections: boolean;
  currentSectionIndex: number;
  chordSections: ChordSection[];
  setCurrentSectionIndex: Dispatch<SetStateAction<number>>;
  handleNext: () => void;
  handlePrev: () => void;
  teleprompterMode: "sections" | "scroll";
  setIsTeleprompterPlaying: Dispatch<SetStateAction<boolean>>;
  onClose: () => void;
  toggleFullscreen: () => void;
  allItems: SetlistItem[];
}

/**
 * Pasar página: teclado y pedal, gestos de swipe y avance por secciones.
 * @param params Estado y callbacks del contenedor ({@link PageTurningParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function usePageTurning({ isBlock, showScannedSheet, hasMultipleSections, currentSectionIndex, chordSections, setCurrentSectionIndex, handleNext, handlePrev, teleprompterMode, setIsTeleprompterPlaying, onClose, toggleFullscreen, allItems }: PageTurningParams) {
  const touchStartX = useRef<number | null>(null);

  // Avanzar/retroceder de SECCIÓN dentro del tema (Intro→Verso→Estribillo...) cuando la hay;
  // al llegar al final o al principio, pasa de canción — así el pedal/tecla de"pasar página"
  // funciona igual de natural para moverse dentro de un tema largo que para cambiar de tema.
  const handleAdvance = () => {
    if (
      !isBlock &&
      !showScannedSheet &&
      hasMultipleSections &&
      currentSectionIndex < chordSections.length - 1
    ) {
      setCurrentSectionIndex((i) => i + 1);
    } else {
      handleNext();
    }
  };

  const handleRetreat = () => {
    if (
      !isBlock &&
      !showScannedSheet &&
      hasMultipleSections &&
      currentSectionIndex > 0
    ) {
      setCurrentSectionIndex((i) => i - 1);
    } else {
      handlePrev();
    }
  };

  // Keyboard shortcuts — incluye Space/PageUp/PageDown porque los pedales bluetooth de pasar
  // partituras (los que usan orquestas de verdad con iPad) emulan esas teclas, no solo flechas.
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const accion = accionDeTecla(e.key);
      if (accion === "atras") {
        e.preventDefault();
        handleRetreat();
      }
      if (accion === "adelante") {
        e.preventDefault();
        handleAdvance();
      }
      if (accion === "espacio") {
        e.preventDefault();
        if (teleprompterMode === "scroll") {
          setIsTeleprompterPlaying((p) => !p);
        } else {
          handleAdvance();
        }
      }
      if (e.key === "Escape") onClose();
      if (e.key === "f" || e.key === "F") toggleFullscreen();
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    allItems.length,
    toggleFullscreen,
    currentSectionIndex,
    hasMultipleSections,
    isBlock,
    showScannedSheet,
    teleprompterMode,
  ]);

  // Swipe táctil estilo"pasar página" (iBooks / forScore): un swipe horizontal claro pasa de
  // canción; un gesto vertical o corto se deja pasar para no robarle el scroll al documento.
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    const dir = direccionDeSwipe(deltaX, 0, SWIPE_THRESHOLD);
    if (dir === "anterior") handlePrev();
    else if (dir === "siguiente") handleNext();
  };

  return { handleTouchStart, handleTouchEnd, handleAdvance, handleRetreat };
}
