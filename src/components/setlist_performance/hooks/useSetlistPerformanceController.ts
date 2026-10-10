/**
 * Controlador del visor de repertorio en directo: compone los hooks por subdominio
 * (interfaz, dispositivo, navegación, práctica, cifrado, teleprompter y pasar página).
 * Extraído de SetlistPerformanceView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useEffect } from "react";
import { useWakeLock } from "../../../hooks/useWakeLock";
import { cacheActiveStageSetlist } from "../../../utils/stageOfflineCache";
import type { SetlistPerformanceViewProps } from "../../SetlistPerformanceView";
import { useChordSheet } from "./useChordSheet";
import { useDeviceStatus } from "./useDeviceStatus";
import { usePageTurning } from "./usePageTurning";
import { usePerformanceChrome } from "./usePerformanceChrome";
import { usePracticeLaunch } from "./usePracticeLaunch";
import { useSetlistNavigation } from "./useSetlistNavigation";
import { useTeleprompter } from "./useTeleprompter";

/**
 * Estado y acciones del visor de repertorio en directo.
 * @param params Props del visor con sus valores por defecto ya aplicados.
 * @returns Todo lo que consumen las vistas.
 */
export function useSetlistPerformanceController({
  setlist,
  songs,
  onClose,
  onOpenStudioModal,
  onOpenPracticeMode,
  currentUser,
  initialMode,
}: Pick<
  SetlistPerformanceViewProps,
  "setlist" | "songs" | "onClose" | "onOpenStudioModal" | "onOpenPracticeMode" | "currentUser"
> & { initialMode: NonNullable<SetlistPerformanceViewProps["initialMode"]> }) {
  const { toggleFullscreen, setShowDetails, setIsResting, setShowMoreMenu, setShowFlightModeInfo, isResting, containerRef, glareMode, setModeArchetype, modeArchetype, setShowSongListDrawer, showMoreMenu, setGlareMode, setShowNotes, showNotes, setFontSizeIdx, isFullscreen, showFlightModeInfo, fontSizeIdx, showDetails, showSongListDrawer } = usePerformanceChrome({ initialMode });

  const { isOffline, batteryLevel, batteryCharging } = useDeviceStatus();

  const { currentSong, currentItem, isBlock, handleNext, handlePrev, allItems, currentIndex, blockMeta, songsWithIrisCount, irisStemIdea, isFirst, isLast, setCurrentIndex, nextItem, songsInSetlistCount } = useSetlistNavigation({ setlist, songs });

  const { handleLaunchPractice, handleLaunchStudio, internalPracticeIdea, internalPracticeSong, setInternalPracticeIdea, setInternalPracticeSong } = usePracticeLaunch({ currentSong, onOpenPracticeMode, onOpenStudioModal });

  const { showScannedSheet, hasMultipleSections, currentSectionIndex, chordSections, setCurrentSectionIndex, setManualViewOverride, setLiveTransposeOffset, notes, hasChordsText, hasScannedSheet, effectiveViewMode, chords, structure, progression, transposedKey, effectiveTranspose, liveTransposeOffset } = useChordSheet({ currentItem, currentSong });

  const { teleprompterMode, setIsTeleprompterPlaying, setTeleprompterMode, isTeleprompterPlaying, teleprompterSpeed, setTeleprompterSpeed, teleprompterScrollRef } = useTeleprompter();

  const { handleTouchStart, handleTouchEnd, handleAdvance, handleRetreat } = usePageTurning({ isBlock, showScannedSheet, hasMultipleSections, currentSectionIndex, chordSections, setCurrentSectionIndex, handleNext, handlePrev, teleprompterMode, setIsTeleprompterPlaying, onClose, toggleFullscreen, allItems });

  // Modo Escenario Offline Guard: almacena en caché local letras, cifrados y metadatos
  // para que el concierto siga funcionando al 100% si se corta la conexión o el wifi en la sala.
  useEffect(() => {
    if (setlist && songs && songs.length > 0) {
      cacheActiveStageSetlist(setlist, songs, currentUser?.band_id);
    }
  }, [setlist, songs, currentUser?.band_id]);

  // Cada cambio de tema reinicia el estado transitorio del visor (decidido por tema, no "para siempre").

  useEffect(() => {

    setShowDetails(false);
    setManualViewOverride(null);
    setCurrentSectionIndex(0);
    setLiveTransposeOffset(0);
    setIsTeleprompterPlaying(false);
    // El Modo Descanso es por tema, no"para siempre": si se quedara activo al cambiar de
    // canción, el riesgo es llegar a un tema que sí necesitas ver sin pantalla porque se te
    // olvidó reactivarla.
    setIsResting(false);
    setShowMoreMenu(false);
    setShowFlightModeInfo(false);
    // Los setters de useState son estables: solo el cambio de tema reinicia el estado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  // WAKE LOCK: lo más importante para un músico en directo — que la pantalla NO se apague a media
  // canción. Se libera en Modo Descanso (isResting), la única vez que SÍ queremos que se apague.
  useWakeLock(!isResting);

  return { toggleFullscreen, setShowDetails, setIsResting, setShowMoreMenu, setShowFlightModeInfo, isResting, containerRef, glareMode, setModeArchetype, modeArchetype, setShowSongListDrawer, showMoreMenu, setGlareMode, setShowNotes, showNotes, setFontSizeIdx, isFullscreen, showFlightModeInfo, fontSizeIdx, showDetails, showSongListDrawer, isOffline, batteryLevel, batteryCharging, currentSong, currentItem, isBlock, handleNext, handlePrev, allItems, currentIndex, blockMeta, songsWithIrisCount, irisStemIdea, isFirst, isLast, setCurrentIndex, nextItem, songsInSetlistCount, handleLaunchPractice, handleLaunchStudio, internalPracticeIdea, internalPracticeSong, setInternalPracticeIdea, setInternalPracticeSong, showScannedSheet, hasMultipleSections, currentSectionIndex, chordSections, setCurrentSectionIndex, setManualViewOverride, setLiveTransposeOffset, notes, hasChordsText, hasScannedSheet, effectiveViewMode, chords, structure, progression, transposedKey, effectiveTranspose, liveTransposeOffset, teleprompterMode, setIsTeleprompterPlaying, setTeleprompterMode, isTeleprompterPlaying, teleprompterSpeed, setTeleprompterSpeed, teleprompterScrollRef, handleTouchStart, handleTouchEnd, handleAdvance, handleRetreat };
}
