/**
 * Agrupa los hooks de compartir, filtros de catálogo, reproductor persistente y reproductor de concierto del módulo Repertorio.
 * Extraído de RepertorioSetlists.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars
*/
import { usePlayer } from "../../../context/PlayerContext";
import { useAudioPlayer } from "../../../hooks/useAudioPlayer";
import { useCatalogFilters } from "../../../hooks/useCatalogFilters";
import { useShareModal } from "../../../hooks/useShareModal";
import { useStagePlayer } from "../../../hooks/useStagePlayer";
import { Setlist,Song } from "../../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface RepertorioPlayersParams {
  songs: Song[];
  bName: string;
  activeSetlist: Setlist;
}

/**
 * Agrupa los hooks de compartir, filtros de catálogo, reproductor persistente y reproductor de concierto del módulo Repertorio.
 * @param params Estado y callbacks del contenedor ({@link RepertorioPlayersParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useRepertorioPlayers({ songs, bName, activeSetlist }: RepertorioPlayersParams) {
  const {
    shareModalData,
    setShareModalData,
    handleShareSetlist,
    handleShareSong,
  } = useShareModal(songs, bName);

  // Filter States for Catalog
  const {
    groupByAlbum,
    setGroupByAlbum,
    catalogSearch,
    setCatalogSearch,
    catalogAlbumFilter,
    setCatalogAlbumFilter,
    catalogStatusFilter,
    setCatalogStatusFilter,
    albumsList,
    filteredSongs,
  } = useCatalogFilters(songs);

  // Helper to parse"mm:ss" to seconds
  const parseMmSsToSeconds = (timeStr: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.trim().split(":");
    if (parts.length === 2) {
      const min = parseInt(parts[0], 10) || 0;
      const sec = parseInt(parts[1], 10) || 0;
      return min * 60 + sec;
    }
    const minOnly = parseInt(timeStr, 10) || 0;
    return minOnly * 60;
  };

  const {
    activePlayerSong,
    setActivePlayerSong,
    playerAutoPlay,
    playSignal,
    isPlayerPlaying,
    setIsPlayerPlaying,
    playerTransposeSemitones,
    handleSelectPlayerSong,
  } = useAudioPlayer();

  // Global player context for persistent playback across modules
  const {
    currentSong: playerCurrentSong,
    setCurrentSong,
    setSongs: setPlayerSongs,
    setIsPlaying: setPlayerIsPlaying,
  } = usePlayer();

  // Concert Player (Reproductor de Concierto / Modo Escenario)
  const {
    stageAudioRef,
    stageAudioRefB,
    stagePlayingIndex,
    setStagePlayingIndex,
    stageIsPlaying,
    setStageIsPlaying,
    stageAutoplayNext,
    setStageAutoplayNext,
    stageCurrentTime,
    setStageCurrentTime,
    stageItemDuration,
    stageResolvedUrl,
    stageCrossfadeEnabled,
    setStageCrossfadeEnabled,
    isCrossfading,
    handleStageAudioEnded,
    handleStageTimeUpdate,
    handleStageSeek,
    handleStagePrev,
    handleStageNext,
    toggleStagePlayPause,
  } = useStagePlayer(activeSetlist, songs, parseMmSsToSeconds);

  return { handleSelectPlayerSong, setCurrentSong, setPlayerSongs, setPlayerIsPlaying, setIsPlayerPlaying, activePlayerSong, setActivePlayerSong, albumsList, handleShareSetlist, playerCurrentSong, isPlayerPlaying, handleShareSong, filteredSongs, catalogAlbumFilter, setCatalogAlbumFilter, catalogStatusFilter, setCatalogStatusFilter, catalogSearch, groupByAlbum, setGroupByAlbum, shareModalData, setShareModalData };
}
