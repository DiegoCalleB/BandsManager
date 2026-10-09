/**
 * Vista derivada de las ideas de la canción: filtradas por sección, tomas, ideas de Iris y fuente de stems
 * Extraído de SongStudioModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Song, SongAudioIdea } from "../../../types";
import { esIdeaIris, ideaDeStemsDeCancion, irisPrimero, metaStemsDeCancion } from "../../../utils/irisTracks";
import { getSongMainAudioUrl } from "../songAudioSource";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface StudioIdeasViewParams {
  song: Song;
  activeSectionFilter: string;
  currentUsername: string;
}

/**
 * Vista derivada de las ideas de la canción: filtradas por sección, tomas, ideas de Iris y fuente de stems
 * @param params Estado y callbacks del contenedor ({@link StudioIdeasViewParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useStudioIdeasView({ song, activeSectionFilter, currentUsername }: StudioIdeasViewParams) {
  const ideasList = song.audioIdeas || [];

  const filteredIdeas = irisPrimero(
    activeSectionFilter === 'todas' ? ideasList : ideasList.filter((i) => i.seccion === activeSectionFilter)
  );
  const tomas = filteredIdeas.filter((i) => !esIdeaIris(i));
  const metaStems = metaStemsDeCancion(song);
  const irisIdea = ideaDeStemsDeCancion(song);
  // Audio de partida para separar: la primera toma con audio, o el audio principal de la canción
  const fuenteIris: SongAudioIdea | null =
    ideasList.find((i) => i.audioUrl) ??
    (getSongMainAudioUrl(song)
      ? {
          id: `idea-main-${song.id}`,
          titulo: `Maqueta Principal (${song.titulo})`,
          audioUrl: getSongMainAudioUrl(song),
          subidoPor: currentUsername || 'Banda',
          seccion: 'general',
          fecha: new Date().toLocaleDateString('es-ES'),
        }
      : null);

  return { ideasList, metaStems, irisIdea, fuenteIris, tomas };
}
