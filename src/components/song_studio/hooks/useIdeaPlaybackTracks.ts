/**
 * Pistas que suenan de una idea: las propias más las pistas base virtuales de la canción
 * Extraído de SongStudioModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any,
 react-hooks/set-state-in-effect,
 react-hooks/exhaustive-deps,
 react-hooks/purity,
 react-hooks/immutability
*/
import { SongAudioIdea, AudioTrack, Song } from "../../../types";
import { pistasBaseMezcladas } from "../../../utils/ideaDeAtril";
import { pistasDeCancion } from "../../../utils/irisTracks";
import { getIdeaTracks } from "../ideaTracks";
import { RefObject } from "react";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface IdeaPlaybackTracksParams {
  songRef: RefObject<Song>;
  song: Song;
}

/**
 * Pistas que suenan de una idea: las propias más las pistas base virtuales de la canción
 * @param params Estado y callbacks del contenedor ({@link IdeaPlaybackTracksParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useIdeaPlaybackTracks({ songRef, song }: IdeaPlaybackTracksParams) {
  // Pistas de Iris elegidas como base de la idea (por referencia, no copiadas): se oyen con el
  // transporte de la idea pero NO entran en getIdeaTracks, así las escrituras del mezclador
  // nunca las copian a la idea. id propio para no chocar con el refs de la hoja de Iris.
  const pistasBaseVirtuales = (idea: SongAudioIdea): AudioTrack[] => {
    const cancion = songRef.current || song;
    const ideaFresca = (cancion.audioIdeas || []).find((i) => i.id === idea.id) || idea;
    return pistasBaseMezcladas(ideaFresca, pistasDeCancion(cancion));
  };
  const pistasDeReproduccion = (idea: SongAudioIdea): AudioTrack[] => [
    ...getIdeaTracks(idea),
    ...pistasBaseVirtuales(idea),
  ];

  return { pistasDeReproduccion, pistasBaseVirtuales };
}
