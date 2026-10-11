/**
 * Elementos del repertorio, posición actual y navegación entre ellos.
 * Extraído de SetlistPerformanceView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useMemo } from "react";
import { useNavegacionItems } from "../../../hooks/useNavegacionItems";
import { Setlist,Song } from "../../../types";
import { hasIrisStems,ideaDeStemsDeCancion } from "../../../utils/irisTracks";
import { getBlockMeta } from "../performanceModel";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface SetlistNavigationParams {
  setlist: Setlist;
  songs: Song[];
}

/**
 * Elementos del repertorio, posición actual y navegación entre ellos.
 * @param params Estado y callbacks del contenedor ({@link SetlistNavigationParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useSetlistNavigation({ setlist, songs }: SetlistNavigationParams) {
  // Incluye TANTO canciones como bloques (presentación, cambio de instrumento, descanso...) en
  // su orden real del repertorio — antes el modo concierto solo conocía canciones, así que un
  // bloque entre dos temas desaparecía sin más en vez de mostrarse como guion en pantalla.
  const allItems = useMemo(
    () =>
      setlist.items.filter(
        (item) =>
          (item.tipoItem === "cancion" && item.songId) ||
          item.tipoItem === "bloque",
      ),
    [setlist.items],
  );

  const {
    indice: currentIndex,
    irA: setCurrentIndex,
    anterior: handlePrev,
    siguiente: handleNext,
    esPrimero: isFirst,
    esUltimo: isLast,
  } = useNavegacionItems(allItems.length);

  const currentItem = allItems[currentIndex];

  const isBlock = currentItem?.tipoItem === "bloque";

  const currentSong = !isBlock
    ? songs.find((s) => s.id === currentItem?.songId)
    : undefined;

  const nextItem = allItems[currentIndex + 1];

  const songsInSetlistCount = useMemo(() => {
    return allItems.filter((i) => i.tipoItem === "cancion" && i.songId).length;
  }, [allItems]);

  const songsWithIrisCount = useMemo(() => {
    return allItems.filter((item) => {
      if (item.tipoItem !== "cancion" || !item.songId) return false;
      const s = songs.find((x) => x.id === item.songId);
      return s ? hasIrisStems(s) : false;
    }).length;
  }, [allItems, songs]);

  const irisStemIdea = useMemo(() => {
    return ideaDeStemsDeCancion(currentSong);
  }, [currentSong]);

  const blockMeta = isBlock && currentItem ? getBlockMeta(currentItem) : null;

  return { currentSong, currentItem, isBlock, handleNext, handlePrev, allItems, currentIndex, blockMeta, songsWithIrisCount, irisStemIdea, isFirst, isLast, setCurrentIndex, nextItem, songsInSetlistCount };
}
